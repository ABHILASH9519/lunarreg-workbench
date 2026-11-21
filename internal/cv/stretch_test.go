package cv

import "testing"

func TestStretchPercentileMapsAndClampsOutliers(t *testing.T) {
	g := NewGray(100, 1)
	for i := range g.Pix {
		g.Pix[i] = float32(i)
	}
	StretchPercentile(g, 5, 95)
	if g.Pix[0] != 0 || g.Pix[len(g.Pix)-1] != 255 {
		t.Fatalf("stretched endpoints = %v, %v; want 0 and 255", g.Pix[0], g.Pix[len(g.Pix)-1])
	}
	for i, v := range g.Pix {
		if v < 0 || v > 255 {
			t.Fatalf("pixel %d out of range after stretch: %v", i, v)
		}
	}
}
