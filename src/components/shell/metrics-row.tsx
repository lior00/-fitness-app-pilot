import type { LucideIcon } from "lucide-react";

import { MetricCard } from "@/components/shell/metric-card";

export type Metric = {
  title: string;
  icon: LucideIcon;
  iconClassName?: string;
  value: string;
  unit?: string;
  subtext: string;
  subtextClassName?: string;
};

export function MetricsRow({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <MetricCard key={metric.title} {...metric} />
      ))}
    </div>
  );
}
