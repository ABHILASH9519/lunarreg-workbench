package cv

import (
	"testing"
)

func TestTooManyDecodedBytes(t *testing.T) {
	tests := []struct {
		name string
		w, h, bpp int
		want bool
	}{
		{name: "normal grayscale", w: 4096, h: 4096, bpp: 1, want: false},
		{name: "large multichannel raster", w: 8192, h: 8192, bpp: 16, want: true},
		{name: "invalid bytes per pixel", w: 32, h: 32, bpp: 0, want: true},
		{name: "overflowing dimensions", w: int(^uint(0) >> 1), h: 2, bpp: 4, want: true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tooManyDecodedBytes(tt.w, tt.h, tt.bpp); got != tt.want {
				t.Fatalf("tooManyDecodedBytes(%d, %d, %d) = %v, want %v", tt.w, tt.h, tt.bpp, got, tt.want)
			}
		})
	}
}

func TestTooManyPixelsRejectsInvalidAndOverflowingDimensions(t *testing.T) {
	tests := []struct {
		name string
		w, h int
		want bool
	}{
		{name: "zero width", w: 0, h: 100, want: true},
		{name: "negative height", w: 100, h: -1, want: true},
		{name: "within limit", w: 1024, h: 1024, want: false},
		{name: "over limit", w: MaxPixels + 1, h: 1, want: true},
		{name: "multiplication would overflow", w: int(^uint(0) >> 1), h: 2, want: true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tooManyPixels(tt.w, tt.h); got != tt.want {
				t.Fatalf("tooManyPixels(%d, %d) = %v, want %v", tt.w, tt.h, got, tt.want)
			}
		})
	}
}
