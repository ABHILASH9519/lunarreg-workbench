import {
  DataOriginBadge,
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  SectionCard,
  StatusBadge,
} from "@/components";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useImageLoader } from "@/hooks/useRegistration";
import { grayToImageData, rgbaToGray } from "@/lib/cv/helpers";
import type { GrayImage } from "@/lib/cv/helpers";
import { applyModel, decomposeMatrix } from "@/lib/cv/models";
import { checkerboardImages, differenceImages, warpImage } from "@/lib/cv/warp";
import type { Matrix3x3, TransformationModel } from "@/lib/types";
import { useWorkflowStore } from "@/stores/workflow-store";
import { useNavigate } from "@tanstack/react-router";
import {
  Columns3,
  Diff,
  Grid3x3,
  Image as ImageIcon,
  Layers,
  MoveHorizontal,
  ScanSearch,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const VIEW_MODES = [
  { id: "source", label: "Original Source", icon: ImageIcon },
  { id: "reference", label: "Reference", icon: ScanSearch },
  { id: "registered", label: "Registered Source", icon: Columns3 },
  { id: "overlay", label: "Overlay", icon: Layers },
  { id: "difference", label: "Difference", icon: Diff },
  { id: "checkerboard", label: "Checkerboard", icon: Grid3x3 },
] as const;

type ViewMode = (typeof VIEW_MODES)[number]["id"];

/** Draw a grayscale image buffer onto a canvas context. */
function drawGray(ctx: CanvasRenderingContext2D, img: GrayImage): void {
  ctx.putImageData(grayToImageData(img), 0, 0);
}

interface ViewerCanvasProps {
  sourceGray: GrayImage | null;
  referenceGray: GrayImage | null;
  warpedGray: GrayImage | null;
  mode: ViewMode;
  overlayOpacity: number;
  beforeAfter: boolean;
  beforeAfterPos: number;
}

/** Main registration viewer canvas. Renders the selected view mode, the
 *  interactive overlay opacity, and the Before/After split comparison. */
function ViewerCanvas({
  sourceGray,
  referenceGray,
  warpedGray,
  mode,
  overlayOpacity,
  beforeAfter,
  beforeAfterPos,
}: ViewerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = sourceGray?.width ?? referenceGray?.width ?? 512;
    const h = sourceGray?.height ?? referenceGray?.height ?? 512;
    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);

    if (beforeAfter) {
      const divider = (beforeAfterPos / 100) * w;
      if (sourceGray) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, divider, h);
        ctx.clip();
        drawGray(ctx, sourceGray);
        ctx.restore();
      }
      if (warpedGray) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(divider, 0, w - divider, h);
        ctx.clip();
        drawGray(ctx, warpedGray);
        ctx.restore();
      }
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(divider, 0);
      ctx.lineTo(divider, h);
      ctx.stroke();
      return;
    }

    switch (mode) {
      case "source":
        if (sourceGray) drawGray(ctx, sourceGray);
        break;
      case "reference":
        if (referenceGray) drawGray(ctx, referenceGray);
        break;
      case "registered":
        if (warpedGray) drawGray(ctx, warpedGray);
        break;
      case "overlay":
        if (referenceGray) drawGray(ctx, referenceGray);
        if (warpedGray) {
          ctx.globalAlpha = overlayOpacity / 100;
          drawGray(ctx, warpedGray);
          ctx.globalAlpha = 1;
        }
        break;
      case "difference":
        if (warpedGray && referenceGray) {
          drawGray(ctx, differenceImages(warpedGray, referenceGray));
        }
        break;
      case "checkerboard":
        if (warpedGray && referenceGray) {
          drawGray(ctx, checkerboardImages(warpedGray, referenceGray));
        }
        break;
    }
  }, [
    sourceGray,
    referenceGray,
    warpedGray,
    mode,
    overlayOpacity,
    beforeAfter,
    beforeAfterPos,
  ]);

  return (
    <canvas
      ref={canvasRef}
      data-ocid="registration.canvas_target"
      className="h-full w-full"
      aria-label="Registered image comparison"
    />
  );
}

interface WarpGridCanvasProps {
  sourceGray: GrayImage | null;
  model: TransformationModel;
  matrix: Matrix3x3;
}

/** Visual representation of the geometric transform: the source image with a
 *  grid whose lines are warped by the fitted transformation matrix. */
function WarpGridCanvas({ sourceGray, model, matrix }: WarpGridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sourceGray) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = sourceGray.width;
    canvas.height = sourceGray.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGray(ctx, sourceGray);

    const grid = 8;
    ctx.strokeStyle = "rgba(114, 190, 255, 0.75)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= grid; i++) {
      const t = i / grid;
      const x0 = t * sourceGray.width;
      const [ax, ay] = applyModel(model, matrix, x0, 0);
      const [bx, by] = applyModel(model, matrix, x0, sourceGray.height);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();

      const y0 = t * sourceGray.height;
      const [cx, cy] = applyModel(model, matrix, 0, y0);
      const [dx, dy] = applyModel(model, matrix, sourceGray.width, y0);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(dx, dy);
      ctx.stroke();
    }
  }, [sourceGray, model, matrix]);

  return (
    <canvas
      ref={canvasRef}
      data-ocid="registration.warp_grid_canvas"
      className="h-full w-full"
      aria-label="Transformation grid overlay"
    />
  );
}

function formatNumber(value: number | undefined, digits = 3): string {
  if (value === undefined || value === null || Number.isNaN(value))
    return "N/A";
  return value.toFixed(digits);
}

export default function RegistrationViewerPage() {
  const navigate = useNavigate();
  const images = useWorkflowStore((s) => s.images);
  const result = useWorkflowStore((s) => s.result);
  const error = useWorkflowStore((s) => s.error);

  const [mode, setMode] = useState<ViewMode>("overlay");
  const [overlayOpacity, setOverlayOpacity] = useState(50);
  const [beforeAfter, setBeforeAfter] = useState(false);
  const [beforeAfterPos, setBeforeAfterPos] = useState(50);

  const sourceLoader = useImageLoader(512);
  const referenceLoader = useImageLoader(512);

  useEffect(() => {
    if (images.sourceDataUrl) sourceLoader.load(images.sourceDataUrl);
  }, [images.sourceDataUrl, sourceLoader.load]);

  useEffect(() => {
    if (images.referenceDataUrl) referenceLoader.load(images.referenceDataUrl);
  }, [images.referenceDataUrl, referenceLoader.load]);

  const sourceGray = useMemo(
    () => (sourceLoader.imageData ? rgbaToGray(sourceLoader.imageData) : null),
    [sourceLoader.imageData],
  );
  const referenceGray = useMemo(
    () =>
      referenceLoader.imageData ? rgbaToGray(referenceLoader.imageData) : null,
    [referenceLoader.imageData],
  );
  const warpedGray = useMemo(() => {
    if (!sourceGray || !result) return null;
    return warpImage(
      sourceGray,
      result.recommendedModel,
      result.transformationMatrix,
      { width: sourceGray.width, height: sourceGray.height },
    );
  }, [sourceGray, result]);

  const origin: "demo" | "user" =
    images.sourceIsDemo || images.referenceIsDemo ? "demo" : "user";

  const metrics = result?.metrics;
  const decomposed = useMemo(
    () =>
      result
        ? decomposeMatrix(result.transformationMatrix)
        : { scale: 0, rotationDegrees: 0, tx: 0, ty: 0 },
    [result],
  );

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader origin={origin} />
        <ErrorState
          title="Registration unavailable"
          message={error}
          onRetry={() => navigate({ to: "/workflow" })}
          retryLabel="Open workflow"
        />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader origin={origin} />
        <EmptyState
          icon={MoveHorizontal}
          title="No registration result yet"
          description="Run a registration in the workflow to inspect the registered source, overlay, difference, and checkerboard views here."
          actionLabel="Open registration workflow"
          onAction={() => navigate({ to: "/workflow" })}
        />
      </div>
    );
  }

  const imagesLoading =
    sourceLoader.loading ||
    referenceLoader.loading ||
    !sourceGray ||
    !warpedGray;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader origin={origin} />

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label="RMSE"
          value={formatNumber(metrics?.rmse)}
          unit="px"
          tone={
            metrics?.rmse !== undefined && metrics.rmse < 1
              ? "success"
              : "default"
          }
          explanation="Root-mean-square reprojection error over inliers. Lower is better; sub-pixel values indicate a tight fit."
        />
        <MetricCard
          label="Scale"
          value={formatNumber(metrics?.scale)}
          tone="default"
          explanation="Estimated scale factor of the source relative to the reference, decomposed from the fitted transformation matrix."
        />
        <MetricCard
          label="Rotation"
          value={formatNumber(metrics?.rotationDegrees, 2)}
          unit="°"
          tone="default"
          explanation="Estimated rotation of the source relative to the reference, decomposed from the fitted transformation matrix."
        />
        <MetricCard
          label="Reprojection Error"
          value={formatNumber(metrics?.reprojectionError)}
          unit="px"
          tone="default"
          explanation="Mean reprojection error over inliers. Measures how well the fitted model explains the correspondences."
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main viewer */}
        <SectionCard
          title="Registration Viewer"
          description="Inspect the registered source against the reference across view modes."
          className="lg:col-span-2"
          contentClassName="flex flex-col gap-4"
          action={
            <div className="flex items-center gap-2">
              <StatusBadge status="pass" label="REGISTERED" />
              <DataOriginBadge origin={origin} />
            </div>
          }
        >
          <Tabs
            value={mode}
            onValueChange={(v) => setMode(v as ViewMode)}
            className="w-full"
          >
            <TabsList className="flex w-full flex-wrap justify-start">
              {VIEW_MODES.map((m) => {
                const Icon = m.icon;
                return (
                  <TabsTrigger
                    key={m.id}
                    value={m.id}
                    data-ocid={`registration.mode_tab.${m.id}`}
                    className="gap-1.5"
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                    {m.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            <TabsContent value={mode} className="mt-4">
              {imagesLoading ? (
                <LoadingState label="Rendering registration views…" rows={2} />
              ) : (
                <div className="bg-grid relative mx-auto aspect-square w-full max-w-[640px] overflow-hidden rounded-lg border bg-card">
                  <ViewerCanvas
                    sourceGray={sourceGray}
                    referenceGray={referenceGray}
                    warpedGray={warpedGray}
                    mode={mode}
                    overlayOpacity={overlayOpacity}
                    beforeAfter={beforeAfter}
                    beforeAfterPos={beforeAfterPos}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Interactive controls */}
          <div className="flex flex-col gap-4 rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MoveHorizontal
                  className="text-muted-foreground size-4"
                  aria-hidden="true"
                />
                <span className="text-sm font-medium">Before / After</span>
                <span className="text-muted-foreground text-xs">
                  Source vs Registered
                </span>
              </div>
              <Switch
                data-ocid="registration.before_after_toggle"
                checked={beforeAfter}
                onCheckedChange={setBeforeAfter}
                aria-label="Toggle before/after comparison"
              />
            </div>
            {beforeAfter ? (
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground font-mono text-xs">
                  Source
                </span>
                <Slider
                  data-ocid="registration.before_after_slider"
                  value={[beforeAfterPos]}
                  onValueChange={(v) => setBeforeAfterPos(v[0])}
                  min={0}
                  max={100}
                  step={1}
                  className="flex-1"
                  aria-label="Before/after divider position"
                />
                <span className="text-muted-foreground font-mono text-xs">
                  Registered
                </span>
              </div>
            ) : null}

            {mode === "overlay" ? (
              <div className="flex items-center gap-3">
                <SlidersHorizontal
                  className="text-muted-foreground size-4"
                  aria-hidden="true"
                />
                <span className="text-sm font-medium">Overlay opacity</span>
                <span className="text-muted-foreground font-mono text-xs">
                  Reference vs Registered
                </span>
                <Slider
                  data-ocid="registration.overlay_opacity_slider"
                  value={[overlayOpacity]}
                  onValueChange={(v) => setOverlayOpacity(v[0])}
                  min={0}
                  max={100}
                  step={1}
                  className="flex-1"
                  aria-label="Overlay opacity"
                />
                <span className="text-muted-foreground font-mono text-xs">
                  {overlayOpacity}%
                </span>
              </div>
            ) : null}
          </div>
        </SectionCard>

        {/* Transformation visualization */}
        <div className="flex flex-col gap-6">
          <SectionCard
            title="Transformation Matrix"
            description={`Estimated ${result.recommendedModel} model (3×3, row-major).`}
          >
            <div className="grid grid-cols-3 gap-1.5">
              {result.transformationMatrix.map((v, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed 3x3 grid, index is the stable key
                  key={`matrix-cell-${i}`}
                  className="bg-muted flex items-center justify-center rounded-md px-2 py-2 font-mono text-xs"
                >
                  {v.toFixed(4)}
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground text-xs uppercase tracking-wider">
                  Scale
                </span>
                <span className="font-mono text-sm">
                  {formatNumber(decomposed.scale)}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground text-xs uppercase tracking-wider">
                  Rotation
                </span>
                <span className="font-mono text-sm">
                  {formatNumber(decomposed.rotationDegrees, 2)}°
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground text-xs uppercase tracking-wider">
                  Translation X
                </span>
                <span className="font-mono text-sm">
                  {formatNumber(decomposed.tx, 2)} px
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground text-xs uppercase tracking-wider">
                  Translation Y
                </span>
                <span className="font-mono text-sm">
                  {formatNumber(decomposed.ty, 2)} px
                </span>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Geometric Transform"
            description="Grid overlay showing how the source is warped into reference space."
          >
            {imagesLoading ? (
              <LoadingState label="Preparing transform view…" rows={1} />
            ) : (
              <div className="bg-grid relative aspect-square w-full overflow-hidden rounded-lg border bg-card">
                <WarpGridCanvas
                  sourceGray={sourceGray}
                  model={result.recommendedModel}
                  matrix={result.transformationMatrix}
                />
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function PageHeader({ origin }: { origin: "demo" | "user" }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Registration Viewer
        </h1>
        <DataOriginBadge origin={origin} />
      </div>
      <p className="text-muted-foreground max-w-2xl text-sm">
        Inspect the registered source against the reference across view modes,
        and review the estimated transformation that maps the moving image into
        the fixed image's coordinate space.
      </p>
    </div>
  );
}
