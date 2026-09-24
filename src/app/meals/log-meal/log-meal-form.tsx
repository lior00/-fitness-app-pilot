"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MEAL_TYPE_LABELS, type MealType } from "@/lib/meal-type";
import { logCustomMeal } from "../actions";

type Ingredient = {
  id: string;
  foodItemId: string;
  name: string;
  quantityG: number;
  caloriesPer100g: number;
};

type Meal = { id: string; name: string; ingredients: Ingredient[] };

function initialWeights(meal: Meal | undefined): Record<string, string> {
  if (!meal) return {};
  return Object.fromEntries(meal.ingredients.map((ing) => [ing.id, String(ing.quantityG)]));
}

export function LogMealForm({
  meals,
  initialDate,
}: {
  meals: Meal[];
  initialDate: string;
}) {
  const [customMealId, setCustomMealId] = useState(meals[0]?.id ?? "");
  const [weights, setWeights] = useState<Record<string, string>>(() =>
    initialWeights(meals[0]),
  );
  const [mealType, setMealType] = useState<MealType>("snack");
  const [date, setDate] = useState(initialDate);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const selectedMeal = meals.find((m) => m.id === customMealId);

  function selectMeal(id: string) {
    setCustomMealId(id);
    setWeights(initialWeights(meals.find((m) => m.id === id)));
  }

  function canSubmit(): boolean {
    if (!selectedMeal || selectedMeal.ingredients.length === 0) return false;
    return selectedMeal.ingredients.every((ing) => {
      const value = weights[ing.id];
      return value && Number(value) > 0;
    });
  }

  function handleSubmit() {
    if (!selectedMeal || !canSubmit()) return;
    setError(undefined);
    startTransition(async () => {
      const result = await logCustomMeal({
        customMealId,
        mealType,
        loggedDate: date,
        ingredients: selectedMeal.ingredients.map((ing) => ({
          foodItemId: ing.foodItemId,
          quantityG: Number(weights[ing.id]),
        })),
      });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Meal</Label>
        <Select value={customMealId} onValueChange={(value) => value && selectMeal(value)}>
          <SelectTrigger className="w-full">
            <SelectValue>
              {(value: string) => meals.find((m) => m.id === value)?.name ?? "Select a meal"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {meals.map((meal) => (
              <SelectItem key={meal.id} value={meal.id}>
                {meal.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedMeal && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Ingredients</Label>
            <Button
              size="xs"
              variant="ghost"
              render={<Link href={`/meals/${selectedMeal.id}/edit`} />}
            >
              Edit meal
            </Button>
          </div>
          {selectedMeal.ingredients.map((ing) => (
            <div
              key={ing.id}
              className="flex items-center gap-2 rounded-lg border border-neutral-200 p-2"
            >
              <span className="flex-1 text-sm">{ing.name}</span>
              <Input
                type="number"
                value={weights[ing.id] ?? ""}
                onChange={(e) =>
                  setWeights((prev) => ({ ...prev, [ing.id]: e.target.value }))
                }
                className="w-20"
              />
              <span className="text-xs text-neutral-500">g</span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <Label>Meal type</Label>
        <Select value={mealType} onValueChange={(v) => setMealType(v as MealType)}>
          <SelectTrigger className="w-full">
            <SelectValue>{(value: MealType) => MEAL_TYPE_LABELS[value]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="breakfast">Breakfast</SelectItem>
            <SelectItem value="lunch">Lunch</SelectItem>
            <SelectItem value="dinner">Dinner</SelectItem>
            <SelectItem value="snack">Snack</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <Button type="button" onClick={handleSubmit} disabled={pending || !canSubmit()}>
        {pending ? "Logging..." : "Log it"}
      </Button>
    </div>
  );
}
