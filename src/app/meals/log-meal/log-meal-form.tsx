"use client";

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

export function LogMealForm({
  meals,
  initialDate,
}: {
  meals: { id: string; name: string }[];
  initialDate: string;
}) {
  const [customMealId, setCustomMealId] = useState(meals[0]?.id ?? "");
  const [mealType, setMealType] = useState<MealType>("snack");
  const [date, setDate] = useState(initialDate);
  const [servings, setServings] = useState("1");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    setError(undefined);
    startTransition(async () => {
      const result = await logCustomMeal({
        customMealId,
        mealType,
        loggedDate: date,
        servings: Number(servings) || 1,
      });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Meal</Label>
        <Select
          value={customMealId}
          onValueChange={(value) => value && setCustomMealId(value)}
        >
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

      <div className="space-y-2">
        <Label htmlFor="servings">Servings</Label>
        <Input
          id="servings"
          type="number"
          step="0.5"
          min="0.5"
          value={servings}
          onChange={(e) => setServings(e.target.value)}
        />
      </div>

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

      <Button type="button" onClick={handleSubmit} disabled={pending}>
        {pending ? "Logging..." : "Log it"}
      </Button>
    </div>
  );
}
