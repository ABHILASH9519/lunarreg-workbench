package cv

import (
	"math"
	"math/bits"
	"sort"
)

// Desc is a 256-bit binary descriptor.
type Desc [4]uint64

// Keypoint is a detected feature expressed in base-image coordinates.
type Keypoint struct {
	X     float64 `json:"x"`
	Y     float64 `json:"y"`
	Level int     `json:"level"`
	Angle float64 `json:"angle"`
	Score float64 `json:"score"`
}

// FeatureSet holds keypoints and their descriptors (parallel slices).
type FeatureSet struct {
	KP   []Keypoint
	Desc []Desc
}

// Hamming returns the Hamming distance between two descriptors.
func Hamming(a, b Desc) int {
	return bits.OnesCount64(a[0]^b[0]) + bits.OnesCount64(a[1]^b[1]) +
		bits.OnesCount64(a[2]^b[2]) + bits.OnesCount64(a[3]^b[3])
}

var circle = [16][2]int{{0, -3}, {1, -3}, {2, -2}, {3, -1}, {3, 0}, {3, 1}, {2, 2}, {1, 3},
	{0, 3}, {-1, 3}, {-2, 2}, {-3, 1}, {-3, 0}, {-3, -1}, {-2, -2}, {-1, -3}}

const (
	patchHalf = 15
	border    = 20
)

// pattern holds 256 deterministic BRIEF sampling pairs.
var pattern = func() [256][4]float64 {
	var p [256][4]float64
	s := uint64(0x9E3779B97F4A7C15)
	next := func() float64 {
		s = s*6364136223846793005 + 1442695040888963407
		return float64(s>>11) / float64(1<<53)
	}
	gauss := func() float64 {
		u1, u2 := next()+1e-12, next()
		return math.Sqrt(-2*math.Log(u1)) * math.Cos(2*math.Pi*u2)
	}
	cl := func(v float64) float64 { return math.Max(-13, math.Min(13, v)) }
	for i := range p {
		for j := 0; j < 4; j++ {
			p[i][j] = math.Round(cl(gauss() * 6))
		}
	}
	return p
}()

// fastCorners returns FAST-9 candidates with their corner strength.
func fastCorners(g *Gray, thr float32) []Keypoint {
	var out []Keypoint
	for y := border; y < g.H-border; y++ {
		for x := border; x < g.W-border; x++ {
			v := g.Pix[y*g.W+x]
			hi, lo := v+thr, v-thr
			// compass test: arcs of 9 contain >=2 of the 4 compass pixels
			var br, dk int
			for _, k := range [4]int{0, 4, 8, 12} {
				q := g.Pix[(y+circle[k][1])*g.W+x+circle[k][0]]
				if q > hi {
					br++
				} else if q < lo {
					dk++
				}
			}
			if br < 2 && dk < 2 {
				continue
			}
			var cls [16]int8
			var d [16]float32
			for k := 0; k < 16; k++ {
				q := g.Pix[(y+circle[k][1])*g.W+x+circle[k][0]]
				d[k] = q - v
				if q > hi {
					cls[k] = 1
				} else if q < lo {
					cls[k] = -1
				}
			}
			if sc, ok := arcScore(cls, d, thr); ok {
				out = append(out, Keypoint{X: float64(x), Y: float64(y), Score: sc})
			}
		}
	}
	return out
}

func arcScore(cls [16]int8, d [16]float32, thr float32) (float64, bool) {
	for _, sign := range [2]int8{1, -1} {
		run := 0
		best := 0
		for i := 0; i < 32; i++ {
			if cls[i%16] == sign {
				run++
				if run > best {
					best = run
				}
			} else {
				run = 0
			}
		}
		if best >= 9 {
			var s float64
			for k := 0; k < 16; k++ {
				if cls[k] == sign {
					s += math.Abs(float64(d[k])) - float64(thr)
				}
			}
			return s, true
		}
	}
	return 0, false
}

// harris computes the Harris response at (x,y) over a 7x7 window.
func harris(g *Gray, x, y int) float64 {
	var sxx, syy, sxy float64
	for j := -3; j <= 3; j++ {
		for i := -3; i <= 3; i++ {
			px, py := x+i, y+j
			gx := float64(g.At(px+1, py) - g.At(px-1, py))
			gy := float64(g.At(px, py+1) - g.At(px, py-1))
			sxx += gx * gx
			syy += gy * gy
			sxy += gx * gy
		}
	}
	det := sxx*syy - sxy*sxy
	tr := sxx + syy
	return det - 0.04*tr*tr
}

// selectKeypoints ranks by Harris, applies non-max suppression and a
// spatial-bucket cap so features spread across the frame.
func selectKeypoints(g *Gray, cand []Keypoint, n int) []Keypoint {
	for i := range cand {
		cand[i].Score = harris(g, int(cand[i].X), int(cand[i].Y))
	}
	sort.Slice(cand, func(i, j int) bool { return cand[i].Score > cand[j].Score })
	const cell = 6
	cw, ch := g.W/cell+1, g.H/cell+1
	occ := make([]bool, cw*ch)
	var kept []Keypoint
	for _, c := range cand {
		if c.Score <= 0 {
			break
		}
		cx, cy := int(c.X)/cell, int(c.Y)/cell
		blocked := false
		for j := cy - 1; j <= cy+1 && !blocked; j++ {
			for i := cx - 1; i <= cx+1; i++ {
				if i >= 0 && j >= 0 && i < cw && j < ch && occ[j*cw+i] {
					blocked = true
					break
				}
			}
		}
		if blocked {
			continue
		}
		occ[cy*cw+cx] = true
		kept = append(kept, c)
	}
	const G = 8
	cap := int(math.Ceil(2 * float64(n) / (G * G)))
	if cap < 2 {
		cap = 2
	}
	counts := make([]int, G*G)
	var out, rest []Keypoint
	for _, k := range kept {
		b := int(k.Y)*G/g.H*G + int(k.X)*G/g.W
		if counts[b] < cap && len(out) < n {
			counts[b]++
			out = append(out, k)
		} else {
			rest = append(rest, k)
		}
	}
	for _, k := range rest {
		if len(out) >= n {
			break
		}
		out = append(out, k)
	}
	return out
}

func orientation(g *Gray, x, y int) float64 {
	var m01, m10 float64
	for j := -patchHalf; j <= patchHalf; j++ {
		for i := -patchHalf; i <= patchHalf; i++ {
			if i*i+j*j > patchHalf*patchHalf {
				continue
			}
			v := float64(g.At(x+i, y+j))
			m10 += float64(i) * v
			m01 += float64(j) * v
		}
	}
	return math.Atan2(m01, m10)
}

func describe(sm *Gray, x, y int, ang float64) Desc {
	c, s := math.Cos(ang), math.Sin(ang)
	var d Desc
	for i := 0; i < 256; i++ {
		p := pattern[i]
		x1 := int(math.Round(c*p[0] - s*p[1]))
		y1 := int(math.Round(s*p[0] + c*p[1]))
		x2 := int(math.Round(c*p[2] - s*p[3]))
		y2 := int(math.Round(s*p[2] + c*p[3]))
		if sm.At(x+x1, y+y1) < sm.At(x+x2, y+y2) {
			d[i>>6] |= 1 << uint(i&63)
		}
	}
	return d
}

// DetectParams controls feature extraction.
type DetectParams struct {
	Features  int
	Levels    int
	Threshold float32
}

// Detect extracts oriented multi-octave binary features from base.
func Detect(base *Gray, p DetectParams) *FeatureSet {
	pyr := Pyramid(base, p.Levels)
	var wsum float64
	w := make([]float64, len(pyr))
	for i := range pyr {
		w[i] = math.Pow(0.6, float64(i))
		wsum += w[i]
	}
	fs := &FeatureSet{}
	for lv, img := range pyr {
		budget := int(float64(p.Features) * w[lv] / wsum)
		if budget < 20 {
			budget = 20
		}
		cand := fastCorners(img, p.Threshold)
		kps := selectKeypoints(img, cand, budget)
		sm := Blur(img, 2)
		scale := math.Pow(2, float64(lv))
		for _, k := range kps {
			x, y := int(k.X), int(k.Y)
			ang := orientation(sm, x, y)
			fs.Desc = append(fs.Desc, describe(sm, x, y, ang))
			fs.KP = append(fs.KP, Keypoint{X: k.X * scale, Y: k.Y * scale, Level: lv, Angle: ang, Score: k.Score})
		}
	}
	return fs
}
