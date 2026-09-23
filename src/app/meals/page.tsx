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
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { addDaysIso, formatDisplayDate, todayIso } from "@/lib/date";
import { MEAL_TYPE_LABELS, MEAL_TYPE_ORDER } from "@/lib/meal-type";
import { deleteLogGroup, updateLogQuantity } from "./actions";

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

export default async function MealsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const date = dateParam ?? todayIso();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: logs }] = await Promise.all([
    supabase.from("profiles").select("target_calories").eq("id", user.id).single(),
    supabase
      .from("food_logs")
      .select(
        "id, log_group_id, meal_type, quantity_g, calories, protein_g, carbs_g, fat_g, food_items(name), custom_meals(name)",
      )
      .eq("user_id", user.id)
      .eq("logged_date", date)
      .order("logged_at", { ascending: true }),
  ]);

  const rows = (logs ?? []) as unknown as FoodLogRow[];
  const targetCalories = profile?.target_calories ?? 0;
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

  const isToday = date === todayIso();

  return (
    <main className="flex min-h-screen justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Button size="sm" variant="ghost" render={<Link href="/dashboard" />}>
            Dashboard
          </Button>
          <Button size="sm" variant="ghost" render={<Link href="/meals/calendar" />}>
            Calendar
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <Button
            size="icon-sm"
            variant="outline"
            render={<Link href={`/meals?date=${addDaysIso(date, -1)}`} />}
          >
            ‹
          </Button>
          <span className="text-sm font-medium">
            {isToday ? "Today" : formatDisplayDate(date)}
          </span>
          <Button
            size="icon-sm"
            variant="outline"
            render={<Link href={`/meals?date=${addDaysIso(date, 1)}`} />}
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
          <Button
            size="sm"
            variant="outline"
            render={<Link href={`/meals/log-meal?date=${date}`} />}
          >
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
              {groupsByMealType.get(mealType)!.map((group) => {
                const groupCalories = group.reduce((sum, r) => sum + r.calories, 0);
                const mealName = group[0].custom_meals?.name;
                return (
                  <Card key={group[0].log_group_id} size="sm">
                    <CardContent className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          {mealName && (
                            <p className="text-sm font-medium">{mealName}</p>
                          )}
                          {group.map((row) => (
                            <form
                              key={row.id}
                              action={updateLogQuantity}
                              className="flex items-center gap-1.5 text-sm text-neutral-600"
                            >
                              <input type="hidden" name="logId" value={row.id} />
                              <input type="hidden" name="loggedDate" value={date} />
                              <span>{row.food_items?.name} —</span>
                              <Input
                                name="quantityG"
                                type="number"
                                defaultValue={row.quantity_g}
                                className="h-6 w-16 px-1.5 text-xs"
                              />
                              <span>g ({row.calories} kcal)</span>
                              <Button size="xs" variant="ghost" type="submit">
                                Update
                              </Button>
                            </form>
                          ))}
                        </div>
                        <form
                          action={deleteLogGroup.bind(null, group[0].log_group_id, date)}
                        >
                          <Button size="xs" variant="ghost" type="submit">
                            Delete
                          </Button>
                        </form>
                      </div>
                      <p className="text-xs text-neutral-400">{groupCalories} kcal total</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ))}

          {rows.length === 0 && (
            <p className="text-center text-sm text-neutral-500">
              Nothing logged {isToday ? "today" : "this day"} yet.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
