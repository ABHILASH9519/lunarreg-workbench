package cv

import (
	"math"
	"testing"
)

func transformedPoints(h Mat3) []Pt {
	var pts []Pt
	for y := 0; y < 4; y++ {
		for x := 0; x < 5; x++ {
			sx, sy := float64(x*37+11), float64(y*29+7)
			rx, ry, ok := h.Apply(sx, sy)
			if !ok {
				panic("test transform mapped a point to infinity")
			}
			pts = append(pts, Pt{SX: sx, SY: sy, RX: rx, RY: ry})
		}
	}
	return pts
}

func TestFitRecoversKnownTransforms(t *testing.T) {
	tests := []struct {
		name  string
		model string
		h     Mat3
	}{
		{
			name: "similarity", model: ModelSimilarity,
			h: Mat3{1.2, -0.3, 10, 0.3, 1.2, -5, 0, 0, 1},
		},
		{
			name: "affine", model: ModelAffine,
			h: Mat3{1.1, 0.2, 7, -0.1, 0.9, 4, 0, 0, 1},
		},
		{
			name: "homography", model: ModelHomography,
			h: Mat3{1, 0.02, 3, -0.01, 1, 8, 0.0001, -0.0002, 1},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Fit(tt.model, transformedPoints(tt.h))
			if err != nil {
				t.Fatal(err)
			}
			for _, p := range transformedPoints(tt.h) {
				x1, y1, ok1 := got.Apply(p.SX, p.SY)
				x2, y2, ok2 := tt.h.Apply(p.SX, p.SY)
				if !ok1 || !ok2 || math.Hypot(x1-x2, y1-y2) > 1e-6 {
					t.Fatalf("fitted transform mismatch at (%.2f, %.2f): got (%.6f, %.6f), want (%.6f, %.6f)", p.SX, p.SY, x1, y1, x2, y2)
				}
			}
		})
	}
}

func TestMatrixInverseAndSingularHandling(t *testing.T) {
	h := Mat3{1.2, 0.1, 8, -0.2, 0.9, 4, 0.0001, -0.0002, 1}
	inv, ok := h.Inv()
	if !ok {
		t.Fatal("expected invertible matrix")
	}
	product := h.Mul(inv)
	for i, want := range Identity {
		if math.Abs(product[i]-want) > 1e-9 {
			t.Fatalf("inverse product[%d] = %.12f, want %.12f", i, product[i], want)
		}
	}
	if _, ok := (Mat3{}).Inv(); ok {
		t.Fatal("zero matrix must be singular")
	}
}

func TestRansacRejectsOutliers(t *testing.T) {
	h := Mat3{1, -0.1, 5, 0.1, 1, -3, 0, 0, 1}
	pts := transformedPoints(h)
	for i := 0; i < 6; i++ {
		pts = append(pts, Pt{SX: float64(i * 17), SY: float64(i * 23), RX: float64(900 + i*31), RY: float64(-700 - i*19)})
	}
	res := Ransac(ModelSimilarity, pts, RansacParams{Threshold: 0.5, MaxIter: 1000, Seed: 42})
	if !res.OK {
		t.Fatalf("RANSAC did not find a model: %d inliers after %d iterations", res.Count, res.Iters)
	}
	if res.Count != 20 {
		t.Fatalf("RANSAC inliers = %d, want 20", res.Count)
	}
}

func TestProjectiveMathRejectsNonFiniteValues(t *testing.T) {
	if _, _, ok := Identity.Apply(math.NaN(), 1); ok {
		t.Fatal("Apply accepted a NaN input coordinate")
	}
	if _, _, ok := Identity.Apply(math.Inf(1), 1); ok {
		t.Fatal("Apply accepted an infinite input coordinate")
	}
	bad := Mat3{1, 0, 0, 0, 1, 0, 0, 0, math.NaN()}
	if _, _, ok := bad.Apply(1, 1); ok {
		t.Fatal("Apply accepted a non-finite homogeneous denominator")
	}
	if _, ok := bad.Inv(); ok {
		t.Fatal("Inv accepted a matrix with a non-finite determinant")
	}
}

func TestFitRejectsInsufficientDegenerateAndUnknownModels(t *testing.T) {
	points := []Pt{
		{SX: 0, SY: 0, RX: 1, RY: 1},
		{SX: 1, SY: 1, RX: 2, RY: 2},
		{SX: 2, SY: 2, RX: 3, RY: 3},
		{SX: 3, SY: 3, RX: 4, RY: 4},
	}
	if _, err := Fit(ModelAffine, points[:2]); err == nil {
		t.Fatal("Fit accepted too few points for affine model")
	}
	if _, err := Fit("unknown", points); err == nil {
		t.Fatal("Fit accepted an unknown model")
	}
	if _, err := Fit(ModelAffine, points); err == nil {
		t.Fatal("Fit accepted collinear points for affine model")
	}
}
