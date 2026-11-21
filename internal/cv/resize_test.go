package cv

import "testing"

func TestResizePreservesConstantIntensity(t *testing.T) {
	g := NewGray(64, 64)
	for i := range g.Pix {
		g.Pix[i] = 87
	}
	got := Resize(g, 32, 48)
	if got.W != 32 || got.H != 48 {
		t.Fatalf("resized dimensions = %dx%d", got.W, got.H)
	}
	for i, v := range got.Pix {
		if v != 87 {
			t.Fatalf("pixel %d = %v, want 87", i, v)
		}
	}
}
