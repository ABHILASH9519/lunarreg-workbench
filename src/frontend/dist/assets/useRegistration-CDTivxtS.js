import { r as reactExports, av as __vitePreload } from "./index-CLvvNGC5.js";
import { r as runPipeline } from "./cv-engine-jhIfoGkm.js";
import { l as loadImageToImageData } from "./metrics-CXdDL_t5.js";
import { c as create } from "./react-CxBERiit.js";
import { u as useWorkflowStore } from "./workflow-store-Bufg8Y0a.js";
const useDemoModeStore = create((set) => ({
  active: false,
  selectedPairId: null,
  pairs: [],
  setActive: (active) => set({ active }),
  setSelectedPairId: (selectedPairId) => set({ selectedPairId }),
  setPairs: (pairs) => set({ pairs })
}));
function useRegistration() {
  const images = useWorkflowStore((s) => s.images);
  const config = useWorkflowStore((s) => s.config);
  const spatialGrid = useWorkflowStore((s) => s.spatialGrid);
  const isRunning = useWorkflowStore((s) => s.isRunning);
  const startRun = useWorkflowStore((s) => s.startRun);
  const pushEvent = useWorkflowStore((s) => s.pushEvent);
  const setResult = useWorkflowStore((s) => s.setResult);
  const setError = useWorkflowStore((s) => s.setError);
  const runningRef = reactExports.useRef(false);
  const canRun = reactExports.useMemo(
    () => !!images.sourceDataUrl && !!images.referenceDataUrl && !isRunning,
    [images.sourceDataUrl, images.referenceDataUrl, isRunning]
  );
  const run = reactExports.useCallback(async () => {
    if (!images.sourceDataUrl || !images.referenceDataUrl || runningRef.current)
      return;
    runningRef.current = true;
    startRun();
    try {
      const [source, reference] = await Promise.all([
        loadImageToImageData(images.sourceDataUrl, 512),
        loadImageToImageData(images.referenceDataUrl, 512)
      ]);
      const onEvent = (event) => pushEvent(event);
      const output = runPipeline({
        sourceImageData: source.imageData,
        referenceImageData: reference.imageData,
        config,
        spatialGrid,
        onEvent
      });
      setResult(output.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      runningRef.current = false;
    }
  }, [
    images.sourceDataUrl,
    images.referenceDataUrl,
    config,
    spatialGrid,
    startRun,
    pushEvent,
    setResult,
    setError
  ]);
  return { run, canRun, isRunning };
}
function useDemoPairs() {
  const pairs = useDemoModeStore((s) => s.pairs);
  const selectedPairId = useDemoModeStore((s) => s.selectedPairId);
  const setPairs = useDemoModeStore((s) => s.setPairs);
  const setSelectedPairId = useDemoModeStore((s) => s.setSelectedPairId);
  const setActive = useDemoModeStore((s) => s.setActive);
  const [loading, setLoading] = reactExports.useState(false);
  const loadPairs = reactExports.useCallback(async () => {
    if (pairs.length > 0) return;
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 0));
      const { generateAllDemoPairs } = await __vitePreload(async () => {
        const { generateAllDemoPairs: generateAllDemoPairs2 } = await import("./demo-pairs-DZbS-Ryj.js");
        return { generateAllDemoPairs: generateAllDemoPairs2 };
      }, true ? [] : void 0);
      const generated = generateAllDemoPairs();
      setPairs(generated);
      setActive(true);
      if (!selectedPairId && generated.length > 0) {
        setSelectedPairId(generated[0].metadata.id);
      }
    } finally {
      setLoading(false);
    }
  }, [pairs.length, selectedPairId, setPairs, setActive, setSelectedPairId]);
  const selectedPair = reactExports.useMemo(
    () => pairs.find((p) => p.metadata.id === selectedPairId) ?? null,
    [pairs, selectedPairId]
  );
  return {
    pairs,
    selectedPair,
    selectedPairId,
    setSelectedPairId,
    loadPairs,
    loading
  };
}
function useImageLoader(maxDim = 512) {
  const [imageData, setImageData] = reactExports.useState(null);
  const [width, setWidth] = reactExports.useState(0);
  const [height, setHeight] = reactExports.useState(0);
  const [loading, setLoading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const load = reactExports.useCallback(
    async (src) => {
      setLoading(true);
      setError(null);
      try {
        const {
          imageData: data,
          width: w,
          height: h
        } = await loadImageToImageData(src, maxDim);
        setImageData(data);
        setWidth(w);
        setHeight(h);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load image");
        setImageData(null);
      } finally {
        setLoading(false);
      }
    },
    [maxDim]
  );
  return { imageData, width, height, loading, error, load };
}
export {
  useDemoPairs as a,
  useImageLoader as b,
  useDemoModeStore as c,
  useRegistration as u
};
