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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { loadImageToImageData } from "@/lib/cv/helpers";
import {
  computeMeanReprojError,
  computeRmse,
  computeSpatialCoverage,
} from "@/lib/cv/metrics";
import { spatialGridFilter } from "@/lib/cv/spatial-grid";
import type { ClassifiedCorrespondence } from "@/lib/types";
import { useWorkflowStore } from "@/stores/workflow-store";
import { useNavigate } from "@tanstack/react-router";
import {
  Crosshair,
  Grid3X3,
  Layers,
  Maximize2,
  Minus,
  Plus,
  ScanSearch,
  SlidersHorizontal,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Max reprojection error across a set of correspondences (px). */
function maxReprojError(correspondences: ClassifiedCorrespondence[]): number {
  return correspondences.reduce((m, c) => Math.max(m, c.reprojectionError), 0);
}

/**
 * Confidence score (0..1) derived from reprojection error: the correspondence
 * with the lowest error in the set scores 1, the worst scores 0. This is a
 * real computed value — raw descriptor distances are not retained in the
 * registration result, so confidence is expressed in the geometric domain.
 */
function confidenceOf(c: ClassifiedCorrespondence, maxError: number): number {
  if (maxError <= 0) return 1;
  return Math.max(0, Math.min(1, 1 - c.reprojectionError / maxError));
}

/** Per-cell correspondence counts for the spatial heatmap grid. */
function computeGridCounts(
  correspondences: ClassifiedCorrespondence[],
  width: number,
  height: number,
  gridSize: number,
): number[] {
  const counts = new Array<number>(gridSize * gridSize).fill(0);
  for (const c of correspondences) {
    const gx = Math.min(
      gridSize - 1,
      Math.max(0, Math.floor((c.source.x / width) * gridSize)),
    );
    const gy = Math.min(
      gridSize - 1,
      Math.max(0, Math.floor((c.source.y / height) * gridSize)),
    );
    counts[gy * gridSize + gx] += 1;
  }
  return counts;
}

const INLIER_RGBA = "64, 210, 220"; // scientific cyan
const OUTLIER_RGBA = "255, 90, 90"; // destructive red

// ---------------------------------------------------------------------------
// Correspondence canvas: side-by-side source/reference with match lines
// ---------------------------------------------------------------------------

interface CorrespondenceCanvasProps {
  sourceDataUrl: string;
  referenceDataUrl: string;
  correspondences: ClassifiedCorrespondence[];
  lineOpacity: number;
}

function CorrespondenceCanvas({
  sourceDataUrl,
  referenceDataUrl,
  correspondences,
  lineOpacity,
}: CorrespondenceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startOffset: { x: number; y: number };
  } | null>(null);

  const [sourceImg, setSourceImg] = useState<HTMLImageElement | null>(null);
  const [refImg, setRefImg] = useState<HTMLImageElement | null>(null);
  const [dims, setDims] = useState<{
    sw: number;
    sh: number;
    rw: number;
    rh: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Load both images at the pipeline's working resolution (max 512px) so the
  // correspondence coordinates align with the rendered pixels.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSourceImg(null);
    setRefImg(null);
    setDims(null);
    setScale(1);
    setOffset({ x: 0, y: 0 });

    Promise.all([
      loadImageToImageData(sourceDataUrl, 512),
      loadImageToImageData(referenceDataUrl, 512),
    ])
      .then(([s, r]) => {
        if (cancelled) return;
        const sImg = new Image();
        sImg.onload = () => {
          if (cancelled) return;
          setSourceImg(sImg);
          setDims((d) => ({
            sw: s.width,
            sh: s.height,
            rw: d?.rw ?? 0,
            rh: d?.rh ?? 0,
          }));
        };
        sImg.src = sourceDataUrl;
        const rImg = new Image();
        rImg.onload = () => {
          if (cancelled) return;
          setRefImg(rImg);
          setDims((d) => ({
            sw: d?.sw ?? 0,
            sh: d?.sh ?? 0,
            rw: r.width,
            rh: r.height,
          }));
        };
        rImg.src = referenceDataUrl;
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load images",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sourceDataUrl, referenceDataUrl]);

  // Draw the side-by-side images and match lines.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !sourceImg || !refImg || !dims) return;
    const { sw, sh, rw, rh } = dims;
    canvas.width = sw + rw;
    canvas.height = Math.max(sh, rh);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, offset.x, offset.y);

    ctx.drawImage(sourceImg, 0, 0, sw, sh);
    ctx.drawImage(refImg, sw, 0, rw, rh);

    for (const c of correspondences) {
      const sx = c.source.x;
      const sy = c.source.y;
      const rx = c.reference.x + sw;
      const ry = c.reference.y;
      const stroke = c.inlier
        ? `rgba(${INLIER_RGBA}, ${lineOpacity})`
        : `rgba(${OUTLIER_RGBA}, ${lineOpacity})`;
      const fill = c.inlier
        ? `rgba(${INLIER_RGBA}, 1)`
        : `rgba(${OUTLIER_RGBA}, 1)`;

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(rx, ry);
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(sx, sy, 3, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rx, ry, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [sourceImg, refImg, dims, correspondences, lineOpacity, scale, offset]);

  const zoomBy = useCallback((factor: number) => {
    setScale((prev) => {
      const next = Math.max(0.5, Math.min(8, prev * factor));
      const canvas = canvasRef.current;
      if (canvas) {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        setOffset((o) => ({
          x: cx - ((cx - o.x) * next) / prev,
          y: cy - ((cy - o.y) * next) / prev,
        }));
      }
      return next;
    });
  }, []);

  const resetView = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const onWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      zoomBy(e.deltaY < 0 ? 1.1 : 0.9);
    },
    [zoomBy],
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startOffset: offset,
      };
    },
    [offset],
  );

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cssScale = rect.width / canvas.width || 1;
    setOffset({
      x:
        dragRef.current.startOffset.x +
        (e.clientX - dragRef.current.startX) / cssScale,
      y:
        dragRef.current.startOffset.y +
        (e.clientY - dragRef.current.startY) / cssScale,
    });
  }, []);

  const onMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  if (loading) {
    return <LoadingState label="Loading correspondence imagery…" rows={2} />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          setLoading(true);
          setError(null);
          setSourceImg(null);
          setRefImg(null);
          setDims(null);
          // Re-trigger the load effect by toggling a key.
          setScale((s) => s);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Button
            data-ocid="correspondence.zoom_in"
            type="button"
            variant="outline"
            size="icon"
            aria-label="Zoom in"
            onClick={() => zoomBy(1.25)}
          >
            <ZoomIn className="size-4" aria-hidden="true" />
          </Button>
          <Button
            data-ocid="correspondence.zoom_out"
            type="button"
            variant="outline"
            size="icon"
            aria-label="Zoom out"
            onClick={() => zoomBy(0.8)}
          >
            <ZoomOut className="size-4" aria-hidden="true" />
          </Button>
          <Button
            data-ocid="correspondence.reset_view"
            type="button"
            variant="outline"
            size="icon"
            aria-label="Reset view"
            onClick={resetView}
          >
            <Maximize2 className="size-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-mono text-[11px] uppercase tracking-widest">
            Zoom {Math.round(scale * 100)}%
          </span>
          <span className="text-muted-foreground text-xs">
            Drag to pan · scroll to zoom
          </span>
        </div>
      </div>

      <div className="scanline relative overflow-hidden rounded-lg border bg-grid">
        <canvas
          data-ocid="correspondence.canvas_target"
          ref={canvasRef}
          className="block h-auto max-w-full cursor-grab active:cursor-grabbing"
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        />
        <div className="pointer-events-none absolute top-2 left-2 flex gap-2">
          <Badge className="border-primary/40 bg-primary/15 text-primary font-mono text-[10px] uppercase tracking-widest">
            Source / Moving
          </Badge>
          <Badge className="border-accent/40 bg-accent/15 text-accent font-mono text-[10px] uppercase tracking-widest">
            Reference / Fixed
          </Badge>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Spatial distribution scatter
// ---------------------------------------------------------------------------

interface SpatialDistributionProps {
  correspondences: ClassifiedCorrespondence[];
  width: number;
  height: number;
}

function SpatialDistribution({
  correspondences,
  width,
  height,
}: SpatialDistributionProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5">
            <span className="bg-primary size-2.5 rounded-full" />
            Inlier
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="bg-destructive size-2.5 rounded-full" />
            Outlier
          </span>
        </div>
        <span className="text-muted-foreground font-mono text-[11px]">
          {correspondences.length} pts
        </span>
      </div>
      <div className="relative overflow-hidden rounded-lg border bg-grid">
        <svg
          data-ocid="correspondence.spatial_distribution"
          viewBox={`0 0 ${width} ${height}`}
          className="block h-auto w-full"
          role="img"
          aria-label="Spatial distribution of correspondence points across the source image"
        >
          {correspondences.map((c, i) => (
            <circle
              key={`${c.source.x}-${c.source.y}-${i}`}
              cx={c.source.x}
              cy={c.source.y}
              r={3}
              className={c.inlier ? "fill-primary" : "fill-destructive"}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Match distribution heatmap / grid
// ---------------------------------------------------------------------------

interface HeatmapGridProps {
  correspondences: ClassifiedCorrespondence[];
  width: number;
  height: number;
  gridSize: number;
}

function HeatmapGrid({
  correspondences,
  width,
  height,
  gridSize,
}: HeatmapGridProps) {
  const counts = useMemo(
    () => computeGridCounts(correspondences, width, height, gridSize),
    [correspondences, width, height, gridSize],
  );
  const maxCount = Math.max(1, ...counts);
  const occupied = counts.filter((c) => c > 0).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs">
          {gridSize}×{gridSize} cell occupancy · {occupied}/{counts.length}{" "}
          cells
        </span>
        <span className="text-muted-foreground font-mono text-[11px]">
          max {maxCount} pts/cell
        </span>
      </div>
      <div
        data-ocid="correspondence.heatmap_grid"
        className="grid gap-px rounded-lg border bg-border p-px"
        style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
        role="img"
        aria-label={`Match distribution heatmap across a ${gridSize} by ${gridSize} grid`}
      >
        {counts.map((count, i) => {
          const row = Math.floor(i / gridSize);
          const col = i % gridSize;
          return (
            <div
              key={`${row}-${col}`}
              className="bg-primary aspect-square"
              style={{
                opacity: count === 0 ? 0.06 : 0.18 + 0.82 * (count / maxCount),
              }}
              title={`${count} correspondence${count === 1 ? "" : "s"}`}
            />
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Match Quality Filtering Panel
// ---------------------------------------------------------------------------

interface MatchQualityPanelProps {
  correspondences: ClassifiedCorrespondence[];
  width: number;
  height: number;
  confidenceThreshold: number;
  onConfidenceChange: (value: number) => void;
}

function MatchQualityPanel({
  correspondences,
  width,
  height,
  confidenceThreshold,
  onConfidenceChange,
}: MatchQualityPanelProps) {
  const maxError = useMemo(
    () => maxReprojError(correspondences),
    [correspondences],
  );
  const filtered = useMemo(
    () =>
      correspondences.filter(
        (c) => confidenceOf(c, maxError) >= confidenceThreshold,
      ),
    [correspondences, maxError, confidenceThreshold],
  );

  const live = useMemo(() => {
    const inliers = filtered.filter((c) => c.inlier);
    return {
      rawMatches: filtered.length,
      inliers: inliers.length,
      outliers: filtered.length - inliers.length,
      rmse: computeRmse(filtered),
      spatialCoverage: computeSpatialCoverage(filtered, width, height),
      reprojectionError: computeMeanReprojError(filtered),
    };
  }, [filtered, width, height]);

  const fmt = (v: number | null, digits = 3) =>
    v === null || Number.isNaN(v) ? "N/A" : v.toFixed(digits);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="confidence-threshold"
            className="text-muted-foreground text-xs font-medium uppercase tracking-wider"
          >
            Confidence threshold
          </label>
          <span className="font-mono text-sm text-primary">
            {Math.round(confidenceThreshold * 100)}%
          </span>
        </div>
        <Slider
          id="confidence-threshold"
          data-ocid="correspondence.confidence_slider"
          min={0}
          max={100}
          step={1}
          value={[Math.round(confidenceThreshold * 100)]}
          onValueChange={(v) => onConfidenceChange((v[0] ?? 0) / 100)}
        />
        <p className="text-muted-foreground text-xs">
          Confidence is derived from reprojection error (lower error = higher
          confidence). Raw descriptor distances are not retained after geometric
          verification, so quality is expressed in the geometric domain.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Raw Matches"
          value={live.rawMatches}
          explanation="Total correspondence points passing the current quality threshold."
        />
        <MetricCard
          label="Inliers"
          value={live.inliers}
          tone="success"
          explanation="Correspondences consistent with the fitted transformation model."
        />
        <MetricCard
          label="Outliers"
          value={live.outliers}
          tone="destructive"
          explanation="Correspondences rejected by geometric verification."
        />
        <MetricCard
          label="RMSE"
          value={fmt(live.rmse)}
          unit="px"
          explanation="Root-mean-square reprojection error over inliers after filtering."
        />
        <MetricCard
          label="Spatial Coverage"
          value={fmt(live.spatialCoverage, 3)}
          unit="%"
          explanation="Fraction of the image area covered by inlier source points."
        />
        <MetricCard
          label="Reproj. Error"
          value={fmt(live.reprojectionError)}
          unit="px"
          explanation="Mean reprojection error over inliers after filtering."
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CorrespondenceViewerPage() {
  const navigate = useNavigate();
  const images = useWorkflowStore((s) => s.images);
  const result = useWorkflowStore((s) => s.result);
  const spatialGrid = useWorkflowStore((s) => s.spatialGrid);

  const [lineOpacity, setLineOpacity] = useState(0.5);
  const [showInliersOnly, setShowInliersOnly] = useState(false);
  const [showOutliersOnly, setShowOutliersOnly] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0);

  const allCorrespondences = result?.correspondences ?? [];
  const width = 512;
  const height = 512;

  const maxError = useMemo(
    () => maxReprojError(allCorrespondences),
    [allCorrespondences],
  );

  const filtered = useMemo(() => {
    return allCorrespondences.filter((c) => {
      if (confidenceOf(c, maxError) < confidenceThreshold) return false;
      if (showInliersOnly && !c.inlier) return false;
      if (showOutliersOnly && c.inlier) return false;
      return true;
    });
  }, [
    allCorrespondences,
    maxError,
    confidenceThreshold,
    showInliersOnly,
    showOutliersOnly,
  ]);

  const live = useMemo(() => {
    const inliers = filtered.filter((c) => c.inlier);
    return {
      rawMatches: filtered.length,
      inliers: inliers.length,
      outliers: filtered.length - inliers.length,
      rmse: computeRmse(filtered),
      spatialCoverage: computeSpatialCoverage(filtered, width, height),
      reprojectionError: computeMeanReprojError(filtered),
    };
  }, [filtered]);

  const fmt = (v: number | null, digits = 3) =>
    v === null || Number.isNaN(v) ? "N/A" : v.toFixed(digits);

  const origin =
    images.sourceIsDemo || images.referenceIsDemo ? "demo" : "user";

  const hasResult =
    !!result && !!images.sourceDataUrl && !!images.referenceDataUrl;

  if (!hasResult) {
    return (
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
              Correspondence Viewer
            </h1>
            <DataOriginBadge origin={origin} />
          </div>
          <p className="text-muted-foreground max-w-2xl text-sm md:text-base">
            Inspect the matched correspondence points between the Source
            (Moving) and Reference (Fixed) images, filter by match quality, and
            analyze their spatial distribution.
          </p>
        </header>

        <EmptyState
          icon={ScanSearch}
          title="No registration result yet"
          description="Run a registration in the workflow to generate correspondence points, inlier/outlier classification, and match-quality metrics. This viewer renders the live result from the current workbench session."
          actionLabel="Go to Registration Workflow"
          onAction={() => navigate({ to: "/workflow" })}
        />
      </div>
    );
  }

  const columns = [
    {
      header: "#",
      cell: (_: ClassifiedCorrespondence) => (
        <span className="text-muted-foreground font-mono text-xs">•</span>
      ),
    },
    {
      header: "Source (x, y)",
      cell: (c: ClassifiedCorrespondence) => (
        <span className="font-mono text-xs">
          {c.source.x.toFixed(1)}, {c.source.y.toFixed(1)}
        </span>
      ),
    },
    {
      header: "Reference (x, y)",
      cell: (c: ClassifiedCorrespondence) => (
        <span className="font-mono text-xs">
          {c.reference.x.toFixed(1)}, {c.reference.y.toFixed(1)}
        </span>
      ),
    },
    {
      header: "Class",
      cell: (c: ClassifiedCorrespondence) =>
        c.inlier ? (
          <StatusBadge status="pass" label="Inlier" />
        ) : (
          <StatusBadge status="failed" label="Outlier" />
        ),
    },
    {
      header: "Reproj. Error (px)",
      cell: (c: ClassifiedCorrespondence) => (
        <span className="font-mono text-xs">
          {c.reprojectionError.toFixed(3)}
        </span>
      ),
      cellClassName: "text-right",
    },
    {
      header: "Confidence",
      cell: (c: ClassifiedCorrespondence) => (
        <span className="font-mono text-xs">
          {(confidenceOf(c, maxError) * 100).toFixed(0)}%
        </span>
      ),
      cellClassName: "text-right",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Correspondence Viewer
          </h1>
          <DataOriginBadge origin={origin} />
        </div>
        <p className="text-muted-foreground max-w-2xl text-sm md:text-base">
          Side-by-side Source (Moving) and Reference (Fixed) imagery with match
          lines, quality filtering, and spatial distribution analysis.
        </p>
      </header>

      {/* Live metric row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Raw Matches"
          value={live.rawMatches}
          explanation="Total correspondence points passing the current quality threshold."
        />
        <MetricCard
          label="Inliers"
          value={live.inliers}
          tone="success"
          explanation="Correspondences consistent with the fitted transformation model."
        />
        <MetricCard
          label="Outliers"
          value={live.outliers}
          tone="destructive"
          explanation="Correspondences rejected by geometric verification."
        />
        <MetricCard
          label="RMSE"
          value={fmt(live.rmse)}
          unit="px"
          explanation="Root-mean-square reprojection error over inliers."
        />
        <MetricCard
          label="Spatial Coverage"
          value={fmt(live.spatialCoverage, 3)}
          unit="%"
          explanation="Fraction of the image area covered by inlier source points."
        />
        <MetricCard
          label="Reproj. Error"
          value={fmt(live.reprojectionError)}
          unit="px"
          explanation="Mean reprojection error over inliers."
        />
      </div>

      {/* Viewer + filter panel */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <SectionCard
          title="Correspondence Viewer"
          description="Reference and Source side-by-side with match lines. Drag to pan, scroll to zoom."
          className="xl:col-span-2"
          contentClassName="flex flex-col gap-4"
          action={
            <div className="flex items-center gap-2">
              <Badge className="border-primary/40 bg-primary/15 text-primary font-mono text-[10px] uppercase tracking-widest">
                <Layers className="size-3" aria-hidden="true" />
                {filtered.length} shown
              </Badge>
            </div>
          }
        >
          <CorrespondenceCanvas
            sourceDataUrl={images.sourceDataUrl!}
            referenceDataUrl={images.referenceDataUrl!}
            correspondences={filtered}
            lineOpacity={lineOpacity}
          />

          <div className="grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="line-opacity"
                  className="text-muted-foreground text-xs font-medium uppercase tracking-wider"
                >
                  Match-line opacity
                </label>
                <span className="font-mono text-xs text-primary">
                  {Math.round(lineOpacity * 100)}%
                </span>
              </div>
              <Slider
                id="line-opacity"
                data-ocid="correspondence.opacity_slider"
                min={0}
                max={100}
                step={1}
                value={[Math.round(lineOpacity * 100)]}
                onValueChange={(v) => setLineOpacity((v[0] ?? 0) / 100)}
              />
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Inliers only
                </span>
                <Switch
                  data-ocid="correspondence.inliers_only"
                  checked={showInliersOnly}
                  onCheckedChange={(v) => {
                    setShowInliersOnly(v);
                    if (v) setShowOutliersOnly(false);
                  }}
                  aria-label="Show inliers only"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Outliers only
                </span>
                <Switch
                  data-ocid="correspondence.outliers_only"
                  checked={showOutliersOnly}
                  onCheckedChange={(v) => {
                    setShowOutliersOnly(v);
                    if (v) setShowInliersOnly(false);
                  }}
                  aria-label="Show outliers only"
                />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Match Quality Filtering"
          description="Adjust the confidence threshold and see the effect on matches and metrics immediately."
          action={
            <SlidersHorizontal
              className="text-muted-foreground size-4"
              aria-hidden="true"
            />
          }
        >
          <MatchQualityPanel
            correspondences={allCorrespondences}
            width={width}
            height={height}
            confidenceThreshold={confidenceThreshold}
            onConfidenceChange={setConfidenceThreshold}
          />
        </SectionCard>
      </div>

      {/* Spatial distribution + heatmap */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard
          title="Spatial Distribution"
          description="Correspondence points plotted across the Source image, colored by inlier/outlier class."
          action={
            <Crosshair
              className="text-muted-foreground size-4"
              aria-hidden="true"
            />
          }
        >
          <SpatialDistribution
            correspondences={filtered}
            width={width}
            height={height}
          />
        </SectionCard>

        <SectionCard
          title="Match Distribution Heatmap"
          description="Cell occupancy of correspondence points across a uniform spatial grid."
          action={
            <Grid3X3
              className="text-muted-foreground size-4"
              aria-hidden="true"
            />
          }
        >
          <HeatmapGrid
            correspondences={filtered}
            width={width}
            height={height}
            gridSize={spatialGrid}
          />
        </SectionCard>
      </div>

      {/* Correspondence table */}
      <SectionCard
        title="Correspondence Points"
        description="Tabulated correspondence points with geometric classification, reprojection error, and confidence."
        action={
          <Badge className="border-primary/40 bg-primary/15 text-primary font-mono text-[10px] uppercase tracking-widest">
            {filtered.length} rows
          </Badge>
        }
      >
        <DataTable
          data={filtered}
          columns={columns}
          rowKey={(_, i) => i}
          className="max-h-[420px] overflow-auto"
        />
      </SectionCard>
    </div>
  );
}
