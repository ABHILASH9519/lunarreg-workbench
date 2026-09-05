import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/**
 * ErrorState: an error state with a message and a recovery action.
 */
export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
  className,
}: ErrorStateProps) {
  return (
    <div
      data-ocid="error_state"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/40 bg-destructive/5 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="text-destructive flex size-12 items-center justify-center rounded-full border border-destructive/40 bg-destructive/10">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-base font-semibold">{title}</h3>
        <p className="text-muted-foreground max-w-sm text-sm">{message}</p>
      </div>
      {onRetry ? (
        <Button
          data-ocid="error_state_retry_button"
          variant="outline"
          onClick={onRetry}
          className="mt-1"
        >
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
