package cv

import (
	"encoding/binary"
	"strings"
	"testing"
)

func TestDecodeTIFFRejectsOversizedDecodedRaster(t *testing.T) {
	// Four 32-bit samples per pixel would require 1 GiB for this raster.
	tags := []struct {
		id    uint16
		value uint32
	}{
		{256, 8192}, // ImageWidth
		{257, 8192}, // ImageLength
		{258, 32},   // BitsPerSample
		{277, 4},    // SamplesPerPixel
		{273, 86},   // StripOffsets
		{279, 0},    // StripByteCounts
	}
	data := make([]byte, 86)
	copy(data[:4], []byte{'I', 'I', '*', 0})
	binary.LittleEndian.PutUint32(data[4:8], 8)
	binary.LittleEndian.PutUint16(data[8:10], uint16(len(tags)))
	for i, tag := range tags {
		off := 10 + i*12
		binary.LittleEndian.PutUint16(data[off:off+2], tag.id)
		binary.LittleEndian.PutUint16(data[off+2:off+4], 4) // LONG
		binary.LittleEndian.PutUint32(data[off+4:off+8], 1)
		binary.LittleEndian.PutUint32(data[off+8:off+12], tag.value)
	}

	_, _, err := Decode(data)
	if err == nil || !strings.Contains(err.Error(), "memory limit") {
		t.Fatalf("Decode error = %v, want decoded raster memory rejection", err)
	}
}
