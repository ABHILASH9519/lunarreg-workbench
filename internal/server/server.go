// Package server exposes the LunarReg REST/SSE API and serves the web UI.
package server

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"io/fs"
	"log"
	"net/http"
	"runtime"
	"strings"
	"sync"
	"time"

	"lunarreg/internal/cv"
	"lunarreg/internal/store"
	"lunarreg/internal/synth"
)

// Version is reported by /api/health.
const Version = "1.0.0"

type ctxKey int

const ownerKey ctxKey = 1

// Event is pushed over SSE.
type Event struct {
	Type     string  `json:"type"` // progress | done
	Stage    string  `json:"stage,omitempty"`
	Progress float64 `json:"progress"`
	Msg      string  `json:"msg,omitempty"`
	Status   string  `json:"status,omitempty"`
}

// Server wires store, queue and HTTP handlers.
type Server struct {
	st      *store.Store
	web     fs.FS
	started time.Time
	workers int
	queue   chan string

	mu      sync.Mutex
	subs    map[string]map[chan Event]struct{}
	cancels map[string]context.CancelFunc
	wg      sync.WaitGroup
}

// New creates a server and starts its workers. Call Close to stop them.
func New(st *store.Store, web fs.FS, ctx context.Context) *Server {
	n := runtime.NumCPU()
	if n > 4 {
		n = 4
	}
	if n < 1 {
		n = 1
	}
	s := &Server{st: st, web: web, started: time.Now(), workers: n, queue: make(chan string, 256),
		subs: map[string]map[chan Event]struct{}{}, cancels: map[string]context.CancelFunc{}}
	for i := 0; i < n; i++ {
		s.wg.Add(1)
		go s.worker(ctx)
	}
	go synth.All() // warm the sample cache in the background
	return s
}

// Wait blocks until workers exit (after ctx cancellation).
func (s *Server) Wait() { s.wg.Wait() }

func (s *Server) worker(ctx context.Context) {
	defer s.wg.Done()
	for {
		select {
		case <-ctx.Done():
			return
		case id := <-s.queue:
			s.runJob(ctx, id)
		}
	}
}

func (s *Server) subscribe(id string) (chan Event, func()) {
	ch := make(chan Event, 64)
	s.mu.Lock()
	if s.subs[id] == nil {
		s.subs[id] = map[chan Event]struct{}{}
	}
	s.subs[id][ch] = struct{}{}
	s.mu.Unlock()
	return ch, func() {
		s.mu.Lock()
		delete(s.subs[id], ch)
		s.mu.Unlock()
	}
}

func (s *Server) publish(id string, e Event) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for ch := range s.subs[id] {
		select {
		case ch <- e:
		default: // slow consumer: drop progress, never block the pipeline
		}
	}
}

func (s *Server) runJob(parent context.Context, id string) {
	ctx, cancel := context.WithTimeout(parent, 3*time.Minute)
	s.mu.Lock()
	s.cancels[id] = cancel
	s.mu.Unlock()
	defer func() {
		cancel()
		s.mu.Lock()
		delete(s.cancels, id)
		s.mu.Unlock()
	}()

	j, err := s.st.Update(id, func(j *store.Job) {
		if j.Status == store.Cancelled {
			return
		}
		now := time.Now()
		j.Status, j.StartedAt = store.Running, &now
		j.Log = append(j.Log, store.LogLine{T: now, Stage: "start", Msg: "Job started"})
	})
	if err != nil || j.Status == store.Cancelled {
		s.publish(id, Event{Type: "done", Status: store.Cancelled, Progress: 1})
		return
	}
	finish := func(status, msg string, res *cv.Result) {
		now := time.Now()
		var imgs []string
		if res != nil {
			for k, b := range res.Images {
				if s.st.SaveImage(id, k, b) == nil {
					imgs = append(imgs, k)
				}
			}
		}
		_, _ = s.st.Update(id, func(j *store.Job) {
			j.Status, j.Error, j.FinishedAt, j.Progress = status, msg, &now, 1
			j.Result, j.Images = res, imgs
			if status == store.Completed && j.Truth != nil && res != nil && res.SrcScale == 1 && res.RefScale == 1 {
				e := synth.CornerError(res.Matrix, *j.Truth, res.RefSize[0])
				j.TruthErr = &e
			}
			j.Log = append(j.Log, store.LogLine{T: now, Stage: status, Msg: orDefault(msg, "Registration complete")})
		})
		s.publish(id, Event{Type: "done", Status: status, Progress: 1, Msg: msg})
	}

	sb, e1 := s.st.ReadInput(id, "source")
	rb, e2 := s.st.ReadInput(id, "reference")
	if e1 != nil || e2 != nil {
		finish(store.Failed, "input files missing", nil)
		return
	}
	src, _, e1 := cv.Decode(sb)
	ref, _, e2 := cv.Decode(rb)
	if e1 != nil || e2 != nil {
		finish(store.Failed, "could not decode input images", nil)
		return
	}
	progress := func(stage string, pct float64, msg string) {
		_, _ = s.st.Update(id, func(j *store.Job) {
			j.Stage, j.Progress = stage, pct
			j.Log = append(j.Log, store.LogLine{T: time.Now(), Stage: stage, Msg: msg})
		})
		s.publish(id, Event{Type: "progress", Stage: stage, Progress: pct, Msg: msg})
	}
	res, err := cv.Run(ctx, src, ref, j.Params, progress)
	switch {
	case ctx.Err() != nil && s.st.Status(id) == store.Cancelled:
		finish(store.Cancelled, "cancelled by user", nil)
	case ctx.Err() != nil:
		finish(store.Failed, "run timed out or was interrupted", nil)
	case err != nil:
		finish(store.Failed, "Registration failed: "+err.Error(), res)
	default:
		finish(store.Completed, "", res)
	}
}

func orDefault(a, b string) string {
	if a == "" {
		return b
	}
	return a
}

// Enqueue puts a stored job on the queue.
func (s *Server) Enqueue(id string) bool {
	select {
	case s.queue <- id:
		return true
	default:
		return false
	}
}

// Cancel stops a running job or marks a queued one cancelled.
func (s *Server) Cancel(id string) {
	s.mu.Lock()
	c := s.cancels[id]
	s.mu.Unlock()
	_, _ = s.st.Update(id, func(j *store.Job) {
		if j.Status == store.Queued || j.Status == store.Running {
			j.Status, j.Error = store.Cancelled, "cancelled by user"
		}
	})
	if c != nil {
		c()
	}
}

// Handler builds the full HTTP handler.
func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	s.routes(mux)
	mux.Handle("/", s.static())
	return s.middleware(mux)
}

func (s *Server) middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		owner := ""
		if c, err := r.Cookie("lr_uid"); err == nil && len(c.Value) == 24 {
			owner = c.Value
		} else {
			b := make([]byte, 12)
			_, _ = rand.Read(b)
			owner = hex.EncodeToString(b)
			http.SetCookie(w, &http.Cookie{Name: "lr_uid", Value: owner, Path: "/", HttpOnly: true,
				Secure:   r.TLS != nil || strings.EqualFold(r.Header.Get("X-Forwarded-Proto"), "https"),
				SameSite: http.SameSiteLaxMode, MaxAge: 60 * 60 * 24 * 365})
		}
		h := w.Header()
		h.Set("X-Content-Type-Options", "nosniff")
		h.Set("Referrer-Policy", "same-origin")
		h.Set("X-Frame-Options", "DENY")
		r = r.WithContext(context.WithValue(r.Context(), ownerKey, owner))
		next.ServeHTTP(w, r)
		if len(r.URL.Path) > 4 && r.URL.Path[:5] == "/api/" {
			log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(start).Round(time.Millisecond))
		}
	})
}

func ownerOf(r *http.Request) string {
	v, _ := r.Context().Value(ownerKey).(string)
	return v
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}

func writeErr(w http.ResponseWriter, code int, msg string) {
	writeJSON(w, code, map[string]string{"error": msg})
}

func (s *Server) static() http.Handler {
	fsrv := http.FileServer(http.FS(s.web))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			if _, err := fs.Stat(s.web, r.URL.Path[1:]); err != nil {
				r.URL.Path = "/" // SPA fallback
			}
		}
		if r.URL.Path == "/" {
			w.Header().Set("Cache-Control", "no-cache")
		} else {
			w.Header().Set("Cache-Control", "public, max-age=3600")
		}
		fsrv.ServeHTTP(w, r)
	})
}
