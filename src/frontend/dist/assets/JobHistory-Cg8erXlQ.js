import { u as useNavigate, j as jsxRuntimeExports, H as History, B as Button, L as Link } from "./index-CLvvNGC5.js";
import { S as StatusBadge } from "./StatusBadge-BeOJaX2E.js";
import { L as LoadingState, E as ErrorState, a as EmptyState, D as DataOriginBadge } from "./LoadingState-CJmkDIGR.js";
import { S as SectionCard } from "./SectionCard-j39JmNct.js";
import { D as DataTable } from "./DataTable-DvpL2mbN.js";
import { u as useJobsQuery } from "./useJobs-CIHvfDHL.js";
import { P as Plus } from "./plus-BrspAf6U.js";
import "./circle-check-DcUF21bz.js";
import "./job-history-store-BWqWtVFr.js";
import "./backend-DPWNum9l.js";
import "./react-CxBERiit.js";
function formatTimestamp(timestamp) {
  const date = new Date(Number(timestamp / 1000000n));
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat(void 0, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
const MODEL_LABELS = {
  homography: "Homography",
  similarity: "Similarity",
  affine: "Affine"
};
function statusTone(status) {
  switch (status) {
    case "completed":
      return "pass";
    case "failed":
      return "failed";
    default:
      return "warning";
  }
}
function statusLabel(status) {
  switch (status) {
    case "completed":
      return "PASS";
    case "failed":
      return "FAILED";
    case "pending":
      return "PENDING";
    case "processing":
      return "PROCESSING";
    default:
      return "UNKNOWN";
  }
}
function JobHistoryPage() {
  const { data, isLoading, isError, error, refetch } = useJobsQuery();
  const navigate = useNavigate();
  const jobs = data ?? [];
  const columns = [
    {
      header: "Job ID",
      cell: (job) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Link,
        {
          to: "/jobs/$jobId",
          params: { jobId: String(job.id) },
          className: "text-primary font-mono text-xs hover:underline",
          children: [
            "#",
            job.id.toString()
          ]
        }
      )
    },
    {
      header: "Name",
      cell: (job) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        Link,
        {
          to: "/jobs/$jobId",
          params: { jobId: String(job.id) },
          className: "font-medium hover:underline",
          children: job.sourceName
        }
      )
    },
    {
      header: "Source / Reference",
      cell: (job) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 flex-col gap-0.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-sm", children: job.sourceName }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground truncate text-xs", children: job.referenceName })
      ] })
    },
    {
      header: "Model",
      cell: (job) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs", children: MODEL_LABELS[job.model] ?? job.model })
    },
    {
      header: "Status",
      cell: (job) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        StatusBadge,
        {
          status: statusTone(job.status),
          label: statusLabel(job.status)
        }
      )
    },
    {
      header: "RMSE",
      cellClassName: "text-right font-mono text-xs tabular-nums",
      cell: () => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "N/A" })
    },
    {
      header: "Inlier Ratio",
      cellClassName: "text-right font-mono text-xs tabular-nums",
      cell: () => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "N/A" })
    },
    {
      header: "Created",
      cellClassName: "text-muted-foreground text-xs whitespace-nowrap",
      cell: (job) => formatTimestamp(job.createdAt)
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 md:flex-row md:items-end md:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-primary/15 text-primary flex size-9 items-center justify-center rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(History, { className: "size-5", "aria-hidden": "true" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl font-semibold tracking-tight", children: "Job History" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground max-w-2xl text-sm", children: "Persistent record of your registration experiments. Every job stores its full configuration, correspondence points, metrics and registered output so each result is reproducible from the detail page." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { "data-ocid": "history.new_registration_button", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/workflow", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4", "aria-hidden": "true" }),
        "Start New Registration"
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SectionCard,
      {
        title: "Registration Experiments",
        description: "Signed-in user's saved registration jobs",
        action: /* @__PURE__ */ jsxRuntimeExports.jsx(DataOriginBadge, { origin: "user" }),
        children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingState, { label: "Loading job history…", rows: 5 }) : isError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          ErrorState,
          {
            title: "Unable to load job history",
            message: error instanceof Error ? error.message : "The registration history could not be retrieved.",
            onRetry: () => void refetch()
          }
        ) : jobs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          EmptyState,
          {
            icon: History,
            title: "No registration jobs yet",
            description: "Run your first image registration to build a reproducible experiment history. Your saved jobs will appear here.",
            actionLabel: "Start New Registration",
            onAction: () => void navigate({ to: "/workflow" })
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
          DataTable,
          {
            "data-ocid": "history.table",
            columns,
            data: jobs,
            rowKey: (job) => job.id.toString()
          }
        )
      }
    )
  ] });
}
export {
  JobHistoryPage as default
};
