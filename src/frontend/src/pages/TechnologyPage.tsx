import { PrototypeStatusBadge } from "@/components/PrototypeStatusBadge";
import { SectionCard } from "@/components/SectionCard";
import {
  ArrowDown,
  ArrowRight,
  Boxes,
  BrainCircuit,
  Cpu,
  Crosshair,
  Database,
  Gauge,
  GitCompareArrows,
  Layers,
  Map as MapIcon,
  Maximize2,
  Move3d,
  Network,
  RefreshCw,
  RotateCw,
  Scale,
  ScanSearch,
  Server,
  Sparkles,
  Target,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * TechnologyPage: the Technology & Methodology reference for the LunarReg
 * Workbench. Documents the in-browser CV pipeline, the mathematical concepts
 * behind feature detection / matching / geometric verification, the evaluation
 * metrics and how they are computed, a System Architecture flow diagram, a
 * 'How It Works' pipeline visualization, and a Limitations & Future Work
 * section. Future / planned capabilities are always marked with
 * PrototypeStatusBadge status="pending" and never claimed as implemented.
 */

// ---------------------------------------------------------------------------
// Data models
// ---------------------------------------------------------------------------

interface Algorithm {
  name: string;
  stage: string;
  summary: string;
  detail: string;
  formula?: string;
  status: "functional" | "pending";
}

const ALGORITHMS: Algorithm[] = [
  {
    name: "Illumination Normalization",
    stage: "Preprocessing",
    summary:
      "Reduces radiometric differences between Source and Reference imagery.",
    detail:
      "Contrast-limited adaptive histogram equalization (CLAHE) and optional grayscale conversion normalize illumination and sensor-gain differences so that feature responses are comparable across the pair.",
    status: "functional",
  },
  {
    name: "Multi-Scale Processing",
    stage: "Multi-scale",
    summary:
      "Builds an image pyramid to detect features at multiple resolutions.",
    detail:
      "A scale-space pyramid (scaleFactor ≈ 1.2) lets the detector find keypoints robust to the scale differences typical between lunar orbital passes, improving correspondence across resolution mismatches.",
    status: "functional",
  },
  {
    name: "ORB Feature Detection",
    stage: "Feature Detection",
    summary: "Corner detection with orientation and scale from FAST + Harris.",
    detail:
      "ORB detects FAST corners, ranks them by Harris corner response, and assigns orientation from the intensity centroid. Each keypoint carries a position, response strength, octave, and angle.",
    formula: "m_pq = Σ x^p y^q I(x, y)   ·   θ = atan2(m_01, m_10)",
    status: "functional",
  },
  {
    name: "Descriptor Matching",
    stage: "Feature Matching",
    summary: "Binary descriptor matching with ratio-test and cross-check.",
    detail:
      "ORB descriptors are matched by Hamming distance. Lowe's ratio test and a cross-check filter reject ambiguous matches, keeping only high-confidence correspondences.",
    formula: "keep if d1 / d2 < τ   (τ ≈ 0.75)",
    status: "functional",
  },
  {
    name: "Geometric Verification (RANSAC)",
    stage: "Geometric Verification",
    summary: "Fits a transformation model and classifies inliers vs outliers.",
    detail:
      "RANSAC repeatedly samples minimal point sets, fits a candidate model (similarity, affine, or homography), and counts inliers under a reprojection-error threshold. The model with the most inliers is selected.",
    formula: "inlier if ‖ p' − H·p ‖ < ε",
    status: "functional",
  },
  {
    name: "Uniform Spatial Filtering",
    stage: "Spatial Optimization",
    summary: "Distributes correspondences evenly across the image footprint.",
    detail:
      "A spatial grid (4×4, 8×8, or 16×16) keeps the strongest inlier per cell, preventing clustered correspondences from dominating the model fit and improving spatial coverage.",
    status: "functional",
  },
  {
    name: "Sub-Pixel Refinement",
    stage: "Sub-pixel Refinement",
    summary:
      "Higher-precision correspondence refinement below pixel resolution.",
    detail:
      "Planned refinement of correspondence coordinates to sub-pixel precision to reduce residual reprojection error. Not yet integrated into the in-browser engine.",
    status: "pending",
  },
  {
    name: "Advanced AI Correspondence",
    stage: "Feature Matching",
    summary:
      "Deep learned correspondence models (SuperPoint / LoFTR / LightGlue).",
    detail:
      "Planned integration of learned feature extractors and matchers for robustness on low-texture lunar terrain. Requires a GPU-backed inference path and is not implemented.",
    status: "pending",
  },
];

interface Metric {
  name: string;
  symbol: string;
  unit: string;
  definition: string;
  computation: string;
  status: "functional" | "pending";
}

const METRICS: Metric[] = [
  {
    name: "RMSE",
    symbol: "RMSE",
    unit: "px",
    definition:
      "Root mean square reprojection error over inlier correspondences.",
    computation:
      "RMSE = sqrt( (1/N) Σ ‖ p_i' − H·p_i ‖² ), computed over the N inliers after the model fit.",
    status: "functional",
  },
  {
    name: "Inlier Ratio",
    symbol: "ρ",
    unit: "%",
    definition: "Fraction of matched correspondences accepted as inliers.",
    computation:
      "ρ = (# inliers) / (# total correspondences). Higher values indicate a more consistent geometric fit.",
    status: "functional",
  },
  {
    name: "Spatial Coverage",
    symbol: "C",
    unit: "%",
    definition:
      "Fraction of the image footprint spanned by inlier correspondences.",
    computation:
      "C = (cells containing ≥1 inlier) / (total grid cells), measured on the spatial grid.",
    status: "functional",
  },
  {
    name: "Reprojection Error",
    symbol: "e",
    unit: "px",
    definition:
      "Per-correspondence distance between observed and model-projected points.",
    computation:
      "e_i = ‖ p_i' − H·p_i ‖. The per-point error feeds the RMSE aggregate.",
    status: "functional",
  },
  {
    name: "Scale",
    symbol: "s",
    unit: "×",
    definition: "Estimated scale ratio between Source and Reference imagery.",
    computation:
      "Derived from the fitted transformation matrix (e.g. sqrt of the linear-part determinant for similarity/affine models).",
    status: "functional",
  },
  {
    name: "Rotation",
    symbol: "θ",
    unit: "°",
    definition: "Estimated rotation between Source and Reference imagery.",
    computation:
      "Extracted from the rotation component of the fitted transformation matrix.",
    status: "functional",
  },
];

interface ArchitectureNode {
  label: string;
  caption: string;
  icon: LucideIcon;
}

const ARCHITECTURE: ArchitectureNode[] = [
  {
    label: "Frontend",
    caption: "React workbench · upload & review",
    icon: Layers,
  },
  {
    label: "Registration API",
    caption: "Job orchestration & state",
    icon: Server,
  },
  {
    label: "Computer Vision Engine",
    caption: "In-browser CV pipeline",
    icon: Cpu,
  },
  {
    label: "Feature / Matching Engine",
    caption: "Detection & correspondence",
    icon: ScanSearch,
  },
  {
    label: "Geometric Verification",
    caption: "RANSAC model fitting",
    icon: GitCompareArrows,
  },
  { label: "Evaluation", caption: "Metrics & quality checks", icon: Gauge },
  {
    label: "Result Storage",
    caption: "Jobs, results & exports",
    icon: Database,
  },
];

interface PipelineStep {
  label: string;
  caption: string;
  icon: LucideIcon;
  status: "functional" | "pending";
}

const PIPELINE: PipelineStep[] = [
  {
    label: "Source + Reference",
    caption: "Input image pair",
    icon: Layers,
    status: "functional",
  },
  {
    label: "Illumination Normalization",
    caption: "CLAHE · grayscale",
    icon: RefreshCw,
    status: "functional",
  },
  {
    label: "Multi-Scale Processing",
    caption: "Image pyramid",
    icon: Maximize2,
    status: "functional",
  },
  {
    label: "Feature Detection",
    caption: "ORB keypoints",
    icon: Crosshair,
    status: "functional",
  },
  {
    label: "Feature Matching",
    caption: "Ratio-test · cross-check",
    icon: ScanSearch,
    status: "functional",
  },
  {
    label: "Geometric Verification",
    caption: "RANSAC inliers",
    icon: GitCompareArrows,
    status: "functional",
  },
  {
    label: "Uniform Spatial Filtering",
    caption: "Grid distribution",
    icon: Boxes,
    status: "functional",
  },
  {
    label: "Sub-Pixel Refinement",
    caption: "Sub-pixel precision",
    icon: Target,
    status: "pending",
  },
  {
    label: "Registration",
    caption: "Model fit & warp",
    icon: Move3d,
    status: "functional",
  },
  {
    label: "Evaluation",
    caption: "RMSE · coverage",
    icon: Gauge,
    status: "functional",
  },
];

interface FutureWork {
  title: string;
  description: string;
  icon: LucideIcon;
}

const FUTURE_WORK: FutureWork[] = [
  {
    title: "Advanced AI Correspondence Models",
    description:
      "Integrate learned feature extractors and matchers — SuperPoint, LoFTR, and LightGlue — for robust correspondence on low-texture lunar terrain.",
    icon: BrainCircuit,
  },
  {
    title: "GPU Acceleration",
    description:
      "Move heavy detection and matching workloads to a GPU-backed inference path to support larger orbital scenes and faster iteration.",
    icon: Cpu,
  },
  {
    title: "Official Dataset Connectivity",
    description:
      "Direct access to live Chandrayaan-2 OHRC / TMC-2 / IIRS, LRO NAC, and SELENE data instead of bundled DEMO/SAMPLE pairs.",
    icon: Database,
  },
  {
    title: "Orthorectification Support",
    description:
      "Correct terrain-induced geometric distortion so that imagery is projected to a common ground reference before registration.",
    icon: MapIcon,
  },
  {
    title: "DEM-Assisted Registration",
    description:
      "Use a digital elevation model to constrain and refine the transformation, improving accuracy over rugged lunar relief.",
    icon: Network,
  },
  {
    title: "Higher-Precision Sub-Pixel Refinement",
    description:
      "Advance sub-pixel correspondence refinement to reduce residual reprojection error beyond the current prototype precision.",
    icon: Target,
  },
];

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function StageTag({ children }: { children: string }) {
  return (
    <span className="text-muted-foreground font-mono text-[10px] uppercase tracking-widest">
      {children}
    </span>
  );
}

function FlowArrow() {
  return (
    <div className="flex items-center justify-center py-1" aria-hidden="true">
      <ArrowDown className="size-4 text-primary/60" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TechnologyPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* ------------------------------------------------------------------ */}
      {/* Hero                                                               */}
      {/* ------------------------------------------------------------------ */}
      <section
        data-ocid="page.hero"
        className="bg-grid scanline relative overflow-hidden rounded-2xl border bg-card p-6 shadow-subtle md:p-10"
      >
        <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-72 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="bg-gradient-primary flex size-10 items-center justify-center rounded-lg text-primary-foreground">
              <Workflow className="size-5" aria-hidden="true" />
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Technology &amp; Methodology
            </span>
          </div>

          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            How LunarReg{" "}
            <span className="text-gradient-gold">Registers Imagery</span>
          </h1>

          <p className="max-w-2xl text-muted-foreground text-sm leading-relaxed md:text-base">
            An in-browser, feature-based computer-vision pipeline that registers
            lunar surface imagery — Source (moving) against Reference (fixed) —
            through illumination normalization, multi-scale feature detection,
            correspondence matching, geometric verification, and transparent
            evaluation. This page documents the algorithms, the mathematics, and
            the metrics behind every registration.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <PrototypeStatusBadge status="functional" />
            <span className="text-muted-foreground font-mono text-[11px]">
              Core pipeline runs in-browser · advanced capabilities marked as
              Prototype/Integration Pending
            </span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* System Architecture                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section data-ocid="page.architecture" aria-label="System architecture">
        <SectionCard
          title="System Architecture"
          description="Data flow from the frontend workbench through the registration pipeline to result storage"
        >
          <div className="flex flex-col gap-1">
            {ARCHITECTURE.map((node, index) => {
              const Icon = node.icon;
              const isLast = index === ARCHITECTURE.length - 1;
              return (
                <div key={node.label} className="flex flex-col">
                  <div
                    data-ocid={`architecture.node.${index}`}
                    className="flex items-center gap-3 rounded-xl border bg-background px-4 py-3 transition-colors hover:border-primary/50 hover:bg-primary/5"
                  >
                    <span className="bg-gradient-primary flex size-9 shrink-0 items-center justify-center rounded-lg text-primary-foreground">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="font-display text-sm font-semibold">
                        {node.label}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {node.caption}
                      </span>
                    </span>
                    <span className="text-muted-foreground ml-auto font-mono text-[10px]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  {!isLast ? <FlowArrow /> : null}
                </div>
              );
            })}
          </div>
        </SectionCard>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* How It Works pipeline                                               */}
      {/* ------------------------------------------------------------------ */}
      <section data-ocid="page.pipeline" aria-label="How it works pipeline">
        <SectionCard
          title="How It Works"
          description="The end-to-end registration pipeline, stage by stage"
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {PIPELINE.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.label}
                  data-ocid={`pipeline.step.${index}`}
                  className="relative flex flex-col gap-2 rounded-xl border bg-background p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="bg-primary/10 flex size-8 items-center justify-center rounded-md border text-primary">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="text-muted-foreground font-mono text-[10px]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-display text-sm font-semibold leading-tight">
                      {step.label}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {step.caption}
                    </span>
                  </div>
                  <div className="mt-auto pt-1">
                    <PrototypeStatusBadge status={step.status} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-muted-foreground mt-3 font-mono text-[11px]">
            Stages marked Prototype/Integration Pending are planned and not yet
            part of the in-browser engine.
          </p>
        </SectionCard>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CV pipeline & algorithms                                            */}
      {/* ------------------------------------------------------------------ */}
      <section
        data-ocid="page.algorithms"
        aria-label="CV pipeline and algorithms"
      >
        <SectionCard
          title="CV Pipeline & Algorithms"
          description="The mathematical concepts behind detection, matching, and geometric verification"
        >
          <div className="flex flex-col gap-3">
            {ALGORITHMS.map((algo, index) => (
              <div
                key={algo.name}
                data-ocid={`algorithm.item.${index}`}
                className="flex flex-col gap-3 rounded-xl border bg-background p-4 md:flex-row md:items-start"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-sm font-semibold">
                      {algo.name}
                    </span>
                    <StageTag>{algo.stage}</StageTag>
                    <PrototypeStatusBadge status={algo.status} />
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {algo.summary}
                  </p>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {algo.detail}
                  </p>
                </div>
                {algo.formula ? (
                  <div className="w-full shrink-0 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 md:w-64">
                    <span className="text-muted-foreground mb-1 block font-mono text-[10px] uppercase tracking-widest">
                      Concept
                    </span>
                    <code className="text-primary block font-mono text-xs leading-relaxed">
                      {algo.formula}
                    </code>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Evaluation metrics                                                  */}
      {/* ------------------------------------------------------------------ */}
      <section data-ocid="page.metrics" aria-label="Evaluation metrics">
        <SectionCard
          title="Evaluation Metrics"
          description="How registration quality is measured and computed"
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {METRICS.map((metric, index) => (
              <div
                key={metric.name}
                data-ocid={`metric.item.${index}`}
                className="flex flex-col gap-2 rounded-xl border bg-background p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-sm font-semibold">
                    {metric.name}
                  </span>
                  <span className="text-muted-foreground font-mono text-[10px]">
                    {metric.symbol} · {metric.unit}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {metric.definition}
                </p>
                <div className="mt-auto rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                  <span className="text-muted-foreground mb-1 block font-mono text-[10px] uppercase tracking-widest">
                    Computation
                  </span>
                  <p className="text-primary font-mono text-[11px] leading-relaxed">
                    {metric.computation}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground mt-3 font-mono text-[11px]">
            Metric values are reported only when a completed job result is
            available — never fabricated. Where computation is unavailable, the
            workbench shows N/A.
          </p>
        </SectionCard>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Limitations & Future Work                                           */}
      {/* ------------------------------------------------------------------ */}
      <section data-ocid="page.future" aria-label="Limitations and future work">
        <SectionCard
          title="Limitations & Future Work"
          description="Current prototype constraints and the planned roadmap — all clearly marked as future work"
        >
          <div className="mb-4 flex flex-col gap-2 rounded-xl border border-warning/30 bg-warning/5 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-warning" aria-hidden="true" />
              <span className="font-display text-sm font-semibold">
                Current Prototype Limitations
              </span>
            </div>
            <ul className="text-muted-foreground flex list-disc flex-col gap-1 pl-5 text-sm">
              <li>
                Runs entirely in-browser on bundled DEMO/SAMPLE pairs — no live
                official dataset connectivity.
              </li>
              <li>
                Uses classical ORB features; no learned correspondence models
                and no GPU acceleration yet.
              </li>
              <li>
                No orthorectification, DEM-assisted registration, or
                higher-precision sub-pixel refinement.
              </li>
              <li>
                Single image-pair registration per job; batch processing of
                multiple pairs is not supported.
              </li>
            </ul>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {FUTURE_WORK.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  data-ocid={`future.item.${index}`}
                  className="flex flex-col gap-2 rounded-xl border bg-background p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="bg-warning/10 flex size-8 items-center justify-center rounded-md border text-warning">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <PrototypeStatusBadge status="pending" />
                  </div>
                  <span className="font-display text-sm font-semibold leading-tight">
                    {item.title}
                  </span>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
