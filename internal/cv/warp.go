package cv

import (
	"bytes"
	"image"
	"image/color"
	"image/png"
	"math"
	"sort"
)

// Warp resamples src into a w x h reference frame using the source->reference
// transform h (inverse mapping, bilinear). valid marks pixels with source
// support.
func Warp(src *Gray, h Mat3, w, ht int) (*Gray, []bool) {
	out := NewGray(w, ht)
	valid := make([]bool, w*ht)
	inv, ok := h.Inv()
	if !ok {
		return out, valid
	}
	for y := 0; y < ht; y++ {
		for x := 0; x < w; x++ {
			sx, sy, ok := inv.Apply(float64(x), float64(y))
			if !ok || sx < 0 || sy < 0 || sx > float64(src.W-1) || sy > float64(src.H-1) {
				continue
			}
			out.Pix[y*w+x] = src.Bilinear(sx, sy)
			valid[y*w+x] = true
		}
	}
	return out, valid
}

// ImageMetrics are intensity-based agreement measures over the overlap.
type ImageMetrics struct {
	NCC          float64 `json:"ncc"`
	MutualInfo   float64 `json:"mutualInfo"`
	OverlapRatio float64 `json:"overlapRatio"`
	ValidPixels  int     `json:"validPixels"`
	MeanAbsDiff  float64 `json:"meanAbsDiff"`
	Computed     bool    `json:"computed"`
}

// CompareImages computes NCC, normalised mutual information and mean
// absolute difference of reg vs ref on valid pixels.
func CompareImages(ref, reg *Gray, valid []bool) ImageMetrics {
	var n int
	var sa, sb float64
	for i, v := range valid {
		if v {
			n++
			sa += float64(ref.Pix[i])
			sb += float64(reg.Pix[i])
		}
	}
	m := ImageMetrics{ValidPixels: n, OverlapRatio: float64(n) / float64(len(valid))}
	if n < 256 {
		return m
	}
	ma, mb := sa/float64(n), sb/float64(n)
	var saa, sbb, sab, sad float64
	const bins = 32
	var joint [bins][bins]float64
	for i, v := range valid {
		if !v {
			continue
		}
		a, b := float64(ref.Pix[i]), float64(reg.Pix[i])
		saa += (a - ma) * (a - ma)
		sbb += (b - mb) * (b - mb)
		sab += (a - ma) * (b - mb)
		sad += math.Abs(a - b)
		ia, ib := clampi(int(a/256*bins), 0, bins-1), clampi(int(b/256*bins), 0, bins-1)
		joint[ia][ib]++
	}
	if saa > 0 && sbb > 0 {
		m.NCC = sab / math.Sqrt(saa*sbb)
	}
	m.MeanAbsDiff = sad / float64(n)
	var pa, pb [bins]float64
	for i := 0; i < bins; i++ {
		for j := 0; j < bins; j++ {
			pa[i] += joint[i][j]
			pb[j] += joint[i][j]
		}
	}
	var ha, hb, hab float64
	fn := float64(n)
	for i := 0; i < bins; i++ {
		if pa[i] > 0 {
			ha -= pa[i] / fn * math.Log(pa[i]/fn)
		}
		if pb[i] > 0 {
			hb -= pb[i] / fn * math.Log(pb[i]/fn)
		}
		for j := 0; j < bins; j++ {
			if joint[i][j] > 0 {
				hab -= joint[i][j] / fn * math.Log(joint[i][j]/fn)
			}
		}
	}
	if hab > 0 {
		m.MutualInfo = (ha + hb) / hab // normalised MI in [1,2]
	}
	m.Computed = true
	return m
}

func encodeRGBA(img *image.RGBA) []byte {
	var buf bytes.Buffer
	_ = png.Encode(&buf, img)
	return buf.Bytes()
}

// Overlay renders ref->G,B and reg->R: aligned areas are neutral grey while
// misregistration shows as red/cyan fringes.
func Overlay(ref, reg *Gray, valid []bool) []byte {
	img := image.NewRGBA(image.Rect(0, 0, ref.W, ref.H))
	for i := range ref.Pix {
		r := ref.Pix[i]
		g := reg.Pix[i]
		if valid != nil && !valid[i] {
			g = 0
		}
		img.Pix[i*4+0] = clamp8(g)
		img.Pix[i*4+1] = clamp8(r)
		img.Pix[i*4+2] = clamp8(r)
		img.Pix[i*4+3] = 255
	}
	return encodeRGBA(img)
}

// Heat maps t in [0,1] from space black through cyan and gold to white.
func Heat(t float64) color.RGBA {
	t = math.Max(0, math.Min(1, t))
	stops := [][3]float64{{6, 8, 20}, {20, 120, 160}, {70, 220, 230}, {250, 200, 80}, {255, 255, 255}}
	f := t * float64(len(stops)-1)
	i := int(f)
	if i >= len(stops)-1 {
		i = len(stops) - 2
	}
	u := f - float64(i)
	l := func(k int) uint8 { return uint8(stops[i][k]*(1-u) + stops[i+1][k]*u) }
	return color.RGBA{l(0), l(1), l(2), 255}
}

// Difference renders |ref-reg| through the heat map, scaled to the 99th
// percentile of the valid region.
func Difference(ref, reg *Gray, valid []bool) []byte {
	var diffs []float64
	for i := range ref.Pix {
		if valid[i] {
			diffs = append(diffs, math.Abs(float64(ref.Pix[i]-reg.Pix[i])))
		}
	}
	sort.Float64s(diffs)
	top := 1.0
	if len(diffs) > 0 {
		top = math.Max(diffs[int(float64(len(diffs)-1)*0.99)], 1)
	}
	img := image.NewRGBA(image.Rect(0, 0, ref.W, ref.H))
	for i := range ref.Pix {
		c := color.RGBA{4, 6, 14, 255}
		if valid[i] {
			c = Heat(math.Abs(float64(ref.Pix[i]-reg.Pix[i])) / top)
		}
		img.Pix[i*4], img.Pix[i*4+1], img.Pix[i*4+2], img.Pix[i*4+3] = c.R, c.G, c.B, 255
	}
	return encodeRGBA(img)
}

// Checkerboard alternates tiles of reference and registered images.
func Checkerboard(ref, reg *Gray, valid []bool, tiles int) []byte {
	ts := ref.W / tiles
	if ts < 8 {
		ts = 8
	}
	img := image.NewRGBA(image.Rect(0, 0, ref.W, ref.H))
	for y := 0; y < ref.H; y++ {
		for x := 0; x < ref.W; x++ {
			i := y*ref.W + x
			v := ref.Pix[i]
			if ((x/ts)+(y/ts))%2 == 1 && valid[i] {
				v = reg.Pix[i]
			}
			c := clamp8(v)
			img.Pix[i*4], img.Pix[i*4+1], img.Pix[i*4+2], img.Pix[i*4+3] = c, c, c, 255
		}
	}
	return encodeRGBA(img)
}

// Corr is a drawable correspondence.
type Corr struct {
	SX, SY, RX, RY float64
	Inlier         bool
}

// MatchesImage draws source | reference side by side with match lines
// (inliers cyan, outliers red).
func MatchesImage(src, ref *Gray, cs []Corr) []byte {
	h := src.H
	if ref.H > h {
		h = ref.H
	}
	w := src.W + ref.W
	img := image.NewRGBA(image.Rect(0, 0, w, h))
	for i := range img.Pix {
		if i%4 == 3 {
			img.Pix[i] = 255
		} else {
			img.Pix[i] = 6
		}
	}
	put := func(g *Gray, ox int) {
		for y := 0; y < g.H; y++ {
			for x := 0; x < g.W; x++ {
				c := clamp8(g.Pix[y*g.W+x] * 0.8)
				o := (y*w + x + ox) * 4
				img.Pix[o], img.Pix[o+1], img.Pix[o+2] = c, c, c
			}
		}
	}
	put(src, 0)
	put(ref, src.W)
	for pass := 0; pass < 2; pass++ { // outliers first so inliers sit on top
		for _, c := range cs {
			if c.Inlier != (pass == 1) {
				continue
			}
			col := color.RGBA{230, 70, 70, 255}
			if c.Inlier {
				col = color.RGBA{70, 225, 230, 255}
			}
			line(img, int(c.SX), int(c.SY), int(c.RX)+src.W, int(c.RY), col)
			dot(img, int(c.SX), int(c.SY), col)
			dot(img, int(c.RX)+src.W, int(c.RY), col)
		}
	}
	return encodeRGBA(img)
}

func dot(img *image.RGBA, x, y int, c color.RGBA) {
	for dy := -2; dy <= 2; dy++ {
		for dx := -2; dx <= 2; dx++ {
			if dx*dx+dy*dy <= 5 && image.Pt(x+dx, y+dy).In(img.Rect) {
				img.SetRGBA(x+dx, y+dy, c)
			}
		}
	}
}

func line(img *image.RGBA, x0, y0, x1, y1 int, c color.RGBA) {
	dx, dy := absi(x1-x0), -absi(y1-y0)
	sx, sy := 1, 1
	if x0 > x1 {
		sx = -1
	}
	if y0 > y1 {
		sy = -1
	}
	e := dx + dy
	for {
		if image.Pt(x0, y0).In(img.Rect) {
			o := img.PixOffset(x0, y0)
			// 55% alpha blend keeps the terrain visible under the lines
			img.Pix[o] = uint8((int(img.Pix[o])*45 + int(c.R)*55) / 100)
			img.Pix[o+1] = uint8((int(img.Pix[o+1])*45 + int(c.G)*55) / 100)
			img.Pix[o+2] = uint8((int(img.Pix[o+2])*45 + int(c.B)*55) / 100)
		}
		if x0 == x1 && y0 == y1 {
			return
		}
		e2 := 2 * e
		if e2 >= dy {
			e += dy
			x0 += sx
		}
		if e2 <= dx {
			e += dx
			y0 += sy
		}
	}
}

func absi(a int) int {
	if a < 0 {
		return -a
	}
	return a
}

// ConvexHullArea returns the area of the convex hull of points.
func ConvexHullArea(pts [][2]float64) float64 {
	if len(pts) < 3 {
		return 0
	}
	p := append([][2]float64(nil), pts...)
	sort.Slice(p, func(i, j int) bool {
		if p[i][0] != p[j][0] {
			return p[i][0] < p[j][0]
		}
		return p[i][1] < p[j][1]
	})
	cross := func(o, a, b [2]float64) float64 {
		return (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0])
	}
	var h [][2]float64
	for _, q := range p {
		for len(h) >= 2 && cross(h[len(h)-2], h[len(h)-1], q) <= 0 {
			h = h[:len(h)-1]
		}
		h = append(h, q)
	}
	lo := len(h) + 1
	for i := len(p) - 2; i >= 0; i-- {
		for len(h) >= lo && cross(h[len(h)-2], h[len(h)-1], p[i]) <= 0 {
			h = h[:len(h)-1]
		}
		h = append(h, p[i])
	}
	var a float64
	for i := 0; i < len(h)-1; i++ {
		a += h[i][0]*h[i+1][1] - h[i+1][0]*h[i][1]
	}
	return math.Abs(a) / 2
}
