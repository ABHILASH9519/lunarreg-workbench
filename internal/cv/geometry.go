package cv

import (
	"errors"
	"math"
	"math/rand"
)

// Mat3 is a row-major 3x3 matrix.
type Mat3 [9]float64

// Identity is the identity transform.
var Identity = Mat3{1, 0, 0, 0, 1, 0, 0, 0, 1}

// Mul returns a*b.
func (a Mat3) Mul(b Mat3) Mat3 {
	var o Mat3
	for i := 0; i < 3; i++ {
		for j := 0; j < 3; j++ {
			for k := 0; k < 3; k++ {
				o[i*3+j] += a[i*3+k] * b[k*3+j]
			}
		}
	}
	return o
}

// Inv returns the inverse, or false when singular.
func (a Mat3) Inv() (Mat3, bool) {
	det := a[0]*(a[4]*a[8]-a[5]*a[7]) - a[1]*(a[3]*a[8]-a[5]*a[6]) + a[2]*(a[3]*a[7]-a[4]*a[6])
	if math.Abs(det) < 1e-14 {
		return Mat3{}, false
	}
	d := 1 / det
	return Mat3{
		(a[4]*a[8] - a[5]*a[7]) * d, (a[2]*a[7] - a[1]*a[8]) * d, (a[1]*a[5] - a[2]*a[4]) * d,
		(a[5]*a[6] - a[3]*a[8]) * d, (a[0]*a[8] - a[2]*a[6]) * d, (a[2]*a[3] - a[0]*a[5]) * d,
		(a[3]*a[7] - a[4]*a[6]) * d, (a[1]*a[6] - a[0]*a[7]) * d, (a[0]*a[4] - a[1]*a[3]) * d,
	}, true
}

// Apply maps a point; ok=false when the point goes to infinity.
func (a Mat3) Apply(x, y float64) (float64, float64, bool) {
	w := a[6]*x + a[7]*y + a[8]
	if math.Abs(w) < 1e-12 {
		return 0, 0, false
	}
	return (a[0]*x + a[1]*y + a[2]) / w, (a[3]*x + a[4]*y + a[5]) / w, true
}

// Pt is a source->reference correspondence.
type Pt struct{ SX, SY, RX, RY float64 }

// Model names.
const (
	ModelSimilarity = "similarity"
	ModelAffine     = "affine"
	ModelHomography = "homography"
)

func minSamples(model string) int {
	switch model {
	case ModelSimilarity:
		return 2
	case ModelAffine:
		return 3
	}
	return 4
}

// solveLS solves the normal equations of an over/exactly determined system.
func solveLS(rows [][]float64, rhs []float64, n int) ([]float64, error) {
	ata := make([][]float64, n)
	for i := range ata {
		ata[i] = make([]float64, n+1)
	}
	for r, row := range rows {
		for i := 0; i < n; i++ {
			if row[i] == 0 {
				continue
			}
			for j := 0; j < n; j++ {
				ata[i][j] += row[i] * row[j]
			}
			ata[i][n] += row[i] * rhs[r]
		}
	}
	for c := 0; c < n; c++ {
		p := c
		for r := c + 1; r < n; r++ {
			if math.Abs(ata[r][c]) > math.Abs(ata[p][c]) {
				p = r
			}
		}
		if math.Abs(ata[p][c]) < 1e-10 {
			return nil, errors.New("singular")
		}
		ata[c], ata[p] = ata[p], ata[c]
		for r := 0; r < n; r++ {
			if r == c {
				continue
			}
			f := ata[r][c] / ata[c][c]
			for k := c; k <= n; k++ {
				ata[r][k] -= f * ata[c][k]
			}
		}
	}
	x := make([]float64, n)
	for i := range x {
		x[i] = ata[i][n] / ata[i][i]
	}
	return x, nil
}

func normalise(pts []Pt) (ts, tr Mat3, n []Pt) {
	var msx, msy, mrx, mry float64
	for _, p := range pts {
		msx += p.SX
		msy += p.SY
		mrx += p.RX
		mry += p.RY
	}
	k := float64(len(pts))
	msx, msy, mrx, mry = msx/k, msy/k, mrx/k, mry/k
	var ds, dr float64
	for _, p := range pts {
		ds += math.Hypot(p.SX-msx, p.SY-msy)
		dr += math.Hypot(p.RX-mrx, p.RY-mry)
	}
	ds, dr = ds/k, dr/k
	if ds < 1e-9 || dr < 1e-9 {
		ds, dr = 1, 1
	}
	ss, sr := math.Sqrt2/ds, math.Sqrt2/dr
	ts = Mat3{ss, 0, -ss * msx, 0, ss, -ss * msy, 0, 0, 1}
	tr = Mat3{sr, 0, -sr * mrx, 0, sr, -sr * mry, 0, 0, 1}
	n = make([]Pt, len(pts))
	for i, p := range pts {
		n[i] = Pt{(p.SX - msx) * ss, (p.SY - msy) * ss, (p.RX - mrx) * sr, (p.RY - mry) * sr}
	}
	return
}

// Fit estimates the transform of the named model from correspondences.
func Fit(model string, pts []Pt) (Mat3, error) {
	if len(pts) < minSamples(model) {
		return Identity, errors.New("not enough points")
	}
	ts, tr, n := normalise(pts)
	var rows [][]float64
	var rhs []float64
	var sol []float64
	var err error
	var hn Mat3
	switch model {
	case ModelSimilarity:
		for _, p := range n {
			rows = append(rows, []float64{p.SX, -p.SY, 1, 0}, []float64{p.SY, p.SX, 0, 1})
			rhs = append(rhs, p.RX, p.RY)
		}
		if sol, err = solveLS(rows, rhs, 4); err != nil {
			return Identity, err
		}
		hn = Mat3{sol[0], -sol[1], sol[2], sol[1], sol[0], sol[3], 0, 0, 1}
	case ModelAffine:
		for _, p := range n {
			rows = append(rows, []float64{p.SX, p.SY, 1, 0, 0, 0}, []float64{0, 0, 0, p.SX, p.SY, 1})
			rhs = append(rhs, p.RX, p.RY)
		}
		if sol, err = solveLS(rows, rhs, 6); err != nil {
			return Identity, err
		}
		hn = Mat3{sol[0], sol[1], sol[2], sol[3], sol[4], sol[5], 0, 0, 1}
	case ModelHomography:
		for _, p := range n {
			rows = append(rows,
				[]float64{p.SX, p.SY, 1, 0, 0, 0, -p.SX * p.RX, -p.SY * p.RX},
				[]float64{0, 0, 0, p.SX, p.SY, 1, -p.SX * p.RY, -p.SY * p.RY})
			rhs = append(rhs, p.RX, p.RY)
		}
		if sol, err = solveLS(rows, rhs, 8); err != nil {
			return Identity, err
		}
		hn = Mat3{sol[0], sol[1], sol[2], sol[3], sol[4], sol[5], sol[6], sol[7], 1}
	default:
		return Identity, errors.New("unknown model " + model)
	}
	tri, ok := tr.Inv()
	if !ok {
		return Identity, errors.New("singular normalisation")
	}
	h := tri.Mul(hn).Mul(ts)
	if h[8] != 0 {
		for i := range h {
			h[i] /= h[8]
		}
	}
	return h, nil
}

// ReprojError is the forward reprojection error of p under h.
func ReprojError(h Mat3, p Pt) float64 {
	x, y, ok := h.Apply(p.SX, p.SY)
	if !ok {
		return math.Inf(1)
	}
	return math.Hypot(x-p.RX, y-p.RY)
}

// Decomp are interpretable parameters of a transform.
type Decomp struct {
	Scale       float64 `json:"scale"`
	RotationDeg float64 `json:"rotationDeg"`
	TX          float64 `json:"tx"`
	TY          float64 `json:"ty"`
	Shear       float64 `json:"shear"`
	Perspective float64 `json:"perspective"`
}

// Decompose extracts scale, rotation, translation, shear and perspective.
func Decompose(h Mat3) Decomp {
	a, b, c, d := h[0], h[1], h[3], h[4]
	sx := math.Hypot(a, c)
	det := a*d - b*c
	shear := 0.0
	if math.Abs(det) > 1e-12 {
		// non-orthogonality of the linear part's columns (0 for similarity)
		shear = (a*b + c*d) / math.Abs(det)
	}
	_ = sx
	return Decomp{
		Scale:       math.Sqrt(math.Abs(det)),
		RotationDeg: math.Atan2(c, a) * 180 / math.Pi,
		TX:          h[2], TY: h[5],
		Shear:       shear,
		Perspective: math.Hypot(h[6], h[7]),
	}
}

// RansacParams controls robust estimation.
type RansacParams struct {
	Threshold float64
	MaxIter   int
	Seed      int64
}

// RansacResult is the outcome of robust fitting for one model.
type RansacResult struct {
	Model   string
	H       Mat3
	Inliers []bool
	Errors  []float64
	Count   int
	OK      bool
	Iters   int
}

func collinear3(a, b, c Pt) bool {
	return math.Abs((b.SX-a.SX)*(c.SY-a.SY)-(b.SY-a.SY)*(c.SX-a.SX)) < 1.0 ||
		math.Abs((b.RX-a.RX)*(c.RY-a.RY)-(b.RY-a.RY)*(c.RX-a.RX)) < 1.0
}

func saneTransform(model string, h Mat3) bool {
	d := Decompose(h)
	if d.Scale < 0.2 || d.Scale > 5 || math.IsNaN(d.Scale) {
		return false
	}
	if model == ModelHomography && d.Perspective > 0.01 {
		return false
	}
	return true
}

// Ransac fits model robustly with local optimisation on the best consensus.
func Ransac(model string, pts []Pt, p RansacParams) RansacResult {
	res := RansacResult{Model: model, H: Identity, Inliers: make([]bool, len(pts)), Errors: make([]float64, len(pts))}
	k := minSamples(model)
	if len(pts) < k+1 {
		return res
	}
	if p.MaxIter <= 0 {
		p.MaxIter = 2000
	}
	rng := rand.New(rand.NewSource(p.Seed + int64(len(pts))))
	bestCount, bestCost := 0, math.Inf(1)
	var bestH Mat3
	need := p.MaxIter
	idx := make([]int, k)
	sample := make([]Pt, k)
	for it := 0; it < need && it < p.MaxIter; it++ {
		res.Iters = it + 1
		for i := 0; i < k; i++ {
		retry:
			idx[i] = rng.Intn(len(pts))
			for j := 0; j < i; j++ {
				if idx[j] == idx[i] {
					goto retry
				}
			}
			sample[i] = pts[idx[i]]
		}
		if k >= 3 && (collinear3(sample[0], sample[1], sample[2]) ||
			(k == 4 && (collinear3(sample[0], sample[1], sample[3]) || collinear3(sample[0], sample[2], sample[3]) || collinear3(sample[1], sample[2], sample[3])))) {
			continue
		}
		h, err := Fit(model, sample)
		if err != nil || !saneTransform(model, h) {
			continue
		}
		cnt, cost := 0, 0.0
		for _, q := range pts {
			e := ReprojError(h, q)
			if e < p.Threshold {
				cnt++
				cost += e
			} else {
				cost += p.Threshold
			}
		}
		if cnt > bestCount || (cnt == bestCount && cost < bestCost) {
			bestCount, bestCost, bestH = cnt, cost, h
			ratio := float64(cnt) / float64(len(pts))
			if ratio > 0 {
				n := math.Log(1-0.995) / math.Log(1-math.Pow(ratio, float64(k)))
				if !math.IsNaN(n) && !math.IsInf(n, 0) && int(n)+1 < need {
					need = int(n) + 1
					if need < 30 {
						need = 30
					}
				}
			}
		}
	}
	if bestCount < k+1 {
		return res
	}
	// local optimisation: refit on consensus set, up to 3 rounds.
	h := bestH
	for round := 0; round < 3; round++ {
		var in []Pt
		for _, q := range pts {
			if ReprojError(h, q) < p.Threshold {
				in = append(in, q)
			}
		}
		if len(in) < k+1 {
			break
		}
		nh, err := Fit(model, in)
		if err != nil || !saneTransform(model, nh) {
			break
		}
		h = nh
	}
	res.H = h
	for i, q := range pts {
		e := ReprojError(h, q)
		res.Errors[i] = e
		if e < p.Threshold {
			res.Inliers[i] = true
			res.Count++
		}
	}
	res.OK = res.Count >= k+1 && saneTransform(model, h)
	return res
}
