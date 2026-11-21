package cv

import "testing"

func TestMinimumSampleCountsMatchTransformDegreesOfFreedom(t *testing.T) {
	tests := map[string]int{
		ModelSimilarity: 2,
		ModelAffine:     3,
		ModelHomography: 4,
	}
	for model, want := range tests {
		if got := minSamples(model); got != want {
			t.Errorf("minSamples(%q) = %d, want %d", model, got, want)
		}
	}
}
