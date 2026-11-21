package cv

import "testing"

func TestBilinearSamplingPreservesConstantImageAtEdges(t *testing.T) {
	g := NewGray(8, 8)
	for i := range g.Pix {
		g.Pix[i] = 42
	}
	for _, p := range [][2]float64{{0, 0}, {3.25, 4.75}, {-2, 3}, {9, 7}} {
		if got := g.Bilinear(p[0], p[1]); got != 42 {
			t.Fatalf("Bilinear(%v) = %v, want 42", p, got)
		}
	}
}
