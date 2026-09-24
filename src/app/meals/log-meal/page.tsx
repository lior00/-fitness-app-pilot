import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { todayIso } from "@/lib/date";
import { LogMealForm } from "./log-meal-form";

export default async function LogMealPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: mealsData } = await supabase
    .from("custom_meals")
    .select(
      "id, name, custom_meal_ingredients(id, quantity_g, food_items(id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g))",
    )
    .eq("user_id", user.id)
    .order("name");

  const meals = (mealsData ?? []).map((meal) => ({
    id: meal.id,
    name: meal.name,
    ingredients: (meal.custom_meal_ingredients ?? []).map((ing) => {
      const foodItem = ing.food_items as unknown as {
        id: string;
        name: string;
        calories_per_100g: number;
        protein_per_100g: number;
        carbs_per_100g: number;
        fat_per_100g: number;
      };
      return {
        id: ing.id,
        foodItemId: foodItem.id,
        name: foodItem.name,
        quantityG: ing.quantity_g,
        caloriesPer100g: foodItem.calories_per_100g,
      };
    }),
  }));

  return (
    <main className="flex min-h-screen justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-semibold">Log a saved meal</h1>

        {meals.length > 0 ? (
          <LogMealForm meals={meals} initialDate={date ?? todayIso()} />
        ) : (
          <div className="space-y-3 text-center">
            <p className="text-sm text-neutral-500">
              You haven&apos;t built any meals yet.
            </p>
            <Button render={<Link href="/meals/new" />}>Build a meal</Button>
          </div>
        )}
      </div>
    </main>
  );
}
