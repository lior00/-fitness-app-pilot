"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema, resolveMetrics, type OnboardingInput } from "@/lib/validations/onboarding";
import { calculateBmr, calculateTdee, calculateTargetCalories } from "@/lib/tdee";

export type OnboardingState = {
  error?: string;
};

export async function completeOnboarding(input: OnboardingInput): Promise<OnboardingState> {
  const parsed = onboardingSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { heightCm, weightKg } = resolveMetrics(data);
  const bmr = calculateBmr(data.gender, weightKg, heightCm, data.age);
  const tdeeCalories = calculateTdee(bmr, data.activityLevel);
  const targetCalories = calculateTargetCalories(tdeeCalories, data.goal);

  const { error } = await supabase
    .from("profiles")
    .update({
      food_region: data.foodRegion,
      gender: data.gender,
      age: data.age,
      height_cm: heightCm,
      weight_kg: weightKg,
      unit_preference: data.unitSystem,
      activity_level: data.activityLevel,
      goal: data.goal,
      tdee_calories: tdeeCalories,
      target_calories: targetCalories,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}
