package server

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"lunarreg/internal/charts"
	"lunarreg/internal/cv"
	"lunarreg/internal/store"
	"lunarreg/internal/synth"
)

const maxUpload = 20 << 20

func (s *Server) routes(m *http.ServeMux) {
	m.HandleFunc("GET /api/health", s.health)
	m.HandleFunc("GET /api/stats", s.stats)
	m.HandleFunc("GET /api/samples", s.samples)
	m.HandleFunc("GET /api/samples/{id}/{which}", s.sampleImage)
	m.HandleFunc("GET /api/defaults", func(w http.ResponseWriter, r *http.Request) { writeJSON(w, 200, cv.DefaultParams()) })
	m.HandleFunc("GET /api/charts/{name}", s.chart)
	m.HandleFunc("GET /api/benchmark", s.benchmark)
	m.HandleFunc("GET /api/study", s.study)
	m.HandleFunc("GET /api/jobs", s.listJobs)
	m.HandleFunc("POST /api/jobs", s.createJob)
	m.HandleFunc("GET /api/jobs/{id}", s.getJob)
	m.HandleFunc("DELETE /api/jobs/{id}", s.deleteJob)
	m.HandleFunc("POST /api/jobs/{id}/cancel", s.cancelJob)
	m.HandleFunc("POST /api/jobs/{id}/rerun", s.rerunJob)
	m.HandleFunc("POST /api/jobs/{id}/sweep", s.sweepJob)
	m.HandleFunc("GET /api/jobs/{id}/events", s.events)
	m.HandleFunc("GET /api/jobs/{id}/image/{kind}", s.jobImage)
	m.HandleFunc("GET /api/jobs/{id}/correspondences.csv", s.csvExport)
	m.HandleFunc("GET /api/jobs/{id}/result.json", s.jsonExport)
	m.HandleFunc("GET /api/jobs/{id}/export.zip", s.zipExport)
}

func (s *Server) health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, map[string]any{
		"status": "ok", "version": Version, "uptimeSec": int(time.Since(s.started).Seconds()),
		"workers": s.workers, "queued": len(s.queue), "engine": "go-orb-ransac",
	})
}

func (s *Server) samples(w http.ResponseWriter, r *http.Request) {
	type item struct {
		synth.Spec
		Truth cv.Mat3 `json:"truthMatrix"`
		Label string  `json:"label"`
	}
	var out []item
	for _, sp := range synth.Specs() {
		out = append(out, item{sp, sp.TruthMatrix(), "SAMPLE DATA (synthetic)"})
	}
	writeJSON(w, 200, out)
}

func (s *Server) sampleImage(w http.ResponseWriter, r *http.Request) {
	p, ok := synth.All()[r.PathValue("id")]
	if !ok {
		writeErr(w, 404, "unknown sample")
		return
	}
	b := p.Src
	switch r.PathValue("which") {
	case "source.png":
	case "reference.png":
		b = p.Ref
	default:
		writeErr(w, 404, "unknown image")
		return
	}
	w.Header().Set("Content-Type", "image/png")
	w.Header().Set("Cache-Control", "public, max-age=86400")
	_, _ = w.Write(b)
}

type jobView struct {
	store.Job
	Duration int64 `json:"durationMs,omitempty"`
}

func view(j store.Job) jobView {
	v := jobView{Job: j}
	if j.StartedAt != nil && j.FinishedAt != nil {
		v.Duration = j.FinishedAt.Sub(*j.StartedAt).Milliseconds()
	}
	return v
}

func (s *Server) listJobs(w http.ResponseWriter, r *http.Request) {
	js := s.st.List(ownerOf(r))
	out := make([]jobView, 0, len(js))
	for _, j := range js {
		if j.Result != nil { // list view stays light: drop per-point data
			c := *j.Result
			c.Corrs = nil
			j.Result = &c
		}
		out = append(out, view(j))
	}
	writeJSON(w, 200, out)
}

func (s *Server) getJob(w http.ResponseWriter, r *http.Request) {
	j, ok := s.st.Get(r.PathValue("id"), ownerOf(r))
	if !ok {
		writeErr(w, 404, "job not found")
		return
	}
	writeJSON(w, 200, view(j))
}

func (s *Server) deleteJob(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if _, ok := s.st.Get(id, ownerOf(r)); !ok {
		writeErr(w, 404, "job not found")
		return
	}
	s.Cancel(id)
	s.st.Delete(id, ownerOf(r))
	writeJSON(w, 200, map[string]bool{"deleted": true})
}

func (s *Server) cancelJob(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if _, ok := s.st.Get(id, ownerOf(r)); !ok {
		writeErr(w, 404, "job not found")
		return
	}
	s.Cancel(id)
	writeJSON(w, 200, map[string]bool{"cancelled": true})
}

func parseParams(raw string) (cv.Params, error) {
	p := cv.DefaultParams()
	if strings.TrimSpace(raw) != "" {
		dec := json.NewDecoder(strings.NewReader(raw))
		dec.DisallowUnknownFields()
		if err := dec.Decode(&p); err != nil {
			return p, fmt.Errorf("invalid params: %v", err)
		}
	}
	return p, p.Validate()
}

func (s *Server) newJob(owner, name string, p cv.Params, srcIn, refIn store.Input, sb, rb []byte, truth *cv.Mat3) (*store.Job, error) {
	j := &store.Job{ID: store.NewID(), Owner: owner, Name: name, Status: store.Queued, CreatedAt: time.Now(),
		Params: p, Source: srcIn, Reference: refIn, Truth: truth,
		Log: []store.LogLine{{T: time.Now(), Stage: "queued", Msg: "Job queued"}}}
	if err := s.st.Create(j, sb, rb); err != nil {
		return nil, err
	}
	if !s.Enqueue(j.ID) {
		s.st.Delete(j.ID, owner)
		return nil, fmt.Errorf("server busy: queue is full")
	}
	return j, nil
}

func readUpload(r *http.Request, field string) ([]byte, string, error) {
	f, hdr, err := r.FormFile(field)
	if err != nil {
		return nil, "", err
	}
	defer f.Close()
	if hdr.Size > maxUpload {
		return nil, "", fmt.Errorf("%s exceeds the 20 MB limit", field)
	}
	b, err := io.ReadAll(io.LimitReader(f, maxUpload+1))
	return b, hdr.Filename, err
}

func (s *Server) createJob(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 2*maxUpload+(1<<20))
	if err := r.ParseMultipartForm(8 << 20); err != nil {
		writeErr(w, 400, "invalid form or upload too large (20 MB per file)")
		return
	}
	p, err := parseParams(r.FormValue("params"))
	if err != nil {
		writeErr(w, 400, err.Error())
		return
	}
	var sb, rb []byte
	var srcIn, refIn store.Input
	var truth *cv.Mat3
	name := strings.TrimSpace(r.FormValue("name"))
	if sid := r.FormValue("sample"); sid != "" {
		pair, ok := synth.All()[sid]
		if !ok {
			writeErr(w, 400, "unknown sample")
			return
		}
		sb, rb = pair.Src, pair.Ref
		srcIn = store.Input{Name: pair.Spec.Name + " (source)", Kind: "sample", SampleID: sid}
		refIn = store.Input{Name: pair.Spec.Name + " (reference)", Kind: "sample", SampleID: sid}
		t := pair.Matrix
		truth = &t
		if name == "" {
			name = pair.Spec.Name
		}
	} else {
		var fn1, fn2 string
		var e1, e2 error
		sb, fn1, e1 = readUpload(r, "source")
		rb, fn2, e2 = readUpload(r, "reference")
		if e1 != nil || e2 != nil {
			writeErr(w, 400, "both a source and a reference image are required")
			return
		}
		srcIn = store.Input{Name: fn1, Kind: "upload"}
		refIn = store.Input{Name: fn2, Kind: "upload"}
		if name == "" {
			name = fn1 + " → " + fn2
		}
	}
	var e1, e2 error
	var i1, i2 cv.ImageInfo
	_, i1, e1 = cv.Decode(sb)
	_, i2, e2 = cv.Decode(rb)
	if e1 != nil {
		writeErr(w, 422, "source image: "+e1.Error())
		return
	}
	if e2 != nil {
		writeErr(w, 422, "reference image: "+e2.Error())
		return
	}
	srcIn.Info, refIn.Info = i1, i2
	if len(name) > 120 {
		name = name[:120]
	}
	j, err := s.newJob(ownerOf(r), name, p, srcIn, refIn, sb, rb, truth)
	if err != nil {
		writeErr(w, 503, err.Error())
		return
	}
	writeJSON(w, 202, map[string]string{"id": j.ID})
}

func (s *Server) rerunJob(w http.ResponseWriter, r *http.Request) {
	old, ok := s.st.Get(r.PathValue("id"), ownerOf(r))
	if !ok {
		writeErr(w, 404, "job not found")
		return
	}
	p := old.Params
	body, _ := io.ReadAll(io.LimitReader(r.Body, 1<<16))
	if len(bytes.TrimSpace(body)) > 0 {
		dec := json.NewDecoder(bytes.NewReader(body))
		dec.DisallowUnknownFields()
		if err := dec.Decode(&p); err != nil {
			writeErr(w, 400, "invalid params: "+err.Error())
			return
		}
	}
	if err := p.Validate(); err != nil {
		writeErr(w, 400, err.Error())
		return
	}
	sb, e1 := s.st.ReadInput(old.ID, "source")
	rb, e2 := s.st.ReadInput(old.ID, "reference")
	if e1 != nil || e2 != nil {
		writeErr(w, 410, "original inputs are no longer available")
		return
	}
	j, err := s.newJob(ownerOf(r), old.Name+" (re-run)", p, old.Source, old.Reference, sb, rb, old.Truth)
	if err != nil {
		writeErr(w, 503, err.Error())
		return
	}
	writeJSON(w, 202, map[string]string{"id": j.ID})
}

func (s *Server) events(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	j, ok := s.st.Get(id, ownerOf(r))
	if !ok {
		writeErr(w, 404, "job not found")
		return
	}
	fl, ok := w.(http.Flusher)
	if !ok {
		writeErr(w, 500, "streaming unsupported")
		return
	}
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("X-Accel-Buffering", "no")
	send := func(e Event) {
		b, _ := json.Marshal(e)
		fmt.Fprintf(w, "data: %s\n\n", b)
		fl.Flush()
	}
	ch, unsub := s.subscribe(id)
	defer unsub()
	switch j.Status {
	case store.Completed, store.Failed, store.Cancelled:
		send(Event{Type: "done", Status: j.Status, Progress: 1, Msg: j.Error})
		return
	}
	send(Event{Type: "progress", Stage: j.Stage, Progress: j.Progress, Msg: "connected"})
	tick := time.NewTicker(15 * time.Second)
	defer tick.Stop()
	for {
		select {
		case <-r.Context().Done():
			return
		case <-tick.C:
			fmt.Fprint(w, ": ping\n\n")
			fl.Flush()
		case e := <-ch:
			send(e)
			if e.Type == "done" {
				return
			}
		}
	}
}

func (s *Server) jobImage(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if _, ok := s.st.Get(id, ownerOf(r)); !ok {
		writeErr(w, 404, "job not found")
		return
	}
	kind := strings.TrimSuffix(r.PathValue("kind"), ".png")
	b, err := s.st.ReadImage(id, kind)
	if err != nil {
		writeErr(w, 404, "image not available")
		return
	}
	w.Header().Set("Content-Type", "image/png")
	w.Header().Set("Cache-Control", "private, max-age=3600")
	_, _ = w.Write(b)
}

func corrCSV(res *cv.Result) []byte {
	var buf bytes.Buffer
	cw := csv.NewWriter(&buf)
	_ = cw.Write([]string{"index", "source_x", "source_y", "reference_x", "reference_y", "hamming", "reprojection_error_px", "pyramid_level", "inlier"})
	for i, c := range res.Corrs {
		_ = cw.Write([]string{strconv.Itoa(i), f(c.SX), f(c.SY), f(c.RX), f(c.RY), strconv.Itoa(c.Dist), f(c.Err), strconv.Itoa(c.Level), strconv.FormatBool(c.Inlier)})
	}
	cw.Flush()
	return buf.Bytes()
}

func f(v float64) string { return strconv.FormatFloat(v, 'f', 3, 64) }

func (s *Server) finishedJob(w http.ResponseWriter, r *http.Request) (store.Job, bool) {
	j, ok := s.st.Get(r.PathValue("id"), ownerOf(r))
	if !ok {
		writeErr(w, 404, "job not found")
		return j, false
	}
	if j.Result == nil {
		writeErr(w, 409, "job has no result yet")
		return j, false
	}
	return j, true
}

func (s *Server) csvExport(w http.ResponseWriter, r *http.Request) {
	j, ok := s.finishedJob(w, r)
	if !ok {
		return
	}
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", `attachment; filename="correspondences-`+j.ID+`.csv"`)
	_, _ = w.Write(corrCSV(j.Result))
}

func (s *Server) jsonExport(w http.ResponseWriter, r *http.Request) {
	j, ok := s.finishedJob(w, r)
	if !ok {
		return
	}
	w.Header().Set("Content-Disposition", `attachment; filename="result-`+j.ID+`.json"`)
	writeJSON(w, 200, j)
}

func (s *Server) zipExport(w http.ResponseWriter, r *http.Request) {
	j, ok := s.finishedJob(w, r)
	if !ok {
		return
	}
	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", `attachment; filename="lunarreg-`+j.ID+`.zip"`)
	zw := zip.NewWriter(w)
	defer zw.Close()
	add := func(name string, b []byte) {
		if fw, err := zw.Create(name); err == nil {
			_, _ = fw.Write(b)
		}
	}
	jb, _ := json.MarshalIndent(j, "", "  ")
	add("result.json", jb)
	add("correspondences.csv", corrCSV(j.Result))
	for _, k := range j.Images {
		if b, err := s.st.ReadImage(j.ID, k); err == nil {
			add("images/"+k+".png", b)
		}
	}
	note := "LunarReg Workbench export\n\nMetrics are computed from accepted correspondences in processed-pixel units.\n" +
		"They are internal-consistency diagnostics, not ground-truth validation.\n"
	if j.Source.Kind == "sample" {
		note += "\nSAMPLE DATA: synthetic imagery, not mission data.\n"
	}
	add("README.txt", []byte(note))
}

func (s *Server) sweepJob(w http.ResponseWriter, r *http.Request) {
	j, ok := s.st.Get(r.PathValue("id"), ownerOf(r))
	if !ok {
		writeErr(w, 404, "job not found")
		return
	}
	var req struct {
		Param  string    `json:"param"`
		Values []float64 `json:"values"`
	}
	if err := json.NewDecoder(io.LimitReader(r.Body, 1<<16)).Decode(&req); err != nil || len(req.Values) == 0 || len(req.Values) > 12 {
		writeErr(w, 400, "provide param and 1-12 values")
		return
	}
	sb, e1 := s.st.ReadInput(j.ID, "source")
	rb, e2 := s.st.ReadInput(j.ID, "reference")
	src, _, e3 := cv.Decode(sb)
	ref, _, e4 := cv.Decode(rb)
	if e1 != nil || e2 != nil || e3 != nil || e4 != nil {
		writeErr(w, 410, "inputs unavailable")
		return
	}
	type row struct {
		Value       float64 `json:"value"`
		OK          bool    `json:"ok"`
		Error       string  `json:"error,omitempty"`
		Inliers     int     `json:"inliers"`
		InlierRatio float64 `json:"inlierRatio"`
		RMSE        float64 `json:"rmse"`
		Model       string  `json:"model"`
		TruthErr    float64 `json:"truthError"`
		HasTruth    bool    `json:"hasTruth"`
	}
	rows := make([]row, len(req.Values))
	var wg sync.WaitGroup
	sem := make(chan struct{}, 2)
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Minute)
	defer cancel()
	for i, v := range req.Values {
		p := j.Params
		switch req.Param {
		case "ransacThreshold":
			p.RansacThresh = v
		case "ratio":
			p.Ratio = v
		case "features":
			p.Features = int(v)
		case "fastThreshold":
			p.FastThreshold = v
		case "levels":
			p.Levels = int(v)
		default:
			writeErr(w, 400, "param must be ransacThreshold, ratio, features, fastThreshold or levels")
			return
		}
		wg.Add(1)
		go func(i int, v float64, p cv.Params) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()
			rw := row{Value: v}
			res, err := cv.Run(ctx, src, ref, p, nil)
			if err != nil {
				rw.Error = err.Error()
			} else {
				rw.OK, rw.Inliers, rw.InlierRatio, rw.RMSE, rw.Model = true, res.Metrics.Inliers, res.Metrics.InlierRatio, res.Metrics.RMSE, res.ModelUsed
				if j.Truth != nil && res.SrcScale == 1 && res.RefScale == 1 {
					rw.HasTruth, rw.TruthErr = true, synth.CornerError(res.Matrix, *j.Truth, res.RefSize[0])
				}
			}
			rows[i] = rw
		}(i, v, p)
	}
	wg.Wait()
	vals := map[string]float64{}
	for _, rw := range rows {
		if rw.OK {
			vals[strconv.FormatFloat(rw.Value, 'f', -1, 64)] = rw.RMSE
		}
	}
	writeJSON(w, 200, map[string]any{"param": req.Param, "rows": rows, "svg": charts.Bars(vals, nil, "%.2f px")})
}

func (s *Server) stats(w http.ResponseWriter, r *http.Request) {
	js := s.st.List(ownerOf(r))
	out := map[string]any{}
	byStatus := map[string]int{}
	byModel := map[string]int{}
	byConf := map[string]int{}
	var rmse, inl, ncc, ms float64
	var done int
	type pt struct {
		T    time.Time `json:"t"`
		RMSE float64   `json:"rmse"`
		Name string    `json:"name"`
	}
	var series []pt
	for _, j := range js {
		byStatus[j.Status]++
		if j.Status != store.Completed || j.Result == nil {
			continue
		}
		done++
		m := j.Result.Metrics
		rmse += m.RMSE
		inl += m.InlierRatio
		ncc += m.Image.NCC
		byModel[j.Result.ModelUsed]++
		byConf[m.Confidence]++
		if j.StartedAt != nil && j.FinishedAt != nil {
			ms += float64(j.FinishedAt.Sub(*j.StartedAt).Milliseconds())
		}
		series = append(series, pt{j.CreatedAt, m.RMSE, j.Name})
	}
	sort.Slice(series, func(a, b int) bool { return series[a].T.Before(series[b].T) })
	if len(series) > 24 {
		series = series[len(series)-24:]
	}
	avg := func(v float64) any {
		if done == 0 {
			return nil // N/A, never a placeholder number
		}
		return math.Round(v/float64(done)*1000) / 1000
	}
	out["total"], out["byStatus"], out["byModel"], out["byConfidence"] = len(js), byStatus, byModel, byConf
	out["completed"] = done
	out["meanRMSE"], out["meanInlierRatio"], out["meanNCC"], out["meanRuntimeMs"] = avg(rmse), avg(inl), avg(ncc), avg(ms)
	out["rmseSeries"] = series
	if fin := byStatus[store.Completed] + byStatus[store.Failed]; fin > 0 {
		out["successRate"] = float64(byStatus[store.Completed]) / float64(fin)
	} else {
		out["successRate"] = nil
	}
	writeJSON(w, 200, out)
}

func (s *Server) chart(w http.ResponseWriter, r *http.Request) {
	js := s.st.List(ownerOf(r))
	var svg string
	switch strings.TrimSuffix(r.PathValue("name"), ".svg") {
	case "rmse":
		var pts []charts.Point
		for i := len(js) - 1; i >= 0; i-- { // List is newest first
			if js[i].Status == store.Completed && js[i].Result != nil {
				pts = append(pts, charts.Point{Label: js[i].Name, Value: js[i].Result.Metrics.RMSE})
			}
		}
		if len(pts) > 24 {
			pts = pts[len(pts)-24:]
		}
		svg = charts.Line(pts, "px RMSE")
	case "models", "confidence":
		vals := map[string]float64{}
		cls := map[string]string{"high": "ok", "medium": "warn", "low": "bad"}
		for _, j := range js {
			if j.Status != store.Completed || j.Result == nil {
				continue
			}
			if r.PathValue("name") == "models.svg" || r.PathValue("name") == "models" {
				vals[j.Result.ModelUsed]++
			} else {
				vals[j.Result.Metrics.Confidence]++
			}
		}
		if r.PathValue("name") == "models.svg" || r.PathValue("name") == "models" {
			cls = nil
		}
		svg = charts.Bars(vals, cls, "%.0f")
	default:
		writeErr(w, 404, "unknown chart")
		return
	}
	w.Header().Set("Content-Type", "image/svg+xml")
	w.Header().Set("Cache-Control", "no-store")
	_, _ = w.Write([]byte(svg))
}

func (s *Server) study(w http.ResponseWriter, r *http.Request) {
	s.serveData(w, "illumination_study.json")
}

func (s *Server) benchmark(w http.ResponseWriter, r *http.Request) { s.serveData(w, "benchmark.json") }

// serveData returns a tool-generated JSON file from the data dir, or {"available":false}.
func (s *Server) serveData(w http.ResponseWriter, name string) {
	b, err := os.ReadFile(filepath.Join(s.st.Dir(), name))
	if err != nil {
		writeJSON(w, 200, map[string]any{"available": false})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_, _ = w.Write(b)
}
