"use client";

import { Button } from "@/components/ui/button";
import {
  CALORIE_ADJUSTMENT_MAGNITUDE_MAX,
  CALORIE_ADJUSTMENT_MAGNITUDE_MIN,
  CALORIE_ADJUSTMENT_STEP,
  type Goal,
} from "@/lib/tdee";

// Renders nothing for "maintain" — a surplus/deficit doesn't apply there,
// callers should keep the adjustment at 0 for that goal.
export function CalorieAdjustmentStepper({
  goal,
  value,
  onChange,
}: {
  goal: Goal;
  value: number;
  onChange: (value: number) => void;
}) {
  if (goal === "maintain") return null;

  const magnitude = Math.abs(value);
  const sign = goal === "cut" ? -1 : 1;
  const label = goal === "cut" ? "deficit" : "surplus";

  function setMagnitude(next: number) {
    const clamped = Math.min(
      CALORIE_ADJUSTMENT_MAGNITUDE_MAX,
      Math.max(CALORIE_ADJUSTMENT_MAGNITUDE_MIN, next),
    );
    onChange(sign * clamped);
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Daily {label}</p>
      <div className="flex items-center justify-center gap-4 rounded-lg border border-neutral-200 p-3">
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          disabled={magnitude <= CALORIE_ADJUSTMENT_MAGNITUDE_MIN}
          onClick={() => setMagnitude(magnitude - CALORIE_ADJUSTMENT_STEP)}
        >
          −
        </Button>
        <span className="w-28 text-center text-lg font-semibold tabular-nums">
          {sign < 0 ? "−" : "+"}
          {magnitude} kcal
        </span>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          disabled={magnitude >= CALORIE_ADJUSTMENT_MAGNITUDE_MAX}
          onClick={() => setMagnitude(magnitude + CALORIE_ADJUSTMENT_STEP)}
        >
          +
        </Button>
      </div>
      <p className="text-center text-xs text-neutral-500">
        In steps of {CALORIE_ADJUSTMENT_STEP} kcal, {CALORIE_ADJUSTMENT_MAGNITUDE_MIN}-
        {CALORIE_ADJUSTMENT_MAGNITUDE_MAX} kcal/day
      </p>
    </div>
  );
}
