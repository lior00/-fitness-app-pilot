"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { NormalizedFood } from "@/lib/food-sources/types";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

type FoodRef =
  | { type: "existing"; foodItemId: string }
  | { type: "new"; food: NormalizedFood };

type FoodItemRow = {
  id: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
};

async function resolveFoodItem(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  ref: FoodRef,
): Promise<FoodItemRow> {
  if (ref.type === "existing") {
    const { data, error } = await supabase
      .from("food_items")
      .select("id, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g")
      .eq("id", ref.foodItemId)
      .single();
    if (error || !data) throw new Error(error?.message ?? "Food not found");
    return data;
  }

  const food = ref.food;
  const payload = {
    created_by: userId,
    source: food.source,
    external_id: food.externalId,
    name: food.name,
    brand: food.brand,
    calories_per_100g: food.caloriesPer100g,
    protein_per_100g: food.proteinPer100g,
    carbs_per_100g: food.carbsPer100g,
    fat_per_100g: food.fatPer100g,
    default_portion_g: food.defaultPortionG,
    default_portion_label: food.defaultPortionLabel,
  };

  const query = food.externalId
    ? supabase
        .from("food_items")
        .upsert(payload, { onConflict: "created_by,source,external_id" })
    : supabase.from("food_items").insert(payload);

  const { data, error } = await query
    .select("id, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to save food");
  return data;
}

function snapshotFromFoodItem(item: FoodItemRow, quantityG: number) {
  const ratio = quantityG / 100;
  return {
    calories: Math.round(item.calories_per_100g * ratio),
    protein_g: Math.round(item.protein_per_100g * ratio * 10) / 10,
    carbs_g: Math.round(item.carbs_per_100g * ratio * 10) / 10,
    fat_g: Math.round(item.fat_per_100g * ratio * 10) / 10,
  };
}

export type ActionState = { error?: string };

export async function logFood(input: {
  food: FoodRef;
  quantityG: number;
  mealType: MealType;
  loggedDate: string;
}): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  try {
    const foodItem = await resolveFoodItem(supabase, user.id, input.food);
    const snapshot = snapshotFromFoodItem(foodItem, input.quantityG);

    const { error } = await supabase.from("food_logs").insert({
      user_id: user.id,
      food_item_id: foodItem.id,
      log_group_id: crypto.randomUUID(),
      meal_type: input.mealType,
      quantity_g: input.quantityG,
      logged_date: input.loggedDate,
      ...snapshot,
    });
    if (error) return { error: error.message };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to log food" };
  }

  redirect(`/meals?date=${input.loggedDate}`);
}

export async function createCustomMeal(input: {
  name: string;
  ingredients: { food: FoodRef; quantityG: number }[];
}): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (input.ingredients.length === 0) {
    return { error: "Add at least one ingredient" };
  }

  const { data: meal, error: mealError } = await supabase
    .from("custom_meals")
    .insert({ user_id: user.id, name: input.name })
    .select("id")
    .single();
  if (mealError || !meal) return { error: mealError?.message ?? "Failed to create meal" };

  try {
    const rows = await Promise.all(
      input.ingredients.map(async (ingredient) => {
        const foodItem = await resolveFoodItem(supabase, user.id, ingredient.food);
        return {
          custom_meal_id: meal.id,
          food_item_id: foodItem.id,
          quantity_g: ingredient.quantityG,
        };
      }),
    );

    const { error } = await supabase.from("custom_meal_ingredients").insert(rows);
    if (error) return { error: error.message };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to save ingredients" };
  }

  redirect("/meals/log-meal");
}

export async function logCustomMeal(input: {
  customMealId: string;
  mealType: MealType;
  loggedDate: string;
  servings: number;
}): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: ingredients, error: ingredientsError } = await supabase
    .from("custom_meal_ingredients")
    .select(
      "quantity_g, food_items(id, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g)",
    )
    .eq("custom_meal_id", input.customMealId);

  if (ingredientsError) return { error: ingredientsError.message };
  if (!ingredients || ingredients.length === 0) {
    return { error: "This meal has no ingredients" };
  }

  const logGroupId = crypto.randomUUID();
  const rows = ingredients.map((ingredient) => {
    const foodItem = ingredient.food_items as unknown as FoodItemRow;
    const quantityG = ingredient.quantity_g * input.servings;
    const snapshot = snapshotFromFoodItem(foodItem, quantityG);
    return {
      user_id: user.id,
      food_item_id: foodItem.id,
      custom_meal_id: input.customMealId,
      log_group_id: logGroupId,
      meal_type: input.mealType,
      quantity_g: quantityG,
      logged_date: input.loggedDate,
      ...snapshot,
    };
  });

  const { error } = await supabase.from("food_logs").insert(rows);
  if (error) return { error: error.message };

  redirect(`/meals?date=${input.loggedDate}`);
}

export async function deleteLogGroup(logGroupId: string, loggedDate: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("food_logs").delete().eq("log_group_id", logGroupId);
  redirect(`/meals?date=${loggedDate}`);
}

export async function updateLogQuantity(formData: FormData) {
  const logId = formData.get("logId") as string;
  const loggedDate = formData.get("loggedDate") as string;
  const quantityG = Number(formData.get("quantityG"));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!logId || !quantityG || quantityG <= 0) {
    redirect(loggedDate ? `/meals?date=${loggedDate}` : "/meals");
  }

  const { data: log } = await supabase
    .from("food_logs")
    .select("food_items(id, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g)")
    .eq("id", logId)
    .single();

  if (log) {
    const foodItem = log.food_items as unknown as FoodItemRow;
    const snapshot = snapshotFromFoodItem(foodItem, quantityG);
    await supabase
      .from("food_logs")
      .update({ quantity_g: quantityG, ...snapshot })
      .eq("id", logId);
  }

  redirect(`/meals?date=${loggedDate}`);
}
