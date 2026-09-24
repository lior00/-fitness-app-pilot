import { calorieDisplay } from "@/components/food-search";
import type { NormalizedFood } from "@/lib/food-sources/types";
import type { RecentFoodItem } from "@/lib/recent-foods";

function toNormalizedFood(item: RecentFoodItem): NormalizedFood {
  return {
    source: "custom",
    name: item.name,
    brand: item.brand ?? undefined,
    caloriesPer100g: item.caloriesPer100g,
    proteinPer100g: item.proteinPer100g,
    carbsPer100g: item.carbsPer100g,
    fatPer100g: item.fatPer100g,
    defaultPortionG: item.defaultPortionG ?? undefined,
    defaultPortionLabel: item.defaultPortionLabel ?? undefined,
  };
}

export function RecentFoodList({
  items,
  onSelect,
}: {
  items: RecentFoodItem[];
  onSelect: (food: NormalizedFood, existingFoodItemId: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-neutral-500">Recent</p>
      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(toNormalizedFood(item), item.id)}
            className="flex w-full items-start justify-between gap-3 rounded-lg border border-neutral-200 p-3 text-left text-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50"
          >
            <span>
              <span className="block font-medium">{item.name}</span>
              {item.brand && <span className="block text-neutral-500">{item.brand}</span>}
              <span className="block text-neutral-500">
                {calorieDisplay(toNormalizedFood(item))}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
