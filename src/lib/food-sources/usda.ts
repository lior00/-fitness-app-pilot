import type { NormalizedFood } from "./types";

type FdcNutrient = {
  nutrientId: number;
  nutrientName: string;
  value: number;
};

type FdcFoodPortion = {
  gramWeight: number;
  portionDescription?: string;
  modifier?: string;
};

type FdcFood = {
  fdcId: number;
  description: string;
  dataType?: string;
  brandName?: string;
  brandOwner?: string;
  foodNutrients: FdcNutrient[];
  foodPortions?: FdcFoodPortion[];
};

// Generic/raw ingredients (Foundation, SR Legacy) before packaged products
// (Branded), so searching "banana" or "chicken" surfaces the basic form
// first rather than a specific branded snack.
function dataTypeRank(dataType?: string): number {
  return dataType === "Branded" ? 1 : 0;
}

const NUTRIENT_IDS = {
  protein: 1003,
  carbs: 1005,
  fat: 1004,
};

// Branded/SR Legacy foods report energy directly under 1008 ("Energy", kcal).
// Many Foundation (lab-analyzed raw ingredient) entries omit 1008 and only
// report it as an Atwater-factor calculation instead, so fall back to those.
const CALORIE_NUTRIENT_IDS = [1008, 2047, 2048];

function nutrientValue(nutrients: FdcNutrient[], id: number): number {
  return nutrients.find((n) => n.nutrientId === id)?.value ?? 0;
}

function calorieValue(nutrients: FdcNutrient[]): number {
  for (const id of CALORIE_NUTRIENT_IDS) {
    const match = nutrients.find((n) => n.nutrientId === id);
    if (match) return match.value;
  }
  return 0;
}

export async function searchUsda(query: string): Promise<NormalizedFood[]> {
  const apiKey = process.env.FDC_API_KEY;
  if (!apiKey) return [];

  const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", query);
  url.searchParams.set("pageSize", "15");
  url.searchParams.set(
    "dataType",
    "Foundation,SR Legacy,Branded",
  );

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return [];

  const data = (await res.json()) as { foods?: FdcFood[] };
  const foods = [...(data.foods ?? [])].sort(
    (a, b) => dataTypeRank(a.dataType) - dataTypeRank(b.dataType),
  );

  return foods.map((food) => {
    const portion = food.foodPortions?.[0];
    return {
      source: "usda" as const,
      externalId: String(food.fdcId),
      name: food.description,
      brand: food.brandName || food.brandOwner || undefined,
      caloriesPer100g: calorieValue(food.foodNutrients),
      proteinPer100g: nutrientValue(food.foodNutrients, NUTRIENT_IDS.protein),
      carbsPer100g: nutrientValue(food.foodNutrients, NUTRIENT_IDS.carbs),
      fatPer100g: nutrientValue(food.foodNutrients, NUTRIENT_IDS.fat),
      defaultPortionG: portion?.gramWeight,
      defaultPortionLabel:
        portion && (portion.modifier || portion.portionDescription)
          ? `${portion.modifier ?? portion.portionDescription} (${Math.round(portion.gramWeight)}g)`
          : undefined,
    };
  });
}
