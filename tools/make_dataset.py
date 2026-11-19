#!/usr/bin/env python3
"""Generate a synthetic lunar-like image pair with exact ground truth.

Writes source/reference as PNG and/or 16-bit TIFF (the TIFF path exercises the
server's GeoTIFF-style decoder) plus ground_truth.json (3x3 source->reference
matrix). Output is SAMPLE DATA, not mission imagery.
"""
from __future__ import annotations

import argparse
import json
import os
import struct
import zlib

import numpy as np


def terrain(n: int, seed: int) -> np.ndarray:
    rng = np.random.default_rng(seed)
    h = np.zeros((n, n), np.float32)
    for octave, (cells, amp) in enumerate([(6, 20), (14, 9), (40, 3), (110, 1)]):
        g = rng.random((cells + 2, cells + 2)).astype(np.float32)
        ys, xs = np.mgrid[0:n, 0:n] / n * cells
        x0, y0 = xs.astype(int), ys.astype(int)
        fx, fy = xs - x0, ys - y0
        fx, fy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
        v = (g[y0, x0] * (1 - fx) + g[y0, x0 + 1] * fx) * (1 - fy) + (g[y0 + 1, x0] * (1 - fx) + g[y0 + 1, x0 + 1] * fx) * fy
        h += amp * v
    for _ in range(int(n * n / 1500)):
        r = 5 + rng.random() ** 2.6 * 70
        cx, cy = rng.random(2) * n
        x0, x1, y0, y1 = int(max(cx - 1.6 * r, 0)), int(min(cx + 1.6 * r, n)), int(max(cy - 1.6 * r, 0)), int(min(cy + 1.6 * r, n))
        yy, xx = np.mgrid[y0:y1, x0:x1]
        d = np.hypot(xx - cx, yy - cy) / r
        depth = r * (0.16 + rng.random() * 0.12)
        h[y0:y1, x0:x1] += np.where(d < 1, -depth * (1 - d * d), 0) + depth * 0.45 * np.exp(-(((d - 1) / 0.18) ** 2))
    return h


def shade(h: np.ndarray, az: float, el: float) -> np.ndarray:
    gy, gx = np.gradient(h)
    a, e = np.radians(az), np.radians(el)
    n = np.dstack([-gx * 1.6, -gy * 1.6, np.ones_like(h)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    light = np.array([np.cos(e) * np.cos(a), np.cos(e) * np.sin(a), np.sin(e)])
    return np.clip(120 * (n @ light) / max(np.sin(e), 0.25) + 25, 0, 255)


def bilinear(img: np.ndarray, x: np.ndarray, y: np.ndarray) -> np.ndarray:
    x0, y0 = np.floor(x).astype(int), np.floor(y).astype(int)
    fx, fy = x - x0, y - y0
    c = lambda a, lo, hi: np.clip(a, lo, hi)
    h, w = img.shape
    g = lambda yy, xx: img[c(yy, 0, h - 1), c(xx, 0, w - 1)]
    return (g(y0, x0) * (1 - fx) + g(y0, x0 + 1) * fx) * (1 - fy) + (g(y0 + 1, x0) * (1 - fx) + g(y0 + 1, x0 + 1) * fx) * fy


def truth_matrix(size: int, rot: float, scale: float, tx: float, ty: float) -> np.ndarray:
    c = (size - 1) / 2
    r = np.radians(rot)
    lin = np.array([[np.cos(r) * scale, -np.sin(r) * scale, 0], [np.sin(r) * scale, np.cos(r) * scale, 0], [0, 0, 1]])
    to_c = np.array([[1, 0, -c], [0, 1, -c], [0, 0, 1.0]])
    back = np.array([[1, 0, c + tx], [0, 1, c + ty], [0, 0, 1.0]])
    return back @ lin @ to_c


def make_pair(size=512, seed=7, rot=9.0, scale=1.05, tx=14.0, ty=-10.0, noise=2.0, az_delta=7.0, el_delta=-2.0):
    pad = 160
    h = terrain(size + 2 * pad, seed)
    l_ref, l_src = shade(h, 300, 32), shade(h, 300 + az_delta, 32 + el_delta)
    ys, xs = np.mgrid[0:size, 0:size].astype(np.float64)
    m = truth_matrix(size, rot, scale, tx, ty)
    tx_ = m[0, 0] * xs + m[0, 1] * ys + m[0, 2]
    ty_ = m[1, 0] * xs + m[1, 1] * ys + m[1, 2]
    rng = np.random.default_rng(seed + 1)
    ref = l_ref[pad:pad + size, pad:pad + size] + rng.normal(0, noise / 2, (size, size))
    src = bilinear(l_src, tx_ + pad, ty_ + pad) + rng.normal(0, noise, (size, size))
    return np.clip(src, 0, 255), np.clip(ref, 0, 255), m


def write_png(path: str, a: np.ndarray) -> None:
    a8 = a.astype(np.uint8)
    raw = b"".join(b"\x00" + a8[i].tobytes() for i in range(a8.shape[0]))
    chunk = lambda t, d: struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)
    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", a8.shape[1], a8.shape[0], 8, 0, 0, 0, 0))
                + chunk(b"IDAT", zlib.compress(raw, 6)) + chunk(b"IEND", b""))


def write_tiff16(path: str, a: np.ndarray, deflate: bool = False) -> None:
    """Single-strip little-endian 16-bit grayscale TIFF (uncompressed or Deflate)."""
    h, w = a.shape
    data = (a / 255 * 60000).astype("<u2").tobytes()
    if deflate:
        data = zlib.compress(data)
    entries = [(256, 4, w), (257, 4, h), (258, 3, 16), (259, 3, 8 if deflate else 1), (262, 3, 1),
               (273, 4, 0), (277, 3, 1), (278, 4, h), (279, 4, len(data))]
    ifd_off = 8
    data_off = ifd_off + 2 + 12 * len(entries) + 4
    out = bytearray(b"II*\x00" + struct.pack("<I", ifd_off) + struct.pack("<H", len(entries)))
    for tag, typ, val in entries:
        if tag == 273:
            val = data_off
        out += struct.pack("<HHI", tag, typ, 1) + (struct.pack("<HH", val, 0) if typ == 3 else struct.pack("<I", val))
    out += struct.pack("<I", 0) + data
    with open(path, "wb") as f:
        f.write(out)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", default="dataset")
    ap.add_argument("--format", choices=["png", "tiff", "tiff-deflate"], default="tiff")
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--rot", type=float, default=9.0)
    ap.add_argument("--scale", type=float, default=1.05)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    src, ref, m = make_pair(seed=a.seed, rot=a.rot, scale=a.scale)
    for name, img in (("source", src), ("reference", ref)):
        if a.format == "png":
            write_png(f"{a.out}/{name}.png", img)
        else:
            write_tiff16(f"{a.out}/{name}.tif", img, deflate=a.format == "tiff-deflate")
    with open(f"{a.out}/ground_truth.json", "w") as f:
        json.dump({"matrix": m.flatten().tolist(), "size": 512, "label": "SAMPLE DATA (synthetic)"}, f, indent=2)
    print(f"wrote {a.format} pair + ground_truth.json to {a.out}/")


if __name__ == "__main__":
    main()
