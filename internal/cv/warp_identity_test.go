package cv

import "testing"

func TestWarpIdentityPreservesEverySourcePixel(t *testing.T) {
	src := NewGray(32, 32)
	for i := range src.Pix {
		src.Pix[i] = float32(i % 256)
	}
	got, valid := Warp(src, Identity, src.W, src.H)
	for i := range src.Pix {
		if !valid[i] {
			t.Fatalf("identity warp marked pixel %d invalid", i)
		}
		if got.Pix[i] != src.Pix[i] {
			t.Fatalf("identity warp pixel %d = %v, want %v", i, got.Pix[i], src.Pix[i])
		}
	}
}
