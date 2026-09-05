import { c as createLucideIcon, r as reactExports, j as jsxRuntimeExports, F as FlaskConical, B as Button } from "./index-CLvvNGC5.js";
import { F as FeatureDetector, T as TransformationModel } from "./backend-DPWNum9l.js";
import { D as DataOriginBadge, E as ErrorState, L as LoadingState, a as EmptyState } from "./LoadingState-CJmkDIGR.js";
import { S as SectionCard } from "./SectionCard-j39JmNct.js";
import { D as DataTable } from "./DataTable-DvpL2mbN.js";
import { P as PrototypeStatusBadge } from "./PrototypeStatusBadge-DeOLmAG7.js";
import { C as ChartContainer, a as ChartTooltip, b as ChartTooltipContent } from "./chart-CdP6psif.js";
import { I as Input } from "./input-BqQf4ZC_.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CgpL97RU.js";
import { S as Switch } from "./switch-CibPqkZo.js";
import { a as useDemoPairs } from "./useRegistration-CDTivxtS.js";
import { b as detectFeatures, m as matchDescriptors, e as ransac, f as medianFilter, n as normalizeIllumination, g as contrastEnhance } from "./cv-engine-jhIfoGkm.js";
import { l as loadImageToImageData, r as rgbaToGray, f as computeMetrics, i as gaussianBlur } from "./metrics-CXdDL_t5.js";
import { P as Play } from "./play-BxxRfsa9.js";
import { P as Plus } from "./plus-BrspAf6U.js";
import { B as BarChart, m as CartesianGrid, X as XAxis, Y as YAxis, o as Bar } from "./BarChart-pevpRXUd.js";
import "./index-goFs2gnd.js";
import "./check-gbVmm_Ow.js";
import "./react-CxBERiit.js";
import "./workflow-store-Bufg8Y0a.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M3 6h18", key: "d0wm0j" }],
  ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", key: "4alrt4" }],
  ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2", key: "v07s0e" }],
  ["line", { x1: "10", x2: "10", y1: "11", y2: "17", key: "1uufr5" }],
  ["line", { x1: "14", x2: "14", y1: "11", y2: "17", key: "xtxkd" }]
];
const Trash2 = createLucideIcon("trash-2", __iconNode);
const DETECTORS = [
  FeatureDetector.orb,
  FeatureDetector.sift,
  FeatureDetector.brisk,
  FeatureDetector.kaze
];
const DETECTOR_LABELS = {
  orb: "ORB",
  sift: "SIFT",
  brisk: "BRISK",
  kaze: "KAZE"
};
const DETECTOR_PRESETS = {
  orb: { threshold: 24, nmsRadius: 3, blurSigma: 1.2, maxFeatures: 800 },
  sift: { threshold: 18, nmsRadius: 4, blurSigma: 1.6, maxFeatures: 1e3 },
  brisk: { threshold: 30, nmsRadius: 2, blurSigma: 1, maxFeatures: 700 },
  kaze: { threshold: 22, nmsRadius: 3, blurSigma: 1.4, maxFeatures: 900 }
};
const DETECTOR_FUNCTIONAL = {
  orb: true,
  sift: false,
  brisk: false,
  kaze: false
};
const MODELS = [
  TransformationModel.similarity,
  TransformationModel.affine,
  TransformationModel.homography
];
const MODEL_LABELS = {
  similarity: "Similarity",
  affine: "Affine",
  homography: "Homography"
};
let variantCounter = 0;
function createVariant() {
  variantCounter += 1;
  return {
    id: `variant-${variantCounter}`,
    name: `Variant ${variantCounter}`,
    detector: FeatureDetector.orb,
    ratioThreshold: 0.75,
    maxMatches: 500,
    denoise: true,
    illuminationNormalization: true,
    contrastEnhancement: true,
    model: TransformationModel.similarity
  };
}
function preprocessVariant(img, variant) {
  let current = img;
  if (variant.denoise) {
    current = medianFilter(current);
    current = gaussianBlur(current, 1, 1);
  }
  if (variant.illuminationNormalization) {
    current = normalizeIllumination(current);
  }
  if (variant.contrastEnhancement) {
    current = contrastEnhance(current);
  }
  return current;
}
async function runVariant(sourceDataUrl, referenceDataUrl, variant) {
  const start = performance.now();
  const [source, reference] = await Promise.all([
    loadImageToImageData(sourceDataUrl, 512),
    loadImageToImageData(referenceDataUrl, 512)
  ]);
  const sourceGray = preprocessVariant(rgbaToGray(source.imageData), variant);
  const referenceGray = preprocessVariant(
    rgbaToGray(reference.imageData),
    variant
  );
  const preset = DETECTOR_PRESETS[variant.detector];
  const srcFeat = detectFeatures(sourceGray, {
    maxFeatures: preset.maxFeatures,
    threshold: preset.threshold,
    nmsRadius: preset.nmsRadius,
    blurSigma: preset.blurSigma
  });
  const refFeat = detectFeatures(referenceGray, {
    maxFeatures: preset.maxFeatures,
    threshold: preset.threshold,
    nmsRadius: preset.nmsRadius,
    blurSigma: preset.blurSigma
  });
  const matches = matchDescriptors(srcFeat.descriptors, refFeat.descriptors, {
    ratioThreshold: variant.ratioThreshold,
    maxMatches: variant.maxMatches
  });
  const points = matches.map((m) => ({
    source: {
      x: srcFeat.keypoints[m.sourceIndex].x,
      y: srcFeat.keypoints[m.sourceIndex].y
    },
    reference: {
      x: refFeat.keypoints[m.referenceIndex].x,
      y: refFeat.keypoints[m.referenceIndex].y
    }
  }));
  const ransacResult = ransac(variant.model, points, {
    reprojThreshold: 3,
    minInlierRatio: 0.3
  });
  const metrics = computeMetrics({
    model: variant.model,
    matrix: ransacResult.matrix,
    correspondences: ransacResult.correspondences,
    width: source.width,
    height: source.height
  });
  return {
    variantId: variant.id,
    name: variant.name,
    detector: variant.detector,
    model: variant.model,
    rmse: metrics.rmse ?? null,
    inlierRatio: ransacResult.inlierRatio,
    inlierCount: ransacResult.inlierCount,
    spatialCoverage: metrics.spatialCoverage ?? null,
    reprojectionError: metrics.reprojectionError ?? null,
    processingTimeMs: performance.now() - start,
    totalMatches: points.length
  };
}
function fmt(value, digits = 3) {
  if (value === null || !Number.isFinite(value)) return "N/A";
  return value.toFixed(digits);
}
function fmtPct(value) {
  if (value === null || !Number.isFinite(value)) return "N/A";
  return `${(value * 100).toFixed(1)}%`;
}
function ExperimentLabPage() {
  const {
    pairs,
    selectedPair,
    selectedPairId,
    setSelectedPairId,
    loadPairs,
    loading
  } = useDemoPairs();
  const [variants, setVariants] = reactExports.useState(() => [
    createVariant()
  ]);
  const [running, setRunning] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const [results, setResults] = reactExports.useState(null);
  const handleLoad = reactExports.useCallback(() => {
    void loadPairs();
  }, [loadPairs]);
  const updateVariant = reactExports.useCallback(
    (id, patch) => {
      setVariants(
        (prev) => prev.map((v) => v.id === id ? { ...v, ...patch } : v)
      );
    },
    []
  );
  const addVariant = reactExports.useCallback(() => {
    setVariants((prev) => [...prev, createVariant()]);
  }, []);
  const removeVariant = reactExports.useCallback((id) => {
    setVariants((prev) => prev.filter((v) => v.id !== id));
  }, []);
  const handleRun = reactExports.useCallback(async () => {
    if (!selectedPair) return;
    setRunning(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 0));
      const runs = await Promise.all(
        variants.map(
          (v) => runVariant(
            selectedPair.sourceDataUrl,
            selectedPair.referenceDataUrl,
            v
          )
        )
      );
      setResults(runs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Experiment run failed");
    } finally {
      setRunning(false);
    }
  }, [selectedPair, variants]);
  const chartData = reactExports.useMemo(
    () => (results == null ? void 0 : results.map((r) => ({
      name: r.name,
      rmse: r.rmse,
      inlierRatio: r.inlierRatio,
      spatialCoverage: r.spatialCoverage,
      processingTimeMs: r.processingTimeMs
    }))) ?? [],
    [results]
  );
  const chartConfig = {
    rmse: { label: "RMSE (px)", color: "var(--chart-1)" },
    inlierRatio: { label: "Inlier Ratio", color: "var(--chart-2)" },
    spatialCoverage: { label: "Spatial Coverage", color: "var(--chart-4)" },
    processingTimeMs: {
      label: "Processing Time (ms)",
      color: "var(--chart-5)"
    }
  };
  const tableColumns = [
    {
      header: "Variant",
      cell: (row) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-0.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: row.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground font-mono text-[11px]", children: [
          DETECTOR_LABELS[row.detector],
          " · ",
          MODEL_LABELS[row.model]
        ] })
      ] })
    },
    {
      header: "RMSE (px)",
      cell: (row) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: fmt(row.rmse) }),
      cellClassName: "text-right font-mono",
      headerClassName: "text-right"
    },
    {
      header: "Inliers",
      cell: (row) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: row.inlierCount }),
      cellClassName: "text-right font-mono",
      headerClassName: "text-right"
    },
    {
      header: "Inlier Ratio",
      cell: (row) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: fmtPct(row.inlierRatio) }),
      cellClassName: "text-right font-mono",
      headerClassName: "text-right"
    },
    {
      header: "Spatial Coverage",
      cell: (row) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: fmtPct(row.spatialCoverage) }),
      cellClassName: "text-right font-mono",
      headerClassName: "text-right"
    },
    {
      header: "Reproj. Error (px)",
      cell: (row) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: fmt(row.reprojectionError) }),
      cellClassName: "text-right font-mono",
      headerClassName: "text-right"
    },
    {
      header: "Time (ms)",
      cell: (row) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: row.processingTimeMs.toFixed(1) }),
      cellClassName: "text-right font-mono",
      headerClassName: "text-right"
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-gradient-primary flex size-10 items-center justify-center rounded-lg text-primary-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FlaskConical, { className: "size-5", "aria-hidden": "true" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 flex-col gap-0.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl font-semibold tracking-tight", children: "Experiment Lab" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm", children: "Configure multiple variants — detector, matching, preprocessing, and transformation model — and run them side-by-side on a selected pair. All metrics from real CV runs." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ml-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DataOriginBadge, { origin: "demo" }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SectionCard,
      {
        title: "Experiment Setup",
        description: "Select a DEMO/SAMPLE DATA pair, then build the variants to compare.",
        action: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            "data-ocid": "experiment_lab.run_button",
            onClick: () => void handleRun(),
            disabled: !selectedPair || running || variants.length === 0,
            className: "gap-1.5",
            children: [
              running ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "size-4 animate-spin rounded-full border-2 border-current border-t-transparent" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "size-4", "aria-hidden": "true" }),
              running ? "Running…" : "Run Experiments"
            ]
          }
        ),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex w-full max-w-sm flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "label",
              {
                htmlFor: "experiment-lab-pair",
                className: "text-muted-foreground text-xs font-medium uppercase tracking-wider",
                children: "Demo pair"
              }
            ),
            pairs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                "data-ocid": "experiment_lab.load_pairs_button",
                variant: "outline",
                onClick: handleLoad,
                disabled: loading,
                className: "justify-start",
                children: loading ? "Loading pairs…" : "Load demo pairs"
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: selectedPairId ?? void 0,
                onValueChange: (v) => setSelectedPairId(v),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    SelectTrigger,
                    {
                      id: "experiment-lab-pair",
                      "data-ocid": "experiment_lab.pair_select",
                      className: "w-full",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select a demo pair" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: pairs.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: p.metadata.id, children: [
                    p.metadata.name,
                    " · ",
                    p.metadata.sensor
                  ] }, p.metadata.id)) })
                ]
              }
            )
          ] }),
          selectedPair ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm", children: selectedPair.metadata.description }) : null
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SectionCard,
      {
        title: "Variant Builder",
        description: "Add or remove experiment variants and configure each axis. Detector presets are real parameter presets over the unified FAST/Harris core.",
        action: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            "data-ocid": "experiment_lab.add_variant_button",
            variant: "outline",
            onClick: addVariant,
            className: "gap-1.5",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4", "aria-hidden": "true" }),
              "Add Variant"
            ]
          }
        ),
        contentClassName: "flex flex-col gap-4",
        children: variants.map((variant, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-ocid": `experiment_lab.variant.${index + 1}`,
            className: "rounded-xl border bg-card p-4",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-center justify-between gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-gradient-primary flex size-7 shrink-0 items-center justify-center rounded-md font-mono text-xs text-primary-foreground", children: index + 1 }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      "data-ocid": `experiment_lab.variant_name.${index + 1}`,
                      value: variant.name,
                      onChange: (e) => updateVariant(variant.id, { name: e.target.value }),
                      className: "h-8 w-44",
                      "aria-label": `Variant ${index + 1} name`
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    PrototypeStatusBadge,
                    {
                      status: DETECTOR_FUNCTIONAL[variant.detector] ? "functional" : "pending"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    "data-ocid": `experiment_lab.remove_variant_button.${index + 1}`,
                    variant: "ghost",
                    size: "icon",
                    onClick: () => removeVariant(variant.id),
                    disabled: variants.length === 1,
                    "aria-label": `Remove variant ${index + 1}`,
                    className: "text-muted-foreground hover:text-destructive",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-4", "aria-hidden": "true" })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "label",
                    {
                      className: "text-muted-foreground text-xs font-medium uppercase tracking-wider",
                      htmlFor: `detector-${variant.id}`,
                      children: "Detector"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Select,
                    {
                      value: variant.detector,
                      onValueChange: (v) => updateVariant(variant.id, {
                        detector: v
                      }),
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          SelectTrigger,
                          {
                            id: `detector-${variant.id}`,
                            "data-ocid": `experiment_lab.detector_select.${index + 1}`,
                            className: "w-full",
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: DETECTORS.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: d, children: DETECTOR_LABELS[d] }, d)) })
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "label",
                    {
                      className: "text-muted-foreground text-xs font-medium uppercase tracking-wider",
                      htmlFor: `model-${variant.id}`,
                      children: "Transformation model"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Select,
                    {
                      value: variant.model,
                      onValueChange: (v) => updateVariant(variant.id, { model: v }),
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          SelectTrigger,
                          {
                            id: `model-${variant.id}`,
                            "data-ocid": `experiment_lab.model_select.${index + 1}`,
                            className: "w-full",
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: MODELS.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: m, children: MODEL_LABELS[m] }, m)) })
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "label",
                    {
                      className: "text-muted-foreground text-xs font-medium uppercase tracking-wider",
                      htmlFor: `ratio-${variant.id}`,
                      children: "Ratio threshold"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: `ratio-${variant.id}`,
                      "data-ocid": `experiment_lab.ratio_input.${index + 1}`,
                      type: "number",
                      min: 0.1,
                      max: 0.95,
                      step: 0.05,
                      value: variant.ratioThreshold,
                      onChange: (e) => updateVariant(variant.id, {
                        ratioThreshold: Number(e.target.value)
                      })
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "label",
                    {
                      className: "text-muted-foreground text-xs font-medium uppercase tracking-wider",
                      htmlFor: `matches-${variant.id}`,
                      children: "Max matches"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: `matches-${variant.id}`,
                      "data-ocid": `experiment_lab.max_matches_input.${index + 1}`,
                      type: "number",
                      min: 50,
                      max: 2e3,
                      step: 50,
                      value: variant.maxMatches,
                      onChange: (e) => updateVariant(variant.id, {
                        maxMatches: Number(e.target.value)
                      })
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-x-6 gap-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Switch,
                    {
                      id: `denoise-${variant.id}`,
                      "data-ocid": `experiment_lab.denoise_switch.${index + 1}`,
                      checked: variant.denoise,
                      onCheckedChange: (v) => updateVariant(variant.id, { denoise: v })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: `denoise-${variant.id}`, className: "text-sm", children: "Denoise" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Switch,
                    {
                      id: `illum-${variant.id}`,
                      "data-ocid": `experiment_lab.illumination_switch.${index + 1}`,
                      checked: variant.illuminationNormalization,
                      onCheckedChange: (v) => updateVariant(variant.id, {
                        illuminationNormalization: v
                      })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: `illum-${variant.id}`, className: "text-sm", children: "Illumination normalization" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Switch,
                    {
                      id: `contrast-${variant.id}`,
                      "data-ocid": `experiment_lab.contrast_switch.${index + 1}`,
                      checked: variant.contrastEnhancement,
                      onCheckedChange: (v) => updateVariant(variant.id, { contrastEnhancement: v })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: `contrast-${variant.id}`, className: "text-sm", children: "Contrast enhancement" })
                ] })
              ] })
            ]
          },
          variant.id
        ))
      }
    ),
    error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      ErrorState,
      {
        message: error,
        onRetry: () => void handleRun(),
        retryLabel: "Retry experiments"
      }
    ) : null,
    running ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      LoadingState,
      {
        label: `Running ${variants.length} variant${variants.length === 1 ? "" : "s"} through the CV pipeline…`,
        rows: 4
      }
    ) : null,
    !running && !error && !results ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      EmptyState,
      {
        icon: FlaskConical,
        title: "No experiment results yet",
        description: "Configure one or more variants and run the experiments to see real RMSE, inlier ratio, spatial coverage, and processing-time metrics for each configuration.",
        actionLabel: "Run Experiments",
        onAction: () => void handleRun()
      }
    ) : null,
    results && !running ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SectionCard,
        {
          title: "Variant Comparison",
          description: `${results.length} variant${results.length === 1 ? "" : "s"} · ${(selectedPair == null ? void 0 : selectedPair.metadata.name) ?? "selected pair"}. All values from real CV runs.`,
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            DataTable,
            {
              columns: tableColumns,
              data: results,
              rowKey: (row) => row.variantId
            }
          )
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SectionCard, { title: "RMSE by Variant", description: "Lower is better.", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartContainer, { config: chartConfig, className: "h-64", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: chartData, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { vertical: false }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "name", tickLine: false, axisLine: false }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { tickLine: false, axisLine: false, width: 40 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            ChartTooltip,
            {
              cursor: false,
              content: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartTooltipContent, {})
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Bar,
            {
              dataKey: "rmse",
              fill: "var(--color-rmse)",
              radius: 4,
              "data-ocid": "chart_point"
            }
          )
        ] }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          SectionCard,
          {
            title: "Inlier Ratio by Variant",
            description: "Higher is more geometrically consistent.",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartContainer, { config: chartConfig, className: "h-64", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: chartData, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { vertical: false }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "name", tickLine: false, axisLine: false }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                YAxis,
                {
                  tickLine: false,
                  axisLine: false,
                  width: 40,
                  tickFormatter: (v) => `${(v * 100).toFixed(0)}%`
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ChartTooltip,
                {
                  cursor: false,
                  content: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartTooltipContent, {})
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Bar,
                {
                  dataKey: "inlierRatio",
                  fill: "var(--color-inlierRatio)",
                  radius: 4,
                  "data-ocid": "chart_point"
                }
              )
            ] }) })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          SectionCard,
          {
            title: "Spatial Coverage by Variant",
            description: "Fraction of image area spanned by inliers.",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartContainer, { config: chartConfig, className: "h-64", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: chartData, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { vertical: false }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "name", tickLine: false, axisLine: false }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                YAxis,
                {
                  tickLine: false,
                  axisLine: false,
                  width: 40,
                  tickFormatter: (v) => `${(v * 100).toFixed(0)}%`
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ChartTooltip,
                {
                  cursor: false,
                  content: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartTooltipContent, {})
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Bar,
                {
                  dataKey: "spatialCoverage",
                  fill: "var(--color-spatialCoverage)",
                  radius: 4,
                  "data-ocid": "chart_point"
                }
              )
            ] }) })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          SectionCard,
          {
            title: "Processing Time by Variant",
            description: "Wall-clock time for the full CV run (ms).",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartContainer, { config: chartConfig, className: "h-64", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: chartData, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { vertical: false }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "name", tickLine: false, axisLine: false }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { tickLine: false, axisLine: false, width: 40 }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ChartTooltip,
                {
                  cursor: false,
                  content: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartTooltipContent, {})
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Bar,
                {
                  dataKey: "processingTimeMs",
                  fill: "var(--color-processingTimeMs)",
                  radius: 4,
                  "data-ocid": "chart_point"
                }
              )
            ] }) })
          }
        )
      ] })
    ] }) : null
  ] });
}
export {
  ExperimentLabPage as default
};
