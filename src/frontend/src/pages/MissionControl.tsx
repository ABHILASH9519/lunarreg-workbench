import { DataOriginBadge } from "@/components/DataOriginBadge";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { PrototypeStatusBadge } from "@/components/PrototypeStatusBadge";
import { SectionCard } from "@/components/SectionCard";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { useJobsQuery } from "@/hooks/useJobs";
import type { JobSummary } from "@/lib/types";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Crosshair,
  FlaskConical,
  Gauge,
  GitCompareArrows,
  Layers,
  Play,
  Rocket,
  Satellite,
  ScanSearch,
  Sparkles,
  Target,
  Workflow,
} from "lucide-react";

/**
 * MissionControlPage: the primary landing experience for the LunarReg
 * Workbench. Presents the mission identity, quick actions, live telemetry
 * stats, recent experiments, and a system status panel that distinguishes
 * functional in-browser components from prototype/pending ones.
 */

const SUPPORTED_SENSORS = ["OHRC", "TMC-2", "IIRS", "LRO NAC", "SELENE"];

interface PipelineComponent {
  name: string;
  description: string;
  status: "functional" | "pending";
}

const PIPELINE_COMPONENTS: PipelineComponent[] = [
  {
    name: "Feature Detection",
    description: "ORB keypoint detection across multi-scale levels",
    status: "functional",
  },
  {
    name: "Feature Matching",
    description: "Descriptor matching with ratio-test & cross-check",
    status: "functional",
  },
  {
    name: "Geometric Verification",
    description: "RANSAC model fitting with inlier/outlier classification",
    status: "functional",
  },
  {
    name: "RMSE Evaluation",
    description: "Reprojection error & spatial coverage metrics",
    status: "functional",
  },
  {
    name: "Sub-pixel Refinement",
    description: "Higher-precision sub-pixel correspondence refinement",
    status: "pending",
  },
  {
    name: "Official Dataset Connectivity",
    description: "Live Chandrayaan-2 / LRO NAC / SELENE data access",
    status: "pending",
  },
  {
    name: "Advanced AI Models",
    description: "SuperPoint / LoFTR / LightGlue deep correspondence",
    status: "pending",
  },
];

function formatTimestamp(timestamp: bigint): string {
  const date = new Date(Number(timestamp / 1_000_000n));
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function modelLabel(model: JobSummary["model"]): string {
  switch (model) {
    case "homography":
      return "Homography";
    case "affine":
      return "Affine";
    case "similarity":
      return "Similarity";
    default:
      return model;
  }
}

export default function MissionControlPage() {
  const navigate = useNavigate();
  const { data: jobs, isLoading, isError, refetch } = useJobsQuery();

  const totalJobs = jobs?.length ?? 0;
  const successfulJobs =
    jobs?.filter((j) => j.status === "completed").length ?? 0;

  // JobSummary does not carry computed metrics, so RMSE and inlier ratio are
  // reported as N/A until a completed job result is available — never fabricated.
  const averageRmse = "N/A";
  const averageInlierRatio = "N/A";

  const recentJobs = jobs ?? [];

  return (
    <div className="flex flex-col gap-8">
      {/* ------------------------------------------------------------------ */}
      {/* Hero / mission identity                                            */}
      {/* ------------------------------------------------------------------ */}
      <section
        data-ocid="page.hero"
        className="bg-grid scanline relative overflow-hidden rounded-2xl border bg-card p-6 shadow-subtle md:p-10"
      >
        <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-72 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-2xl flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="bg-gradient-primary flex size-10 items-center justify-center rounded-lg text-primary-foreground">
                <Satellite className="size-5" aria-hidden="true" />
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
                Lunar Image Registration
              </span>
            </div>

            <h1 className="font-display text-3xl font-bold leading-tight tracking-tight md:text-5xl">
              LunarReg{" "}
              <span className="text-gradient-gold">Mission Control</span>
            </h1>

            <p className="max-w-xl text-muted-foreground text-sm leading-relaxed md:text-base">
              Register lunar surface imagery — Source (moving) against Reference
              (fixed) — through an in-browser feature-based pipeline. Detect
              correspondence points, fit a transformation model, and evaluate
              reprojection error with full scientific transparency.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <DataOriginBadge origin="demo" />
              <span className="text-muted-foreground font-mono text-[11px]">
                Synthetic DEMO/SAMPLE DATA — not official ISRO data
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <Button
              data-ocid="hero.start_registration_button"
              size="lg"
              onClick={() => navigate({ to: "/workflow" })}
              className="gap-2 text-base"
            >
              <Rocket className="size-5" aria-hidden="true" />
              Start New Registration
            </Button>
            <p className="text-muted-foreground font-mono text-[11px]">
              Begin a new Source / Reference registration job
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Quick actions                                                      */}
      {/* ------------------------------------------------------------------ */}
      <section data-ocid="page.quick_actions" aria-label="Quick actions">
        <div className="grid gap-3 sm:grid-cols-3">
          <button
            data-ocid="quick_action.start_registration"
            type="button"
            onClick={() => navigate({ to: "/workflow" })}
            className="group flex items-center gap-3 rounded-xl border bg-card p-4 text-left shadow-subtle transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none"
          >
            <span className="bg-gradient-primary flex size-10 shrink-0 items-center justify-center rounded-lg text-primary-foreground">
              <Workflow className="size-5" aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-display text-sm font-semibold">
                Start New Registration
              </span>
              <span className="text-muted-foreground text-xs">
                Upload Source &amp; Reference imagery
              </span>
            </span>
            <ArrowRight
              className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>

          <button
            data-ocid="quick_action.view_correspondence"
            type="button"
            onClick={() => navigate({ to: "/correspondence" })}
            className="group flex items-center gap-3 rounded-xl border bg-card p-4 text-left shadow-subtle transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-primary/10 text-primary">
              <ScanSearch className="size-5" aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-display text-sm font-semibold">
                View Correspondence
              </span>
              <span className="text-muted-foreground text-xs">
                Inspect matched keypoints &amp; inliers
              </span>
            </span>
            <ArrowRight
              className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>

          <button
            data-ocid="quick_action.run_demo"
            type="button"
            onClick={() => navigate({ to: "/demo" })}
            className="group flex items-center gap-3 rounded-xl border bg-card p-4 text-left shadow-subtle transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-accent/10 text-accent">
              <Play className="size-5" aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-display text-sm font-semibold">
                Run Demo
              </span>
              <span className="text-muted-foreground text-xs">
                Launch a bundled DEMO/SAMPLE pair
              </span>
            </span>
            <ArrowRight
              className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Live telemetry stats                                               */}
      {/* ------------------------------------------------------------------ */}
      <section data-ocid="page.stats" aria-label="Live telemetry">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Total Registration Jobs"
            value={totalJobs}
            icon={Layers}
          />
          <StatCard
            label="Successful Registrations"
            value={successfulJobs}
            icon={CheckCircle2}
          />
          <StatCard
            label="Average RMSE"
            value={averageRmse}
            unit="px"
            icon={Target}
          />
          <StatCard
            label="Average Inlier Ratio"
            value={averageInlierRatio}
            icon={Crosshair}
          />
          <StatCard
            label="Supported Sensors"
            value={SUPPORTED_SENSORS.length}
            icon={Satellite}
          />
        </div>
        <p className="text-muted-foreground mt-2 font-mono text-[11px]">
          Sensors: {SUPPORTED_SENSORS.join(" · ")} · RMSE &amp; inlier ratio
          reported once a completed job result is available
        </p>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Recent experiments + system status                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="grid gap-6 lg:grid-cols-5">
        {/* Recent experiments */}
        <div className="lg:col-span-3">
          <SectionCard
            title="Recent Experiments"
            description="Latest registration jobs across the workbench"
            action={
              <Button
                data-ocid="recent.view_all_button"
                variant="outline"
                size="sm"
                onClick={() => navigate({ to: "/history" })}
                className="gap-1.5"
              >
                View all
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Button>
            }
          >
            {isLoading ? (
              <LoadingState label="Loading experiments…" rows={3} />
            ) : isError ? (
              <ErrorState
                message="Unable to load the experiment list from the backend."
                onRetry={() => void refetch()}
              />
            ) : recentJobs.length === 0 ? (
              <EmptyState
                icon={FlaskConical}
                title="No experiments yet"
                description="Start your first registration to begin building your experiment history."
                actionLabel="Start New Registration"
                onAction={() => navigate({ to: "/workflow" })}
              />
            ) : (
              <ul data-ocid="recent.list" className="flex flex-col gap-2">
                {recentJobs.slice(0, 5).map((job, index) => (
                  <li key={job.id.toString()}>
                    <Link
                      data-ocid={`recent.item.${index}`}
                      to="/jobs/$jobId"
                      params={{ jobId: job.id.toString() }}
                      className="group flex items-center gap-3 rounded-lg border bg-background px-3 py-3 transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-primary/10 text-primary">
                        <GitCompareArrows
                          className="size-4"
                          aria-hidden="true"
                        />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="font-display truncate text-sm font-medium">
                          {job.sourceName} → {job.referenceName}
                        </span>
                        <span className="text-muted-foreground font-mono text-[11px]">
                          {modelLabel(job.model)} ·{" "}
                          {formatTimestamp(job.createdAt)}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span
                          data-ocid={`recent.status.${index}`}
                          className={[
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                            job.status === "completed"
                              ? "border-success/40 bg-success/15 text-success"
                              : job.status === "failed"
                                ? "border-destructive/40 bg-destructive/15 text-destructive"
                                : "border-warning/40 bg-warning/15 text-warning",
                          ].join(" ")}
                        >
                          {job.status}
                        </span>
                        <ArrowRight
                          className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        {/* System status */}
        <div className="lg:col-span-2">
          <SectionCard
            title="System Status"
            description="Pipeline component readiness"
            action={
              <span className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
                <Gauge className="size-3" aria-hidden="true" />
                In-browser
              </span>
            }
          >
            <ul data-ocid="system_status.list" className="flex flex-col gap-3">
              {PIPELINE_COMPONENTS.map((component, index) => (
                <li
                  key={component.name}
                  data-ocid={`system_status.item.${index}`}
                  className="flex flex-col gap-1.5 rounded-lg border bg-background px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <Sparkles
                        className={[
                          "size-4 shrink-0",
                          component.status === "functional"
                            ? "text-primary"
                            : "text-warning",
                        ].join(" ")}
                        aria-hidden="true"
                      />
                      <span className="font-display truncate text-sm font-medium">
                        {component.name}
                      </span>
                    </span>
                    <PrototypeStatusBadge status={component.status} />
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {component.description}
                  </p>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </section>
    </div>
  );
}
