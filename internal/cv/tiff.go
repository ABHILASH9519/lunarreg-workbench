package cv

import (
	"bytes"
	"compress/zlib"
	"encoding/binary"
	"errors"
	"fmt"
	"io"
	"math"
)

// decodeTIFF reads strip-based baseline TIFF / GeoTIFF rasters:
// 8/16/32-bit integer or 32-bit float, 1/3/4 samples, compression
// none, Deflate (8/32946) or PackBits. Tiled and LZW files are rejected
// with an explicit error rather than silently mis-decoded.
func decodeTIFF(data []byte) (*Gray, ImageInfo, error) {
	var bo binary.ByteOrder = binary.LittleEndian
	if data[0] == 'M' {
		bo = binary.BigEndian
	}
	ifd := int(bo.Uint32(data[4:8]))
	if ifd <= 0 || ifd+2 > len(data) {
		return nil, ImageInfo{}, errors.New("tiff: bad IFD offset")
	}
	n := int(bo.Uint16(data[ifd:]))
	tags := map[uint16][]uint32{}
	typeSize := map[uint16]int{1: 1, 2: 1, 3: 2, 4: 4, 6: 1, 8: 2, 9: 4, 11: 4, 16: 8}
	for i := 0; i < n; i++ {
		e := ifd + 2 + i*12
		if e+12 > len(data) {
			return nil, ImageInfo{}, errors.New("tiff: truncated IFD")
		}
		tag := bo.Uint16(data[e:])
		typ := bo.Uint16(data[e+2:])
		cnt := int(bo.Uint32(data[e+4:]))
		sz := typeSize[typ]
		if sz == 0 || cnt < 0 || cnt > 1<<24 {
			continue
		}
		var src []byte
		if sz*cnt <= 4 {
			src = data[e+8 : e+12]
		} else {
			off := int(bo.Uint32(data[e+8:]))
			if off < 0 || off+sz*cnt > len(data) {
				return nil, ImageInfo{}, errors.New("tiff: tag out of range")
			}
			src = data[off : off+sz*cnt]
		}
		vals := make([]uint32, cnt)
		for j := 0; j < cnt; j++ {
			switch sz {
			case 1:
				vals[j] = uint32(src[j])
			case 2:
				vals[j] = uint32(bo.Uint16(src[j*2:]))
			case 4:
				vals[j] = bo.Uint32(src[j*4:])
			case 8:
				vals[j] = bo.Uint32(src[j*8:])
			}
		}
		tags[tag] = vals
	}
	get := func(t uint16, def uint32) uint32 {
		if v, ok := tags[t]; ok && len(v) > 0 {
			return v[0]
		}
		return def
	}
	w, h := int(get(256, 0)), int(get(257, 0))
	if w < 32 || h < 32 {
		return nil, ImageInfo{}, errors.New("tiff: image smaller than 32x32")
	}
	if tooManyPixels(w, h) {
		return nil, ImageInfo{}, errors.New("tiff: image too large")
	}
	if _, tiled := tags[322]; tiled {
		return nil, ImageInfo{}, errors.New("tiff: tiled TIFF not supported; re-export as strips")
	}
	bps := int(get(258, 1))
	comp := get(259, 1)
	photo := get(262, 1)
	spp := int(get(277, 1))
	planar := get(284, 1)
	pred := get(317, 1)
	sfmt := get(339, 1)
	if planar != 1 {
		return nil, ImageInfo{}, errors.New("tiff: planar configuration 2 not supported")
	}
	if bps != 8 && bps != 16 && bps != 32 {
		return nil, ImageInfo{}, fmt.Errorf("tiff: %d-bit samples not supported", bps)
	}
	if spp < 1 || spp > 4 {
		return nil, ImageInfo{}, errors.New("tiff: unsupported samples per pixel")
	}
	offs, cnts := tags[273], tags[279]
	if len(offs) == 0 || len(offs) != len(cnts) {
		return nil, ImageInfo{}, errors.New("tiff: missing strip data")
	}
	rps := int(get(278, uint32(h)))
	if rps <= 0 || rps > h {
		rps = h
	}
	bytesPP := bps / 8 * spp
	rowBytes := w * bytesPP
	raw := make([]byte, 0, rowBytes*h)
	for si := range offs {
		o, c := int(offs[si]), int(cnts[si])
		if o < 0 || c < 0 || o+c > len(data) {
			return nil, ImageInfo{}, errors.New("tiff: strip out of range")
		}
		strip := data[o : o+c]
		rows := rps
		if (si+1)*rps > h {
			rows = h - si*rps
		}
		want := rows * rowBytes
		var dec []byte
		switch comp {
		case 1:
			dec = strip
		case 8, 32946:
			zr, err := zlib.NewReader(bytes.NewReader(strip))
			if err != nil {
				return nil, ImageInfo{}, err
			}
			dec, err = io.ReadAll(io.LimitReader(zr, int64(want)+16))
			if err != nil {
				return nil, ImageInfo{}, err
			}
		case 32773:
			dec = unpackBits(strip, want)
		default:
			return nil, ImageInfo{}, fmt.Errorf("tiff: compression %d (e.g. LZW) not supported; save uncompressed or Deflate", comp)
		}
		if len(dec) < want {
			return nil, ImageInfo{}, errors.New("tiff: short strip data")
		}
		dec = dec[:want]
		if pred == 2 && bps <= 16 {
			undoPredictor(dec, rows, w, spp, bps/8, bo)
		}
		raw = append(raw, dec...)
	}
	if len(raw) < rowBytes*h {
		return nil, ImageInfo{}, errors.New("tiff: incomplete raster")
	}
	g := NewGray(w, h)
	f := func(i int) float64 { // sample i (index in samples)
		p := i * bps / 8
		switch bps {
		case 8:
			return float64(raw[p])
		case 16:
			return float64(bo.Uint16(raw[p:]))
		default:
			if sfmt == 3 {
				return float64(math.Float32frombits(bo.Uint32(raw[p:])))
			}
			return float64(bo.Uint32(raw[p:]))
		}
	}
	for i := 0; i < w*h; i++ {
		var v float64
		if spp >= 3 {
			v = 0.2126*f(i*spp) + 0.7152*f(i*spp+1) + 0.0722*f(i*spp+2)
		} else {
			v = f(i * spp)
		}
		if math.IsNaN(v) || math.IsInf(v, 0) {
			v = 0
		}
		g.Pix[i] = float32(v)
	}
	if bps == 8 {
		if photo == 0 && spp == 1 {
			for i, v := range g.Pix {
				g.Pix[i] = 255 - v
			}
		}
	} else {
		StretchPercentile(g, 0.5, 99.5)
		if photo == 0 {
			for i, v := range g.Pix {
				g.Pix[i] = 255 - v
			}
		}
	}
	return g, ImageInfo{Format: "tiff", Width: w, Height: h, BitDepth: bps}, nil
}

func unpackBits(src []byte, want int) []byte {
	out := make([]byte, 0, want)
	for i := 0; i < len(src) && len(out) < want; {
		n := int(int8(src[i]))
		i++
		switch {
		case n >= 0:
			end := i + n + 1
			if end > len(src) {
				end = len(src)
			}
			out = append(out, src[i:end]...)
			i = end
		case n != -128:
			if i >= len(src) {
				return out
			}
			for k := 0; k < 1-n; k++ {
				out = append(out, src[i])
			}
			i++
		}
	}
	return out
}

func undoPredictor(b []byte, rows, w, spp, bytesPer int, bo binary.ByteOrder) {
	stride := w * spp * bytesPer
	for r := 0; r < rows; r++ {
		row := b[r*stride : (r+1)*stride]
		if bytesPer == 1 {
			for i := spp; i < len(row); i++ {
				row[i] += row[i-spp]
			}
			continue
		}
		for i := spp; i < w*spp; i++ {
			a := bo.Uint16(row[i*2:]) + bo.Uint16(row[(i-spp)*2:])
			bo.PutUint16(row[i*2:], a)
		}
	}
}
