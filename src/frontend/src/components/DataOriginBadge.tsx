import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Database, HardDrive } from "lucide-react";

export type DataOrigin = "demo" | "user";

export interface DataOriginBadgeProps {
  origin: DataOrigin;
  className?: string;
}

/**
 * DataOriginBadge: distinguishes DEMO/SAMPLE DATA (gold) from USER DATA (cyan).
 * Demo data is synthetic and never represented as official ISRO/Chandrayaan-2 data.
 */
export function DataOriginBadge({ origin, className }: DataOriginBadgeProps) {
  if (origin === "demo") {
    return (
      <Badge
        className={cn(
          "border-warning/40 bg-warning/15 text-warning",
          className,
        )}
      >
        <Database aria-hidden="true" />
        DEMO/SAMPLE DATA
      </Badge>
    );
  }
  return (
    <Badge
      className={cn("border-primary/40 bg-primary/15 text-primary", className)}
    >
      <HardDrive aria-hidden="true" />
      USER DATA
    </Badge>
  );
}
