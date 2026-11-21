package cv

import "testing"

func TestLimitSizeCapsLongestDimensionAndReturnsScale(t *testing.T) {
	g := NewGray(800, 400)
	got, scale := LimitSize(g, 512)
	if got.W != 512 || got.H != 256 {
		t.Fatalf("limited dimensions = %dx%d, want 512x256", got.W, got.H)
	}
	if scale < 0.639 || scale > 0.641 {
		t.Fatalf("scale = %.4f, want 0.64", scale)
	}
}
