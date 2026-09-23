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
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
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

// USDA's search endpoint reports Branded-food nutrients as already scaled to
// the product's serving size (not per 100g like Foundation/SR Legacy), and
// doesn't populate foodPortions for them either. Convert servingSize/unit to
// grams so we can normalize back to a true per-100g basis.
function servingSizeGrams(food: FdcFood): number | undefined {
  if (!food.servingSize || !food.servingSizeUnit) return undefined;
  const unit = food.servingSizeUnit.toLowerCase();
  if (unit === "g" || unit === "ml") return food.servingSize;
  if (unit === "oz") return food.servingSize * 28.3495;
  return undefined;
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
    const rawCalories = calorieValue(food.foodNutrients);
    const rawProtein = nutrientValue(food.foodNutrients, NUTRIENT_IDS.protein);
    const rawCarbs = nutrientValue(food.foodNutrients, NUTRIENT_IDS.carbs);
    const rawFat = nutrientValue(food.foodNutrients, NUTRIENT_IDS.fat);

    if (food.dataType === "Branded") {
      const servingGrams = servingSizeGrams(food);
      const scale = servingGrams ? 100 / servingGrams : 1;
      return {
        source: "usda" as const,
        externalId: String(food.fdcId),
        name: food.description,
        brand: food.brandName || food.brandOwner || undefined,
        caloriesPer100g: rawCalories * scale,
        proteinPer100g: rawProtein * scale,
        carbsPer100g: rawCarbs * scale,
        fatPer100g: rawFat * scale,
        defaultPortionG: servingGrams,
        defaultPortionLabel:
          food.householdServingFullText ||
          (servingGrams ? `${Math.round(servingGrams)}g` : undefined),
      };
    }

    const portion = food.foodPortions?.[0];
    return {
      source: "usda" as const,
      externalId: String(food.fdcId),
      name: food.description,
      brand: food.brandName || food.brandOwner || undefined,
      caloriesPer100g: rawCalories,
      proteinPer100g: rawProtein,
      carbsPer100g: rawCarbs,
      fatPer100g: rawFat,
      defaultPortionG: portion?.gramWeight,
      defaultPortionLabel:
        portion && (portion.modifier || portion.portionDescription)
          ? `${portion.modifier ?? portion.portionDescription} (${Math.round(portion.gramWeight)}g)`
          : undefined,
    };
  });
}
