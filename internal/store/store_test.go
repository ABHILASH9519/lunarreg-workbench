package store

import (
	"bytes"
	"os"
	"path/filepath"
	"testing"
	"time"

	"lunarreg/internal/cv"
)

func TestStorePersistsInputsImagesAndOwnerIsolation(t *testing.T) {
	dir := t.TempDir()
	s, err := Open(dir)
	if err != nil {
		t.Fatal(err)
	}
	j := &Job{
		ID: NewID(), Owner: "visitor-a", Name: "sample registration",
		Status: Queued, CreatedAt: time.Now(), Params: cv.DefaultParams(),
		Source: Input{Name: "source.png"}, Reference: Input{Name: "reference.png"},
	}
	source, reference := []byte("source bytes"), []byte("reference bytes")
	if err := s.Create(j, source, reference); err != nil {
		t.Fatal(err)
	}

	if _, ok := s.Get(j.ID, "visitor-b"); ok {
		t.Fatal("job was visible to a different owner")
	}
	if got := s.List("visitor-a"); len(got) != 1 || got[0].ID != j.ID {
		t.Fatalf("owner list = %#v", got)
	}
	for name, want := range map[string][]byte{"source": source, "reference": reference} {
		got, err := s.ReadInput(j.ID, name)
		if err != nil || !bytes.Equal(got, want) {
			t.Fatalf("ReadInput(%q) = %q, %v", name, got, err)
		}
	}

	png := []byte("\x89PNG\r\n\x1a\nexample")
	if err := s.SaveImage(j.ID, "registered", png); err != nil {
		t.Fatal(err)
	}
	got, err := s.ReadImage(j.ID, "registered")
	if err != nil || !bytes.Equal(got, png) {
		t.Fatalf("ReadImage = %q, %v", got, err)
	}

	if !s.Delete(j.ID, "visitor-a") {
		t.Fatal("owner could not delete their job")
	}
	if _, ok := s.Get(j.ID, "visitor-a"); ok {
		t.Fatal("deleted job remains in index")
	}
	if _, err := os.Stat(filepath.Join(dir, "jobs", j.ID)); !os.IsNotExist(err) {
		t.Fatalf("job directory still exists: %v", err)
	}
}

func TestOpenMarksInterruptedJobsAsFailed(t *testing.T) {
	dir := t.TempDir()
	s, err := Open(dir)
	if err != nil {
		t.Fatal(err)
	}
	j := &Job{ID: NewID(), Owner: "visitor", Status: Running, CreatedAt: time.Now(), Params: cv.DefaultParams()}
	if err := s.Create(j, []byte("s"), []byte("r")); err != nil {
		t.Fatal(err)
	}

	reopened, err := Open(dir)
	if err != nil {
		t.Fatal(err)
	}
	got, ok := reopened.Get(j.ID, "visitor")
	if !ok {
		t.Fatal("job missing after reopening store")
	}
	if got.Status != Failed || got.Error != "interrupted by server restart" {
		t.Fatalf("recovered job = %q (%q)", got.Status, got.Error)
	}
}

func TestCreateRejectsInvalidAndDuplicateIDs(t *testing.T) {
	dir := t.TempDir()
	s, err := Open(dir)
	if err != nil {
		t.Fatal(err)
	}
	if err := s.Create(&Job{ID: "../outside"}, []byte("bad"), []byte("bad")); err == nil {
		t.Fatal("expected invalid job ID to be rejected")
	}

	const id = "0123456789ab"
	first := &Job{ID: id, Owner: "owner-a", Status: Queued, CreatedAt: time.Now(), Params: cv.DefaultParams()}
	if err := s.Create(first, []byte("original source"), []byte("original reference")); err != nil {
		t.Fatal(err)
	}
	duplicate := &Job{ID: id, Owner: "owner-b", Status: Queued, CreatedAt: time.Now(), Params: cv.DefaultParams()}
	if err := s.Create(duplicate, []byte("replacement source"), []byte("replacement reference")); err == nil {
		t.Fatal("expected duplicate job ID to be rejected")
	}
	got, err := s.ReadInput(id, "source")
	if err != nil || !bytes.Equal(got, []byte("original source")) {
		t.Fatalf("duplicate create changed stored input: %q, %v", got, err)
	}
	if _, ok := s.Get(id, "owner-b"); ok {
		t.Fatal("duplicate owner unexpectedly acquired the existing job")
	}
}

func TestCreateDoesNotReplaceExistingJobPath(t *testing.T) {
	dir := t.TempDir()
	s, err := Open(dir)
	if err != nil {
		t.Fatal(err)
	}
	const id = "abcdef012345"
	reserved := filepath.Join(dir, "jobs", id)
	if err := os.WriteFile(reserved, []byte("reserved path"), 0o600); err != nil {
		t.Fatal(err)
	}
	j := &Job{ID: id, Owner: "owner", Status: Queued, CreatedAt: time.Now(), Params: cv.DefaultParams()}
	if err := s.Create(j, []byte("source"), []byte("reference")); err == nil {
		t.Fatal("expected collision with an existing job path")
	}
	got, err := os.ReadFile(reserved)
	if err != nil || string(got) != "reserved path" {
		t.Fatalf("existing path was changed: %q, %v", got, err)
	}
	entries, err := os.ReadDir(filepath.Join(dir, "jobs"))
	if err != nil {
		t.Fatal(err)
	}
	if len(entries) != 1 {
		t.Fatalf("staging directory leaked after failed create: %v", entries)
	}
	if _, ok := s.Get(id, "owner"); ok {
		t.Fatal("failed create was added to the in-memory index")
	}
}
