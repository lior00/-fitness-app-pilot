"use client";

import { useState, useTransition } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalorieAdjustmentStepper } from "@/components/calorie-adjustment-stepper";
import {
  DEFAULT_CALORIE_ADJUSTMENT,
  MANUAL_TDEE_MAX,
  MANUAL_TDEE_MIN,
  isValidManualTdee,
  type Goal,
} from "@/lib/tdee";
import { updateSettings } from "./actions";

type FoodRegion = "us" | "il";
type UnitPreference = "metric" | "imperial";

const GOAL_OPTIONS: { value: Goal; label: string; description: string }[] = [
  { value: "cut", label: "Cut", description: "Lose fat, in a calorie deficit" },
  { value: "maintain", label: "Maintain", description: "Stay around your current weight" },
  { value: "bulk", label: "Bulk", description: "Build muscle, in a calorie surplus" },
];

export function SettingsForm({
  initialFoodRegion,
  initialUnitPreference,
  initialGoal,
  initialCalorieAdjustment,
  initialTdeeCalories,
}: {
  initialFoodRegion: FoodRegion;
  initialUnitPreference: UnitPreference;
  initialGoal: Goal;
  initialCalorieAdjustment: number;
  initialTdeeCalories: number;
}) {
  const [foodRegion, setFoodRegion] = useState<FoodRegion>(initialFoodRegion);
  const [unitPreference, setUnitPreference] = useState<UnitPreference>(initialUnitPreference);
  const [goal, setGoal] = useState<Goal>(initialGoal);
  const [calorieAdjustment, setCalorieAdjustment] = useState(initialCalorieAdjustment);
  const [tdeeCalories, setTdeeCalories] = useState(initialTdeeCalories);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function selectGoal(next: Goal) {
    setGoal(next);
    setCalorieAdjustment(DEFAULT_CALORIE_ADJUSTMENT[next]);
  }

  function handleSave() {
    setError(undefined);
    if (!isValidManualTdee(tdeeCalories)) {
      setError(`Maintenance calories must be between ${MANUAL_TDEE_MIN} and ${MANUAL_TDEE_MAX}`);
      return;
    }
    startTransition(async () => {
      const result = await updateSettings({
        foodRegion,
        unitPreference,
        goal,
        calorieAdjustment,
        tdeeCalories,
      });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Food data source</Label>
        <RadioGroup
          value={foodRegion}
          onValueChange={(v) => setFoodRegion(v as FoodRegion)}
          className="grid grid-cols-2 gap-3"
        >
          {(
            [
              { value: "us", label: "US", description: "USDA + Open Food Facts" },
              { value: "il", label: "Israel", description: "Israeli MoH + Open Food Facts" },
            ] as const
          ).map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer flex-col gap-1 rounded-lg border p-3 text-sm transition-colors ${
                foodRegion === option.value
                  ? "border-neutral-900 bg-neutral-50"
                  : "border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <span className="flex items-center gap-2 font-medium">
                <RadioGroupItem value={option.value} />
                {option.label}
              </span>
              <span className="text-xs text-neutral-500">{option.description}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label>Preferred units</Label>
        <RadioGroup
          value={unitPreference}
          onValueChange={(v) => setUnitPreference(v as UnitPreference)}
          className="grid grid-cols-2 gap-3"
        >
          {(
            [
              { value: "metric", label: "Metric", description: "cm / kg" },
              { value: "imperial", label: "Imperial", description: "ft, in / lbs" },
            ] as const
          ).map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer flex-col gap-1 rounded-lg border p-3 text-sm transition-colors ${
                unitPreference === option.value
                  ? "border-neutral-900 bg-neutral-50"
                  : "border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <span className="flex items-center gap-2 font-medium">
                <RadioGroupItem value={option.value} />
                {option.label}
              </span>
              <span className="text-xs text-neutral-500">{option.description}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label>Goal</Label>
        <RadioGroup
          value={goal}
          onValueChange={(v) => selectGoal(v as Goal)}
          className="grid grid-cols-1 gap-3"
        >
          {GOAL_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer flex-col gap-1 rounded-lg border p-3 text-sm transition-colors ${
                goal === option.value
                  ? "border-neutral-900 bg-neutral-50"
                  : "border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <span className="flex items-center gap-2 font-medium">
                <RadioGroupItem value={option.value} />
                {option.label}
              </span>
              <span className="text-xs text-neutral-500">{option.description}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tdee-calories">Maintenance calories (TDEE)</Label>
        <Input
          id="tdee-calories"
          type="number"
          inputMode="numeric"
          min={MANUAL_TDEE_MIN}
          max={MANUAL_TDEE_MAX}
          value={tdeeCalories}
          onChange={(e) => setTdeeCalories(Number(e.target.value))}
        />
        <p className="text-xs text-neutral-500">
          We calculate this from your stats, but you can correct it if it doesn&apos;t match your
          real-world maintenance.
        </p>
      </div>

      <CalorieAdjustmentStepper
        goal={goal}
        value={calorieAdjustment}
        onChange={setCalorieAdjustment}
      />

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <Button type="button" onClick={handleSave} disabled={pending}>
        {pending ? "Saving..." : "Save settings"}
      </Button>
    </div>
  );
}
