import type {
  ClassifiedCorrespondence,
  JobMetrics,
  Matrix3x3,
  ReproConfig,
  TransformationModel,
} from "../types";

/**
 * Export utilities: correspondence CSV/JSON, metrics JSON, transformation
 * matrix, configuration JSON, and registered image download.
 */

export interface ExportBundle {
  correspondences: ClassifiedCorrespondence[];
  metrics: JobMetrics;
  transformationMatrix: Matrix3x3;
  config: ReproConfig;
  recommendedModel: TransformationModel;
  registeredImageDataUrl: string | null;
}

function downloadBlob(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Build a CSV string of correspondences. */
export function correspondencesToCsv(
  correspondences: ClassifiedCorrespondence[],
): string {
  const header =
    "source_x,source_y,reference_x,reference_y,inlier,reprojection_error_px";
  const rows = correspondences.map((c) =>
    [
      c.source.x.toFixed(3),
      c.source.y.toFixed(3),
      c.reference.x.toFixed(3),
      c.reference.y.toFixed(3),
      c.inlier ? "1" : "0",
      c.reprojectionError.toFixed(4),
    ].join(","),
  );
  return [header, ...rows].join("\n");
}

/** Build a JSON string of correspondences. */
export function correspondencesToJson(
  correspondences: ClassifiedCorrespondence[],
): string {
  return JSON.stringify(
    correspondences.map((c) => ({
      source: { x: c.source.x, y: c.source.y },
      reference: { x: c.reference.x, y: c.reference.y },
      inlier: c.inlier,
      reprojectionErrorPx: c.reprojectionError,
    })),
    null,
    2,
  );
}

/** Build a JSON string of metrics. */
export function metricsToJson(metrics: JobMetrics): string {
  return JSON.stringify(
    {
      rmsePx: metrics.rmse ?? null,
      reprojectionErrorPx: metrics.reprojectionError ?? null,
      inlierCount: metrics.inlierCount ?? null,
      outlierCount: metrics.outlierCount ?? null,
      spatialCoverage: metrics.spatialCoverage ?? null,
      scale: metrics.scale ?? null,
      rotationDegrees: metrics.rotationDegrees ?? null,
    },
    null,
    2,
  );
}

/** Build a JSON string of the transformation matrix. */
export function matrixToJson(matrix: Matrix3x3): string {
  return JSON.stringify(
    {
      matrix: matrix,
      rows: [
        [matrix[0], matrix[1], matrix[2]],
        [matrix[3], matrix[4], matrix[5]],
        [matrix[6], matrix[7], matrix[8]],
      ],
    },
    null,
    2,
  );
}

/** Build a JSON string of the configuration. */
export function configToJson(config: ReproConfig): string {
  return JSON.stringify(config, null, 2);
}

/** Download the registered image as PNG. */
export function downloadRegisteredImage(
  dataUrl: string,
  filename: string,
): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/** Download all results as a package of files. */
export function exportAllResults(bundle: ExportBundle, baseName: string): void {
  downloadBlob(
    correspondencesToCsv(bundle.correspondences),
    `${baseName}-correspondences.csv`,
    "text/csv",
  );
  downloadBlob(
    correspondencesToJson(bundle.correspondences),
    `${baseName}-correspondences.json`,
    "application/json",
  );
  downloadBlob(
    metricsToJson(bundle.metrics),
    `${baseName}-metrics.json`,
    "application/json",
  );
  downloadBlob(
    matrixToJson(bundle.transformationMatrix),
    `${baseName}-matrix.json`,
    "application/json",
  );
  downloadBlob(
    configToJson(bundle.config),
    `${baseName}-config.json`,
    "application/json",
  );
  if (bundle.registeredImageDataUrl) {
    downloadRegisteredImage(
      bundle.registeredImageDataUrl,
      `${baseName}-registered.png`,
    );
  }
}
