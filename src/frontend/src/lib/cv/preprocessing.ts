import type { GrayImage } from "./helpers";
import { gaussianBlur } from "./helpers";

/**
 * Preprocessing: grayscale conversion, illumination normalization,
 * denoising, contrast enhancement, and multi-scale pyramid construction.
 * All operations are real pixel computations.
 */

export interface PreprocessOptions {
  denoise: boolean;
  contrastEnhancement: boolean;
  /** Target max dimension for the working resolution. */
  maxDim: number;
}

export interface PreprocessedImage {
  /** Working-resolution grayscale image. */
  gray: GrayImage;
  /** Gaussian pyramid for multi-scale processing. */
  pyramid: GrayImage[];
  /** Number of pyramid levels. */
  levels: number;
}

/** Normalize illumination: zero mean, unit-ish variance, remapped to 0..255. */
export function normalizeIllumination(img: GrayImage): GrayImage {
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
    // Normalize to ~[-1.5, 1.5] then remap to 0..255.
    out[i] = ((data[i] - mean) / std) * 64 + 128;
  }
  return { width, height, data: out };
}

/** Median filter (3x3) for salt-and-pepper denoising. */
export function medianFilter(img: GrayImage): GrayImage {
  const { width, height, data } = img;
  const out = new Float32Array(data.length);
  const window = new Array<number>(9);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          window[n++] =
            data[
              (yy < 0 ? 0 : yy >= height ? height - 1 : yy) * width +
                (xx < 0 ? 0 : xx >= width ? width - 1 : xx)
            ];
        }
      }
      window.sort((a, b) => a - b);
      out[y * width + x] = window[4];
    }
  }
  return { width, height, data: out };
}

/** Contrast enhancement via histogram stretching with clipping. */
export function contrastEnhance(img: GrayImage): GrayImage {
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
    out[i] = ((v - lo) / range) * 255;
  }
  return { width, height, data: out };
}

/** Run the full preprocessing chain on a grayscale image. */
export function preprocess(
  img: GrayImage,
  options: PreprocessOptions,
): PreprocessedImage {
  let current = img;
  if (options.denoise) {
    current = medianFilter(current);
    current = gaussianBlur(current, 1, 1.0);
  }
  current = normalizeIllumination(current);
  if (options.contrastEnhancement) {
    current = contrastEnhance(current);
  }
  // Multi-scale pyramid: 4 levels (full, 1/2, 1/4, 1/8).
  const levels = 4;
  const pyramid: GrayImage[] = [current];
  let level = current;
  for (let i = 1; i < levels; i++) {
    level = downsample(level);
    pyramid.push(level);
  }
  return { gray: current, pyramid, levels };
}

function downsample(img: GrayImage): GrayImage {
  const { width, height, data } = img;
  const nw = Math.floor(width / 2);
  const nh = Math.floor(height / 2);
  const out = new Float32Array(nw * nh);
  for (let y = 0; y < nh; y++) {
    for (let x = 0; x < nw; x++) {
      const x0 = x * 2;
      const y0 = y * 2;
      out[y * nw + x] =
        (data[y0 * width + x0] +
          data[y0 * width + x0 + 1] +
          data[(y0 + 1) * width + x0] +
          data[(y0 + 1) * width + x0 + 1]) /
        4;
    }
  }
  return { width: nw, height: nh, data: out };
}
