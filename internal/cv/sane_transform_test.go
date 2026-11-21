package cv

import "testing"

func TestSaneTransformRejectsImplausibleScales(t *testing.T) {
	tests := []struct {
		name string
		h Mat3
		want bool
	}{
		{name: "normal scale", h: Mat3{1, 0, 0, 0, 1, 0, 0, 0, 1}, want: true},
		{name: "too small", h: Mat3{0.1, 0, 0, 0, 0.1, 0, 0, 0, 1}, want: false},
		{name: "too large", h: Mat3{6, 0, 0, 0, 6, 0, 0, 0, 1}, want: false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := saneTransform(ModelAffine, tt.h); got != tt.want {
				t.Fatalf("saneTransform() = %v, want %v", got, tt.want)
			}
		})
	}
}
