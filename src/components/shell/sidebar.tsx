"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  LayoutGrid,
  Dumbbell,
  Salad,
  TrendingUp,
  User,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/dashboard/workouts", label: "Workouts", icon: Dumbbell },
  { href: "/dashboard/nutrition", label: "Nutrition", icon: Salad },
  { href: "/dashboard/progress", label: "Progress", icon: TrendingUp },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

export function Sidebar({ signOutAction }: { signOutAction: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col justify-between border-r border-border bg-background px-4 py-6">
      <div>
        <div className="flex items-center gap-2 px-2">
          <Activity className="h-6 w-6 text-primary" strokeWidth={2.5} />
          <div>
            <p className="text-lg font-semibold text-foreground">
              PulseForm
            </p>
            <p className="text-xs text-muted-foreground">Move with intent</p>
          </div>
        </div>

        <nav className="mt-8 flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/dashboard"
                ? pathname === href
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-card text-primary"
                    : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-accent uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            Momentum
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            You are building a sustainable rhythm.
          </p>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full rounded-xl px-3 py-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-card/60 hover:text-foreground"
          >
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}
