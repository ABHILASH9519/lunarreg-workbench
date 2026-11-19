// Package cv implements the LunarReg registration engine in pure Go:
// decoding, preprocessing, multi-octave ORB-style features, matching,
// RANSAC geometric verification, warping, metrics and composites.
package cv

import (
	"bytes"
	"errors"
	"image"
	"image/jpeg"
	"image/png"
	"math"
	"sort"
)

// Gray is a float32 grayscale image with values nominally in [0,255].
type Gray struct {
	W, H int
	Pix  []float32
}

// NewGray allocates a zeroed image.
func NewGray(w, h int) *Gray { return &Gray{W: w, H: h, Pix: make([]float32, w*h)} }

// At returns the pixel at (x,y) with edge clamping.
func (g *Gray) At(x, y int) float32 {
	if x < 0 {
		x = 0
	} else if x >= g.W {
		x = g.W - 1
	}
	if y < 0 {
		y = 0
	} else if y >= g.H {
		y = g.H - 1
	}
	return g.Pix[y*g.W+x]
}

// Clone copies the image.
func (g *Gray) Clone() *Gray {
	c := NewGray(g.W, g.H)
	copy(c.Pix, g.Pix)
	return c
}

// Bilinear samples at a fractional coordinate (pixel centres at integers).
func (g *Gray) Bilinear(x, y float64) float32 {
	x0 := int(math.Floor(x))
	y0 := int(math.Floor(y))
	fx := float32(x - float64(x0))
	fy := float32(y - float64(y0))
	a, b := g.At(x0, y0), g.At(x0+1, y0)
	c, d := g.At(x0, y0+1), g.At(x0+1, y0+1)
	return (a*(1-fx)+b*fx)*(1-fy) + (c*(1-fx)+d*fx)*fy
}

// ImageInfo describes what the decoder saw.
type ImageInfo struct {
	Format   string `json:"format"`
	Width    int    `json:"width"`
	Height   int    `json:"height"`
	BitDepth int    `json:"bitDepth"`
}

// MaxPixels guards against decompression bombs.
const MaxPixels = 64 << 20

// Decode reads PNG, JPEG or baseline TIFF/GeoTIFF bytes into a Gray image.
// Images deeper than 8 bits are percentile-stretched into 0..255.
func Decode(data []byte) (*Gray, ImageInfo, error) {
	if len(data) < 8 {
		return nil, ImageInfo{}, errors.New("file too small to be an image")
	}
	switch {
	case bytes.HasPrefix(data, []byte("\x89PNG")):
		cfg, err := png.DecodeConfig(bytes.NewReader(data))
		if err != nil {
			return nil, ImageInfo{}, err
		}
		if cfg.Width*cfg.Height > MaxPixels {
			return nil, ImageInfo{}, errors.New("image too large")
		}
		img, err := png.Decode(bytes.NewReader(data))
		if err != nil {
			return nil, ImageInfo{}, err
		}
		return fromStd(img, "png")
	case bytes.HasPrefix(data, []byte{0xFF, 0xD8}):
		cfg, err := jpeg.DecodeConfig(bytes.NewReader(data))
		if err != nil {
			return nil, ImageInfo{}, err
		}
		if cfg.Width*cfg.Height > MaxPixels {
			return nil, ImageInfo{}, errors.New("image too large")
		}
		img, err := jpeg.Decode(bytes.NewReader(data))
		if err != nil {
			return nil, ImageInfo{}, err
		}
		return fromStd(img, "jpeg")
	case bytes.HasPrefix(data, []byte("II*\x00")), bytes.HasPrefix(data, []byte("MM\x00*")):
		return decodeTIFF(data)
	}
	return nil, ImageInfo{}, errors.New("unsupported format: use PNG, JPEG or TIFF/GeoTIFF")
}

func fromStd(img image.Image, format string) (*Gray, ImageInfo, error) {
	b := img.Bounds()
	w, h := b.Dx(), b.Dy()
	if w < 32 || h < 32 {
		return nil, ImageInfo{}, errors.New("image smaller than 32x32")
	}
	g := NewGray(w, h)
	depth := 8
	switch img.(type) {
	case *image.Gray16, *image.RGBA64, *image.NRGBA64:
		depth = 16
	}
	for y := 0; y < h; y++ {
		for x := 0; x < w; x++ {
			r, gg, bb, _ := img.At(b.Min.X+x, b.Min.Y+y).RGBA()
			l := 0.2126*float64(r) + 0.7152*float64(gg) + 0.0722*float64(bb)
			g.Pix[y*w+x] = float32(l / 257.0)
		}
	}
	if depth > 8 {
		StretchPercentile(g, 0.5, 99.5)
	}
	return g, ImageInfo{Format: format, Width: w, Height: h, BitDepth: depth}, nil
}

// StretchPercentile maps the [lo,hi] percentile range onto 0..255 in place.
func StretchPercentile(g *Gray, lo, hi float64) {
	if len(g.Pix) == 0 {
		return
	}
	step := 1
	if len(g.Pix) > 400000 {
		step = len(g.Pix) / 400000
	}
	s := make([]float64, 0, len(g.Pix)/step+1)
	for i := 0; i < len(g.Pix); i += step {
		s = append(s, float64(g.Pix[i]))
	}
	sort.Float64s(s)
	a := s[int(float64(len(s)-1)*lo/100)]
	b := s[int(float64(len(s)-1)*hi/100)]
	if b-a < 1e-6 {
		b = a + 1
	}
	k := float32(255 / (b - a))
	for i, v := range g.Pix {
		v = (v - float32(a)) * k
		if v < 0 {
			v = 0
		} else if v > 255 {
			v = 255
		}
		g.Pix[i] = v
	}
}

func gaussKernel(sigma float64) []float32 {
	r := int(math.Ceil(3 * sigma))
	if r < 1 {
		r = 1
	}
	k := make([]float32, 2*r+1)
	var sum float32
	for i := -r; i <= r; i++ {
		v := float32(math.Exp(-float64(i*i) / (2 * sigma * sigma)))
		k[i+r] = v
		sum += v
	}
	for i := range k {
		k[i] /= sum
	}
	return k
}

// Blur applies a separable Gaussian blur and returns a new image.
func Blur(g *Gray, sigma float64) *Gray {
	if sigma <= 0 {
		return g.Clone()
	}
	k := gaussKernel(sigma)
	r := len(k) / 2
	tmp := NewGray(g.W, g.H)
	for y := 0; y < g.H; y++ {
		row := g.Pix[y*g.W : (y+1)*g.W]
		for x := 0; x < g.W; x++ {
			var s float32
			for i := -r; i <= r; i++ {
				xx := x + i
				if xx < 0 {
					xx = 0
				} else if xx >= g.W {
					xx = g.W - 1
				}
				s += row[xx] * k[i+r]
			}
			tmp.Pix[y*g.W+x] = s
		}
	}
	out := NewGray(g.W, g.H)
	for y := 0; y < g.H; y++ {
		for x := 0; x < g.W; x++ {
			var s float32
			for i := -r; i <= r; i++ {
				yy := y + i
				if yy < 0 {
					yy = 0
				} else if yy >= g.H {
					yy = g.H - 1
				}
				s += tmp.Pix[yy*g.W+x] * k[i+r]
			}
			out.Pix[y*g.W+x] = s
		}
	}
	return out
}

// Resize scales an image to w x h (anti-aliased when shrinking).
func Resize(g *Gray, w, h int) *Gray {
	if w == g.W && h == g.H {
		return g.Clone()
	}
	src := g
	if w < g.W {
		src = Blur(g, 0.5*float64(g.W)/float64(w))
	}
	out := NewGray(w, h)
	sx := float64(g.W) / float64(w)
	sy := float64(g.H) / float64(h)
	for y := 0; y < h; y++ {
		for x := 0; x < w; x++ {
			out.Pix[y*w+x] = src.Bilinear((float64(x)+0.5)*sx-0.5, (float64(y)+0.5)*sy-0.5)
		}
	}
	return out
}

// LimitSize shrinks g so its longest side is at most maxDim.
// It returns the image and the applied scale factor (<=1).
func LimitSize(g *Gray, maxDim int) (*Gray, float64) {
	m := g.W
	if g.H > m {
		m = g.H
	}
	if maxDim <= 0 || m <= maxDim {
		return g, 1
	}
	s := float64(maxDim) / float64(m)
	w := int(math.Round(float64(g.W) * s))
	h := int(math.Round(float64(g.H) * s))
	return Resize(g, w, h), s
}

// Pyramid builds a Gaussian pyramid with scale factor 2 between levels.
func Pyramid(g *Gray, levels int) []*Gray {
	out := []*Gray{g}
	for i := 1; i < levels; i++ {
		p := out[i-1]
		if p.W < 80 || p.H < 80 {
			break
		}
		b := Blur(p, 1.2)
		n := NewGray(p.W/2, p.H/2)
		for y := 0; y < n.H; y++ {
			for x := 0; x < n.W; x++ {
				n.Pix[y*n.W+x] = b.Pix[(2*y)*b.W+2*x]
			}
		}
		out = append(out, n)
	}
	return out
}

// EncodePNG renders a Gray as an 8-bit grayscale PNG.
func EncodePNG(g *Gray) []byte {
	img := image.NewGray(image.Rect(0, 0, g.W, g.H))
	for i, v := range g.Pix {
		img.Pix[i] = clamp8(v)
	}
	var buf bytes.Buffer
	_ = png.Encode(&buf, img)
	return buf.Bytes()
}

func clamp8(v float32) uint8 {
	if v <= 0 {
		return 0
	}
	if v >= 255 {
		return 255
	}
	return uint8(v + 0.5)
}
