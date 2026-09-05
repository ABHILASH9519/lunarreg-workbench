import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface LoadingStateProps {
  label?: string;
  /** Number of skeleton rows to render. */
  rows?: number;
  className?: string;
}

/**
 * LoadingState: a loading skeleton/spinner state with an optional label.
 */
export function LoadingState({
  label = "Loading…",
  rows = 3,
  className,
}: LoadingStateProps) {
  return (
    <output
      data-ocid="loading_state"
      className={cn(
        "flex flex-col gap-4 rounded-xl border bg-card p-6",
        className,
      )}
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2
          className="text-primary size-4 animate-spin"
          aria-hidden="true"
        />
        <span>{label}</span>
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }, (_, i) => i).map((i) => (
          <Skeleton key={`skeleton-${i}`} className="h-10 w-full" />
        ))}
      </div>
    </output>
  );
}
