import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRecentFoodItems } from "@/lib/recent-foods";
import { EditMealForm } from "./edit-meal-form";

export default async function EditMealPage({
  params,
}: {
  params: Promise<{ mealId: string }>;
}) {
  const { mealId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: meal } = await supabase
    .from("custom_meals")
    .select(
      "id, name, custom_meal_ingredients(id, quantity_g, food_items(id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g))",
    )
    .eq("id", mealId)
    .eq("user_id", user.id)
    .single();

  if (!meal) redirect("/meals/log-meal");

  const ingredients = (meal.custom_meal_ingredients ?? []).map((ing) => {
    const foodItem = ing.food_items as unknown as {
      id: string;
      name: string;
      calories_per_100g: number;
      protein_per_100g: number;
      carbs_per_100g: number;
      fat_per_100g: number;
    };
    return {
      foodItemId: foodItem.id,
      name: foodItem.name,
      quantityG: ing.quantity_g,
      caloriesPer100g: foodItem.calories_per_100g,
      proteinPer100g: foodItem.protein_per_100g,
      carbsPer100g: foodItem.carbs_per_100g,
      fatPer100g: foodItem.fat_per_100g,
    };
  });

  const recentFoods = await getRecentFoodItems(supabase, user.id);

  return (
    <main className="flex min-h-screen justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-semibold">Edit meal</h1>
        <EditMealForm
          mealId={meal.id}
          initialName={meal.name}
          initialIngredients={ingredients}
          recentFoods={recentFoods}
        />
      </div>
    </main>
  );
}
