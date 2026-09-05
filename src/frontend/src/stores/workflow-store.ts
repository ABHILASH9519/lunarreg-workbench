import { FeatureDetector } from "@/backend";
import { create } from "zustand";
import type {
  DetectorConfig,
  MatchingConfig,
  PipelineEvent,
  PipelineIssue,
  PipelineStage,
  PreprocessingSettings,
  RegistrationResult,
  ReproConfig,
  SpatialGridSize,
  Thresholds,
  TransformationModel,
} from "../lib/types";

/**
 * Zustand store for the registration workflow state: current images,
 * configuration, pipeline progress, and the latest result.
 */

export interface WorkflowImages {
  sourceDataUrl: string | null;
  referenceDataUrl: string | null;
  sourceName: string | null;
  referenceName: string | null;
  sourceIsDemo: boolean;
  referenceIsDemo: boolean;
}

export interface WorkflowState {
  images: WorkflowImages;
  config: ReproConfig;
  spatialGrid: SpatialGridSize;
  isRunning: boolean;
  currentStage: PipelineStage | null;
  progress: number;
  log: PipelineEvent[];
  issues: PipelineIssue[];
  result: RegistrationResult | null;
  error: string | null;

  setImages: (images: Partial<WorkflowImages>) => void;
  setConfig: (config: ReproConfig) => void;
  setSpatialGrid: (grid: SpatialGridSize) => void;
  startRun: () => void;
  pushEvent: (event: PipelineEvent) => void;
  setResult: (result: RegistrationResult) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const DEFAULT_PREPROCESSING: PreprocessingSettings = {
  grayscale: true,
  resizeWidth: undefined,
  resizeHeight: undefined,
  denoise: true,
  contrastEnhancement: true,
};

const DEFAULT_DETECTOR: DetectorConfig = {
  detector: FeatureDetector.orb,
  maxFeatures: 800n,
  scaleFactor: 1.2,
  nLevels: 4n,
  edgeThreshold: 31n,
};

const DEFAULT_MATCHING: MatchingConfig = {
  ratioThreshold: 0.75,
  crossCheck: true,
  maxMatches: 500n,
};

const DEFAULT_THRESHOLDS: Thresholds = {
  ransacReprojThreshold: 3.0,
  minInlierRatio: 0.3,
};

const DEFAULT_CONFIG: ReproConfig = {
  preprocessing: DEFAULT_PREPROCESSING,
  detector: DEFAULT_DETECTOR,
  matching: DEFAULT_MATCHING,
  model: "similarity" as TransformationModel,
  thresholds: DEFAULT_THRESHOLDS,
};

export const useWorkflowStore = create<WorkflowState>((set) => ({
  images: {
    sourceDataUrl: null,
    referenceDataUrl: null,
    sourceName: null,
    referenceName: null,
    sourceIsDemo: false,
    referenceIsDemo: false,
  },
  config: DEFAULT_CONFIG,
  spatialGrid: 8,
  isRunning: false,
  currentStage: null,
  progress: 0,
  log: [],
  issues: [],
  result: null,
  error: null,

  setImages: (images) =>
    set((state) => ({ images: { ...state.images, ...images } })),
  setConfig: (config) => set({ config }),
  setSpatialGrid: (spatialGrid) => set({ spatialGrid }),
  startRun: () =>
    set({
      isRunning: true,
      progress: 0,
      log: [],
      issues: [],
      result: null,
      error: null,
    }),
  pushEvent: (event) =>
    set((state) => ({
      currentStage: event.stage,
      progress: event.progress,
      log: [...state.log, event],
    })),
  setResult: (result) =>
    set({ result, isRunning: false, currentStage: "completed", progress: 1 }),
  setError: (error) => set({ error, isRunning: false }),
  reset: () =>
    set({
      images: {
        sourceDataUrl: null,
        referenceDataUrl: null,
        sourceName: null,
        referenceName: null,
        sourceIsDemo: false,
        referenceIsDemo: false,
      },
      isRunning: false,
      currentStage: null,
      progress: 0,
      log: [],
      issues: [],
      result: null,
      error: null,
    }),
}));
