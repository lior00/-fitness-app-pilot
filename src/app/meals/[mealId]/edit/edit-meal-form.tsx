"use client";

import { useState, useTransition } from "react";
import { IngredientEditor, type EditableIngredient } from "@/components/ingredient-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { NormalizedFood } from "@/lib/food-sources/types";
import type { RecentFoodItem } from "@/lib/recent-foods";
import { deleteCustomMeal, updateCustomMeal } from "../../actions";

type InitialIngredient = {
  foodItemId: string;
  name: string;
  quantityG: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
};

function toEditable(ing: InitialIngredient): EditableIngredient {
  const food: NormalizedFood = {
    source: "custom",
    name: ing.name,
    caloriesPer100g: ing.caloriesPer100g,
    proteinPer100g: ing.proteinPer100g,
    carbsPer100g: ing.carbsPer100g,
    fatPer100g: ing.fatPer100g,
  };
  return { food, quantityG: String(ing.quantityG), existingFoodItemId: ing.foodItemId };
}

export function EditMealForm({
  mealId,
  initialName,
  initialIngredients,
  recentFoods,
}: {
  mealId: string;
  initialName: string;
  initialIngredients: InitialIngredient[];
  recentFoods: RecentFoodItem[];
}) {
  const [name, setName] = useState(initialName);
  const [ingredients, setIngredients] = useState<EditableIngredient[]>(
    initialIngredients.map(toEditable),
  );
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function addIngredient(food: NormalizedFood, existingFoodItemId?: string) {
    const quantityG = food.defaultPortionG ? String(Math.round(food.defaultPortionG)) : "";
    setIngredients((prev) => [
      ...prev,
      { food, quantityG, existingFoodItemId: existingFoodItemId ?? null },
    ]);
  }

  function updateQuantity(index: number, quantityG: string) {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, quantityG } : ing)),
    );
  }

  function removeIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  function canSubmit(): boolean {
    return (
      name.trim() !== "" &&
      ingredients.length > 0 &&
      ingredients.every((ing) => ing.quantityG && Number(ing.quantityG) > 0)
    );
  }

  function handleSubmit() {
    if (!canSubmit()) return;
    setError(undefined);
    startTransition(async () => {
      const result = await updateCustomMeal({
        mealId,
        name: name.trim(),
        ingredients: ingredients.map((ing) => ({
          food: ing.existingFoodItemId
            ? { type: "existing" as const, foodItemId: ing.existingFoodItemId }
            : { type: "new" as const, food: ing.food },
          quantityG: Number(ing.quantityG),
        })),
      });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="mealName">Meal name</Label>
        <Input id="mealName" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>Ingredients</Label>
        <IngredientEditor
          ingredients={ingredients}
          onAdd={addIngredient}
          onUpdateQuantity={updateQuantity}
          onRemove={removeIngredient}
          recentFoods={recentFoods}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between">
        <form action={deleteCustomMeal.bind(null, mealId)}>
          <Button type="submit" variant="destructive" size="sm">
            Delete meal
          </Button>
        </form>
        <Button type="button" onClick={handleSubmit} disabled={pending || !canSubmit()}>
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
