package cv

import "testing"

func TestPercentileHandlesEmptyAndOrderedSamples(t *testing.T) {
	if got := Percentile(nil, 50); got != 0 {
		t.Fatalf("empty percentile = %v, want 0", got)
	}
	values := []float64{9, 1, 5, 3, 7}
	if got := Percentile(values, 50); got != 5 {
		t.Fatalf("median percentile = %v, want 5", got)
	}
}
