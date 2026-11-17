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
  let meanX = 0;
  let meanY = 0;
  let meanU = 0;
  let meanV = 0;
  for (const point of points) {
    meanX += point.source.x;
    meanY += point.source.y;
    meanU += point.reference.x;
    meanV += point.reference.y;
  }
  const n = points.length;
  meanX /= n;
  meanY /= n;
  meanU /= n;
  meanV /= n;

  let variance = 0;
  let dot = 0;
  let cross = 0;
  for (const point of points) {
    const x = point.source.x - meanX;
    const y = point.source.y - meanY;
    const u = point.reference.x - meanU;
    const v = point.reference.y - meanV;
    variance += x * x + y * y;
    dot += x * u + y * v;
    cross += x * v - y * u;
  }
  if (variance < 1e-9) return null;
  const a = dot / variance;
  const b = cross / variance;
  const d = -b;
  const e = a;
  const c = meanU - a * meanX - b * meanY;
  const f = meanV - d * meanX - e * meanY;
  return [a, b, c, d, e, f, 0, 0, 1];

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
  // Build the symmetric normal matrix A^T A for the DLT system.
  const ata = new Array<number>(81).fill(0);
  for (const point of points) {
    const { x, y } = point.source;
    const { x: u, y: v } = point.reference;
    const rows = [
      [-x, -y, -1, 0, 0, 0, u * x, u * y, u],
      [0, 0, 0, -x, -y, -1, v * x, v * y, v],
    ];
    for (const row of rows) {
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) ata[i * 9 + j] += row[i] * row[j];
      }
    }
  }

  // Jacobi eigensolver for a real symmetric 9x9 matrix. DLT needs the
  // eigenvector of the smallest eigenvalue (the null-space direction).
  const eigenvectors = new Array<number>(81).fill(0);
  for (let i = 0; i < 9; i++) eigenvectors[i * 9 + i] = 1;
  for (let iteration = 0; iteration < 1200; iteration++) {
    let p = 0;
    let q = 1;
    let largest = 0;
    for (let i = 0; i < 9; i++) {
      for (let j = i + 1; j < 9; j++) {
        const value = Math.abs(ata[i * 9 + j]);
        if (value > largest) {
          largest = value;
          p = i;
          q = j;
        }
      }
    }
    if (largest < 1e-10) break;
    const app = ata[p * 9 + p];
    const aqq = ata[q * 9 + q];
    const apq = ata[p * 9 + q];
    if (Math.abs(apq) < 1e-15) continue;
    const tau = (aqq - app) / (2 * apq);
    const t = (tau >= 0 ? 1 : -1) / (Math.abs(tau) + Math.sqrt(1 + tau * tau));
    const cosine = 1 / Math.sqrt(1 + t * t);
    const sine = t * cosine;

    for (let k = 0; k < 9; k++) {
      if (k === p || k === q) continue;
      const akp = ata[k * 9 + p];
      const akq = ata[k * 9 + q];
      const nextP = cosine * akp - sine * akq;
      const nextQ = sine * akp + cosine * akq;
      ata[k * 9 + p] = nextP;
      ata[p * 9 + k] = nextP;
      ata[k * 9 + q] = nextQ;
      ata[q * 9 + k] = nextQ;
    }
    ata[p * 9 + p] = app - t * apq;
    ata[q * 9 + q] = aqq + t * apq;
    ata[p * 9 + q] = 0;
    ata[q * 9 + p] = 0;

    for (let k = 0; k < 9; k++) {
      const vkp = eigenvectors[k * 9 + p];
      const vkq = eigenvectors[k * 9 + q];
      eigenvectors[k * 9 + p] = cosine * vkp - sine * vkq;
      eigenvectors[k * 9 + q] = sine * vkp + cosine * vkq;
    }
  }

  let smallestIndex = 0;
  for (let i = 1; i < 9; i++) {
    if (ata[i * 9 + i] < ata[smallestIndex * 9 + smallestIndex]) smallestIndex = i;
  }
  const h = Array.from({ length: 9 }, (_, row) => eigenvectors[row * 9 + smallestIndex]);
  const scale = Math.abs(h[8]) > 1e-9 ? h[8] : Math.max(...h.map(Math.abs));
  if (!Number.isFinite(scale) || Math.abs(scale) < 1e-12) return null;
  const normalized = h.map((value) => value / scale);
  if (normalized.some((value) => !Number.isFinite(value))) return null;
  return normalized as Matrix3x3;

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
