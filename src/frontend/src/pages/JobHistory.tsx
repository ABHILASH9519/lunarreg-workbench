import {
  DataOriginBadge,
  DataTable,
  EmptyState,
  ErrorState,
  LoadingState,
  SectionCard,
  StatusBadge,
} from "@/components";
import type { DataTableColumn } from "@/components";
import { Button } from "@/components/ui/button";
import { useJobsQuery } from "@/hooks/useJobs";
import type { JobStatus, JobSummary, TransformationModel } from "@/lib/types";
import { Link, useNavigate } from "@tanstack/react-router";
import { History, Plus } from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a backend nanosecond timestamp to a formatted date string. */
function formatTimestamp(timestamp: bigint): string {
  const date = new Date(Number(timestamp / 1_000_000n));
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const MODEL_LABELS: Record<TransformationModel, string> = {
  homography: "Homography",
  similarity: "Similarity",
  affine: "Affine",
};

/** Map a backend job status to the PASS / WARNING / FAILED badge tone. */
function statusTone(status: JobStatus): "pass" | "warning" | "failed" {
  switch (status) {
    case "completed":
      return "pass";
    case "failed":
      return "failed";
    default:
      return "warning";
  }
}

function statusLabel(status: JobStatus): string {
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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function JobHistoryPage() {
  const { data, isLoading, isError, error, refetch } = useJobsQuery();
  const navigate = useNavigate();

  const jobs = data ?? [];

  const columns: DataTableColumn<JobSummary>[] = [
    {
      header: "Job ID",
      cell: (job) => (
        <Link
          to="/jobs/$jobId"
          params={{ jobId: String(job.id) }}
          className="text-primary font-mono text-xs hover:underline"
        >
          #{job.id.toString()}
        </Link>
      ),
    },
    {
      header: "Name",
      cell: (job) => (
        <Link
          to="/jobs/$jobId"
          params={{ jobId: String(job.id) }}
          className="font-medium hover:underline"
        >
          {job.sourceName}
        </Link>
      ),
    },
    {
      header: "Source / Reference",
      cell: (job) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm">{job.sourceName}</span>
          <span className="text-muted-foreground truncate text-xs">
            {job.referenceName}
          </span>
        </div>
      ),
    },
    {
      header: "Model",
      cell: (job) => (
        <span className="font-mono text-xs">
          {MODEL_LABELS[job.model] ?? job.model}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (job) => (
        <StatusBadge
          status={statusTone(job.status)}
          label={statusLabel(job.status)}
        />
      ),
    },
    {
      header: "RMSE",
      cellClassName: "text-right font-mono text-xs tabular-nums",
      cell: () => <span className="text-muted-foreground">N/A</span>,
    },
    {
      header: "Inlier Ratio",
      cellClassName: "text-right font-mono text-xs tabular-nums",
      cell: () => <span className="text-muted-foreground">N/A</span>,
    },
    {
      header: "Created",
      cellClassName: "text-muted-foreground text-xs whitespace-nowrap",
      cell: (job) => formatTimestamp(job.createdAt),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="bg-primary/15 text-primary flex size-9 items-center justify-center rounded-lg">
              <History className="size-5" aria-hidden="true" />
            </span>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Job History
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Persistent record of your registration experiments. Every job stores
            its full configuration, correspondence points, metrics and
            registered output so each result is reproducible from the detail
            page.
          </p>
        </div>
        <Button data-ocid="history.new_registration_button" asChild>
          <Link to="/workflow">
            <Plus className="size-4" aria-hidden="true" />
            Start New Registration
          </Link>
        </Button>
      </div>

      <SectionCard
        title="Registration Experiments"
        description="Signed-in user's saved registration jobs"
        action={<DataOriginBadge origin="user" />}
      >
        {isLoading ? (
          <LoadingState label="Loading job history…" rows={5} />
        ) : isError ? (
          <ErrorState
            title="Unable to load job history"
            message={
              error instanceof Error
                ? error.message
                : "The registration history could not be retrieved."
            }
            onRetry={() => void refetch()}
          />
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={History}
            title="No registration jobs yet"
            description="Run your first image registration to build a reproducible experiment history. Your saved jobs will appear here."
            actionLabel="Start New Registration"
            onAction={() => void navigate({ to: "/workflow" })}
          />
        ) : (
          <DataTable
            data-ocid="history.table"
            columns={columns}
            data={jobs}
            rowKey={(job) => job.id.toString()}
          />
        )}
      </SectionCard>
    </div>
  );
}
