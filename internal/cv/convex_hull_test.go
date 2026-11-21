package cv

import "testing"

func TestConvexHullAreaForRectangleAndDegeneratePoints(t *testing.T) {
	rectangle := [][2]float64{{0, 0}, {10, 0}, {10, 5}, {0, 5}, {5, 2}}
	if got := ConvexHullArea(rectangle); got != 50 {
		t.Fatalf("rectangle hull area = %v, want 50", got)
	}
	if got := ConvexHullArea([][2]float64{{0, 0}, {1, 1}}); got != 0 {
		t.Fatalf("two-point hull area = %v, want 0", got)
	}
}
