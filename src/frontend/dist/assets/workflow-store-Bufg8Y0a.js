import { F as FeatureDetector } from "./backend-DPWNum9l.js";
import { c as create } from "./react-CxBERiit.js";
const DEFAULT_PREPROCESSING = {
  grayscale: true,
  resizeWidth: void 0,
  resizeHeight: void 0,
  denoise: true,
  contrastEnhancement: true
};
const DEFAULT_DETECTOR = {
  detector: FeatureDetector.orb,
  maxFeatures: 800n,
  scaleFactor: 1.2,
  nLevels: 4n,
  edgeThreshold: 31n
};
const DEFAULT_MATCHING = {
  ratioThreshold: 0.75,
  crossCheck: true,
  maxMatches: 500n
};
const DEFAULT_THRESHOLDS = {
  ransacReprojThreshold: 3,
  minInlierRatio: 0.3
};
const DEFAULT_CONFIG = {
  preprocessing: DEFAULT_PREPROCESSING,
  detector: DEFAULT_DETECTOR,
  matching: DEFAULT_MATCHING,
  model: "similarity",
  thresholds: DEFAULT_THRESHOLDS
};
const useWorkflowStore = create((set) => ({
  images: {
    sourceDataUrl: null,
    referenceDataUrl: null,
    sourceName: null,
    referenceName: null,
    sourceIsDemo: false,
    referenceIsDemo: false
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
  setImages: (images) => set((state) => ({ images: { ...state.images, ...images } })),
  setConfig: (config) => set({ config }),
  setSpatialGrid: (spatialGrid) => set({ spatialGrid }),
  startRun: () => set({
    isRunning: true,
    progress: 0,
    log: [],
    issues: [],
    result: null,
    error: null
  }),
  pushEvent: (event) => set((state) => ({
    currentStage: event.stage,
    progress: event.progress,
    log: [...state.log, event]
  })),
  setResult: (result) => set({ result, isRunning: false, currentStage: "completed", progress: 1 }),
  setError: (error) => set({ error, isRunning: false }),
  reset: () => set({
    images: {
      sourceDataUrl: null,
      referenceDataUrl: null,
      sourceName: null,
      referenceName: null,
      sourceIsDemo: false,
      referenceIsDemo: false
    },
    isRunning: false,
    currentStage: null,
    progress: 0,
    log: [],
    issues: [],
    result: null,
    error: null
  })
}));
export {
  useWorkflowStore as u
};
