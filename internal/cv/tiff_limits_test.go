package cv

import (
	"encoding/binary"
	"strings"
	"testing"
)

func TestDecodeTIFFRejectsHugeDimensionsBeforeAllocation(t *testing.T) {
	// Minimal little-endian TIFF with width and height set to UINT32_MAX.
	data := make([]byte, 38)
	copy(data[:4], []byte{'I', 'I', '*', 0})
	binary.LittleEndian.PutUint32(data[4:8], 8)
	binary.LittleEndian.PutUint16(data[8:10], 2)
	for i, tag := range []uint16{256, 257} {
		off := 10 + i*12
		binary.LittleEndian.PutUint16(data[off:off+2], tag)
		binary.LittleEndian.PutUint16(data[off+2:off+4], 4) // LONG
		binary.LittleEndian.PutUint32(data[off+4:off+8], 1)
		binary.LittleEndian.PutUint32(data[off+8:off+12], ^uint32(0))
	}

	_, _, err := Decode(data)
	if err == nil || !strings.Contains(err.Error(), "too large") {
		t.Fatalf("Decode error = %v, want oversized image rejection", err)
	}
}
