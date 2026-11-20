package synth

import (
	"context"
	"testing"

	"lunarreg/internal/cv"
)

// TestEngineRecoversGroundTruth runs the full pipeline on every bundled
// pair and checks the recovered transform against the exact truth.
func TestEngineRecoversGroundTruth(t *testing.T) {
	limit := map[string]float64{
		"ohrc-crater-field": 2.0, "tmc2-affine": 3.0, "lro-nac-perspective": 4.0,
		"iirs-low-sun": 4.0, "selene-noisy": 4.0,
	}
	for id, p := range All() {
		id, p := id, p
		t.Run(id, func(t *testing.T) {
			src, _, err := cv.Decode(p.Src)
			if err != nil {
				t.Fatal(err)
			}
			ref, _, err := cv.Decode(p.Ref)
			if err != nil {
				t.Fatal(err)
			}
			res, err := cv.Run(context.Background(), src, ref, cv.DefaultParams(), nil)
			if err != nil {
				t.Fatalf("pipeline failed: %v (matches raw=%d filtered=%d warnings=%v)", err, res.RawMatches, res.FilteredMatches, res.Warnings)
			}
			ce := CornerError(res.Matrix, p.Matrix, p.Spec.Size)
			t.Logf("%s model=%s rec=%s inliers=%d/%d rmse=%.2f cornerErr=%.2fpx ncc=%.3f conf=%s",
				id, res.ModelUsed, res.Recommended, res.Metrics.Inliers, res.FilteredMatches, res.Metrics.RMSE, ce, res.Metrics.Image.NCC, res.Metrics.Confidence)
			if ce > limit[id] {
				t.Errorf("corner error %.2f px exceeds %.1f", ce, limit[id])
			}
		})
	}
}

// TestGradientDescriptorWorksAlone forces the illumination-robust descriptor
// so that path is verified directly, not only as an automatic fallback.
func TestGradientDescriptorWorksAlone(t *testing.T) {
	p := All()["ohrc-crater-field"]
	src, _, _ := cv.Decode(p.Src)
	ref, _, _ := cv.Decode(p.Ref)
	params := cv.DefaultParams()
	params.Descriptor = "gradient"
	res, err := cv.Run(context.Background(), src, ref, params, nil)
	if err != nil {
		t.Fatalf("gradient-only run failed: %v", err)
	}
	if res.DescriptorUsed != "gradient" {
		t.Errorf("descriptor used = %q", res.DescriptorUsed)
	}
	if ce := CornerError(res.Matrix, p.Matrix, p.Spec.Size); ce > 3 {
		t.Errorf("corner error %.2f px", ce)
	} else {
		t.Logf("gradient-only: inliers=%d cornerError=%.2fpx", res.Metrics.Inliers, ce)
	}
}

func TestInvalidDescriptorRejected(t *testing.T) {
	p := cv.DefaultParams()
	p.Descriptor = "sift"
	if err := p.Validate(); err == nil {
		t.Error("expected validation error")
	}
}
