import type {
  CorrespondencePoint as BackendCorrespondencePoint,
  DetectorConfig as BackendDetectorConfig,
  FeatureDetector as BackendFeatureDetector,
  ImageMetadata as BackendImageMetadata,
  InputImage as BackendInputImage,
  Job as BackendJob,
  JobId as BackendJobId,
  JobMetrics as BackendJobMetrics,
  JobResult as BackendJobResult,
  JobStatus as BackendJobStatus,
  JobSummary as BackendJobSummary,
  MatchingConfig as BackendMatchingConfig,
  Matrix3x3 as BackendMatrix3x3,
  PreprocessingSettings as BackendPreprocessingSettings,
  ReproConfig as BackendReproConfig,
  Thresholds as BackendThresholds,
  TransformationModel as BackendTransformationModel,
} from "@/backend";

// ---------------------------------------------------------------------------
// Backend domain types (mirror backend.d.ts)
// ---------------------------------------------------------------------------

export type JobId = BackendJobId;
export type JobStatus = BackendJobStatus;
export type ImageMetadata = BackendImageMetadata;
export type InputImage = BackendInputImage;
export type PreprocessingSettings = BackendPreprocessingSettings;
export type FeatureDetector = BackendFeatureDetector;
export type DetectorConfig = BackendDetectorConfig;
export type MatchingConfig = BackendMatchingConfig;
export type TransformationModel = BackendTransformationModel;
export type Thresholds = BackendThresholds;
export type ReproConfig = BackendReproConfig;
export type CorrespondencePoint = BackendCorrespondencePoint;
export type JobMetrics = BackendJobMetrics;
export type JobResult = BackendJobResult;
export type Job = BackendJob;
export type JobSummary = BackendJobSummary;
export type Matrix3x3 = BackendMatrix3x3;

// ---------------------------------------------------------------------------
// CV-engine types
// ---------------------------------------------------------------------------

/** A detected keypoint in an image. */
export interface Keypoint {
  x: number;
  y: number;
  /** Corner response strength (higher = stronger corner). */
  response: number;
  /** Octave / scale level the keypoint was detected at. */
  octave: number;
  /** Orientation in radians (0 when not estimated). */
  angle: number;
}

/** A fixed-length descriptor vector for a keypoint. */
export interface Descriptor {
  /** Raw descriptor values (e.g. binary bits as 0/1 or float values). */
  values: number[];
}

/** A matched correspondence between a source and reference keypoint. */
export interface Match {
  sourceIndex: number;
  referenceIndex: number;
  /** Distance between descriptors (lower = better). */
  distance: number;
  /** Ratio-test score (Lowe's ratio). */
  ratio: number;
}

/** A 2D point. */
export interface Point2D {
  x: number;
  y: number;
}

/** A correspondence with geometric classification. */
export interface ClassifiedCorrespondence {
  source: Point2D;
  reference: Point2D;
  /** True when the correspondence is an inlier under the fitted model. */
  inlier: boolean;
  /** Reprojection error in pixels for this correspondence. */
  reprojectionError: number;
}

/** The 11 pipeline stages. */
export type PipelineStage =
  | "upload"
  | "preprocessing"
  | "multi-scale"
  | "feature-extraction"
  | "matching"
  | "geometric-verification"
  | "spatial-optimization"
  | "sub-pixel-refinement"
  | "registration"
  | "evaluation"
  | "completed";

export const PIPELINE_STAGES: PipelineStage[] = [
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
  "completed",
];

export const STAGE_LABELS: Record<PipelineStage, string> = {
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
  completed: "Completed",
};

/** A progress event emitted by the pipeline orchestrator. */
export interface PipelineEvent {
  stage: PipelineStage;
  /** 0..1 overall progress. */
  progress: number;
  message: string;
  /** Optional structured payload for the stage. */
  data?: unknown;
}

/** A warning or error surfaced during processing. */
export interface PipelineIssue {
  level: "warning" | "error";
  message: string;
  stage: PipelineStage;
}

/** The full result of a registration run. */
export interface RegistrationResult {
  /** Fitted transformation matrix (row-major 3x3). */
  transformationMatrix: Matrix3x3;
  /** Classified correspondences. */
  correspondences: ClassifiedCorrespondence[];
  /** Computed metrics. */
  metrics: JobMetrics;
  /** Recommended transformation model from geometric-consistency analysis. */
  recommendedModel: TransformationModel;
  /** The registered (warped) source image as a data URL. */
  registeredImageDataUrl: string | null;
  /** Composite overlay image data URL. */
  overlayImageDataUrl: string | null;
  /** Difference image data URL. */
  differenceImageDataUrl: string | null;
  /** Checkerboard composite image data URL. */
  checkerboardImageDataUrl: string | null;
  /** Warnings/errors encountered. */
  issues: PipelineIssue[];
  /** Elapsed time in milliseconds. */
  elapsedMs: number;
}

/** A single analysis result (used by the Analyses page). */
export interface AnalysisResult {
  id: string;
  name: string;
  description: string;
  value: number | null;
  unit: string;
  status: "pass" | "warning" | "failed" | "pending";
  detail?: string;
}

/** Demo pair metadata. */
export interface DemoPairMetadata {
  id: string;
  name: string;
  sensor: "OHRC" | "TMC-2" | "IIRS" | "LRO NAC" | "SELENE";
  sunAzimuthDeg: number;
  sunElevationDeg: number;
  scaleRatio: number;
  description: string;
  /** True when this is synthetic DEMO/SAMPLE DATA, never official ISRO data. */
  isDemo: true;
}

/** A bundled demo image pair. */
export interface DemoPair {
  metadata: DemoPairMetadata;
  /** Source (moving) image data URL. */
  sourceDataUrl: string;
  /** Reference (fixed) image data URL. */
  referenceDataUrl: string;
  /** Source image width in px. */
  width: number;
  /** Source image height in px. */
  height: number;
}

/** A user-uploaded image. */
export interface UserImage {
  id: string;
  name: string;
  format: string;
  width: number;
  height: number;
  sizeBytes: number;
  dataUrl: string;
  /** Storage hash when uploaded to object storage. */
  storageRef?: string;
  isDemo: false;
}

/** Spatial grid configuration for uniform distribution. */
export type SpatialGridSize = 4 | 8 | 16;
