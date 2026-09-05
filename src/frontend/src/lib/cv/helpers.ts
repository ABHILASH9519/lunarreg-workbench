/**
 * Shared low-level helpers for the in-browser CV engine.
 * All computation operates on real pixel data — no fabricated numbers.
 */

/** A grayscale image buffer with width/height. */
export interface GrayImage {
  width: number;
  height: number;
  /** Row-major grayscale values 0..255. */
  data: Float32Array;
}

/** Convert an RGBA ImageData to a grayscale Float32Array. */
export function rgbaToGray(imageData: ImageData): GrayImage {
  const { width, height, data } = imageData;
  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    // Rec. 601 luma weights.
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }
  return { width, height, data: gray };
}

/** Clamp a value to [0, 255]. */
export function clamp255(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

/** Build a Gaussian kernel of given radius and sigma. */
export function gaussianKernel(radius: number, sigma: number): number[] {
  const size = radius * 2 + 1;
  const kernel = new Array<number>(size);
  let sum = 0;
  for (let i = -radius; i <= radius; i++) {
    const v = Math.exp(-(i * i) / (2 * sigma * sigma));
    kernel[i + radius] = v;
    sum += v;
  }
  for (let i = 0; i < size; i++) kernel[i] /= sum;
  return kernel;
}

/** Separable Gaussian blur on a grayscale image. */
export function gaussianBlur(
  img: GrayImage,
  radius: number,
  sigma: number,
): GrayImage {
  const { width, height, data } = img;
  const kernel = gaussianKernel(radius, sigma);
  const k = kernel.length;
  const half = radius;
  const tmp = new Float32Array(width * height);
  const out = new Float32Array(width * height);

  // Horizontal pass.
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
  // Vertical pass.
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

/** Compute image mean and standard deviation. */
export function meanStd(img: GrayImage): { mean: number; std: number } {
  const { data } = img;
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += data[i];
  const mean = sum / data.length;
  let sq = 0;
  for (let i = 0; i < data.length; i++) {
    const d = data[i] - mean;
    sq += d * d;
  }
  return { mean, std: Math.sqrt(sq / data.length) };
}

/** Convert a GrayImage to an ImageData (for canvas display). */
export function grayToImageData(img: GrayImage): ImageData {
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

/** Downsample an image by a factor of 2 (box average). */
export function downsample2(img: GrayImage): GrayImage {
  const { width, height, data } = img;
  const nw = Math.floor(width / 2);
  const nh = Math.floor(height / 2);
  const out = new Float32Array(nw * nh);
  for (let y = 0; y < nh; y++) {
    for (let x = 0; x < nw; x++) {
      const x0 = x * 2;
      const y0 = y * 2;
      const a = data[y0 * width + x0];
      const b = data[y0 * width + x0 + 1];
      const c = data[(y0 + 1) * width + x0];
      const d = data[(y0 + 1) * width + x0 + 1];
      out[y * nw + x] = (a + b + c + d) / 4;
    }
  }
  return { width: nw, height: nh, data: out };
}

/** Build a Gaussian pyramid (octaves). Returns levels from full-res down. */
export function buildPyramid(img: GrayImage, levels: number): GrayImage[] {
  const pyramid: GrayImage[] = [img];
  let current = img;
  for (let i = 1; i < levels; i++) {
    current = downsample2(current);
    pyramid.push(current);
  }
  return pyramid;
}

/** Load an image element into an ImageData at a target max dimension. */
export function loadImageToImageData(
  src: string,
  maxDim = 512,
): Promise<{ imageData: ImageData; width: number; height: number }> {
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
