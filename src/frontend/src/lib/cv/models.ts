import { TransformationModel } from "@/backend";
import type { Matrix3x3, Point2D } from "../types";

/**
 * Transformation model estimation: similarity (2-pt), affine (3-pt),
 * homography (4-pt DLT). All matrices are estimated from real
 * correspondences via least squares / DLT.
 */

export type ModelPoints = Array<{ source: Point2D; reference: Point2D }>;

/** Apply a model matrix to a point. Returns [x, y]. */
export function applyModel(
  model: TransformationModel,
  m: Matrix3x3,
  x: number,
  y: number,
): [number, number] {
  const [a, b, c, d, e, f, g, h, i] = m;
  if (model === "homography") {
    const w = g * x + h * y + i;
    if (Math.abs(w) < 1e-9) return [x, y];
    return [(a * x + b * y + c) / w, (d * x + e * y + f) / w];
  }
  // Similarity / affine: linear transform + translation.
  return [a * x + b * y + c, d * x + e * y + f];
}

/** Estimate a similarity transform (scale + rotation + translation) from >=2 points. */
export function estimateSimilarity(points: ModelPoints): Matrix3x3 | null {
  if (points.length < 2) return null;
  // Least squares: solve for [a, b, c, d, e, f] with constraint a^2+b^2 = d^2+e^2.
  // Use the closed-form Umeyama-style solution on the first two points.
  const p0 = points[0].source;
  const p1 = points[1].source;
  const q0 = points[0].reference;
  const q1 = points[1].reference;
  const sx = p1.x - p0.x;
  const sy = p1.y - p0.y;
  const tx = q1.x - q0.x;
  const ty = q1.y - q0.y;
  const len2 = sx * sx + sy * sy;
  if (len2 < 1e-9) return null;
  // Rotation matrix mapping source delta to reference delta, scaled.
  const a = (sx * tx + sy * ty) / len2;
  const b = (sx * ty - sy * tx) / len2;
  const d = -b;
  const e = a;
  const c = q0.x - (a * p0.x + b * p0.y);
  const f = q0.y - (d * p0.x + e * p0.y);
  return [a, b, c, d, e, f, 0, 0, 1];
}

/** Estimate an affine transform (6 DOF) from >=3 points via least squares. */
export function estimateAffine(points: ModelPoints): Matrix3x3 | null {
  if (points.length < 3) return null;
  // Solve normal equations for the 6 unknowns.
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  let sx = 0;
  let sy = 0;
  let sxu = 0;
  let syu = 0;
  let su = 0;
  let sxv = 0;
  let syv = 0;
  let sv = 0;
  for (const p of points) {
    const x = p.source.x;
    const y = p.source.y;
    const u = p.reference.x;
    const v = p.reference.y;
    sxx += x * x;
    syy += y * y;
    sxy += x * y;
    sx += x;
    sy += y;
    sxu += x * u;
    syu += y * u;
    su += u;
    sxv += x * v;
    syv += y * v;
    sv += v;
  }
  const n = points.length;
  const det =
    sxx * syy * n +
    2 * sxy * sx * sy -
    sxy * sxy * n -
    sxx * sy * sy -
    sx * sx * syy;
  if (Math.abs(det) < 1e-9) return null;
  const inv = 1 / det;
  const a =
    ((syy * n - sy * sy) * sxu +
      (sx * sy - sxy * n) * syu +
      (sxy * sy - sx * syy) * su) *
    inv;
  const b =
    ((sx * sy - sxy * n) * sxu +
      (sxx * n - sx * sx) * syu +
      (sx * sxy - sxx * sy) * su) *
    inv;
  const c =
    ((sxy * sy - sx * syy) * sxu +
      (sx * sxy - sxx * sy) * syu +
      (sxx * syy - sxy * sxy) * su) *
    inv;
  const d =
    ((syy * n - sy * sy) * sxv +
      (sx * sy - sxy * n) * syv +
      (sxy * sy - sx * syy) * sv) *
    inv;
  const e =
    ((sx * sy - sxy * n) * sxv +
      (sxx * n - sx * sx) * syv +
      (sx * sxy - sxx * sy) * sv) *
    inv;
  const f =
    ((sxy * sy - sx * syy) * sxv +
      (sx * sxy - sxx * sy) * syv +
      (sxx * syy - sxy * sxy) * sv) *
    inv;
  return [a, b, c, d, e, f, 0, 0, 1];
}

/** Estimate a homography (8 DOF) from >=4 points via DLT. */
export function estimateHomography(points: ModelPoints): Matrix3x3 | null {
  if (points.length < 4) return null;
  // Build the 2n x 9 DLT matrix.
  const rows: number[][] = [];
  for (const p of points) {
    const x = p.source.x;
    const y = p.source.y;
    const u = p.reference.x;
    const v = p.reference.y;
    rows.push([-x, -y, -1, 0, 0, 0, u * x, u * y, u]);
    rows.push([0, 0, 0, -x, -y, -1, v * x, v * y, v]);
  }
  // Solve via SVD of the 2n x 9 matrix (power iteration on A^T A).
  const ata = new Array<number>(81).fill(0);
  for (const row of rows) {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        ata[i * 9 + j] += row[i] * row[j];
      }
    }
  }
  // Power iteration to find the smallest eigenvector of A^T A.
  let v = new Array<number>(9).fill(1);
  v[8] = 1;
  for (let iter = 0; iter < 60; iter++) {
    const next = new Array<number>(9).fill(0);
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        next[i] += ata[i * 9 + j] * v[j];
      }
    }
    // Shift by the largest eigenvalue to converge to the smallest.
    let maxAbs = 0;
    for (let i = 0; i < 9; i++) maxAbs = Math.max(maxAbs, Math.abs(next[i]));
    if (maxAbs < 1e-12) break;
    for (let i = 0; i < 9; i++) next[i] /= maxAbs;
    v = next;
  }
  // v is now the eigenvector for the smallest eigenvalue (approximately).
  const h = v;
  const scale = h[8] === 0 ? 1 : h[8];
  return [
    h[0] / scale,
    h[1] / scale,
    h[2] / scale,
    h[3] / scale,
    h[4] / scale,
    h[5] / scale,
    h[6] / scale,
    h[7] / scale,
    1,
  ];
}

/** Decompose a similarity/affine matrix into scale, rotation, translation. */
export function decomposeMatrix(m: Matrix3x3): {
  scale: number;
  rotationDegrees: number;
  tx: number;
  ty: number;
} {
  const [a, _b, c, d, _e, f] = m;
  const scale = Math.sqrt(a * a + d * d);
  const rotationDegrees = (Math.atan2(d, a) * 180) / Math.PI;
  return { scale, rotationDegrees, tx: c, ty: f };
}

export interface ModelConsistency {
  model: TransformationModel;
  inlierRatio: number;
  meanReprojError: number;
  inlierCount: number;
  /** Degrees of freedom of the model. */
  dof: number;
}

/**
 * Recommend the best model from actual geometric-consistency metrics.
 * Prefers the simplest model whose inlier ratio is within a small tolerance
 * of the best, penalizing over-parameterized models (Occam).
 */
export function recommendModel(
  consistency: ModelConsistency[],
): TransformationModel {
  if (consistency.length === 0) return TransformationModel.similarity;
  const best = [...consistency].sort(
    (a, b) =>
      b.inlierRatio - a.inlierRatio || a.meanReprojError - b.meanReprojError,
  )[0];
  const tolerance = 0.02;
  const candidates = consistency.filter(
    (c) => c.inlierRatio >= best.inlierRatio - tolerance,
  );
  candidates.sort((a, b) => a.dof - b.dof || b.inlierRatio - a.inlierRatio);
  return candidates[0].model;
}
