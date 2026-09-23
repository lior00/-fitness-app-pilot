import type { NormalizedFood } from "./types";

// Israeli Ministry of Health food composition database, live-queryable via
// data.gov.il's CKAN datastore (no import/ETL needed). Values are already
// per-100g. Resource id is stable (verified against the dataset's metadata).
const RESOURCE_ID = "c3cb0630-0650-46c1-a068-82d575c094b2";

type MohRecord = {
  smlmitzrach: number;
  shmmitzrach: string;
  english_name?: string;
  food_energy?: number;
  protein?: number;
  total_fat?: number;
  carbohydrates?: number;
};

export async function searchIsrael(query: string): Promise<NormalizedFood[]> {
  const url = new URL("https://data.gov.il/api/3/action/datastore_search");
  url.searchParams.set("resource_id", RESOURCE_ID);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "15");

  const res = await fetch(url, { headers: { "User-Agent": "FitnessAppPilot/1.0" } });
  if (!res.ok) return [];

  const data = (await res.json()) as { result?: { records?: MohRecord[] } };
  const records = data.result?.records ?? [];

  return records
    .filter((r) => r.food_energy != null)
    .map((r) => ({
      source: "il" as const,
      externalId: String(r.smlmitzrach),
      name: r.shmmitzrach,
      brand: r.english_name || undefined,
      caloriesPer100g: r.food_energy ?? 0,
      proteinPer100g: r.protein ?? 0,
      carbsPer100g: r.carbohydrates ?? 0,
      fatPer100g: r.total_fat ?? 0,
    }));
}
