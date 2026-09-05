import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

export interface StatCardProps {
  /** Short label describing the telemetry value. */
  label: string;
  /** The numeric value rendered in mono type. */
  value: string | number;
  /** Optional unit suffix (e.g. "px", "%", "s"). */
  unit?: string;
  /** Optional delta/trend compared to a baseline. */
  delta?: number;
  /** Optional icon shown in the card corner. */
  icon?: LucideIcon;
  className?: string;
}

/**
 * StatCard: a mission-telemetry style stat card with a mono value, optional
 * unit, optional trend delta, and optional icon.
 */
export function StatCard({
  label,
  value,
  unit,
  delta,
  icon: Icon,
  className,
}: StatCardProps) {
  const deltaDirection =
    delta === undefined ? null : delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const DeltaIcon =
    deltaDirection === "up"
      ? ArrowUpRight
      : deltaDirection === "down"
        ? ArrowDownRight
        : Minus;

  return (
    <Card className={cn("gap-3 py-4 shadow-subtle", className)}>
      <CardContent className="flex items-start justify-between gap-3 px-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            {label}
          </span>
          <div className="flex min-w-0 items-baseline gap-1.5">
            <span className="font-mono text-2xl font-semibold leading-none tracking-tight">
              {value}
            </span>
            {unit ? (
              <span className="text-muted-foreground font-mono text-sm">
                {unit}
              </span>
            ) : null}
          </div>
          {delta !== undefined ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-mono text-xs",
                deltaDirection === "up" && "text-success",
                deltaDirection === "down" && "text-destructive",
                deltaDirection === "flat" && "text-muted-foreground",
              )}
            >
              <DeltaIcon className="size-3" aria-hidden="true" />
              {delta > 0 ? "+" : ""}
              {delta}
            </span>
          ) : null}
        </div>
        {Icon ? (
          <span className="text-primary/80 flex size-9 shrink-0 items-center justify-center rounded-md border bg-primary/10">
            <Icon className="size-4" aria-hidden="true" />
          </span>
        ) : null}
      </CardContent>
    </Card>
  );
}
