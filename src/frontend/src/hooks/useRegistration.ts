import { useCallback, useMemo, useRef, useState } from "react";
import { runPipeline } from "../lib/cv/cv-engine";
import { loadImageToImageData } from "../lib/cv/helpers";
import type { PipelineEvent, RegistrationResult } from "../lib/types";
import { useDemoModeStore } from "../stores/demo-mode-store";
import { useWorkflowStore } from "../stores/workflow-store";

/**
 * useRegistration: orchestrates a full registration run from the workflow
 * store's current images and config, emitting progress events into the store.
 */
export function useRegistration() {
  const images = useWorkflowStore((s) => s.images);
  const config = useWorkflowStore((s) => s.config);
  const spatialGrid = useWorkflowStore((s) => s.spatialGrid);
  const isRunning = useWorkflowStore((s) => s.isRunning);
  const startRun = useWorkflowStore((s) => s.startRun);
  const pushEvent = useWorkflowStore((s) => s.pushEvent);
  const setResult = useWorkflowStore((s) => s.setResult);
  const setError = useWorkflowStore((s) => s.setError);
  const runningRef = useRef(false);

  const canRun = useMemo(
    () => !!images.sourceDataUrl && !!images.referenceDataUrl && !isRunning,
    [images.sourceDataUrl, images.referenceDataUrl, isRunning],
  );

  const run = useCallback(async () => {
    if (!images.sourceDataUrl || !images.referenceDataUrl || runningRef.current)
      return;
    runningRef.current = true;
    startRun();
    try {
      const [source, reference] = await Promise.all([
        loadImageToImageData(images.sourceDataUrl, 512),
        loadImageToImageData(images.referenceDataUrl, 512),
      ]);
      const onEvent = (event: PipelineEvent) => pushEvent(event);
      const output = runPipeline({
        sourceImageData: source.imageData,
        referenceImageData: reference.imageData,
        config,
        spatialGrid,
        onEvent,
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
    setError,
  ]);

  return { run, canRun, isRunning };
}

/**
 * useDemoPairs: lazily generates the bundled demo pairs once and exposes the
 * selected pair plus a selector.
 */
export function useDemoPairs() {
  const pairs = useDemoModeStore((s) => s.pairs);
  const selectedPairId = useDemoModeStore((s) => s.selectedPairId);
  const setPairs = useDemoModeStore((s) => s.setPairs);
  const setSelectedPairId = useDemoModeStore((s) => s.setSelectedPairId);
  const setActive = useDemoModeStore((s) => s.setActive);
  const [loading, setLoading] = useState(false);

  const loadPairs = useCallback(async () => {
    if (pairs.length > 0) return;
    setLoading(true);
    try {
      // Defer generation so the main thread stays responsive.
      await new Promise((r) => setTimeout(r, 0));
      const { generateAllDemoPairs } = await import("../lib/demo/demo-pairs");
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

  const selectedPair = useMemo(
    () => pairs.find((p) => p.metadata.id === selectedPairId) ?? null,
    [pairs, selectedPairId],
  );

  return {
    pairs,
    selectedPair,
    selectedPairId,
    setSelectedPairId,
    loadPairs,
    loading,
  };
}

/**
 * useImageLoader: loads an image source (data URL) into ImageData at a target
 * max dimension, with loading/error state.
 */
export function useImageLoader(maxDim = 512) {
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (src: string) => {
      setLoading(true);
      setError(null);
      try {
        const {
          imageData: data,
          width: w,
          height: h,
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
    [maxDim],
  );

  return { imageData, width, height, loading, error, load };
}
