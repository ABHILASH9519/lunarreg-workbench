package cv

import "testing"

func TestCLAHEOutputRemainsWithinDisplayRange(t *testing.T) {
	g := NewGray(32, 32)
	for y := 0; y < g.H; y++ {
		for x := 0; x < g.W; x++ {
			g.Pix[y*g.W+x] = float32((x*7 + y*11) % 256)
		}
	}
	got := CLAHE(g, 8, 3)
	for i, v := range got.Pix {
		if v < 0 || v > 255 {
			t.Fatalf("CLAHE pixel %d = %v, outside [0,255]", i, v)
		}
	}
}
