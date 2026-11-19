package cv

import (
	"context"
	"errors"
	"fmt"
	"math"
	"sort"
	"time"
)

// Params is the full, reproducible registration configuration.
type Params struct {
	MaxDim         int     `json:"maxDim"`
	Denoise        bool    `json:"denoise"`
	Contrast       bool    `json:"contrast"`
	Features       int     `json:"features"`
	Levels         int     `json:"levels"`
	FastThreshold  float64 `json:"fastThreshold"`
	Ratio          float64 `json:"ratio"`
	CrossCheck     bool    `json:"crossCheck"`
	RansacThresh   float64 `json:"ransacThreshold"`
	GridCells      int     `json:"gridCells"`
	GridMaxPerCell int     `json:"gridMaxPerCell"`
	Model          string  `json:"model"` // auto|similarity|affine|homography
	MaxIter        int     `json:"maxIter"`
	Seed           int64   `json:"seed"`
}

// DefaultParams are tuned for 512px planetary imagery.
func DefaultParams() Params {
	return Params{MaxDim: 512, Denoise: true, Contrast: true, Features: 1200, Levels: 3,
		FastThreshold: 14, Ratio: 0.85, CrossCheck: true, RansacThresh: 3, GridCells: 6,
		GridMaxPerCell: 30, Model: "auto", MaxIter: 2500, Seed: 42}
}

// Validate clamps and checks parameters.
func (p *Params) Validate() error {
	d := DefaultParams()
	if p.MaxDim == 0 {
		p.MaxDim = d.MaxDim
	}
	if p.Features == 0 {
		p.Features = d.Features
	}
	if p.Levels == 0 {
		p.Levels = d.Levels
	}
	if p.FastThreshold == 0 {
		p.FastThreshold = d.FastThreshold
	}
	if p.Ratio == 0 {
		p.Ratio = d.Ratio
	}
	if p.RansacThresh == 0 {
		p.RansacThresh = d.RansacThresh
	}
	if p.MaxIter == 0 {
		p.MaxIter = d.MaxIter
	}
	if p.Model == "" {
		p.Model = "auto"
	}
	if p.GridMaxPerCell == 0 {
		p.GridMaxPerCell = d.GridMaxPerCell
	}
	switch {
	case p.MaxDim < 128 || p.MaxDim > 1024:
		return errors.New("maxDim must be 128..1024")
	case p.Features < 100 || p.Features > 5000:
		return errors.New("features must be 100..5000")
	case p.Levels < 1 || p.Levels > 5:
		return errors.New("levels must be 1..5")
	case p.FastThreshold < 3 || p.FastThreshold > 80:
		return errors.New("fastThreshold must be 3..80")
	case p.Ratio < 0.5 || p.Ratio > 0.99:
		return errors.New("ratio must be 0.5..0.99")
	case p.RansacThresh < 0.5 || p.RansacThresh > 20:
		return errors.New("ransacThreshold must be 0.5..20")
	case p.GridCells < 0 || p.GridCells > 16:
		return errors.New("gridCells must be 0..16")
	case p.MaxIter < 100 || p.MaxIter > 20000:
		return errors.New("maxIter must be 100..20000")
	}
	switch p.Model {
	case "auto", ModelSimilarity, ModelAffine, ModelHomography:
	default:
		return errors.New("model must be auto, similarity, affine or homography")
	}
	return nil
}

// ProgressFn reports pipeline progress.
type ProgressFn func(stage string, pct float64, msg string)

// ModelStat summarises one candidate model.
type ModelStat struct {
	Model       string  `json:"model"`
	Inliers     int     `json:"inliers"`
	InlierRatio float64 `json:"inlierRatio"`
	RMSE        float64 `json:"rmse"`
	MedianErr   float64 `json:"medianError"`
	MaxErr      float64 `json:"maxError"`
	OK          bool    `json:"ok"`
	Score       float64 `json:"score"`
	Matrix      Mat3    `json:"matrix"`
}

// CorrOut is a correspondence in processed-frame coordinates.
type CorrOut struct {
	SX     float64 `json:"sx"`
	SY     float64 `json:"sy"`
	RX     float64 `json:"rx"`
	RY     float64 `json:"ry"`
	Dist   int     `json:"dist"`
	Err    float64 `json:"err"`
	Level  int     `json:"level"`
	Inlier bool    `json:"inlier"`
}

// Metrics are the computed quality measures. Zero-valued optional metrics
// are accompanied by Computed=false so the UI can show N/A.
type Metrics struct {
	Computed       bool         `json:"computed"`
	Inliers        int          `json:"inliers"`
	Outliers       int          `json:"outliers"`
	InlierRatio    float64      `json:"inlierRatio"`
	RMSE           float64      `json:"rmse"`
	MeanErr        float64      `json:"meanError"`
	MedianErr      float64      `json:"medianError"`
	MaxErr         float64      `json:"maxError"`
	Coverage       float64      `json:"coverage"`
	HullRatio      float64      `json:"hullRatio"`
	Decomp         Decomp       `json:"transform"`
	Image          ImageMetrics `json:"image"`
	Confidence     string       `json:"confidence"`
	ConfidenceNote string       `json:"confidenceNote"`
}

// Result is everything a run produces.
type Result struct {
	Params          Params            `json:"params"`
	ModelUsed       string            `json:"modelUsed"`
	Recommended     string            `json:"recommendedModel"`
	Matrix          Mat3              `json:"matrix"`
	Models          []ModelStat       `json:"models"`
	Metrics         Metrics           `json:"metrics"`
	Corrs           []CorrOut         `json:"correspondences"`
	Warnings        []string          `json:"warnings"`
	SourceKP        int               `json:"sourceKeypoints"`
	RefKP           int               `json:"referenceKeypoints"`
	RawMatches      int               `json:"rawMatches"`
	FilteredMatches int               `json:"filteredMatches"`
	SrcSize         [2]int            `json:"sourceSize"`
	RefSize         [2]int            `json:"referenceSize"`
	SrcScale        float64           `json:"sourceScale"`
	RefScale        float64           `json:"referenceScale"`
	TimingsMS       map[string]int64  `json:"timingsMs"`
	Images          map[string][]byte `json:"-"`
}

func stageTimer(t map[string]int64, name string) func() {
	s := time.Now()
	return func() { t[name] = time.Since(s).Milliseconds() }
}

func prep(g *Gray, p Params) (*Gray, float64) {
	g, scale := LimitSize(g, p.MaxDim)
	if p.Denoise {
		g = Median3(g)
	}
	if p.Contrast {
		g = CLAHE(g, 8, 3)
	}
	return g, scale
}

// Run executes the full pipeline. It honours ctx cancellation between stages.
func Run(ctx context.Context, srcRaw, refRaw *Gray, p Params, progress ProgressFn) (*Result, error) {
	if err := p.Validate(); err != nil {
		return nil, err
	}
	if progress == nil {
		progress = func(string, float64, string) {}
	}
	res := &Result{Params: p, TimingsMS: map[string]int64{}, Images: map[string][]byte{}}
	check := func() error { return ctx.Err() }

	progress("preprocess", 0.05, "Grayscale, denoise, CLAHE contrast")
	done := stageTimer(res.TimingsMS, "preprocess")
	src, ss := prep(srcRaw, p)
	ref, rs := prep(refRaw, p)
	done()
	res.SrcSize, res.RefSize = [2]int{src.W, src.H}, [2]int{ref.W, ref.H}
	res.SrcScale, res.RefScale = ss, rs
	if err := check(); err != nil {
		return nil, err
	}

	progress("features", 0.2, fmt.Sprintf("FAST-9 + Harris, %d-level pyramid, oriented BRIEF", p.Levels))
	done = stageTimer(res.TimingsMS, "features")
	dp := DetectParams{Features: p.Features, Levels: p.Levels, Threshold: float32(p.FastThreshold)}
	fs, fr := Detect(src, dp), Detect(ref, dp)
	done()
	res.SourceKP, res.RefKP = len(fs.KP), len(fr.KP)
	if len(fs.KP) < 12 || len(fr.KP) < 12 {
		res.Warnings = append(res.Warnings, "Too few features detected; lower the FAST threshold or use a higher-contrast image.")
		return finishFailed(res, src, ref, "not enough features")
	}
	if err := check(); err != nil {
		return nil, err
	}

	progress("matching", 0.45, "Hamming matching, ratio test, cross-check")
	done = stageTimer(res.TimingsMS, "matching")
	raw := MatchDescriptors(fs.Desc, fr.Desc, MatchParams{Ratio: p.Ratio, CrossCheck: p.CrossCheck})
	res.RawMatches = len(raw)
	ms := GridFilter(raw, fs.KP, src.W, src.H, p.GridCells, p.GridMaxPerCell)
	res.FilteredMatches = len(ms)
	done()
	if len(ms) < 8 {
		res.Warnings = append(res.Warnings, fmt.Sprintf("Only %d correspondences survived filtering (need at least 8).", len(ms)))
		return finishFailed(res, src, ref, "not enough correspondences")
	}
	if err := check(); err != nil {
		return nil, err
	}

	progress("verify", 0.6, "RANSAC: similarity / affine / homography")
	done = stageTimer(res.TimingsMS, "verify")
	pts := make([]Pt, len(ms))
	for i, m := range ms {
		a, b := fs.KP[m.I], fr.KP[m.J]
		pts[i] = Pt{a.X, a.Y, b.X, b.Y}
	}
	rp := RansacParams{Threshold: p.RansacThresh, MaxIter: p.MaxIter, Seed: p.Seed}
	results := map[string]RansacResult{}
	for _, name := range []string{ModelSimilarity, ModelAffine, ModelHomography} {
		results[name] = Ransac(name, pts, rp)
		res.Models = append(res.Models, modelStat(results[name], len(pts)))
	}
	done()
	res.Recommended = recommend(res.Models)
	use := p.Model
	if use == "auto" {
		use = res.Recommended
	}
	if use == "" {
		res.Warnings = append(res.Warnings, "No geometric model reached a valid consensus; images may not overlap or share too little structure.")
		return finishFailed(res, src, ref, "no consensus")
	}
	best := results[use]
	if !best.OK {
		res.ModelUsed = use
		res.Warnings = append(res.Warnings, fmt.Sprintf("The selected %s model did not reach a valid consensus.", use))
		return finishFailed(res, src, ref, "selected model failed")
	}
	res.ModelUsed, res.Matrix = use, best.H
	if err := check(); err != nil {
		return nil, err
	}

	progress("warp", 0.78, "Warping source into reference frame")
	done = stageTimer(res.TimingsMS, "warp")
	reg, valid := Warp(src, best.H, ref.W, ref.H)
	done()

	progress("metrics", 0.88, "Computing reprojection and image metrics")
	done = stageTimer(res.TimingsMS, "metrics")
	var errs []float64
	var inPts [][2]float64
	cells := map[int]bool{}
	var corrs []Corr
	for i, m := range ms {
		a, b := fs.KP[m.I], fr.KP[m.J]
		in := best.Inliers[i]
		res.Corrs = append(res.Corrs, CorrOut{SX: a.X, SY: a.Y, RX: b.X, RY: b.Y, Dist: m.Dist, Err: best.Errors[i], Level: a.Level, Inlier: in})
		corrs = append(corrs, Corr{a.X, a.Y, b.X, b.Y, in})
		if in {
			errs = append(errs, best.Errors[i])
			inPts = append(inPts, [2]float64{b.X, b.Y})
			cx, cy := clampi(int(b.X)*4/ref.W, 0, 3), clampi(int(b.Y)*4/ref.H, 0, 3)
			cells[cy*4+cx] = true
		}
	}
	mt := Metrics{Computed: true, Inliers: best.Count, Outliers: len(ms) - best.Count}
	mt.InlierRatio = float64(best.Count) / float64(len(ms))
	var sq, sum float64
	for _, e := range errs {
		sq += e * e
		sum += e
		mt.MaxErr = math.Max(mt.MaxErr, e)
	}
	mt.RMSE = math.Sqrt(sq / float64(len(errs)))
	mt.MeanErr = sum / float64(len(errs))
	mt.MedianErr = Percentile(errs, 50)
	mt.Coverage = float64(len(cells)) / 16
	mt.HullRatio = ConvexHullArea(inPts) / float64(ref.W*ref.H)
	mt.Decomp = Decompose(best.H)
	mt.Image = CompareImages(ref, reg, valid)
	mt.Confidence, mt.ConfidenceNote = grade(mt)
	res.Metrics = mt
	res.Warnings = append(res.Warnings, warnings(res, mt)...)
	done()

	progress("compose", 0.94, "Rendering overlay, difference, checkerboard")
	done = stageTimer(res.TimingsMS, "compose")
	res.Images["source"] = EncodePNG(src)
	res.Images["reference"] = EncodePNG(ref)
	res.Images["registered"] = EncodePNG(reg)
	res.Images["overlay"] = Overlay(ref, reg, valid)
	res.Images["before"] = Overlay(ref, Resize(src, ref.W, ref.H), nil)
	res.Images["difference"] = Difference(ref, reg, valid)
	res.Images["checker"] = Checkerboard(ref, reg, valid, 10)
	res.Images["matches"] = MatchesImage(src, ref, corrs)
	done()
	progress("done", 1, "Registration complete")
	return res, nil
}

func finishFailed(res *Result, src, ref *Gray, reason string) (*Result, error) {
	res.Images["source"] = EncodePNG(src)
	res.Images["reference"] = EncodePNG(ref)
	return res, fmt.Errorf("%s", reason)
}

func modelStat(r RansacResult, n int) ModelStat {
	ms := ModelStat{Model: r.Model, Inliers: r.Count, OK: r.OK, Matrix: r.H}
	if n > 0 {
		ms.InlierRatio = float64(r.Count) / float64(n)
	}
	var errs []float64
	var sq float64
	for i, in := range r.Inliers {
		if in {
			errs = append(errs, r.Errors[i])
			sq += r.Errors[i] * r.Errors[i]
			ms.MaxErr = math.Max(ms.MaxErr, r.Errors[i])
		}
	}
	if len(errs) > 0 {
		ms.RMSE = math.Sqrt(sq / float64(len(errs)))
		ms.MedianErr = Percentile(errs, 50)
	}
	// lower is better: residual plus a penalty for lost consensus
	ms.Score = ms.RMSE + 3*(1-ms.InlierRatio)
	return ms
}

// recommend prefers the simplest model whose consensus and error are close
// to the best candidate (Occam's razor over three nested models).
func recommend(ms []ModelStat) string {
	var ok []ModelStat
	for _, m := range ms {
		if m.OK {
			ok = append(ok, m)
		}
	}
	if len(ok) == 0 {
		return ""
	}
	sort.Slice(ok, func(i, j int) bool { return ok[i].Score < ok[j].Score })
	best := ok[0]
	order := map[string]int{ModelSimilarity: 0, ModelAffine: 1, ModelHomography: 2}
	pick := best
	for _, m := range ok {
		if order[m.Model] < order[pick.Model] &&
			m.InlierRatio >= best.InlierRatio-0.06 && m.RMSE <= best.RMSE*1.25+0.15 {
			pick = m
		}
	}
	return pick.Model
}

func grade(m Metrics) (string, string) {
	switch {
	case m.Inliers >= 25 && m.InlierRatio >= 0.5 && m.RMSE <= 1.5 && m.Coverage >= 0.4:
		return "high", "Many well-distributed inliers with sub-1.5 px residual."
	case m.Inliers >= 12 && m.InlierRatio >= 0.3 && m.RMSE <= 2.5 && m.Coverage >= 0.25:
		return "medium", "Adequate consensus; check overlay for local misfit."
	}
	return "low", "Few, clustered or noisy inliers; treat the transform as unverified."
}

func warnings(r *Result, m Metrics) []string {
	var w []string
	if m.InlierRatio < 0.3 {
		w = append(w, fmt.Sprintf("Low inlier ratio (%.0f%%): many matches disagree with the model.", m.InlierRatio*100))
	}
	if m.Coverage < 0.25 {
		w = append(w, "Inliers cover under a quarter of the frame; extrapolated regions may be inaccurate.")
	}
	if m.Image.Computed && m.Image.OverlapRatio < 0.3 {
		w = append(w, fmt.Sprintf("Registered overlap is only %.0f%% of the reference frame.", m.Image.OverlapRatio*100))
	}
	if r.ModelUsed == ModelHomography && m.Inliers < 20 {
		w = append(w, "Homography has 8 degrees of freedom; with so few inliers it may overfit.")
	}
	if m.RMSE > 2.5 {
		w = append(w, fmt.Sprintf("RMSE %.2f px is high; consider a stricter ratio or a richer model.", m.RMSE))
	}
	if r.SrcScale < 1 || r.RefScale < 1 {
		w = append(w, fmt.Sprintf("Inputs were downscaled for processing (source ×%.2f, reference ×%.2f); metrics are in processed pixels.", r.SrcScale, r.RefScale))
	}
	return w
}
