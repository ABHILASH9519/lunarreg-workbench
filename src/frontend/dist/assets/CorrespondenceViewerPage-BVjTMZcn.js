import { c as createLucideIcon, u as useNavigate, r as reactExports, j as jsxRuntimeExports, b as ScanSearch, e as Badge, B as Button } from "./index-CLvvNGC5.js";
import { M as MetricCard } from "./MetricCard-CUJmwOnQ.js";
import { S as StatusBadge } from "./StatusBadge-BeOJaX2E.js";
import { D as DataOriginBadge, a as EmptyState, L as LoadingState, E as ErrorState } from "./LoadingState-CJmkDIGR.js";
import { S as SectionCard } from "./SectionCard-j39JmNct.js";
import { D as DataTable } from "./DataTable-DvpL2mbN.js";
import { S as Slider, G as Grid3x3 } from "./slider-jfvh2Bj3.js";
import { S as Switch } from "./switch-CibPqkZo.js";
import { c as computeMeanReprojError, a as computeSpatialCoverage, b as computeRmse, l as loadImageToImageData } from "./metrics-CXdDL_t5.js";
import { u as useWorkflowStore } from "./workflow-store-Bufg8Y0a.js";
import { L as Layers } from "./layers-DXSet5IY.js";
import { S as SlidersHorizontal } from "./sliders-horizontal-CwGf6PpS.js";
import { C as Crosshair } from "./crosshair-CgFWU4tH.js";
import { M as Maximize2 } from "./maximize-2-Cgs28fzX.js";
import "./circle-check-DcUF21bz.js";
import "./index-goFs2gnd.js";
import "./backend-DPWNum9l.js";
import "./react-CxBERiit.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
  ["line", { x1: "21", x2: "16.65", y1: "21", y2: "16.65", key: "13gj7c" }],
  ["line", { x1: "11", x2: "11", y1: "8", y2: "14", key: "1vmskp" }],
  ["line", { x1: "8", x2: "14", y1: "11", y2: "11", key: "durymu" }]
];
const ZoomIn = createLucideIcon("zoom-in", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
  ["line", { x1: "21", x2: "16.65", y1: "21", y2: "16.65", key: "13gj7c" }],
  ["line", { x1: "8", x2: "14", y1: "11", y2: "11", key: "durymu" }]
];
const ZoomOut = createLucideIcon("zoom-out", __iconNode);
function maxReprojError(correspondences) {
  return correspondences.reduce((m, c) => Math.max(m, c.reprojectionError), 0);
}
function confidenceOf(c, maxError) {
  if (maxError <= 0) return 1;
  return Math.max(0, Math.min(1, 1 - c.reprojectionError / maxError));
}
function computeGridCounts(correspondences, width, height, gridSize) {
  const counts = new Array(gridSize * gridSize).fill(0);
  for (const c of correspondences) {
    const gx = Math.min(
      gridSize - 1,
      Math.max(0, Math.floor(c.source.x / width * gridSize))
    );
    const gy = Math.min(
      gridSize - 1,
      Math.max(0, Math.floor(c.source.y / height * gridSize))
    );
    counts[gy * gridSize + gx] += 1;
  }
  return counts;
}
const INLIER_RGBA = "64, 210, 220";
const OUTLIER_RGBA = "255, 90, 90";
function CorrespondenceCanvas({
  sourceDataUrl,
  referenceDataUrl,
  correspondences,
  lineOpacity
}) {
  const canvasRef = reactExports.useRef(null);
  const dragRef = reactExports.useRef(null);
  const [sourceImg, setSourceImg] = reactExports.useState(null);
  const [refImg, setRefImg] = reactExports.useState(null);
  const [dims, setDims] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  const [scale, setScale] = reactExports.useState(1);
  const [offset, setOffset] = reactExports.useState({ x: 0, y: 0 });
  reactExports.useEffect(() => {
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
      loadImageToImageData(referenceDataUrl, 512)
    ]).then(([s, r]) => {
      if (cancelled) return;
      const sImg = new Image();
      sImg.onload = () => {
        if (cancelled) return;
        setSourceImg(sImg);
        setDims((d) => ({
          sw: s.width,
          sh: s.height,
          rw: (d == null ? void 0 : d.rw) ?? 0,
          rh: (d == null ? void 0 : d.rh) ?? 0
        }));
      };
      sImg.src = sourceDataUrl;
      const rImg = new Image();
      rImg.onload = () => {
        if (cancelled) return;
        setRefImg(rImg);
        setDims((d) => ({
          sw: (d == null ? void 0 : d.sw) ?? 0,
          sh: (d == null ? void 0 : d.sh) ?? 0,
          rw: r.width,
          rh: r.height
        }));
      };
      rImg.src = referenceDataUrl;
    }).catch((err) => {
      if (!cancelled)
        setError(
          err instanceof Error ? err.message : "Failed to load images"
        );
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [sourceDataUrl, referenceDataUrl]);
  reactExports.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas == null ? void 0 : canvas.getContext("2d");
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
      const stroke = c.inlier ? `rgba(${INLIER_RGBA}, ${lineOpacity})` : `rgba(${OUTLIER_RGBA}, ${lineOpacity})`;
      const fill = c.inlier ? `rgba(${INLIER_RGBA}, 1)` : `rgba(${OUTLIER_RGBA}, 1)`;
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
  const zoomBy = reactExports.useCallback((factor) => {
    setScale((prev) => {
      const next = Math.max(0.5, Math.min(8, prev * factor));
      const canvas = canvasRef.current;
      if (canvas) {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        setOffset((o) => ({
          x: cx - (cx - o.x) * next / prev,
          y: cy - (cy - o.y) * next / prev
        }));
      }
      return next;
    });
  }, []);
  const resetView = reactExports.useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);
  const onWheel = reactExports.useCallback(
    (e) => {
      e.preventDefault();
      zoomBy(e.deltaY < 0 ? 1.1 : 0.9);
    },
    [zoomBy]
  );
  const onMouseDown = reactExports.useCallback(
    (e) => {
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startOffset: offset
      };
    },
    [offset]
  );
  const onMouseMove = reactExports.useCallback((e) => {
    if (!dragRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cssScale = rect.width / canvas.width || 1;
    setOffset({
      x: dragRef.current.startOffset.x + (e.clientX - dragRef.current.startX) / cssScale,
      y: dragRef.current.startOffset.y + (e.clientY - dragRef.current.startY) / cssScale
    });
  }, []);
  const onMouseUp = reactExports.useCallback(() => {
    dragRef.current = null;
  }, []);
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingState, { label: "Loading correspondence imagery…", rows: 2 });
  }
  if (error) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      ErrorState,
      {
        message: error,
        onRetry: () => {
          setLoading(true);
          setError(null);
          setSourceImg(null);
          setRefImg(null);
          setDims(null);
          setScale((s) => s);
        }
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            "data-ocid": "correspondence.zoom_in",
            type: "button",
            variant: "outline",
            size: "icon",
            "aria-label": "Zoom in",
            onClick: () => zoomBy(1.25),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ZoomIn, { className: "size-4", "aria-hidden": "true" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            "data-ocid": "correspondence.zoom_out",
            type: "button",
            variant: "outline",
            size: "icon",
            "aria-label": "Zoom out",
            onClick: () => zoomBy(0.8),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ZoomOut, { className: "size-4", "aria-hidden": "true" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            "data-ocid": "correspondence.reset_view",
            type: "button",
            variant: "outline",
            size: "icon",
            "aria-label": "Reset view",
            onClick: resetView,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Maximize2, { className: "size-4", "aria-hidden": "true" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground font-mono text-[11px] uppercase tracking-widest", children: [
          "Zoom ",
          Math.round(scale * 100),
          "%"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-xs", children: "Drag to pan · scroll to zoom" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "scanline relative overflow-hidden rounded-lg border bg-grid", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "canvas",
        {
          "data-ocid": "correspondence.canvas_target",
          ref: canvasRef,
          className: "block h-auto max-w-full cursor-grab active:cursor-grabbing",
          onWheel,
          onMouseDown,
          onMouseMove,
          onMouseUp,
          onMouseLeave: onMouseUp
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pointer-events-none absolute top-2 left-2 flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "border-primary/40 bg-primary/15 text-primary font-mono text-[10px] uppercase tracking-widest", children: "Source / Moving" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "border-accent/40 bg-accent/15 text-accent font-mono text-[10px] uppercase tracking-widest", children: "Reference / Fixed" })
      ] })
    ] })
  ] });
}
function SpatialDistribution({
  correspondences,
  width,
  height
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-primary size-2.5 rounded-full" }),
          "Inlier"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-destructive size-2.5 rounded-full" }),
          "Outlier"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground font-mono text-[11px]", children: [
        correspondences.length,
        " pts"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative overflow-hidden rounded-lg border bg-grid", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "svg",
      {
        "data-ocid": "correspondence.spatial_distribution",
        viewBox: `0 0 ${width} ${height}`,
        className: "block h-auto w-full",
        role: "img",
        "aria-label": "Spatial distribution of correspondence points across the source image",
        children: correspondences.map((c, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "circle",
          {
            cx: c.source.x,
            cy: c.source.y,
            r: 3,
            className: c.inlier ? "fill-primary" : "fill-destructive"
          },
          `${c.source.x}-${c.source.y}-${i}`
        ))
      }
    ) })
  ] });
}
function HeatmapGrid({
  correspondences,
  width,
  height,
  gridSize
}) {
  const counts = reactExports.useMemo(
    () => computeGridCounts(correspondences, width, height, gridSize),
    [correspondences, width, height, gridSize]
  );
  const maxCount = Math.max(1, ...counts);
  const occupied = counts.filter((c) => c > 0).length;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground text-xs", children: [
        gridSize,
        "×",
        gridSize,
        " cell occupancy · ",
        occupied,
        "/",
        counts.length,
        " ",
        "cells"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground font-mono text-[11px]", children: [
        "max ",
        maxCount,
        " pts/cell"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        "data-ocid": "correspondence.heatmap_grid",
        className: "grid gap-px rounded-lg border bg-border p-px",
        style: { gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` },
        role: "img",
        "aria-label": `Match distribution heatmap across a ${gridSize} by ${gridSize} grid`,
        children: counts.map((count, i) => {
          const row = Math.floor(i / gridSize);
          const col = i % gridSize;
          return /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "bg-primary aspect-square",
              style: {
                opacity: count === 0 ? 0.06 : 0.18 + 0.82 * (count / maxCount)
              },
              title: `${count} correspondence${count === 1 ? "" : "s"}`
            },
            `${row}-${col}`
          );
        })
      }
    )
  ] });
}
function MatchQualityPanel({
  correspondences,
  width,
  height,
  confidenceThreshold,
  onConfidenceChange
}) {
  const maxError = reactExports.useMemo(
    () => maxReprojError(correspondences),
    [correspondences]
  );
  const filtered = reactExports.useMemo(
    () => correspondences.filter(
      (c) => confidenceOf(c, maxError) >= confidenceThreshold
    ),
    [correspondences, maxError, confidenceThreshold]
  );
  const live = reactExports.useMemo(() => {
    const inliers = filtered.filter((c) => c.inlier);
    return {
      rawMatches: filtered.length,
      inliers: inliers.length,
      outliers: filtered.length - inliers.length,
      rmse: computeRmse(filtered),
      spatialCoverage: computeSpatialCoverage(filtered, width, height),
      reprojectionError: computeMeanReprojError(filtered)
    };
  }, [filtered, width, height]);
  const fmt = (v, digits = 3) => v === null || Number.isNaN(v) ? "N/A" : v.toFixed(digits);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "label",
          {
            htmlFor: "confidence-threshold",
            className: "text-muted-foreground text-xs font-medium uppercase tracking-wider",
            children: "Confidence threshold"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-sm text-primary", children: [
          Math.round(confidenceThreshold * 100),
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Slider,
        {
          id: "confidence-threshold",
          "data-ocid": "correspondence.confidence_slider",
          min: 0,
          max: 100,
          step: 1,
          value: [Math.round(confidenceThreshold * 100)],
          onValueChange: (v) => onConfidenceChange((v[0] ?? 0) / 100)
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs", children: "Confidence is derived from reprojection error (lower error = higher confidence). Raw descriptor distances are not retained after geometric verification, so quality is expressed in the geometric domain." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MetricCard,
        {
          label: "Raw Matches",
          value: live.rawMatches,
          explanation: "Total correspondence points passing the current quality threshold."
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MetricCard,
        {
          label: "Inliers",
          value: live.inliers,
          tone: "success",
          explanation: "Correspondences consistent with the fitted transformation model."
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MetricCard,
        {
          label: "Outliers",
          value: live.outliers,
          tone: "destructive",
          explanation: "Correspondences rejected by geometric verification."
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MetricCard,
        {
          label: "RMSE",
          value: fmt(live.rmse),
          unit: "px",
          explanation: "Root-mean-square reprojection error over inliers after filtering."
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MetricCard,
        {
          label: "Spatial Coverage",
          value: fmt(live.spatialCoverage, 3),
          unit: "%",
          explanation: "Fraction of the image area covered by inlier source points."
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MetricCard,
        {
          label: "Reproj. Error",
          value: fmt(live.reprojectionError),
          unit: "px",
          explanation: "Mean reprojection error over inliers after filtering."
        }
      )
    ] })
  ] });
}
function CorrespondenceViewerPage() {
  const navigate = useNavigate();
  const images = useWorkflowStore((s) => s.images);
  const result = useWorkflowStore((s) => s.result);
  const spatialGrid = useWorkflowStore((s) => s.spatialGrid);
  const [lineOpacity, setLineOpacity] = reactExports.useState(0.5);
  const [showInliersOnly, setShowInliersOnly] = reactExports.useState(false);
  const [showOutliersOnly, setShowOutliersOnly] = reactExports.useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = reactExports.useState(0);
  const allCorrespondences = (result == null ? void 0 : result.correspondences) ?? [];
  const width = 512;
  const height = 512;
  const maxError = reactExports.useMemo(
    () => maxReprojError(allCorrespondences),
    [allCorrespondences]
  );
  const filtered = reactExports.useMemo(() => {
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
    showOutliersOnly
  ]);
  const live = reactExports.useMemo(() => {
    const inliers = filtered.filter((c) => c.inlier);
    return {
      rawMatches: filtered.length,
      inliers: inliers.length,
      outliers: filtered.length - inliers.length,
      rmse: computeRmse(filtered),
      spatialCoverage: computeSpatialCoverage(filtered, width, height),
      reprojectionError: computeMeanReprojError(filtered)
    };
  }, [filtered]);
  const fmt = (v, digits = 3) => v === null || Number.isNaN(v) ? "N/A" : v.toFixed(digits);
  const origin = images.sourceIsDemo || images.referenceIsDemo ? "demo" : "user";
  const hasResult = !!result && !!images.sourceDataUrl && !!images.referenceDataUrl;
  if (!hasResult) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-col gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl font-semibold tracking-tight md:text-3xl", children: "Correspondence Viewer" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DataOriginBadge, { origin })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground max-w-2xl text-sm md:text-base", children: "Inspect the matched correspondence points between the Source (Moving) and Reference (Fixed) images, filter by match quality, and analyze their spatial distribution." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        EmptyState,
        {
          icon: ScanSearch,
          title: "No registration result yet",
          description: "Run a registration in the workflow to generate correspondence points, inlier/outlier classification, and match-quality metrics. This viewer renders the live result from the current workbench session.",
          actionLabel: "Go to Registration Workflow",
          onAction: () => navigate({ to: "/workflow" })
        }
      )
    ] });
  }
  const columns = [
    {
      header: "#",
      cell: (_) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-mono text-xs", children: "•" })
    },
    {
      header: "Source (x, y)",
      cell: (c) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-xs", children: [
        c.source.x.toFixed(1),
        ", ",
        c.source.y.toFixed(1)
      ] })
    },
    {
      header: "Reference (x, y)",
      cell: (c) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-xs", children: [
        c.reference.x.toFixed(1),
        ", ",
        c.reference.y.toFixed(1)
      ] })
    },
    {
      header: "Class",
      cell: (c) => c.inlier ? /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status: "pass", label: "Inlier" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status: "failed", label: "Outlier" })
    },
    {
      header: "Reproj. Error (px)",
      cell: (c) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs", children: c.reprojectionError.toFixed(3) }),
      cellClassName: "text-right"
    },
    {
      header: "Confidence",
      cell: (c) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-xs", children: [
        (confidenceOf(c, maxError) * 100).toFixed(0),
        "%"
      ] }),
      cellClassName: "text-right"
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-col gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl font-semibold tracking-tight md:text-3xl", children: "Correspondence Viewer" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DataOriginBadge, { origin })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground max-w-2xl text-sm md:text-base", children: "Side-by-side Source (Moving) and Reference (Fixed) imagery with match lines, quality filtering, and spatial distribution analysis." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MetricCard,
        {
          label: "Raw Matches",
          value: live.rawMatches,
          explanation: "Total correspondence points passing the current quality threshold."
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MetricCard,
        {
          label: "Inliers",
          value: live.inliers,
          tone: "success",
          explanation: "Correspondences consistent with the fitted transformation model."
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MetricCard,
        {
          label: "Outliers",
          value: live.outliers,
          tone: "destructive",
          explanation: "Correspondences rejected by geometric verification."
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MetricCard,
        {
          label: "RMSE",
          value: fmt(live.rmse),
          unit: "px",
          explanation: "Root-mean-square reprojection error over inliers."
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MetricCard,
        {
          label: "Spatial Coverage",
          value: fmt(live.spatialCoverage, 3),
          unit: "%",
          explanation: "Fraction of the image area covered by inlier source points."
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MetricCard,
        {
          label: "Reproj. Error",
          value: fmt(live.reprojectionError),
          unit: "px",
          explanation: "Mean reprojection error over inliers."
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-6 xl:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        SectionCard,
        {
          title: "Correspondence Viewer",
          description: "Reference and Source side-by-side with match lines. Drag to pan, scroll to zoom.",
          className: "xl:col-span-2",
          contentClassName: "flex flex-col gap-4",
          action: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "border-primary/40 bg-primary/15 text-primary font-mono text-[10px] uppercase tracking-widest", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Layers, { className: "size-3", "aria-hidden": "true" }),
            filtered.length,
            " shown"
          ] }) }),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              CorrespondenceCanvas,
              {
                sourceDataUrl: images.sourceDataUrl,
                referenceDataUrl: images.referenceDataUrl,
                correspondences: filtered,
                lineOpacity
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "label",
                    {
                      htmlFor: "line-opacity",
                      className: "text-muted-foreground text-xs font-medium uppercase tracking-wider",
                      children: "Match-line opacity"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-xs text-primary", children: [
                    Math.round(lineOpacity * 100),
                    "%"
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Slider,
                  {
                    id: "line-opacity",
                    "data-ocid": "correspondence.opacity_slider",
                    min: 0,
                    max: 100,
                    step: 1,
                    value: [Math.round(lineOpacity * 100)],
                    onValueChange: (v) => setLineOpacity((v[0] ?? 0) / 100)
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-xs font-medium uppercase tracking-wider", children: "Inliers only" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Switch,
                    {
                      "data-ocid": "correspondence.inliers_only",
                      checked: showInliersOnly,
                      onCheckedChange: (v) => {
                        setShowInliersOnly(v);
                        if (v) setShowOutliersOnly(false);
                      },
                      "aria-label": "Show inliers only"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-xs font-medium uppercase tracking-wider", children: "Outliers only" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Switch,
                    {
                      "data-ocid": "correspondence.outliers_only",
                      checked: showOutliersOnly,
                      onCheckedChange: (v) => {
                        setShowOutliersOnly(v);
                        if (v) setShowInliersOnly(false);
                      },
                      "aria-label": "Show outliers only"
                    }
                  )
                ] })
              ] })
            ] })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SectionCard,
        {
          title: "Match Quality Filtering",
          description: "Adjust the confidence threshold and see the effect on matches and metrics immediately.",
          action: /* @__PURE__ */ jsxRuntimeExports.jsx(
            SlidersHorizontal,
            {
              className: "text-muted-foreground size-4",
              "aria-hidden": "true"
            }
          ),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            MatchQualityPanel,
            {
              correspondences: allCorrespondences,
              width,
              height,
              confidenceThreshold,
              onConfidenceChange: setConfidenceThreshold
            }
          )
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SectionCard,
        {
          title: "Spatial Distribution",
          description: "Correspondence points plotted across the Source image, colored by inlier/outlier class.",
          action: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Crosshair,
            {
              className: "text-muted-foreground size-4",
              "aria-hidden": "true"
            }
          ),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            SpatialDistribution,
            {
              correspondences: filtered,
              width,
              height
            }
          )
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SectionCard,
        {
          title: "Match Distribution Heatmap",
          description: "Cell occupancy of correspondence points across a uniform spatial grid.",
          action: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Grid3x3,
            {
              className: "text-muted-foreground size-4",
              "aria-hidden": "true"
            }
          ),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            HeatmapGrid,
            {
              correspondences: filtered,
              width,
              height,
              gridSize: spatialGrid
            }
          )
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SectionCard,
      {
        title: "Correspondence Points",
        description: "Tabulated correspondence points with geometric classification, reprojection error, and confidence.",
        action: /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "border-primary/40 bg-primary/15 text-primary font-mono text-[10px] uppercase tracking-widest", children: [
          filtered.length,
          " rows"
        ] }),
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          DataTable,
          {
            data: filtered,
            columns,
            rowKey: (_, i) => i,
            className: "max-h-[420px] overflow-auto"
          }
        )
      }
    )
  ] });
}
export {
  CorrespondenceViewerPage as default
};
