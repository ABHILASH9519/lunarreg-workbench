import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface SectionCardProps {
  title: string;
  description?: string;
  /** Optional action rendered in the card header. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * SectionCard: a titled card section wrapper with an optional description and
 * header action.
 */
export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: SectionCardProps) {
  return (
    <Card className={cn("gap-4 py-5 shadow-subtle", className)}>
      <CardHeader className="px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <CardTitle className="font-display text-base">{title}</CardTitle>
            {description ? (
              <p className="text-muted-foreground text-sm">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </CardHeader>
      <CardContent className={cn("px-5", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
