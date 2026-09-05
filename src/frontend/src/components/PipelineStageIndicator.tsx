import { PIPELINE_STAGES, type PipelineStage, STAGE_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";

export interface PipelineStageIndicatorProps {
  /** The currently active stage, or null when idle. */
  currentStage: PipelineStage | null;
  /** True while the pipeline is running. */
  isRunning?: boolean;
  className?: string;
}

/**
 * PipelineStageIndicator: a horizontal stepper showing the 11 registration
 * stages with current / completed / pending states.
 */
export function PipelineStageIndicator({
  currentStage,
  isRunning = false,
  className,
}: PipelineStageIndicatorProps) {
  const currentIndex = currentStage
    ? PIPELINE_STAGES.indexOf(currentStage)
    : -1;

  return (
    <ol
      className={cn(
        "flex w-full items-start gap-1 overflow-x-auto pb-1",
        className,
      )}
      aria-label="Registration pipeline stages"
    >
      {PIPELINE_STAGES.map((stage, index) => {
        const completed = currentIndex > index;
        const current = currentIndex === index;
        const pending = currentIndex < index;
        return (
          <li
            key={stage}
            className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
          >
            <div className="flex w-full items-center">
              <span
                className={cn(
                  "h-px flex-1",
                  index === 0
                    ? "bg-transparent"
                    : completed
                      ? "bg-primary/60"
                      : "bg-border",
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold transition-colors",
                  completed &&
                    "border-primary bg-primary text-primary-foreground",
                  current &&
                    "border-primary bg-primary/15 text-primary ring-ring ring-2",
                  pending && "border-border bg-muted text-muted-foreground",
                )}
                aria-current={current ? "step" : undefined}
              >
                {completed ? (
                  <Check className="size-3.5" aria-hidden="true" />
                ) : current && isRunning ? (
                  <Loader2
                    className="size-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={cn(
                  "h-px flex-1",
                  index === PIPELINE_STAGES.length - 1
                    ? "bg-transparent"
                    : completed || current
                      ? "bg-primary/60"
                      : "bg-border",
                )}
                aria-hidden="true"
              />
            </div>
            <span
              className={cn(
                "max-w-full truncate text-[10px] font-medium",
                completed && "text-primary",
                current && "text-foreground",
                pending && "text-muted-foreground",
              )}
            >
              {STAGE_LABELS[stage]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
