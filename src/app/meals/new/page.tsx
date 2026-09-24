import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRecentFoodItems } from "@/lib/recent-foods";
import { NewMealForm } from "./new-meal-form";

export default async function NewMealPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const recentFoods = await getRecentFoodItems(supabase, user.id);

  return (
    <main className="flex min-h-screen justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-semibold">Build a meal</h1>
        <NewMealForm recentFoods={recentFoods} />
      </div>
    </main>
  );
}
