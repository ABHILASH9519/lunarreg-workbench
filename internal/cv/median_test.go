package cv

import "testing"

func TestMedian3RemovesIsolatedImpulseNoise(t *testing.T) {
	g := NewGray(5, 5)
	for i := range g.Pix {
		g.Pix[i] = 10
	}
	g.Pix[2*g.W+2] = 255
	got := Median3(g)
	if got.Pix[2*got.W+2] != 10 {
		t.Fatalf("median center = %v, want 10", got.Pix[2*got.W+2])
	}
}
