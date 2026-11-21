package cv

import "testing"

// FuzzDecode exercises the untrusted image boundary with arbitrary byte
// sequences. Run longer campaigns with: go test ./internal/cv -fuzz=FuzzDecode.
func FuzzDecode(f *testing.F) {
	f.Add([]byte("not an image"))
	f.Add([]byte("\x89PNG\r\n\x1a\n"))
	f.Add([]byte("II*\x00\x08\x00\x00\x00"))
	f.Add([]byte("MM\x00*\x00\x00\x00\x08"))
	f.Add([]byte{0xff, 0xd8, 0xff, 0xd9})
	f.Fuzz(func(t *testing.T, data []byte) {
		_, _, _ = Decode(data)
	})
}
