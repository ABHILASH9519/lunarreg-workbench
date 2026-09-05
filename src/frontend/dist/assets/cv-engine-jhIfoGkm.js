import { i as gaussianBlur, e as applyModel, j as estimateSimilarity, k as estimateAffine, m as estimateHomography, g as grayToImageData, r as rgbaToGray, h as recommendModel, f as computeMetrics } from "./metrics-CXdDL_t5.js";
const PIPELINE_STAGES = [
  "upload",
  "preprocessing",
  "multi-scale",
  "feature-extraction",
  "matching",
  "geometric-verification",
  "spatial-optimization",
  "sub-pixel-refinement",
  "registration",
  "evaluation",
  "completed"
];
const STAGE_LABELS = {
  upload: "Upload",
  preprocessing: "Preprocessing",
  "multi-scale": "Multi-scale Processing",
  "feature-extraction": "Feature Extraction",
  matching: "Matching",
  "geometric-verification": "Geometric Verification",
  "spatial-optimization": "Spatial Optimization",
  "sub-pixel-refinement": "Sub-pixel Refinement",
  registration: "Registration",
  evaluation: "Evaluation",
  completed: "Completed"
};
const DEFAULT_OPTIONS$3 = {
  maxFeatures: 800,
  threshold: 24,
  nmsRadius: 3,
  blurSigma: 1.2
};
function fastCornerScore(data, width, height, x, y, threshold) {
  const cx = data[y * width + x];
  const circle = [
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
    [-1, -3]
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
  return Math.max(brighter, darker);
}
function harrisResponse(data, width, height, x, y) {
  const gx = (xx, yy) => {
    const l = data[yy * width + Math.max(0, xx - 1)];
    const r = data[yy * width + Math.min(width - 1, xx + 1)];
    return r - l;
  };
  const gy = (xx, yy) => {
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
  const k = 0.04;
  const det = ixx * iyy - ixy * ixy;
  const trace = ixx + iyy;
  return det - k * trace * trace;
}
function detectKeypoints(img, options) {
  const opts = { ...DEFAULT_OPTIONS$3, ...options };
  const blurred = gaussianBlur(img, 1, opts.blurSigma);
  const { width, height, data } = blurred;
  const candidates = [];
  for (let y = opts.nmsRadius; y < height - opts.nmsRadius; y++) {
    for (let x = opts.nmsRadius; x < width - opts.nmsRadius; x++) {
      const score = fastCornerScore(data, width, height, x, y, opts.threshold);
      if (score < 9) continue;
      const response = harrisResponse(data, width, height, x, y);
      if (response <= 0) continue;
      candidates.push({ x, y, response, octave: 0, angle: 0 });
    }
  }
  const kept = [];
  for (const kp of candidates) {
    let isMax = true;
    for (const other of candidates) {
      if (other === kp) continue;
      const dx = other.x - kp.x;
      const dy = other.y - kp.y;
      if (dx * dx + dy * dy <= opts.nmsRadius * opts.nmsRadius && other.response > kp.response) {
        isMax = false;
        break;
      }
    }
    if (isMax) kept.push(kp);
  }
  kept.sort((a, b) => b.response - a.response);
  return kept.slice(0, opts.maxFeatures);
}
function computeDescriptors(img, keypoints) {
  const { width, height, data } = img;
  const pairs = [];
  let seed = 12345;
  const rand = () => {
    seed = seed * 1103515245 + 12345 & 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 256; i++) {
    const ax = Math.round((rand() - 0.5) * 24);
    const ay = Math.round((rand() - 0.5) * 24);
    const bx = Math.round((rand() - 0.5) * 24);
    const by = Math.round((rand() - 0.5) * 24);
    pairs.push([ay * 32 + ax + 16, by * 32 + bx + 16]);
  }
  return keypoints.map((kp) => {
    const values = new Array(256);
    for (let i = 0; i < 256; i++) {
      const [pa, pb] = pairs[i];
      const ax = kp.x + pa % 32 - 16;
      const ay = kp.y + Math.floor(pa / 32) - 16;
      const bx = kp.x + pb % 32 - 16;
      const by = kp.y + Math.floor(pb / 32) - 16;
      const va = ax < 0 || ax >= width || ay < 0 || ay >= height ? 0 : data[ay * width + ax];
      const vb = bx < 0 || bx >= width || by < 0 || by >= height ? 0 : data[by * width + bx];
      values[i] = va < vb ? 1 : 0;
    }
    return { values };
  });
}
function detectFeatures(img, options) {
  const keypoints = detectKeypoints(img, options);
  const descriptors = computeDescriptors(img, keypoints);
  return { keypoints, descriptors };
}
const DEFAULT_OPTIONS$2 = {
  reprojThreshold: 3,
  iterations: 200,
  minInlierRatio: 0.3
};
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = a + 1831565813 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function reprojectionError(model, matrix, source, reference) {
  const [px, py] = applyModel(model, matrix, source.x, source.y);
  const dx = px - reference.x;
  const dy = py - reference.y;
  return Math.sqrt(dx * dx + dy * dy);
}
function classifyCorrespondences(model, matrix, points, threshold) {
  return points.map((p) => {
    const err = reprojectionError(model, matrix, p.source, p.reference);
    return {
      source: p.source,
      reference: p.reference,
      inlier: err <= threshold,
      reprojectionError: err
    };
  });
}
function ransac(model, points, options) {
  const opts = { ...DEFAULT_OPTIONS$2, ...options };
  const n = points.length;
  if (n === 0) {
    return {
      matrix: [1, 0, 0, 0, 1, 0, 0, 0, 1],
      correspondences: [],
      inlierCount: 0,
      outlierCount: 0,
      inlierRatio: 0,
      meanReprojError: 0,
      accepted: false
    };
  }
  const sampleSize = model === "homography" ? 4 : model === "affine" ? 3 : 2;
  const rand = mulberry32(42);
  let bestMatrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  let bestInliers = 0;
  let bestError = Number.POSITIVE_INFINITY;
  for (let iter = 0; iter < opts.iterations; iter++) {
    const indices = /* @__PURE__ */ new Set();
    while (indices.size < sampleSize) {
      indices.add(Math.floor(rand() * n));
    }
    const sample = [...indices].map((i) => points[i]);
    let matrix = null;
    if (model === "similarity") matrix = estimateSimilarity(sample);
    else if (model === "affine") matrix = estimateAffine(sample);
    else matrix = estimateHomography(sample);
    if (!matrix) continue;
    let inliers = 0;
    let errSum = 0;
    for (const p of points) {
      const err = reprojectionError(model, matrix, p.source, p.reference);
      if (err <= opts.reprojThreshold) {
        inliers++;
        errSum += err;
      }
    }
    if (inliers > bestInliers || inliers === bestInliers && errSum < bestError) {
      bestInliers = inliers;
      bestError = errSum;
      bestMatrix = matrix;
    }
  }
  const classified = classifyCorrespondences(
    model,
    bestMatrix,
    points,
    opts.reprojThreshold
  );
  const inlierPts = classified.filter((c) => c.inlier);
  if (inlierPts.length >= sampleSize) {
    const refit = estimateFromPoints(model, inlierPts);
    if (refit) {
      const reclassified = classifyCorrespondences(
        model,
        refit,
        points,
        opts.reprojThreshold
      );
      const refitInliers = reclassified.filter((c) => c.inlier);
      if (refitInliers.length >= bestInliers) {
        return buildResult(model, refit, reclassified, opts);
      }
    }
  }
  return buildResult(model, bestMatrix, classified, opts);
}
function estimateFromPoints(model, pts) {
  const points = pts.map((c) => ({ source: c.source, reference: c.reference }));
  if (model === "similarity") return estimateSimilarity(points);
  if (model === "affine") return estimateAffine(points);
  return estimateHomography(points);
}
function buildResult(model, matrix, classified, opts) {
  const inliers = classified.filter((c) => c.inlier);
  const inlierCount = inliers.length;
  const outlierCount = classified.length - inlierCount;
  const inlierRatio = classified.length === 0 ? 0 : inlierCount / classified.length;
  const meanReprojError = inlierCount === 0 ? 0 : inliers.reduce((s, c) => s + c.reprojectionError, 0) / inlierCount;
  return {
    matrix,
    correspondences: classified,
    inlierCount,
    outlierCount,
    inlierRatio,
    meanReprojError,
    accepted: inlierRatio >= opts.minInlierRatio && inlierCount >= sampleSizeFor(model)
  };
}
function sampleSizeFor(model) {
  return model === "homography" ? 4 : model === "affine" ? 3 : 2;
}
const DEFAULT_OPTIONS$1 = {
  ratioThreshold: 0.75,
  maxMatches: 500
};
function hammingDistance(a, b) {
  let dist = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) dist++;
  }
  return dist;
}
function matchDescriptors(source, reference, options) {
  const opts = { ...DEFAULT_OPTIONS$1, ...options };
  const matches = [];
  for (let i = 0; i < source.length; i++) {
    let best = Number.POSITIVE_INFINITY;
    let second = Number.POSITIVE_INFINITY;
    let bestIdx = -1;
    for (let j = 0; j < reference.length; j++) {
      const d = hammingDistance(source[i].values, reference[j].values);
      if (d < best) {
        second = best;
        best = d;
        bestIdx = j;
      } else if (d < second) {
        second = d;
      }
    }
    if (bestIdx < 0) continue;
    const ratio = second === Number.POSITIVE_INFINITY ? 0 : best / second;
    if (ratio > opts.ratioThreshold) continue;
    matches.push({
      sourceIndex: i,
      referenceIndex: bestIdx,
      distance: best,
      ratio
    });
  }
  matches.sort((a, b) => a.distance - b.distance);
  return matches.slice(0, opts.maxMatches);
}
function normalizeIllumination(img) {
  const { width, height, data } = img;
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += data[i];
  const mean = sum / data.length;
  let sq = 0;
  for (let i = 0; i < data.length; i++) {
    const d = data[i] - mean;
    sq += d * d;
  }
  const std = Math.sqrt(sq / data.length) || 1;
  const out = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) {
    out[i] = (data[i] - mean) / std * 64 + 128;
  }
  return { width, height, data: out };
}
function medianFilter(img) {
  const { width, height, data } = img;
  const out = new Float32Array(data.length);
  const window = new Array(9);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          window[n++] = data[(yy < 0 ? 0 : yy >= height ? height - 1 : yy) * width + (xx < 0 ? 0 : xx >= width ? width - 1 : xx)];
        }
      }
      window.sort((a, b) => a - b);
      out[y * width + x] = window[4];
    }
  }
  return { width, height, data: out };
}
function contrastEnhance(img) {
  const { width, height, data } = img;
  const hist = new Uint32Array(256);
  for (let i = 0; i < data.length; i++) {
    const v = Math.max(0, Math.min(255, Math.round(data[i])));
    hist[v]++;
  }
  const total = data.length;
  const clip = total * 0.01;
  let lo = 0;
  let acc = 0;
  while (lo < 255 && acc < clip) acc += hist[lo++];
  let hi = 255;
  acc = 0;
  while (hi > 0 && acc < clip) acc += hist[hi--];
  const range = Math.max(1, hi - lo);
  const out = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) {
    const v = Math.max(0, Math.min(255, Math.round(data[i])));
    out[i] = (v - lo) / range * 255;
  }
  return { width, height, data: out };
}
function preprocess(img, options) {
  let current = img;
  if (options.denoise) {
    current = medianFilter(current);
    current = gaussianBlur(current, 1, 1);
  }
  current = normalizeIllumination(current);
  if (options.contrastEnhancement) {
    current = contrastEnhance(current);
  }
  const levels = 4;
  const pyramid = [current];
  let level = current;
  for (let i = 1; i < levels; i++) {
    level = downsample(level);
    pyramid.push(level);
  }
  return { gray: current, pyramid, levels };
}
function downsample(img) {
  const { width, height, data } = img;
  const nw = Math.floor(width / 2);
  const nh = Math.floor(height / 2);
  const out = new Float32Array(nw * nh);
  for (let y = 0; y < nh; y++) {
    for (let x = 0; x < nw; x++) {
      const x0 = x * 2;
      const y0 = y * 2;
      out[y * nw + x] = (data[y0 * width + x0] + data[y0 * width + x0 + 1] + data[(y0 + 1) * width + x0] + data[(y0 + 1) * width + x0 + 1]) / 4;
    }
  }
  return { width: nw, height: nh, data: out };
}
const DEFAULT_OPTIONS = {
  gridSize: 8,
  maxPoints: 200
};
function spatialGridFilter(correspondences, width, height, options) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const grid = opts.gridSize;
  const totalCells = grid * grid;
  const cellBest = /* @__PURE__ */ new Map();
  for (const c of correspondences) {
    const gx = Math.min(
      grid - 1,
      Math.max(0, Math.floor(c.source.x / width * grid))
    );
    const gy = Math.min(
      grid - 1,
      Math.max(0, Math.floor(c.source.y / height * grid))
    );
    const key = gy * grid + gx;
    const existing = cellBest.get(key);
    if (!existing) {
      cellBest.set(key, c);
    } else if (c.inlier && !existing.inlier) {
      cellBest.set(key, c);
    } else if (c.inlier && existing.inlier && c.reprojectionError < existing.reprojectionError) {
      cellBest.set(key, c);
    }
  }
  const cells = [...cellBest.entries()];
  cells.sort((a, b) => {
    const inA = a[1].inlier ? 0 : 1;
    const inB = b[1].inlier ? 0 : 1;
    if (inA !== inB) return inA - inB;
    return a[1].reprojectionError - b[1].reprojectionError;
  });
  const selected = cells.slice(0, opts.maxPoints).map(([, c]) => c);
  return {
    correspondences: selected,
    occupiedCells: cellBest.size,
    totalCells
  };
}
function sampleBilinear(img, x, y) {
  const { width, height, data } = img;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const x1 = Math.min(width - 1, x0 + 1);
  const y1 = Math.min(height - 1, y0 + 1);
  const v00 = data[y0 * width + x0];
  const v10 = data[y0 * width + x1];
  const v01 = data[y1 * width + x0];
  const v11 = data[y1 * width + x1];
  return v00 * (1 - fx) * (1 - fy) + v10 * fx * (1 - fy) + v01 * (1 - fx) * fy + v11 * fx * fy;
}
function warpImage(source, model, matrix, options) {
  const width = (options == null ? void 0 : options.width) ?? source.width;
  const height = (options == null ? void 0 : options.height) ?? source.height;
  const out = new Float32Array(width * height);
  const inv = invertMatrix(matrix);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [sx, sy] = applyModel(model, inv, x, y);
      if (sx < 0 || sx >= source.width - 1 || sy < 0 || sy >= source.height - 1) {
        out[y * width + x] = 0;
      } else {
        out[y * width + x] = sampleBilinear(source, sx, sy);
      }
    }
  }
  return { width, height, data: out };
}
function invertMatrix(m) {
  const [a, b, c, d, e, f, g, h, i] = m;
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  if (Math.abs(det) < 1e-12) return [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const inv = 1 / det;
  return [
    (e * i - f * h) * inv,
    (c * h - b * i) * inv,
    (b * f - c * e) * inv,
    (f * g - d * i) * inv,
    (a * i - c * g) * inv,
    (c * d - a * f) * inv,
    (d * h - e * g) * inv,
    (b * g - a * h) * inv,
    (a * e - b * d) * inv
  ];
}
function grayToDataUrl(img) {
  const imageData = grayToImageData(img);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}
function overlayImages(a, b) {
  const width = Math.max(a.width, b.width);
  const height = Math.max(a.height, b.height);
  const out = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const va = x < a.width && y < a.height ? a.data[y * a.width + x] : 0;
      const vb = x < b.width && y < b.height ? b.data[y * b.width + x] : 0;
      out[y * width + x] = va * 0.5 + vb * 0.5;
    }
  }
  return { width, height, data: out };
}
function differenceImages(a, b) {
  const width = Math.max(a.width, b.width);
  const height = Math.max(a.height, b.height);
  const out = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const va = x < a.width && y < a.height ? a.data[y * a.width + x] : 0;
      const vb = x < b.width && y < b.height ? b.data[y * b.width + x] : 0;
      out[y * width + x] = Math.abs(va - vb);
    }
  }
  return { width, height, data: out };
}
function checkerboardImages(a, b, tileSize = 32) {
  const width = Math.max(a.width, b.width);
  const height = Math.max(a.height, b.height);
  const out = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tileX = Math.floor(x / tileSize);
      const tileY = Math.floor(y / tileSize);
      const useA = (tileX + tileY) % 2 === 0;
      const va = x < a.width && y < a.height ? a.data[y * a.width + x] : 0;
      const vb = x < b.width && y < b.height ? b.data[y * b.width + x] : 0;
      out[y * width + x] = useA ? va : vb;
    }
  }
  return { width, height, data: out };
}
function emit(onEvent, stage, progress, message, data) {
  onEvent == null ? void 0 : onEvent({ stage, progress, message, data });
}
function runPipeline(input) {
  const { sourceImageData, referenceImageData, config, spatialGrid, onEvent } = input;
  const issues = [];
  const start = performance.now();
  const stageIndex = (s) => PIPELINE_STAGES.indexOf(s);
  const baseProgress = (s) => stageIndex(s) / (PIPELINE_STAGES.length - 1);
  emit(onEvent, "upload", 0.02, "Images loaded");
  emit(
    onEvent,
    "preprocessing",
    baseProgress("preprocessing"),
    "Preprocessing source & reference"
  );
  const sourceGray = rgbaToGray(sourceImageData);
  const referenceGray = rgbaToGray(referenceImageData);
  const preSource = preprocess(sourceGray, {
    denoise: config.preprocessing.denoise,
    contrastEnhancement: config.preprocessing.contrastEnhancement
  });
  const preRef = preprocess(referenceGray, {
    denoise: config.preprocessing.denoise,
    contrastEnhancement: config.preprocessing.contrastEnhancement
  });
  emit(
    onEvent,
    "multi-scale",
    baseProgress("multi-scale"),
    `Built ${preSource.levels}-level Gaussian pyramid`
  );
  emit(
    onEvent,
    "feature-extraction",
    baseProgress("feature-extraction"),
    "Detecting features"
  );
  const maxFeatures = Number(config.detector.maxFeatures);
  const srcFeat = detectFeatures(preSource.gray, { maxFeatures });
  const refFeat = detectFeatures(preRef.gray, { maxFeatures });
  emit(
    onEvent,
    "feature-extraction",
    baseProgress("feature-extraction") + 0.5 / (PIPELINE_STAGES.length - 1),
    `Detected ${srcFeat.keypoints.length} source / ${refFeat.keypoints.length} reference keypoints`
  );
  emit(onEvent, "matching", baseProgress("matching"), "Matching descriptors");
  const matches = matchDescriptors(srcFeat.descriptors, refFeat.descriptors, {
    ratioThreshold: config.matching.ratioThreshold,
    maxMatches: Number(config.matching.maxMatches)
  });
  const rawPoints = matches.map((m) => ({
    source: {
      x: srcFeat.keypoints[m.sourceIndex].x,
      y: srcFeat.keypoints[m.sourceIndex].y
    },
    reference: {
      x: refFeat.keypoints[m.referenceIndex].x,
      y: refFeat.keypoints[m.referenceIndex].y
    }
  }));
  emit(
    onEvent,
    "matching",
    baseProgress("matching") + 0.5 / (PIPELINE_STAGES.length - 1),
    `Matched ${rawPoints.length} correspondences`
  );
  emit(
    onEvent,
    "geometric-verification",
    baseProgress("geometric-verification"),
    "RANSAC verification"
  );
  const thresholds = config.thresholds;
  const modelResults = /* @__PURE__ */ new Map();
  for (const model of [
    "similarity",
    "affine",
    "homography"
  ]) {
    modelResults.set(
      model,
      ransac(model, rawPoints, {
        reprojThreshold: thresholds.ransacReprojThreshold,
        minInlierRatio: thresholds.minInlierRatio
      })
    );
  }
  const consistency = [...modelResults.entries()].map(([model, r]) => ({
    model,
    inlierRatio: r.inlierRatio,
    meanReprojError: r.meanReprojError,
    inlierCount: r.inlierCount,
    dof: model === "homography" ? 8 : model === "affine" ? 6 : 4
  }));
  const recommendedModel = recommendModel(consistency);
  const chosen = modelResults.get(recommendedModel);
  emit(
    onEvent,
    "geometric-verification",
    baseProgress("geometric-verification") + 0.5 / (PIPELINE_STAGES.length - 1),
    `Recommended ${recommendedModel} model, ${chosen.inlierCount} inliers`
  );
  emit(
    onEvent,
    "spatial-optimization",
    baseProgress("spatial-optimization"),
    "Spatial grid optimization"
  );
  const gridResult = spatialGridFilter(
    chosen.correspondences,
    sourceImageData.width,
    sourceImageData.height,
    {
      gridSize: spatialGrid
    }
  );
  emit(
    onEvent,
    "spatial-optimization",
    baseProgress("spatial-optimization") + 0.5 / (PIPELINE_STAGES.length - 1),
    `Spatial grid ${spatialGrid}x${spatialGrid}: ${gridResult.occupiedCells}/${gridResult.totalCells} cells occupied`
  );
  emit(
    onEvent,
    "sub-pixel-refinement",
    baseProgress("sub-pixel-refinement"),
    "Sub-pixel refinement: Prototype/Integration Pending (N/A in-browser)"
  );
  issues.push({
    level: "warning",
    stage: "sub-pixel-refinement",
    message: "Sub-pixel refinement is Prototype/Integration Pending in-browser; results are pixel-level."
  });
  emit(
    onEvent,
    "registration",
    baseProgress("registration"),
    "Warping source into reference space"
  );
  const warped = warpImage(preSource.gray, recommendedModel, chosen.matrix, {
    width: sourceImageData.width,
    height: sourceImageData.height
  });
  const registeredImageDataUrl = grayToDataUrl(warped);
  const overlay = overlayImages(warped, preRef.gray);
  const difference = differenceImages(warped, preRef.gray);
  const checkerboard = checkerboardImages(warped, preRef.gray);
  const overlayImageDataUrl = grayToDataUrl(overlay);
  const differenceImageDataUrl = grayToDataUrl(difference);
  const checkerboardImageDataUrl = grayToDataUrl(checkerboard);
  emit(onEvent, "evaluation", baseProgress("evaluation"), "Computing metrics");
  const metrics = computeMetrics({
    matrix: chosen.matrix,
    correspondences: gridResult.correspondences,
    width: sourceImageData.width,
    height: sourceImageData.height
  });
  const elapsedMs = performance.now() - start;
  emit(onEvent, "completed", 1, "Registration complete", {
    metrics,
    recommendedModel
  });
  const result = {
    transformationMatrix: chosen.matrix,
    correspondences: gridResult.correspondences,
    metrics,
    recommendedModel,
    registeredImageDataUrl,
    overlayImageDataUrl,
    differenceImageDataUrl,
    checkerboardImageDataUrl,
    issues,
    elapsedMs
  };
  return {
    result,
    sourceGray: preSource.gray,
    referenceGray: preRef.gray,
    warpedGray: warped
  };
}
export {
  PIPELINE_STAGES as P,
  STAGE_LABELS as S,
  classifyCorrespondences as a,
  detectFeatures as b,
  checkerboardImages as c,
  differenceImages as d,
  ransac as e,
  medianFilter as f,
  contrastEnhance as g,
  matchDescriptors as m,
  normalizeIllumination as n,
  preprocess as p,
  runPipeline as r,
  warpImage as w
};
