import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Cpu, Wrench } from "lucide-react";

export type PrototypeStatus = "functional" | "pending";

export interface PrototypeStatusBadgeProps {
  status: PrototypeStatus;
  className?: string;
}

/**
 * Capability status badge: distinguishes capabilities available in the current
 * application from integrations that still require implementation.
 */
export function PrototypeStatusBadge({
  status,
  className,
}: PrototypeStatusBadgeProps) {
  if (status === "functional") {
    return (
      <Badge
        className={cn(
          "border-primary/40 bg-primary/15 text-primary",
          className,
        )}
      >
        <Cpu aria-hidden="true" />
        Available in current workflow
      </Badge>
    );
  }
  return (
    <Badge
      className={cn("border-warning/40 bg-warning/15 text-warning", className)}
    >
      <Wrench aria-hidden="true" />
      Integration required
    </Badge>
  );
}
