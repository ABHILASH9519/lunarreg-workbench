package cv

import "testing"

func TestRansacRejectsInsufficientCorrespondences(t *testing.T) {
	points := []Pt{
		{SX: 0, SY: 0, RX: 1, RY: 1},
		{SX: 10, SY: 0, RX: 11, RY: 1},
		{SX: 0, SY: 10, RX: 1, RY: 11},
	}
	got := Ransac(ModelAffine, points, RansacParams{Threshold: 2, MaxIter: 100, Seed: 7})
	if got.OK || got.Count != 0 {
		t.Fatalf("RANSAC result = ok:%v count:%d, want no consensus", got.OK, got.Count)
	}
}
