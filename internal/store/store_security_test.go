package store

import "testing"

func TestStoreRejectsUnsafeIdentifiersAndInputNames(t *testing.T) {
	s, err := Open(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	for _, id := range []string{"../escape", "short", "ABCDEF123456", "00000000000g"} {
		if _, ok := s.Get(id, "visitor"); ok {
			t.Fatalf("unexpected job for invalid id %q", id)
		}
		if _, err := s.ReadInput(id, "source"); err == nil {
			t.Errorf("ReadInput accepted invalid id %q", id)
		}
		if _, err := s.ReadImage(id, "registered"); err == nil {
			t.Errorf("ReadImage accepted invalid id %q", id)
		}
		if err := s.SaveImage(id, "registered", []byte("x")); err == nil {
			t.Errorf("SaveImage accepted invalid id %q", id)
		}
	}
	if _, err := s.ReadInput("0123456789ab", "../job.json"); err == nil || err.Error() != "bad request" {
		t.Fatalf("ReadInput invalid name error = %v, want bad request", err)
	}
	if s.Delete("../escape", "visitor") {
		t.Fatal("Delete accepted an invalid id")
	}
}
