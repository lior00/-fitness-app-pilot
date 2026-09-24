"use client";

import { useState } from "react";
import { FoodSearch, ServingConversionNote } from "@/components/food-search";
import { RecentFoodList } from "@/components/recent-food-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { NormalizedFood } from "@/lib/food-sources/types";
import type { RecentFoodItem } from "@/lib/recent-foods";

export type EditableIngredient = {
  food: NormalizedFood;
  quantityG: string;
  existingFoodItemId: string | null;
};

export function IngredientEditor({
  ingredients,
  onAdd,
  onUpdateQuantity,
  onRemove,
  recentFoods,
}: {
  ingredients: EditableIngredient[];
  onAdd: (food: NormalizedFood, existingFoodItemId?: string) => void;
  onUpdateQuantity: (index: number, quantityG: string) => void;
  onRemove: (index: number) => void;
  recentFoods: RecentFoodItem[];
}) {
  const [addingIngredient, setAddingIngredient] = useState(false);

  function handleAdd(food: NormalizedFood, existingFoodItemId?: string) {
    onAdd(food, existingFoodItemId);
    setAddingIngredient(false);
  }

  return (
    <div className="space-y-2">
      {ingredients.map((ing, i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded-lg border border-neutral-200 p-2"
        >
          <span className="flex-1 text-sm">
            <span className="block">{ing.food.name}</span>
            <ServingConversionNote food={ing.food} />
          </span>
          <Input
            type="number"
            placeholder="100"
            value={ing.quantityG}
            onChange={(e) => onUpdateQuantity(i, e.target.value)}
            className="w-20"
          />
          <span className="text-xs text-neutral-500">g</span>
          <Button type="button" size="xs" variant="ghost" onClick={() => onRemove(i)}>
            Remove
          </Button>
        </div>
      ))}

      {addingIngredient ? (
        <div className="space-y-2 rounded-lg border border-neutral-200 p-3">
          {recentFoods.length > 0 && (
            <RecentFoodList items={recentFoods} onSelect={handleAdd} />
          )}
          <FoodSearch onSelect={handleAdd} />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setAddingIngredient(false)}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAddingIngredient(true)}
        >
          Add ingredient
        </Button>
      )}
    </div>
  );
}
