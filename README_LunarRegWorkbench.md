# LunarRegWorkbench 🌕
### Automated Lunar Image Registration & Correspondence Analysis

LunarRegWorkbench is a computer-vision-based platform designed to align and analyze lunar images captured by different missions and sensors, including Chandrayaan-2, the Lunar Reconnaissance Orbiter (LRO), and SELENE. It identifies common lunar surface features and registers a source image against a reference image despite differences in illumination, viewing angle, scale, resolution, and sensor characteristics.

## The Problem

Images of the same lunar region can look very different when captured by different spacecraft, cameras, or under different lighting conditions. This makes direct comparison and accurate alignment challenging.

## Our Solution

LunarRegWorkbench provides a structured image-registration workflow that detects and matches features across two images, estimates a geometric transformation, aligns the source image to the reference, and evaluates the result using visual and quantitative measures.

## Key Features

- **Multi-format input:** PNG, JPG/JPEG, TIFF, and GeoTIFF, subject to implementation support.
- **Image preprocessing:** Contrast enhancement, denoising, and illumination normalization.
- **Multi-scale processing:** Helps handle differences in image scale and resolution.
- **Feature extraction:** SIFT, ORB, and AKAZE.
- **Feature matching:** Descriptor matching with filtering, ratio testing, and cross-checking.
- **Geometric verification:** RANSAC-based outlier rejection.
- **Transformation models:** Similarity, Affine, and Homography, depending on correspondence quality.
- **Spatial coverage:** Grid-based selection helps avoid matches clustering in one region.
- **Sub-pixel refinement:** Supports more precise correspondence locations.
- **Visual comparison:** Original, reference, registered, overlay, difference, and checkerboard views.
- **Quantitative evaluation:** RMSE, inlier count, inlier ratio, reprojection error, spatial coverage, scale, rotation, and processing time.
- **Experiment history and reporting:** Designed to save configurations, metrics, correspondence points, transformation parameters, and outputs, and to generate reports.

## How It Works

1. **Upload images** — Select a source/moving image and a reference/fixed image.
2. **Preprocess** — Enhance image contrast and reduce illumination differences.
3. **Process at multiple scales** — Build image pyramids to handle scale and resolution variation.
4. **Extract features** — Detect distinctive points using SIFT, ORB, or AKAZE.
5. **Match features** — Find likely correspondences between the two images.
6. **Verify matches** — Use filtering and RANSAC to reject unreliable matches.
7. **Estimate transformation** — Determine a suitable Similarity, Affine, or Homography transformation.
8. **Register the image** — Transform the source image to align with the reference.
9. **Inspect and evaluate** — Review visual comparisons and quantitative metrics.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Next.js, TypeScript |
| Computer-vision processing | Python, OpenCV |
| Backend communication | REST API architecture |
| Image processing | SIFT, ORB, AKAZE, descriptor matching, RANSAC |
| Data and outputs | Image/file storage, metadata, experiment history, reports |

> **Implementation note:** Confirm the database, deployment platform, and any additional services against the current codebase before listing them as implemented technologies.

## Architecture Overview

```text
User
  |
  v
React / Next.js Frontend
  |
  v
REST API / Backend Services
  |
  v
Python + OpenCV Registration Engine
  |
  +--> Preprocessing and illumination normalization
  +--> Multi-scale image processing
  +--> Feature extraction and matching
  +--> RANSAC geometric verification
  +--> Transformation estimation and registration
  |
  v
Registered Image + Correspondences + Quality Metrics
  |
  v
Visualization, Experiment History, and Reports
```

## Evaluation Metrics

LunarRegWorkbench is designed to evaluate registration using:

- **RMSE (Root Mean Square Error):** Measures the magnitude of registration error for the evaluated points.
- **Inlier count and inlier ratio:** Indicate how many matched points are consistent with the estimated geometric model.
- **Reprojection error:** Measures the discrepancy between observed points and points projected by the transformation.
- **Spatial coverage:** Indicates how widely correspondence points are distributed across the image.
- **Scale, rotation, and processing time:** Help characterize the estimated alignment and computational cost.

Metrics should be interpreted together; no single metric guarantees that an image is correctly registered.

## Future Scope

The architecture is intended to allow future experimentation with learned feature and matching methods such as **SuperPoint, LoFTR, and LightGlue**. These should be described as future extensions unless they have been integrated and tested in the current implementation. Further work may include broader sensor and dataset validation, performance optimization for large images, and optional GPU acceleration.

## Intended Applications

- Comparing lunar imagery across missions and sensors.
- Supporting lunar surface analysis and visual inspection.
- Evaluating image-registration methods under different imaging conditions.
- Reproducible experiments and quantitative comparison of registration configurations.

## Project Status

The documented design describes the intended workflow and architecture. Feature availability may vary by prototype version; verify each feature against the current implementation before presenting it as completed.

## Contributing

Contributions, testing, and suggestions are welcome. Before contributing, document the setup steps, dependencies, supported input formats, and test procedure for the current codebase.

## License

Add the license selected for this project before distributing or accepting external contributions.
