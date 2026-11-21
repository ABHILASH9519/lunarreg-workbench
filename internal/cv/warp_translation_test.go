package cv

import "testing"

func TestWarpTranslationMarksOnlyOverlappingPixelsValid(t *testing.T) {
	src := NewGray(32, 24)
	h := Mat3{1, 0, 2, 0, 1, 0, 0, 0, 1}
	_, valid := Warp(src, h, 32, 24)
	count := 0
	for _, ok := range valid {
		if ok {
			count++
		}
	}
	want := 30 * 24
	if count != want {
		t.Fatalf("valid pixels = %d, want %d", count, want)
	}
}
