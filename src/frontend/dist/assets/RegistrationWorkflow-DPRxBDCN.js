import { c as createLucideIcon, r as reactExports, j as jsxRuntimeExports, P as Primitive, a as cn, W as Workflow, D as Database, e as Badge, G as GitCompareArrows, f as Settings2, B as Button, b as ScanSearch, F as FlaskConical } from "./index-CLvvNGC5.js";
import { F as FeatureDetector, T as TransformationModel } from "./backend-DPWNum9l.js";
import { M as MetricCard, I as Info } from "./MetricCard-CUJmwOnQ.js";
import { S as StatusBadge } from "./StatusBadge-BeOJaX2E.js";
import { H as HardDrive, L as LoadingState, a as EmptyState, D as DataOriginBadge, E as ErrorState } from "./LoadingState-CJmkDIGR.js";
import { P as Progress, a as PipelineStageIndicator, b as ProcessingConsole, R as RotateCcw } from "./ProcessingConsole-DuVHnNYl.js";
import { S as SectionCard } from "./SectionCard-j39JmNct.js";
import { C as Cpu, P as PrototypeStatusBadge } from "./PrototypeStatusBadge-DeOLmAG7.js";
import { I as Input } from "./input-BqQf4ZC_.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CgpL97RU.js";
import { S as Switch } from "./switch-CibPqkZo.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-C44HeQ2a.js";
import { u as useCreateJob, a as useUpdateJobResult } from "./job-history-store-BWqWtVFr.js";
import { u as useRegistration, a as useDemoPairs } from "./useRegistration-CDTivxtS.js";
import { u as useWorkflowStore } from "./workflow-store-Bufg8Y0a.js";
import { u as ue } from "./index-CdCyEGtN.js";
import { L as Layers } from "./layers-DXSet5IY.js";
import { S as SlidersHorizontal } from "./sliders-horizontal-CwGf6PpS.js";
import { S as Sparkles } from "./sparkles-BnNfqILw.js";
import { P as Play } from "./play-BxxRfsa9.js";
import "./circle-check-DcUF21bz.js";
import "./cv-engine-jhIfoGkm.js";
import "./metrics-CXdDL_t5.js";
import "./check-gbVmm_Ow.js";
import "./index-goFs2gnd.js";
import "./react-CxBERiit.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  [
    "path",
    {
      d: "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
      key: "1c8476"
    }
  ],
  ["path", { d: "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7", key: "1ydtos" }],
  ["path", { d: "M7 3v4a1 1 0 0 0 1 1h7", key: "t51u73" }]
];
const Save = createLucideIcon("save", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M12 3v12", key: "1x0j5s" }],
  ["path", { d: "m17 8-5-5-5 5", key: "7q97r8" }],
  ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" }]
];
const Upload = createLucideIcon("upload", __iconNode);
var NAME = "Label";
var Label$1 = reactExports.forwardRef((props, forwardedRef) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Primitive.label,
    {
      ...props,
      ref: forwardedRef,
      onMouseDown: (event) => {
        var _a;
        const target = event.target;
        if (target.closest("button, input, select, textarea")) return;
        (_a = props.onMouseDown) == null ? void 0 : _a.call(props, event);
        if (!event.defaultPrevented && event.detail > 1) event.preventDefault();
      }
    }
  );
});
Label$1.displayName = NAME;
var Root = Label$1;
function Label({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Root,
    {
      "data-slot": "label",
      className: cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      ),
      ...props
    }
  );
}
const DETECTOR_OPTIONS = [
  { value: FeatureDetector.orb, label: "ORB" },
  { value: FeatureDetector.sift, label: "SIFT" },
  { value: FeatureDetector.brisk, label: "BRISK" },
  { value: FeatureDetector.kaze, label: "KAZE" }
];
const MODEL_OPTIONS = [
  { value: "recommended", label: "Recommended Model" },
  { value: TransformationModel.similarity, label: "Similarity" },
  { value: TransformationModel.affine, label: "Affine" },
  { value: TransformationModel.homography, label: "Homography" }
];
const GRID_OPTIONS = [4, 8, 16];
const ACCEPTED_TYPES = ["image/tiff", "image/png", "image/jpeg", "image/tif"];
function formatPct(value) {
  if (value === void 0 || value === null) return "N/A";
  return `${(value * 100).toFixed(1)}%`;
}
function formatPx(value) {
  if (value === void 0 || value === null) return "N/A";
  return value.toFixed(3);
}
function deriveStatus(result) {
  if (!result) return null;
  const { metrics, issues } = result;
  const inlierCount = Number(metrics.inlierCount ?? 0n);
  const outlierCount = Number(metrics.outlierCount ?? 0n);
  const total = inlierCount + outlierCount;
  const inlierRatio = total > 0 ? inlierCount / total : 0;
  if (inlierCount === 0 || inlierRatio < 0.3) return "failed";
  if (issues.some((i) => i.level === "error")) return "failed";
  if (metrics.rmse !== void 0 && metrics.rmse > 3) return "warning";
  if (metrics.spatialCoverage !== void 0 && metrics.spatialCoverage < 0.4) {
    return "warning";
  }
  if (issues.some((i) => i.level === "warning")) return "warning";
  return "pass";
}
function RegistrationWorkflowPage() {
  var _a, _b;
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
  const { pairs, selectedPairId, setSelectedPairId, loadPairs, loading } = useDemoPairs();
  const createJob = useCreateJob();
  const updateJobResult = useUpdateJobResult();
  const [tab, setTab] = reactExports.useState("demo");
  const [sourceDims, setSourceDims] = reactExports.useState(
    null
  );
  const [referenceDims, setReferenceDims] = reactExports.useState(null);
  const [uploadProgress, setUploadProgress] = reactExports.useState(null);
  const [uploadError, setUploadError] = reactExports.useState(null);
  const [saving, setSaving] = reactExports.useState(false);
  const [grayscale, setGrayscale] = reactExports.useState(true);
  const [denoise, setDenoise] = reactExports.useState(true);
  const [contrastEnhancement, setContrastEnhancement] = reactExports.useState(true);
  const [detector, setDetector] = reactExports.useState(
    FeatureDetector.orb
  );
  const [maxFeatures, setMaxFeatures] = reactExports.useState(800);
  const [ratioThreshold, setRatioThreshold] = reactExports.useState(0.75);
  const [maxMatches, setMaxMatches] = reactExports.useState(500);
  const [modelChoice, setModelChoice] = reactExports.useState("recommended");
  const [gridChoice, setGridChoice] = reactExports.useState(8);
  const sourceInputRef = reactExports.useRef(null);
  const referenceInputRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    void loadPairs();
  }, [loadPairs]);
  reactExports.useEffect(() => {
    const current = useWorkflowStore.getState().config;
    const preprocessing = {
      grayscale,
      denoise,
      contrastEnhancement
    };
    const next = {
      ...current,
      preprocessing,
      detector: {
        ...current.detector,
        detector,
        maxFeatures: BigInt(maxFeatures)
      },
      matching: {
        ...current.matching,
        ratioThreshold,
        maxMatches: BigInt(maxMatches)
      },
      model: modelChoice === "recommended" ? current.model : modelChoice
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
    setConfig
  ]);
  const applyDemoPair = reactExports.useCallback(
    (pair) => {
      setImages({
        sourceDataUrl: pair.sourceDataUrl,
        referenceDataUrl: pair.referenceDataUrl,
        sourceName: `${pair.metadata.name} (Source)`,
        referenceName: `${pair.metadata.name} (Reference)`,
        sourceIsDemo: true,
        referenceIsDemo: true
      });
      setSourceDims({ w: pair.width, h: pair.height });
      setReferenceDims({ w: pair.width, h: pair.height });
      setUploadError(null);
    },
    [setImages]
  );
  const readFile = reactExports.useCallback(
    (file, role) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setUploadError(
          `Unsupported format "${file.type || "unknown"}". Use TIFF, GeoTIFF, PNG, or JPG.`
        );
        return;
      }
      setUploadError(null);
      setUploadProgress(0);
      const reader = new FileReader();
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round(e.loaded / e.total * 100));
        }
      };
      reader.onload = () => {
        const dataUrl = reader.result;
        const img = new Image();
        img.onload = () => {
          if (role === "source") {
            setImages({
              sourceDataUrl: dataUrl,
              sourceName: file.name,
              sourceIsDemo: false
            });
            setSourceDims({ w: img.width, h: img.height });
          } else {
            setImages({
              referenceDataUrl: dataUrl,
              referenceName: file.name,
              referenceIsDemo: false
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
    [setImages]
  );
  const handleRun = reactExports.useCallback(() => {
    void run();
  }, [run]);
  const handleReset = reactExports.useCallback(() => {
    reset();
    setSourceDims(null);
    setReferenceDims(null);
    setUploadError(null);
  }, [reset]);
  const status = reactExports.useMemo(() => deriveStatus(result), [result]);
  const inlierRatio = reactExports.useMemo(() => {
    if (!result) return null;
    const inliers = Number(result.metrics.inlierCount ?? 0n);
    const outliers = Number(result.metrics.outlierCount ?? 0n);
    const total = inliers + outliers;
    return total > 0 ? inliers / total : 0;
  }, [result]);
  const saveJob = reactExports.useCallback(() => {
    if (!result || !images.sourceDataUrl || !images.referenceDataUrl) return;
    setSaving(true);
    const source = {
      ref: images.sourceDataUrl,
      metadata: {
        name: images.sourceName ?? "source",
        format: "image/png",
        width: BigInt((sourceDims == null ? void 0 : sourceDims.w) ?? 512),
        height: BigInt((sourceDims == null ? void 0 : sourceDims.h) ?? 512),
        sizeBytes: BigInt(images.sourceDataUrl.length)
      }
    };
    const reference = {
      ref: images.referenceDataUrl,
      metadata: {
        name: images.referenceName ?? "reference",
        format: "image/png",
        width: BigInt((referenceDims == null ? void 0 : referenceDims.w) ?? 512),
        height: BigInt((referenceDims == null ? void 0 : referenceDims.h) ?? 512),
        sizeBytes: BigInt(images.referenceDataUrl.length)
      }
    };
    createJob.mutate(
      { source, reference, config },
      {
        onSuccess: (jobId) => {
          const correspondences = result.correspondences.map((c) => ({
            source: { x: c.source.x, y: c.source.y },
            reference: { x: c.reference.x, y: c.reference.y }
          }));
          const jobResult = {
            report: `Registration completed with ${result.recommendedModel} model. RMSE ${formatPx(result.metrics.rmse)} px, inlier ratio ${formatPct(inlierRatio)}.`,
            metrics: result.metrics,
            registeredOutput: result.registeredImageDataUrl ?? "",
            transformationMatrix: result.transformationMatrix,
            correspondences
          };
          updateJobResult.mutate(
            { jobId, result: jobResult },
            {
              onSuccess: () => {
                ue.success("Job saved to history");
                setSaving(false);
              },
              onError: (err) => {
                ue.error(
                  `Saved job but failed to attach result: ${err.message}`
                );
                setSaving(false);
              }
            }
          );
        },
        onError: (err) => {
          ue.error(`Failed to save job: ${err.message}`);
          setSaving(false);
        }
      }
    );
  }, [
    result,
    images,
    sourceDims,
    referenceDims,
    config,
    createJob,
    updateJobResult,
    inlierRatio
  ]);
  const hasImages = !!images.sourceDataUrl && !!images.referenceDataUrl;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-gradient-primary flex size-9 items-center justify-center rounded-lg text-primary-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Workflow, { className: "size-5", "aria-hidden": "true" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-xl font-semibold tracking-tight", children: "Registration Workflow" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm", children: "Multi-stage lunar image registration pipeline" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground max-w-3xl text-sm", children: "Select a Source (Moving) and Reference (Fixed) image pair, configure the geometric model and preprocessing, then run the in-browser CV pipeline. All metrics are computed from real pixel data — never fabricated." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SectionCard,
      {
        title: "1 · Input Selection",
        description: "Choose a bundled DEMO pair or upload your own Source (Moving) and Reference (Fixed) images.",
        action: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Badge,
          {
            className: "border-border bg-muted text-muted-foreground font-mono text-[10px] uppercase tracking-widest",
            "data-ocid": "workflow.input_badge",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Layers, { className: "size-3", "aria-hidden": "true" }),
              "Step 1 of 4"
            ]
          }
        ),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { value: tab, onValueChange: (v) => setTab(v), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { "data-ocid": "workflow.input_tabs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "demo", "data-ocid": "workflow.tab.demo", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Database, { className: "size-4", "aria-hidden": "true" }),
              "Demo Pairs"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "user", "data-ocid": "workflow.tab.user", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(HardDrive, { className: "size-4", "aria-hidden": "true" }),
              "User Upload"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "demo", className: "mt-4", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingState, { label: "Generating demo pairs…", rows: 3 }) : pairs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            EmptyState,
            {
              icon: Database,
              title: "No demo pairs available",
              description: "Bundled synthetic lunar sample pairs could not be generated.",
              actionLabel: "Retry",
              onAction: () => void loadPairs()
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 md:grid-cols-2 xl:grid-cols-3", children: pairs.map((pair, i) => {
            const active = pair.metadata.id === selectedPairId;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                "data-ocid": `workflow.demo_pair.${i}`,
                onClick: () => {
                  setSelectedPairId(pair.metadata.id);
                  applyDemoPair(pair);
                },
                className: cn(
                  "group flex flex-col gap-3 rounded-xl border bg-card p-3 text-left shadow-subtle transition-all hover:border-primary/50 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                  active && "border-primary ring-ring ring-2"
                ),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 flex-col", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display truncate text-sm font-semibold", children: pair.metadata.name }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-mono text-[11px] uppercase tracking-wider", children: pair.metadata.sensor })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(DataOriginBadge, { origin: "demo" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "img",
                      {
                        src: pair.sourceDataUrl,
                        alt: `${pair.metadata.name} source preview`,
                        className: "aspect-square w-full rounded-md border object-cover"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "img",
                      {
                        src: pair.referenceDataUrl,
                        alt: `${pair.metadata.name} reference preview`,
                        className: "aspect-square w-full rounded-md border object-cover"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2 font-mono text-[11px] text-muted-foreground", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] uppercase tracking-wider", children: "Sun Az" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                        pair.metadata.sunAzimuthDeg,
                        "°"
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] uppercase tracking-wider", children: "Sun El" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                        pair.metadata.sunElevationDeg,
                        "°"
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] uppercase tracking-wider", children: "Scale" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: pair.metadata.scaleRatio.toFixed(2) })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground line-clamp-2 text-xs", children: pair.metadata.description })
                ]
              },
              pair.metadata.id
            );
          }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "user", className: "mt-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                UploadSlot,
                {
                  slot: "source",
                  label: "Source (Moving)",
                  dataUrl: images.sourceDataUrl,
                  name: images.sourceName,
                  isDemo: images.sourceIsDemo,
                  dims: sourceDims,
                  inputRef: sourceInputRef,
                  onPick: () => {
                    var _a2;
                    return (_a2 = sourceInputRef.current) == null ? void 0 : _a2.click();
                  },
                  onFile: (f) => readFile(f, "source")
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                UploadSlot,
                {
                  slot: "reference",
                  label: "Reference (Fixed)",
                  dataUrl: images.referenceDataUrl,
                  name: images.referenceName,
                  isDemo: images.referenceIsDemo,
                  dims: referenceDims,
                  inputRef: referenceInputRef,
                  onPick: () => {
                    var _a2;
                    return (_a2 = referenceInputRef.current) == null ? void 0 : _a2.click();
                  },
                  onFile: (f) => readFile(f, "reference")
                }
              )
            ] }),
            uploadProgress !== null && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Progress, { value: uploadProgress, className: "h-2 flex-1" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground font-mono text-xs tabular-nums", children: [
                uploadProgress,
                "%"
              ] })
            ] }),
            uploadError && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "p",
              {
                "data-ocid": "workflow.upload_error",
                className: "text-destructive mt-3 text-sm",
                children: uploadError
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-3 text-xs", children: "Accepted formats: TIFF, GeoTIFF, PNG, JPG. Uploaded images are labeled USER DATA and processed entirely in your browser." })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SectionCard,
      {
        title: "2 · Configuration",
        description: "Set preprocessing, feature detection, matching, and the geometric transformation model.",
        action: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Badge,
          {
            className: "border-border bg-muted text-muted-foreground font-mono text-[10px] uppercase tracking-widest",
            "data-ocid": "workflow.config_badge",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Settings2, { className: "size-3", "aria-hidden": "true" }),
              "Step 2 of 4"
            ]
          }
        ),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                SlidersHorizontal,
                {
                  className: "text-primary size-4",
                  "aria-hidden": "true"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-sm font-semibold", children: "Preprocessing" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 rounded-lg border bg-muted/30 p-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ToggleRow,
                {
                  label: "Grayscale conversion",
                  description: "Convert to single-channel luminance before processing.",
                  checked: grayscale,
                  onCheckedChange: setGrayscale,
                  dataOcid: "workflow.toggle.grayscale"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ToggleRow,
                {
                  label: "Illumination normalization",
                  description: "Zero-mean, unit-variance normalization to equalize sun-angle differences.",
                  checked: true,
                  onCheckedChange: () => void 0,
                  disabled: true,
                  dataOcid: "workflow.toggle.illumination"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ToggleRow,
                {
                  label: "Denoise",
                  description: "Median filter + Gaussian smoothing to suppress sensor noise.",
                  checked: denoise,
                  onCheckedChange: setDenoise,
                  dataOcid: "workflow.toggle.denoise"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ToggleRow,
                {
                  label: "Contrast enhancement",
                  description: "Histogram stretching with clipping to improve feature visibility.",
                  checked: contrastEnhancement,
                  onCheckedChange: setContrastEnhancement,
                  dataOcid: "workflow.toggle.contrast"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Cpu, { className: "text-primary size-4", "aria-hidden": "true" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-sm font-semibold", children: "Feature Detection & Matching" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 rounded-lg border bg-muted/30 p-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Feature detector", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: detector,
                  onValueChange: (v) => setDetector(v),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      SelectTrigger,
                      {
                        className: "w-full",
                        "data-ocid": "workflow.select.detector",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select detector" })
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: DETECTOR_OPTIONS.map((opt) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: opt.value, children: opt.label }, opt.value)) })
                  ]
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: `Max features (${maxFeatures})`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  min: 50,
                  max: 2e3,
                  value: maxFeatures,
                  "data-ocid": "workflow.input.max_features",
                  onChange: (e) => setMaxFeatures(Math.max(50, Number(e.target.value) || 50))
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: `Ratio threshold (${ratioThreshold.toFixed(2)})`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  min: 0.5,
                  max: 0.95,
                  step: 0.05,
                  value: ratioThreshold,
                  "data-ocid": "workflow.input.ratio_threshold",
                  onChange: (e) => setRatioThreshold(
                    Math.min(
                      0.95,
                      Math.max(0.5, Number(e.target.value) || 0.75)
                    )
                  )
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: `Max matches (${maxMatches})`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  min: 50,
                  max: 2e3,
                  value: maxMatches,
                  "data-ocid": "workflow.input.max_matches",
                  onChange: (e) => setMaxMatches(Math.max(50, Number(e.target.value) || 50))
                }
              ) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 lg:col-span-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                GitCompareArrows,
                {
                  className: "text-primary size-4",
                  "aria-hidden": "true"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-sm font-semibold", children: "Transformation Model & Spatial Distribution" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 rounded-lg border bg-muted/30 p-3 md:grid-cols-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Field, { label: "Transformation model", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Select,
                  {
                    value: modelChoice,
                    onValueChange: (v) => setModelChoice(v),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        SelectTrigger,
                        {
                          className: "w-full",
                          "data-ocid": "workflow.select.model",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select model" })
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: MODEL_OPTIONS.map((opt) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: opt.value, children: opt.label }, opt.value)) })
                    ]
                  }
                ),
                modelChoice === "recommended" && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground mt-1.5 flex items-start gap-1.5 text-xs", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Sparkles,
                    {
                      className: "mt-0.5 size-3.5 shrink-0 text-warning",
                      "aria-hidden": "true"
                    }
                  ),
                  "The recommended model is chosen from actual correspondence and geometric-consistency metrics (inlier ratio, reprojection error, degrees of freedom) — never hard-coded."
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Field, { label: `Spatial grid (${gridChoice}×${gridChoice})`, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("fieldset", { className: "flex gap-2", "aria-label": "Spatial grid size", children: GRID_OPTIONS.map((g) => {
                  const active = gridChoice === g;
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      type: "button",
                      "data-ocid": `workflow.grid.${g}`,
                      "aria-pressed": active,
                      onClick: () => {
                        setGridChoice(g);
                        setSpatialGrid(g);
                      },
                      className: cn(
                        "flex-1 rounded-md border px-3 py-2 font-mono text-sm transition-colors focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                        active ? "border-primary bg-primary/15 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/50"
                      ),
                      children: [
                        g,
                        "×",
                        g
                      ]
                    },
                    g
                  );
                }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1.5 text-xs", children: "Uniformly distributes correspondence points so matches never concentrate in a single region." })
              ] })
            ] })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SectionCard,
      {
        title: "3 · Run Pipeline",
        description: "Execute the 11-stage registration pipeline on the selected pair.",
        action: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Badge,
          {
            className: "border-border bg-muted text-muted-foreground font-mono text-[10px] uppercase tracking-widest",
            "data-ocid": "workflow.run_badge",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "size-3", "aria-hidden": "true" }),
              "Step 3 of 4"
            ]
          }
        ),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            PipelineStageIndicator,
            {
              currentStage,
              isRunning,
              "data-ocid": "workflow.pipeline_stages"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            ProcessingConsole,
            {
              currentStage,
              progress,
              elapsedMs: (result == null ? void 0 : result.elapsedMs) ?? 0,
              log,
              issues,
              isRunning,
              "data-ocid": "workflow.console"
            }
          ),
          error && /* @__PURE__ */ jsxRuntimeExports.jsx(
            ErrorState,
            {
              title: "Registration failed",
              message: error,
              onRetry: handleRun,
              retryLabel: "Retry run"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                "data-ocid": "workflow.run_button",
                onClick: handleRun,
                disabled: !canRun,
                size: "lg",
                className: "gap-2",
                children: isRunning ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "size-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" }),
                  "Running…"
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "size-4", "aria-hidden": "true" }),
                  "Run Registration"
                ] })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                "data-ocid": "workflow.reset_button",
                variant: "outline",
                onClick: handleReset,
                disabled: isRunning,
                className: "gap-2",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "size-4", "aria-hidden": "true" }),
                  "Reset"
                ]
              }
            ),
            !hasImages && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm", children: "Select a demo pair or upload Source and Reference images to enable the run." })
          ] })
        ] })
      }
    ),
    result && /* @__PURE__ */ jsxRuntimeExports.jsx(
      SectionCard,
      {
        title: "4 · Scientific Results",
        description: "Registration summary, key metrics, and scientific explainability.",
        action: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Badge,
          {
            className: "border-border bg-muted text-muted-foreground font-mono text-[10px] uppercase tracking-widest",
            "data-ocid": "workflow.results_badge",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FlaskConical, { className: "size-3", "aria-hidden": "true" }),
              "Step 4 of 4"
            ]
          }
        ),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 rounded-xl border bg-muted/30 p-4 md:flex-row md:items-center md:justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
              status && /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-sm font-semibold", children: "Scientific Result Summary" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-xs", children: "Verdict derived from real correspondence quality, geometric consistency, RMSE, inlier ratio, and spatial coverage." })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  "data-ocid": "workflow.open_correspondence",
                  variant: "outline",
                  size: "sm",
                  className: "gap-1.5",
                  asChild: true,
                  children: /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "/correspondence", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ScanSearch, { className: "size-4", "aria-hidden": "true" }),
                    "Correspondence Viewer"
                  ] })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  "data-ocid": "workflow.open_registration",
                  variant: "outline",
                  size: "sm",
                  className: "gap-1.5",
                  asChild: true,
                  children: /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "/registration", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(GitCompareArrows, { className: "size-4", "aria-hidden": "true" }),
                    "Registration Viewer"
                  ] })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  "data-ocid": "workflow.save_job",
                  size: "sm",
                  className: "gap-1.5",
                  onClick: saveJob,
                  disabled: saving,
                  children: [
                    saving ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "size-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "size-4", "aria-hidden": "true" }),
                    "Save to History"
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              MetricCard,
              {
                label: "RMSE",
                value: formatPx(result.metrics.rmse),
                unit: "px",
                tone: result.metrics.rmse === void 0 ? "default" : result.metrics.rmse > 3 ? "warning" : "success",
                explanation: "Root-mean-square reprojection error over inliers. Computed as the square root of the mean of squared distances between each inlier's reference point and its point reprojected through the fitted model. Lower is better."
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              MetricCard,
              {
                label: "Inlier Ratio",
                value: formatPct(inlierRatio),
                unit: "%",
                tone: inlierRatio === null ? "default" : inlierRatio < 0.3 ? "destructive" : inlierRatio < 0.6 ? "warning" : "success",
                explanation: "Fraction of correspondences accepted as inliers by RANSAC under the fitted model. Computed as inlier count divided by total correspondences. Higher indicates stronger geometric consistency."
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              MetricCard,
              {
                label: "Spatial Coverage",
                value: formatPct(result.metrics.spatialCoverage),
                unit: "%",
                tone: result.metrics.spatialCoverage === void 0 ? "default" : result.metrics.spatialCoverage < 0.4 ? "warning" : "success",
                explanation: "Fraction of the image area spanned by the inlier source points, estimated via an 8×8 grid occupancy count. Higher means matches are spread across the scene rather than concentrated in one region."
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              MetricCard,
              {
                label: "Model",
                value: result.recommendedModel,
                explanation: "The transformation model fitted to the correspondences. Recommended model is selected from actual geometric-consistency metrics across Similarity, Affine, and Homography candidates."
              }
            )
          ] }),
          result.registeredImageDataUrl && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-sm font-semibold", children: "Registered Output" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                PreviewImage,
                {
                  src: result.registeredImageDataUrl,
                  label: "Registered (warped source)"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                PreviewImage,
                {
                  src: result.overlayImageDataUrl,
                  label: "Overlay (warped + reference)"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 rounded-xl border bg-card p-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "text-primary size-4", "aria-hidden": "true" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-sm font-semibold", children: "Scientific Explainability Panel" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ExplainRow,
                {
                  label: "Detector used",
                  value: config.detector.detector.toUpperCase(),
                  detail: `FAST-style corner detection with Harris response scoring and a ${config.detector.maxFeatures.toString()} keypoint budget.`
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ExplainRow,
                {
                  label: "Transformation model",
                  value: result.recommendedModel,
                  detail: "Chosen from actual inlier ratio and reprojection error across Similarity, Affine, and Homography candidates (Occam-preferring)."
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ExplainRow,
                {
                  label: "Matches accepted / rejected",
                  value: `${((_a = result.metrics.inlierCount) == null ? void 0 : _a.toString()) ?? "N/A"} / ${((_b = result.metrics.outlierCount) == null ? void 0 : _b.toString()) ?? "N/A"}`,
                  detail: "Inliers are correspondences consistent with the fitted model under RANSAC; outliers are rejected as geometric inconsistencies."
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ExplainRow,
                {
                  label: "Why points are inliers",
                  value: `RANSAC threshold ${config.thresholds.ransacReprojThreshold.toFixed(1)} px`,
                  detail: "A correspondence is an inlier when its reprojection error through the fitted model is below the RANSAC reprojection threshold."
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ExplainRow,
                {
                  label: "RMSE calculation",
                  value: formatPx(result.metrics.rmse),
                  detail: "Root-mean-square of per-inlier reprojection errors (pixels). Lower indicates a tighter geometric fit."
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ExplainRow,
                {
                  label: "Inlier ratio calculation",
                  value: formatPct(inlierRatio),
                  detail: "Inlier count divided by total correspondences after spatial-grid optimization."
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ExplainRow,
                {
                  label: "Spatial coverage calculation",
                  value: formatPct(result.metrics.spatialCoverage),
                  detail: "Fraction of an 8×8 grid of the source image occupied by inlier points."
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ExplainRow,
                {
                  label: "Sub-pixel refinement",
                  value: "Prototype/Integration Pending",
                  detail: "Sub-pixel refinement is not available in-browser; results are pixel-level. See the warning in the processing console.",
                  pending: true
                }
              )
            ] })
          ] })
        ] })
      }
    )
  ] });
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
  onFile
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 rounded-xl border bg-card p-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-sm font-semibold", children: label }),
      dataUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx(DataOriginBadge, { origin: isDemo ? "demo" : "user" }) : null
    ] }),
    dataUrl ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "img",
        {
          src: dataUrl,
          alt: `${label} preview`,
          className: "aspect-video w-full rounded-md border object-cover"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground min-w-0 truncate text-xs", children: name }),
        dims && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground shrink-0 font-mono text-[11px]", children: [
          dims.w,
          "×",
          dims.h
        ] })
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        "data-ocid": `workflow.upload.${slot}`,
        onClick: onPick,
        className: "flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "size-6", "aria-hidden": "true" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm", children: [
            "Choose ",
            slot === "source" ? "Source" : "Reference",
            " image"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs", children: "TIFF · GeoTIFF · PNG · JPG" })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        ref: inputRef,
        type: "file",
        accept: ACCEPTED_TYPES.join(","),
        className: "hidden",
        "data-ocid": `workflow.file_input.${slot}`,
        onChange: (e) => {
          var _a;
          const file = (_a = e.target.files) == null ? void 0 : _a[0];
          if (file) onFile(file);
          e.target.value = "";
        }
      }
    )
  ] });
}
function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  dataOcid
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 flex-col gap-0.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-xs", children: description })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Switch,
      {
        checked,
        onCheckedChange,
        disabled,
        "data-ocid": dataOcid,
        "aria-label": label
      }
    )
  ] });
}
function Field({ label, children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-muted-foreground text-xs font-medium uppercase tracking-wider", children: label }),
    children
  ] });
}
function PreviewImage({ src, label }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-xs", children: label }),
    src ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      "img",
      {
        src,
        alt: label,
        className: "aspect-video w-full rounded-md border object-cover"
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex aspect-video w-full items-center justify-center rounded-md border border-dashed bg-muted/30 text-muted-foreground text-sm", children: "N/A" })
  ] });
}
function ExplainRow({ label, value, detail, pending }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1 rounded-lg border bg-muted/20 p-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-xs font-medium uppercase tracking-wider", children: label }),
      pending ? /* @__PURE__ */ jsxRuntimeExports.jsx(PrototypeStatusBadge, { status: "pending" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs font-semibold text-foreground", children: value })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs", children: detail })
  ] });
}
export {
  RegistrationWorkflowPage as default
};
