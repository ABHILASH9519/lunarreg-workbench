# LunarReg Workbench 🌕

Automated lunar image registration and correspondence analysis, rebuilt as a **Go** service
(engine, API, job queue, persistence) with a **Python** tooling layer (dataset generation,
benchmarking, reports).

> **Status: work in progress (about 50%).** The Go engine, API, persistence and tests are
> done and verified. The web UI and Python tooling are still to come — `web/index.html` is
> currently a placeholder.

## What works now

- **Engine (`internal/cv`)** — pure Go, standard library only:
  PNG / JPEG / baseline TIFF-GeoTIFF decoding (8/16/32-bit, strips, none/Deflate/PackBits),
  median denoise + CLAHE, Gaussian pyramid, **multi-octave** FAST-9 + Harris features with
  oriented 256-bit BRIEF descriptors, Hamming matching with ratio test and mutual cross-check,
  spatial-grid filtering, RANSAC with local optimisation for **similarity / affine / homography**,
  automatic model recommendation, warping, RMSE / reprojection / coverage / NCC / mutual-information
  metrics, and overlay / difference / checkerboard / match-line composites.
- **Samples (`internal/synth`)** — five procedurally rendered lunar-like pairs with an exact
  ground-truth transform (labelled SAMPLE DATA, never mission imagery).
- **Server (`internal/server`, `internal/store`)** — REST + Server-Sent-Events API, worker pool,
  cancel / re-run / parameter sweep, per-visitor job history on disk, CSV / JSON / ZIP export.

## Measured accuracy (synthetic ground truth)

`go test ./internal/synth -v` runs the full pipeline on every bundled pair and compares the
recovered transform with the truth (RMS error at corners + centre):

| Pair | Truth model | Recovered | Corner error |
|---|---|---|---|
| OHRC crater field | similarity | similarity | 0.22 px |
| TMC-2 sheared mosaic | affine | affine | 0.17 px |
| LRO NAC off-nadir | homography | homography | 0.52 px |
| IIRS low-sun | similarity | similarity | 0.29 px |
| SELENE noisy | similarity | similarity | 0.29 px |

## Known limitations (honest)

- Binary ORB-style descriptors are **not robust to large illumination changes**. With a ~40°
  sun-azimuth change between images, feature repeatability dropped to ~29% and registration
  failed in testing; the bundled samples therefore use moderate sun changes. The app reports
  such failures instead of fabricating results.
- Metrics are in processed-pixel units; they are internal-consistency diagnostics, not a
  substitute for validation on sourced mission imagery.
- TIFF: tiled and LZW files are rejected with an explicit error.

## Run

```bash
go run ./cmd/lunarreg -addr :8080 -data ./data
go test ./...
```

API: `GET /api/health`, `/api/samples`, `/api/stats`, `POST /api/jobs` (multipart: `sample=<id>`
or `source`+`reference` files, optional `params` JSON), `GET /api/jobs/{id}`, `/events` (SSE),
`/image/{registered|overlay|difference|checker|matches|before|source|reference}`,
`/export.zip`, `/correspondences.csv`, `POST /api/jobs/{id}/rerun|cancel|sweep`.
