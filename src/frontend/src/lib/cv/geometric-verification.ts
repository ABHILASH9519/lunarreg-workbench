import type {
  ClassifiedCorrespondence,
  Matrix3x3,
  Point2D,
  TransformationModel,
} from "../types";
import {
  applyModel,
  estimateAffine,
  estimateHomography,
  estimateSimilarity,
} from "./models";

/**
 * RANSAC geometric verification: fits a transformation model to
 * correspondences and classifies inliers/outliers. All classification is
 * based on real reprojection error — never fabricated.
 */

export interface RansacOptions {
  /** Reprojection error threshold in pixels. */
  reprojThreshold: number;
  /** Number of RANSAC iterations. */
  iterations: number;
  /** Minimum inlier ratio to accept the model. */
  minInlierRatio: number;
}

const DEFAULT_OPTIONS: RansacOptions = {
  reprojThreshold: 3.0,
  iterations: 200,
  minInlierRatio: 0.3,
};

export interface RansacResult {
  /** Best-fit transformation matrix. */
  matrix: Matrix3x3;
  /** Classified correspondences. */
  correspondences: ClassifiedCorrespondence[];
  /** Number of inliers. */
  inlierCount: number;
  /** Number of outliers. */
  outlierCount: number;
  /** Inlier ratio (0..1). */
  inlierRatio: number;
  /** Mean reprojection error over inliers (px). */
  meanReprojError: number;
  /** True when the model passed the minimum inlier ratio. */
  accepted: boolean;
}

/** Deterministic PRNG so RANSAC is reproducible across runs. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Reprojection error of a single correspondence under a model. */
export function reprojectionError(
  model: TransformationModel,
  matrix: Matrix3x3,
  source: Point2D,
  reference: Point2D,
): number {
  const [px, py] = applyModel(model, matrix, source.x, source.y);
  const dx = px - reference.x;
  const dy = py - reference.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Classify all correspondences under a model. */
export function classifyCorrespondences(
  model: TransformationModel,
  matrix: Matrix3x3,
  points: Array<{ source: Point2D; reference: Point2D }>,
  threshold: number,
): ClassifiedCorrespondence[] {
  return points.map((p) => {
    const err = reprojectionError(model, matrix, p.source, p.reference);
    return {
      source: p.source,
      reference: p.reference,
      inlier: err <= threshold,
      reprojectionError: err,
    };
  });
}

/** Run RANSAC for the given model. */
export function ransac(
  model: TransformationModel,
  points: Array<{ source: Point2D; reference: Point2D }>,
  options?: Partial<RansacOptions>,
): RansacResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const n = points.length;
  if (n === 0) {
    return {
      matrix: [1, 0, 0, 0, 1, 0, 0, 0, 1],
      correspondences: [],
      inlierCount: 0,
      outlierCount: 0,
      inlierRatio: 0,
      meanReprojError: 0,
      accepted: false,
    };
  }

  const sampleSize = model === "homography" ? 4 : model === "affine" ? 3 : 2;
  const rand = mulberry32(42);
  let bestMatrix: Matrix3x3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  let bestInliers = 0;
  let bestError = Number.POSITIVE_INFINITY;

  for (let iter = 0; iter < opts.iterations; iter++) {
    // Sample a minimal set without replacement.
    const indices = new Set<number>();
    while (indices.size < sampleSize) {
      indices.add(Math.floor(rand() * n));
    }
    const sample = [...indices].map((i) => points[i]);
    let matrix: Matrix3x3 | null = null;
    if (model === "similarity") matrix = estimateSimilarity(sample);
    else if (model === "affine") matrix = estimateAffine(sample);
    else matrix = estimateHomography(sample);
    if (!matrix) continue;

    // Count inliers.
    let inliers = 0;
    let errSum = 0;
    for (const p of points) {
      const err = reprojectionError(model, matrix, p.source, p.reference);
      if (err <= opts.reprojThreshold) {
        inliers++;
        errSum += err;
      }
    }
    if (
      inliers > bestInliers ||
      (inliers === bestInliers && errSum < bestError)
    ) {
      bestInliers = inliers;
      bestError = errSum;
      bestMatrix = matrix;
    }
  }

  // Refit on all inliers for a more stable estimate.
  const classified = classifyCorrespondences(
    model,
    bestMatrix,
    points,
    opts.reprojThreshold,
  );
  const inlierPts = classified.filter((c) => c.inlier);
  if (inlierPts.length >= sampleSize) {
    const refit = estimateFromPoints(model, inlierPts);
    if (refit) {
      const reclassified = classifyCorrespondences(
        model,
        refit,
        points,
        opts.reprojThreshold,
      );
      const refitInliers = reclassified.filter((c) => c.inlier);
      if (refitInliers.length >= bestInliers) {
        return buildResult(model, refit, reclassified, opts);
      }
    }
  }
  return buildResult(model, bestMatrix, classified, opts);
}

function estimateFromPoints(
  model: TransformationModel,
  pts: ClassifiedCorrespondence[],
): Matrix3x3 | null {
  const points = pts.map((c) => ({ source: c.source, reference: c.reference }));
  if (model === "similarity") return estimateSimilarity(points);
  if (model === "affine") return estimateAffine(points);
  return estimateHomography(points);
}

function buildResult(
  model: TransformationModel,
  matrix: Matrix3x3,
  classified: ClassifiedCorrespondence[],
  opts: RansacOptions,
): RansacResult {
  const inliers = classified.filter((c) => c.inlier);
  const inlierCount = inliers.length;
  const outlierCount = classified.length - inlierCount;
  const inlierRatio =
    classified.length === 0 ? 0 : inlierCount / classified.length;
  const meanReprojError =
    inlierCount === 0
      ? 0
      : inliers.reduce((s, c) => s + c.reprojectionError, 0) / inlierCount;
  return {
    matrix,
    correspondences: classified,
    inlierCount,
    outlierCount,
    inlierRatio,
    meanReprojError,
    accepted:
      inlierRatio >= opts.minInlierRatio && inlierCount >= sampleSizeFor(model),
  };
}

function sampleSizeFor(model: TransformationModel): number {
  return model === "homography" ? 4 : model === "affine" ? 3 : 2;
}
