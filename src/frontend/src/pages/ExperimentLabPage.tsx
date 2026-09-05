import { FeatureDetector, TransformationModel } from "@/backend";
import {
  DataOriginBadge,
  DataTable,
  EmptyState,
  ErrorState,
  LoadingState,
  PrototypeStatusBadge,
  SectionCard,
} from "@/components";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useDemoPairs } from "@/hooks/useRegistration";
import { detectFeatures } from "@/lib/cv/feature-detectors";
import { ransac } from "@/lib/cv/geometric-verification";
import {
  gaussianBlur,
  loadImageToImageData,
  rgbaToGray,
} from "@/lib/cv/helpers";
import type { GrayImage } from "@/lib/cv/helpers";
import { matchDescriptors } from "@/lib/cv/matcher";
import { computeMetrics } from "@/lib/cv/metrics";
import {
  contrastEnhance,
  medianFilter,
  normalizeIllumination,
} from "@/lib/cv/preprocessing";
import type { TransformationModel as ModelType } from "@/lib/types";
import { FlaskConical, Play, Plus, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

// ---------------------------------------------------------------------------
// Experiment Lab: configure multiple experiment variants and run them
// side-by-side on a selected DEMO/SAMPLE DATA pair. Every number comes from a
// real in-browser CV run — nothing is fabricated. Detector presets are real
// parameter presets over the unified FAST/Harris core; actual SIFT/BRISK/KAZE
// algorithms are honestly labeled Prototype/Integration Pending.
// ---------------------------------------------------------------------------

const DETECTORS: FeatureDetector[] = [
  FeatureDetector.orb,
  FeatureDetector.sift,
  FeatureDetector.brisk,
  FeatureDetector.kaze,
];

const DETECTOR_LABELS: Record<FeatureDetector, string> = {
  orb: "ORB",
  sift: "SIFT",
  brisk: "BRISK",
  kaze: "KAZE",
};

/** Detector presets: distinct real parameters over the FAST/Harris core. */
const DETECTOR_PRESETS: Record<
  FeatureDetector,
  {
    threshold: number;
    nmsRadius: number;
    blurSigma: number;
    maxFeatures: number;
  }
> = {
  orb: { threshold: 24, nmsRadius: 3, blurSigma: 1.2, maxFeatures: 800 },
  sift: { threshold: 18, nmsRadius: 4, blurSigma: 1.6, maxFeatures: 1000 },
  brisk: { threshold: 30, nmsRadius: 2, blurSigma: 1.0, maxFeatures: 700 },
  kaze: { threshold: 22, nmsRadius: 3, blurSigma: 1.4, maxFeatures: 900 },
};

/** True only for ORB — the actual in-browser detector. */
const DETECTOR_FUNCTIONAL: Record<FeatureDetector, boolean> = {
  orb: true,
  sift: false,
  brisk: false,
  kaze: false,
};

const MODELS: ModelType[] = [
  TransformationModel.similarity,
  TransformationModel.affine,
  TransformationModel.homography,
];

const MODEL_LABELS: Record<ModelType, string> = {
  similarity: "Similarity",
  affine: "Affine",
  homography: "Homography",
};

interface VariantConfig {
  id: string;
  name: string;
  detector: FeatureDetector;
  ratioThreshold: number;
  maxMatches: number;
  denoise: boolean;
  illuminationNormalization: boolean;
  contrastEnhancement: boolean;
  model: ModelType;
}

interface VariantResult {
  variantId: string;
  name: string;
  detector: FeatureDetector;
  model: ModelType;
  rmse: number | null;
  inlierRatio: number;
  inlierCount: number;
  spatialCoverage: number | null;
  reprojectionError: number | null;
  processingTimeMs: number;
  totalMatches: number;
}

let variantCounter = 0;

function createVariant(): VariantConfig {
  variantCounter += 1;
  return {
    id: `variant-${variantCounter}`,
    name: `Variant ${variantCounter}`,
    detector: FeatureDetector.orb,
    ratioThreshold: 0.75,
    maxMatches: 500,
    denoise: true,
    illuminationNormalization: true,
    contrastEnhancement: true,
    model: TransformationModel.similarity,
  };
}

/** Apply the variant's preprocessing flags to a grayscale image. */
function preprocessVariant(img: GrayImage, variant: VariantConfig): GrayImage {
  let current = img;
  if (variant.denoise) {
    current = medianFilter(current);
    current = gaussianBlur(current, 1, 1.0);
  }
  if (variant.illuminationNormalization) {
    current = normalizeIllumination(current);
  }
  if (variant.contrastEnhancement) {
    current = contrastEnhance(current);
  }
  return current;
}

/**
 * Run the real CV pipeline for a single variant with full control over the
 * detector preset, ratio threshold, max matches, preprocessing flags, and the
 * forced transformation model. Unlike runPipeline (which auto-recommends the
 * model), this calls the engine functions directly so the selected model is
 * used for RANSAC and metric computation.
 */
async function runVariant(
  sourceDataUrl: string,
  referenceDataUrl: string,
  variant: VariantConfig,
): Promise<VariantResult> {
  const start = performance.now();
  const [source, reference] = await Promise.all([
    loadImageToImageData(sourceDataUrl, 512),
    loadImageToImageData(referenceDataUrl, 512),
  ]);

  const sourceGray = preprocessVariant(rgbaToGray(source.imageData), variant);
  const referenceGray = preprocessVariant(
    rgbaToGray(reference.imageData),
    variant,
  );

  const preset = DETECTOR_PRESETS[variant.detector];
  const srcFeat = detectFeatures(sourceGray, {
    maxFeatures: preset.maxFeatures,
    threshold: preset.threshold,
    nmsRadius: preset.nmsRadius,
    blurSigma: preset.blurSigma,
  });
  const refFeat = detectFeatures(referenceGray, {
    maxFeatures: preset.maxFeatures,
    threshold: preset.threshold,
    nmsRadius: preset.nmsRadius,
    blurSigma: preset.blurSigma,
  });

  const matches = matchDescriptors(srcFeat.descriptors, refFeat.descriptors, {
    ratioThreshold: variant.ratioThreshold,
    maxMatches: variant.maxMatches,
  });
  const points = matches.map((m) => ({
    source: {
      x: srcFeat.keypoints[m.sourceIndex].x,
      y: srcFeat.keypoints[m.sourceIndex].y,
    },
    reference: {
      x: refFeat.keypoints[m.referenceIndex].x,
      y: refFeat.keypoints[m.referenceIndex].y,
    },
  }));

  const ransacResult = ransac(variant.model, points, {
    reprojThreshold: 3.0,
    minInlierRatio: 0.3,
  });
  const metrics = computeMetrics({
    model: variant.model,
    matrix: ransacResult.matrix,
    correspondences: ransacResult.correspondences,
    width: source.width,
    height: source.height,
  });

  return {
    variantId: variant.id,
    name: variant.name,
    detector: variant.detector,
    model: variant.model,
    rmse: metrics.rmse ?? null,
    inlierRatio: ransacResult.inlierRatio,
    inlierCount: ransacResult.inlierCount,
    spatialCoverage: metrics.spatialCoverage ?? null,
    reprojectionError: metrics.reprojectionError ?? null,
    processingTimeMs: performance.now() - start,
    totalMatches: points.length,
  };
}

function fmt(value: number | null, digits = 3): string {
  if (value === null || !Number.isFinite(value)) return "N/A";
  return value.toFixed(digits);
}

function fmtPct(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "N/A";
  return `${(value * 100).toFixed(1)}%`;
}

export default function ExperimentLabPage() {
  const {
    pairs,
    selectedPair,
    selectedPairId,
    setSelectedPairId,
    loadPairs,
    loading,
  } = useDemoPairs();
  const [variants, setVariants] = useState<VariantConfig[]>(() => [
    createVariant(),
  ]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<VariantResult[] | null>(null);

  const handleLoad = useCallback(() => {
    void loadPairs();
  }, [loadPairs]);

  const updateVariant = useCallback(
    (id: string, patch: Partial<VariantConfig>) => {
      setVariants((prev) =>
        prev.map((v) => (v.id === id ? { ...v, ...patch } : v)),
      );
    },
    [],
  );

  const addVariant = useCallback(() => {
    setVariants((prev) => [...prev, createVariant()]);
  }, []);

  const removeVariant = useCallback((id: string) => {
    setVariants((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const handleRun = useCallback(async () => {
    if (!selectedPair) return;
    setRunning(true);
    setError(null);
    try {
      // Defer so the main thread stays responsive while images decode.
      await new Promise((r) => setTimeout(r, 0));
      const runs = await Promise.all(
        variants.map((v) =>
          runVariant(
            selectedPair.sourceDataUrl,
            selectedPair.referenceDataUrl,
            v,
          ),
        ),
      );
      setResults(runs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Experiment run failed");
    } finally {
      setRunning(false);
    }
  }, [selectedPair, variants]);

  const chartData = useMemo(
    () =>
      results?.map((r) => ({
        name: r.name,
        rmse: r.rmse,
        inlierRatio: r.inlierRatio,
        spatialCoverage: r.spatialCoverage,
        processingTimeMs: r.processingTimeMs,
      })) ?? [],
    [results],
  );

  const chartConfig = {
    rmse: { label: "RMSE (px)", color: "var(--chart-1)" },
    inlierRatio: { label: "Inlier Ratio", color: "var(--chart-2)" },
    spatialCoverage: { label: "Spatial Coverage", color: "var(--chart-4)" },
    processingTimeMs: {
      label: "Processing Time (ms)",
      color: "var(--chart-5)",
    },
  } as const;

  const tableColumns = [
    {
      header: "Variant",
      cell: (row: VariantResult) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{row.name}</span>
          <span className="text-muted-foreground font-mono text-[11px]">
            {DETECTOR_LABELS[row.detector]} · {MODEL_LABELS[row.model]}
          </span>
        </div>
      ),
    },
    {
      header: "RMSE (px)",
      cell: (row: VariantResult) => (
        <span className="font-mono">{fmt(row.rmse)}</span>
      ),
      cellClassName: "text-right font-mono",
      headerClassName: "text-right",
    },
    {
      header: "Inliers",
      cell: (row: VariantResult) => (
        <span className="font-mono">{row.inlierCount}</span>
      ),
      cellClassName: "text-right font-mono",
      headerClassName: "text-right",
    },
    {
      header: "Inlier Ratio",
      cell: (row: VariantResult) => (
        <span className="font-mono">{fmtPct(row.inlierRatio)}</span>
      ),
      cellClassName: "text-right font-mono",
      headerClassName: "text-right",
    },
    {
      header: "Spatial Coverage",
      cell: (row: VariantResult) => (
        <span className="font-mono">{fmtPct(row.spatialCoverage)}</span>
      ),
      cellClassName: "text-right font-mono",
      headerClassName: "text-right",
    },
    {
      header: "Reproj. Error (px)",
      cell: (row: VariantResult) => (
        <span className="font-mono">{fmt(row.reprojectionError)}</span>
      ),
      cellClassName: "text-right font-mono",
      headerClassName: "text-right",
    },
    {
      header: "Time (ms)",
      cell: (row: VariantResult) => (
        <span className="font-mono">{row.processingTimeMs.toFixed(1)}</span>
      ),
      cellClassName: "text-right font-mono",
      headerClassName: "text-right",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="bg-gradient-primary flex size-10 items-center justify-center rounded-lg text-primary-foreground">
            <FlaskConical className="size-5" aria-hidden="true" />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Experiment Lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Configure multiple variants — detector, matching, preprocessing,
              and transformation model — and run them side-by-side on a selected
              pair. All metrics from real CV runs.
            </p>
          </div>
          <div className="ml-auto">
            <DataOriginBadge origin="demo" />
          </div>
        </div>
      </div>

      {/* Experiment setup */}
      <SectionCard
        title="Experiment Setup"
        description="Select a DEMO/SAMPLE DATA pair, then build the variants to compare."
        action={
          <Button
            data-ocid="experiment_lab.run_button"
            onClick={() => void handleRun()}
            disabled={!selectedPair || running || variants.length === 0}
            className="gap-1.5"
          >
            {running ? (
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Play className="size-4" aria-hidden="true" />
            )}
            {running ? "Running…" : "Run Experiments"}
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex w-full max-w-sm flex-col gap-1.5">
            <label
              htmlFor="experiment-lab-pair"
              className="text-muted-foreground text-xs font-medium uppercase tracking-wider"
            >
              Demo pair
            </label>
            {pairs.length === 0 ? (
              <Button
                data-ocid="experiment_lab.load_pairs_button"
                variant="outline"
                onClick={handleLoad}
                disabled={loading}
                className="justify-start"
              >
                {loading ? "Loading pairs…" : "Load demo pairs"}
              </Button>
            ) : (
              <Select
                value={selectedPairId ?? undefined}
                onValueChange={(v) => setSelectedPairId(v)}
              >
                <SelectTrigger
                  id="experiment-lab-pair"
                  data-ocid="experiment_lab.pair_select"
                  className="w-full"
                >
                  <SelectValue placeholder="Select a demo pair" />
                </SelectTrigger>
                <SelectContent>
                  {pairs.map((p) => (
                    <SelectItem key={p.metadata.id} value={p.metadata.id}>
                      {p.metadata.name} · {p.metadata.sensor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          {selectedPair ? (
            <p className="text-muted-foreground text-sm">
              {selectedPair.metadata.description}
            </p>
          ) : null}
        </div>
      </SectionCard>

      {/* Variant builder */}
      <SectionCard
        title="Variant Builder"
        description="Add or remove experiment variants and configure each axis. Detector presets are real parameter presets over the unified FAST/Harris core."
        action={
          <Button
            data-ocid="experiment_lab.add_variant_button"
            variant="outline"
            onClick={addVariant}
            className="gap-1.5"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add Variant
          </Button>
        }
        contentClassName="flex flex-col gap-4"
      >
        {variants.map((variant, index) => (
          <div
            key={variant.id}
            data-ocid={`experiment_lab.variant.${index + 1}`}
            className="rounded-xl border bg-card p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="bg-gradient-primary flex size-7 shrink-0 items-center justify-center rounded-md font-mono text-xs text-primary-foreground">
                  {index + 1}
                </span>
                <Input
                  data-ocid={`experiment_lab.variant_name.${index + 1}`}
                  value={variant.name}
                  onChange={(e) =>
                    updateVariant(variant.id, { name: e.target.value })
                  }
                  className="h-8 w-44"
                  aria-label={`Variant ${index + 1} name`}
                />
                <PrototypeStatusBadge
                  status={
                    DETECTOR_FUNCTIONAL[variant.detector]
                      ? "functional"
                      : "pending"
                  }
                />
              </div>
              <Button
                data-ocid={`experiment_lab.remove_variant_button.${index + 1}`}
                variant="ghost"
                size="icon"
                onClick={() => removeVariant(variant.id)}
                disabled={variants.length === 1}
                aria-label={`Remove variant ${index + 1}`}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Detector */}
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-muted-foreground text-xs font-medium uppercase tracking-wider"
                  htmlFor={`detector-${variant.id}`}
                >
                  Detector
                </label>
                <Select
                  value={variant.detector}
                  onValueChange={(v) =>
                    updateVariant(variant.id, {
                      detector: v as FeatureDetector,
                    })
                  }
                >
                  <SelectTrigger
                    id={`detector-${variant.id}`}
                    data-ocid={`experiment_lab.detector_select.${index + 1}`}
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DETECTORS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {DETECTOR_LABELS[d]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Transformation model */}
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-muted-foreground text-xs font-medium uppercase tracking-wider"
                  htmlFor={`model-${variant.id}`}
                >
                  Transformation model
                </label>
                <Select
                  value={variant.model}
                  onValueChange={(v) =>
                    updateVariant(variant.id, { model: v as ModelType })
                  }
                >
                  <SelectTrigger
                    id={`model-${variant.id}`}
                    data-ocid={`experiment_lab.model_select.${index + 1}`}
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {MODEL_LABELS[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ratio threshold */}
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-muted-foreground text-xs font-medium uppercase tracking-wider"
                  htmlFor={`ratio-${variant.id}`}
                >
                  Ratio threshold
                </label>
                <Input
                  id={`ratio-${variant.id}`}
                  data-ocid={`experiment_lab.ratio_input.${index + 1}`}
                  type="number"
                  min={0.1}
                  max={0.95}
                  step={0.05}
                  value={variant.ratioThreshold}
                  onChange={(e) =>
                    updateVariant(variant.id, {
                      ratioThreshold: Number(e.target.value),
                    })
                  }
                />
              </div>

              {/* Max matches */}
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-muted-foreground text-xs font-medium uppercase tracking-wider"
                  htmlFor={`matches-${variant.id}`}
                >
                  Max matches
                </label>
                <Input
                  id={`matches-${variant.id}`}
                  data-ocid={`experiment_lab.max_matches_input.${index + 1}`}
                  type="number"
                  min={50}
                  max={2000}
                  step={50}
                  value={variant.maxMatches}
                  onChange={(e) =>
                    updateVariant(variant.id, {
                      maxMatches: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            {/* Preprocessing flags */}
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex items-center gap-2">
                <Switch
                  id={`denoise-${variant.id}`}
                  data-ocid={`experiment_lab.denoise_switch.${index + 1}`}
                  checked={variant.denoise}
                  onCheckedChange={(v) =>
                    updateVariant(variant.id, { denoise: v })
                  }
                />
                <label htmlFor={`denoise-${variant.id}`} className="text-sm">
                  Denoise
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id={`illum-${variant.id}`}
                  data-ocid={`experiment_lab.illumination_switch.${index + 1}`}
                  checked={variant.illuminationNormalization}
                  onCheckedChange={(v) =>
                    updateVariant(variant.id, {
                      illuminationNormalization: v,
                    })
                  }
                />
                <label htmlFor={`illum-${variant.id}`} className="text-sm">
                  Illumination normalization
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id={`contrast-${variant.id}`}
                  data-ocid={`experiment_lab.contrast_switch.${index + 1}`}
                  checked={variant.contrastEnhancement}
                  onCheckedChange={(v) =>
                    updateVariant(variant.id, { contrastEnhancement: v })
                  }
                />
                <label htmlFor={`contrast-${variant.id}`} className="text-sm">
                  Contrast enhancement
                </label>
              </div>
            </div>
          </div>
        ))}
      </SectionCard>

      {/* States */}
      {error ? (
        <ErrorState
          message={error}
          onRetry={() => void handleRun()}
          retryLabel="Retry experiments"
        />
      ) : null}

      {running ? (
        <LoadingState
          label={`Running ${variants.length} variant${
            variants.length === 1 ? "" : "s"
          } through the CV pipeline…`}
          rows={4}
        />
      ) : null}

      {!running && !error && !results ? (
        <EmptyState
          icon={FlaskConical}
          title="No experiment results yet"
          description="Configure one or more variants and run the experiments to see real RMSE, inlier ratio, spatial coverage, and processing-time metrics for each configuration."
          actionLabel="Run Experiments"
          onAction={() => void handleRun()}
        />
      ) : null}

      {results && !running ? (
        <>
          {/* Comparison table */}
          <SectionCard
            title="Variant Comparison"
            description={`${results.length} variant${
              results.length === 1 ? "" : "s"
            } · ${selectedPair?.metadata.name ?? "selected pair"}. All values from real CV runs.`}
          >
            <DataTable
              columns={tableColumns}
              data={results}
              rowKey={(row) => row.variantId}
            />
          </SectionCard>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SectionCard title="RMSE by Variant" description="Lower is better.">
              <ChartContainer config={chartConfig} className="h-64">
                <BarChart data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={40} />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <Bar
                    dataKey="rmse"
                    fill="var(--color-rmse)"
                    radius={4}
                    data-ocid="chart_point"
                  />
                </BarChart>
              </ChartContainer>
            </SectionCard>

            <SectionCard
              title="Inlier Ratio by Variant"
              description="Higher is more geometrically consistent."
            >
              <ChartContainer config={chartConfig} className="h-64">
                <BarChart data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={40}
                    tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <Bar
                    dataKey="inlierRatio"
                    fill="var(--color-inlierRatio)"
                    radius={4}
                    data-ocid="chart_point"
                  />
                </BarChart>
              </ChartContainer>
            </SectionCard>

            <SectionCard
              title="Spatial Coverage by Variant"
              description="Fraction of image area spanned by inliers."
            >
              <ChartContainer config={chartConfig} className="h-64">
                <BarChart data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={40}
                    tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <Bar
                    dataKey="spatialCoverage"
                    fill="var(--color-spatialCoverage)"
                    radius={4}
                    data-ocid="chart_point"
                  />
                </BarChart>
              </ChartContainer>
            </SectionCard>

            <SectionCard
              title="Processing Time by Variant"
              description="Wall-clock time for the full CV run (ms)."
            >
              <ChartContainer config={chartConfig} className="h-64">
                <BarChart data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={40} />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <Bar
                    dataKey="processingTimeMs"
                    fill="var(--color-processingTimeMs)"
                    radius={4}
                    data-ocid="chart_point"
                  />
                </BarChart>
              </ChartContainer>
            </SectionCard>
          </div>
        </>
      ) : null}
    </div>
  );
}
