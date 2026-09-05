import { describe, expect, it } from "vitest";

import { FeatureDetector } from "@/backend";
import { runPipeline } from "@/lib/cv/cv-engine";
import {
  classifyCorrespondences,
  ransac,
  reprojectionError,
} from "@/lib/cv/geometric-verification";
import { computeMetrics, computeRmse } from "@/lib/cv/metrics";
import {
  applyModel,
  estimateAffine,
  estimateHomography,
  estimateSimilarity,
  recommendModel,
} from "@/lib/cv/models";
import type {
  ClassifiedCorrespondence,
  ReproConfig,
  TransformationModel,
} from "@/lib/types";

/**
 * Scientific-integrity coverage for the in-browser CV engine: metrics and
 * classifications must be computed from real correspondences and never
 * fabricated. Where a metric cannot be computed it must be absent (N/A), not
 * invented.
 */

const IDENTITY: number[] = [1, 0, 0, 0, 1, 0, 0, 0, 1];

function classified(
  source: [number, number],
  reference: [number, number],
  inlier: boolean,
  reprojectionError: number,
): ClassifiedCorrespondence {
  return {
    source: { x: source[0], y: source[1] },
    reference: { x: reference[0], y: reference[1] },
    inlier,
    reprojectionError,
  };
}

describe("computeRmse", () => {
  it("computes the root-mean-square of inlier reprojection errors", () => {
    const c = [
      classified([0, 0], [0, 0], true, 1),
      classified([1, 1], [1, 1], true, 3),
      classified([2, 2], [2, 2], false, 50),
    ];
    // sqrt((1^2 + 3^2) / 2) = sqrt(10/2) = sqrt(5)
    expect(computeRmse(c)).toBeCloseTo(Math.sqrt(5), 6);
  });

  it("returns null when there are no inliers (never fabricates)", () => {
    const c = [classified([0, 0], [5, 5], false, 9)];
    expect(computeRmse(c)).toBeNull();
  });
});

describe("computeMetrics", () => {
  it("reports real counts and leaves unavailable metrics absent", () => {
    const metrics = computeMetrics({
      model: "similarity" as TransformationModel,
      matrix: IDENTITY,
      correspondences: [
        classified([0, 0], [0, 0], true, 0.5),
        classified([10, 10], [10, 10], true, 0.5),
        classified([20, 20], [20, 20], true, 0.5),
        classified([30, 30], [99, 99], false, 8),
      ],
      width: 100,
      height: 100,
    });
    expect(metrics.inlierCount).toBe(3n);
    expect(metrics.outlierCount).toBe(1n);
    expect(metrics.rmse).toBeCloseTo(0.5, 6);
    expect(metrics.scale).toBeCloseTo(1, 6);
  });

  it("leaves rmse undefined when no inliers exist (N/A, not fabricated)", () => {
    const metrics = computeMetrics({
      model: "similarity" as TransformationModel,
      matrix: IDENTITY,
      correspondences: [
        classified([0, 0], [50, 50], false, 20),
        classified([1, 1], [60, 60], false, 30),
      ],
      width: 100,
      height: 100,
    });
    expect(metrics.rmse).toBeUndefined();
    expect(metrics.inlierCount).toBe(0n);
  });
});

describe("classifyCorrespondences", () => {
  it("classifies by real reprojection error against the threshold", () => {
    const matrix = IDENTITY;
    const points = [
      { source: { x: 0, y: 0 }, reference: { x: 0, y: 0 } },
      { source: { x: 10, y: 10 }, reference: { x: 13, y: 10 } }, // err 3
    ];
    const result = classifyCorrespondences(
      "similarity" as TransformationModel,
      matrix,
      points,
      2.0,
    );
    expect(result[0].inlier).toBe(true);
    expect(result[1].inlier).toBe(false);
    expect(result[1].reprojectionError).toBeCloseTo(3, 6);
  });
});

describe("reprojectionError", () => {
  it("is zero for a point that maps exactly onto its reference", () => {
    expect(
      reprojectionError(
        "similarity" as TransformationModel,
        IDENTITY,
        { x: 5, y: 7 },
        { x: 5, y: 7 },
      ),
    ).toBe(0);
  });
});

describe("ransac", () => {
  it("fits a model and reports inliers/outliers from real geometry", () => {
    // A clean similarity: source points map to reference via identity.
    const points = [
      { source: { x: 0, y: 0 }, reference: { x: 0, y: 0 } },
      { source: { x: 10, y: 0 }, reference: { x: 10, y: 0 } },
      { source: { x: 0, y: 10 }, reference: { x: 0, y: 10 } },
      { source: { x: 10, y: 10 }, reference: { x: 10, y: 10 } },
      { source: { x: 50, y: 50 }, reference: { x: 5, y: 5 } }, // outlier
    ];
    const result = ransac("similarity" as TransformationModel, points, {
      reprojThreshold: 3.0,
      iterations: 100,
      minInlierRatio: 0.3,
    });
    expect(result.inlierCount).toBe(4);
    expect(result.outlierCount).toBe(1);
    expect(result.accepted).toBe(true);
  });

  it("returns an empty, unaccepted result for no points", () => {
    const result = ransac("similarity" as TransformationModel, [], {});
    expect(result.inlierCount).toBe(0);
    expect(result.accepted).toBe(false);
  });
});

describe("model estimation", () => {
  it("estimates a similarity that maps source to reference", () => {
    const m = estimateSimilarity([
      { source: { x: 0, y: 0 }, reference: { x: 2, y: 3 } },
      { source: { x: 10, y: 0 }, reference: { x: 12, y: 3 } },
    ]);
    expect(m).not.toBeNull();
    const [px, py] = applyModel("similarity" as TransformationModel, m!, 10, 0);
    expect(px).toBeCloseTo(12, 4);
    expect(py).toBeCloseTo(3, 4);
  });

  it("returns null when there are too few points", () => {
    expect(estimateSimilarity([])).toBeNull();
    expect(estimateAffine([])).toBeNull();
    expect(estimateHomography([])).toBeNull();
  });
});

describe("recommendModel", () => {
  it("prefers the simplest model within tolerance of the best", () => {
    const consistency = [
      {
        model: "homography" as TransformationModel,
        inlierRatio: 0.95,
        meanReprojError: 0.5,
        inlierCount: 100,
        dof: 8,
      },
      {
        model: "similarity" as TransformationModel,
        inlierRatio: 0.94,
        meanReprojError: 0.6,
        inlierCount: 99,
        dof: 4,
      },
      {
        model: "affine" as TransformationModel,
        inlierRatio: 0.94,
        meanReprojError: 0.6,
        inlierCount: 99,
        dof: 6,
      },
    ];
    expect(recommendModel(consistency)).toBe("similarity");
  });
});

describe("runPipeline", () => {
  it("runs end-to-end on real pixel data and computes real metrics", () => {
    const width = 64;
    const height = 64;
    const data = new Uint8ClampedArray(width * height * 4);
    // A simple gradient so feature detection has structure to find.
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const v = (x + y) % 256;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 255;
      }
    }
    const imageData = { width, height, data } as ImageData;

    const config: ReproConfig = {
      preprocessing: {
        grayscale: true,
        denoise: true,
        contrastEnhancement: true,
      },
      detector: {
        detector: FeatureDetector.orb,
        maxFeatures: 200n,
        scaleFactor: 1.2,
        nLevels: 3n,
        edgeThreshold: 31n,
      },
      matching: {
        ratioThreshold: 0.75,
        crossCheck: true,
        maxMatches: 200n,
      },
      model: "similarity" as TransformationModel,
      thresholds: { ransacReprojThreshold: 3.0, minInlierRatio: 0.3 },
    };

    const events: string[] = [];
    const output = runPipeline({
      sourceImageData: imageData,
      referenceImageData: imageData,
      config,
      spatialGrid: 4,
      onEvent: (e) => events.push(e.stage),
    });

    // The pipeline emits every stage in order; stages with progress updates
    // (feature extraction, matching, geometric verification, spatial
    // optimization) emit twice.
    expect(events).toEqual([
      "upload",
      "preprocessing",
      "multi-scale",
      "feature-extraction",
      "feature-extraction",
      "matching",
      "matching",
      "geometric-verification",
      "geometric-verification",
      "spatial-optimization",
      "spatial-optimization",
      "sub-pixel-refinement",
      "registration",
      "evaluation",
      "completed",
    ]);

    // Metrics are real numbers derived from the fitted model and matches.
    expect(output.result.metrics.inlierCount).toBeDefined();
    expect(output.result.transformationMatrix).toHaveLength(9);
    // Sub-pixel refinement is not available in-browser and is surfaced as a
    // warning, never as a fabricated number.
    expect(
      output.result.issues.some((i) => i.stage === "sub-pixel-refinement"),
    ).toBe(true);
  });
});
