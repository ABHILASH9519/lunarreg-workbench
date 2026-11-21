package cv

import "testing"

func TestPyramidStopsBeforeImagesBecomeTooSmall(t *testing.T) {
	g := NewGray(160, 128)
	levels := Pyramid(g, 5)
	if len(levels) != 2 {
		t.Fatalf("pyramid levels = %d, want 2", len(levels))
	}
	if levels[1].W != 80 || levels[1].H != 64 {
		t.Fatalf("last level = %dx%d, want 80x64", levels[1].W, levels[1].H)
	}
}
