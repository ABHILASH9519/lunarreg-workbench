import { FeatureDetector, TransformationModel } from "@/backend";
import {
  DataOriginBadge,
  DataTable,
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  SectionCard,
  StatusBadge,
} from "@/components";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDemoPairs } from "@/hooks/useRegistration";
import { detectFeatures } from "@/lib/cv/feature-detectors";
import { ransac } from "@/lib/cv/geometric-verification";
import { loadImageToImageData, rgbaToGray } from "@/lib/cv/helpers";
import { matchDescriptors } from "@/lib/cv/matcher";
import { computeMetrics } from "@/lib/cv/metrics";
import { recommendModel } from "@/lib/cv/models";
import { preprocess } from "@/lib/cv/preprocessing";
import type {
  ClassifiedCorrespondence,
  JobMetrics,
  Matrix3x3,
  TransformationModel as ModelType,
  ReproConfig,
} from "@/lib/types";
import { Boxes, GitCompareArrows, Play, Sparkles } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

// ---------------------------------------------------------------------------
// Model comparison: runs the real CV pipeline on a selected demo pair for each
// transformation model (Similarity, Affine, Homography) and compares the
// resulting metrics. The recommended model is chosen from actual
// geometric-consistency metrics — never hard-coded.
// ---------------------------------------------------------------------------

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

const MODEL_DOF: Record<ModelType, number> = {
  similarity: 4,
  affine: 6,
  homography: 8,
};

const DEFAULT_CONFIG: ReproConfig = {
  preprocessing: {
    grayscale: true,
    resizeWidth: undefined,
    resizeHeight: undefined,
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
  model: "similarity" as ModelType,
  thresholds: {
    ransacReprojThreshold: 3.0,
    minInlierRatio: 0.3,
  },
};

interface ModelComparisonRow {
  model: ModelType;
  label: string;
  dof: number;
  rmse: number | null;
  inlierCount: number;
  outlierCount: number;
  inlierRatio: number;
  reprojectionError: number | null;
  spatialCoverage: number | null;
  processingTimeMs: number;
  scale: number | null;
  rotationDeg: number | null;
  accepted: boolean;
  isRecommended: boolean;
}

interface ComparisonRun {
  rows: ModelComparisonRow[];
  recommendedModel: ModelType;
  totalMatches: number;
  elapsedMs: number;
}

/**
 * Run the real CV pipeline for each transformation model on a demo pair.
 * Feature detection and matching are shared; each model then runs RANSAC and
 * metric computation independently so every number comes from a real run.
 */
async function runModelComparison(
  sourceDataUrl: string,
  referenceDataUrl: string,
): Promise<ComparisonRun> {
  const start = performance.now();
  const [source, reference] = await Promise.all([
    loadImageToImageData(sourceDataUrl, 512),
    loadImageToImageData(referenceDataUrl, 512),
  ]);

  const sourceGray = rgbaToGray(source.imageData);
  const referenceGray = rgbaToGray(reference.imageData);
  const preSource = preprocess(sourceGray, {
    denoise: DEFAULT_CONFIG.preprocessing.denoise,
    contrastEnhancement: DEFAULT_CONFIG.preprocessing.contrastEnhancement,
    maxDim: 512,
  });
  const preRef = preprocess(referenceGray, {
    denoise: DEFAULT_CONFIG.preprocessing.denoise,
    contrastEnhancement: DEFAULT_CONFIG.preprocessing.contrastEnhancement,
    maxDim: 512,
  });

  const maxFeatures = Number(DEFAULT_CONFIG.detector.maxFeatures);
  const srcFeat = detectFeatures(preSource.gray, { maxFeatures });
  const refFeat = detectFeatures(preRef.gray, { maxFeatures });
  const matches = matchDescriptors(srcFeat.descriptors, refFeat.descriptors, {
    ratioThreshold: DEFAULT_CONFIG.matching.ratioThreshold,
    maxMatches: Number(DEFAULT_CONFIG.matching.maxMatches),
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

  const threshold = DEFAULT_CONFIG.thresholds.ransacReprojThreshold;
  const rows: ModelComparisonRow[] = [];
  const consistency: Array<{
    model: ModelType;
    inlierRatio: number;
    meanReprojError: number;
    inlierCount: number;
    dof: number;
  }> = [];

  for (const model of MODELS) {
    const modelStart = performance.now();
    const ransacResult = ransac(model, points, {
      reprojThreshold: threshold,
      minInlierRatio: DEFAULT_CONFIG.thresholds.minInlierRatio,
    });
    const metrics = computeMetrics({
      model,
      matrix: ransacResult.matrix,
      correspondences: ransacResult.correspondences,
      width: source.width,
      height: source.height,
    });
    const processingTimeMs = performance.now() - modelStart;
    consistency.push({
      model,
      inlierRatio: ransacResult.inlierRatio,
      meanReprojError: ransacResult.meanReprojError,
      inlierCount: ransacResult.inlierCount,
      dof: MODEL_DOF[model],
    });
    rows.push({
      model,
      label: MODEL_LABELS[model],
      dof: MODEL_DOF[model],
      rmse: metrics.rmse ?? null,
      inlierCount: ransacResult.inlierCount,
      outlierCount: ransacResult.outlierCount,
      inlierRatio: ransacResult.inlierRatio,
      reprojectionError: metrics.reprojectionError ?? null,
      spatialCoverage: metrics.spatialCoverage ?? null,
      processingTimeMs,
      scale: metrics.scale ?? null,
      rotationDeg: metrics.rotationDegrees ?? null,
      accepted: ransacResult.accepted,
      isRecommended: false,
    });
  }

  const recommendedModel = recommendModel(consistency);
  for (const row of rows) {
    row.isRecommended = row.model === recommendedModel;
  }

  return {
    rows,
    recommendedModel,
    totalMatches: points.length,
    elapsedMs: performance.now() - start,
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

export default function ModelComparisonPage() {
  const {
    pairs,
    selectedPair,
    selectedPairId,
    setSelectedPairId,
    loadPairs,
    loading,
  } = useDemoPairs();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [run, setRun] = useState<ComparisonRun | null>(null);

  const handleLoad = useCallback(() => {
    void loadPairs();
  }, [loadPairs]);

  const handleRun = useCallback(async () => {
    if (!selectedPair) return;
    setRunning(true);
    setError(null);
    try {
      // Defer so the main thread stays responsive while images decode.
      await new Promise((r) => setTimeout(r, 0));
      const result = await runModelComparison(
        selectedPair.sourceDataUrl,
        selectedPair.referenceDataUrl,
      );
      setRun(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Model comparison failed");
    } finally {
      setRunning(false);
    }
  }, [selectedPair]);

  const recommendedRow = useMemo(
    () => run?.rows.find((r) => r.isRecommended) ?? null,
    [run],
  );

  const chartData = useMemo(
    () =>
      run?.rows.map((r) => ({
        model: r.label,
        rmse: r.rmse,
        inlierRatio: r.inlierRatio,
        reprojectionError: r.reprojectionError,
        spatialCoverage: r.spatialCoverage,
        inlierCount: r.inlierCount,
      })) ?? [],
    [run],
  );

  const chartConfig = {
    rmse: { label: "RMSE (px)", color: "var(--chart-1)" },
    inlierRatio: { label: "Inlier Ratio", color: "var(--chart-2)" },
    reprojectionError: { label: "Reproj. Error (px)", color: "var(--chart-3)" },
    spatialCoverage: { label: "Spatial Coverage", color: "var(--chart-4)" },
  } as const;

  const tableColumns = [
    {
      header: "Model",
      cell: (row: ModelComparisonRow) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.label}</span>
          {row.isRecommended ? (
            <StatusBadge status="pass" label="RECOMMENDED" />
          ) : null}
        </div>
      ),
    },
    {
      header: "DOF",
      cell: (row: ModelComparisonRow) => (
        <span className="font-mono">{row.dof}</span>
      ),
      cellClassName: "text-right font-mono",
      headerClassName: "text-right",
    },
    {
      header: "RMSE (px)",
      cell: (row: ModelComparisonRow) => (
        <span className="font-mono">{fmt(row.rmse)}</span>
      ),
      cellClassName: "text-right font-mono",
      headerClassName: "text-right",
    },
    {
      header: "Inliers",
      cell: (row: ModelComparisonRow) => (
        <span className="font-mono">{row.inlierCount}</span>
      ),
      cellClassName: "text-right font-mono",
      headerClassName: "text-right",
    },
    {
      header: "Inlier Ratio",
      cell: (row: ModelComparisonRow) => (
        <span className="font-mono">{fmtPct(row.inlierRatio)}</span>
      ),
      cellClassName: "text-right font-mono",
      headerClassName: "text-right",
    },
    {
      header: "Reproj. Error (px)",
      cell: (row: ModelComparisonRow) => (
        <span className="font-mono">{fmt(row.reprojectionError)}</span>
      ),
      cellClassName: "text-right font-mono",
      headerClassName: "text-right",
    },
    {
      header: "Spatial Coverage",
      cell: (row: ModelComparisonRow) => (
        <span className="font-mono">{fmtPct(row.spatialCoverage)}</span>
      ),
      cellClassName: "text-right font-mono",
      headerClassName: "text-right",
    },
    {
      header: "Scale",
      cell: (row: ModelComparisonRow) => (
        <span className="font-mono">{fmt(row.scale, 4)}</span>
      ),
      cellClassName: "text-right font-mono",
      headerClassName: "text-right",
    },
    {
      header: "Rotation (°)",
      cell: (row: ModelComparisonRow) => (
        <span className="font-mono">{fmt(row.rotationDeg, 2)}</span>
      ),
      cellClassName: "text-right font-mono",
      headerClassName: "text-right",
    },
    {
      header: "Time (ms)",
      cell: (row: ModelComparisonRow) => (
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
            <Boxes className="size-5" aria-hidden="true" />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Model Comparison
            </h1>
            <p className="text-muted-foreground text-sm">
              Similarity vs Affine vs Homography — geometric-consistency metrics
              from real CV runs on the selected pair.
            </p>
          </div>
          <div className="ml-auto">
            <DataOriginBadge origin="demo" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <SectionCard
        title="Experiment Setup"
        description="Select a DEMO/SAMPLE DATA pair and run the comparison across all three transformation models."
        action={
          <Button
            data-ocid="model_comparison.run_button"
            onClick={() => void handleRun()}
            disabled={!selectedPair || running}
            className="gap-1.5"
          >
            {running ? (
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Play className="size-4" aria-hidden="true" />
            )}
            {running ? "Running…" : "Run Comparison"}
          </Button>
        }
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex w-full max-w-sm flex-col gap-1.5">
            <label
              htmlFor="model-comparison-pair"
              className="text-muted-foreground text-xs font-medium uppercase tracking-wider"
            >
              Demo pair
            </label>
            {pairs.length === 0 ? (
              <Button
                data-ocid="model_comparison.load_pairs_button"
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
                  id="model-comparison-pair"
                  data-ocid="model_comparison.pair_select"
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
            <div className="text-muted-foreground flex flex-col gap-0.5 text-sm">
              <span className="font-mono text-xs uppercase tracking-widest">
                {selectedPair.metadata.sensor}
              </span>
              <span>{selectedPair.metadata.description}</span>
            </div>
          ) : null}
        </div>
      </SectionCard>

      {/* States */}
      {error ? (
        <ErrorState
          message={error}
          onRetry={() => void handleRun()}
          retryLabel="Retry comparison"
        />
      ) : null}

      {running ? (
        <LoadingState label="Running CV pipeline across models…" rows={4} />
      ) : null}

      {!running && !error && !run ? (
        <EmptyState
          icon={GitCompareArrows}
          title="No comparison yet"
          description="Select a demo pair and run the comparison to see real RMSE, inlier, reprojection, coverage, scale, rotation, and timing metrics for each model."
          actionLabel="Run Comparison"
          onAction={() => void handleRun()}
        />
      ) : null}

      {run && !running ? (
        <>
          {/* Recommended model banner */}
          <SectionCard
            title="Recommended Model"
            description="Selected from actual geometric-consistency metrics (inlier ratio and reprojection error), preferring the simplest model within tolerance."
            contentClassName="flex flex-col gap-4"
          >
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <span className="bg-gradient-primary flex size-11 shrink-0 items-center justify-center rounded-lg text-primary-foreground">
                <Sparkles className="size-5" aria-hidden="true" />
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="font-display text-lg font-semibold">
                  {recommendedRow?.label ?? "—"}
                </span>
                <span className="text-muted-foreground text-sm">
                  {recommendedRow
                    ? `${recommendedRow.inlierCount} inliers · ${fmtPct(
                        recommendedRow.inlierRatio,
                      )} inlier ratio · RMSE ${fmt(recommendedRow.rmse)} px`
                    : "No recommendation available"}
                </span>
              </div>
              <div className="ml-auto">
                <StatusBadge status="pass" label="RECOMMENDED" />
              </div>
            </div>

            {recommendedRow ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                <MetricCard
                  label="RMSE"
                  value={fmt(recommendedRow.rmse)}
                  unit="px"
                  explanation="Root-mean-square reprojection error over inliers. Lower is better; measures how well the fitted model maps source points to reference points."
                />
                <MetricCard
                  label="Inliers"
                  value={recommendedRow.inlierCount}
                  explanation="Number of correspondences consistent with the fitted model within the reprojection threshold."
                />
                <MetricCard
                  label="Inlier Ratio"
                  value={fmtPct(recommendedRow.inlierRatio)}
                  explanation="Fraction of all correspondences that are inliers. Higher indicates a more geometrically consistent model."
                />
                <MetricCard
                  label="Spatial Coverage"
                  value={fmtPct(recommendedRow.spatialCoverage)}
                  explanation="Fraction of the image area spanned by inlier source points. Higher means the model is supported across the scene."
                />
                <MetricCard
                  label="Scale"
                  value={fmt(recommendedRow.scale, 4)}
                  explanation="Estimated scale factor between source and reference from the fitted transformation matrix."
                />
                <MetricCard
                  label="Rotation"
                  value={fmt(recommendedRow.rotationDeg, 2)}
                  unit="°"
                  explanation="Estimated rotation between source and reference from the fitted transformation matrix."
                />
              </div>
            ) : null}
          </SectionCard>

          {/* Comparison table */}
          <SectionCard
            title="Metric Comparison"
            description={`${run.totalMatches} correspondences matched · ${run.elapsedMs.toFixed(
              0,
            )} ms total. All values from real CV runs.`}
          >
            <DataTable
              data-ocid="model_comparison.table"
              columns={tableColumns}
              data={run.rows}
              rowKey={(row) => row.model}
            />
          </SectionCard>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SectionCard title="RMSE by Model" description="Lower is better.">
              <ChartContainer config={chartConfig} className="h-64">
                <BarChart data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="model" tickLine={false} axisLine={false} />
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
              title="Inlier Ratio by Model"
              description="Higher is more geometrically consistent."
            >
              <ChartContainer config={chartConfig} className="h-64">
                <BarChart data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="model" tickLine={false} axisLine={false} />
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
              title="Reprojection Error by Model"
              description="Mean reprojection error over inliers (px)."
            >
              <ChartContainer config={chartConfig} className="h-64">
                <BarChart data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="model" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={40} />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <Bar
                    dataKey="reprojectionError"
                    fill="var(--color-reprojectionError)"
                    radius={4}
                    data-ocid="chart_point"
                  />
                </BarChart>
              </ChartContainer>
            </SectionCard>

            <SectionCard
              title="Spatial Coverage by Model"
              description="Fraction of image area spanned by inliers."
            >
              <ChartContainer config={chartConfig} className="h-64">
                <BarChart data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="model" tickLine={false} axisLine={false} />
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
          </div>
        </>
      ) : null}
    </div>
  );
}
