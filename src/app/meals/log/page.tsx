import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { todayIso } from "@/lib/date";
import { getRecentFoodItems } from "@/lib/recent-foods";
import { LogFoodForm } from "./log-food-form";

export default async function LogFoodPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const resolvedDate = date ?? todayIso();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const recentFoods = await getRecentFoodItems(supabase, user.id);

  return (
    <main className="flex min-h-screen justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <Button
          size="sm"
          variant="ghost"
          render={<Link href={`/dashboard?date=${resolvedDate}&tab=day`} />}
        >
          ‹ Back
        </Button>
        <h1 className="text-2xl font-semibold">Log food</h1>
        <LogFoodForm initialDate={resolvedDate} recentFoods={recentFoods} />
      </div>
    </main>
  );
}
