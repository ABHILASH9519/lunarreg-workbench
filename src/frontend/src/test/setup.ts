import "@testing-library/jest-dom/vitest";

// The app's main.tsx installs this polyfill so JSON.stringify can serialize
// bigint fields (job ids, metric counts) in exports and stores. Tests that
// exercise those code paths need the same behavior.
if (typeof BigInt.prototype.toJSON !== "function") {
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };
}

// jsdom does not implement canvas 2D contexts. The CV engine's data-URL
// rendering paths (grayToDataUrl and friends) degrade to "" when the context
// is unavailable, which is the same behavior the app has in an environment
// without canvas support. Tests that need real pixels construct ImageData
// directly instead.
//
// jsdom's HTMLCanvasElement.getContext throws "Not implemented" instead of
// returning null, which would crash the CV engine's graceful degradation
// (grayToDataUrl expects a null context and returns ""). Stub the canvas
// context to return null so the engine's no-canvas path is exercised exactly
// as it is in a browser without canvas support.
if (
  typeof HTMLCanvasElement !== "undefined" &&
  typeof HTMLCanvasElement.prototype.getContext === "function"
) {
  HTMLCanvasElement.prototype.getContext = (() =>
    null) as typeof HTMLCanvasElement.prototype.getContext;
}

// jsdom does not expose the ImageData constructor. The CV engine's
// grayToImageData path constructs one, so provide a minimal polyfill that
// matches the browser shape (width, height, data) for tests that exercise the
// full pipeline.
if (typeof (globalThis as Record<string, unknown>).ImageData === "undefined") {
  class ImageDataPolyfill {
    width: number;
    height: number;
    data: Uint8ClampedArray;
    constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
      this.data = new Uint8ClampedArray(width * height * 4);
    }
  }
  (globalThis as Record<string, unknown>).ImageData = ImageDataPolyfill;
}
