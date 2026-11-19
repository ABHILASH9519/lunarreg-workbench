package cv

import (
	"math"
	"sort"
)

// Median3 applies a 3x3 median filter (edge-preserving denoise).
func Median3(g *Gray) *Gray {
	out := NewGray(g.W, g.H)
	var w [9]float32
	for y := 0; y < g.H; y++ {
		for x := 0; x < g.W; x++ {
			k := 0
			for dy := -1; dy <= 1; dy++ {
				for dx := -1; dx <= 1; dx++ {
					w[k] = g.At(x+dx, y+dy)
					k++
				}
			}
			// insertion sort of 9
			for i := 1; i < 9; i++ {
				v := w[i]
				j := i - 1
				for j >= 0 && w[j] > v {
					w[j+1] = w[j]
					j--
				}
				w[j+1] = v
			}
			out.Pix[y*g.W+x] = w[4]
		}
	}
	return out
}

// CLAHE performs contrast-limited adaptive histogram equalisation with
// tiles x tiles regions and bilinear blending between tile mappings.
func CLAHE(g *Gray, tiles int, clip float64) *Gray {
	if tiles < 2 {
		tiles = 2
	}
	const bins = 256
	tw := float64(g.W) / float64(tiles)
	th := float64(g.H) / float64(tiles)
	luts := make([][bins]float32, tiles*tiles)
	for ty := 0; ty < tiles; ty++ {
		for tx := 0; tx < tiles; tx++ {
			x0, x1 := int(float64(tx)*tw), int(float64(tx+1)*tw)
			y0, y1 := int(float64(ty)*th), int(float64(ty+1)*th)
			var hist [bins]float64
			n := 0
			for y := y0; y < y1 && y < g.H; y++ {
				for x := x0; x < x1 && x < g.W; x++ {
					hist[clamp8(g.Pix[y*g.W+x])]++
					n++
				}
			}
			if n == 0 {
				for i := range luts[ty*tiles+tx] {
					luts[ty*tiles+tx][i] = float32(i)
				}
				continue
			}
			limit := clip * float64(n) / bins
			if limit < 1 {
				limit = 1
			}
			excess := 0.0
			for i := range hist {
				if hist[i] > limit {
					excess += hist[i] - limit
					hist[i] = limit
				}
			}
			add := excess / bins
			var cum float64
			for i := range hist {
				cum += hist[i] + add
				luts[ty*tiles+tx][i] = float32(255 * cum / (float64(n) + excess))
			}
		}
	}
	out := NewGray(g.W, g.H)
	for y := 0; y < g.H; y++ {
		fy := (float64(y)+0.5)/th - 0.5
		ty0 := int(math.Floor(fy))
		wy := float32(fy - float64(ty0))
		ty1 := ty0 + 1
		ty0, ty1 = clampi(ty0, 0, tiles-1), clampi(ty1, 0, tiles-1)
		for x := 0; x < g.W; x++ {
			fx := (float64(x)+0.5)/tw - 0.5
			tx0 := int(math.Floor(fx))
			wx := float32(fx - float64(tx0))
			tx1 := tx0 + 1
			tx0, tx1 = clampi(tx0, 0, tiles-1), clampi(tx1, 0, tiles-1)
			v := clamp8(g.Pix[y*g.W+x])
			a := luts[ty0*tiles+tx0][v]*(1-wx) + luts[ty0*tiles+tx1][v]*wx
			b := luts[ty1*tiles+tx0][v]*(1-wx) + luts[ty1*tiles+tx1][v]*wx
			out.Pix[y*g.W+x] = a*(1-wy) + b*wy
		}
	}
	return out
}

func clampi(v, lo, hi int) int {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}

// Percentile returns the p-th percentile (0..100) of the values.
func Percentile(vals []float64, p float64) float64 {
	if len(vals) == 0 {
		return 0
	}
	s := append([]float64(nil), vals...)
	sort.Float64s(s)
	i := int(math.Round(float64(len(s)-1) * p / 100))
	return s[i]
}
