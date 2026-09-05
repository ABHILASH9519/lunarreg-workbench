import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Cpu, Wrench } from "lucide-react";

export type PrototypeStatus = "functional" | "pending";

export interface PrototypeStatusBadgeProps {
  status: PrototypeStatus;
  className?: string;
}

/**
 * PrototypeStatusBadge: distinguishes 'Functional in-browser' (cyan) from
 * 'Prototype/Integration Pending' (amber) capabilities.
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
        Functional in-browser
      </Badge>
    );
  }
  return (
    <Badge
      className={cn("border-warning/40 bg-warning/15 text-warning", className)}
    >
      <Wrench aria-hidden="true" />
      Prototype/Integration Pending
    </Badge>
  );
}
