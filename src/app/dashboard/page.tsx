import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signout } from "./actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <h1 className="text-2xl font-semibold">You&apos;re logged in</h1>
        <p className="text-sm text-neutral-500">{user.email}</p>
        <form action={signout}>
          <button
            type="submit"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium"
          >
            Log out
          </button>
        </form>
      </div>
    </main>
  );
}
