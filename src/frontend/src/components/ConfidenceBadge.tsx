import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ConfidenceLevel =
  | "excellent"
  | "good"
  | "moderate"
  | "poor"
  | "failed";

export interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  className?: string;
}

const CONFIDENCE_META: Record<
  ConfidenceLevel,
  { label: string; className: string }
> = {
  excellent: {
    label: "Excellent",
    className: "border-success/40 bg-success/15 text-success",
  },
  good: {
    label: "Good",
    className: "border-primary/40 bg-primary/15 text-primary",
  },
  moderate: {
    label: "Moderate",
    className: "border-warning/40 bg-warning/15 text-warning",
  },
  poor: {
    label: "Poor",
    className: "border-destructive/40 bg-destructive/15 text-destructive",
  },
  failed: {
    label: "Failed",
    className: "border-destructive/50 bg-destructive/20 text-destructive",
  },
};

/**
 * ConfidenceBadge: a confidence level badge (Excellent / Good / Moderate /
 * Poor / Failed).
 */
export function ConfidenceBadge({ level, className }: ConfidenceBadgeProps) {
  const meta = CONFIDENCE_META[level];
  return <Badge className={cn(meta.className, className)}>{meta.label}</Badge>;
}
