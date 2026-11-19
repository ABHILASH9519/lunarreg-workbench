// Package charts renders small dependency-free SVG charts. Styling is done
// by CSS classes (see web/app.css) so charts follow the app theme.
package charts

import (
	"fmt"
	"html"
	"math"
	"sort"
	"strings"
)

// Point is one labelled sample of a line chart.
type Point struct {
	Label string
	Value float64
}

func empty(w, h int, msg string) string {
	return fmt.Sprintf(`<svg viewBox="0 0 %d %d" class="chart" role="img" aria-label="%s"><text x="%d" y="%d" class="ch-empty" text-anchor="middle">%s</text></svg>`,
		w, h, html.EscapeString(msg), w/2, h/2, html.EscapeString(msg))
}

// Line draws a line/area chart with dots and native tooltips.
func Line(pts []Point, unit string) string {
	const w, h, l, r, t, b = 480, 200, 44, 14, 14, 26
	if len(pts) == 0 {
		return empty(w, h, "No completed runs yet")
	}
	lo, hi := math.Inf(1), math.Inf(-1)
	for _, p := range pts {
		lo, hi = math.Min(lo, p.Value), math.Max(hi, p.Value)
	}
	lo = math.Min(lo, 0)
	if hi-lo < 1e-9 {
		hi = lo + 1
	}
	hi *= 1.1
	x := func(i int) float64 {
		if len(pts) == 1 {
			return float64(l+w-r) / 2
		}
		return float64(l) + float64(i)*float64(w-l-r)/float64(len(pts)-1)
	}
	y := func(v float64) float64 { return float64(h-b) - (v-lo)/(hi-lo)*float64(h-t-b) }
	var s strings.Builder
	fmt.Fprintf(&s, `<svg viewBox="0 0 %d %d" class="chart" role="img" aria-label="Trend of %s">`, w, h, unit)
	for i := 0; i <= 4; i++ {
		v := lo + (hi-lo)*float64(i)/4
		fmt.Fprintf(&s, `<line x1="%d" x2="%d" y1="%.1f" y2="%.1f" class="ch-grid"/><text x="%d" y="%.1f" class="ch-axis" text-anchor="end">%.2f</text>`, l, w-r, y(v), y(v), l-6, y(v)+3, v)
	}
	var line, area strings.Builder
	for i, p := range pts {
		cmd := "L"
		if i == 0 {
			cmd = "M"
		}
		fmt.Fprintf(&line, "%s%.1f %.1f ", cmd, x(i), y(p.Value))
	}
	fmt.Fprintf(&area, "%sL%.1f %d L%.1f %d Z", line.String(), x(len(pts)-1), h-b, x(0), h-b)
	fmt.Fprintf(&s, `<path d="%s" class="ch-area"/><path d="%s" class="ch-line" pathLength="1"/>`, area.String(), strings.TrimSpace(line.String()))
	for i, p := range pts {
		fmt.Fprintf(&s, `<circle cx="%.1f" cy="%.1f" r="3.5" class="ch-dot"><title>%s: %.3f %s</title></circle>`, x(i), y(p.Value), html.EscapeString(p.Label), p.Value, unit)
	}
	fmt.Fprintf(&s, `<text x="%d" y="%d" class="ch-axis">%s</text></svg>`, l, h-6, html.EscapeString(unit))
	return s.String()
}

// Bars draws horizontal bars sorted by value descending. color is a CSS
// class suffix chosen per label via classes (may be nil).
func Bars(vals map[string]float64, classes map[string]string, fmtVal string) string {
	const w, rowH, l, r = 480, 34, 110, 50
	if len(vals) == 0 {
		return empty(w, 120, "No data yet")
	}
	type kv struct {
		k string
		v float64
	}
	var kvs []kv
	var mx float64
	for k, v := range vals {
		kvs = append(kvs, kv{k, v})
		mx = math.Max(mx, v)
	}
	sort.Slice(kvs, func(i, j int) bool {
		if kvs[i].v != kvs[j].v {
			return kvs[i].v > kvs[j].v
		}
		return kvs[i].k < kvs[j].k
	})
	if mx <= 0 {
		mx = 1
	}
	h := len(kvs)*rowH + 12
	var s strings.Builder
	fmt.Fprintf(&s, `<svg viewBox="0 0 %d %d" class="chart" role="img" aria-label="Bar chart">`, w, h)
	for i, e := range kvs {
		y := 6 + i*rowH
		bw := e.v / mx * float64(w-l-r)
		cls := "ch-bar"
		if c := classes[e.k]; c != "" {
			cls += " " + c
		}
		fmt.Fprintf(&s, `<text x="%d" y="%d" class="ch-label" text-anchor="end">%s</text><rect x="%d" y="%d" width="%.1f" height="18" rx="4" class="%s" style="animation-delay:%dms"><title>%s: %s</title></rect><text x="%.1f" y="%d" class="ch-val">%s</text>`,
			l-8, y+13, html.EscapeString(e.k), l, y, math.Max(bw, 2), cls, i*70,
			html.EscapeString(e.k), fmt.Sprintf(fmtVal, e.v), float64(l)+bw+6, y+13, fmt.Sprintf(fmtVal, e.v))
	}
	s.WriteString(`</svg>`)
	return s.String()
}
