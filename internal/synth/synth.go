// Package synth procedurally renders lunar-like terrain image pairs with a
// known ground-truth source->reference transform. Pairs are SYNTHETIC SAMPLE
// DATA, never mission imagery; they exist so the engine can be validated
// against exact geometry and so the app is usable with no uploads.
package synth

import (
	"math"
	"math/rand"
	"sync"

	"lunarreg/internal/cv"
)

// Spec defines one sample pair.
type Spec struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Sensor      string  `json:"sensor"`
	Description string  `json:"description"`
	Difficulty  string  `json:"difficulty"`
	Seed        int64   `json:"seed"`
	Size        int     `json:"size"`
	RotDeg      float64 `json:"rotationDeg"`
	Scale       float64 `json:"scale"`
	TX          float64 `json:"tx"`
	TY          float64 `json:"ty"`
	Shear       float64 `json:"shear"`
	PerspX      float64 `json:"perspX"`
	PerspY      float64 `json:"perspY"`
	SunRefAz    float64 `json:"sunRefAz"`
	SunRefEl    float64 `json:"sunRefEl"`
	SunSrcAz    float64 `json:"sunSrcAz"`
	SunSrcEl    float64 `json:"sunSrcEl"`
	Noise       float64 `json:"noise"`
	Contrast    float64 `json:"contrast"`
	Brightness  float64 `json:"brightness"`
	Model       string  `json:"truthModel"`
}

// Pair is a rendered sample with PNG bytes and the exact truth matrix.
type Pair struct {
	Spec   Spec
	Src    []byte
	Ref    []byte
	Matrix cv.Mat3
}

// Specs is the bundled catalogue.
func Specs() []Spec {
	return []Spec{
		{ID: "ohrc-crater-field", Name: "OHRC Crater Field", Sensor: "OHRC-like", Difficulty: "easy", Seed: 11, Size: 512,
			Description: "Dense crater field, rotated 12° and scaled 1.08× with a small 8° sun azimuth change.",
			RotDeg:      12, Scale: 1.08, TX: 18, TY: -12, SunRefAz: 300, SunRefEl: 32, SunSrcAz: 308, SunSrcEl: 30, Noise: 2, Contrast: 1, Model: "similarity"},
		{ID: "tmc2-affine", Name: "TMC-2 Sheared Mosaic", Sensor: "TMC-2-like", Difficulty: "medium", Seed: 23, Size: 512,
			Description: "Pushbroom-style shear and anisotropy on rolling highland terrain.",
			RotDeg:      -8, Scale: 0.95, TX: -14, TY: 10, Shear: 0.07, SunRefAz: 280, SunRefEl: 35, SunSrcAz: 288, SunSrcEl: 33, Noise: 3, Contrast: 0.9, Brightness: 6, Model: "affine"},
		{ID: "lro-nac-perspective", Name: "LRO NAC Off-Nadir", Sensor: "LRO NAC-like", Difficulty: "medium", Seed: 37, Size: 512,
			Description: "Off-nadir perspective distortion requiring a full homography.",
			RotDeg:      5, Scale: 1.02, TX: 10, TY: 8, PerspX: 0.00035, PerspY: -0.00025, SunRefAz: 290, SunRefEl: 30, SunSrcAz: 297, SunSrcEl: 32, Noise: 2.5, Contrast: 1.1, Model: "homography"},
		{ID: "iirs-low-sun", Name: "IIRS Low-Sun Contrast", Sensor: "IIRS-like", Difficulty: "hard", Seed: 51, Size: 512,
			Description: "Moderate illumination change (38° vs 26° elevation) with 20° rotation and 1.15× scale.",
			RotDeg:      20, Scale: 1.15, TX: -22, TY: 16, SunRefAz: 270, SunRefEl: 38, SunSrcAz: 278, SunSrcEl: 26, Noise: 3, Contrast: 0.8, Brightness: -8, Model: "similarity"},
		{ID: "selene-noisy", Name: "SELENE Noisy Strip", Sensor: "SELENE TC-like", Difficulty: "hard", Seed: 67, Size: 512,
			Description: "Heavy sensor noise, -15° rotation and 0.9× scale.",
			RotDeg:      -15, Scale: 0.9, TX: 12, TY: -18, SunRefAz: 295, SunRefEl: 30, SunSrcAz: 305, SunSrcEl: 27, Noise: 9, Contrast: 0.85, Model: "similarity"},
	}
}

// TruthMatrix builds the source->reference matrix for a spec.
func (s Spec) TruthMatrix() cv.Mat3 {
	c := float64(s.Size-1) / 2
	r := s.RotDeg * math.Pi / 180
	cs, sn := math.Cos(r)*s.Scale, math.Sin(r)*s.Scale
	lin := cv.Mat3{cs, -sn + s.Shear*cs, 0, sn, cs + s.Shear*sn, 0, s.PerspX, s.PerspY, 1}
	toC := cv.Mat3{1, 0, -c, 0, 1, -c, 0, 0, 1}
	back := cv.Mat3{1, 0, c + s.TX, 0, 1, c + s.TY, 0, 0, 1}
	m := back.Mul(lin).Mul(toC)
	for i := range m {
		m[i] /= m[8]
	}
	return m
}

const pad = 160

type height struct {
	n int
	h []float32
}

func hash(x, y int, seed int64) float64 {
	n := uint64(x)*374761393 + uint64(y)*668265263 + uint64(seed)*2246822519
	n = (n ^ (n >> 13)) * 1274126177
	return float64((n^(n>>16))&0xFFFFFF) / float64(0xFFFFFF)
}

func vnoise(x, y float64, seed int64) float64 {
	xi, yi := int(math.Floor(x)), int(math.Floor(y))
	fx, fy := x-float64(xi), y-float64(yi)
	fx, fy = fx*fx*(3-2*fx), fy*fy*(3-2*fy)
	a, b := hash(xi, yi, seed), hash(xi+1, yi, seed)
	c, d := hash(xi, yi+1, seed), hash(xi+1, yi+1, seed)
	return (a*(1-fx)+b*fx)*(1-fy) + (c*(1-fx)+d*fx)*fy
}

func fbm(x, y float64, seed int64, oct int) float64 {
	var s, amp, norm float64 = 0, 1, 0
	f := 1.0
	for i := 0; i < oct; i++ {
		s += amp * vnoise(x*f, y*f, seed+int64(i)*131)
		norm += amp
		amp *= 0.5
		f *= 2
	}
	return s / norm
}

func buildHeight(seed int64, size int) *height {
	n := size + 2*pad
	hm := &height{n: n, h: make([]float32, n*n)}
	for y := 0; y < n; y++ {
		for x := 0; x < n; x++ {
			hm.h[y*n+x] = float32(fbm(float64(x)/90, float64(y)/90, seed, 5)*22 + fbm(float64(x)/9, float64(y)/9, seed+9, 3)*2.2)
		}
	}
	rng := rand.New(rand.NewSource(seed))
	for i := 0; i < 260; i++ {
		R := 5 + math.Pow(rng.Float64(), 2.6)*72
		cx, cy := rng.Float64()*float64(n), rng.Float64()*float64(n)
		depth := R * (0.16 + rng.Float64()*0.12)
		rim := depth * 0.45
		ext := R * 1.6
		for y := int(cy - ext); y <= int(cy+ext); y++ {
			if y < 0 || y >= n {
				continue
			}
			for x := int(cx - ext); x <= int(cx+ext); x++ {
				if x < 0 || x >= n {
					continue
				}
				r := math.Hypot(float64(x)-cx, float64(y)-cy) / R
				var dh float64
				if r < 1 {
					dh = -depth * (1 - r*r)
				}
				dh += rim * math.Exp(-math.Pow((r-1)/0.18, 2))
				hm.h[y*n+x] += float32(dh)
			}
		}
	}
	return hm
}

// shade renders a Lambertian shaded terrain with a sun az/el (degrees).
func (hm *height) shade(az, el float64, seed int64) *cv.Gray {
	n := hm.n
	out := cv.NewGray(n, n)
	a, e := az*math.Pi/180, el*math.Pi/180
	lx, ly, lz := math.Cos(e)*math.Cos(a), math.Cos(e)*math.Sin(a), math.Sin(e)
	at := func(x, y int) float64 {
		x, y = clampI(x, 0, n-1), clampI(y, 0, n-1)
		return float64(hm.h[y*n+x])
	}
	for y := 0; y < n; y++ {
		for x := 0; x < n; x++ {
			dx := (at(x+1, y) - at(x-1, y)) / 2
			dy := (at(x, y+1) - at(x, y-1)) / 2
			nx, ny, nz := -dx*1.6, -dy*1.6, 1.0
			l := math.Sqrt(nx*nx + ny*ny + nz*nz)
			dot := (nx*lx + ny*ly + nz*lz) / l
			v := 120 * dot / math.Max(math.Sin(e), 0.25)
			albedo := 0.85 + 0.3*fbm(float64(x)/5, float64(y)/5, seed+77, 3)
			out.Pix[y*n+x] = float32(math.Max(0, math.Min(255, v*albedo+25)))
		}
	}
	return out
}

func clampI(v, lo, hi int) int {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}

// Render produces the pair for a spec.
func Render(s Spec) Pair {
	hm := buildHeight(s.Seed, s.Size)
	lRef := hm.shade(s.SunRefAz, s.SunRefEl, s.Seed)
	lSrc := hm.shade(s.SunSrcAz, s.SunSrcEl, s.Seed)
	rng := rand.New(rand.NewSource(s.Seed * 7))
	m := s.TruthMatrix()
	ref := cv.NewGray(s.Size, s.Size)
	src := cv.NewGray(s.Size, s.Size)
	for y := 0; y < s.Size; y++ {
		for x := 0; x < s.Size; x++ {
			ref.Pix[y*s.Size+x] = lRef.Bilinear(float64(x+pad), float64(y+pad)) + float32(rng.NormFloat64()*s.Noise*0.5)
			tx, ty, ok := m.Apply(float64(x), float64(y))
			v := float32(40)
			if ok {
				v = lSrc.Bilinear(tx+pad, ty+pad)
			}
			v = (v-128)*float32(s.contrast()) + 128 + float32(s.Brightness) + float32(rng.NormFloat64()*s.Noise)
			src.Pix[y*s.Size+x] = v
		}
	}
	return Pair{Spec: s, Src: cv.EncodePNG(src), Ref: cv.EncodePNG(ref), Matrix: m}
}

func (s Spec) contrast() float64 {
	if s.Contrast == 0 {
		return 1
	}
	return s.Contrast
}

var (
	once  sync.Once
	cache map[string]Pair
)

// All renders (once) and returns every bundled pair keyed by ID.
func All() map[string]Pair {
	once.Do(func() {
		specs := Specs()
		cache = map[string]Pair{}
		var mu sync.Mutex
		var wg sync.WaitGroup
		for _, s := range specs {
			wg.Add(1)
			go func(s Spec) {
				defer wg.Done()
				p := Render(s)
				mu.Lock()
				cache[s.ID] = p
				mu.Unlock()
			}(s)
		}
		wg.Wait()
	})
	return cache
}

// CornerError returns the RMS distance (px) between two transforms applied
// to the corners and centre of a size x size frame.
func CornerError(a, b cv.Mat3, size int) float64 {
	s := float64(size - 1)
	pts := [][2]float64{{0, 0}, {s, 0}, {0, s}, {s, s}, {s / 2, s / 2}}
	var sum float64
	for _, p := range pts {
		x1, y1, _ := a.Apply(p[0], p[1])
		x2, y2, _ := b.Apply(p[0], p[1])
		sum += (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2)
	}
	return math.Sqrt(sum / float64(len(pts)))
}
