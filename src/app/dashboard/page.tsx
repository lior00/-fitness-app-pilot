import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  addDaysIso,
  daysInMonthGrid,
  formatDisplayDate,
  formatMonthLabel,
  monthEndIso,
  shiftMonthParam,
  todayIso,
} from "@/lib/date";
import { MEAL_TYPE_LABELS, MEAL_TYPE_ORDER } from "@/lib/meal-type";
import { signout } from "./actions";
import { DashboardTabs } from "./dashboard-tabs";
import { LogEntryCard } from "./log-entry-card";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

type FoodLogRow = {
  id: string;
  log_group_id: string;
  meal_type: string;
  quantity_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  food_items: { name: string } | null;
  custom_meals: { name: string } | null;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; month?: string; tab?: string }>;
}) {
  const { date: dateParam, month: monthParam, tab: tabParam } = await searchParams;
  const date = dateParam ?? todayIso();
  const month = monthParam ?? date.slice(0, 7);
  const defaultTab = tabParam === "calendar" ? "calendar" : "day";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const monthStart = `${month}-01`;
  const monthEnd = monthEndIso(month);

  const [{ data: profile }, { data: logs }, { data: monthLogs }] = await Promise.all([
    supabase.from("profiles").select("target_calories").eq("id", user.id).single(),
    supabase
      .from("food_logs")
      .select(
        "id, log_group_id, meal_type, quantity_g, calories, protein_g, carbs_g, fat_g, food_items(name), custom_meals(name)",
      )
      .eq("user_id", user.id)
      .eq("logged_date", date)
      .order("logged_at", { ascending: true }),
    supabase
      .from("food_logs")
      .select("logged_date, calories")
      .eq("user_id", user.id)
      .gte("logged_date", monthStart)
      .lte("logged_date", monthEnd),
  ]);

  const targetCalories = profile?.target_calories ?? 0;

  const rows = (logs ?? []) as unknown as FoodLogRow[];
  const totalCalories = rows.reduce((sum, r) => sum + r.calories, 0);
  const totalProtein = rows.reduce((sum, r) => sum + r.protein_g, 0);
  const totalCarbs = rows.reduce((sum, r) => sum + r.carbs_g, 0);
  const totalFat = rows.reduce((sum, r) => sum + r.fat_g, 0);
  const remaining = targetCalories - totalCalories;
  const progressPercent =
    targetCalories > 0 ? Math.min(100, (totalCalories / targetCalories) * 100) : 0;

  const groups = new Map<string, FoodLogRow[]>();
  for (const row of rows) {
    const group = groups.get(row.log_group_id) ?? [];
    group.push(row);
    groups.set(row.log_group_id, group);
  }

  const groupsByMealType = new Map<string, FoodLogRow[][]>();
  for (const group of groups.values()) {
    const mealType = group[0].meal_type;
    const list = groupsByMealType.get(mealType) ?? [];
    list.push(group);
    groupsByMealType.set(mealType, list);
  }

  const totalsByDate = new Map<string, number>();
  for (const row of monthLogs ?? []) {
    totalsByDate.set(row.logged_date, (totalsByDate.get(row.logged_date) ?? 0) + row.calories);
  }

  const cells = daysInMonthGrid(month);
  const today = todayIso();
  const isToday = date === today;

  const dayPanel = (
    <>
      <div className="flex items-center justify-between">
        <Button
          size="icon-sm"
          variant="outline"
          render={<Link href={`/dashboard?date=${addDaysIso(date, -1)}&month=${month}&tab=day`} />}
        >
          ‹
        </Button>
        <span className="text-sm font-medium">
          {isToday ? "Today" : formatDisplayDate(date)}
        </span>
        <Button
          size="icon-sm"
          variant="outline"
          render={<Link href={`/dashboard?date=${addDaysIso(date, 1)}&month=${month}&tab=day`} />}
        >
          ›
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calories</CardTitle>
          <CardDescription>
            {targetCalories > 0
              ? `${totalCalories} of ${targetCalories} kcal logged`
              : "Complete onboarding to see your target"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={progressPercent} />
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-semibold">{remaining}</span>
            <span className="text-sm text-neutral-500">kcal remaining</span>
          </div>
          <div className="flex justify-between text-sm text-neutral-500">
            <span>Protein {totalProtein.toFixed(0)}g</span>
            <span>Carbs {totalCarbs.toFixed(0)}g</span>
            <span>Fat {totalFat.toFixed(0)}g</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <Button size="sm" render={<Link href={`/meals/log?date=${date}`} />}>
          Log food
        </Button>
        <Button size="sm" variant="outline" render={<Link href={`/meals/log-meal?date=${date}`} />}>
          Log a meal
        </Button>
        <Button size="sm" variant="outline" render={<Link href="/meals/new" />}>
          Build a meal
        </Button>
      </div>

      <div className="space-y-4">
        {MEAL_TYPE_ORDER.filter((mt) => groupsByMealType.has(mt)).map((mealType) => (
          <div key={mealType} className="space-y-2">
            <h2 className="text-sm font-semibold text-neutral-700">
              {MEAL_TYPE_LABELS[mealType]}
            </h2>
            {groupsByMealType.get(mealType)!.map((group) => (
              <LogEntryCard key={group[0].log_group_id} group={group} date={date} />
            ))}
          </div>
        ))}

        {rows.length === 0 && (
          <p className="text-center text-sm text-neutral-500">
            Nothing logged {isToday ? "today" : "this day"} yet.
          </p>
        )}
      </div>
    </>
  );

  const calendarPanel = (
    <>
      <div className="flex items-center justify-between">
        <Button
          size="icon-sm"
          variant="outline"
          render={
            <Link href={`/dashboard?date=${date}&month=${shiftMonthParam(month, -1)}&tab=calendar`} />
          }
        >
          ‹
        </Button>
        <span className="text-sm font-medium">{formatMonthLabel(month)}</span>
        <Button
          size="icon-sm"
          variant="outline"
          render={
            <Link href={`/dashboard?date=${date}&month=${shiftMonthParam(month, 1)}&tab=calendar`} />
          }
        >
          ›
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-400">
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell.dateIso) return <div key={i} />;
          const total = totalsByDate.get(cell.dateIso);
          const hasEntries = total !== undefined;
          const isOver = hasEntries && targetCalories > 0 && total > targetCalories;
          const isSelected = cell.dateIso === date;

          return (
            <Link
              key={i}
              href={`/dashboard?date=${cell.dateIso}&month=${month}&tab=day`}
              className={`flex flex-col items-center rounded-md border p-1.5 text-xs ${
                isSelected ? "border-neutral-900" : "border-neutral-200"
              } ${hasEntries ? (isOver ? "bg-red-50" : "bg-green-50") : "bg-transparent"}`}
            >
              <span className="font-medium">{Number(cell.dateIso.slice(-2))}</span>
              {hasEntries && <span className="text-[10px] text-neutral-500">{total}</span>}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-4 text-xs text-neutral-500">
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded-full bg-green-100" /> Under target
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded-full bg-red-100" /> Over target
        </span>
      </div>
    </>
  );

  return (
    <main className="flex min-h-screen justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">{user.email}</p>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" render={<Link href="/settings" />}>
              Settings
            </Button>
            <form action={signout}>
              <Button type="submit" variant="ghost" size="sm">
                Log out
              </Button>
            </form>
          </div>
        </div>

        <DashboardTabs defaultTab={defaultTab} dayPanel={dayPanel} calendarPanel={calendarPanel} />

        <Link href="/workouts">
          <Card className="cursor-pointer transition-colors hover:bg-neutral-50" size="sm">
            <CardHeader>
              <CardTitle>Workouts</CardTitle>
              <CardDescription>Log a session</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </main>
  );
}
