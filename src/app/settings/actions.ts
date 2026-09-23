"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SettingsState = { error?: string };

export async function updateSettings(input: {
  foodRegion: "us" | "il";
  unitPreference: "metric" | "imperial";
}): Promise<SettingsState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({
      food_region: input.foodRegion,
      unit_preference: input.unitPreference,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  redirect("/settings?saved=1");
}
