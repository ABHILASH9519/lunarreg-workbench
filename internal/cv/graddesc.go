package cv

import "math"

// GradDesc is a 128-d SIFT-style descriptor whose orientation histograms are
// folded modulo pi, so it is invariant to gradient polarity reversal. That is
// what happens to crater shading when the sun azimuth changes between images.
type GradDesc [128]float32

// gradLevel caches smoothed image gradients for one pyramid level.
type gradLevel struct{ gx, gy *Gray }

func newGradLevel(g *Gray) gradLevel {
	b := Blur(g, 1.0)
	gx, gy := NewGray(g.W, g.H), NewGray(g.W, g.H)
	for y := 0; y < g.H; y++ {
		for x := 0; x < g.W; x++ {
			gx.Pix[y*g.W+x] = (b.At(x+1, y) - b.At(x-1, y)) / 2
			gy.Pix[y*g.W+x] = (b.At(x, y+1) - b.At(x, y-1)) / 2
		}
	}
	return gradLevel{gx, gy}
}

// dominantOrientation returns the gradient direction (mod pi) from a
// Gaussian-weighted structure tensor around (x,y).
func (gl gradLevel) dominantOrientation(x, y int) float64 {
	var sxx, syy, sxy float64
	for j := -12; j <= 12; j++ {
		for i := -12; i <= 12; i++ {
			w := math.Exp(-float64(i*i+j*j) / 72)
			gx, gy := float64(gl.gx.At(x+i, y+j)), float64(gl.gy.At(x+i, y+j))
			sxx += w * gx * gx
			syy += w * gy * gy
			sxy += w * gx * gy
		}
	}
	return 0.5 * math.Atan2(2*sxy, sxx-syy)
}

// describe samples a 16x16 patch rotated by ang into 4x4 cells x 8 bins.
func (gl gradLevel) describe(kx, ky, ang float64) GradDesc {
	var h GradDesc
	c, s := math.Cos(ang), math.Sin(ang)
	for v := -8; v < 8; v++ {
		for u := -8; u < 8; u++ {
			fu, fv := float64(u)+0.5, float64(v)+0.5
			x, y := kx+c*fu-s*fv, ky+s*fu+c*fv
			gx, gy := float64(gl.gx.Bilinear(x, y)), float64(gl.gy.Bilinear(x, y))
			gu, gv := c*gx+s*gy, -s*gx+c*gy
			mag := math.Hypot(gu, gv) * math.Exp(-(fu*fu+fv*fv)/128)
			phi := math.Mod(math.Atan2(gv, gu)+2*math.Pi, math.Pi) // fold to [0,pi)
			b := phi / math.Pi * 8
			b0 := int(b) % 8
			f := b - math.Floor(b)
			cell := ((v+8)/4)*4 + (u+8)/4
			h[cell*8+b0] += float32(mag * (1 - f))
			h[cell*8+(b0+1)%8] += float32(mag * f)
		}
	}
	return normaliseGrad(h)
}

func normaliseGrad(h GradDesc) GradDesc {
	for pass := 0; pass < 2; pass++ {
		var n float64
		for _, v := range h {
			n += float64(v * v)
		}
		n = math.Sqrt(n) + 1e-9
		for i := range h {
			h[i] = float32(float64(h[i]) / n)
			if pass == 0 && h[i] > 0.2 {
				h[i] = 0.2
			}
		}
	}
	return h
}

// ComputeGradient fills fs.Grad for every keypoint: two descriptors per point
// (orientation and orientation+pi) to resolve the 180-degree ambiguity.
func (fs *FeatureSet) ComputeGradient() {
	if len(fs.Grad) == len(fs.KP) {
		return
	}
	levels := make([]gradLevel, len(fs.pyr))
	for i, p := range fs.pyr {
		levels[i] = newGradLevel(p)
	}
	fs.Grad = make([][2]GradDesc, len(fs.KP))
	for i, k := range fs.KP {
		sc := math.Pow(2, float64(k.Level))
		x, y := k.X/sc, k.Y/sc
		gl := levels[k.Level]
		ang := gl.dominantOrientation(int(x), int(y))
		fs.Grad[i][0] = gl.describe(x, y, ang)
		fs.Grad[i][1] = gl.describe(x, y, ang+math.Pi)
	}
}

func gdot(a, b *GradDesc) float32 {
	var s float32
	for i := range a {
		s += a[i] * b[i]
	}
	return s
}

// nearestGrad returns the best and second-best L2 distances from q to the
// candidate set, treating each candidate's two orientations as one entity.
func nearestGrad(q *GradDesc, set [][2]GradDesc) (best, second float64, bi int) {
	best, second, bi = 1e9, 1e9, -1
	for j := range set {
		d := gdot(q, &set[j][0])
		if d2 := gdot(q, &set[j][1]); d2 > d {
			d = d2
		}
		dist := math.Sqrt(math.Max(0, 2-2*float64(d)))
		if dist < best {
			second, best, bi = best, dist, j
		} else if dist < second {
			second = dist
		}
	}
	return
}

// MatchGradient matches source->reference gradient descriptors with Lowe's
// ratio test and an optional mutual check. Match.Dist is the L2 distance x100.
func MatchGradient(a, b [][2]GradDesc, p MatchParams) []Match {
	if len(a) == 0 || len(b) < 2 {
		return nil
	}
	var back []int
	if p.CrossCheck {
		back = make([]int, len(b))
		srcFirst := make([][2]GradDesc, len(a))
		for i := range a {
			srcFirst[i] = [2]GradDesc{a[i][0], a[i][0]}
		}
		for j := range b {
			// reference point j against source descriptors: use both of j's orientations
			d0, d1 := b[j][0], b[j][1]
			_, _, i0 := nearestGrad(&d0, srcFirst)
			_, _, i1 := nearestGrad(&d1, srcFirst)
			bd0, _, _ := nearestGrad(&d0, srcFirst)
			bd1, _, _ := nearestGrad(&d1, srcFirst)
			if bd0 <= bd1 {
				back[j] = i0
			} else {
				back[j] = i1
			}
		}
	}
	var out []Match
	for i := range a {
		best, second, bj := nearestGrad(&a[i][0], b)
		if bj < 0 || second <= 0 {
			continue
		}
		ratio := best / second
		if ratio >= p.Ratio {
			continue
		}
		if p.CrossCheck && back[bj] != i {
			continue
		}
		out = append(out, Match{I: i, J: bj, Dist: int(best * 100), Ratio: ratio})
	}
	return out
}
