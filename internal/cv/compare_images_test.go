package cv

import "testing"

func TestCompareImagesRecognizesIdenticalOverlappingRasters(t *testing.T) {
	ref, reg := NewGray(32, 32), NewGray(32, 32)
	valid := make([]bool, 32*32)
	for i := range ref.Pix {
		ref.Pix[i] = float32(i % 251)
		reg.Pix[i] = ref.Pix[i]
		valid[i] = true
	}
	got := CompareImages(ref, reg, valid)
	if !got.Computed || got.ValidPixels != 1024 {
		t.Fatalf("image metrics = %+v", got)
	}
	if got.MeanAbsDiff != 0 || got.NCC < 0.999999 {
		t.Fatalf("identical image metrics: mean diff %.6f, NCC %.6f", got.MeanAbsDiff, got.NCC)
	}
}
