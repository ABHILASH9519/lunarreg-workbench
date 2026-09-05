import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * EmptyState: an empty state with an icon, title, description, and optional
 * primary action.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      data-ocid="empty_state"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-12 text-center",
        className,
      )}
    >
      <span className="text-primary/70 flex size-12 items-center justify-center rounded-full border bg-primary/10">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-base font-semibold">{title}</h3>
        <p className="text-muted-foreground max-w-sm text-sm">{description}</p>
      </div>
      {actionLabel && onAction ? (
        <Button
          data-ocid="empty_state_button"
          onClick={onAction}
          className="mt-1"
        >
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
