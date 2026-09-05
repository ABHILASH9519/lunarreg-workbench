import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

export interface MetricCardProps {
  /** Metric name, e.g. "RMSE". */
  label: string;
  /** Numeric value rendered in mono type. */
  value: string | number;
  /** Unit suffix (e.g. "px", "%"). */
  unit?: string;
  /** Tooltip explaining the metric's meaning, calculation, and why it matters. */
  explanation: string;
  /** Optional status color accent. */
  tone?: "default" | "success" | "warning" | "destructive";
  className?: string;
}

/**
 * MetricCard: a scientific metric card with a drill-down tooltip explaining
 * the metric's meaning, how it is calculated, and why it matters.
 */
export function MetricCard({
  label,
  value,
  unit,
  explanation,
  tone = "default",
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("gap-2 py-4 shadow-subtle", className)}>
      <CardContent className="flex flex-col gap-2 px-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            {label}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`About ${label}`}
                className="text-muted-foreground hover:text-foreground inline-flex size-5 items-center justify-center rounded-full transition-colors focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none"
              >
                <Info className="size-3.5" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              {explanation}
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              "font-mono text-2xl font-semibold leading-none tracking-tight",
              tone === "success" && "text-success",
              tone === "warning" && "text-warning",
              tone === "destructive" && "text-destructive",
            )}
          >
            {value}
          </span>
          {unit ? (
            <span className="text-muted-foreground font-mono text-sm">
              {unit}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
