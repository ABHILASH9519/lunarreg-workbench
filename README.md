# LunarReg Workbench 🌕

**Cross-mission lunar image registration, geometric alignment and quantitative correspondence analysis.**

LunarReg is an image-processing workbench for aligning lunar observations acquired by different missions, sensors and imaging conditions. It is designed to help researchers compare the same lunar surface region despite changes in illumination, viewing geometry, scale, resolution and sensor characteristics.

The platform targets imagery from **Chandrayaan-2 (OHRC, TMC-2 and IIRS), NASA's Lunar Reconnaissance Orbiter (LRO NAC), and JAXA's SELENE (Kaguya)**.

## About LunarReg

LunarReg brings image preparation, feature detection, descriptor matching, robust geometric estimation, registration visualisation and quantitative evaluation into one workflow. The objective is reproducible, inspectable registration: every reported metric should be derived from the actual correspondence set and transformation, with unavailable values reported explicitly rather than fabricated.

The project is being engineered around a Go-first backend with a focused Python computer-vision service:

- **Go (75–80% target):** REST API, authentication and authorization, job lifecycle, orchestration, persistence, storage integrations, validation, observability and deployment.
- **Python (15–20% target):** image decoding, OpenCV feature extraction, descriptor matching, RANSAC estimation, image warping and computer-vision metrics.
- **Frontend:** React, TypeScript and Vite for the registration workspace, visual analysis, configuration and reporting.

The language split is an architectural target. It is not a measured line-count result.

## Core registration workflow

1. Upload a moving/source image and a fixed/reference image.
2. Inspect image metadata and configure preprocessing and feature detection.
3. Extract and match local features, filter descriptors and verify correspondences.
4. Estimate Similarity, Affine or Homography transforms using robust geometric verification.
5. Inspect inliers, outliers, spatial distribution, registered output, overlay and difference views.
6. Evaluate RMSE, reprojection error, inlier ratio, correspondence counts, spatial coverage, scale and rotation.
7. Persist the run configuration and results, compare registration strategies and export reports.

## Scientific integrity and data provenance

LunarReg distinguishes generated benchmark imagery, user-provided files and verified mission products. Generated benchmark imagery is useful for deterministic algorithm tests, but it is not represented as official ISRO, NASA or JAXA imagery. Mission provenance and geospatial metadata must be retained when official products are integrated.

Metrics describe the geometric fit of the accepted correspondences. They do not, by themselves, establish scientific correctness. Reliable cross-mission evaluation also requires traceable source products, documented coordinate systems, independent ground truth and repeatable validation.

## Architecture

```text
React + TypeScript UI
        |
        | HTTPS / JSON + multipart image upload
        v
Go REST API  ---- Authentication / Authorization
        |
        +---- PostgreSQL (jobs, configurations, metrics, audit data)
        |
        +---- Object Storage (originals and generated artifacts)
        |
        +---- Job Queue / Worker Orchestration
                    |
                    v
             Python + OpenCV CV Worker
                    |
                    +---- decode / normalize
                    +---- detect / describe / match
                    +---- RANSAC transform estimation
                    +---- warp / overlay / difference
                    +---- metrics and correspondence output
```

The Go API and Python worker foundation currently live on the `feat/go-python-backend-migration` branch. The frontend has not yet been switched over to that API. The existing application still contains its earlier browser-side registration pipeline and Internet Computer/Motoko persistence. Do not treat the new backend foundation as an already completed end-to-end migration.

## Repository layout

| Path | Responsibility |
|---|---|
| `src/frontend/` | React application, registration workflow, analysis views and reports |
| `src/backend/` | Existing Internet Computer/Motoko application backend |
| `backend/go/` | Go REST API, job lifecycle and PostgreSQL persistence |
| `backend/python/` | Python/OpenCV registration worker |
| `docker-compose.backend.yml` | Local PostgreSQL, CV worker and Go API stack |
| `.github/workflows/` | Frontend, Go and Python CI validation |

## Run the Go + Python services locally

Requirements: Docker Engine with Compose, or Go 1.23+, Python 3.12+ and PostgreSQL 15+.

```bash
docker compose -f docker-compose.backend.yml up --build
```

The API listens on `http://127.0.0.1:8080` and the CV worker is reachable only inside the Compose network.

- `GET /healthz` — API liveness
- `GET /readyz` — API and database readiness
- `POST /api/v1/jobs` — submit source/reference images and a JSON configuration
- `GET /api/v1/jobs` — list recent registration jobs
- `GET /api/v1/jobs/{id}` — retrieve a registration job
- `DELETE /api/v1/jobs/{id}` — delete a registration job

The current API is an integration foundation, not a public production endpoint. It does not yet implement production authentication, durable asynchronous queues, object-storage lifecycle, quotas or full frontend integration. Keep it private. Change the local database password before using the Compose stack beyond an isolated workstation.

## Validation

Frontend:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm --filter @caffeine/template-frontend build
pnpm test
```

Go:

```bash
cd backend/go
go test ./...
```

Python:

```bash
cd backend/python
pip install -r requirements-dev.txt
pytest -q
```

CI is configured to run the frontend, Go and Python validation lanes. A green build is required before release; scientific accuracy additionally requires independent image-pair validation.

## Current engineering priorities

- Complete the frontend-to-Go REST integration and remove the legacy persistence dependency.
- Implement production identity, authorization and user-scoped data access.
- Add durable job execution, retry/cancellation semantics and object storage for large source/result images.
- Complete native TIFF/GeoTIFF handling, coordinate-reference and affine metadata preservation.
- Complete multi-scale feature extraction and sub-pixel correspondence refinement.
- Add official mission-product ingestion with source citations, provenance and coordinate-system checks.
- Establish a curated cross-mission validation corpus with independently verified ground truth and acceptance thresholds.
- Validate the complete user journey, accessibility, responsive layouts, error recovery, security and performance before release.

## License and attribution

Add the repository's chosen license and cite the original mission-product providers and any external datasets used in published evaluations. Do not redistribute mission data without checking the provider's usage terms.
