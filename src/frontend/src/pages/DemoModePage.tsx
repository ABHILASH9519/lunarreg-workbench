import {
  DataOriginBadge,
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  PipelineStageIndicator,
  ProcessingConsole,
  SectionCard,
  StatusBadge,
  type StatusTone,
} from "@/components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDemoPairs, useRegistration } from "@/hooks/useRegistration";
import { DEMO_DEFS } from "@/lib/demo/demo-pairs";
import type { DemoPair, JobMetrics } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoModeStore } from "@/stores/demo-mode-store";
import { useWorkflowStore } from "@/stores/workflow-store";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Database,
  FlaskConical,
  GitCompareArrows,
  Info,
  Layers,
  Play,
  Presentation,
  Rocket,
  RotateCcw,
  Satellite,
  Scaling,
  ScanEye,
  ScanSearch,
  Sun,
  Workflow,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * DemoModePage: the SIH Presentation/Demo Mode flow. A guided 3–5 minute
 * walkthrough — Overview → Scenario → Run Pipeline → Results — that runs the
 * real in-browser CV pipeline on bundled DEMO/SAMPLE pairs. Every metric is
 * computed from actual pixel data; nothing is fabricated. The full technical
 * workbench stays reachable via the Correspondence/Registration Viewers and
 * the "Full Workbench" exit.
 */

type DemoStep = 1 | 2 | 3 | 4;

const STEPS: Array<{ id: DemoStep; label: string }> = [
  { id: 1, label: "Overview" },
  { id: 2, label: "Scenario" },
  { id: 3, label: "Run Pipeline" },
  { id: 4, label: "Results" },
];

const FLOW: Array<{ title: string; description: string }> = [
  {
    title: "Welcome & Overview",
    description: "You are here — the guided presentation flow.",
  },
  {
    title: "Select a Demo Scenario",
    description: "Sun Angle, Scale, Viewpoint, or Multi-Modal variation.",
  },
  {
    title: "Run the CV Pipeline",
    description: "11-stage in-browser pipeline with a live processing console.",
  },
  {
    title: "Scientific Result Summary",
    description:
      "RMSE, inlier ratio, and transformation model from real computation.",
  },
  {
    title: "Deep-Dive Viewers",
    description: "Open the full Correspondence and Registration Viewers.",
  },
];

interface DemoScenario {
  pairId: string;
  title: string;
  variation: string;
  description: string;
  icon: typeof Sun;
}

const SCENARIOS: DemoScenario[] = [
  {
    pairId: "demo-ohrc-crater-field",
    title: "Sun Angle Variation",
    variation: "Illumination change",
    description:
      "The same terrain imaged under a shifted sun azimuth and elevation — the classic repeat-pass illumination problem.",
    icon: Sun,
  },
  {
    pairId: "demo-tmc2-mare-basalt",
    title: "Scale Variation",
    variation: "Resolution / altitude change",
    description:
      "Source and Reference captured at different ground sampling distances, requiring scale-aware matching.",
    icon: Scaling,
  },
  {
    pairId: "demo-lro-nac-highland",
    title: "Viewpoint Variation",
    variation: "Orbital geometry change",
    description:
      "Pronounced scale, rotation, and translation between views — the hardest geometric case for registration.",
    icon: ScanEye,
  },
  {
    pairId: "demo-iirs-mineral-spectral",
    title: "Multi-Modal Registration",
    variation: "Sensor / spectral contrast",
    description:
      "Strong illumination and contrast differences between the pair, stressing appearance-invariant matching.",
    icon: Layers,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPct(value: number | undefined | null): string {
  if (value === undefined || value === null) return "N/A";
  return `${(value * 100).toFixed(1)}%`;
}

function formatPx(value: number | undefined | null): string {
  if (value === undefined || value === null) return "N/A";
  return value.toFixed(3);
}

function formatMatrix(matrix: number[]): string {
  return matrix.map((v) => v.toFixed(3)).join("  ");
}

/** Derive a scientific PASS / WARNING / FAILED verdict from real metrics. */
function deriveStatus(
  result: {
    metrics: JobMetrics;
    issues: Array<{ level: "warning" | "error" }>;
  } | null,
): StatusTone | null {
  if (!result) return null;
  const { metrics, issues } = result;
  const inlierCount = Number(metrics.inlierCount ?? 0n);
  const outlierCount = Number(metrics.outlierCount ?? 0n);
  const total = inlierCount + outlierCount;
  const inlierRatio = total > 0 ? inlierCount / total : 0;

  if (inlierCount === 0 || inlierRatio < 0.3) return "failed";
  if (issues.some((i) => i.level === "error")) return "failed";
  if (metrics.rmse !== undefined && metrics.rmse > 3) return "warning";
  if (metrics.spatialCoverage !== undefined && metrics.spatialCoverage < 0.4) {
    return "warning";
  }
  if (issues.some((i) => i.level === "warning")) return "warning";
  return "pass";
}

/** Real variation stats for a scenario, read from the bundled pair definition. */
function scenarioStats(
  pairId: string,
): Array<{ label: string; value: string }> {
  const def = DEMO_DEFS.find((d) => d.metadata.id === pairId);
  if (!def) return [];
  const azShift = def.appearance.sunAzimuthShift;
  return [
    { label: "Scale", value: `${def.metadata.scaleRatio.toFixed(2)}×` },
    { label: "Sun Az", value: `${def.metadata.sunAzimuthDeg}°` },
    { label: "Sun El", value: `${def.metadata.sunElevationDeg}°` },
    { label: "Az Shift", value: `${azShift > 0 ? "+" : ""}${azShift}°` },
  ];
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DemoModePage() {
  const navigate = useNavigate();
  const images = useWorkflowStore((s) => s.images);
  const config = useWorkflowStore((s) => s.config);
  const isRunning = useWorkflowStore((s) => s.isRunning);
  const currentStage = useWorkflowStore((s) => s.currentStage);
  const progress = useWorkflowStore((s) => s.progress);
  const log = useWorkflowStore((s) => s.log);
  const issues = useWorkflowStore((s) => s.issues);
  const result = useWorkflowStore((s) => s.result);
  const error = useWorkflowStore((s) => s.error);
  const setImages = useWorkflowStore((s) => s.setImages);
  const reset = useWorkflowStore((s) => s.reset);
  const setActive = useDemoModeStore((s) => s.setActive);

  const { run, canRun } = useRegistration();
  const {
    pairs,
    selectedPair,
    selectedPairId,
    setSelectedPairId,
    loadPairs,
    loading,
  } = useDemoPairs();

  const [step, setStep] = useState<DemoStep>(1);

  // Enter demo mode and load the bundled pairs on mount.
  useEffect(() => {
    setActive(true);
    void loadPairs();
  }, [setActive, loadPairs]);

  const applyPair = useCallback(
    (pair: DemoPair) => {
      reset();
      setImages({
        sourceDataUrl: pair.sourceDataUrl,
        referenceDataUrl: pair.referenceDataUrl,
        sourceName: `${pair.metadata.name} — Source (Moving)`,
        referenceName: `${pair.metadata.name} — Reference (Fixed)`,
        sourceIsDemo: true,
        referenceIsDemo: true,
      });
      setSelectedPairId(pair.metadata.id);
    },
    [reset, setImages, setSelectedPairId],
  );

  const selectScenario = useCallback(
    (pairId: string) => {
      const pair = pairs.find((p) => p.metadata.id === pairId);
      if (!pair) return;
      applyPair(pair);
      setStep(3);
    },
    [pairs, applyPair],
  );

  const handleRun = useCallback(() => {
    void run();
  }, [run]);

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  const exitDemo = useCallback(() => {
    setActive(false);
    void navigate({ to: "/" });
  }, [setActive, navigate]);

  const status = useMemo(() => deriveStatus(result), [result]);

  const inlierRatio = useMemo(() => {
    if (!result) return null;
    const inliers = Number(result.metrics.inlierCount ?? 0n);
    const outliers = Number(result.metrics.outlierCount ?? 0n);
    const total = inliers + outliers;
    return total > 0 ? inliers / total : 0;
  }, [result]);

  const hasPair = !!images.sourceDataUrl && !!images.referenceDataUrl;

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="bg-gradient-primary flex size-9 items-center justify-center rounded-lg text-primary-foreground">
              <Presentation className="size-5" aria-hidden="true" />
            </span>
            <div className="flex flex-col">
              <h1 className="font-display text-xl font-semibold tracking-tight">
                SIH Presentation Mode
              </h1>
              <p className="text-muted-foreground text-sm">
                Guided 3–5 minute demo flow
              </p>
            </div>
          </div>
          <p className="text-muted-foreground max-w-3xl text-sm">
            A guided walkthrough of the LunarReg registration pipeline for
            judging. Every result is computed in-browser from real pixel data —
            never fabricated.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DataOriginBadge origin="demo" />
          <Button
            data-ocid="demo.full_workbench_button"
            variant="outline"
            onClick={exitDemo}
            className="gap-1.5"
          >
            <Workflow className="size-4" aria-hidden="true" />
            Full Workbench
          </Button>
        </div>
      </div>

      {/* Step navigation */}
      <nav
        data-ocid="demo.stepper"
        aria-label="Presentation steps"
        className="flex items-center gap-1 overflow-x-auto rounded-xl border bg-card p-2 shadow-subtle"
      >
        {STEPS.map((s, index) => {
          const current = step === s.id;
          return (
            <div key={s.id} className="flex min-w-0 flex-1 items-center gap-1">
              {index > 0 && (
                <span
                  className={cn(
                    "h-px flex-1",
                    s.id <= step ? "bg-primary/60" : "bg-border",
                  )}
                  aria-hidden="true"
                />
              )}
              <button
                type="button"
                data-ocid={`demo.step.${s.id}`}
                onClick={() => setStep(s.id)}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "flex min-w-0 items-center gap-2 rounded-lg px-3 py-2 transition-colors focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                  current
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] font-semibold",
                    current
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-muted",
                  )}
                >
                  {s.id}
                </span>
                <span className="font-display truncate text-xs font-medium">
                  {s.label}
                </span>
              </button>
            </div>
          );
        })}
      </nav>

      {step === 1 && <OverviewStep onBegin={() => setStep(2)} />}

      {step === 2 && (
        <ScenarioStep
          loading={loading}
          pairs={pairs}
          selectedPairId={selectedPairId}
          onSelect={selectScenario}
          onLoadPairs={() => void loadPairs()}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <RunStep
          images={images}
          isRunning={isRunning}
          currentStage={currentStage}
          progress={progress}
          log={log}
          issues={issues}
          result={result}
          error={error}
          canRun={canRun}
          hasPair={hasPair}
          selectedPair={selectedPair}
          onRun={handleRun}
          onReset={handleReset}
          onBack={() => setStep(2)}
          onPickScenario={() => setStep(2)}
          onViewResults={() => setStep(4)}
        />
      )}

      {step === 4 && (
        <ResultsStep
          result={result}
          status={status}
          inlierRatio={inlierRatio}
          config={config}
          selectedPair={selectedPair}
          onRunPipeline={() => setStep(3)}
          onRunAnother={() => setStep(2)}
          onExit={exitDemo}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Welcome / overview slide
// ---------------------------------------------------------------------------

interface OverviewStepProps {
  onBegin: () => void;
}

function OverviewStep({ onBegin }: OverviewStepProps) {
  return (
    <section
      data-ocid="demo.overview"
      className="bg-grid scanline relative overflow-hidden rounded-2xl border bg-card p-6 shadow-subtle md:p-10"
    >
      <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-16 size-72 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-2xl flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="bg-gradient-primary flex size-10 items-center justify-center rounded-lg text-primary-foreground">
              <Satellite className="size-5" aria-hidden="true" />
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
              SIH · Live Demonstration
            </span>
          </div>

          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            Lunar Image Registration{" "}
            <span className="text-gradient-gold">Live Demo</span>
          </h1>

          <p className="max-w-xl text-muted-foreground text-sm leading-relaxed md:text-base">
            Register lunar surface imagery — Source (Moving) against Reference
            (Fixed) — through an in-browser feature-based pipeline. Detect
            correspondence points, fit a transformation model, and evaluate
            reprojection error with full scientific transparency.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <DataOriginBadge origin="demo" />
            <span className="text-muted-foreground font-mono text-[11px]">
              Synthetic DEMO/SAMPLE DATA — not official ISRO data
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:items-end">
          <Button
            data-ocid="demo.begin_button"
            size="lg"
            onClick={onBegin}
            className="gap-2 text-base"
          >
            <Rocket className="size-5" aria-hidden="true" />
            Begin Presentation
          </Button>
          <p className="text-muted-foreground font-mono text-[11px]">
            Guided 3–5 minute flow · full workbench access preserved
          </p>
        </div>
      </div>

      {/* Flow overview */}
      <div className="relative mt-8 grid gap-3 md:grid-cols-5">
        {FLOW.map((item, index) => (
          <div
            key={item.title}
            data-ocid={`demo.flow.${index}`}
            className="flex flex-col gap-2 rounded-xl border bg-background p-4"
          >
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-primary">
              <CheckCircle2 className="size-3" aria-hidden="true" />
              Step {index + 1}
            </span>
            <span className="font-display text-sm font-semibold">
              {item.title}
            </span>
            <span className="text-muted-foreground text-xs">
              {item.description}
            </span>
          </div>
        ))}
      </div>

      {/* Integrity note */}
      <div className="relative mt-6 flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-xs text-warning">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          Scientific integrity: all imagery is synthetic DEMO/SAMPLE DATA and is
          never represented as official Chandrayaan-2/ISRO data. All metrics
          (RMSE, inlier ratio, spatial coverage) are computed in-browser from
          real pixel data — never fabricated.
        </p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Scenario selection
// ---------------------------------------------------------------------------

interface ScenarioStepProps {
  loading: boolean;
  pairs: DemoPair[];
  selectedPairId: string | null;
  onSelect: (pairId: string) => void;
  onLoadPairs: () => void;
  onBack: () => void;
}

function ScenarioStep({
  loading,
  pairs,
  selectedPairId,
  onSelect,
  onLoadPairs,
  onBack,
}: ScenarioStepProps) {
  return (
    <SectionCard
      title="Select a Demo Scenario"
      description="Each scenario loads a bundled DEMO/SAMPLE pair engineered for a specific registration challenge."
      action={
        <Badge
          data-ocid="demo.scenario_badge"
          className="border-border bg-muted text-muted-foreground font-mono text-[10px] uppercase tracking-widest"
        >
          <Layers className="size-3" aria-hidden="true" />
          Step 2 of 4
        </Badge>
      }
    >
      {loading ? (
        <LoadingState label="Generating demo pairs…" rows={3} />
      ) : pairs.length === 0 ? (
        <EmptyState
          icon={Database}
          title="No demo pairs available"
          description="Bundled synthetic lunar sample pairs could not be generated."
          actionLabel="Retry"
          onAction={onLoadPairs}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-3 md:grid-cols-2">
            {SCENARIOS.map((scenario, index) => {
              const Icon = scenario.icon;
              const active = selectedPairId === scenario.pairId;
              return (
                <button
                  key={scenario.pairId}
                  type="button"
                  data-ocid={`demo.scenario.${index}`}
                  onClick={() => onSelect(scenario.pairId)}
                  className={cn(
                    "group flex flex-col gap-3 rounded-xl border bg-card p-4 text-left shadow-subtle transition-all hover:border-primary/50 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                    active && "border-primary ring-ring ring-2",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-primary/10 text-primary">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <DataOriginBadge origin="demo" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-display text-base font-semibold">
                      {scenario.title}
                    </span>
                    <span className="text-muted-foreground font-mono text-[11px] uppercase tracking-wider">
                      {scenario.variation}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {scenario.description}
                  </p>
                  <div className="grid grid-cols-4 gap-2 rounded-lg border bg-muted/30 p-2 font-mono text-[11px] text-muted-foreground">
                    {scenarioStats(scenario.pairId).map((stat) => (
                      <div key={stat.label} className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-wider">
                          {stat.label}
                        </span>
                        <span className="text-foreground">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                  <span className="mt-auto flex items-center gap-1.5 text-xs font-medium text-primary">
                    Load &amp; Run
                    <ArrowRight
                      className="size-3.5 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </button>
              );
            })}
          </div>

          {/* All bundled pairs */}
          <div className="flex flex-col gap-2">
            <h3 className="font-display text-sm font-semibold">
              All Bundled DEMO Pairs
            </h3>
            <ul data-ocid="demo.pair_list" className="flex flex-col gap-2">
              {pairs.map((pair, index) => (
                <li key={pair.metadata.id}>
                  <button
                    type="button"
                    data-ocid={`demo.pair.${index}`}
                    onClick={() => onSelect(pair.metadata.id)}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-lg border bg-card px-3 py-3 text-left shadow-subtle transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                      selectedPairId === pair.metadata.id &&
                        "border-primary ring-ring ring-2",
                    )}
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="font-display truncate text-sm font-medium">
                        {pair.metadata.name}
                      </span>
                      <span className="text-muted-foreground font-mono text-[11px] uppercase tracking-wider">
                        {pair.metadata.sensor} · Scale{" "}
                        {pair.metadata.scaleRatio.toFixed(2)}× · Sun{" "}
                        {pair.metadata.sunAzimuthDeg}° /{" "}
                        {pair.metadata.sunElevationDeg}°
                      </span>
                    </span>
                    <ArrowRight
                      className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-2">
            <Button
              data-ocid="demo.back_to_overview_button"
              variant="outline"
              onClick={onBack}
              className="gap-1.5"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to Overview
            </Button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Run pipeline
// ---------------------------------------------------------------------------

interface RunStepProps {
  images: {
    sourceDataUrl: string | null;
    referenceDataUrl: string | null;
    sourceName: string | null;
    referenceName: string | null;
  };
  isRunning: boolean;
  currentStage: ReturnType<typeof useWorkflowStore.getState>["currentStage"];
  progress: number;
  log: ReturnType<typeof useWorkflowStore.getState>["log"];
  issues: ReturnType<typeof useWorkflowStore.getState>["issues"];
  result: ReturnType<typeof useWorkflowStore.getState>["result"];
  error: string | null;
  canRun: boolean;
  hasPair: boolean;
  selectedPair: DemoPair | null;
  onRun: () => void;
  onReset: () => void;
  onBack: () => void;
  onPickScenario: () => void;
  onViewResults: () => void;
}

function RunStep({
  images,
  isRunning,
  currentStage,
  progress,
  log,
  issues,
  result,
  error,
  canRun,
  hasPair,
  selectedPair,
  onRun,
  onReset,
  onBack,
  onPickScenario,
  onViewResults,
}: RunStepProps) {
  return (
    <SectionCard
      title="Run the CV Pipeline"
      description="Execute the 11-stage registration pipeline on the selected DEMO/SAMPLE pair."
      action={
        <Badge
          data-ocid="demo.run_badge"
          className="border-border bg-muted text-muted-foreground font-mono text-[10px] uppercase tracking-widest"
        >
          <Play className="size-3" aria-hidden="true" />
          Step 3 of 4
        </Badge>
      }
    >
      {!hasPair ? (
        <EmptyState
          icon={Database}
          title="No scenario selected"
          description="Choose a demo scenario to load its bundled DEMO/SAMPLE pair into the pipeline."
          actionLabel="Select Scenario"
          onAction={onPickScenario}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {/* Pair preview */}
          <div className="grid gap-3 md:grid-cols-2">
            <PairPreview
              label="Source (Moving)"
              dataUrl={images.sourceDataUrl}
              name={images.sourceName}
            />
            <PairPreview
              label="Reference (Fixed)"
              dataUrl={images.referenceDataUrl}
              name={images.referenceName}
            />
          </div>

          {selectedPair && (
            <p className="text-muted-foreground text-xs">
              {selectedPair.metadata.name} · {selectedPair.metadata.sensor} —{" "}
              {selectedPair.metadata.description}
            </p>
          )}

          <PipelineStageIndicator
            currentStage={currentStage}
            isRunning={isRunning}
            data-ocid="demo.pipeline_stages"
          />

          <ProcessingConsole
            currentStage={currentStage}
            progress={progress}
            elapsedMs={result?.elapsedMs ?? 0}
            log={log}
            issues={issues}
            isRunning={isRunning}
            data-ocid="demo.console"
          />

          {error && (
            <ErrorState
              title="Registration failed"
              message={error}
              onRetry={onRun}
              retryLabel="Retry run"
            />
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              data-ocid="demo.run_button"
              onClick={onRun}
              disabled={!canRun}
              size="lg"
              className="gap-2"
            >
              {isRunning ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                  Running…
                </span>
              ) : (
                <>
                  <Play className="size-4" aria-hidden="true" />
                  Run Registration
                </>
              )}
            </Button>
            <Button
              data-ocid="demo.reset_button"
              variant="outline"
              onClick={onReset}
              disabled={isRunning}
              className="gap-2"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Reset
            </Button>
            <Button
              data-ocid="demo.back_to_scenarios_button"
              variant="outline"
              onClick={onBack}
              className="gap-1.5"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to Scenarios
            </Button>
            {result && (
              <Button
                data-ocid="demo.view_results_button"
                onClick={onViewResults}
                size="lg"
                className="ml-auto gap-2"
              >
                View Scientific Results
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Scientific results
// ---------------------------------------------------------------------------

interface ResultsStepProps {
  result: ReturnType<typeof useWorkflowStore.getState>["result"];
  status: StatusTone | null;
  inlierRatio: number | null;
  config: ReturnType<typeof useWorkflowStore.getState>["config"];
  selectedPair: DemoPair | null;
  onRunPipeline: () => void;
  onRunAnother: () => void;
  onExit: () => void;
}

function ResultsStep({
  result,
  status,
  inlierRatio,
  config,
  selectedPair,
  onRunPipeline,
  onRunAnother,
  onExit,
}: ResultsStepProps) {
  return (
    <SectionCard
      title="Scientific Result Summary"
      description="Registration summary, key metrics, and scientific explainability — all computed from the real pipeline run."
      action={
        <Badge
          data-ocid="demo.results_badge"
          className="border-border bg-muted text-muted-foreground font-mono text-[10px] uppercase tracking-widest"
        >
          <FlaskConical className="size-3" aria-hidden="true" />
          Step 4 of 4
        </Badge>
      }
    >
      {!result ? (
        <EmptyState
          icon={FlaskConical}
          title="No results yet"
          description="Run the pipeline to compute a scientific result summary from real pixel data."
          actionLabel="Run Pipeline"
          onAction={onRunPipeline}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Verdict + deep-dive links */}
          <div className="flex flex-col gap-4 rounded-xl border bg-muted/30 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              {status && <StatusBadge status={status} />}
              <div className="flex flex-col">
                <span className="font-display text-sm font-semibold">
                  Scientific Result Summary
                </span>
                <span className="text-muted-foreground text-xs">
                  Verdict derived from real correspondence quality, RMSE, inlier
                  ratio, and spatial coverage.
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                data-ocid="demo.open_correspondence"
                variant="outline"
                size="sm"
                className="gap-1.5"
                asChild
              >
                <Link to="/correspondence">
                  <ScanSearch className="size-4" aria-hidden="true" />
                  Correspondence Viewer
                </Link>
              </Button>
              <Button
                data-ocid="demo.open_registration"
                variant="outline"
                size="sm"
                className="gap-1.5"
                asChild
              >
                <Link to="/registration">
                  <GitCompareArrows className="size-4" aria-hidden="true" />
                  Registration Viewer
                </Link>
              </Button>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              label="RMSE"
              value={formatPx(result.metrics.rmse)}
              unit="px"
              tone={
                result.metrics.rmse === undefined
                  ? "default"
                  : result.metrics.rmse > 3
                    ? "warning"
                    : "success"
              }
              explanation="Root-mean-square reprojection error over inliers. Computed as the square root of the mean of squared distances between each inlier's reference point and its point reprojected through the fitted model. Lower is better."
            />
            <MetricCard
              label="Inlier Ratio"
              value={formatPct(inlierRatio)}
              unit="%"
              tone={
                inlierRatio === null
                  ? "default"
                  : inlierRatio < 0.3
                    ? "destructive"
                    : inlierRatio < 0.6
                      ? "warning"
                      : "success"
              }
              explanation="Fraction of correspondences accepted as inliers by RANSAC under the fitted model. Computed as inlier count divided by total correspondences. Higher indicates stronger geometric consistency."
            />
            <MetricCard
              label="Spatial Coverage"
              value={formatPct(result.metrics.spatialCoverage)}
              unit="%"
              tone={
                result.metrics.spatialCoverage === undefined
                  ? "default"
                  : result.metrics.spatialCoverage < 0.4
                    ? "warning"
                    : "success"
              }
              explanation="Fraction of the image area spanned by the inlier source points, estimated via an 8×8 grid occupancy count. Higher means matches are spread across the scene rather than concentrated in one region."
            />
            <MetricCard
              label="Transformation Model"
              value={result.recommendedModel}
              explanation="The transformation model fitted to the correspondences. Recommended model is selected from actual geometric-consistency metrics across Similarity, Affine, and Homography candidates."
            />
            <MetricCard
              label="Correspondence Points"
              value={`${result.metrics.inlierCount?.toString() ?? "N/A"} / ${result.metrics.outlierCount?.toString() ?? "N/A"}`}
              explanation="Inliers / outliers after RANSAC geometric verification and spatial-grid optimization. Inliers are consistent with the fitted model; outliers are rejected."
            />
            <MetricCard
              label="Pipeline Time"
              value={(result.elapsedMs / 1000).toFixed(1)}
              unit="s"
              explanation="Wall-clock time for the full in-browser pipeline run: preprocessing, multi-scale feature extraction, matching, geometric verification, spatial optimization, and evaluation."
            />
          </div>

          {/* Registered output preview */}
          {result.registeredImageDataUrl && (
            <div className="flex flex-col gap-2">
              <h3 className="font-display text-sm font-semibold">
                Registered Output
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                <PreviewImage
                  src={result.registeredImageDataUrl}
                  label="Registered (warped source)"
                />
                <PreviewImage
                  src={result.overlayImageDataUrl}
                  label="Overlay (warped + reference)"
                />
              </div>
            </div>
          )}

          {/* Explainability panel */}
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <Info className="text-primary size-4" aria-hidden="true" />
              <h3 className="font-display text-sm font-semibold">
                Scientific Explainability Panel
              </h3>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <ExplainRow
                label="Detector used"
                value={config.detector.detector.toUpperCase()}
                detail={`FAST-style corner detection with Harris response scoring and a ${config.detector.maxFeatures.toString()} keypoint budget.`}
              />
              <ExplainRow
                label="Transformation model"
                value={result.recommendedModel}
                detail="Chosen from actual inlier ratio and reprojection error across Similarity, Affine, and Homography candidates (Occam-preferring)."
              />
              <ExplainRow
                label="Transformation matrix"
                value={formatMatrix(result.transformationMatrix)}
                detail="Row-major 3×3 matrix fitted to the inlier correspondences."
              />
              <ExplainRow
                label="Matches accepted / rejected"
                value={`${result.metrics.inlierCount?.toString() ?? "N/A"} / ${result.metrics.outlierCount?.toString() ?? "N/A"}`}
                detail="Inliers are correspondences consistent with the fitted model under RANSAC; outliers are rejected as geometric inconsistencies."
              />
              <ExplainRow
                label="RANSAC threshold"
                value={`${config.thresholds.ransacReprojThreshold.toFixed(1)} px`}
                detail="A correspondence is an inlier when its reprojection error through the fitted model is below the RANSAC reprojection threshold."
              />
              <ExplainRow
                label="RMSE calculation"
                value={formatPx(result.metrics.rmse)}
                detail="Root-mean-square of per-inlier reprojection errors (pixels). Lower indicates a tighter geometric fit."
              />
              <ExplainRow
                label="Inlier ratio calculation"
                value={formatPct(inlierRatio)}
                detail="Inlier count divided by total correspondences after spatial-grid optimization."
              />
              <ExplainRow
                label="Spatial coverage calculation"
                value={formatPct(result.metrics.spatialCoverage)}
                detail="Fraction of an 8×8 grid of the source image occupied by inlier points."
              />
              <ExplainRow
                label="Sub-pixel refinement"
                value="Prototype/Integration Pending"
                detail="Sub-pixel refinement is not available in-browser; results are pixel-level. See the warning in the processing console."
                pending
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              data-ocid="demo.run_another_button"
              variant="outline"
              onClick={onRunAnother}
              className="gap-1.5"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Run Another Scenario
            </Button>
            {selectedPair && (
              <span className="text-muted-foreground font-mono text-[11px]">
                {selectedPair.metadata.name} · DEMO/SAMPLE DATA
              </span>
            )}
            <Button
              data-ocid="demo.exit_workbench_button"
              onClick={onExit}
              className="ml-auto gap-1.5"
            >
              <Workflow className="size-4" aria-hidden="true" />
              Full Workbench
            </Button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Local helper components
// ---------------------------------------------------------------------------

interface PairPreviewProps {
  label: string;
  dataUrl: string | null;
  name: string | null;
}

function PairPreview({ label, dataUrl, name }: PairPreviewProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-sm font-semibold">{label}</span>
        <DataOriginBadge origin="demo" />
      </div>
      {dataUrl ? (
        <div className="flex flex-col gap-2">
          <img
            src={dataUrl}
            alt={`${label} preview`}
            className="aspect-square w-full rounded-md border object-cover"
          />
          <span className="text-muted-foreground min-w-0 truncate text-xs">
            {name}
          </span>
        </div>
      ) : (
        <div className="flex aspect-square w-full items-center justify-center rounded-md border border-dashed bg-muted/30 text-muted-foreground text-sm">
          N/A
        </div>
      )}
    </div>
  );
}

interface PreviewImageProps {
  src: string | null;
  label: string;
}

function PreviewImage({ src, label }: PreviewImageProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      {src ? (
        <img
          src={src}
          alt={label}
          className="aspect-video w-full rounded-md border object-cover"
        />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-md border border-dashed bg-muted/30 text-muted-foreground text-sm">
          N/A
        </div>
      )}
    </div>
  );
}

interface ExplainRowProps {
  label: string;
  value: string;
  detail: string;
  pending?: boolean;
}

function ExplainRow({ label, value, detail, pending }: ExplainRowProps) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
          {label}
        </span>
        {pending ? (
          <Badge
            className="border-warning/40 bg-warning/15 text-warning font-mono text-[10px] uppercase tracking-wider"
            data-ocid="demo.pending_badge"
          >
            Prototype/Integration Pending
          </Badge>
        ) : (
          <span className="font-mono text-xs font-semibold text-foreground">
            {value}
          </span>
        )}
      </div>
      <p className="text-muted-foreground text-xs">{detail}</p>
    </div>
  );
}
