import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  type PipelineEvent,
  type PipelineIssue,
  type PipelineStage,
  STAGE_LABELS,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";

export interface ProcessingConsoleProps {
  /** The currently active stage, or null when idle. */
  currentStage: PipelineStage | null;
  /** Overall progress 0..1. */
  progress: number;
  /** Elapsed time in milliseconds. */
  elapsedMs: number;
  /** Ordered pipeline log events. */
  log: PipelineEvent[];
  /** Warnings and errors surfaced during processing. */
  issues: PipelineIssue[];
  /** True while the pipeline is running. */
  isRunning?: boolean;
  className?: string;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * ProcessingConsole: a live console showing the current stage, progress bar,
 * elapsed time, completed stages, and any warnings or errors.
 */
export function ProcessingConsole({
  currentStage,
  progress,
  elapsedMs,
  log,
  issues,
  isRunning = false,
  className,
}: ProcessingConsoleProps) {
  const percent = Math.round(progress * 100);
  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-subtle",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {isRunning ? (
            <Loader2
              className="text-primary size-4 animate-spin"
              aria-hidden="true"
            />
          ) : errors.length > 0 ? (
            <XCircle className="text-destructive size-4" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="text-success size-4" aria-hidden="true" />
          )}
          <span className="font-mono text-sm font-medium">
            {currentStage ? STAGE_LABELS[currentStage] : "Idle"}
          </span>
        </div>
        <span className="text-muted-foreground font-mono text-xs tabular-nums">
          {formatElapsed(elapsedMs)}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Progress value={percent} className="h-2 flex-1" />
        <span className="text-muted-foreground font-mono text-xs tabular-nums w-10 text-right">
          {percent}%
        </span>
      </div>

      {(errors.length > 0 || warnings.length > 0) && (
        <div className="flex flex-col gap-1.5">
          {errors.map((issue) => (
            <div
              key={`err-${issue.stage}-${issue.message}`}
              className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive"
            >
              <XCircle
                className="mt-0.5 size-3.5 shrink-0"
                aria-hidden="true"
              />
              <span>{issue.message}</span>
            </div>
          ))}
          {warnings.map((issue) => (
            <div
              key={`warn-${issue.stage}-${issue.message}`}
              className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-2.5 py-1.5 text-xs text-warning"
            >
              <AlertTriangle
                className="mt-0.5 size-3.5 shrink-0"
                aria-hidden="true"
              />
              <span>{issue.message}</span>
            </div>
          ))}
        </div>
      )}

      <Separator />

      <div className="flex max-h-40 flex-col gap-1 overflow-y-auto pr-1">
        {log.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            Awaiting pipeline events…
          </p>
        ) : (
          log.map((event) => (
            <div
              key={`${event.stage}-${event.message}`}
              className="flex items-center gap-2 font-mono text-xs text-muted-foreground"
            >
              <span className="text-primary/70 shrink-0 tabular-nums">
                {Math.round(event.progress * 100)}%
              </span>
              <span className="truncate">{event.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
