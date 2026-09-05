import type { Matrix3x3, TransformationModel } from "../types";
import type { GrayImage } from "./helpers";
import { grayToImageData } from "./helpers";
import { applyModel } from "./models";

/**
 * Image warping for the registered output, plus overlay / difference /
 * checkerboard compositing. All warping uses real inverse mapping with
 * bilinear interpolation.
 */

export interface WarpOptions {
  /** Output width (defaults to source width). */
  width?: number;
  /** Output height (defaults to source height). */
  height?: number;
}

/** Bilinear sample of a grayscale image at fractional coordinates. */
function sampleBilinear(img: GrayImage, x: number, y: number): number {
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
  return (
    v00 * (1 - fx) * (1 - fy) +
    v10 * fx * (1 - fy) +
    v01 * (1 - fx) * fy +
    v11 * fx * fy
  );
}

/**
 * Warp a source image into reference space using the inverse of the fitted
 * model. Inverse mapping: for each output pixel, find the source coordinate
 * via the inverse transform and bilinearly sample.
 */
export function warpImage(
  source: GrayImage,
  model: TransformationModel,
  matrix: Matrix3x3,
  options?: WarpOptions,
): GrayImage {
  const width = options?.width ?? source.width;
  const height = options?.height ?? source.height;
  const out = new Float32Array(width * height);

  // Inverse transform: apply the inverse matrix to map output->source.
  const inv = invertMatrix(matrix);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [sx, sy] = applyModel(model, inv, x, y);
      if (
        sx < 0 ||
        sx >= source.width - 1 ||
        sy < 0 ||
        sy >= source.height - 1
      ) {
        out[y * width + x] = 0;
      } else {
        out[y * width + x] = sampleBilinear(source, sx, sy);
      }
    }
  }
  return { width, height, data: out };
}

/** Invert a 3x3 matrix (row-major). */
export function invertMatrix(m: Matrix3x3): Matrix3x3 {
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
    (a * e - b * d) * inv,
  ];
}

/** Convert a GrayImage to a PNG data URL. */
export function grayToDataUrl(img: GrayImage): string {
  const imageData = grayToImageData(img);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

/** Composite two images as a 50% overlay. */
export function overlayImages(a: GrayImage, b: GrayImage): GrayImage {
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

/** Absolute difference image (for change detection). */
export function differenceImages(a: GrayImage, b: GrayImage): GrayImage {
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

/** Checkerboard composite for visual registration assessment. */
export function checkerboardImages(
  a: GrayImage,
  b: GrayImage,
  tileSize = 32,
): GrayImage {
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
