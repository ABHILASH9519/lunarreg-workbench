import { r as reactExports, j as jsxRuntimeExports, a8 as Boxes, B as Button, G as GitCompareArrows } from "./index-CLvvNGC5.js";
import { T as TransformationModel } from "./backend-DPWNum9l.js";
import { M as MetricCard } from "./MetricCard-CUJmwOnQ.js";
import { S as StatusBadge } from "./StatusBadge-BeOJaX2E.js";
import { D as DataOriginBadge, E as ErrorState, L as LoadingState, a as EmptyState } from "./LoadingState-CJmkDIGR.js";
import { S as SectionCard } from "./SectionCard-j39JmNct.js";
import { D as DataTable } from "./DataTable-DvpL2mbN.js";
import { C as ChartContainer, a as ChartTooltip, b as ChartTooltipContent } from "./chart-CdP6psif.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CgpL97RU.js";
import { a as useDemoPairs } from "./useRegistration-CDTivxtS.js";
import { p as preprocess, b as detectFeatures, m as matchDescriptors, e as ransac } from "./cv-engine-jhIfoGkm.js";
import { l as loadImageToImageData, r as rgbaToGray, f as computeMetrics, h as recommendModel } from "./metrics-CXdDL_t5.js";
import { P as Play } from "./play-BxxRfsa9.js";
import { S as Sparkles } from "./sparkles-BnNfqILw.js";
import { B as BarChart, m as CartesianGrid, X as XAxis, Y as YAxis, o as Bar } from "./BarChart-pevpRXUd.js";
import "./circle-check-DcUF21bz.js";
import "./index-goFs2gnd.js";
import "./check-gbVmm_Ow.js";
import "./react-CxBERiit.js";
import "./workflow-store-Bufg8Y0a.js";
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
const MODEL_DOF = {
  similarity: 4,
  affine: 6,
  homography: 8
};
const DEFAULT_CONFIG = {
  preprocessing: {
    denoise: true,
    contrastEnhancement: true
  },
  detector: {
    maxFeatures: 800n
  },
  matching: {
    ratioThreshold: 0.75,
    maxMatches: 500n
  },
  thresholds: {
    ransacReprojThreshold: 3,
    minInlierRatio: 0.3
  }
};
async function runModelComparison(sourceDataUrl, referenceDataUrl) {
  const start = performance.now();
  const [source, reference] = await Promise.all([
    loadImageToImageData(sourceDataUrl, 512),
    loadImageToImageData(referenceDataUrl, 512)
  ]);
  const sourceGray = rgbaToGray(source.imageData);
  const referenceGray = rgbaToGray(reference.imageData);
  const preSource = preprocess(sourceGray, {
    denoise: DEFAULT_CONFIG.preprocessing.denoise,
    contrastEnhancement: DEFAULT_CONFIG.preprocessing.contrastEnhancement
  });
  const preRef = preprocess(referenceGray, {
    denoise: DEFAULT_CONFIG.preprocessing.denoise,
    contrastEnhancement: DEFAULT_CONFIG.preprocessing.contrastEnhancement
  });
  const maxFeatures = Number(DEFAULT_CONFIG.detector.maxFeatures);
  const srcFeat = detectFeatures(preSource.gray, { maxFeatures });
  const refFeat = detectFeatures(preRef.gray, { maxFeatures });
  const matches = matchDescriptors(srcFeat.descriptors, refFeat.descriptors, {
    ratioThreshold: DEFAULT_CONFIG.matching.ratioThreshold,
    maxMatches: Number(DEFAULT_CONFIG.matching.maxMatches)
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
  const threshold = DEFAULT_CONFIG.thresholds.ransacReprojThreshold;
  const rows = [];
  const consistency = [];
  for (const model of MODELS) {
    const modelStart = performance.now();
    const ransacResult = ransac(model, points, {
      reprojThreshold: threshold,
      minInlierRatio: DEFAULT_CONFIG.thresholds.minInlierRatio
    });
    const metrics = computeMetrics({
      matrix: ransacResult.matrix,
      correspondences: ransacResult.correspondences,
      width: source.width,
      height: source.height
    });
    const processingTimeMs = performance.now() - modelStart;
    consistency.push({
      model,
      inlierRatio: ransacResult.inlierRatio,
      meanReprojError: ransacResult.meanReprojError,
      inlierCount: ransacResult.inlierCount,
      dof: MODEL_DOF[model]
    });
    rows.push({
      model,
      label: MODEL_LABELS[model],
      dof: MODEL_DOF[model],
      rmse: metrics.rmse ?? null,
      inlierCount: ransacResult.inlierCount,
      outlierCount: ransacResult.outlierCount,
      inlierRatio: ransacResult.inlierRatio,
      reprojectionError: metrics.reprojectionError ?? null,
      spatialCoverage: metrics.spatialCoverage ?? null,
      processingTimeMs,
      scale: metrics.scale ?? null,
      rotationDeg: metrics.rotationDegrees ?? null,
      accepted: ransacResult.accepted,
      isRecommended: false
    });
  }
  const recommendedModel = recommendModel(consistency);
  for (const row of rows) {
    row.isRecommended = row.model === recommendedModel;
  }
  return {
    rows,
    recommendedModel,
    totalMatches: points.length,
    elapsedMs: performance.now() - start
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
function ModelComparisonPage() {
  const {
    pairs,
    selectedPair,
    selectedPairId,
    setSelectedPairId,
    loadPairs,
    loading
  } = useDemoPairs();
  const [running, setRunning] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const [run, setRun] = reactExports.useState(null);
  const handleLoad = reactExports.useCallback(() => {
    void loadPairs();
  }, [loadPairs]);
  const handleRun = reactExports.useCallback(async () => {
    if (!selectedPair) return;
    setRunning(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 0));
      const result = await runModelComparison(
        selectedPair.sourceDataUrl,
        selectedPair.referenceDataUrl
      );
      setRun(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Model comparison failed");
    } finally {
      setRunning(false);
    }
  }, [selectedPair]);
  const recommendedRow = reactExports.useMemo(
    () => (run == null ? void 0 : run.rows.find((r) => r.isRecommended)) ?? null,
    [run]
  );
  const chartData = reactExports.useMemo(
    () => (run == null ? void 0 : run.rows.map((r) => ({
      model: r.label,
      rmse: r.rmse,
      inlierRatio: r.inlierRatio,
      reprojectionError: r.reprojectionError,
      spatialCoverage: r.spatialCoverage,
      inlierCount: r.inlierCount
    }))) ?? [],
    [run]
  );
  const chartConfig = {
    rmse: { label: "RMSE (px)", color: "var(--chart-1)" },
    inlierRatio: { label: "Inlier Ratio", color: "var(--chart-2)" },
    reprojectionError: { label: "Reproj. Error (px)", color: "var(--chart-3)" },
    spatialCoverage: { label: "Spatial Coverage", color: "var(--chart-4)" }
  };
  const tableColumns = [
    {
      header: "Model",
      cell: (row) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: row.label }),
        row.isRecommended ? /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status: "pass", label: "RECOMMENDED" }) : null
      ] })
    },
    {
      header: "DOF",
      cell: (row) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: row.dof }),
      cellClassName: "text-right font-mono",
      headerClassName: "text-right"
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
      header: "Reproj. Error (px)",
      cell: (row) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: fmt(row.reprojectionError) }),
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
      header: "Scale",
      cell: (row) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: fmt(row.scale, 4) }),
      cellClassName: "text-right font-mono",
      headerClassName: "text-right"
    },
    {
      header: "Rotation (°)",
      cell: (row) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: fmt(row.rotationDeg, 2) }),
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
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-gradient-primary flex size-10 items-center justify-center rounded-lg text-primary-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Boxes, { className: "size-5", "aria-hidden": "true" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 flex-col gap-0.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl font-semibold tracking-tight", children: "Model Comparison" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm", children: "Similarity vs Affine vs Homography — geometric-consistency metrics from real CV runs on the selected pair." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ml-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DataOriginBadge, { origin: "demo" }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SectionCard,
      {
        title: "Experiment Setup",
        description: "Select a DEMO/SAMPLE DATA pair and run the comparison across all three transformation models.",
        action: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            "data-ocid": "model_comparison.run_button",
            onClick: () => void handleRun(),
            disabled: !selectedPair || running,
            className: "gap-1.5",
            children: [
              running ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "size-4 animate-spin rounded-full border-2 border-current border-t-transparent" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "size-4", "aria-hidden": "true" }),
              running ? "Running…" : "Run Comparison"
            ]
          }
        ),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 md:flex-row md:items-end", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex w-full max-w-sm flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "label",
              {
                htmlFor: "model-comparison-pair",
                className: "text-muted-foreground text-xs font-medium uppercase tracking-wider",
                children: "Demo pair"
              }
            ),
            pairs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                "data-ocid": "model_comparison.load_pairs_button",
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
                      id: "model-comparison-pair",
                      "data-ocid": "model_comparison.pair_select",
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
          selectedPair ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-muted-foreground flex flex-col gap-0.5 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs uppercase tracking-widest", children: selectedPair.metadata.sensor }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: selectedPair.metadata.description })
          ] }) : null
        ] })
      }
    ),
    error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      ErrorState,
      {
        message: error,
        onRetry: () => void handleRun(),
        retryLabel: "Retry comparison"
      }
    ) : null,
    running ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingState, { label: "Running CV pipeline across models…", rows: 4 }) : null,
    !running && !error && !run ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      EmptyState,
      {
        icon: GitCompareArrows,
        title: "No comparison yet",
        description: "Select a demo pair and run the comparison to see real RMSE, inlier, reprojection, coverage, scale, rotation, and timing metrics for each model.",
        actionLabel: "Run Comparison",
        onAction: () => void handleRun()
      }
    ) : null,
    run && !running ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        SectionCard,
        {
          title: "Recommended Model",
          description: "Selected from actual geometric-consistency metrics (inlier ratio and reprojection error), preferring the simplest model within tolerance.",
          contentClassName: "flex flex-col gap-4",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-gradient-primary flex size-11 shrink-0 items-center justify-center rounded-lg text-primary-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "size-5", "aria-hidden": "true" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 flex-col gap-0.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-lg font-semibold", children: (recommendedRow == null ? void 0 : recommendedRow.label) ?? "—" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-sm", children: recommendedRow ? `${recommendedRow.inlierCount} inliers · ${fmtPct(
                  recommendedRow.inlierRatio
                )} inlier ratio · RMSE ${fmt(recommendedRow.rmse)} px` : "No recommendation available" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ml-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status: "pass", label: "RECOMMENDED" }) })
            ] }),
            recommendedRow ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                MetricCard,
                {
                  label: "RMSE",
                  value: fmt(recommendedRow.rmse),
                  unit: "px",
                  explanation: "Root-mean-square reprojection error over inliers. Lower is better; measures how well the fitted model maps source points to reference points."
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                MetricCard,
                {
                  label: "Inliers",
                  value: recommendedRow.inlierCount,
                  explanation: "Number of correspondences consistent with the fitted model within the reprojection threshold."
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                MetricCard,
                {
                  label: "Inlier Ratio",
                  value: fmtPct(recommendedRow.inlierRatio),
                  explanation: "Fraction of all correspondences that are inliers. Higher indicates a more geometrically consistent model."
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                MetricCard,
                {
                  label: "Spatial Coverage",
                  value: fmtPct(recommendedRow.spatialCoverage),
                  explanation: "Fraction of the image area spanned by inlier source points. Higher means the model is supported across the scene."
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                MetricCard,
                {
                  label: "Scale",
                  value: fmt(recommendedRow.scale, 4),
                  explanation: "Estimated scale factor between source and reference from the fitted transformation matrix."
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                MetricCard,
                {
                  label: "Rotation",
                  value: fmt(recommendedRow.rotationDeg, 2),
                  unit: "°",
                  explanation: "Estimated rotation between source and reference from the fitted transformation matrix."
                }
              )
            ] }) : null
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SectionCard,
        {
          title: "Metric Comparison",
          description: `${run.totalMatches} correspondences matched · ${run.elapsedMs.toFixed(
            0
          )} ms total. All values from real CV runs.`,
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            DataTable,
            {
              "data-ocid": "model_comparison.table",
              columns: tableColumns,
              data: run.rows,
              rowKey: (row) => row.model
            }
          )
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SectionCard, { title: "RMSE by Model", description: "Lower is better.", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartContainer, { config: chartConfig, className: "h-64", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: chartData, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { vertical: false }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "model", tickLine: false, axisLine: false }),
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
            title: "Inlier Ratio by Model",
            description: "Higher is more geometrically consistent.",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartContainer, { config: chartConfig, className: "h-64", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: chartData, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { vertical: false }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "model", tickLine: false, axisLine: false }),
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
            title: "Reprojection Error by Model",
            description: "Mean reprojection error over inliers (px).",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartContainer, { config: chartConfig, className: "h-64", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: chartData, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { vertical: false }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "model", tickLine: false, axisLine: false }),
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
                  dataKey: "reprojectionError",
                  fill: "var(--color-reprojectionError)",
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
            title: "Spatial Coverage by Model",
            description: "Fraction of image area spanned by inliers.",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartContainer, { config: chartConfig, className: "h-64", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: chartData, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { vertical: false }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "model", tickLine: false, axisLine: false }),
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
        )
      ] })
    ] }) : null
  ] });
}
export {
  ModelComparisonPage as default
};
