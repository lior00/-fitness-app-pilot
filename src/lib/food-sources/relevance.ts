import type { NormalizedFood } from "./types";

function words(text: string): string[] {
  return text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

// How well a result's name (and, for sources like the Israeli DB where the
// English translation lives in `brand` rather than `name`, its brand too)
// matches the search query. Whole-word matches score highest, substring
// matches count for a little, and a name that starts with the full query
// phrase gets a bonus — this is what actually determines ranking now, not
// which source or data-type tier a result came from.
export function relevanceScore(food: NormalizedFood, queryWords: string[]): number {
  const haystack = `${food.name} ${food.brand ?? ""}`.toLowerCase();
  const haystackWords = new Set(words(haystack));

  let score = 0;
  for (const word of queryWords) {
    if (haystackWords.has(word)) score += 2;
    else if (haystack.includes(word)) score += 1;
  }

  if (haystack.startsWith(queryWords.join(" "))) score += 3;

  // Small reliability tiebreaker: results whose per-100g values were derived
  // by scaling a serving-size figure (currently only USDA Branded results)
  // carry more risk of being wrong at the source than a directly-reported
  // per-100g value — nudge them below an otherwise-equally-relevant result,
  // without letting this override a genuinely better text match.
  if (food.isServingConverted) score -= 1;

  return score;
}

export function sortByRelevance(results: NormalizedFood[], query: string): NormalizedFood[] {
  const queryWords = words(query);
  if (queryWords.length === 0) return results;

  return [...results].sort(
    (a, b) => relevanceScore(b, queryWords) - relevanceScore(a, queryWords),
  );
}
