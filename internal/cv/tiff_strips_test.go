package cv

import (
	"encoding/binary"
	"strings"
	"testing"
)

func TestDecodeTIFFRejectsExcessStripCount(t *testing.T) {
	// A 32-row image with 16 rows per strip needs two strips, not three.
	data := make([]byte, 149)
	copy(data[:4], []byte{'I', 'I', '*', 0})
	binary.LittleEndian.PutUint32(data[4:8], 8)
	type entry struct {
		tag, typ uint16
		count    uint32
		value    uint32
	}
	entries := []entry{
		{256, 4, 1, 32},  // width
		{257, 4, 1, 32},  // height
		{258, 3, 1, 8},   // bits per sample
		{259, 3, 1, 1},   // compression
		{262, 3, 1, 1},   // photometric
		{273, 4, 3, 122}, // strip offsets array
		{277, 3, 1, 1},   // samples per pixel
		{278, 4, 1, 16},  // rows per strip
		{279, 4, 3, 134}, // strip byte counts array
	}
	binary.LittleEndian.PutUint16(data[8:10], uint16(len(entries)))
	for i, e := range entries {
		off := 10 + i*12
		binary.LittleEndian.PutUint16(data[off:off+2], e.tag)
		binary.LittleEndian.PutUint16(data[off+2:off+4], e.typ)
		binary.LittleEndian.PutUint32(data[off+4:off+8], e.count)
		if e.typ == 3 && e.count == 1 {
			binary.LittleEndian.PutUint16(data[off+8:off+10], uint16(e.value))
		} else {
			binary.LittleEndian.PutUint32(data[off+8:off+12], e.value)
		}
	}
	for i, off := range []uint32{146, 147, 148} {
		binary.LittleEndian.PutUint32(data[122+i*4:126+i*4], off)
		binary.LittleEndian.PutUint32(data[134+i*4:138+i*4], 1)
		data[off] = byte(i)
	}

	_, _, err := Decode(data)
	if err == nil || !strings.Contains(err.Error(), "strip count") {
		t.Fatalf("Decode error = %v, want strip-count rejection", err)
	}
}
