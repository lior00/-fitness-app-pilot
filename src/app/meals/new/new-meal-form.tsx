"use client";

import { useState, useTransition } from "react";
import { FoodSearch } from "@/components/food-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { NormalizedFood } from "@/lib/food-sources/types";
import { createCustomMeal } from "../actions";

type Ingredient = { food: NormalizedFood; quantityG: string };

export function NewMealForm() {
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [addingIngredient, setAddingIngredient] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function addIngredient(food: NormalizedFood) {
    setIngredients((prev) => [...prev, { food, quantityG: "100" }]);
    setAddingIngredient(false);
  }

  function updateQuantity(index: number, quantityG: string) {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, quantityG } : ing)),
    );
  }

  function removeIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    if (!name.trim() || ingredients.length === 0) return;
    setError(undefined);
    startTransition(async () => {
      const result = await createCustomMeal({
        name: name.trim(),
        ingredients: ingredients.map((ing) => ({
          food: { type: "new", food: ing.food },
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
        <Input
          id="mealName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Chicken & rice bowl"
        />
      </div>

      <div className="space-y-2">
        <Label>Ingredients</Label>
        {ingredients.map((ing, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg border border-neutral-200 p-2"
          >
            <span className="flex-1 text-sm">{ing.food.name}</span>
            <Input
              type="number"
              value={ing.quantityG}
              onChange={(e) => updateQuantity(i, e.target.value)}
              className="w-20"
            />
            <span className="text-xs text-neutral-500">g</span>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={() => removeIngredient(i)}
            >
              Remove
            </Button>
          </div>
        ))}

        {addingIngredient ? (
          <div className="space-y-2 rounded-lg border border-neutral-200 p-3">
            <FoodSearch onSelect={addIngredient} />
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

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={pending || !name.trim() || ingredients.length === 0}
      >
        {pending ? "Saving..." : "Save meal"}
      </Button>
    </div>
  );
}
