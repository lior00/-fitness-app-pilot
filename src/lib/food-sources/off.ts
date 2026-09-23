import type { NormalizedFood } from "./types";

type OffProduct = {
  code: string;
  product_name?: string;
  brands?: string;
  serving_size?: string;
  serving_quantity?: number;
  nutriments?: {
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
  };
};

const USER_AGENT = "FitnessAppPilot/1.0 (contact: liort2507@gmail.com)";

export async function searchOpenFoodFacts(query: string): Promise<NormalizedFood[]> {
  const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
  url.searchParams.set("search_terms", query);
  url.searchParams.set("search_simple", "1");
  url.searchParams.set("action", "process");
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", "15");
  url.searchParams.set(
    "fields",
    "code,product_name,brands,serving_size,serving_quantity,nutriments",
  );

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as { products?: OffProduct[] };

  return (data.products ?? [])
    .filter((p) => p.product_name && p.nutriments?.["energy-kcal_100g"] != null)
    .map((p) => ({
      source: "off" as const,
      externalId: p.code,
      name: p.product_name!,
      brand: p.brands || undefined,
      caloriesPer100g: p.nutriments?.["energy-kcal_100g"] ?? 0,
      proteinPer100g: p.nutriments?.proteins_100g ?? 0,
      carbsPer100g: p.nutriments?.carbohydrates_100g ?? 0,
      fatPer100g: p.nutriments?.fat_100g ?? 0,
      defaultPortionG: p.serving_quantity,
      defaultPortionLabel: p.serving_size,
    }));
}
