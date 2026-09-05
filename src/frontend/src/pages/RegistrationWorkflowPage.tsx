import { FeatureDetector, TransformationModel } from "@/backend";
import {
  DataOriginBadge,
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  PipelineStageIndicator,
  ProcessingConsole,
  PrototypeStatusBadge,
  SectionCard,
  StatusBadge,
  type StatusTone,
} from "@/components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreateJob, useUpdateJobResult } from "@/hooks/useJobs";
import {
  useDemoPairs,
  useImageLoader,
  useRegistration,
} from "@/hooks/useRegistration";
import type {
  ClassifiedCorrespondence,
  CorrespondencePoint,
  DemoPair,
  InputImage,
  JobMetrics,
  JobResult,
  PreprocessingSettings,
  ReproConfig,
  SpatialGridSize,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/stores/workflow-store";
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Database,
  FileImage,
  FlaskConical,
  GitCompareArrows,
  HardDrive,
  Info,
  Layers,
  Play,
  RotateCcw,
  Save,
  ScanSearch,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Upload,
  Workflow,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type ModelChoice = TransformationModel | "recommended";

const DETECTOR_OPTIONS: Array<{ value: FeatureDetector; label: string }> = [
  { value: FeatureDetector.orb, label: "ORB" },
  { value: FeatureDetector.sift, label: "SIFT" },
  { value: FeatureDetector.brisk, label: "BRISK" },
  { value: FeatureDetector.kaze, label: "KAZE" },
];

const MODEL_OPTIONS: Array<{ value: ModelChoice; label: string }> = [
  { value: "recommended", label: "Recommended Model" },
  { value: TransformationModel.similarity, label: "Similarity" },
  { value: TransformationModel.affine, label: "Affine" },
  { value: TransformationModel.homography, label: "Homography" },
];

const GRID_OPTIONS: SpatialGridSize[] = [4, 8, 16];

const ACCEPTED_TYPES = ["image/tiff", "image/png", "image/jpeg", "image/tif"];

function formatPct(value: number | undefined | null): string {
  if (value === undefined || value === null) return "N/A";
  return `${(value * 100).toFixed(1)}%`;
}

function formatPx(value: number | undefined | null): string {
  if (value === undefined || value === null) return "N/A";
  return value.toFixed(3);
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

export default function RegistrationWorkflowPage() {
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
  const setConfig = useWorkflowStore((s) => s.setConfig);
  const setSpatialGrid = useWorkflowStore((s) => s.setSpatialGrid);
  const reset = useWorkflowStore((s) => s.reset);

  const { run, canRun } = useRegistration();
  const { pairs, selectedPairId, setSelectedPairId, loadPairs, loading } =
    useDemoPairs();
  const createJob = useCreateJob();
  const updateJobResult = useUpdateJobResult();

  const [tab, setTab] = useState<"demo" | "user">("demo");
  const [sourceDims, setSourceDims] = useState<{ w: number; h: number } | null>(
    null,
  );
  const [referenceDims, setReferenceDims] = useState<{
    w: number;
    h: number;
  } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Config local state (synced to store).
  const [grayscale, setGrayscale] = useState(true);
  const [denoise, setDenoise] = useState(true);
  const [contrastEnhancement, setContrastEnhancement] = useState(true);
  const [detector, setDetector] = useState<FeatureDetector>(
    FeatureDetector.orb,
  );
  const [maxFeatures, setMaxFeatures] = useState(800);
  const [ratioThreshold, setRatioThreshold] = useState(0.75);
  const [maxMatches, setMaxMatches] = useState(500);
  const [modelChoice, setModelChoice] = useState<ModelChoice>("recommended");
  const [gridChoice, setGridChoice] = useState<SpatialGridSize>(8);

  const sourceInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  // Load demo pairs on mount.
  useEffect(() => {
    void loadPairs();
  }, [loadPairs]);

  // Sync local config to the workflow store whenever any field changes.
  useEffect(() => {
    const current = useWorkflowStore.getState().config;
    const preprocessing: PreprocessingSettings = {
      grayscale,
      denoise,
      contrastEnhancement,
    };
    const next: ReproConfig = {
      ...current,
      preprocessing,
      detector: {
        ...current.detector,
        detector,
        maxFeatures: BigInt(maxFeatures),
      },
      matching: {
        ...current.matching,
        ratioThreshold,
        maxMatches: BigInt(maxMatches),
      },
      model: modelChoice === "recommended" ? current.model : modelChoice,
    };
    setConfig(next);
  }, [
    grayscale,
    denoise,
    contrastEnhancement,
    detector,
    maxFeatures,
    ratioThreshold,
    maxMatches,
    modelChoice,
    setConfig,
  ]);

  // Apply a demo pair to the workflow store.
  const applyDemoPair = useCallback(
    (pair: DemoPair) => {
      setImages({
        sourceDataUrl: pair.sourceDataUrl,
        referenceDataUrl: pair.referenceDataUrl,
        sourceName: `${pair.metadata.name} (Source)`,
        referenceName: `${pair.metadata.name} (Reference)`,
        sourceIsDemo: true,
        referenceIsDemo: true,
      });
      setSourceDims({ w: pair.width, h: pair.height });
      setReferenceDims({ w: pair.width, h: pair.height });
      setUploadError(null);
    },
    [setImages],
  );

  // Read a user file into a data URL with real progress.
  const readFile = useCallback(
    (file: File, role: "source" | "reference") => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setUploadError(
          `Unsupported format "${file.type || "unknown"}". Use TIFF, GeoTIFF, PNG, or JPG.`,
        );
        return;
      }
      setUploadError(null);
      setUploadProgress(0);
      const reader = new FileReader();
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.onload = () => {
          if (role === "source") {
            setImages({
              sourceDataUrl: dataUrl,
              sourceName: file.name,
              sourceIsDemo: false,
            });
            setSourceDims({ w: img.width, h: img.height });
          } else {
            setImages({
              referenceDataUrl: dataUrl,
              referenceName: file.name,
              referenceIsDemo: false,
            });
            setReferenceDims({ w: img.width, h: img.height });
          }
          setUploadProgress(null);
        };
        img.onerror = () => {
          setUploadProgress(null);
          setUploadError("Could not decode the selected image.");
        };
        img.src = dataUrl;
      };
      reader.onerror = () => {
        setUploadProgress(null);
        setUploadError("Failed to read the selected file.");
      };
      reader.readAsDataURL(file);
    },
    [setImages],
  );

  const handleRun = useCallback(() => {
    void run();
  }, [run]);

  const handleReset = useCallback(() => {
    reset();
    setSourceDims(null);
    setReferenceDims(null);
    setUploadError(null);
  }, [reset]);

  const status = useMemo(() => deriveStatus(result), [result]);

  const inlierRatio = useMemo(() => {
    if (!result) return null;
    const inliers = Number(result.metrics.inlierCount ?? 0n);
    const outliers = Number(result.metrics.outlierCount ?? 0n);
    const total = inliers + outliers;
    return total > 0 ? inliers / total : 0;
  }, [result]);

  const saveJob = useCallback(() => {
    if (!result || !images.sourceDataUrl || !images.referenceDataUrl) return;
    setSaving(true);
    const source: InputImage = {
      ref: images.sourceDataUrl,
      metadata: {
        name: images.sourceName ?? "source",
        format: "image/png",
        width: BigInt(sourceDims?.w ?? 512),
        height: BigInt(sourceDims?.h ?? 512),
        sizeBytes: BigInt(images.sourceDataUrl.length),
      },
    };
    const reference: InputImage = {
      ref: images.referenceDataUrl,
      metadata: {
        name: images.referenceName ?? "reference",
        format: "image/png",
        width: BigInt(referenceDims?.w ?? 512),
        height: BigInt(referenceDims?.h ?? 512),
        sizeBytes: BigInt(images.referenceDataUrl.length),
      },
    };
    createJob.mutate(
      { source, reference, config },
      {
        onSuccess: (jobId) => {
          const correspondences: CorrespondencePoint[] =
            result.correspondences.map((c) => ({
              source: { x: c.source.x, y: c.source.y },
              reference: { x: c.reference.x, y: c.reference.y },
            }));
          const jobResult: JobResult = {
            report: `Registration completed with ${result.recommendedModel} model. RMSE ${formatPx(result.metrics.rmse)} px, inlier ratio ${formatPct(inlierRatio)}.`,
            metrics: result.metrics,
            registeredOutput: result.registeredImageDataUrl ?? "",
            transformationMatrix: result.transformationMatrix,
            correspondences,
          };
          updateJobResult.mutate(
            { jobId, result: jobResult },
            {
              onSuccess: () => {
                toast.success("Job saved to history");
                setSaving(false);
              },
              onError: (err) => {
                toast.error(
                  `Saved job but failed to attach result: ${err.message}`,
                );
                setSaving(false);
              },
            },
          );
        },
        onError: (err) => {
          toast.error(`Failed to save job: ${err.message}`);
          setSaving(false);
        },
      },
    );
  }, [
    result,
    images,
    sourceDims,
    referenceDims,
    config,
    createJob,
    updateJobResult,
    inlierRatio,
  ]);

  const hasImages = !!images.sourceDataUrl && !!images.referenceDataUrl;

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="bg-gradient-primary flex size-9 items-center justify-center rounded-lg text-primary-foreground">
            <Workflow className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col">
            <h1 className="font-display text-xl font-semibold tracking-tight">
              Registration Workflow
            </h1>
            <p className="text-muted-foreground text-sm">
              Multi-stage lunar image registration pipeline
            </p>
          </div>
        </div>
        <p className="text-muted-foreground max-w-3xl text-sm">
          Select a Source (Moving) and Reference (Fixed) image pair, configure
          the geometric model and preprocessing, then run the in-browser CV
          pipeline. All metrics are computed from real pixel data — never
          fabricated.
        </p>
      </div>

      {/* Step 1 — Input selection */}
      <SectionCard
        title="1 · Input Selection"
        description="Choose a bundled DEMO pair or upload your own Source (Moving) and Reference (Fixed) images."
        action={
          <Badge
            className="border-border bg-muted text-muted-foreground font-mono text-[10px] uppercase tracking-widest"
            data-ocid="workflow.input_badge"
          >
            <Layers className="size-3" aria-hidden="true" />
            Step 1 of 4
          </Badge>
        }
      >
        <Tabs value={tab} onValueChange={(v) => setTab(v as "demo" | "user")}>
          <TabsList data-ocid="workflow.input_tabs">
            <TabsTrigger value="demo" data-ocid="workflow.tab.demo">
              <Database className="size-4" aria-hidden="true" />
              Demo Pairs
            </TabsTrigger>
            <TabsTrigger value="user" data-ocid="workflow.tab.user">
              <HardDrive className="size-4" aria-hidden="true" />
              User Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="demo" className="mt-4">
            {loading ? (
              <LoadingState label="Generating demo pairs…" rows={3} />
            ) : pairs.length === 0 ? (
              <EmptyState
                icon={Database}
                title="No demo pairs available"
                description="Bundled synthetic lunar sample pairs could not be generated."
                actionLabel="Retry"
                onAction={() => void loadPairs()}
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {pairs.map((pair, i) => {
                  const active = pair.metadata.id === selectedPairId;
                  return (
                    <button
                      key={pair.metadata.id}
                      type="button"
                      data-ocid={`workflow.demo_pair.${i}`}
                      onClick={() => {
                        setSelectedPairId(pair.metadata.id);
                        applyDemoPair(pair);
                      }}
                      className={cn(
                        "group flex flex-col gap-3 rounded-xl border bg-card p-3 text-left shadow-subtle transition-all hover:border-primary/50 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                        active && "border-primary ring-ring ring-2",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 flex-col">
                          <span className="font-display truncate text-sm font-semibold">
                            {pair.metadata.name}
                          </span>
                          <span className="text-muted-foreground font-mono text-[11px] uppercase tracking-wider">
                            {pair.metadata.sensor}
                          </span>
                        </div>
                        <DataOriginBadge origin="demo" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <img
                          src={pair.sourceDataUrl}
                          alt={`${pair.metadata.name} source preview`}
                          className="aspect-square w-full rounded-md border object-cover"
                        />
                        <img
                          src={pair.referenceDataUrl}
                          alt={`${pair.metadata.name} reference preview`}
                          className="aspect-square w-full rounded-md border object-cover"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-muted-foreground">
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase tracking-wider">
                            Sun Az
                          </span>
                          <span>{pair.metadata.sunAzimuthDeg}°</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase tracking-wider">
                            Sun El
                          </span>
                          <span>{pair.metadata.sunElevationDeg}°</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase tracking-wider">
                            Scale
                          </span>
                          <span>{pair.metadata.scaleRatio.toFixed(2)}</span>
                        </div>
                      </div>
                      <p className="text-muted-foreground line-clamp-2 text-xs">
                        {pair.metadata.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="user" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <UploadSlot
                slot="source"
                label="Source (Moving)"
                dataUrl={images.sourceDataUrl}
                name={images.sourceName}
                isDemo={images.sourceIsDemo}
                dims={sourceDims}
                inputRef={sourceInputRef}
                onPick={() => sourceInputRef.current?.click()}
                onFile={(f) => readFile(f, "source")}
              />
              <UploadSlot
                slot="reference"
                label="Reference (Fixed)"
                dataUrl={images.referenceDataUrl}
                name={images.referenceName}
                isDemo={images.referenceIsDemo}
                dims={referenceDims}
                inputRef={referenceInputRef}
                onPick={() => referenceInputRef.current?.click()}
                onFile={(f) => readFile(f, "reference")}
              />
            </div>
            {uploadProgress !== null && (
              <div className="mt-3 flex items-center gap-3">
                <Progress value={uploadProgress} className="h-2 flex-1" />
                <span className="text-muted-foreground font-mono text-xs tabular-nums">
                  {uploadProgress}%
                </span>
              </div>
            )}
            {uploadError && (
              <p
                data-ocid="workflow.upload_error"
                className="text-destructive mt-3 text-sm"
              >
                {uploadError}
              </p>
            )}
            <p className="text-muted-foreground mt-3 text-xs">
              Accepted formats: TIFF, GeoTIFF, PNG, JPG. Uploaded images are
              labeled USER DATA and processed entirely in your browser.
            </p>
          </TabsContent>
        </Tabs>
      </SectionCard>

      {/* Step 2 — Configuration */}
      <SectionCard
        title="2 · Configuration"
        description="Set preprocessing, feature detection, matching, and the geometric transformation model."
        action={
          <Badge
            className="border-border bg-muted text-muted-foreground font-mono text-[10px] uppercase tracking-widest"
            data-ocid="workflow.config_badge"
          >
            <Settings2 className="size-3" aria-hidden="true" />
            Step 2 of 4
          </Badge>
        }
      >
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Preprocessing */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal
                className="text-primary size-4"
                aria-hidden="true"
              />
              <h3 className="font-display text-sm font-semibold">
                Preprocessing
              </h3>
            </div>
            <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
              <ToggleRow
                label="Grayscale conversion"
                description="Convert to single-channel luminance before processing."
                checked={grayscale}
                onCheckedChange={setGrayscale}
                dataOcid="workflow.toggle.grayscale"
              />
              <ToggleRow
                label="Illumination normalization"
                description="Zero-mean, unit-variance normalization to equalize sun-angle differences."
                checked
                onCheckedChange={() => undefined}
                disabled
                dataOcid="workflow.toggle.illumination"
              />
              <ToggleRow
                label="Denoise"
                description="Median filter + Gaussian smoothing to suppress sensor noise."
                checked={denoise}
                onCheckedChange={setDenoise}
                dataOcid="workflow.toggle.denoise"
              />
              <ToggleRow
                label="Contrast enhancement"
                description="Histogram stretching with clipping to improve feature visibility."
                checked={contrastEnhancement}
                onCheckedChange={setContrastEnhancement}
                dataOcid="workflow.toggle.contrast"
              />
            </div>
          </div>

          {/* Detector + matching */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Cpu className="text-primary size-4" aria-hidden="true" />
              <h3 className="font-display text-sm font-semibold">
                Feature Detection & Matching
              </h3>
            </div>
            <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
              <Field label="Feature detector">
                <Select
                  value={detector}
                  onValueChange={(v) => setDetector(v as FeatureDetector)}
                >
                  <SelectTrigger
                    className="w-full"
                    data-ocid="workflow.select.detector"
                  >
                    <SelectValue placeholder="Select detector" />
                  </SelectTrigger>
                  <SelectContent>
                    {DETECTOR_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={`Max features (${maxFeatures})`}>
                <Input
                  type="number"
                  min={50}
                  max={2000}
                  value={maxFeatures}
                  data-ocid="workflow.input.max_features"
                  onChange={(e) =>
                    setMaxFeatures(Math.max(50, Number(e.target.value) || 50))
                  }
                />
              </Field>
              <Field label={`Ratio threshold (${ratioThreshold.toFixed(2)})`}>
                <Input
                  type="number"
                  min={0.5}
                  max={0.95}
                  step={0.05}
                  value={ratioThreshold}
                  data-ocid="workflow.input.ratio_threshold"
                  onChange={(e) =>
                    setRatioThreshold(
                      Math.min(
                        0.95,
                        Math.max(0.5, Number(e.target.value) || 0.75),
                      ),
                    )
                  }
                />
              </Field>
              <Field label={`Max matches (${maxMatches})`}>
                <Input
                  type="number"
                  min={50}
                  max={2000}
                  value={maxMatches}
                  data-ocid="workflow.input.max_matches"
                  onChange={(e) =>
                    setMaxMatches(Math.max(50, Number(e.target.value) || 50))
                  }
                />
              </Field>
            </div>
          </div>

          {/* Model + grid */}
          <div className="flex flex-col gap-3 lg:col-span-2">
            <div className="flex items-center gap-2">
              <GitCompareArrows
                className="text-primary size-4"
                aria-hidden="true"
              />
              <h3 className="font-display text-sm font-semibold">
                Transformation Model & Spatial Distribution
              </h3>
            </div>
            <div className="grid gap-3 rounded-lg border bg-muted/30 p-3 md:grid-cols-2">
              <Field label="Transformation model">
                <Select
                  value={modelChoice}
                  onValueChange={(v) => setModelChoice(v as ModelChoice)}
                >
                  <SelectTrigger
                    className="w-full"
                    data-ocid="workflow.select.model"
                  >
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODEL_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {modelChoice === "recommended" && (
                  <p className="text-muted-foreground mt-1.5 flex items-start gap-1.5 text-xs">
                    <Sparkles
                      className="mt-0.5 size-3.5 shrink-0 text-warning"
                      aria-hidden="true"
                    />
                    The recommended model is chosen from actual correspondence
                    and geometric-consistency metrics (inlier ratio,
                    reprojection error, degrees of freedom) — never hard-coded.
                  </p>
                )}
              </Field>
              <Field label={`Spatial grid (${gridChoice}×${gridChoice})`}>
                <fieldset className="flex gap-2" aria-label="Spatial grid size">
                  {GRID_OPTIONS.map((g) => {
                    const active = gridChoice === g;
                    return (
                      <button
                        key={g}
                        type="button"
                        data-ocid={`workflow.grid.${g}`}
                        aria-pressed={active}
                        onClick={() => {
                          setGridChoice(g);
                          setSpatialGrid(g);
                        }}
                        className={cn(
                          "flex-1 rounded-md border px-3 py-2 font-mono text-sm transition-colors focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                          active
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border bg-card text-muted-foreground hover:border-primary/50",
                        )}
                      >
                        {g}×{g}
                      </button>
                    );
                  })}
                </fieldset>
                <p className="text-muted-foreground mt-1.5 text-xs">
                  Uniformly distributes correspondence points so matches never
                  concentrate in a single region.
                </p>
              </Field>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Step 3 — Run */}
      <SectionCard
        title="3 · Run Pipeline"
        description="Execute the 11-stage registration pipeline on the selected pair."
        action={
          <Badge
            className="border-border bg-muted text-muted-foreground font-mono text-[10px] uppercase tracking-widest"
            data-ocid="workflow.run_badge"
          >
            <Play className="size-3" aria-hidden="true" />
            Step 3 of 4
          </Badge>
        }
      >
        <div className="flex flex-col gap-4">
          <PipelineStageIndicator
            currentStage={currentStage}
            isRunning={isRunning}
            data-ocid="workflow.pipeline_stages"
          />
          <ProcessingConsole
            currentStage={currentStage}
            progress={progress}
            elapsedMs={result?.elapsedMs ?? 0}
            log={log}
            issues={issues}
            isRunning={isRunning}
            data-ocid="workflow.console"
          />
          {error && (
            <ErrorState
              title="Registration failed"
              message={error}
              onRetry={handleRun}
              retryLabel="Retry run"
            />
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              data-ocid="workflow.run_button"
              onClick={handleRun}
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
              data-ocid="workflow.reset_button"
              variant="outline"
              onClick={handleReset}
              disabled={isRunning}
              className="gap-2"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Reset
            </Button>
            {!hasImages && (
              <p className="text-muted-foreground text-sm">
                Select a demo pair or upload Source and Reference images to
                enable the run.
              </p>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Step 4 — Results */}
      {result && (
        <SectionCard
          title="4 · Scientific Results"
          description="Registration summary, key metrics, and scientific explainability."
          action={
            <Badge
              className="border-border bg-muted text-muted-foreground font-mono text-[10px] uppercase tracking-widest"
              data-ocid="workflow.results_badge"
            >
              <FlaskConical className="size-3" aria-hidden="true" />
              Step 4 of 4
            </Badge>
          }
        >
          <div className="flex flex-col gap-6">
            {/* Verdict + actions */}
            <div className="flex flex-col gap-4 rounded-xl border bg-muted/30 p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                {status && <StatusBadge status={status} />}
                <div className="flex flex-col">
                  <span className="font-display text-sm font-semibold">
                    Scientific Result Summary
                  </span>
                  <span className="text-muted-foreground text-xs">
                    Verdict derived from real correspondence quality, geometric
                    consistency, RMSE, inlier ratio, and spatial coverage.
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  data-ocid="workflow.open_correspondence"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  asChild
                >
                  <a href="/correspondence">
                    <ScanSearch className="size-4" aria-hidden="true" />
                    Correspondence Viewer
                  </a>
                </Button>
                <Button
                  data-ocid="workflow.open_registration"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  asChild
                >
                  <a href="/registration">
                    <GitCompareArrows className="size-4" aria-hidden="true" />
                    Registration Viewer
                  </a>
                </Button>
                <Button
                  data-ocid="workflow.save_job"
                  size="sm"
                  className="gap-1.5"
                  onClick={saveJob}
                  disabled={saving}
                >
                  {saving ? (
                    <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                  ) : (
                    <Save className="size-4" aria-hidden="true" />
                  )}
                  Save to History
                </Button>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                label="Model"
                value={result.recommendedModel}
                explanation="The transformation model fitted to the correspondences. Recommended model is selected from actual geometric-consistency metrics across Similarity, Affine, and Homography candidates."
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
                  label="Matches accepted / rejected"
                  value={`${result.metrics.inlierCount?.toString() ?? "N/A"} / ${result.metrics.outlierCount?.toString() ?? "N/A"}`}
                  detail="Inliers are correspondences consistent with the fitted model under RANSAC; outliers are rejected as geometric inconsistencies."
                />
                <ExplainRow
                  label="Why points are inliers"
                  value={`RANSAC threshold ${config.thresholds.ransacReprojThreshold.toFixed(1)} px`}
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
          </div>
        </SectionCard>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Local helper components
 * ------------------------------------------------------------------------- */

interface UploadSlotProps {
  slot: "source" | "reference";
  label: string;
  dataUrl: string | null;
  name: string | null;
  isDemo: boolean;
  dims: { w: number; h: number } | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onPick: () => void;
  onFile: (file: File) => void;
}

function UploadSlot({
  slot,
  label,
  dataUrl,
  name,
  isDemo,
  dims,
  inputRef,
  onPick,
  onFile,
}: UploadSlotProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-sm font-semibold">{label}</span>
        {dataUrl ? <DataOriginBadge origin={isDemo ? "demo" : "user"} /> : null}
      </div>
      {dataUrl ? (
        <div className="flex flex-col gap-2">
          <img
            src={dataUrl}
            alt={`${label} preview`}
            className="aspect-video w-full rounded-md border object-cover"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground min-w-0 truncate text-xs">
              {name}
            </span>
            {dims && (
              <span className="text-muted-foreground shrink-0 font-mono text-[11px]">
                {dims.w}×{dims.h}
              </span>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          data-ocid={`workflow.upload.${slot}`}
          onClick={onPick}
          className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none"
        >
          <Upload className="size-6" aria-hidden="true" />
          <span className="text-sm">
            Choose {slot === "source" ? "Source" : "Reference"} image
          </span>
          <span className="text-xs">TIFF · GeoTIFF · PNG · JPG</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        data-ocid={`workflow.file_input.${slot}`}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  dataOcid: string;
}

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  dataOcid,
}: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-muted-foreground text-xs">{description}</span>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        data-ocid={dataOcid}
        aria-label={label}
      />
    </div>
  );
}

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
        {label}
      </Label>
      {children}
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
          <PrototypeStatusBadge status="pending" />
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
