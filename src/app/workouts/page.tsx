import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function WorkoutsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Workouts</h1>
        <p className="text-sm text-neutral-500">
          Workout logging is coming soon.
        </p>
        <Button render={<Link href="/dashboard" />} variant="outline">
          Back to dashboard
        </Button>
      </div>
    </main>
  );
}
