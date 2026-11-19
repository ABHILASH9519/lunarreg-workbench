// Package store persists registration jobs on disk (one directory per job)
// with an in-memory index. It is safe for concurrent use.
package store

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"sort"
	"sync"
	"time"

	"lunarreg/internal/cv"
)

// Job statuses.
const (
	Queued    = "queued"
	Running   = "running"
	Completed = "completed"
	Failed    = "failed"
	Cancelled = "cancelled"
)

// Input describes one image of a job.
type Input struct {
	Name     string       `json:"name"`
	Kind     string       `json:"kind"` // sample | upload
	SampleID string       `json:"sampleId,omitempty"`
	Info     cv.ImageInfo `json:"info"`
}

// LogLine is one entry of the live processing console.
type LogLine struct {
	T     time.Time `json:"t"`
	Stage string    `json:"stage"`
	Msg   string    `json:"msg"`
}

// Job is the persisted record.
type Job struct {
	ID         string     `json:"id"`
	Owner      string     `json:"owner"`
	Name       string     `json:"name"`
	Status     string     `json:"status"`
	Stage      string     `json:"stage"`
	Progress   float64    `json:"progress"`
	Error      string     `json:"error,omitempty"`
	CreatedAt  time.Time  `json:"createdAt"`
	StartedAt  *time.Time `json:"startedAt,omitempty"`
	FinishedAt *time.Time `json:"finishedAt,omitempty"`
	Params     cv.Params  `json:"params"`
	Source     Input      `json:"source"`
	Reference  Input      `json:"reference"`
	Result     *cv.Result `json:"result,omitempty"`
	Log        []LogLine  `json:"log"`
	Images     []string   `json:"images"`
	Truth      *cv.Mat3   `json:"truth,omitempty"`
	TruthErr   *float64   `json:"truthError,omitempty"`
}

// Store is the job repository.
type Store struct {
	dir  string
	mu   sync.RWMutex
	jobs map[string]*Job
}

// Open loads (or creates) a store rooted at dir.
func Open(dir string) (*Store, error) {
	if err := os.MkdirAll(filepath.Join(dir, "jobs"), 0o755); err != nil {
		return nil, err
	}
	s := &Store{dir: dir, jobs: map[string]*Job{}}
	entries, _ := os.ReadDir(filepath.Join(dir, "jobs"))
	for _, e := range entries {
		b, err := os.ReadFile(filepath.Join(dir, "jobs", e.Name(), "job.json"))
		if err != nil {
			continue
		}
		var j Job
		if json.Unmarshal(b, &j) != nil {
			continue
		}
		// jobs interrupted by a restart cannot resume
		if j.Status == Queued || j.Status == Running {
			j.Status, j.Error = Failed, "interrupted by server restart"
		}
		s.jobs[j.ID] = &j
	}
	return s, nil
}

// NewID returns a random 12-hex-char identifier.
func NewID() string {
	b := make([]byte, 6)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func (s *Store) jobDir(id string) string { return filepath.Join(s.dir, "jobs", id) }

func validID(id string) bool {
	if len(id) != 12 {
		return false
	}
	for _, c := range id {
		if !(c >= '0' && c <= '9' || c >= 'a' && c <= 'f') {
			return false
		}
	}
	return true
}

func (s *Store) persist(j *Job) error {
	if err := os.MkdirAll(s.jobDir(j.ID), 0o755); err != nil {
		return err
	}
	b, err := json.Marshal(j)
	if err != nil {
		return err
	}
	tmp := filepath.Join(s.jobDir(j.ID), "job.json.tmp")
	if err := os.WriteFile(tmp, b, 0o644); err != nil {
		return err
	}
	return os.Rename(tmp, filepath.Join(s.jobDir(j.ID), "job.json"))
}

// Create stores a new job together with its input bytes.
func (s *Store) Create(j *Job, src, ref []byte) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if err := os.MkdirAll(s.jobDir(j.ID), 0o755); err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(s.jobDir(j.ID), "source.bin"), src, 0o644); err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(s.jobDir(j.ID), "reference.bin"), ref, 0o644); err != nil {
		return err
	}
	s.jobs[j.ID] = j
	return s.persist(j)
}

// Get returns a deep-enough copy (value copy) of a job owned by owner.
func (s *Store) Get(id, owner string) (Job, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	j, ok := s.jobs[id]
	if !ok || j.Owner != owner {
		return Job{}, false
	}
	return *j, true
}

// Update mutates a job under lock and persists it.
func (s *Store) Update(id string, fn func(*Job)) (Job, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	j, ok := s.jobs[id]
	if !ok {
		return Job{}, errors.New("job not found")
	}
	fn(j)
	return *j, s.persist(j)
}

// List returns the owner's jobs, newest first.
func (s *Store) List(owner string) []Job {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var out []Job
	for _, j := range s.jobs {
		if j.Owner == owner {
			c := *j
			c.Log = nil
			out = append(out, c)
		}
	}
	sort.Slice(out, func(a, b int) bool { return out[a].CreatedAt.After(out[b].CreatedAt) })
	return out
}

// Delete removes a job and its files.
func (s *Store) Delete(id, owner string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	j, ok := s.jobs[id]
	if !ok || j.Owner != owner || !validID(id) {
		return false
	}
	delete(s.jobs, id)
	_ = os.RemoveAll(s.jobDir(id))
	return true
}

// SaveImage stores a rendered PNG for a job.
func (s *Store) SaveImage(id, kind string, png []byte) error {
	if !validID(id) {
		return errors.New("bad id")
	}
	d := filepath.Join(s.jobDir(id), "images")
	if err := os.MkdirAll(d, 0o755); err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(d, kind+".png"), png, 0o644)
}

// ReadImage loads a rendered PNG.
func (s *Store) ReadImage(id, kind string) ([]byte, error) {
	if !validID(id) {
		return nil, errors.New("bad id")
	}
	return os.ReadFile(filepath.Join(s.jobDir(id), "images", filepath.Base(kind)+".png"))
}

// ReadInput loads the original bytes of "source" or "reference".
func (s *Store) ReadInput(id, which string) ([]byte, error) {
	if !validID(id) || (which != "source" && which != "reference") {
		return nil, errors.New("bad request")
	}
	return os.ReadFile(filepath.Join(s.jobDir(id), which+".bin"))
}

// Status returns the current status of a job regardless of owner ("" if unknown).
func (s *Store) Status(id string) string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if j, ok := s.jobs[id]; ok {
		return j.Status
	}
	return ""
}

// All returns every job (all owners) without logs; used for aggregate stats.
func (s *Store) All(owner string) []Job { return s.List(owner) }

// Dir returns the data directory.
func (s *Store) Dir() string { return s.dir }
