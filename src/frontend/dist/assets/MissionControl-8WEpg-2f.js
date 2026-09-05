import { c as createLucideIcon, j as jsxRuntimeExports, a as cn, u as useNavigate, S as Satellite, B as Button, R as Rocket, W as Workflow, b as ScanSearch, F as FlaskConical, L as Link, G as GitCompareArrows, d as Gauge } from "./index-CLvvNGC5.js";
import { D as DataOriginBadge, L as LoadingState, E as ErrorState, a as EmptyState } from "./LoadingState-CJmkDIGR.js";
import { P as PrototypeStatusBadge } from "./PrototypeStatusBadge-DeOLmAG7.js";
import { C as Card, a as CardContent, S as SectionCard } from "./SectionCard-j39JmNct.js";
import { u as useJobsQuery } from "./useJobs-CIHvfDHL.js";
import { A as ArrowRight } from "./arrow-right-U3nSU6-w.js";
import { P as Play } from "./play-BxxRfsa9.js";
import { L as Layers } from "./layers-DXSet5IY.js";
import { C as CircleCheck } from "./circle-check-DcUF21bz.js";
import { T as Target } from "./target-KmvV5HRQ.js";
import { C as Crosshair } from "./crosshair-CgFWU4tH.js";
import { S as Sparkles } from "./sparkles-BnNfqILw.js";
import "./job-history-store-BWqWtVFr.js";
import "./backend-DPWNum9l.js";
import "./react-CxBERiit.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$2 = [
  ["path", { d: "m7 7 10 10", key: "1fmybs" }],
  ["path", { d: "M17 7v10H7", key: "6fjiku" }]
];
const ArrowDownRight = createLucideIcon("arrow-down-right", __iconNode$2);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["path", { d: "M7 7h10v10", key: "1tivn9" }],
  ["path", { d: "M7 17 17 7", key: "1vkiza" }]
];
const ArrowUpRight = createLucideIcon("arrow-up-right", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [["path", { d: "M5 12h14", key: "1ays0h" }]];
const Minus = createLucideIcon("minus", __iconNode);
function StatCard({
  label,
  value,
  unit,
  delta,
  icon: Icon,
  className
}) {
  const deltaDirection = delta === void 0 ? null : delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const DeltaIcon = deltaDirection === "up" ? ArrowUpRight : deltaDirection === "down" ? ArrowDownRight : Minus;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: cn("gap-3 py-4 shadow-subtle", className), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex items-start justify-between gap-3 px-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 flex-col gap-1.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-xs font-medium uppercase tracking-wider", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-baseline gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-2xl font-semibold leading-none tracking-tight", children: value }),
        unit ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-mono text-sm", children: unit }) : null
      ] }),
      delta !== void 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "span",
        {
          className: cn(
            "inline-flex items-center gap-0.5 font-mono text-xs",
            deltaDirection === "up" && "text-success",
            deltaDirection === "down" && "text-destructive",
            deltaDirection === "flat" && "text-muted-foreground"
          ),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DeltaIcon, { className: "size-3", "aria-hidden": "true" }),
            delta > 0 ? "+" : "",
            delta
          ]
        }
      ) : null
    ] }),
    Icon ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary/80 flex size-9 shrink-0 items-center justify-center rounded-md border bg-primary/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "size-4", "aria-hidden": "true" }) }) : null
  ] }) });
}
const SUPPORTED_SENSORS = ["OHRC", "TMC-2", "IIRS", "LRO NAC", "SELENE"];
const PIPELINE_COMPONENTS = [
  {
    name: "Feature Detection",
    description: "ORB keypoint detection across multi-scale levels",
    status: "functional"
  },
  {
    name: "Feature Matching",
    description: "Descriptor matching with ratio-test & cross-check",
    status: "functional"
  },
  {
    name: "Geometric Verification",
    description: "RANSAC model fitting with inlier/outlier classification",
    status: "functional"
  },
  {
    name: "RMSE Evaluation",
    description: "Reprojection error & spatial coverage metrics",
    status: "functional"
  },
  {
    name: "Sub-pixel Refinement",
    description: "Higher-precision sub-pixel correspondence refinement",
    status: "pending"
  },
  {
    name: "Official Dataset Connectivity",
    description: "Live Chandrayaan-2 / LRO NAC / SELENE data access",
    status: "pending"
  },
  {
    name: "Advanced AI Models",
    description: "SuperPoint / LoFTR / LightGlue deep correspondence",
    status: "pending"
  }
];
function formatTimestamp(timestamp) {
  const date = new Date(Number(timestamp / 1000000n));
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(void 0, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
function modelLabel(model) {
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
function MissionControlPage() {
  const navigate = useNavigate();
  const { data: jobs, isLoading, isError, refetch } = useJobsQuery();
  const totalJobs = (jobs == null ? void 0 : jobs.length) ?? 0;
  const successfulJobs = (jobs == null ? void 0 : jobs.filter((j) => j.status === "completed").length) ?? 0;
  const averageRmse = "N/A";
  const averageInlierRatio = "N/A";
  const recentJobs = jobs ?? [];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "section",
      {
        "data-ocid": "page.hero",
        className: "bg-grid scanline relative overflow-hidden rounded-2xl border bg-card p-6 shadow-subtle md:p-10",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute -bottom-32 -left-16 size-72 rounded-full bg-accent/10 blur-3xl" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex max-w-2xl flex-col gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-gradient-primary flex size-10 items-center justify-center rounded-lg text-primary-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Satellite, { className: "size-5", "aria-hidden": "true" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground", children: "Lunar Image Registration" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "font-display text-3xl font-bold leading-tight tracking-tight md:text-5xl", children: [
                "LunarReg",
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gradient-gold", children: "Mission Control" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-xl text-muted-foreground text-sm leading-relaxed md:text-base", children: "Register lunar surface imagery — Source (moving) against Reference (fixed) — through an in-browser feature-based pipeline. Detect correspondence points, fit a transformation model, and evaluate reprojection error with full scientific transparency." }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(DataOriginBadge, { origin: "demo" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-mono text-[11px]", children: "Synthetic DEMO/SAMPLE DATA — not official ISRO data" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 lg:items-end", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  "data-ocid": "hero.start_registration_button",
                  size: "lg",
                  onClick: () => navigate({ to: "/workflow" }),
                  className: "gap-2 text-base",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Rocket, { className: "size-5", "aria-hidden": "true" }),
                    "Start New Registration"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground font-mono text-[11px]", children: "Begin a new Source / Reference registration job" })
            ] })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { "data-ocid": "page.quick_actions", "aria-label": "Quick actions", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          "data-ocid": "quick_action.start_registration",
          type: "button",
          onClick: () => navigate({ to: "/workflow" }),
          className: "group flex items-center gap-3 rounded-xl border bg-card p-4 text-left shadow-subtle transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-gradient-primary flex size-10 shrink-0 items-center justify-center rounded-lg text-primary-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Workflow, { className: "size-5", "aria-hidden": "true" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex min-w-0 flex-col gap-0.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-sm font-semibold", children: "Start New Registration" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-xs", children: "Upload Source & Reference imagery" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ArrowRight,
              {
                className: "ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5",
                "aria-hidden": "true"
              }
            )
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          "data-ocid": "quick_action.view_correspondence",
          type: "button",
          onClick: () => navigate({ to: "/correspondence" }),
          className: "group flex items-center gap-3 rounded-xl border bg-card p-4 text-left shadow-subtle transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex size-10 shrink-0 items-center justify-center rounded-lg border bg-primary/10 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ScanSearch, { className: "size-5", "aria-hidden": "true" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex min-w-0 flex-col gap-0.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-sm font-semibold", children: "View Correspondence" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-xs", children: "Inspect matched keypoints & inliers" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ArrowRight,
              {
                className: "ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5",
                "aria-hidden": "true"
              }
            )
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          "data-ocid": "quick_action.run_demo",
          type: "button",
          onClick: () => navigate({ to: "/demo" }),
          className: "group flex items-center gap-3 rounded-xl border bg-card p-4 text-left shadow-subtle transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex size-10 shrink-0 items-center justify-center rounded-lg border bg-accent/10 text-accent", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "size-5", "aria-hidden": "true" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex min-w-0 flex-col gap-0.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-sm font-semibold", children: "Run Demo" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-xs", children: "Launch a bundled DEMO/SAMPLE pair" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ArrowRight,
              {
                className: "ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5",
                "aria-hidden": "true"
              }
            )
          ]
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { "data-ocid": "page.stats", "aria-label": "Live telemetry", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          StatCard,
          {
            label: "Total Registration Jobs",
            value: totalJobs,
            icon: Layers
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          StatCard,
          {
            label: "Successful Registrations",
            value: successfulJobs,
            icon: CircleCheck
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          StatCard,
          {
            label: "Average RMSE",
            value: averageRmse,
            unit: "px",
            icon: Target
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          StatCard,
          {
            label: "Average Inlier Ratio",
            value: averageInlierRatio,
            icon: Crosshair
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          StatCard,
          {
            label: "Supported Sensors",
            value: SUPPORTED_SENSORS.length,
            icon: Satellite
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground mt-2 font-mono text-[11px]", children: [
        "Sensors: ",
        SUPPORTED_SENSORS.join(" · "),
        " · RMSE & inlier ratio reported once a completed job result is available"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "grid gap-6 lg:grid-cols-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lg:col-span-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        SectionCard,
        {
          title: "Recent Experiments",
          description: "Latest registration jobs across the workbench",
          action: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              "data-ocid": "recent.view_all_button",
              variant: "outline",
              size: "sm",
              onClick: () => navigate({ to: "/history" }),
              className: "gap-1.5",
              children: [
                "View all",
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "size-3.5", "aria-hidden": "true" })
              ]
            }
          ),
          children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingState, { label: "Loading experiments…", rows: 3 }) : isError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            ErrorState,
            {
              message: "Unable to load the experiment list from the backend.",
              onRetry: () => void refetch()
            }
          ) : recentJobs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            EmptyState,
            {
              icon: FlaskConical,
              title: "No experiments yet",
              description: "Start your first registration to begin building your experiment history.",
              actionLabel: "Start New Registration",
              onAction: () => navigate({ to: "/workflow" })
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { "data-ocid": "recent.list", className: "flex flex-col gap-2", children: recentJobs.slice(0, 5).map((job, index) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Link,
            {
              "data-ocid": `recent.item.${index}`,
              to: "/jobs/$jobId",
              params: { jobId: job.id.toString() },
              className: "group flex items-center gap-3 rounded-lg border bg-background px-3 py-3 transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex size-9 shrink-0 items-center justify-center rounded-md border bg-primary/10 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  GitCompareArrows,
                  {
                    className: "size-4",
                    "aria-hidden": "true"
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex min-w-0 flex-1 flex-col gap-0.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-display truncate text-sm font-medium", children: [
                    job.sourceName,
                    " → ",
                    job.referenceName
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground font-mono text-[11px]", children: [
                    modelLabel(job.model),
                    " ·",
                    " ",
                    formatTimestamp(job.createdAt)
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex shrink-0 items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      "data-ocid": `recent.status.${index}`,
                      className: [
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                        job.status === "completed" ? "border-success/40 bg-success/15 text-success" : job.status === "failed" ? "border-destructive/40 bg-destructive/15 text-destructive" : "border-warning/40 bg-warning/15 text-warning"
                      ].join(" "),
                      children: job.status
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    ArrowRight,
                    {
                      className: "size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5",
                      "aria-hidden": "true"
                    }
                  )
                ] })
              ]
            }
          ) }, job.id.toString())) })
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lg:col-span-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        SectionCard,
        {
          title: "System Status",
          description: "Pipeline component readiness",
          action: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Gauge, { className: "size-3", "aria-hidden": "true" }),
            "In-browser"
          ] }),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { "data-ocid": "system_status.list", className: "flex flex-col gap-3", children: PIPELINE_COMPONENTS.map((component, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "li",
            {
              "data-ocid": `system_status.item.${index}`,
              className: "flex flex-col gap-1.5 rounded-lg border bg-background px-3 py-3",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex min-w-0 items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Sparkles,
                      {
                        className: [
                          "size-4 shrink-0",
                          component.status === "functional" ? "text-primary" : "text-warning"
                        ].join(" "),
                        "aria-hidden": "true"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display truncate text-sm font-medium", children: component.name })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(PrototypeStatusBadge, { status: component.status })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs", children: component.description })
              ]
            },
            component.name
          )) })
        }
      ) })
    ] })
  ] });
}
export {
  MissionControlPage as default
};
