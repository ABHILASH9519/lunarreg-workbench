import type {
  ClassifiedCorrespondence,
  JobMetrics,
  Matrix3x3,
  TransformationModel,
} from "../types";
import { applyModel, decomposeMatrix } from "./models";

/**
 * Registration metrics computed from real correspondences and the fitted
 * model: RMSE, reprojection error, inlier ratio, spatial coverage, scale,
 * rotation. Where a metric cannot be computed, it is left null (N/A).
 */

export interface MetricsInput {
  model: TransformationModel;
  matrix: Matrix3x3;
  correspondences: ClassifiedCorrespondence[];
  /** Image dimensions (source) for spatial coverage. */
  width: number;
  height: number;
}

/** Root-mean-square reprojection error over inliers (px). */
export function computeRmse(
  correspondences: ClassifiedCorrespondence[],
): number | null {
  const inliers = correspondences.filter((c) => c.inlier);
  if (inliers.length === 0) return null;
  let sum = 0;
  for (const c of inliers) sum += c.reprojectionError * c.reprojectionError;
  return Math.sqrt(sum / inliers.length);
}

/** Mean reprojection error over inliers (px). */
export function computeMeanReprojError(
  correspondences: ClassifiedCorrespondence[],
): number | null {
  const inliers = correspondences.filter((c) => c.inlier);
  if (inliers.length === 0) return null;
  return inliers.reduce((s, c) => s + c.reprojectionError, 0) / inliers.length;
}

/** Inlier ratio (0..1). */
export function computeInlierRatio(
  correspondences: ClassifiedCorrespondence[],
): number {
  if (correspondences.length === 0) return 0;
  return (
    correspondences.filter((c) => c.inlier).length / correspondences.length
  );
}

/**
 * Spatial coverage: fraction of the image area covered by the convex hull
 * of inlier source points (0..1). Uses a coarse grid occupancy estimate.
 */
export function computeSpatialCoverage(
  correspondences: ClassifiedCorrespondence[],
  width: number,
  height: number,
): number | null {
  const inliers = correspondences.filter((c) => c.inlier);
  if (inliers.length < 3) return null;
  const grid = 8;
  const occupied = new Set<number>();
  for (const c of inliers) {
    const gx = Math.min(
      grid - 1,
      Math.max(0, Math.floor((c.source.x / width) * grid)),
    );
    const gy = Math.min(
      grid - 1,
      Math.max(0, Math.floor((c.source.y / height) * grid)),
    );
    occupied.add(gy * grid + gx);
  }
  return occupied.size / (grid * grid);
}

/** Compute all metrics for a registration result. */
export function computeMetrics(input: MetricsInput): JobMetrics {
  const { matrix, correspondences, width, height } = input;
  const inliers = correspondences.filter((c) => c.inlier);
  const { scale, rotationDegrees } = decomposeMatrix(matrix);
  return {
    rmse: computeRmse(correspondences) ?? undefined,
    reprojectionError: computeMeanReprojError(correspondences) ?? undefined,
    inlierCount: BigInt(inliers.length),
    outlierCount: BigInt(correspondences.length - inliers.length),
    spatialCoverage:
      computeSpatialCoverage(correspondences, width, height) ?? undefined,
    scale,
    rotationDegrees,
  };
}

/** Reproject a source point to reference space (for display). */
export function reprojectPoint(
  model: TransformationModel,
  matrix: Matrix3x3,
  x: number,
  y: number,
): [number, number] {
  return applyModel(model, matrix, x, y);
}
