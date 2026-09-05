import { c as createLucideIcon, u as useNavigate, r as reactExports, j as jsxRuntimeExports, B as Button, W as Workflow, a as cn, S as Satellite, R as Rocket, D as Database, e as Badge, F as FlaskConical, L as Link, b as ScanSearch, G as GitCompareArrows } from "./index-CLvvNGC5.js";
import { I as Info, M as MetricCard } from "./MetricCard-CUJmwOnQ.js";
import { S as StatusBadge } from "./StatusBadge-BeOJaX2E.js";
import { D as DataOriginBadge, L as LoadingState, a as EmptyState, E as ErrorState } from "./LoadingState-CJmkDIGR.js";
import { a as PipelineStageIndicator, b as ProcessingConsole, R as RotateCcw } from "./ProcessingConsole-DuVHnNYl.js";
import { S as SectionCard } from "./SectionCard-j39JmNct.js";
import { c as useDemoModeStore, u as useRegistration, a as useDemoPairs } from "./useRegistration-CDTivxtS.js";
import { DEMO_DEFS } from "./demo-pairs-DZbS-Ryj.js";
import { u as useWorkflowStore } from "./workflow-store-Bufg8Y0a.js";
import { C as CircleCheck } from "./circle-check-DcUF21bz.js";
import { S as Sun, a as Scaling } from "./sun-BbvhDRjE.js";
import { L as Layers } from "./layers-DXSet5IY.js";
import { A as ArrowRight } from "./arrow-right-U3nSU6-w.js";
import { A as ArrowLeft } from "./arrow-left-BFo6w0hw.js";
import { P as Play } from "./play-BxxRfsa9.js";
import "./cv-engine-jhIfoGkm.js";
import "./metrics-CXdDL_t5.js";
import "./backend-DPWNum9l.js";
import "./check-gbVmm_Ow.js";
import "./react-CxBERiit.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["path", { d: "M2 3h20", key: "91anmk" }],
  ["path", { d: "M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3", key: "2k9sn8" }],
  ["path", { d: "m7 21 5-5 5 5", key: "bip4we" }]
];
const Presentation = createLucideIcon("presentation", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M3 7V5a2 2 0 0 1 2-2h2", key: "aa7l1z" }],
  ["path", { d: "M17 3h2a2 2 0 0 1 2 2v2", key: "4qcy5o" }],
  ["path", { d: "M21 17v2a2 2 0 0 1-2 2h-2", key: "6vwrx8" }],
  ["path", { d: "M7 21H5a2 2 0 0 1-2-2v-2", key: "ioqczr" }],
  ["circle", { cx: "12", cy: "12", r: "1", key: "41hilf" }],
  [
    "path",
    {
      d: "M18.944 12.33a1 1 0 0 0 0-.66 7.5 7.5 0 0 0-13.888 0 1 1 0 0 0 0 .66 7.5 7.5 0 0 0 13.888 0",
      key: "11ak4c"
    }
  ]
];
const ScanEye = createLucideIcon("scan-eye", __iconNode);
const STEPS = [
  { id: 1, label: "Overview" },
  { id: 2, label: "Scenario" },
  { id: 3, label: "Run Pipeline" },
  { id: 4, label: "Results" }
];
const FLOW = [
  {
    title: "Welcome & Overview",
    description: "You are here — the guided presentation flow."
  },
  {
    title: "Select a Demo Scenario",
    description: "Sun Angle, Scale, Viewpoint, or Multi-Modal variation."
  },
  {
    title: "Run the CV Pipeline",
    description: "11-stage in-browser pipeline with a live processing console."
  },
  {
    title: "Scientific Result Summary",
    description: "RMSE, inlier ratio, and transformation model from real computation."
  },
  {
    title: "Deep-Dive Viewers",
    description: "Open the full Correspondence and Registration Viewers."
  }
];
const SCENARIOS = [
  {
    pairId: "demo-ohrc-crater-field",
    title: "Sun Angle Variation",
    variation: "Illumination change",
    description: "The same terrain imaged under a shifted sun azimuth and elevation — the classic repeat-pass illumination problem.",
    icon: Sun
  },
  {
    pairId: "demo-tmc2-mare-basalt",
    title: "Scale Variation",
    variation: "Resolution / altitude change",
    description: "Source and Reference captured at different ground sampling distances, requiring scale-aware matching.",
    icon: Scaling
  },
  {
    pairId: "demo-lro-nac-highland",
    title: "Viewpoint Variation",
    variation: "Orbital geometry change",
    description: "Pronounced scale, rotation, and translation between views — the hardest geometric case for registration.",
    icon: ScanEye
  },
  {
    pairId: "demo-iirs-mineral-spectral",
    title: "Multi-Modal Registration",
    variation: "Sensor / spectral contrast",
    description: "Strong illumination and contrast differences between the pair, stressing appearance-invariant matching.",
    icon: Layers
  }
];
function formatPct(value) {
  if (value === void 0 || value === null) return "N/A";
  return `${(value * 100).toFixed(1)}%`;
}
function formatPx(value) {
  if (value === void 0 || value === null) return "N/A";
  return value.toFixed(3);
}
function formatMatrix(matrix) {
  return matrix.map((v) => v.toFixed(3)).join("  ");
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
function scenarioStats(pairId) {
  const def = DEMO_DEFS.find((d) => d.metadata.id === pairId);
  if (!def) return [];
  const azShift = def.appearance.sunAzimuthShift;
  return [
    { label: "Scale", value: `${def.metadata.scaleRatio.toFixed(2)}×` },
    { label: "Sun Az", value: `${def.metadata.sunAzimuthDeg}°` },
    { label: "Sun El", value: `${def.metadata.sunElevationDeg}°` },
    { label: "Az Shift", value: `${azShift > 0 ? "+" : ""}${azShift}°` }
  ];
}
function DemoModePage() {
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
    loading
  } = useDemoPairs();
  const [step, setStep] = reactExports.useState(1);
  reactExports.useEffect(() => {
    setActive(true);
    void loadPairs();
  }, [setActive, loadPairs]);
  const applyPair = reactExports.useCallback(
    (pair) => {
      reset();
      setImages({
        sourceDataUrl: pair.sourceDataUrl,
        referenceDataUrl: pair.referenceDataUrl,
        sourceName: `${pair.metadata.name} — Source (Moving)`,
        referenceName: `${pair.metadata.name} — Reference (Fixed)`,
        sourceIsDemo: true,
        referenceIsDemo: true
      });
      setSelectedPairId(pair.metadata.id);
    },
    [reset, setImages, setSelectedPairId]
  );
  const selectScenario = reactExports.useCallback(
    (pairId) => {
      const pair = pairs.find((p) => p.metadata.id === pairId);
      if (!pair) return;
      applyPair(pair);
      setStep(3);
    },
    [pairs, applyPair]
  );
  const handleRun = reactExports.useCallback(() => {
    void run();
  }, [run]);
  const handleReset = reactExports.useCallback(() => {
    reset();
  }, [reset]);
  const exitDemo = reactExports.useCallback(() => {
    setActive(false);
    void navigate({ to: "/" });
  }, [setActive, navigate]);
  const status = reactExports.useMemo(() => deriveStatus(result), [result]);
  const inlierRatio = reactExports.useMemo(() => {
    if (!result) return null;
    const inliers = Number(result.metrics.inlierCount ?? 0n);
    const outliers = Number(result.metrics.outlierCount ?? 0n);
    const total = inliers + outliers;
    return total > 0 ? inliers / total : 0;
  }, [result]);
  const hasPair = !!images.sourceDataUrl && !!images.referenceDataUrl;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 md:flex-row md:items-end md:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-gradient-primary flex size-9 items-center justify-center rounded-lg text-primary-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Presentation, { className: "size-5", "aria-hidden": "true" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-xl font-semibold tracking-tight", children: "SIH Presentation Mode" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm", children: "Guided 3–5 minute demo flow" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground max-w-3xl text-sm", children: "A guided walkthrough of the LunarReg registration pipeline for judging. Every result is computed in-browser from real pixel data — never fabricated." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DataOriginBadge, { origin: "demo" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            "data-ocid": "demo.full_workbench_button",
            variant: "outline",
            onClick: exitDemo,
            className: "gap-1.5",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Workflow, { className: "size-4", "aria-hidden": "true" }),
              "Full Workbench"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "nav",
      {
        "data-ocid": "demo.stepper",
        "aria-label": "Presentation steps",
        className: "flex items-center gap-1 overflow-x-auto rounded-xl border bg-card p-2 shadow-subtle",
        children: STEPS.map((s, index) => {
          const current = step === s.id;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 flex-1 items-center gap-1", children: [
            index > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: cn(
                  "h-px flex-1",
                  s.id <= step ? "bg-primary/60" : "bg-border"
                ),
                "aria-hidden": "true"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                "data-ocid": `demo.step.${s.id}`,
                onClick: () => setStep(s.id),
                "aria-current": current ? "step" : void 0,
                className: cn(
                  "flex min-w-0 items-center gap-2 rounded-lg px-3 py-2 transition-colors focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                  current ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                ),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] font-semibold",
                        current ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted"
                      ),
                      children: s.id
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display truncate text-xs font-medium", children: s.label })
                ]
              }
            )
          ] }, s.id);
        })
      }
    ),
    step === 1 && /* @__PURE__ */ jsxRuntimeExports.jsx(OverviewStep, { onBegin: () => setStep(2) }),
    step === 2 && /* @__PURE__ */ jsxRuntimeExports.jsx(
      ScenarioStep,
      {
        loading,
        pairs,
        selectedPairId,
        onSelect: selectScenario,
        onLoadPairs: () => void loadPairs(),
        onBack: () => setStep(1)
      }
    ),
    step === 3 && /* @__PURE__ */ jsxRuntimeExports.jsx(
      RunStep,
      {
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
        onRun: handleRun,
        onReset: handleReset,
        onBack: () => setStep(2),
        onPickScenario: () => setStep(2),
        onViewResults: () => setStep(4)
      }
    ),
    step === 4 && /* @__PURE__ */ jsxRuntimeExports.jsx(
      ResultsStep,
      {
        result,
        status,
        inlierRatio,
        config,
        selectedPair,
        onRunPipeline: () => setStep(3),
        onRunAnother: () => setStep(2),
        onExit: exitDemo
      }
    )
  ] });
}
function OverviewStep({ onBegin }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "section",
    {
      "data-ocid": "demo.overview",
      className: "bg-grid scanline relative overflow-hidden rounded-2xl border bg-card p-6 shadow-subtle md:p-10",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute -bottom-32 -left-16 size-72 rounded-full bg-accent/10 blur-3xl" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex max-w-2xl flex-col gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-gradient-primary flex size-10 items-center justify-center rounded-lg text-primary-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Satellite, { className: "size-5", "aria-hidden": "true" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground", children: "SIH · Live Demonstration" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "font-display text-3xl font-bold leading-tight tracking-tight md:text-5xl", children: [
              "Lunar Image Registration",
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gradient-gold", children: "Live Demo" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-xl text-muted-foreground text-sm leading-relaxed md:text-base", children: "Register lunar surface imagery — Source (Moving) against Reference (Fixed) — through an in-browser feature-based pipeline. Detect correspondence points, fit a transformation model, and evaluate reprojection error with full scientific transparency." }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DataOriginBadge, { origin: "demo" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-mono text-[11px]", children: "Synthetic DEMO/SAMPLE DATA — not official ISRO data" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 lg:items-end", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                "data-ocid": "demo.begin_button",
                size: "lg",
                onClick: onBegin,
                className: "gap-2 text-base",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Rocket, { className: "size-5", "aria-hidden": "true" }),
                  "Begin Presentation"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground font-mono text-[11px]", children: "Guided 3–5 minute flow · full workbench access preserved" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative mt-8 grid gap-3 md:grid-cols-5", children: FLOW.map((item, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-ocid": `demo.flow.${index}`,
            className: "flex flex-col gap-2 rounded-xl border bg-background p-4",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-primary", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "size-3", "aria-hidden": "true" }),
                "Step ",
                index + 1
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-sm font-semibold", children: item.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-xs", children: item.description })
            ]
          },
          item.title
        )) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mt-6 flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-xs text-warning", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "mt-0.5 size-4 shrink-0", "aria-hidden": "true" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Scientific integrity: all imagery is synthetic DEMO/SAMPLE DATA and is never represented as official Chandrayaan-2/ISRO data. All metrics (RMSE, inlier ratio, spatial coverage) are computed in-browser from real pixel data — never fabricated." })
        ] })
      ]
    }
  );
}
function ScenarioStep({
  loading,
  pairs,
  selectedPairId,
  onSelect,
  onLoadPairs,
  onBack
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    SectionCard,
    {
      title: "Select a Demo Scenario",
      description: "Each scenario loads a bundled DEMO/SAMPLE pair engineered for a specific registration challenge.",
      action: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Badge,
        {
          "data-ocid": "demo.scenario_badge",
          className: "border-border bg-muted text-muted-foreground font-mono text-[10px] uppercase tracking-widest",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Layers, { className: "size-3", "aria-hidden": "true" }),
            "Step 2 of 4"
          ]
        }
      ),
      children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingState, { label: "Generating demo pairs…", rows: 3 }) : pairs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        EmptyState,
        {
          icon: Database,
          title: "No demo pairs available",
          description: "Bundled synthetic lunar sample pairs could not be generated.",
          actionLabel: "Retry",
          onAction: onLoadPairs
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 md:grid-cols-2", children: SCENARIOS.map((scenario, index) => {
          const Icon = scenario.icon;
          const active = selectedPairId === scenario.pairId;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              "data-ocid": `demo.scenario.${index}`,
              onClick: () => onSelect(scenario.pairId),
              className: cn(
                "group flex flex-col gap-3 rounded-xl border bg-card p-4 text-left shadow-subtle transition-all hover:border-primary/50 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                active && "border-primary ring-ring ring-2"
              ),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex size-10 shrink-0 items-center justify-center rounded-lg border bg-primary/10 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "size-5", "aria-hidden": "true" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(DataOriginBadge, { origin: "demo" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-0.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-base font-semibold", children: scenario.title }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-mono text-[11px] uppercase tracking-wider", children: scenario.variation })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs", children: scenario.description }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-4 gap-2 rounded-lg border bg-muted/30 p-2 font-mono text-[11px] text-muted-foreground", children: scenarioStats(scenario.pairId).map((stat) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] uppercase tracking-wider", children: stat.label }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-foreground", children: stat.value })
                ] }, stat.label)) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "mt-auto flex items-center gap-1.5 text-xs font-medium text-primary", children: [
                  "Load & Run",
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    ArrowRight,
                    {
                      className: "size-3.5 transition-transform group-hover:translate-x-0.5",
                      "aria-hidden": "true"
                    }
                  )
                ] })
              ]
            },
            scenario.pairId
          );
        }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-sm font-semibold", children: "All Bundled DEMO Pairs" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { "data-ocid": "demo.pair_list", className: "flex flex-col gap-2", children: pairs.map((pair, index) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              "data-ocid": `demo.pair.${index}`,
              onClick: () => onSelect(pair.metadata.id),
              className: cn(
                "group flex w-full items-center gap-3 rounded-lg border bg-card px-3 py-3 text-left shadow-subtle transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                selectedPairId === pair.metadata.id && "border-primary ring-ring ring-2"
              ),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex min-w-0 flex-1 flex-col gap-0.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display truncate text-sm font-medium", children: pair.metadata.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground font-mono text-[11px] uppercase tracking-wider", children: [
                    pair.metadata.sensor,
                    " · Scale",
                    " ",
                    pair.metadata.scaleRatio.toFixed(2),
                    "× · Sun",
                    " ",
                    pair.metadata.sunAzimuthDeg,
                    "° /",
                    " ",
                    pair.metadata.sunElevationDeg,
                    "°"
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  ArrowRight,
                  {
                    className: "size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5",
                    "aria-hidden": "true"
                  }
                )
              ]
            }
          ) }, pair.metadata.id)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            "data-ocid": "demo.back_to_overview_button",
            variant: "outline",
            onClick: onBack,
            className: "gap-1.5",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "size-4", "aria-hidden": "true" }),
              "Back to Overview"
            ]
          }
        ) })
      ] })
    }
  );
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
  onViewResults
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    SectionCard,
    {
      title: "Run the CV Pipeline",
      description: "Execute the 11-stage registration pipeline on the selected DEMO/SAMPLE pair.",
      action: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Badge,
        {
          "data-ocid": "demo.run_badge",
          className: "border-border bg-muted text-muted-foreground font-mono text-[10px] uppercase tracking-widest",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "size-3", "aria-hidden": "true" }),
            "Step 3 of 4"
          ]
        }
      ),
      children: !hasPair ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        EmptyState,
        {
          icon: Database,
          title: "No scenario selected",
          description: "Choose a demo scenario to load its bundled DEMO/SAMPLE pair into the pipeline.",
          actionLabel: "Select Scenario",
          onAction: onPickScenario
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            PairPreview,
            {
              label: "Source (Moving)",
              dataUrl: images.sourceDataUrl,
              name: images.sourceName
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            PairPreview,
            {
              label: "Reference (Fixed)",
              dataUrl: images.referenceDataUrl,
              name: images.referenceName
            }
          )
        ] }),
        selectedPair && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground text-xs", children: [
          selectedPair.metadata.name,
          " · ",
          selectedPair.metadata.sensor,
          " —",
          " ",
          selectedPair.metadata.description
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          PipelineStageIndicator,
          {
            currentStage,
            isRunning,
            "data-ocid": "demo.pipeline_stages"
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
            "data-ocid": "demo.console"
          }
        ),
        error && /* @__PURE__ */ jsxRuntimeExports.jsx(
          ErrorState,
          {
            title: "Registration failed",
            message: error,
            onRetry: onRun,
            retryLabel: "Retry run"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              "data-ocid": "demo.run_button",
              onClick: onRun,
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
              "data-ocid": "demo.reset_button",
              variant: "outline",
              onClick: onReset,
              disabled: isRunning,
              className: "gap-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "size-4", "aria-hidden": "true" }),
                "Reset"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              "data-ocid": "demo.back_to_scenarios_button",
              variant: "outline",
              onClick: onBack,
              className: "gap-1.5",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "size-4", "aria-hidden": "true" }),
                "Back to Scenarios"
              ]
            }
          ),
          result && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              "data-ocid": "demo.view_results_button",
              onClick: onViewResults,
              size: "lg",
              className: "ml-auto gap-2",
              children: [
                "View Scientific Results",
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "size-4", "aria-hidden": "true" })
              ]
            }
          )
        ] })
      ] })
    }
  );
}
function ResultsStep({
  result,
  status,
  inlierRatio,
  config,
  selectedPair,
  onRunPipeline,
  onRunAnother,
  onExit
}) {
  var _a, _b, _c, _d;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    SectionCard,
    {
      title: "Scientific Result Summary",
      description: "Registration summary, key metrics, and scientific explainability — all computed from the real pipeline run.",
      action: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Badge,
        {
          "data-ocid": "demo.results_badge",
          className: "border-border bg-muted text-muted-foreground font-mono text-[10px] uppercase tracking-widest",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FlaskConical, { className: "size-3", "aria-hidden": "true" }),
            "Step 4 of 4"
          ]
        }
      ),
      children: !result ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        EmptyState,
        {
          icon: FlaskConical,
          title: "No results yet",
          description: "Run the pipeline to compute a scientific result summary from real pixel data.",
          actionLabel: "Run Pipeline",
          onAction: onRunPipeline
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 rounded-xl border bg-muted/30 p-4 md:flex-row md:items-center md:justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            status && /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-sm font-semibold", children: "Scientific Result Summary" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-xs", children: "Verdict derived from real correspondence quality, RMSE, inlier ratio, and spatial coverage." })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                "data-ocid": "demo.open_correspondence",
                variant: "outline",
                size: "sm",
                className: "gap-1.5",
                asChild: true,
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/correspondence", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ScanSearch, { className: "size-4", "aria-hidden": "true" }),
                  "Correspondence Viewer"
                ] })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                "data-ocid": "demo.open_registration",
                variant: "outline",
                size: "sm",
                className: "gap-1.5",
                asChild: true,
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/registration", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(GitCompareArrows, { className: "size-4", "aria-hidden": "true" }),
                  "Registration Viewer"
                ] })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3", children: [
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
              label: "Transformation Model",
              value: result.recommendedModel,
              explanation: "The transformation model fitted to the correspondences. Recommended model is selected from actual geometric-consistency metrics across Similarity, Affine, and Homography candidates."
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            MetricCard,
            {
              label: "Correspondence Points",
              value: `${((_a = result.metrics.inlierCount) == null ? void 0 : _a.toString()) ?? "N/A"} / ${((_b = result.metrics.outlierCount) == null ? void 0 : _b.toString()) ?? "N/A"}`,
              explanation: "Inliers / outliers after RANSAC geometric verification and spatial-grid optimization. Inliers are consistent with the fitted model; outliers are rejected."
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            MetricCard,
            {
              label: "Pipeline Time",
              value: (result.elapsedMs / 1e3).toFixed(1),
              unit: "s",
              explanation: "Wall-clock time for the full in-browser pipeline run: preprocessing, multi-scale feature extraction, matching, geometric verification, spatial optimization, and evaluation."
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
                label: "Transformation matrix",
                value: formatMatrix(result.transformationMatrix),
                detail: "Row-major 3×3 matrix fitted to the inlier correspondences."
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ExplainRow,
              {
                label: "Matches accepted / rejected",
                value: `${((_c = result.metrics.inlierCount) == null ? void 0 : _c.toString()) ?? "N/A"} / ${((_d = result.metrics.outlierCount) == null ? void 0 : _d.toString()) ?? "N/A"}`,
                detail: "Inliers are correspondences consistent with the fitted model under RANSAC; outliers are rejected as geometric inconsistencies."
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ExplainRow,
              {
                label: "RANSAC threshold",
                value: `${config.thresholds.ransacReprojThreshold.toFixed(1)} px`,
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
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              "data-ocid": "demo.run_another_button",
              variant: "outline",
              onClick: onRunAnother,
              className: "gap-1.5",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "size-4", "aria-hidden": "true" }),
                "Run Another Scenario"
              ]
            }
          ),
          selectedPair && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground font-mono text-[11px]", children: [
            selectedPair.metadata.name,
            " · DEMO/SAMPLE DATA"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              "data-ocid": "demo.exit_workbench_button",
              onClick: onExit,
              className: "ml-auto gap-1.5",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Workflow, { className: "size-4", "aria-hidden": "true" }),
                "Full Workbench"
              ]
            }
          )
        ] })
      ] })
    }
  );
}
function PairPreview({ label, dataUrl, name }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 rounded-xl border bg-card p-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-sm font-semibold", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DataOriginBadge, { origin: "demo" })
    ] }),
    dataUrl ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "img",
        {
          src: dataUrl,
          alt: `${label} preview`,
          className: "aspect-square w-full rounded-md border object-cover"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground min-w-0 truncate text-xs", children: name })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex aspect-square w-full items-center justify-center rounded-md border border-dashed bg-muted/30 text-muted-foreground text-sm", children: "N/A" })
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
      pending ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        Badge,
        {
          className: "border-warning/40 bg-warning/15 text-warning font-mono text-[10px] uppercase tracking-wider",
          "data-ocid": "demo.pending_badge",
          children: "Prototype/Integration Pending"
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs font-semibold text-foreground", children: value })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs", children: detail })
  ] });
}
export {
  DemoModePage as default
};
