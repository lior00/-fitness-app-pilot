import type { NormalizedFood } from "./types";

// Open Food Facts' modern Elasticsearch-backed search ("Search-a-licious",
// search.openfoodfacts.org) rather than the legacy cgi/search.pl endpoint —
// confirmed by direct testing that the legacy endpoint misses real products
// (e.g. "Yucatan Guacamole", "Ace Bakery" items) that this one finds cleanly,
// with meaningfully better relevance ranking too.
//
// Tradeoff: this index doesn't carry serving_size/serving_quantity (verified
// absent even when requested), so OFF results no longer get a suggested
// portion the way USDA branded items do. Acceptable for now — search
// quality/coverage was the actual complaint, not portion prefill.
type OffProduct = {
  code: string;
  product_name?: string;
  brands?: string[];
  nutriments?: {
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
  };
};

const USER_AGENT = "FitnessAppPilot/1.0 (contact: liort2507@gmail.com)";

export async function searchOpenFoodFacts(query: string): Promise<NormalizedFood[]> {
  const url = new URL("https://search.openfoodfacts.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("page_size", "20");
  url.searchParams.set("fields", "code,product_name,brands,nutriments");

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as { hits?: OffProduct[] };

  return (data.hits ?? [])
    .filter((p) => p.product_name && p.nutriments?.["energy-kcal_100g"] != null)
    .map((p) => ({
      source: "off" as const,
      externalId: p.code,
      name: p.product_name!,
      brand: p.brands && p.brands.length > 0 ? p.brands.join(", ") : undefined,
      caloriesPer100g: p.nutriments?.["energy-kcal_100g"] ?? 0,
      proteinPer100g: p.nutriments?.proteins_100g ?? 0,
      carbsPer100g: p.nutriments?.carbohydrates_100g ?? 0,
      fatPer100g: p.nutriments?.fat_100g ?? 0,
    }));
}
