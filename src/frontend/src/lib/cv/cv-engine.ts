import type {
  ClassifiedCorrespondence,
  DetectorConfig,
  MatchingConfig,
  Matrix3x3,
  PipelineEvent,
  PipelineIssue,
  PipelineStage,
  RegistrationResult,
  ReproConfig,
  Thresholds,
  TransformationModel,
} from "../types";
import { PIPELINE_STAGES, STAGE_LABELS } from "../types";
import { detectFeatures } from "./feature-detectors";
import { classifyCorrespondences, ransac } from "./geometric-verification";
import type { GrayImage } from "./helpers";
import { rgbaToGray } from "./helpers";
import { matchDescriptors } from "./matcher";
import { computeMetrics } from "./metrics";
import {
  estimateAffine,
  estimateHomography,
  estimateSimilarity,
  recommendModel,
} from "./models";
import { preprocess } from "./preprocessing";
import { spatialGridFilter } from "./spatial-grid";
import {
  checkerboardImages,
  differenceImages,
  grayToDataUrl,
  overlayImages,
  warpImage,
} from "./warp";

/**
 * Pipeline orchestrator: runs the 11-stage registration pipeline on real
 * pixel data and emits progress events. Deterministic and fast enough for
 * ~512px demo images.
 */

export interface EngineInput {
  sourceImageData: ImageData;
  referenceImageData: ImageData;
  config: ReproConfig;
  /** Grid size for spatial optimization. */
  spatialGrid: 4 | 8 | 16;
  /** Callback for progress events. */
  onEvent?: (event: PipelineEvent) => void;
}

export interface EngineOutput {
  result: RegistrationResult;
  /** Preprocessed source/reference grayscale (for display). */
  sourceGray: GrayImage;
  referenceGray: GrayImage;
  /** Warped source in reference space. */
  warpedGray: GrayImage;
}

function emit(
  onEvent: ((event: PipelineEvent) => void) | undefined,
  stage: PipelineStage,
  progress: number,
  message: string,
  data?: unknown,
): void {
  onEvent?.({ stage, progress, message, data });
}

/** Run the full registration pipeline. */
export function runPipeline(input: EngineInput): EngineOutput {
  const { sourceImageData, referenceImageData, config, spatialGrid, onEvent } =
    input;
  const issues: PipelineIssue[] = [];
  const start = performance.now();
  const stageIndex = (s: PipelineStage) => PIPELINE_STAGES.indexOf(s);
  const baseProgress = (s: PipelineStage) =>
    stageIndex(s) / (PIPELINE_STAGES.length - 1);

  emit(onEvent, "upload", 0.02, "Images loaded");

  // Stage 2: Preprocessing.
  emit(
    onEvent,
    "preprocessing",
    baseProgress("preprocessing"),
    "Preprocessing source & reference",
  );
  const sourceGray = rgbaToGray(sourceImageData);
  const referenceGray = rgbaToGray(referenceImageData);
  const preSource = preprocess(sourceGray, {
    denoise: config.preprocessing.denoise,
    contrastEnhancement: config.preprocessing.contrastEnhancement,
    maxDim: 512,
  });
  const preRef = preprocess(referenceGray, {
    denoise: config.preprocessing.denoise,
    contrastEnhancement: config.preprocessing.contrastEnhancement,
    maxDim: 512,
  });

  // Stage 3: Multi-scale processing.
  emit(
    onEvent,
    "multi-scale",
    baseProgress("multi-scale"),
    `Built ${preSource.levels}-level Gaussian pyramid`,
  );

  // Stage 4: Feature extraction.
  emit(
    onEvent,
    "feature-extraction",
    baseProgress("feature-extraction"),
    "Detecting features",
  );
  const maxFeatures = Number(config.detector.maxFeatures);
  const srcFeat = detectFeatures(preSource.gray, { maxFeatures });
  const refFeat = detectFeatures(preRef.gray, { maxFeatures });
  emit(
    onEvent,
    "feature-extraction",
    baseProgress("feature-extraction") + 0.5 / (PIPELINE_STAGES.length - 1),
    `Detected ${srcFeat.keypoints.length} source / ${refFeat.keypoints.length} reference keypoints`,
  );

  // Stage 5: Matching.
  emit(onEvent, "matching", baseProgress("matching"), "Matching descriptors");
  const matches = matchDescriptors(srcFeat.descriptors, refFeat.descriptors, {
    ratioThreshold: config.matching.ratioThreshold,
    maxMatches: Number(config.matching.maxMatches),
  });
  const rawPoints = matches.map((m) => ({
    source: {
      x: srcFeat.keypoints[m.sourceIndex].x,
      y: srcFeat.keypoints[m.sourceIndex].y,
    },
    reference: {
      x: refFeat.keypoints[m.referenceIndex].x,
      y: refFeat.keypoints[m.referenceIndex].y,
    },
  }));
  emit(
    onEvent,
    "matching",
    baseProgress("matching") + 0.5 / (PIPELINE_STAGES.length - 1),
    `Matched ${rawPoints.length} correspondences`,
  );

  // Stage 6: Geometric verification (RANSAC for each candidate model).
  emit(
    onEvent,
    "geometric-verification",
    baseProgress("geometric-verification"),
    "RANSAC verification",
  );
  const thresholds: Thresholds = config.thresholds;
  const modelResults = new Map<
    TransformationModel,
    ReturnType<typeof ransac>
  >();
  for (const model of [
    "similarity",
    "affine",
    "homography",
  ] as TransformationModel[]) {
    modelResults.set(
      model,
      ransac(model, rawPoints, {
        reprojThreshold: thresholds.ransacReprojThreshold,
        minInlierRatio: thresholds.minInlierRatio,
      }),
    );
  }

  // Recommended model from actual geometric-consistency metrics.
  const consistency = [...modelResults.entries()].map(([model, r]) => ({
    model,
    inlierRatio: r.inlierRatio,
    meanReprojError: r.meanReprojError,
    inlierCount: r.inlierCount,
    dof: model === "homography" ? 8 : model === "affine" ? 6 : 4,
  }));
  const recommendedModel = recommendModel(consistency);
  const chosen = modelResults.get(recommendedModel)!;
  emit(
    onEvent,
    "geometric-verification",
    baseProgress("geometric-verification") + 0.5 / (PIPELINE_STAGES.length - 1),
    `Recommended ${recommendedModel} model, ${chosen.inlierCount} inliers`,
  );

  // Stage 7: Spatial optimization (uniform grid distribution).
  emit(
    onEvent,
    "spatial-optimization",
    baseProgress("spatial-optimization"),
    "Spatial grid optimization",
  );
  const gridResult = spatialGridFilter(
    chosen.correspondences,
    sourceImageData.width,
    sourceImageData.height,
    {
      gridSize: spatialGrid,
    },
  );
  emit(
    onEvent,
    "spatial-optimization",
    baseProgress("spatial-optimization") + 0.5 / (PIPELINE_STAGES.length - 1),
    `Spatial grid ${spatialGrid}x${spatialGrid}: ${gridResult.occupiedCells}/${gridResult.totalCells} cells occupied`,
  );

  // Stage 8: Sub-pixel refinement — not available in-browser.
  emit(
    onEvent,
    "sub-pixel-refinement",
    baseProgress("sub-pixel-refinement"),
    "Sub-pixel refinement: Prototype/Integration Pending (N/A in-browser)",
  );
  issues.push({
    level: "warning",
    stage: "sub-pixel-refinement",
    message:
      "Sub-pixel refinement is Prototype/Integration Pending in-browser; results are pixel-level.",
  });

  // Stage 9: Registration (warp source into reference space).
  emit(
    onEvent,
    "registration",
    baseProgress("registration"),
    "Warping source into reference space",
  );
  const warped = warpImage(preSource.gray, recommendedModel, chosen.matrix, {
    width: sourceImageData.width,
    height: sourceImageData.height,
  });
  const registeredImageDataUrl = grayToDataUrl(warped);
  const overlay = overlayImages(warped, preRef.gray);
  const difference = differenceImages(warped, preRef.gray);
  const checkerboard = checkerboardImages(warped, preRef.gray);
  const overlayImageDataUrl = grayToDataUrl(overlay);
  const differenceImageDataUrl = grayToDataUrl(difference);
  const checkerboardImageDataUrl = grayToDataUrl(checkerboard);

  // Stage 10: Evaluation.
  emit(onEvent, "evaluation", baseProgress("evaluation"), "Computing metrics");
  const metrics = computeMetrics({
    model: recommendedModel,
    matrix: chosen.matrix,
    correspondences: gridResult.correspondences,
    width: sourceImageData.width,
    height: sourceImageData.height,
  });

  // Stage 11: Completed.
  const elapsedMs = performance.now() - start;
  emit(onEvent, "completed", 1, "Registration complete", {
    metrics,
    recommendedModel,
  });

  const result: RegistrationResult = {
    transformationMatrix: chosen.matrix,
    correspondences: gridResult.correspondences,
    metrics,
    recommendedModel,
    registeredImageDataUrl,
    overlayImageDataUrl,
    differenceImageDataUrl,
    checkerboardImageDataUrl,
    issues,
    elapsedMs,
  };

  return {
    result,
    sourceGray: preSource.gray,
    referenceGray: preRef.gray,
    warpedGray: warped,
  };
}

/** Reclassify correspondences under a specific model (for model comparison). */
export function classifyUnderModel(
  model: TransformationModel,
  points: Array<{
    source: { x: number; y: number };
    reference: { x: number; y: number };
  }>,
  threshold: number,
): ClassifiedCorrespondence[] {
  let matrix: Matrix3x3 | null = null;
  if (model === "similarity") matrix = estimateSimilarity(points);
  else if (model === "affine") matrix = estimateAffine(points);
  else matrix = estimateHomography(points);
  if (!matrix) return [];
  return classifyCorrespondences(model, matrix, points, threshold);
}

export { STAGE_LABELS };
