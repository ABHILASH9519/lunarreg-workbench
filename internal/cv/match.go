package cv

import "sort"

// Match links source feature I to reference feature J.
type Match struct {
	I, J  int
	Dist  int
	Ratio float64
}

// MatchParams controls descriptor matching.
type MatchParams struct {
	Ratio      float64
	CrossCheck bool
	MaxDist    int
}

type nn struct{ best, second, bi int }

func nearest(q Desc, set []Desc) nn {
	r := nn{best: 1 << 30, second: 1 << 30, bi: -1}
	for j, d := range set {
		h := Hamming(q, d)
		if h < r.best {
			r.second = r.best
			r.best = h
			r.bi = j
		} else if h < r.second {
			r.second = h
		}
	}
	return r
}

// MatchDescriptors performs brute-force Hamming matching with Lowe's ratio
// test and an optional mutual-nearest-neighbour cross check.
func MatchDescriptors(a, b []Desc, p MatchParams) []Match {
	if len(a) == 0 || len(b) < 2 {
		return nil
	}
	back := make([]int, len(b))
	if p.CrossCheck {
		for j := range b {
			back[j] = nearest(b[j], a).bi
		}
	}
	maxd := p.MaxDist
	if maxd <= 0 {
		maxd = 110
	}
	var out []Match
	for i := range a {
		r := nearest(a[i], b)
		if r.bi < 0 || r.best > maxd {
			continue
		}
		ratio := 0.0
		if r.second > 0 && r.second < 1<<30 {
			ratio = float64(r.best) / float64(r.second)
		}
		if ratio >= p.Ratio {
			continue
		}
		if p.CrossCheck && back[r.bi] != i {
			continue
		}
		out = append(out, Match{I: i, J: r.bi, Dist: r.best, Ratio: ratio})
	}
	return out
}

// GridFilter keeps at most maxPerCell best matches per cell of a
// cells x cells grid laid over the source frame, preventing clusters from
// dominating the geometric fit. cells<=1 disables filtering.
func GridFilter(ms []Match, kp []Keypoint, w, h, cells, maxPerCell int) []Match {
	if cells <= 1 || maxPerCell <= 0 {
		return ms
	}
	buckets := map[int][]Match{}
	for _, m := range ms {
		x, y := int(kp[m.I].X)*cells/w, int(kp[m.I].Y)*cells/h
		x, y = clampi(x, 0, cells-1), clampi(y, 0, cells-1)
		buckets[y*cells+x] = append(buckets[y*cells+x], m)
	}
	var out []Match
	for _, b := range buckets {
		sort.Slice(b, func(i, j int) bool { return b[i].Dist < b[j].Dist })
		if len(b) > maxPerCell {
			b = b[:maxPerCell]
		}
		out = append(out, b...)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].I < out[j].I })
	return out
}
