# Project guidance

LunarReg Workbench: Go service (engine, API, queue, store, charts) + thin embedded web client + Python tooling.

## Verified commands
- build: `go build -o bin/lunarreg ./cmd/lunarreg`
- run: `./bin/lunarreg -addr :8080 -data ./data`
- Go tests: `go vet ./... && go test ./...`
- Python e2e tests (need the built binary + numpy): `python3 -m unittest discover -s tests -v`
- benchmark (needs running server): `python3 tools/benchmark.py --out data/benchmark.json`

## Rules
- Go standard library only (no network for modules in some environments).
- Never show substitute values for uncomputed metrics: use N/A. Synthetic pairs are always labelled SAMPLE DATA.
- Descriptors are not robust to large illumination changes; do not claim otherwise.
