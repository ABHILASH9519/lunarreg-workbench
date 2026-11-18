# About LunarReg Workbench

LunarReg Workbench is a computer-vision platform for registering and quantitatively comparing lunar surface imagery captured by different missions, sensors and observation conditions.

## Mission

Make cross-mission lunar image comparison reproducible by aligning corresponding surface regions, exposing geometric correspondences and reporting measurable registration quality.

## Research and engineering scope

- Cross-sensor and cross-mission lunar image registration.
- Illumination, scale, resolution and viewpoint variation handling.
- Feature detection, descriptor matching and correspondence filtering.
- RANSAC-based Similarity, Affine and Homography estimation.
- Registered imagery, overlays, difference maps and correspondence visualisation.
- Quantitative reporting: RMSE, reprojection error, inlier ratio, spatial coverage, scale and rotation.
- Reproducible experiment configurations, result history and report exports.

## Technology architecture

- **Go:** primary backend for APIs, identity integration, job orchestration, persistence, storage, observability and cloud deployment.
- **Python:** focused computer-vision service built on OpenCV and NumPy.
- **React + TypeScript:** interactive registration, comparison and analysis interface.
- **PostgreSQL + object storage:** durable metadata, configurations, source imagery and result artifacts.

The intended backend composition is 75–80% Go and 15–20% Python. This is an architecture target, not a measured codebase percentage.

## Mission data and scientific reproducibility

The target mission ecosystem includes ISRO Chandrayaan-2, NASA Lunar Reconnaissance Orbiter and JAXA SELENE/Kaguya. Product provenance, coordinate reference systems, calibration and licensing must be preserved for every external dataset. Generated benchmark imagery is identified as synthetic and must never be presented as an official mission product.

## Maintainer

Developed by **Abhilash Sharma**.

Repository: https://github.com/ABHILASH9519/lunarreg-workbench
