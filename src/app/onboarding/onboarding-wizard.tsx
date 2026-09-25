"use client";

import { useState, useTransition } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CalorieAdjustmentStepper } from "@/components/calorie-adjustment-stepper";
import {
  ACTIVITY_LEVEL_OPTIONS,
  DEFAULT_CALORIE_ADJUSTMENT,
  type ActivityLevel,
  type Gender,
  type Goal,
} from "@/lib/tdee";
import { completeOnboarding } from "./actions";

type UnitSystem = "metric" | "imperial";
type FoodRegion = "us" | "il";

type FormState = {
  foodRegion: FoodRegion;
  gender: Gender | undefined;
  age: string;
  unitSystem: UnitSystem;
  heightCm: string;
  heightFt: string;
  heightIn: string;
  weightKg: string;
  weightLbs: string;
  activityLevel: ActivityLevel | undefined;
  goal: Goal | undefined;
  calorieAdjustment: number;
};

const INITIAL_STATE: FormState = {
  foodRegion: "us",
  gender: undefined,
  age: "",
  unitSystem: "metric",
  heightCm: "",
  heightFt: "",
  heightIn: "",
  weightKg: "",
  weightLbs: "",
  activityLevel: undefined,
  goal: undefined,
  calorieAdjustment: 0,
};

const STEPS = [
  "Region",
  "About you",
  "Height & weight",
  "Activity level",
  "Goal",
] as const;

const REGION_OPTIONS: { value: FoodRegion; label: string; description: string }[] = [
  { value: "us", label: "United States / Canada", description: "USDA food database" },
  { value: "il", label: "Israel", description: "Israeli Ministry of Health food database" },
];

const GOAL_OPTIONS: { value: Goal; label: string; description: string }[] = [
  { value: "cut", label: "Cut", description: "Lose fat, in a calorie deficit" },
  { value: "maintain", label: "Maintain", description: "Stay around your current weight" },
  { value: "bulk", label: "Bulk", description: "Build muscle, in a calorie surplus" },
];

function OptionCard({
  selected,
  title,
  description,
  onSelect,
}: {
  selected: boolean;
  title: string;
  description?: string;
  onSelect: () => void;
}) {
  return (
    <label
      onClick={onSelect}
      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
        selected
          ? "border-neutral-900 bg-neutral-50"
          : "border-neutral-200 hover:border-neutral-300"
      }`}
    >
      <span
        className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${
          selected ? "border-neutral-900 bg-neutral-900" : "border-neutral-300"
        }`}
      >
        {selected && <span className="size-1.5 rounded-full bg-white" />}
      </span>
      <span>
        <span className="block text-sm font-medium">{title}</span>
        {description && (
          <span className="block text-sm text-neutral-500">{description}</span>
        )}
      </span>
    </label>
  );
}

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function selectGoal(goal: Goal) {
    setForm((prev) => ({ ...prev, goal, calorieAdjustment: DEFAULT_CALORIE_ADJUSTMENT[goal] }));
  }

  function canAdvance(): boolean {
    switch (step) {
      case 0:
        return true;
      case 1:
        return Boolean(form.gender) && form.age.trim() !== "";
      case 2:
        if (form.unitSystem === "metric") {
          return form.heightCm.trim() !== "" && form.weightKg.trim() !== "";
        }
        return (
          (form.heightFt.trim() !== "" || form.heightIn.trim() !== "") &&
          form.weightLbs.trim() !== ""
        );
      case 3:
        return Boolean(form.activityLevel);
      case 4:
        return Boolean(form.goal);
      default:
        return false;
    }
  }

  function handleNext() {
    setError(undefined);
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    startTransition(async () => {
      const result = await completeOnboarding({
        foodRegion: form.foodRegion,
        gender: form.gender!,
        age: form.age as unknown as number,
        unitSystem: form.unitSystem,
        heightCm: form.heightCm ? (form.heightCm as unknown as number) : undefined,
        heightFt: form.heightFt ? (form.heightFt as unknown as number) : undefined,
        heightIn: form.heightIn ? (form.heightIn as unknown as number) : undefined,
        weightKg: form.weightKg ? (form.weightKg as unknown as number) : undefined,
        weightLbs: form.weightLbs ? (form.weightLbs as unknown as number) : undefined,
        activityLevel: form.activityLevel!,
        goal: form.goal!,
        calorieAdjustment: form.calorieAdjustment,
      });
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  function handleBack() {
    setError(undefined);
    setStep((s) => Math.max(0, s - 1));
  }

  const progressValue = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <Progress value={progressValue} />
        <p className="text-sm text-neutral-500">
          Step {step + 1} of {STEPS.length} — {STEPS[step]}
        </p>
      </div>

      {step === 0 && (
        <div className="space-y-3">
          {REGION_OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              selected={form.foodRegion === option.value}
              title={option.label}
              description={option.description}
              onSelect={() => update("foodRegion", option.value)}
            />
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Gender</Label>
            <RadioGroup
              value={form.gender ?? ""}
              onValueChange={(value) => update("gender", value as Gender)}
              className="grid grid-cols-2 gap-3"
            >
              {(["male", "female"] as const).map((value) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm capitalize transition-colors ${
                    form.gender === value
                      ? "border-neutral-900 bg-neutral-50"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <RadioGroupItem value={value} />
                  {value}
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              min={13}
              max={120}
              value={form.age}
              onChange={(e) => update("age", e.target.value)}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Units</Label>
            <ToggleGroup
              value={[form.unitSystem]}
              onValueChange={(value) => {
                if (value[0]) update("unitSystem", value[0] as UnitSystem);
              }}
              variant="outline"
            >
              <ToggleGroupItem value="metric" className="flex-1">
                Metric (cm / kg)
              </ToggleGroupItem>
              <ToggleGroupItem value="imperial" className="flex-1">
                Imperial (ft, in / lbs)
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {form.unitSystem === "metric" ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="heightCm">Height (cm)</Label>
                <Input
                  id="heightCm"
                  type="number"
                  value={form.heightCm}
                  onChange={(e) => update("heightCm", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weightKg">Weight (kg)</Label>
                <Input
                  id="weightKg"
                  type="number"
                  value={form.weightKg}
                  onChange={(e) => update("weightKg", e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="heightFt">Height (ft)</Label>
                  <Input
                    id="heightFt"
                    type="number"
                    value={form.heightFt}
                    onChange={(e) => update("heightFt", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heightIn">Height (in)</Label>
                  <Input
                    id="heightIn"
                    type="number"
                    value={form.heightIn}
                    onChange={(e) => update("heightIn", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weightLbs">Weight (lbs)</Label>
                <Input
                  id="weightLbs"
                  type="number"
                  value={form.weightLbs}
                  onChange={(e) => update("weightLbs", e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          {ACTIVITY_LEVEL_OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              selected={form.activityLevel === option.value}
              title={option.label}
              description={option.description}
              onSelect={() => update("activityLevel", option.value)}
            />
          ))}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div className="space-y-3">
            {GOAL_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                selected={form.goal === option.value}
                title={option.label}
                description={option.description}
                onSelect={() => selectGoal(option.value)}
              />
            ))}
          </div>
          {form.goal && (
            <CalorieAdjustmentStepper
              goal={form.goal}
              value={form.calorieAdjustment}
              onChange={(value) => update("calorieAdjustment", value)}
            />
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={handleBack} disabled={step === 0 || pending}>
          Back
        </Button>
        <Button type="button" onClick={handleNext} disabled={!canAdvance() || pending}>
          {step === STEPS.length - 1 ? (pending ? "Saving..." : "Finish") : "Next"}
        </Button>
      </div>
    </div>
  );
}
