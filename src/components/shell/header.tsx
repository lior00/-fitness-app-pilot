import { Plus } from "lucide-react";

import { Progress } from "@/components/ui/progress";

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

export function DashboardHeader({
  name,
  weeklyGoalCompleted,
  weeklyGoalTarget,
}: {
  name: string;
  weeklyGoalCompleted: number;
  weeklyGoalTarget: number;
}) {
  const today = WEEKDAY_FORMATTER.format(new Date()).toUpperCase();
  const progress = Math.min(
    100,
    (weeklyGoalCompleted / weeklyGoalTarget) * 100,
  );

  return (
    <div className="flex flex-wrap items-start justify-between gap-6">
      <div>
        <p className="text-xs font-semibold tracking-widest text-primary">
          {today}
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-foreground">
          Good morning, {name}.
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Small choices. Strong momentum.
        </p>
      </div>

      <div className="w-full max-w-xs rounded-2xl border border-border bg-card p-4 sm:w-72">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Weekly movement goal</span>
          <span className="font-semibold text-foreground">
            {weeklyGoalCompleted} / {weeklyGoalTarget}
          </span>
        </div>
        <Progress value={progress} className="mt-3" />
        <button
          type="button"
          aria-label="Log movement"
          className="mt-3 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
