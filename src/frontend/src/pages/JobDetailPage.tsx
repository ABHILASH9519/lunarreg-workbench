import {
  ConfidenceBadge,
  type ConfidenceLevel,
  type DataOrigin,
  DataOriginBadge,
  DataTable,
  type DataTableColumn,
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  SectionCard,
  StatusBadge,
  type StatusTone,
} from "@/components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useJob } from "@/hooks/useJobs";
import { useDemoPairs } from "@/hooks/useRegistration";
import { classifyCorrespondences } from "@/lib/cv/geometric-verification";
import { DEMO_DEFS } from "@/lib/demo/demo-pairs";
import {
  type ExportBundle,
  configToJson,
  correspondencesToCsv,
  correspondencesToJson,
  downloadRegisteredImage,
  exportAllResults,
  matrixToJson,
  metricsToJson,
} from "@/lib/export/export-utils";
import { type PdfReportData, downloadPdfReport } from "@/lib/export/pdf-report";
import type {
  ClassifiedCorrespondence,
  Job,
  JobMetrics,
  TransformationModel,
} from "@/lib/types";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  GitCompareArrows,
  Image as ImageIcon,
  Rocket,
  Settings2,
  Table2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MODEL_LABELS: Record<TransformationModel, string> = {
  homography: "Homography",
  similarity: "Similarity",
  affine: "Affine",
};

const DETECTOR_LABELS: Record<string, string> = {
  orb: "ORB",
  sift: "SIFT",
  brisk: "BRISK",
  kaze: "KAZE",
};

function formatTimestamp(timestamp: bigint): string {
  const date = new Date(Number(timestamp / 1_000_000n));
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatPx(value: number | undefined | null): string {
  if (value === undefined || value === null) return "N/A";
  return value.toFixed(3);
}

function formatPct(value: number | undefined | null): string {
  if (value === undefined || value === null) return "N/A";
  return `${(value * 100).toFixed(1)}%`;
}

function formatDeg(value: number | undefined | null): string {
  if (value === undefined || value === null) return "N/A";
  return `${value.toFixed(2)}°`;
}

function formatBytes(bytes: bigint): string {
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

/** Detect DEMO vs USER origin by matching the stored image name against the
 * deterministic demo pair definitions. */
function detectOrigin(name: string): DataOrigin {
  return DEMO_DEFS.some((def) => name.includes(def.metadata.name))
    ? "demo"
    : "user";
}

/** Find the demo sensor label for a stored image name, if it is a demo pair. */
function demoSensor(name: string): string | null {
  const def = DEMO_DEFS.find((d) => name.includes(d.metadata.name));
  return def ? def.metadata.sensor : null;
}

/** Derive a scientific PASS / WARNING / FAILED verdict from real metrics. */
function deriveStatus(job: Job): StatusTone {
  const metrics = job.result?.metrics;
  if (!metrics) return "warning";
  const inlierCount = Number(metrics.inlierCount ?? 0n);
  const outlierCount = Number(metrics.outlierCount ?? 0n);
  const total = inlierCount + outlierCount;
  const inlierRatio = total > 0 ? inlierCount / total : 0;

  if (job.status === "failed") return "failed";
  if (inlierCount === 0 || inlierRatio < 0.3) return "failed";
  if (metrics.rmse !== undefined && metrics.rmse > 3) return "warning";
  if (metrics.spatialCoverage !== undefined && metrics.spatialCoverage < 0.4) {
    return "warning";
  }
  return "pass";
}

/** Derive a confidence level from real metrics. */
function deriveConfidence(job: Job): ConfidenceLevel {
  const metrics = job.result?.metrics;
  if (!metrics) return "failed";
  const inlierCount = Number(metrics.inlierCount ?? 0n);
  const outlierCount = Number(metrics.outlierCount ?? 0n);
  const total = inlierCount + outlierCount;
  const inlierRatio = total > 0 ? inlierCount / total : 0;

  if (inlierCount === 0 || inlierRatio < 0.3) return "failed";
  if (inlierRatio >= 0.7 && (metrics.rmse ?? Number.POSITIVE_INFINITY) <= 1.5)
    return "excellent";
  if (inlierRatio >= 0.5) return "good";
  if (inlierRatio >= 0.3) return "moderate";
  return "poor";
}

function statusLabel(status: Job["status"]): string {
  switch (status) {
    case "completed":
      return "PASS";
    case "failed":
      return "FAILED";
    case "pending":
      return "PENDING";
    case "processing":
      return "PROCESSING";
    default:
      return "UNKNOWN";
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function JobDetailPage() {
  const { jobId } = useParams({ strict: false });
  const jobIdBigInt = useMemo(() => {
    if (jobId === undefined) return null;
    try {
      return BigInt(jobId);
    } catch {
      return null;
    }
  }, [jobId]);

  const { data: job, isLoading, isError, error, refetch } = useJob(jobIdBigInt);
  const { loadPairs } = useDemoPairs();
  const navigate = useNavigate();
  const [exportingPdf, setExportingPdf] = useState(false);

  // Ensure demo pairs are available for origin detection metadata.
  useEffect(() => {
    void loadPairs();
  }, [loadPairs]);

  const classified = useMemo<ClassifiedCorrespondence[]>(() => {
    if (!job?.result) return [];
    return classifyCorrespondences(
      job.config.model,
      job.result.transformationMatrix,
      job.result.correspondences,
      job.config.thresholds.ransacReprojThreshold,
    );
  }, [job]);

  const inlierRatio = useMemo(() => {
    if (!job?.result) return null;
    const inliers = Number(job.result.metrics.inlierCount ?? 0n);
    const outliers = Number(job.result.metrics.outlierCount ?? 0n);
    const total = inliers + outliers;
    return total > 0 ? inliers / total : 0;
  }, [job]);

  const matrixCells = useMemo(
    () =>
      (job?.result?.transformationMatrix ?? []).map((value, index) => ({
        id: `matrix-cell-${index}`,
        value,
      })),
    [job?.result?.transformationMatrix],
  );

  const sourceOrigin = job
    ? detectOrigin(job.sourceImage.metadata.name)
    : "user";
  const referenceOrigin = job
    ? detectOrigin(job.referenceImage.metadata.name)
    : "user";
  const sensor = job ? demoSensor(job.sourceImage.metadata.name) : null;

  const handleExportAll = () => {
    if (!job?.result) return;
    const bundle: ExportBundle = {
      correspondences: classified,
      metrics: job.result.metrics,
      transformationMatrix: job.result.transformationMatrix,
      config: job.config,
      recommendedModel: job.config.model,
      registeredImageDataUrl: job.result.registeredOutput || null,
    };
    exportAllResults(bundle, `job-${job.id.toString()}`);
    toast.success("Export package downloaded");
  };

  const handlePdf = async () => {
    if (!job?.result) return;
    setExportingPdf(true);
    try {
      const data: PdfReportData = {
        title: `Registration Report — ${job.sourceImage.metadata.name}`,
        subtitle: `Job #${job.id.toString()} · ${MODEL_LABELS[job.config.model]}`,
        sourceName: job.sourceImage.metadata.name,
        referenceName: job.referenceImage.metadata.name,
        sensor: sensor ?? "User Upload",
        model: job.config.model,
        matrix: job.result.transformationMatrix,
        metrics: job.result.metrics,
        correspondences: classified,
        registeredImageDataUrl: job.result.registeredOutput || null,
        overlayImageDataUrl: null,
        differenceImageDataUrl: null,
        config: job.config,
        issues: [],
        generatedAt: new Date().toISOString(),
      };
      await downloadPdfReport(data, `job-${job.id.toString()}-report.pdf`);
      toast.success("PDF report downloaded");
    } catch (err) {
      toast.error(
        `Failed to generate PDF: ${err instanceof Error ? err.message : "unknown error"}`,
      );
    } finally {
      setExportingPdf(false);
    }
  };

  const handleDownloadRegistered = () => {
    if (!job?.result?.registeredOutput) return;
    downloadRegisteredImage(
      job.result.registeredOutput,
      `job-${job.id.toString()}-registered.png`,
    );
  };

  const handleDownloadCsv = () => {
    if (!job?.result) return;
    const blob = new Blob([correspondencesToCsv(classified)], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `job-${job.id.toString()}-correspondences.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = (content: string, suffix: string) => {
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `job-${job?.id.toString() ?? "export"}-${suffix}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <LoadingState label="Loading experiment detail…" rows={6} />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Unable to load experiment"
        message={
          error instanceof Error
            ? error.message
            : "The experiment detail could not be retrieved."
        }
        onRetry={() => void refetch()}
      />
    );
  }

  if (!job) {
    return (
      <EmptyState
        icon={Rocket}
        title="Experiment not found"
        description={`No registration job exists for ID #${jobId}. It may have been deleted, or the link is incorrect.`}
        actionLabel="Back to Job History"
        onAction={() => navigate({ to: "/history" })}
      />
    );
  }

  const metrics: JobMetrics = job.result?.metrics ?? {};
  const status = deriveStatus(job);
  const confidence = deriveConfidence(job);
  const hasResult = !!job.result;

  const correspondenceColumns: DataTableColumn<ClassifiedCorrespondence>[] = [
    {
      header: "#",
      cellClassName: "text-muted-foreground font-mono text-xs",
      cell: () => <span>•</span>,
    },
    {
      header: "Source X",
      cellClassName: "text-right font-mono text-xs tabular-nums",
      cell: (c) => c.source.x.toFixed(2),
    },
    {
      header: "Source Y",
      cellClassName: "text-right font-mono text-xs tabular-nums",
      cell: (c) => c.source.y.toFixed(2),
    },
    {
      header: "Reference X",
      cellClassName: "text-right font-mono text-xs tabular-nums",
      cell: (c) => c.reference.x.toFixed(2),
    },
    {
      header: "Reference Y",
      cellClassName: "text-right font-mono text-xs tabular-nums",
      cell: (c) => c.reference.y.toFixed(2),
    },
    {
      header: "Inlier",
      cell: (c) =>
        c.inlier ? (
          <Badge className="border-success/40 bg-success/15 text-success">
            Inlier
          </Badge>
        ) : (
          <Badge className="border-destructive/40 bg-destructive/15 text-destructive">
            Outlier
          </Badge>
        ),
    },
    {
      header: "Reproj. Error (px)",
      cellClassName: "text-right font-mono text-xs tabular-nums",
      cell: (c) => c.reprojectionError.toFixed(3),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-4">
        <Button
          data-ocid="job_detail.back_button"
          variant="ghost"
          size="sm"
          className="w-fit gap-1.5 text-muted-foreground"
          asChild
        >
          <Link to="/history">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to Job History
          </Link>
        </Button>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="bg-gradient-primary flex size-9 items-center justify-center rounded-lg text-primary-foreground">
                <Rocket className="size-5" aria-hidden="true" />
              </span>
              <div className="flex flex-col">
                <h1 className="font-display text-2xl font-semibold tracking-tight">
                  Experiment Detail
                </h1>
                <p className="text-muted-foreground font-mono text-xs">
                  Job #{job.id.toString()} · Created{" "}
                  {formatTimestamp(job.createdAt)}
                </p>
              </div>
            </div>
            <p className="text-muted-foreground max-w-3xl text-sm">
              Full reproducible record of this registration experiment — input
              imagery, configuration, transformation model, correspondence
              points, metrics, registered output and report.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={status} label={statusLabel(job.status)} />
            <ConfidenceBadge level={confidence} />
            <DataOriginBadge origin={sourceOrigin} />
          </div>
        </div>
      </div>

      {/* Input images */}
      <SectionCard
        title="Input Images"
        description="Source (Moving) and Reference (Fixed) imagery used for this experiment."
        action={<DataOriginBadge origin={sourceOrigin} />}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <ImagePanel
            label="Source (Moving)"
            name={job.sourceImage.metadata.name}
            origin={sourceOrigin}
            sensor={sensor}
            dataUrl={job.sourceImage.ref}
            width={job.sourceImage.metadata.width}
            height={job.sourceImage.metadata.height}
            sizeBytes={job.sourceImage.metadata.sizeBytes}
            format={job.sourceImage.metadata.format}
          />
          <ImagePanel
            label="Reference (Fixed)"
            name={job.referenceImage.metadata.name}
            origin={referenceOrigin}
            sensor={sensor}
            dataUrl={job.referenceImage.ref}
            width={job.referenceImage.metadata.width}
            height={job.referenceImage.metadata.height}
            sizeBytes={job.referenceImage.metadata.sizeBytes}
            format={job.referenceImage.metadata.format}
          />
        </div>
      </SectionCard>

      {/* Reproducibility configuration */}
      <SectionCard
        title="Reproducibility Configuration"
        description="Every parameter that produced this result, stored per job so the experiment is fully reproducible."
        action={
          <Badge
            className="border-border bg-muted text-muted-foreground font-mono text-[10px] uppercase tracking-widest"
            data-ocid="job_detail.config_badge"
          >
            <Settings2 className="size-3" aria-hidden="true" />
            Stored Config
          </Badge>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <ConfigGroup title="Preprocessing">
            <ConfigRow
              label="Grayscale conversion"
              value={job.config.preprocessing.grayscale ? "On" : "Off"}
            />
            <ConfigRow
              label="Denoise"
              value={job.config.preprocessing.denoise ? "On" : "Off"}
            />
            <ConfigRow
              label="Contrast enhancement"
              value={
                job.config.preprocessing.contrastEnhancement ? "On" : "Off"
              }
            />
            {job.config.preprocessing.resizeWidth !== undefined && (
              <ConfigRow
                label="Resize width"
                value={job.config.preprocessing.resizeWidth.toString()}
              />
            )}
            {job.config.preprocessing.resizeHeight !== undefined && (
              <ConfigRow
                label="Resize height"
                value={job.config.preprocessing.resizeHeight.toString()}
              />
            )}
          </ConfigGroup>

          <ConfigGroup title="Feature Detector">
            <ConfigRow
              label="Detector"
              value={
                DETECTOR_LABELS[job.config.detector.detector] ??
                job.config.detector.detector
              }
            />
            <ConfigRow
              label="Max features"
              value={job.config.detector.maxFeatures.toString()}
            />
            <ConfigRow
              label="Scale levels"
              value={job.config.detector.nLevels.toString()}
            />
            <ConfigRow
              label="Edge threshold"
              value={job.config.detector.edgeThreshold.toString()}
            />
            <ConfigRow
              label="Scale factor"
              value={job.config.detector.scaleFactor.toFixed(2)}
            />
          </ConfigGroup>

          <ConfigGroup title="Matching">
            <ConfigRow
              label="Ratio threshold"
              value={job.config.matching.ratioThreshold.toFixed(2)}
            />
            <ConfigRow
              label="Max matches"
              value={job.config.matching.maxMatches.toString()}
            />
            <ConfigRow
              label="Cross-check"
              value={job.config.matching.crossCheck ? "On" : "Off"}
            />
          </ConfigGroup>

          <ConfigGroup title="Transformation Model & Thresholds">
            <ConfigRow
              label="Transformation model"
              value={MODEL_LABELS[job.config.model] ?? job.config.model}
            />
            <ConfigRow
              label="RANSAC reproj. threshold"
              value={`${job.config.thresholds.ransacReprojThreshold.toFixed(1)} px`}
            />
            <ConfigRow
              label="Min inlier ratio"
              value={job.config.thresholds.minInlierRatio.toFixed(2)}
            />
          </ConfigGroup>
        </div>
      </SectionCard>

      {/* Metrics */}
      <SectionCard
        title="Scientific Metrics"
        description="Measured from real pixel data. Hover the info icon on each metric for a drill-down explanation."
        action={
          <Badge
            className="border-border bg-muted text-muted-foreground font-mono text-[10px] uppercase tracking-widest"
            data-ocid="job_detail.metrics_badge"
          >
            <FlaskConical className="size-3" aria-hidden="true" />
            Metrics
          </Badge>
        }
      >
        {!hasResult ? (
          <EmptyState
            icon={FlaskConical}
            title="No result attached"
            description="This job has no completed result yet, so metrics are not available."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              label="RMSE"
              value={formatPx(metrics.rmse)}
              unit="px"
              tone={
                metrics.rmse === undefined
                  ? "default"
                  : metrics.rmse > 3
                    ? "warning"
                    : "success"
              }
              explanation="Root-mean-square reprojection error over inliers. Computed as the square root of the mean of squared distances between each inlier's reference point and its point reprojected through the fitted model. Lower is better — it measures how tightly the model fits the accepted correspondences."
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
              explanation="Fraction of correspondences accepted as inliers by RANSAC under the fitted model. Computed as inlier count divided by total correspondences. Higher indicates stronger geometric consistency between the two images."
            />
            <MetricCard
              label="Spatial Coverage"
              value={formatPct(metrics.spatialCoverage)}
              unit="%"
              tone={
                metrics.spatialCoverage === undefined
                  ? "default"
                  : metrics.spatialCoverage < 0.4
                    ? "warning"
                    : "success"
              }
              explanation="Fraction of the image area spanned by the inlier source points, estimated via grid occupancy. Higher means matches are spread across the scene rather than concentrated in one region, which improves the reliability of the fitted model."
            />
            <MetricCard
              label="Reprojection Error"
              value={formatPx(metrics.reprojectionError)}
              unit="px"
              explanation="Mean reprojection error over inliers. Each correspondence's reference point is compared to its source point reprojected through the fitted model; the average distance is reported. Lower indicates a tighter geometric fit."
            />
            <MetricCard
              label="Scale"
              value={
                metrics.scale === undefined ? "N/A" : metrics.scale.toFixed(4)
              }
              explanation="Estimated scale ratio between the Source and Reference images recovered from the fitted transformation. A value near 1.0 indicates no significant scale difference between the pair."
            />
            <MetricCard
              label="Rotation"
              value={formatDeg(metrics.rotationDegrees)}
              explanation="Estimated rotation (in degrees) between the Source and Reference images recovered from the fitted transformation. Near zero indicates the pair is roughly aligned in orientation."
            />
          </div>
        )}
      </SectionCard>

      {/* Transformation matrix */}
      <SectionCard
        title="Transformation Matrix"
        description={`Fitted ${MODEL_LABELS[job.config.model] ?? job.config.model} model mapping Source to Reference coordinates.`}
      >
        {!hasResult ? (
          <p className="text-muted-foreground text-sm">
            No transformation matrix is available until the job completes.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid max-w-md grid-cols-3 gap-2">
              {matrixCells.map((cell) => (
                <div
                  key={cell.id}
                  className="rounded-md border bg-muted/30 px-3 py-2 text-center font-mono text-sm tabular-nums"
                >
                  {cell.value.toFixed(6)}
                </div>
              ))}
            </div>
            <p className="text-muted-foreground text-xs">
              Row-major 3×3 matrix. Applying this matrix to Source coordinates
              yields their position in the Reference frame.
            </p>
          </div>
        )}
      </SectionCard>

      {/* Correspondence points */}
      <SectionCard
        title="Correspondence Points"
        description="Matched point pairs with inlier/outlier classification derived from the stored matrix and RANSAC threshold."
        action={
          <Badge
            className="border-border bg-muted text-muted-foreground font-mono text-[10px] uppercase tracking-widest"
            data-ocid="job_detail.correspondence_badge"
          >
            <Table2 className="size-3" aria-hidden="true" />
            {classified.length} points
          </Badge>
        }
      >
        {!hasResult || classified.length === 0 ? (
          <EmptyState
            icon={Table2}
            title="No correspondence points"
            description="Correspondence points are not available until the job completes with a result."
          />
        ) : (
          <DataTable
            data-ocid="job_detail.correspondence_table"
            columns={correspondenceColumns}
            data={classified}
            rowKey={(c, i) => `${c.source.x}-${c.source.y}-${i}`}
          />
        )}
      </SectionCard>

      {/* Before vs After */}
      <SectionCard
        title="Before vs After Analysis"
        description="Compare the original unregistered Source image against the registered (warped) output with measurable metrics."
        action={
          <Badge
            className="border-border bg-muted text-muted-foreground font-mono text-[10px] uppercase tracking-widest"
            data-ocid="job_detail.before_after_badge"
          >
            <GitCompareArrows className="size-3" aria-hidden="true" />
            Comparison
          </Badge>
        }
      >
        {!hasResult ? (
          <EmptyState
            icon={GitCompareArrows}
            title="No registered output"
            description="The registered output is not available until the job completes."
          />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Before · Unregistered Source
                </span>
                <img
                  src={job.sourceImage.ref}
                  alt="Unregistered source"
                  className="aspect-video w-full rounded-md border object-cover"
                />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  After · Registered Source
                </span>
                {job.result?.registeredOutput ? (
                  <img
                    src={job.result?.registeredOutput}
                    alt="Registered source"
                    className="aspect-video w-full rounded-md border object-cover"
                  />
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center rounded-md border border-dashed bg-muted/30 text-muted-foreground text-sm">
                    N/A
                  </div>
                )}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="RMSE"
                value={formatPx(metrics.rmse)}
                unit="px"
                explanation="Residual error after registration. Lower indicates the registered source aligns more tightly with the reference."
              />
              <MetricCard
                label="Inlier Ratio"
                value={formatPct(inlierRatio)}
                unit="%"
                explanation="Fraction of correspondences consistent with the fitted model — a measure of how well the pair aligns after registration."
              />
              <MetricCard
                label="Reprojection Error"
                value={formatPx(metrics.reprojectionError)}
                unit="px"
                explanation="Mean per-correspondence residual after applying the transformation. Lower means the registered source better matches the reference."
              />
              <MetricCard
                label="Spatial Coverage"
                value={formatPct(metrics.spatialCoverage)}
                unit="%"
                explanation="How widely the inlier correspondences are distributed across the scene, indicating registration reliability."
              />
            </div>
          </div>
        )}
      </SectionCard>

      {/* Report */}
      <SectionCard
        title="Experiment Report"
        description="Narrative summary of the registration result."
      >
        {!hasResult ? (
          <p className="text-muted-foreground text-sm">
            No report is available until the job completes.
          </p>
        ) : (
          <p className="text-sm leading-relaxed">{job.result?.report}</p>
        )}
      </SectionCard>

      {/* Export */}
      <SectionCard
        title="Export All Results"
        description="Download the registered image, correspondence data, metrics, transformation matrix, configuration, and PDF report."
        action={
          <Badge
            className="border-border bg-muted text-muted-foreground font-mono text-[10px] uppercase tracking-widest"
            data-ocid="job_detail.export_badge"
          >
            <Download className="size-3" aria-hidden="true" />
            Export
          </Badge>
        }
      >
        {!hasResult ? (
          <EmptyState
            icon={Download}
            title="Nothing to export yet"
            description="Export options become available once the job has a completed result."
          />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Button
                data-ocid="job_detail.export_all_button"
                onClick={handleExportAll}
                className="gap-1.5"
              >
                <Download className="size-4" aria-hidden="true" />
                Export All Results
              </Button>
              <Button
                data-ocid="job_detail.export_pdf_button"
                variant="outline"
                onClick={() => void handlePdf()}
                disabled={exportingPdf}
                className="gap-1.5"
              >
                <FileText className="size-4" aria-hidden="true" />
                {exportingPdf ? "Generating…" : "PDF Report"}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                data-ocid="job_detail.export_image_button"
                variant="outline"
                size="sm"
                onClick={handleDownloadRegistered}
                disabled={!job.result?.registeredOutput}
                className="gap-1.5"
              >
                <ImageIcon className="size-4" aria-hidden="true" />
                Registered Image
              </Button>
              <Button
                data-ocid="job_detail.export_csv_button"
                variant="outline"
                size="sm"
                onClick={handleDownloadCsv}
                className="gap-1.5"
              >
                <FileSpreadsheet className="size-4" aria-hidden="true" />
                Correspondence CSV
              </Button>
              <Button
                data-ocid="job_detail.export_corr_json_button"
                variant="outline"
                size="sm"
                onClick={() =>
                  handleDownloadJson(
                    correspondencesToJson(classified),
                    "correspondences",
                  )
                }
                className="gap-1.5"
              >
                <FileJson className="size-4" aria-hidden="true" />
                Correspondence JSON
              </Button>
              <Button
                data-ocid="job_detail.export_metrics_button"
                variant="outline"
                size="sm"
                onClick={() =>
                  handleDownloadJson(metricsToJson(metrics), "metrics")
                }
                className="gap-1.5"
              >
                <FileJson className="size-4" aria-hidden="true" />
                Metrics JSON
              </Button>
              <Button
                data-ocid="job_detail.export_matrix_button"
                variant="outline"
                size="sm"
                onClick={() =>
                  handleDownloadJson(
                    matrixToJson(job.result?.transformationMatrix ?? []),
                    "matrix",
                  )
                }
                className="gap-1.5"
              >
                <FileJson className="size-4" aria-hidden="true" />
                Transformation Matrix
              </Button>
              <Button
                data-ocid="job_detail.export_config_button"
                variant="outline"
                size="sm"
                onClick={() =>
                  handleDownloadJson(configToJson(job.config), "config")
                }
                className="gap-1.5"
              >
                <FileJson className="size-4" aria-hidden="true" />
                Configuration JSON
              </Button>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Local helper components
// ---------------------------------------------------------------------------

interface ImagePanelProps {
  label: string;
  name: string;
  origin: DataOrigin;
  sensor: string | null;
  dataUrl: string;
  width: bigint;
  height: bigint;
  sizeBytes: bigint;
  format: string;
}

function ImagePanel({
  label,
  name,
  origin,
  sensor,
  dataUrl,
  width,
  height,
  sizeBytes,
  format,
}: ImagePanelProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-sm font-semibold">{label}</span>
        <DataOriginBadge origin={origin} />
      </div>
      <img
        src={dataUrl}
        alt={label}
        className="aspect-video w-full rounded-md border object-cover"
      />
      <div className="flex flex-col gap-1">
        <span className="min-w-0 truncate text-sm font-medium">{name}</span>
        <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground">
          <span>
            {width.toString()}×{height.toString()}
          </span>
          <span>{format.toUpperCase()}</span>
          <span>{formatBytes(sizeBytes)}</span>
          {sensor && <span>{sensor}</span>}
        </div>
      </div>
    </div>
  );
}

interface ConfigGroupProps {
  title: string;
  children: React.ReactNode;
}

function ConfigGroup({ title, children }: ConfigGroupProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3">
      <h3 className="font-display text-sm font-semibold">{title}</h3>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

interface ConfigRowProps {
  label: string;
  value: string;
}

function ConfigRow({ label, value }: ConfigRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="font-mono text-sm font-medium">{value}</span>
    </div>
  );
}
