"use client";

import { useState, useTransition } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateSettings } from "./actions";

type FoodRegion = "us" | "il";
type UnitPreference = "metric" | "imperial";

export function SettingsForm({
  initialFoodRegion,
  initialUnitPreference,
}: {
  initialFoodRegion: FoodRegion;
  initialUnitPreference: UnitPreference;
}) {
  const [foodRegion, setFoodRegion] = useState<FoodRegion>(initialFoodRegion);
  const [unitPreference, setUnitPreference] = useState<UnitPreference>(initialUnitPreference);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function handleSave() {
    setError(undefined);
    startTransition(async () => {
      const result = await updateSettings({ foodRegion, unitPreference });
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
