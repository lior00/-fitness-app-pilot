import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  title,
  icon: Icon,
  iconClassName,
  value,
  unit,
  subtext,
  subtextClassName,
}: {
  title: string;
  icon: LucideIcon;
  iconClassName?: string;
  value: string;
  unit?: string;
  subtext: string;
  subtextClassName?: string;
}) {
  return (
    <Card className="p-5">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <Icon className={cn("h-4 w-4 text-muted-foreground", iconClassName)} />
      </CardHeader>
      <CardContent className="mt-3">
        <p className="text-3xl font-semibold text-foreground">
          {value}
          {unit ? (
            <span className="ml-1 text-base font-normal text-muted-foreground">
              {unit}
            </span>
          ) : null}
        </p>
        <p className={cn("mt-1 text-xs text-muted-foreground", subtextClassName)}>
          {subtext}
        </p>
      </CardContent>
    </Card>
  );
}
