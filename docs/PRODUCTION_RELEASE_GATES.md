# Production Release Gates

This checklist defines the acceptance gates for a final LunarReg submission. A feature is complete only when it is implemented, integrated into the real user workflow, covered by automated tests and verified in the target deployment environment.

## 1. Frontend, interface and user experience

- [ ] Remove all presentation-only labels and navigation from the shipped interface.
- [ ] Responsive layouts for desktop, tablet and mobile widths.
- [ ] Consistent design tokens, typography, backgrounds, icons, spacing and accessible contrast.
- [ ] Motion is purposeful: route transitions, panel entrance, progress feedback and hover/focus states respect reduced-motion preferences.
- [ ] Every visible button, menu, tab, filter, export and action performs its stated operation.
- [ ] Upload validation covers file type, size, corrupt images, mismatched dimensions and unsupported metadata.
- [ ] Loading, empty, success, warning, cancellation and failure states are complete and recoverable.
- [ ] Keyboard navigation, visible focus, labels, accessible names and screen-reader announcements are verified.
- [ ] No hard-coded dashboard metrics or fake job history.

## 2. Go API and application services

- [ ] Frontend uses the Go API for registration jobs and results; legacy Motoko persistence is removed or deliberately retained only for a documented purpose.
- [ ] Authentication tokens are cryptographically verified; authorization is enforced on every user-owned job and artifact.
- [ ] Request schemas, image limits, content sniffing, timeouts and rate limits are enforced.
- [ ] Durable asynchronous job execution supports progress, cancellation, retries, idempotency and failure recovery.
- [ ] OpenAPI contract is generated and frontend client types are derived from it.
- [ ] Structured logs, request IDs, metrics, tracing and health/readiness checks are present.
- [ ] API versioning, graceful shutdown and database migration strategy are tested.

## 3. Database and storage

- [ ] PostgreSQL schema includes users/ownership, jobs, immutable configurations, results, artifacts, provenance and audit events.
- [ ] Database migrations are versioned, reversible where practical and exercised in CI.
- [ ] Row-level authorization is enforced in the service layer and database where appropriate.
- [ ] Source images and result artifacts use durable object storage; database rows store checksums, media types, dimensions and object keys.
- [ ] Retention, deletion, backup and restore procedures are verified.
- [ ] Secrets are supplied through the deployment secret manager, never committed to the repository.

## 4. Computer-vision correctness

- [ ] SIFT, ORB, AKAZE and any additional detector are the actual named algorithms, not approximations labelled as those algorithms.
- [ ] Descriptor norms, ratio filtering, mutual cross-check and duplicate correspondence handling are tested.
- [ ] Similarity, Affine and Homography models have appropriate minimum correspondence counts, degeneracy checks and RANSAC validation.
- [ ] Image coordinate conventions, transform direction, interpolation and output dimensions are documented and tested.
- [ ] RMSE and reprojection error are calculated from clearly defined accepted correspondences in documented coordinate units.
- [ ] Inlier ratio, spatial coverage, scale and rotation use stable and explicitly documented definitions.
- [ ] Multi-scale feature extraction and sub-pixel refinement are implemented and measured before they are advertised.
- [ ] TIFF/GeoTIFF decoding preserves georeferencing, CRS, affine transforms, nodata and relevant metadata.
- [ ] Numeric edge cases, low-texture images, illumination changes, extreme scale/rotation, partial overlap and false-match cases are covered.

## 5. Dataset ingestion and scientific validation

- [ ] Dataset connectors use official mission archives or explicitly licensed sources.
- [ ] Every imported product records mission, instrument, product identifier, source URL, acquisition metadata, CRS, license and checksum.
- [ ] Remote downloads validate host allowlists, redirects, size limits, MIME type and archive contents to prevent SSRF and decompression attacks.
- [ ] Benchmark imagery is clearly identified as synthetic; user uploads and official mission products have separate provenance.
- [ ] A curated cross-mission evaluation corpus includes documented ground-truth transforms or control points.
- [ ] Acceptance thresholds are defined per dataset and transformation model.
- [ ] Metrics are compared against independent ground truth; a low reprojection error alone is not treated as proof of scientific correctness.
- [ ] Results are repeatable across supported operating systems and deployment targets within documented numerical tolerances.

## 6. Security and deployment

- [ ] Threat model, dependency scanning, static analysis and container image scanning pass.
- [ ] TLS, least-privilege IAM, network isolation and managed secrets are configured.
- [ ] Non-root containers, resource requests/limits, autoscaling and graceful worker termination are tested.
- [ ] Production PostgreSQL and object storage have backups, encryption and lifecycle policies.
- [ ] Deployment manifests, rollback strategy and environment configuration are reviewed.
- [ ] No development passwords, unauthenticated public APIs or local emulator endpoints are exposed.
- [ ] Load, soak, failure-injection and recovery tests meet documented service objectives.

## 7. Final acceptance

- [ ] Clean install and build from a fresh checkout.
- [ ] Full frontend, Go, Python, integration and end-to-end suites pass.
- [ ] Upload → process → persist → retrieve → compare → export works from the real UI.
- [ ] User isolation, unauthorized access, malformed uploads and interrupted jobs are tested.
- [ ] A reviewer can reproduce a run from its stored configuration and input checksums.
- [ ] Deployment smoke tests pass in the actual target environment.
- [ ] All release claims match features verified in the shipped commit.

## Current branch note

The Go API and Python/OpenCV worker foundation has been added on `feat/go-python-backend-migration`. The existing frontend still contains the earlier Internet Computer/Motoko job path and browser-side CV path; the new Go API is not yet the fully integrated production system. Authentication, durable background processing, object storage, GeoTIFF georeferencing, scientific ground-truth validation and complete end-to-end acceptance remain release blockers until implemented and verified.
