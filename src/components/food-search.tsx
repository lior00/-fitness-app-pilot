"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { NormalizedFood } from "@/lib/food-sources/types";

const SOURCE_LABELS: Record<NormalizedFood["source"], string> = {
  usda: "USDA",
  off: "OFF",
  il: "IL",
  custom: "Custom",
};

export function ServingConversionNote({ food }: { food: NormalizedFood }) {
  if (!food.isServingConverted) return null;
  return (
    <span className="block text-amber-600">
      Calculated from a serving size on the label — double-check if it looks off
    </span>
  );
}

export function calorieDisplay(food: NormalizedFood): string {
  if (food.defaultPortionG) {
    const servingCalories = Math.round(
      (food.caloriesPer100g * food.defaultPortionG) / 100,
    );
    const label = food.defaultPortionLabel ?? `${Math.round(food.defaultPortionG)}g`;
    return `${servingCalories} kcal / ${label}`;
  }
  return `${Math.round(food.caloriesPer100g)} kcal / 100g`;
}

export function FoodSearch({ onSelect }: { onSelect: (food: NormalizedFood) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NormalizedFood[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const requestId = ++requestIdRef.current;

      if (query.trim().length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/foods/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (requestId === requestIdRef.current) {
          setResults(data.results ?? []);
        }
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search foods (e.g. banana, chicken breast)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {loading && <p className="text-sm text-neutral-500">Searching...</p>}

      {!loading && query.trim().length >= 2 && results.length === 0 && (
        <p className="text-sm text-neutral-500">No results found.</p>
      )}

      <div className="space-y-2">
        {results.map((food) => (
          <button
            key={`${food.source}-${food.externalId}`}
            type="button"
            onClick={() => onSelect(food)}
            className="flex w-full items-start justify-between gap-3 rounded-lg border border-neutral-200 p-3 text-left text-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50"
          >
            <span>
              <span className="block font-medium">{food.name}</span>
              {food.brand && (
                <span className="block text-neutral-500">{food.brand}</span>
              )}
              <span className="block text-neutral-500">{calorieDisplay(food)}</span>
              <ServingConversionNote food={food} />
            </span>
            <Badge variant="outline">{SOURCE_LABELS[food.source]}</Badge>
          </button>
        ))}
      </div>
    </div>
  );
}
