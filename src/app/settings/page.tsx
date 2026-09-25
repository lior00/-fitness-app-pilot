import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("food_region, unit_preference, goal, calorie_adjustment, tdee_calories")
    .eq("id", user.id)
    .single();

  return (
    <main className="flex min-h-screen justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <Button size="sm" variant="ghost" render={<Link href="/dashboard" />}>
          Dashboard
        </Button>

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-neutral-500">
            Food data source, units, and calorie goal.
          </p>
        </div>

        {saved && (
          <p className="rounded-md bg-green-50 p-2 text-sm text-green-700">
            Settings saved.
          </p>
        )}

        <SettingsForm
          initialFoodRegion={(profile?.food_region as "us" | "il") ?? "us"}
          initialUnitPreference={(profile?.unit_preference as "metric" | "imperial") ?? "metric"}
          initialGoal={(profile?.goal as "cut" | "maintain" | "bulk") ?? "maintain"}
          initialCalorieAdjustment={profile?.calorie_adjustment ?? 0}
          initialTdeeCalories={profile?.tdee_calories ?? 0}
        />
      </div>
    </main>
  );
}
