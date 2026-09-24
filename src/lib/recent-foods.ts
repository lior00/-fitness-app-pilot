import type { createClient } from "@/lib/supabase/server";

export type RecentFoodItem = {
  id: string;
  name: string;
  brand: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  defaultPortionG: number | null;
  defaultPortionLabel: string | null;
};

type FoodItemRow = {
  id: string;
  name: string;
  brand: string | null;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  default_portion_g: number | null;
  default_portion_label: string | null;
};

// Most-recently-logged distinct foods, for a quick-add shortcut on the log
// and custom-meal-builder screens. Usage-based (derived from food_logs), not
// an explicit favorites system.
export async function getRecentFoodItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  limit = 8,
): Promise<RecentFoodItem[]> {
  const { data: logs } = await supabase
    .from("food_logs")
    .select("food_item_id, food_items(*)")
    .eq("user_id", userId)
    .order("logged_at", { ascending: false })
    .limit(50);

  const seen = new Set<string>();
  const result: RecentFoodItem[] = [];

  for (const log of logs ?? []) {
    const item = log.food_items as unknown as FoodItemRow | null;
    if (!item || seen.has(item.id)) continue;
    seen.add(item.id);
    result.push({
      id: item.id,
      name: item.name,
      brand: item.brand,
      caloriesPer100g: item.calories_per_100g,
      proteinPer100g: item.protein_per_100g,
      carbsPer100g: item.carbs_per_100g,
      fatPer100g: item.fat_per_100g,
      defaultPortionG: item.default_portion_g,
      defaultPortionLabel: item.default_portion_label,
    });
    if (result.length >= limit) break;
  }

  return result;
}
