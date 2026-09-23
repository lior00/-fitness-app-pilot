"use client";

import { useState, useTransition } from "react";
import { calorieDisplay, FoodSearch } from "@/components/food-search";
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
import type { NormalizedFood } from "@/lib/food-sources/types";
import { MEAL_TYPE_LABELS, type MealType } from "@/lib/meal-type";
import { logFood } from "../actions";

export function LogFoodForm({ initialDate }: { initialDate: string }) {
  const [selected, setSelected] = useState<NormalizedFood | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualCalories, setManualCalories] = useState("");
  const [manualProtein, setManualProtein] = useState("");
  const [manualCarbs, setManualCarbs] = useState("");
  const [manualFat, setManualFat] = useState("");

  const [quantityG, setQuantityG] = useState("");
  const [mealType, setMealType] = useState<MealType>("snack");
  const [date, setDate] = useState(initialDate);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function selectFood(food: NormalizedFood) {
    setSelected(food);
    setQuantityG(food.defaultPortionG ? String(Math.round(food.defaultPortionG)) : "");
  }

  function handleManualSubmit() {
    if (!manualName.trim() || !manualCalories.trim()) return;
    selectFood({
      source: "custom",
      name: manualName.trim(),
      caloriesPer100g: Number(manualCalories) || 0,
      proteinPer100g: Number(manualProtein) || 0,
      carbsPer100g: Number(manualCarbs) || 0,
      fatPer100g: Number(manualFat) || 0,
    });
  }

  function handleSubmit() {
    if (!selected) return;
    setError(undefined);
    startTransition(async () => {
      const result = await logFood({
        food: { type: "new", food: selected },
        quantityG: Number(quantityG),
        mealType,
        loggedDate: date,
      });
      if (result?.error) setError(result.error);
    });
  }

  if (!selected) {
    return (
      <div className="space-y-4">
        {!manualMode ? (
          <>
            <FoodSearch onSelect={selectFood} />
            <button
              type="button"
              className="text-sm text-neutral-500 underline"
              onClick={() => setManualMode(true)}
            >
              Can&apos;t find it? Add manually
            </button>
          </>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="manualName">Name</Label>
              <Input
                id="manualName"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="manualCalories">Calories / 100g</Label>
                <Input
                  id="manualCalories"
                  type="number"
                  value={manualCalories}
                  onChange={(e) => setManualCalories(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manualProtein">Protein / 100g</Label>
                <Input
                  id="manualProtein"
                  type="number"
                  value={manualProtein}
                  onChange={(e) => setManualProtein(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manualCarbs">Carbs / 100g</Label>
                <Input
                  id="manualCarbs"
                  type="number"
                  value={manualCarbs}
                  onChange={(e) => setManualCarbs(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manualFat">Fat / 100g</Label>
                <Input
                  id="manualFat"
                  type="number"
                  value={manualFat}
                  onChange={(e) => setManualFat(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-between">
              <Button type="button" variant="ghost" onClick={() => setManualMode(false)}>
                Back to search
              </Button>
              <Button type="button" onClick={handleManualSubmit}>
                Continue
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-neutral-200 p-3">
        <p className="text-sm font-medium">{selected.name}</p>
        <p className="text-sm text-neutral-500">{calorieDisplay(selected)}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantityG">Quantity (g)</Label>
        <Input
          id="quantityG"
          type="number"
          placeholder="100"
          value={quantityG}
          onChange={(e) => setQuantityG(e.target.value)}
        />
        {selected.defaultPortionG && (
          <button
            type="button"
            className="text-xs text-neutral-500 underline"
            onClick={() => setQuantityG(String(Math.round(selected.defaultPortionG!)))}
          >
            Use suggested portion
            {selected.defaultPortionLabel ? ` (${selected.defaultPortionLabel})` : ""}
          </button>
        )}
      </div>

      <div className="space-y-2">
        <Label>Meal</Label>
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

      <div className="flex justify-between">
        <Button type="button" variant="ghost" onClick={() => setSelected(null)}>
          Back
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={pending || !quantityG || Number(quantityG) <= 0}
        >
          {pending ? "Logging..." : "Log it"}
        </Button>
      </div>
    </div>
  );
}
