# LunarReg Go + Python backend migration

Go is the primary backend (75–80% target): REST API, validation, job lifecycle, orchestration, PostgreSQL persistence, storage/auth adapters, observability and deployment. Python is the focused CV worker (15–20% target): image decoding, feature extraction, matching, robust transform estimation, warping and metrics. Frontend TypeScript is not counted as backend LOC. These percentages are architectural targets, not measured current LOC.

The Go service in go/ provides POST /api/v1/jobs (multipart source, reference, optional JSON config), GET /api/v1/jobs, GET /api/v1/jobs/{id}, DELETE /api/v1/jobs/{id}, /healthz and /readyz. It persists job metadata/results in PostgreSQL and calls the private Python worker in python/ at POST /v1/register.

Apply go/migrations/001_init.sql. Configure DATABASE_URL and CV_WORKER_URL. Run the Python worker from backend/python using uvicorn app.main:app --host 127.0.0.1 --port 8000, then start the Go API with go run ./cmd/api from backend/go. Requirements: Go 1.23+, Python 3.12+, PostgreSQL 15+ and OpenCV contrib.

Migration status: current frontend hooks still use the generated Internet Computer actor and browser-side TypeScript CV pipeline. The next integration step is a typed Go REST client, multipart upload from the workflow UI, result/progress mapping and verified OIDC/JWT identity. This first API is not production-authenticated: keep it behind a trusted gateway/private network and do not trust caller-supplied user IDs. The initial API executes synchronously; durable queues, object storage, cancellation, quotas and retries are future hardening work.

TIFF raster decode is attempted through OpenCV; GeoTIFF coordinate-reference and affine metadata preservation are not implemented. Multi-octave feature detection and sub-pixel refinement are not implemented in this first worker. Do not claim these features until built and tested.
