"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  calculateTargetCalories,
  isValidCalorieAdjustment,
  isValidManualTdee,
  type Goal,
} from "@/lib/tdee";

export type SettingsState = { error?: string };

export async function updateSettings(input: {
  foodRegion: "us" | "il";
  unitPreference: "metric" | "imperial";
  goal: Goal;
  calorieAdjustment: number;
  tdeeCalories: number;
}): Promise<SettingsState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!isValidManualTdee(input.tdeeCalories)) {
    return { error: "Maintenance calories must be between 800 and 6000" };
  }

  if (!isValidCalorieAdjustment(input.goal, input.calorieAdjustment)) {
    return { error: "Invalid calorie adjustment" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { error: "Complete onboarding before setting a goal" };
  }

  const targetCalories = calculateTargetCalories(input.tdeeCalories, input.calorieAdjustment);

  const { error } = await supabase
    .from("profiles")
    .update({
      food_region: input.foodRegion,
      unit_preference: input.unitPreference,
      goal: input.goal,
      calorie_adjustment: input.calorieAdjustment,
      tdee_calories: input.tdeeCalories,
      target_calories: targetCalories,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  redirect("/settings?saved=1");
}
