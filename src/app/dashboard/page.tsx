import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { signout } from "./actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("target_calories")
    .eq("id", user.id)
    .single();

  const targetCalories = profile?.target_calories ?? 0;
  // No meal-tracking data exists yet, so nothing has been logged today.
  const caloriesConsumed = 0;
  const caloriesRemaining = targetCalories - caloriesConsumed;
  const progressPercent =
    targetCalories > 0 ? Math.min(100, (caloriesConsumed / targetCalories) * 100) : 0;

  return (
    <main className="flex min-h-screen justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">{user.email}</p>
          <form action={signout}>
            <Button type="submit" variant="ghost" size="sm">
              Log out
            </Button>
          </form>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s calories</CardTitle>
            <CardDescription>
              {targetCalories > 0
                ? `${caloriesConsumed} of ${targetCalories} kcal logged`
                : "Complete onboarding to see your target"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={progressPercent} />
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-semibold">{caloriesRemaining}</span>
              <span className="text-sm text-neutral-500">kcal remaining</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Link href="/workouts">
            <Card className="cursor-pointer transition-colors hover:bg-neutral-50">
              <CardHeader>
                <CardTitle>Workouts</CardTitle>
                <CardDescription>Log a session</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/meals">
            <Card className="cursor-pointer transition-colors hover:bg-neutral-50">
              <CardHeader>
                <CardTitle>Meals</CardTitle>
                <CardDescription>Track what you ate</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </main>
  );
}
