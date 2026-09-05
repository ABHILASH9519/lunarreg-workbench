import { T as TransformationModel } from "./backend-DPWNum9l.js";
function rgbaToGray(imageData) {
  const { width, height, data } = imageData;
  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }
  return { width, height, data: gray };
}
function clamp255(v) {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}
function gaussianKernel(radius, sigma) {
  const size = radius * 2 + 1;
  const kernel = new Array(size);
  let sum = 0;
  for (let i = -radius; i <= radius; i++) {
    const v = Math.exp(-(i * i) / (2 * sigma * sigma));
    kernel[i + radius] = v;
    sum += v;
  }
  for (let i = 0; i < size; i++) kernel[i] /= sum;
  return kernel;
}
function gaussianBlur(img, radius, sigma) {
  const { width, height, data } = img;
  const kernel = gaussianKernel(radius, sigma);
  const k = kernel.length;
  const half = radius;
  const tmp = new Float32Array(width * height);
  const out = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let acc = 0;
      for (let j = 0; j < k; j++) {
        const xx = x + (j - half);
        const clamped = xx < 0 ? 0 : xx >= width ? width - 1 : xx;
        acc += data[y * width + clamped] * kernel[j];
      }
      tmp[y * width + x] = acc;
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let acc = 0;
      for (let j = 0; j < k; j++) {
        const yy = y + (j - half);
        const clamped = yy < 0 ? 0 : yy >= height ? height - 1 : yy;
        acc += tmp[clamped * width + x] * kernel[j];
      }
      out[y * width + x] = acc;
    }
  }
  return { width, height, data: out };
}
function grayToImageData(img) {
  const { width, height, data } = img;
  const out = new ImageData(width, height);
  for (let i = 0; i < width * height; i++) {
    const v = clamp255(Math.round(data[i]));
    out.data[i * 4] = v;
    out.data[i * 4 + 1] = v;
    out.data[i * 4 + 2] = v;
    out.data[i * 4 + 3] = 255;
  }
  return out;
}
function loadImageToImageData(src, maxDim = 512) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const scale = Math.min(1, maxDim / Math.max(width, height));
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        reject(new Error("Canvas 2D context unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      resolve({ imageData, width, height });
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}
function applyModel(model, m, x, y) {
  const [a, b, c, d, e, f, g, h, i] = m;
  if (model === "homography") {
    const w = g * x + h * y + i;
    if (Math.abs(w) < 1e-9) return [x, y];
    return [(a * x + b * y + c) / w, (d * x + e * y + f) / w];
  }
  return [a * x + b * y + c, d * x + e * y + f];
}
function estimateSimilarity(points) {
  if (points.length < 2) return null;
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
  const a = (sx * tx + sy * ty) / len2;
  const b = (sx * ty - sy * tx) / len2;
  const d = -b;
  const e = a;
  const c = q0.x - (a * p0.x + b * p0.y);
  const f = q0.y - (d * p0.x + e * p0.y);
  return [a, b, c, d, e, f, 0, 0, 1];
}
function estimateAffine(points) {
  if (points.length < 3) return null;
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
  const det = sxx * syy * n + 2 * sxy * sx * sy - sxy * sxy * n - sxx * sy * sy - sx * sx * syy;
  if (Math.abs(det) < 1e-9) return null;
  const inv = 1 / det;
  const a = ((syy * n - sy * sy) * sxu + (sx * sy - sxy * n) * syu + (sxy * sy - sx * syy) * su) * inv;
  const b = ((sx * sy - sxy * n) * sxu + (sxx * n - sx * sx) * syu + (sx * sxy - sxx * sy) * su) * inv;
  const c = ((sxy * sy - sx * syy) * sxu + (sx * sxy - sxx * sy) * syu + (sxx * syy - sxy * sxy) * su) * inv;
  const d = ((syy * n - sy * sy) * sxv + (sx * sy - sxy * n) * syv + (sxy * sy - sx * syy) * sv) * inv;
  const e = ((sx * sy - sxy * n) * sxv + (sxx * n - sx * sx) * syv + (sx * sxy - sxx * sy) * sv) * inv;
  const f = ((sxy * sy - sx * syy) * sxv + (sx * sxy - sxx * sy) * syv + (sxx * syy - sxy * sxy) * sv) * inv;
  return [a, b, c, d, e, f, 0, 0, 1];
}
function estimateHomography(points) {
  if (points.length < 4) return null;
  const rows = [];
  for (const p of points) {
    const x = p.source.x;
    const y = p.source.y;
    const u = p.reference.x;
    const v2 = p.reference.y;
    rows.push([-x, -y, -1, 0, 0, 0, u * x, u * y, u]);
    rows.push([0, 0, 0, -x, -y, -1, v2 * x, v2 * y, v2]);
  }
  const ata = new Array(81).fill(0);
  for (const row of rows) {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        ata[i * 9 + j] += row[i] * row[j];
      }
    }
  }
  let v = new Array(9).fill(1);
  v[8] = 1;
  for (let iter = 0; iter < 60; iter++) {
    const next = new Array(9).fill(0);
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        next[i] += ata[i * 9 + j] * v[j];
      }
    }
    let maxAbs = 0;
    for (let i = 0; i < 9; i++) maxAbs = Math.max(maxAbs, Math.abs(next[i]));
    if (maxAbs < 1e-12) break;
    for (let i = 0; i < 9; i++) next[i] /= maxAbs;
    v = next;
  }
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
    1
  ];
}
function decomposeMatrix(m) {
  const [a, _b, c, d, _e, f] = m;
  const scale = Math.sqrt(a * a + d * d);
  const rotationDegrees = Math.atan2(d, a) * 180 / Math.PI;
  return { scale, rotationDegrees, tx: c, ty: f };
}
function recommendModel(consistency) {
  if (consistency.length === 0) return TransformationModel.similarity;
  const best = [...consistency].sort(
    (a, b) => b.inlierRatio - a.inlierRatio || a.meanReprojError - b.meanReprojError
  )[0];
  const tolerance = 0.02;
  const candidates = consistency.filter(
    (c) => c.inlierRatio >= best.inlierRatio - tolerance
  );
  candidates.sort((a, b) => a.dof - b.dof || b.inlierRatio - a.inlierRatio);
  return candidates[0].model;
}
function computeRmse(correspondences) {
  const inliers = correspondences.filter((c) => c.inlier);
  if (inliers.length === 0) return null;
  let sum = 0;
  for (const c of inliers) sum += c.reprojectionError * c.reprojectionError;
  return Math.sqrt(sum / inliers.length);
}
function computeMeanReprojError(correspondences) {
  const inliers = correspondences.filter((c) => c.inlier);
  if (inliers.length === 0) return null;
  return inliers.reduce((s, c) => s + c.reprojectionError, 0) / inliers.length;
}
function computeSpatialCoverage(correspondences, width, height) {
  const inliers = correspondences.filter((c) => c.inlier);
  if (inliers.length < 3) return null;
  const grid = 8;
  const occupied = /* @__PURE__ */ new Set();
  for (const c of inliers) {
    const gx = Math.min(
      grid - 1,
      Math.max(0, Math.floor(c.source.x / width * grid))
    );
    const gy = Math.min(
      grid - 1,
      Math.max(0, Math.floor(c.source.y / height * grid))
    );
    occupied.add(gy * grid + gx);
  }
  return occupied.size / (grid * grid);
}
function computeMetrics(input) {
  const { matrix, correspondences, width, height } = input;
  const inliers = correspondences.filter((c) => c.inlier);
  const { scale, rotationDegrees } = decomposeMatrix(matrix);
  return {
    rmse: computeRmse(correspondences) ?? void 0,
    reprojectionError: computeMeanReprojError(correspondences) ?? void 0,
    inlierCount: BigInt(inliers.length),
    outlierCount: BigInt(correspondences.length - inliers.length),
    spatialCoverage: computeSpatialCoverage(correspondences, width, height) ?? void 0,
    scale,
    rotationDegrees
  };
}
export {
  computeSpatialCoverage as a,
  computeRmse as b,
  computeMeanReprojError as c,
  decomposeMatrix as d,
  applyModel as e,
  computeMetrics as f,
  grayToImageData as g,
  recommendModel as h,
  gaussianBlur as i,
  estimateSimilarity as j,
  estimateAffine as k,
  loadImageToImageData as l,
  estimateHomography as m,
  rgbaToGray as r
};
