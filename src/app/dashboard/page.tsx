import { redirect } from "next/navigation";
import { Flame, Atom, Footprints, Zap } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/app-shell";
import { DashboardHeader } from "@/components/shell/header";
import { MetricsRow, type Metric } from "@/components/shell/metrics-row";
import { signout } from "./actions";

// TODO(fitness): replace with real data from src/features/fitness once the
// workouts/weight_logs tables exist.
// TODO(nutrition): replace with real data from src/features/nutrition once
// the nutrition schema exists.
const PLACEHOLDER_METRICS: Metric[] = [
  {
    title: "Today's calories",
    icon: Flame,
    iconClassName: "text-orange-400",
    value: "1,584",
    unit: "kcal",
    subtext: "416 kcal remaining",
  },
  {
    title: "Protein",
    icon: Atom,
    iconClassName: "text-accent",
    value: "112",
    unit: "g",
    subtext: "Target: 140 g",
  },
  {
    title: "Steps",
    icon: Footprints,
    iconClassName: "text-primary",
    value: "8,420",
    subtext: "84% of daily goal",
  },
  {
    title: "Workout streak",
    icon: Zap,
    iconClassName: "text-yellow-400",
    value: "12",
    unit: "days",
    subtext: "Personal best: 14 days",
    subtextClassName: "text-yellow-400/80",
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const name = user.email?.split("@")[0] ?? "there";

  return (
    <AppShell signOutAction={signout}>
      <DashboardHeader
        name={name}
        weeklyGoalCompleted={4}
        weeklyGoalTarget={5}
      />
      <MetricsRow metrics={PLACEHOLDER_METRICS} />
    </AppShell>
  );
}
