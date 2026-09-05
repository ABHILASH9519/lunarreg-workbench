import { FeatureDetector, TransformationModel } from "@/backend";
import {
  DataOriginBadge,
  DataTable,
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  PrototypeStatusBadge,
  SectionCard,
  StatusBadge,
} from "@/components";
import { runPipeline } from "@/lib/cv/cv-engine";
import { loadImageToImageData } from "@/lib/cv/helpers";
import { generateAllDemoPairs } from "@/lib/demo/demo-pairs";
import type { DemoPair, RegistrationResult, ReproConfig } from "@/lib/types";
import {
  Activity,
  Eye,
  Gauge,
  Layers,
  RefreshCw,
  Scaling,
  Sun,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ---------------------------------------------------------------------------
// Default pipeline configuration (matches the workflow store defaults).
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: ReproConfig = {
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
  model: TransformationModel.similarity,
  thresholds: {
    ransacReprojThreshold: 3.0,
    minInlierRatio: 0.3,
  },
};

const CHART = {
  primary: "var(--chart-1)",
  accent: "var(--chart-2)",
  muted: "var(--chart-3)",
  success: "var(--chart-4)",
  destructive: "var(--chart-5)",
};

// ---------------------------------------------------------------------------
// Analysis data shapes
// ---------------------------------------------------------------------------

interface SunAnglePoint {
  pairId: string;
  sensor: string;
  sunAzimuthDeg: number;
  sunElevationDeg: number;
  inlierRatioNorm: number;
  rmseNorm: number | null;
  inlierRatioRaw: number;
  rmseRaw: number | null;
}

interface ScalePoint {
  sensor: string;
  scaleRatio: number;
  inlierRatio: number;
  rmse: number | null;
}

interface MultiModalPoint {
  sensor: string;
  inlierRatio: number;
  rmse: number | null;
  inlierCount: number;
  spatialCoverage: number | null;
}

// ---------------------------------------------------------------------------
// Demo scenario definitions
// ---------------------------------------------------------------------------

interface Scenario {
  id: string;
  label: string;
  description: string;
  pairId: string;
  icon: typeof Sun;
}

const SCENARIOS: Scenario[] = [
  {
    id: "sun-angle",
    label: "Sun Angle Variation",
    description:
      "Registers a pair with a pronounced sun azimuth/elevation difference to test illumination robustness.",
    pairId: "demo-iirs-mineral-spectral",
    icon: Sun,
  },
  {
    id: "scale",
    label: "Scale Variation",
    description:
      "Registers a pair with a pronounced scale difference to test scale robustness.",
    pairId: "demo-lro-nac-highland",
    icon: Scaling,
  },
  {
    id: "viewpoint",
    label: "Viewpoint Variation",
    description:
      "Registers a pair with pronounced viewpoint and rotation variation.",
    pairId: "demo-lro-nac-highland",
    icon: Eye,
  },
  {
    id: "multi-modal",
    label: "Multi-Modal Registration",
    description:
      "Registers a pair with strong multi-modal appearance contrast between source and reference.",
    pairId: "demo-iirs-mineral-spectral",
    icon: Layers,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const yieldToUI = () => new Promise((r) => setTimeout(r, 0));

function inlierRatioOf(result: RegistrationResult): number {
  if (result.correspondences.length === 0) return 0;
  return (
    result.correspondences.filter((c) => c.inlier).length /
    result.correspondences.length
  );
}

function fmt(v: number | null | undefined, digits = 2): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "N/A";
  return v.toFixed(digits);
}

function pct(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "N/A";
  return `${(v * 100).toFixed(1)}%`;
}

async function runPair(
  pair: DemoPair,
  config: ReproConfig,
): Promise<RegistrationResult> {
  const [source, reference] = await Promise.all([
    loadImageToImageData(pair.sourceDataUrl, 512),
    loadImageToImageData(pair.referenceDataUrl, 512),
  ]);
  const output = runPipeline({
    sourceImageData: source.imageData,
    referenceImageData: reference.imageData,
    config,
    spatialGrid: 8,
  });
  return output.result;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AnalysesPage() {
  const [pairs, setPairs] = useState<DemoPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sunAngle, setSunAngle] = useState<SunAnglePoint[]>([]);
  const [scale, setScale] = useState<ScalePoint[]>([]);
  const [multiModal, setMultiModal] = useState<MultiModalPoint[]>([]);

  const [scenarioId, setScenarioId] = useState<string>("sun-angle");
  const [scenarioResult, setScenarioResult] = useState<{
    pair: DemoPair;
    result: RegistrationResult;
  } | null>(null);
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [scenarioError, setScenarioError] = useState<string | null>(null);

  const runAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const generated = generateAllDemoPairs();
      setPairs(generated);

      // Sun-angle robustness: run each pair with illumination normalization
      // ON (contrast enhancement) and OFF, charting inlier ratio and RMSE.
      const sun: SunAnglePoint[] = [];
      for (const pair of generated) {
        const normConfig: ReproConfig = {
          ...DEFAULT_CONFIG,
          preprocessing: {
            ...DEFAULT_CONFIG.preprocessing,
            contrastEnhancement: true,
          },
        };
        const rawConfig: ReproConfig = {
          ...DEFAULT_CONFIG,
          preprocessing: {
            ...DEFAULT_CONFIG.preprocessing,
            contrastEnhancement: false,
          },
        };
        const normResult = await runPair(pair, normConfig);
        await yieldToUI();
        const rawResult = await runPair(pair, rawConfig);
        await yieldToUI();
        sun.push({
          pairId: pair.metadata.id,
          sensor: pair.metadata.sensor,
          sunAzimuthDeg: pair.metadata.sunAzimuthDeg,
          sunElevationDeg: pair.metadata.sunElevationDeg,
          inlierRatioNorm: inlierRatioOf(normResult),
          rmseNorm: normResult.metrics.rmse ?? null,
          inlierRatioRaw: inlierRatioOf(rawResult),
          rmseRaw: rawResult.metrics.rmse ?? null,
        });
      }
      setSunAngle(sun);

      // Scale robustness: run each pair (each has a distinct scale ratio).
      const sc: ScalePoint[] = [];
      for (const pair of generated) {
        const result = await runPair(pair, DEFAULT_CONFIG);
        await yieldToUI();
        sc.push({
          sensor: pair.metadata.sensor,
          scaleRatio: pair.metadata.scaleRatio,
          inlierRatio: inlierRatioOf(result),
          rmse: result.metrics.rmse ?? null,
        });
      }
      setScale(sc);

      // Multi-modal analysis: per-sensor registration metrics.
      const mm: MultiModalPoint[] = [];
      for (const pair of generated) {
        const result = await runPair(pair, DEFAULT_CONFIG);
        await yieldToUI();
        mm.push({
          sensor: pair.metadata.sensor,
          inlierRatio: inlierRatioOf(result),
          rmse: result.metrics.rmse ?? null,
          inlierCount: Number(result.metrics.inlierCount ?? 0n),
          spatialCoverage: result.metrics.spatialCoverage ?? null,
        });
      }
      setMultiModal(mm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void runAll();
  }, [runAll]);

  const runScenario = useCallback(
    async (id: string) => {
      const scenario = SCENARIOS.find((s) => s.id === id);
      if (!scenario) return;
      const pair = pairs.find((p) => p.metadata.id === scenario.pairId);
      if (!pair) return;
      setScenarioId(id);
      setScenarioLoading(true);
      setScenarioError(null);
      try {
        const result = await runPair(pair, DEFAULT_CONFIG);
        setScenarioResult({ pair, result });
      } catch (err) {
        setScenarioError(
          err instanceof Error ? err.message : "Scenario run failed",
        );
      } finally {
        setScenarioLoading(false);
      }
    },
    [pairs],
  );

  // Derived chart data
  const sunInlierData = useMemo(
    () =>
      sunAngle.map((p) => ({
        sensor: p.sensor,
        Normalized: p.inlierRatioNorm,
        Raw: p.inlierRatioRaw,
      })),
    [sunAngle],
  );

  const sunRmseData = useMemo(
    () =>
      sunAngle.map((p) => ({
        sensor: p.sensor,
        Normalized: p.rmseNorm,
        Raw: p.rmseRaw,
      })),
    [sunAngle],
  );

  const scaleData = useMemo(
    () =>
      [...scale]
        .sort((a, b) => a.scaleRatio - b.scaleRatio)
        .map((p) => ({
          sensor: p.sensor,
          scaleRatio: p.scaleRatio,
          inlierRatio: p.inlierRatio,
          rmse: p.rmse,
        })),
    [scale],
  );

  const multiModalData = useMemo(
    () =>
      multiModal.map((p) => ({
        sensor: p.sensor,
        inlierRatio: p.inlierRatio,
      })),
    [multiModal],
  );

  const activeScenario = SCENARIOS.find((s) => s.id === scenarioId);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Robustness &amp; Multi-Modal Analyses
          </h1>
          <DataOriginBadge origin="demo" />
        </div>
        <p className="text-muted-foreground max-w-3xl text-sm">
          Every metric below is computed from real in-browser CV pipeline runs
          on the bundled DEMO/SAMPLE DATA pairs — never fabricated. The pipeline
          detects features, matches descriptors, verifies geometry via RANSAC,
          and evaluates RMSE and inlier ratio on actual pixel data.
        </p>
      </div>

      {loading ? (
        <LoadingState
          label="Running robustness analyses on demo pairs…"
          rows={4}
        />
      ) : error ? (
        <ErrorState
          message={error}
          onRetry={() => void runAll()}
          retryLabel="Re-run analyses"
        />
      ) : (
        <>
          {/* Demo Scenario Selector */}
          <SectionCard
            title="Demo Scenario Selector"
            description="Pick a scenario to load the corresponding demo pair and run a focused registration analysis for quick SIH presentation."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {SCENARIOS.map((s) => {
                const Icon = s.icon;
                const active = s.id === scenarioId;
                return (
                  <button
                    key={s.id}
                    data-ocid={`analyses.scenario.${s.id}`}
                    type="button"
                    onClick={() => void runScenario(s.id)}
                    className={`flex flex-col gap-2 rounded-xl border p-4 text-left transition-colors focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none ${
                      active
                        ? "border-primary/60 bg-primary/10"
                        : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
                    }`}
                  >
                    <span className="text-primary flex size-9 items-center justify-center rounded-md border bg-primary/10">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="font-display text-sm font-semibold">
                      {s.label}
                    </span>
                    <span className="text-muted-foreground text-xs leading-relaxed">
                      {s.description}
                    </span>
                  </button>
                );
              })}
            </div>

            {scenarioLoading ? (
              <div className="mt-4">
                <LoadingState label="Running scenario registration…" rows={2} />
              </div>
            ) : scenarioError ? (
              <div className="mt-4">
                <ErrorState
                  message={scenarioError}
                  onRetry={() => void runScenario(scenarioId)}
                />
              </div>
            ) : scenarioResult && activeScenario ? (
              <div className="mt-4 flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/30 p-4">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="font-display text-sm font-semibold">
                      {scenarioResult.pair.metadata.name}
                    </span>
                    <span className="text-muted-foreground font-mono text-xs">
                      {scenarioResult.pair.metadata.sensor} · Sun{" "}
                      {scenarioResult.pair.metadata.sunAzimuthDeg}° az /{" "}
                      {scenarioResult.pair.metadata.sunElevationDeg}° el · Scale{" "}
                      {scenarioResult.pair.metadata.scaleRatio.toFixed(2)}
                    </span>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <StatusBadge
                      status={
                        inlierRatioOf(scenarioResult.result) >= 0.5
                          ? "pass"
                          : inlierRatioOf(scenarioResult.result) >= 0.3
                            ? "warning"
                            : "failed"
                      }
                      label="REGISTERED"
                    />
                    <PrototypeStatusBadge status="functional" />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <MetricCard
                    label="Inlier Ratio"
                    value={pct(inlierRatioOf(scenarioResult.result))}
                    explanation="Fraction of matched correspondences classified as inliers under the fitted transformation model. Higher indicates a more robust registration."
                    tone={
                      inlierRatioOf(scenarioResult.result) >= 0.5
                        ? "success"
                        : "warning"
                    }
                  />
                  <MetricCard
                    label="RMSE"
                    value={fmt(scenarioResult.result.metrics.rmse)}
                    unit="px"
                    explanation="Root-mean-square reprojection error over inliers. Lower indicates a tighter geometric fit."
                  />
                  <MetricCard
                    label="Inliers"
                    value={String(
                      Number(scenarioResult.result.metrics.inlierCount ?? 0n),
                    )}
                    explanation="Number of geometrically consistent correspondence points retained after RANSAC and spatial grid optimization."
                  />
                  <MetricCard
                    label="Spatial Coverage"
                    value={pct(scenarioResult.result.metrics.spatialCoverage)}
                    explanation="Fraction of the image area spanned by the inlier correspondence points. Higher indicates better spatial distribution."
                  />
                </div>

                <p className="text-muted-foreground text-xs">
                  Scenario: {activeScenario.label}. This run uses the{" "}
                  {scenarioResult.pair.metadata.sensor} demo pair with real
                  in-browser CV. All values are computed from the actual
                  pipeline output.
                </p>
              </div>
            ) : (
              <div className="mt-4">
                <EmptyState
                  icon={Gauge}
                  title="Select a demo scenario"
                  description="Choose a scenario above to load the corresponding demo pair and run a focused registration analysis."
                />
              </div>
            )}
          </SectionCard>

          {/* Sun-Angle Robustness */}
          <SectionCard
            title="Sun-Angle Robustness Analysis"
            description="Registration performance across demo pairs with different sun azimuth/elevation, compared with illumination normalization ON vs OFF."
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="flex flex-col gap-2">
                <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Inlier Ratio by Sun Angle
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sunInlierData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                      />
                      <XAxis
                        dataKey="sensor"
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                      />
                      <YAxis
                        domain={[0, 1]}
                        tickFormatter={(v: number) =>
                          `${(v * 100).toFixed(0)}%`
                        }
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                      />
                      <Tooltip
                        formatter={(value) => pct(Number(value))}
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="Normalized"
                        fill={CHART.primary}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="Raw"
                        fill={CHART.muted}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  RMSE by Sun Angle
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sunRmseData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                      />
                      <XAxis
                        dataKey="sensor"
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                      />
                      <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                      <Tooltip
                        formatter={(value) => fmt(Number(value))}
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="Normalized"
                        fill={CHART.success}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="Raw"
                        fill={CHART.destructive}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <DataTable
                data={sunAngle}
                rowKey={(r) => r.pairId}
                columns={[
                  {
                    header: "Sensor",
                    cell: (r) => (
                      <span className="font-mono text-xs">{r.sensor}</span>
                    ),
                  },
                  {
                    header: "Sun Az (°)",
                    cell: (r) => (
                      <span className="font-mono text-xs">
                        {r.sunAzimuthDeg}
                      </span>
                    ),
                    cellClassName: "text-right",
                  },
                  {
                    header: "Sun El (°)",
                    cell: (r) => (
                      <span className="font-mono text-xs">
                        {r.sunElevationDeg}
                      </span>
                    ),
                    cellClassName: "text-right",
                  },
                  {
                    header: "Inlier Ratio (Norm)",
                    cell: (r) => (
                      <span className="font-mono text-xs">
                        {pct(r.inlierRatioNorm)}
                      </span>
                    ),
                    cellClassName: "text-right",
                  },
                  {
                    header: "Inlier Ratio (Raw)",
                    cell: (r) => (
                      <span className="font-mono text-xs">
                        {pct(r.inlierRatioRaw)}
                      </span>
                    ),
                    cellClassName: "text-right",
                  },
                  {
                    header: "RMSE (Norm)",
                    cell: (r) => (
                      <span className="font-mono text-xs">
                        {fmt(r.rmseNorm)} px
                      </span>
                    ),
                    cellClassName: "text-right",
                  },
                  {
                    header: "RMSE (Raw)",
                    cell: (r) => (
                      <span className="font-mono text-xs">
                        {fmt(r.rmseRaw)} px
                      </span>
                    ),
                    cellClassName: "text-right",
                  },
                ]}
              />
            </div>
          </SectionCard>

          {/* Scale Robustness */}
          <SectionCard
            title="Scale Robustness Analysis"
            description="How inlier ratio and RMSE change as the scale ratio between source and reference increases, across the bundled demo pairs."
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="flex flex-col gap-2">
                <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Inlier Ratio vs Scale Ratio
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={scaleData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                      />
                      <XAxis
                        dataKey="scaleRatio"
                        type="number"
                        domain={["dataMin", "dataMax"]}
                        tickFormatter={(v: number) => v.toFixed(2)}
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                      />
                      <YAxis
                        domain={[0, 1]}
                        tickFormatter={(v: number) =>
                          `${(v * 100).toFixed(0)}%`
                        }
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                      />
                      <Tooltip
                        formatter={(value) => pct(Number(value))}
                        labelFormatter={(v: number) => `Scale ${v.toFixed(2)}`}
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="inlierRatio"
                        stroke={CHART.primary}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  RMSE vs Scale Ratio
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={scaleData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                      />
                      <XAxis
                        dataKey="scaleRatio"
                        type="number"
                        domain={["dataMin", "dataMax"]}
                        tickFormatter={(v: number) => v.toFixed(2)}
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                      />
                      <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                      <Tooltip
                        formatter={(value) => fmt(Number(value))}
                        labelFormatter={(v: number) => `Scale ${v.toFixed(2)}`}
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="rmse"
                        stroke={CHART.accent}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <DataTable
                data={scale}
                rowKey={(r) => r.sensor}
                columns={[
                  {
                    header: "Sensor",
                    cell: (r) => (
                      <span className="font-mono text-xs">{r.sensor}</span>
                    ),
                  },
                  {
                    header: "Scale Ratio",
                    cell: (r) => (
                      <span className="font-mono text-xs">
                        {r.scaleRatio.toFixed(3)}
                      </span>
                    ),
                    cellClassName: "text-right",
                  },
                  {
                    header: "Inlier Ratio",
                    cell: (r) => (
                      <span className="font-mono text-xs">
                        {pct(r.inlierRatio)}
                      </span>
                    ),
                    cellClassName: "text-right",
                  },
                  {
                    header: "RMSE",
                    cell: (r) => (
                      <span className="font-mono text-xs">
                        {fmt(r.rmse)} px
                      </span>
                    ),
                    cellClassName: "text-right",
                  },
                ]}
              />
            </div>
          </SectionCard>

          {/* Multi-Modal Analysis */}
          <SectionCard
            title="Multi-Modal Analysis"
            description="Per-sensor registration metrics across the supported multi-modal demo pairs (OHRC, TMC-2, IIRS, LRO NAC, SELENE). Each pair carries genuine multi-modal appearance variation between source and reference."
          >
            <div className="flex flex-col gap-2">
              <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                Inlier Ratio by Sensor
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={multiModalData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="sensor"
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                    />
                    <YAxis
                      domain={[0, 1]}
                      tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                    />
                    <Tooltip
                      formatter={(value) => pct(Number(value))}
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="inlierRatio"
                      fill={CHART.primary}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-4">
              <DataTable
                data={multiModal}
                rowKey={(r) => r.sensor}
                columns={[
                  {
                    header: "Sensor",
                    cell: (r) => (
                      <span className="font-mono text-xs">{r.sensor}</span>
                    ),
                  },
                  {
                    header: "Inlier Ratio",
                    cell: (r) => (
                      <span className="font-mono text-xs">
                        {pct(r.inlierRatio)}
                      </span>
                    ),
                    cellClassName: "text-right",
                  },
                  {
                    header: "RMSE",
                    cell: (r) => (
                      <span className="font-mono text-xs">
                        {fmt(r.rmse)} px
                      </span>
                    ),
                    cellClassName: "text-right",
                  },
                  {
                    header: "Inliers",
                    cell: (r) => (
                      <span className="font-mono text-xs">{r.inlierCount}</span>
                    ),
                    cellClassName: "text-right",
                  },
                  {
                    header: "Spatial Coverage",
                    cell: (r) => (
                      <span className="font-mono text-xs">
                        {pct(r.spatialCoverage)}
                      </span>
                    ),
                    cellClassName: "text-right",
                  },
                ]}
              />
            </div>
          </SectionCard>

          {/* Footer note */}
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Activity className="size-3.5" aria-hidden="true" />
            <span>
              All analyses run the full in-browser CV pipeline on bundled
              DEMO/SAMPLE DATA. Sub-pixel refinement is Prototype/Integration
              Pending in-browser; results are pixel-level.
            </span>
          </div>
        </>
      )}
    </div>
  );
}
