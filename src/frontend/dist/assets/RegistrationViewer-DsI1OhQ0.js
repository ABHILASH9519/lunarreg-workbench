import { c as createLucideIcon, u as useNavigate, r as reactExports, j as jsxRuntimeExports, b as ScanSearch } from "./index-CLvvNGC5.js";
import { M as MetricCard } from "./MetricCard-CUJmwOnQ.js";
import { S as StatusBadge } from "./StatusBadge-BeOJaX2E.js";
import { E as ErrorState, a as EmptyState, L as LoadingState, D as DataOriginBadge } from "./LoadingState-CJmkDIGR.js";
import { S as SectionCard } from "./SectionCard-j39JmNct.js";
import { G as Grid3x3, S as Slider } from "./slider-jfvh2Bj3.js";
import { S as Switch } from "./switch-CibPqkZo.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-C44HeQ2a.js";
import { b as useImageLoader } from "./useRegistration-CDTivxtS.js";
import { r as rgbaToGray, d as decomposeMatrix, e as applyModel, g as grayToImageData } from "./metrics-CXdDL_t5.js";
import { w as warpImage, c as checkerboardImages, d as differenceImages } from "./cv-engine-jhIfoGkm.js";
import { u as useWorkflowStore } from "./workflow-store-Bufg8Y0a.js";
import { I as Image } from "./image-B7DncbX1.js";
import { L as Layers } from "./layers-DXSet5IY.js";
import { S as SlidersHorizontal } from "./sliders-horizontal-CwGf6PpS.js";
import "./circle-check-DcUF21bz.js";
import "./index-goFs2gnd.js";
import "./react-CxBERiit.js";
import "./backend-DPWNum9l.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$2 = [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "afitv7" }],
  ["path", { d: "M9 3v18", key: "fh3hqa" }],
  ["path", { d: "M15 3v18", key: "14nvp0" }]
];
const Columns3 = createLucideIcon("columns-3", __iconNode$2);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["path", { d: "M12 3v14", key: "7cf3v8" }],
  ["path", { d: "M5 10h14", key: "elsbfy" }],
  ["path", { d: "M5 21h14", key: "11awu3" }]
];
const Diff = createLucideIcon("diff", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "m18 8 4 4-4 4", key: "1ak13k" }],
  ["path", { d: "M2 12h20", key: "9i4pu4" }],
  ["path", { d: "m6 8-4 4 4 4", key: "15zrgr" }]
];
const MoveHorizontal = createLucideIcon("move-horizontal", __iconNode);
const VIEW_MODES = [
  { id: "source", label: "Original Source", icon: Image },
  { id: "reference", label: "Reference", icon: ScanSearch },
  { id: "registered", label: "Registered Source", icon: Columns3 },
  { id: "overlay", label: "Overlay", icon: Layers },
  { id: "difference", label: "Difference", icon: Diff },
  { id: "checkerboard", label: "Checkerboard", icon: Grid3x3 }
];
function drawGray(ctx, img) {
  ctx.putImageData(grayToImageData(img), 0, 0);
}
function ViewerCanvas({
  sourceGray,
  referenceGray,
  warpedGray,
  mode,
  overlayOpacity,
  beforeAfter,
  beforeAfterPos
}) {
  const canvasRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = (sourceGray == null ? void 0 : sourceGray.width) ?? (referenceGray == null ? void 0 : referenceGray.width) ?? 512;
    const h = (sourceGray == null ? void 0 : sourceGray.height) ?? (referenceGray == null ? void 0 : referenceGray.height) ?? 512;
    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    if (beforeAfter) {
      const divider = beforeAfterPos / 100 * w;
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
    beforeAfterPos
  ]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "canvas",
    {
      ref: canvasRef,
      "data-ocid": "registration.canvas_target",
      className: "h-full w-full",
      "aria-label": "Registered image comparison"
    }
  );
}
function WarpGridCanvas({ sourceGray, model, matrix }) {
  const canvasRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
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
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "canvas",
    {
      ref: canvasRef,
      "data-ocid": "registration.warp_grid_canvas",
      className: "h-full w-full",
      "aria-label": "Transformation grid overlay"
    }
  );
}
function formatNumber(value, digits = 3) {
  if (value === void 0 || value === null || Number.isNaN(value))
    return "N/A";
  return value.toFixed(digits);
}
function RegistrationViewerPage() {
  const navigate = useNavigate();
  const images = useWorkflowStore((s) => s.images);
  const result = useWorkflowStore((s) => s.result);
  const error = useWorkflowStore((s) => s.error);
  const [mode, setMode] = reactExports.useState("overlay");
  const [overlayOpacity, setOverlayOpacity] = reactExports.useState(50);
  const [beforeAfter, setBeforeAfter] = reactExports.useState(false);
  const [beforeAfterPos, setBeforeAfterPos] = reactExports.useState(50);
  const sourceLoader = useImageLoader(512);
  const referenceLoader = useImageLoader(512);
  reactExports.useEffect(() => {
    if (images.sourceDataUrl) sourceLoader.load(images.sourceDataUrl);
  }, [images.sourceDataUrl, sourceLoader.load]);
  reactExports.useEffect(() => {
    if (images.referenceDataUrl) referenceLoader.load(images.referenceDataUrl);
  }, [images.referenceDataUrl, referenceLoader.load]);
  const sourceGray = reactExports.useMemo(
    () => sourceLoader.imageData ? rgbaToGray(sourceLoader.imageData) : null,
    [sourceLoader.imageData]
  );
  const referenceGray = reactExports.useMemo(
    () => referenceLoader.imageData ? rgbaToGray(referenceLoader.imageData) : null,
    [referenceLoader.imageData]
  );
  const warpedGray = reactExports.useMemo(() => {
    if (!sourceGray || !result) return null;
    return warpImage(
      sourceGray,
      result.recommendedModel,
      result.transformationMatrix,
      { width: sourceGray.width, height: sourceGray.height }
    );
  }, [sourceGray, result]);
  const origin = images.sourceIsDemo || images.referenceIsDemo ? "demo" : "user";
  const metrics = result == null ? void 0 : result.metrics;
  const decomposed = reactExports.useMemo(
    () => result ? decomposeMatrix(result.transformationMatrix) : { scale: 0, rotationDegrees: 0, tx: 0, ty: 0 },
    [result]
  );
  if (error) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(PageHeader, { origin }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        ErrorState,
        {
          title: "Registration unavailable",
          message: error,
          onRetry: () => navigate({ to: "/workflow" }),
          retryLabel: "Open workflow"
        }
      )
    ] });
  }
  if (!result) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(PageHeader, { origin }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        EmptyState,
        {
          icon: MoveHorizontal,
          title: "No registration result yet",
          description: "Run a registration in the workflow to inspect the registered source, overlay, difference, and checkerboard views here.",
          actionLabel: "Open registration workflow",
          onAction: () => navigate({ to: "/workflow" })
        }
      )
    ] });
  }
  const imagesLoading = sourceLoader.loading || referenceLoader.loading || !sourceGray || !warpedGray;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(PageHeader, { origin }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4 md:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MetricCard,
        {
          label: "RMSE",
          value: formatNumber(metrics == null ? void 0 : metrics.rmse),
          unit: "px",
          tone: (metrics == null ? void 0 : metrics.rmse) !== void 0 && metrics.rmse < 1 ? "success" : "default",
          explanation: "Root-mean-square reprojection error over inliers. Lower is better; sub-pixel values indicate a tight fit."
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MetricCard,
        {
          label: "Scale",
          value: formatNumber(metrics == null ? void 0 : metrics.scale),
          tone: "default",
          explanation: "Estimated scale factor of the source relative to the reference, decomposed from the fitted transformation matrix."
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MetricCard,
        {
          label: "Rotation",
          value: formatNumber(metrics == null ? void 0 : metrics.rotationDegrees, 2),
          unit: "°",
          tone: "default",
          explanation: "Estimated rotation of the source relative to the reference, decomposed from the fitted transformation matrix."
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MetricCard,
        {
          label: "Reprojection Error",
          value: formatNumber(metrics == null ? void 0 : metrics.reprojectionError),
          unit: "px",
          tone: "default",
          explanation: "Mean reprojection error over inliers. Measures how well the fitted model explains the correspondences."
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        SectionCard,
        {
          title: "Registration Viewer",
          description: "Inspect the registered source against the reference across view modes.",
          className: "lg:col-span-2",
          contentClassName: "flex flex-col gap-4",
          action: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status: "pass", label: "REGISTERED" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DataOriginBadge, { origin })
          ] }),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Tabs,
              {
                value: mode,
                onValueChange: (v) => setMode(v),
                className: "w-full",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TabsList, { className: "flex w-full flex-wrap justify-start", children: VIEW_MODES.map((m) => {
                    const Icon = m.icon;
                    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      TabsTrigger,
                      {
                        value: m.id,
                        "data-ocid": `registration.mode_tab.${m.id}`,
                        className: "gap-1.5",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "size-3.5", "aria-hidden": "true" }),
                          m.label
                        ]
                      },
                      m.id
                    );
                  }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: mode, className: "mt-4", children: imagesLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingState, { label: "Rendering registration views…", rows: 2 }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-grid relative mx-auto aspect-square w-full max-w-[640px] overflow-hidden rounded-lg border bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    ViewerCanvas,
                    {
                      sourceGray,
                      referenceGray,
                      warpedGray,
                      mode,
                      overlayOpacity,
                      beforeAfter,
                      beforeAfterPos
                    }
                  ) }) })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 rounded-lg border bg-card p-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    MoveHorizontal,
                    {
                      className: "text-muted-foreground size-4",
                      "aria-hidden": "true"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: "Before / After" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-xs", children: "Source vs Registered" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Switch,
                  {
                    "data-ocid": "registration.before_after_toggle",
                    checked: beforeAfter,
                    onCheckedChange: setBeforeAfter,
                    "aria-label": "Toggle before/after comparison"
                  }
                )
              ] }),
              beforeAfter ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-mono text-xs", children: "Source" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Slider,
                  {
                    "data-ocid": "registration.before_after_slider",
                    value: [beforeAfterPos],
                    onValueChange: (v) => setBeforeAfterPos(v[0]),
                    min: 0,
                    max: 100,
                    step: 1,
                    className: "flex-1",
                    "aria-label": "Before/after divider position"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-mono text-xs", children: "Registered" })
              ] }) : null,
              mode === "overlay" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  SlidersHorizontal,
                  {
                    className: "text-muted-foreground size-4",
                    "aria-hidden": "true"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: "Overlay opacity" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-mono text-xs", children: "Reference vs Registered" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Slider,
                  {
                    "data-ocid": "registration.overlay_opacity_slider",
                    value: [overlayOpacity],
                    onValueChange: (v) => setOverlayOpacity(v[0]),
                    min: 0,
                    max: 100,
                    step: 1,
                    className: "flex-1",
                    "aria-label": "Overlay opacity"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground font-mono text-xs", children: [
                  overlayOpacity,
                  "%"
                ] })
              ] }) : null
            ] })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          SectionCard,
          {
            title: "Transformation Matrix",
            description: `Estimated ${result.recommendedModel} model (3×3, row-major).`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-1.5", children: result.transformationMatrix.map((v, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "bg-muted flex items-center justify-center rounded-md px-2 py-2 font-mono text-xs",
                  children: v.toFixed(4)
                },
                `matrix-cell-${i}`
              )) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-0.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-xs uppercase tracking-wider", children: "Scale" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-sm", children: formatNumber(decomposed.scale) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-0.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-xs uppercase tracking-wider", children: "Rotation" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-sm", children: [
                    formatNumber(decomposed.rotationDegrees, 2),
                    "°"
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-0.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-xs uppercase tracking-wider", children: "Translation X" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-sm", children: [
                    formatNumber(decomposed.tx, 2),
                    " px"
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-0.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-xs uppercase tracking-wider", children: "Translation Y" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-sm", children: [
                    formatNumber(decomposed.ty, 2),
                    " px"
                  ] })
                ] })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          SectionCard,
          {
            title: "Geometric Transform",
            description: "Grid overlay showing how the source is warped into reference space.",
            children: imagesLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingState, { label: "Preparing transform view…", rows: 1 }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-grid relative aspect-square w-full overflow-hidden rounded-lg border bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              WarpGridCanvas,
              {
                sourceGray,
                model: result.recommendedModel,
                matrix: result.transformationMatrix
              }
            ) })
          }
        )
      ] })
    ] })
  ] });
}
function PageHeader({ origin }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl font-semibold tracking-tight", children: "Registration Viewer" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DataOriginBadge, { origin })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground max-w-2xl text-sm", children: "Inspect the registered source against the reference across view modes, and review the estimated transformation that maps the moving image into the fixed image's coordinate space." })
  ] });
}
export {
  RegistrationViewerPage as default
};
