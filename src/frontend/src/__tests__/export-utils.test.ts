import { describe, expect, it } from "vitest";

import { FeatureDetector } from "@/backend";
import {
  configToJson,
  correspondencesToCsv,
  correspondencesToJson,
  matrixToJson,
  metricsToJson,
} from "@/lib/export/export-utils";
import type {
  ClassifiedCorrespondence,
  JobMetrics,
  ReproConfig,
} from "@/lib/types";

/**
 * Export-package coverage: the correspondence CSV/JSON, metrics JSON,
 * transformation matrix JSON, and configuration JSON must serialize the real
 * stored values (including N/A for unavailable metrics) so a completed job's
 * export reproduces its configuration and results.
 */

const CORRESPONDENCES: ClassifiedCorrespondence[] = [
  {
    source: { x: 1.234, y: 2.345 },
    reference: { x: 1.5, y: 2.5 },
    inlier: true,
    reprojectionError: 0.1234,
  },
  {
    source: { x: 10, y: 20 },
    reference: { x: 99, y: 99 },
    inlier: false,
    reprojectionError: 5.6789,
  },
];

const METRICS: JobMetrics = {
  rmse: 1.25,
  reprojectionError: 1.1,
  inlierCount: 42n,
  outlierCount: 3n,
  spatialCoverage: 0.7,
  scale: 1.02,
  rotationDegrees: 2.5,
};

describe("correspondencesToCsv", () => {
  it("writes a header and one row per correspondence with inlier flag", () => {
    const csv = correspondencesToCsv(CORRESPONDENCES);
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe(
      "source_x,source_y,reference_x,reference_y,inlier,reprojection_error_px",
    );
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain("1.234,2.345,1.500,2.500,1,0.1234");
    expect(lines[2]).toContain("10.000,20.000,99.000,99.000,0,5.6789");
  });
});

describe("correspondencesToJson", () => {
  it("serializes source/reference points and inlier classification", () => {
    const parsed = JSON.parse(correspondencesToJson(CORRESPONDENCES));
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toEqual({
      source: { x: 1.234, y: 2.345 },
      reference: { x: 1.5, y: 2.5 },
      inlier: true,
      reprojectionErrorPx: 0.1234,
    });
  });
});

describe("metricsToJson", () => {
  it("serializes real metrics and null for unavailable ones", () => {
    const parsed = JSON.parse(metricsToJson(METRICS));
    expect(parsed.rmsePx).toBe(1.25);
    // inlierCount/outlierCount are bigint in JobMetrics; JSON.stringify
    // serializes them as strings (the app's BigInt.prototype.toJSON polyfill),
    // so the exported JSON carries them as strings.
    expect(parsed.inlierCount).toBe("42");
    expect(parsed.outlierCount).toBe("3");
  });

  it("emits null (N/A) for metrics that were never computed", () => {
    const parsed = JSON.parse(metricsToJson({}));
    expect(parsed.rmsePx).toBeNull();
    expect(parsed.spatialCoverage).toBeNull();
  });
});

describe("matrixToJson", () => {
  it("serializes the matrix and its rows", () => {
    const parsed = JSON.parse(matrixToJson([1, 2, 3, 4, 5, 6, 7, 8, 9]));
    expect(parsed.matrix).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(parsed.rows).toEqual([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ]);
  });
});

describe("configToJson", () => {
  it("serializes the full stored configuration for reproducibility", () => {
    const config: ReproConfig = {
      preprocessing: {
        grayscale: true,
        denoise: true,
        contrastEnhancement: true,
      },
      detector: {
        detector: FeatureDetector.orb,
        maxFeatures: 800n,
        scaleFactor: 1.2,
        nLevels: 4n,
        edgeThreshold: 31n,
      },
      matching: {
        ratioThreshold: 0.75,
        crossCheck: true,
        maxMatches: 500n,
      },
      model: "similarity" as ReproConfig["model"],
      thresholds: { ransacReprojThreshold: 3.0, minInlierRatio: 0.3 },
    };
    const parsed = JSON.parse(configToJson(config));
    expect(parsed.detector.maxFeatures).toBe("800");
    expect(parsed.model).toBe("similarity");
    expect(parsed.thresholds.ransacReprojThreshold).toBe(3.0);
  });
});
