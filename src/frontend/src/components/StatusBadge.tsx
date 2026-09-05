import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

export type StatusTone = "pass" | "warning" | "failed";

export interface StatusBadgeProps {
  status: StatusTone;
  label?: string;
  className?: string;
}

const STATUS_META: Record<
  StatusTone,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  pass: {
    label: "PASS",
    icon: CheckCircle2,
    className: "border-success/40 bg-success/15 text-success",
  },
  warning: {
    label: "WARNING",
    icon: AlertTriangle,
    className: "border-warning/40 bg-warning/15 text-warning",
  },
  failed: {
    label: "FAILED",
    icon: XCircle,
    className: "border-destructive/40 bg-destructive/15 text-destructive",
  },
};

/**
 * StatusBadge: PASS / WARNING / FAILED badge with appropriate colors.
 */
export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <Badge className={cn(meta.className, className)}>
      <Icon aria-hidden="true" />
      {label ?? meta.label}
    </Badge>
  );
}
