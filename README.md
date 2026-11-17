# LunarReg Workbench 🌕

**Automated lunar image registration and correspondence analysis**

LunarReg Workbench aligns a moving lunar image with a fixed reference image and evaluates the geometric consistency of the alignment. It is intended for comparative analysis of lunar imagery from missions such as Chandrayaan-2, NASA's Lunar Reconnaissance Orbiter (LRO), and SELENE.

## Current implementation

The current repository is a React 19 + TypeScript + Vite application with an Internet Computer (Motoko) canister for user-scoped registration-job metadata and result history. The image-registration pipeline currently executes in the browser on decoded image pixels; it is **not** a Python/OpenCV server implementation.

### Implemented in the current codebase

- Source (moving) and reference (fixed) image selection.
- PNG and JPEG/JPG uploads, with a 20 MB per-file guard.
- Grayscale conversion, optional denoising, and contrast enhancement.
- Gaussian-pyramid generation for multi-scale analysis (the current feature detector operates on the processed base level).
- FAST-style corner detection with Harris response ranking and a deterministic BRIEF-like binary descriptor (an ORB-inspired implementation, not OpenCV's ORB implementation).
- Hamming-distance descriptor matching, Lowe-style ratio filtering, and mutual-nearest-neighbour cross-check.
- RANSAC geometric verification for Similarity, Affine, and Homography candidates.
- Explicit user-selected transformation model for the registration warp; candidate-model statistics remain available for comparison.
- Spatial-grid correspondence filtering.
- Registered grayscale output, overlay, difference, and checkerboard composites.
- Computed inlier/outlier counts, RMSE, reprojection error, spatial coverage, scale, and rotation where available.
- Job creation, result persistence, job history, and report/export interfaces through the application.

### Not yet integrated (do not present as completed)

- Native TIFF/GeoTIFF decoding and geospatial metadata preservation.
- OpenCV-backed SIFT, ORB, AKAZE, BRISK, or KAZE implementations. The current detector is the documented FAST + BRIEF-like implementation only.
- True multi-octave feature detection across the generated pyramid.
- Sub-pixel correspondence refinement.
- A Python/OpenCV processing service or server-side GPU acceleration.
- Independent scientific validation against a curated set of official cross-mission lunar image pairs.

The UI should show unavailable metrics as N/A and should not substitute sample values for measurements. Bundled synthetic pairs are labeled DEMO/SAMPLE DATA and must not be described as official mission imagery.

## Workflow

1. Choose a bundled synthetic sample pair or upload a supported PNG/JPEG pair.
2. Configure preprocessing, feature count, descriptor ratio/cross-check, RANSAC threshold, spatial grid, and transformation model.
3. Run the browser-side registration pipeline.
4. Inspect the correspondence set, inliers/outliers, registered output, overlay, difference, and checkerboard views.
5. Review computed metrics and warnings.
6. Save the result to the signed-in user's job history and export the available report/artifacts.

## Technology stack

| Layer | Current technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| UI and routing | Radix UI components, TanStack Router, Zustand |
| Registration engine | TypeScript browser-side computer-vision implementation |
| Geometric verification | RANSAC and Similarity/Affine/Homography estimators |
| Backend | Motoko canister on the Internet Computer |
| Persistence | User-scoped job and result records in the canister; uploaded image bytes are processed client-side |
| Tests | Vitest, Testing Library, PocketIC backend test lane |

## Local development

Use Node.js 22 and pnpm 9 (the repository is a pnpm workspace).

```bash
pnpm install --frozen-lockfile
pnpm --dir src/frontend dev
```

Validation commands:

```bash
pnpm typecheck
pnpm --filter @caffeine/template-frontend build
pnpm test
```

Backend development additionally requires the Motoko package manager (mops) and the project's configured Internet Computer environment.

## Scientific interpretation

RMSE and reprojection error are calculated from the accepted correspondences under the selected geometric model. Inlier ratio, spatial coverage, scale, and rotation provide complementary diagnostics; none alone proves scientific correctness. A successful software run is not a substitute for ground-truth validation or mission-product provenance checks.

## Future work

Integrate a dedicated TIFF/GeoTIFF reader, add standards-based SIFT/ORB/AKAZE or learned feature pipelines, perform multi-scale feature detection, implement sub-pixel refinement, and validate against sourced cross-mission image pairs with documented ground truth.
