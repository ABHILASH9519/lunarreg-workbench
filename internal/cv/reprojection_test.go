package cv

import "testing"

func TestReprojectionErrorMeasuresForwardPointDistance(t *testing.T) {
	h := Mat3{1, 0, 5, 0, 1, -3, 0, 0, 1}
	p := Pt{SX: 10, SY: 20, RX: 15, RY: 17}
	if got := ReprojError(h, p); got != 0 {
		t.Fatalf("exact reprojection error = %v, want 0", got)
	}
	p.RX += 3
	if got := ReprojError(h, p); got != 3 {
		t.Fatalf("offset reprojection error = %v, want 3", got)
	}
}
