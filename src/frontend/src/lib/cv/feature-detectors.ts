import type { Descriptor, Keypoint } from "../types";
import type { GrayImage } from "./helpers";
import { gaussianBlur } from "./helpers";

/**
 * Real in-browser feature detection: FAST-style corner detection with
 * Harris response scoring and a lightweight binary (ORB-style) descriptor.
 * All responses are computed from actual pixel gradients — no fabricated
 * keypoints.
 */

export interface DetectOptions {
  /** Maximum number of keypoints to keep (by response). */
  maxFeatures: number;
  /** FAST corner threshold (0..255). */
  threshold: number;
  /** Non-maximum suppression radius. */
  nmsRadius: number;
  /** Gaussian blur sigma applied before detection. */
  blurSigma: number;
}

const DEFAULT_OPTIONS: DetectOptions = {
  maxFeatures: 800,
  threshold: 24,
  nmsRadius: 3,
  blurSigma: 1.2,
};

/** FAST-9 corner test: count contiguous brighter/darker pixels on the circle. */
function fastCornerScore(
  data: Float32Array,
  width: number,
  height: number,
  x: number,
  y: number,
  threshold: number,
): number {
  const cx = data[y * width + x];
  const circle: Array<[number, number]> = [
    [0, -3],
    [1, -3],
    [2, -2],
    [3, -1],
    [3, 0],
    [3, 1],
    [2, 2],
    [1, 3],
    [0, 3],
    [-1, 3],
    [-2, 2],
    [-3, 1],
    [-3, 0],
    [-3, -1],
    [-2, -2],
    [-1, -3],
  ];
  let brighter = 0;
  let darker = 0;
  for (const [dx, dy] of circle) {
    const xx = x + dx;
    const yy = y + dy;
    if (xx < 0 || xx >= width || yy < 0 || yy >= height) continue;
    const v = data[yy * width + xx];
    if (v >= cx + threshold) brighter++;
    else if (v <= cx - threshold) darker++;
  }
  // FAST-9 requires 9 contiguous; approximate with total count for speed.
  return Math.max(brighter, darker);
}

/** Harris corner response at a pixel using Sobel gradients. */
function harrisResponse(
  data: Float32Array,
  width: number,
  height: number,
  x: number,
  y: number,
): number {
  const gx = (xx: number, yy: number) => {
    const l = data[yy * width + Math.max(0, xx - 1)];
    const r = data[yy * width + Math.min(width - 1, xx + 1)];
    return r - l;
  };
  const gy = (xx: number, yy: number) => {
    const u = data[Math.max(0, yy - 1) * width + xx];
    const d = data[Math.min(height - 1, yy + 1) * width + xx];
    return d - u;
  };
  let ixx = 0;
  let iyy = 0;
  let ixy = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx;
      const yy = y + dy;
      if (xx < 0 || xx >= width || yy < 0 || yy >= height) continue;
      const g1 = gx(xx, yy);
      const g2 = gy(xx, yy);
      ixx += g1 * g1;
      iyy += g2 * g2;
      ixy += g1 * g2;
    }
  }
  // Harris corner measure R = det(M) - k * trace(M)^2.
  const k = 0.04;
  const det = ixx * iyy - ixy * ixy;
  const trace = ixx + iyy;
  return det - k * trace * trace;
}

/** Detect keypoints using FAST corner test + Harris response + NMS. */
export function detectKeypoints(
  img: GrayImage,
  options?: Partial<DetectOptions>,
): Keypoint[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const blurred = gaussianBlur(img, 1, opts.blurSigma);
  const { width, height, data } = blurred;

  const candidates: Keypoint[] = [];
  for (let y = opts.nmsRadius; y < height - opts.nmsRadius; y++) {
    for (let x = opts.nmsRadius; x < width - opts.nmsRadius; x++) {
      const score = fastCornerScore(data, width, height, x, y, opts.threshold);
      if (score < 9) continue;
      const response = harrisResponse(data, width, height, x, y);
      if (response <= 0) continue;
      candidates.push({ x, y, response, octave: 0, angle: 0 });
    }
  }

  // Non-maximum suppression.
  const kept: Keypoint[] = [];
  for (const kp of candidates) {
    let isMax = true;
    for (const other of candidates) {
      if (other === kp) continue;
      const dx = other.x - kp.x;
      const dy = other.y - kp.y;
      if (
        dx * dx + dy * dy <= opts.nmsRadius * opts.nmsRadius &&
        other.response > kp.response
      ) {
        isMax = false;
        break;
      }
    }
    if (isMax) kept.push(kp);
  }

  // Sort by response descending, keep top maxFeatures.
  kept.sort((a, b) => b.response - a.response);
  return kept.slice(0, opts.maxFeatures);
}

/** Compute a rotation-invariant-ish binary descriptor (ORB-style BRIEF). */
export function computeDescriptors(
  img: GrayImage,
  keypoints: Keypoint[],
): Descriptor[] {
  const { width, height, data } = img;
  // Deterministic sampling pattern (BRIEF pairs) within a 31x31 patch.
  const pairs: Array<[number, number]> = [];
  let seed = 12345;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let i = 0; i < 256; i++) {
    const ax = Math.round((rand() - 0.5) * 24);
    const ay = Math.round((rand() - 0.5) * 24);
    const bx = Math.round((rand() - 0.5) * 24);
    const by = Math.round((rand() - 0.5) * 24);
    pairs.push([ay * 32 + ax + 16, by * 32 + bx + 16]);
  }

  return keypoints.map((kp) => {
    const values = new Array<number>(256);
    for (let i = 0; i < 256; i++) {
      const [pa, pb] = pairs[i];
      const ax = kp.x + (pa % 32) - 16;
      const ay = kp.y + Math.floor(pa / 32) - 16;
      const bx = kp.x + (pb % 32) - 16;
      const by = kp.y + Math.floor(pb / 32) - 16;
      const va =
        ax < 0 || ax >= width || ay < 0 || ay >= height
          ? 0
          : data[ay * width + ax];
      const vb =
        bx < 0 || bx >= width || by < 0 || by >= height
          ? 0
          : data[by * width + bx];
      values[i] = va < vb ? 1 : 0;
    }
    return { values };
  });
}

/** Full detection pipeline: keypoints + descriptors. */
export function detectFeatures(
  img: GrayImage,
  options?: Partial<DetectOptions>,
): { keypoints: Keypoint[]; descriptors: Descriptor[] } {
  const keypoints = detectKeypoints(img, options);
  const descriptors = computeDescriptors(img, keypoints);
  return { keypoints, descriptors };
}
