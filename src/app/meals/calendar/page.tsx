import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  currentMonthParam,
  daysInMonthGrid,
  formatMonthLabel,
  monthEndIso,
  shiftMonthParam,
  todayIso,
} from "@/lib/date";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const month = monthParam ?? currentMonthParam();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("target_calories")
    .eq("id", user.id)
    .single();
  const targetCalories = profile?.target_calories ?? 0;

  const monthStart = `${month}-01`;
  const monthEnd = monthEndIso(month);
  const { data: logs } = await supabase
    .from("food_logs")
    .select("logged_date, calories")
    .eq("user_id", user.id)
    .gte("logged_date", monthStart)
    .lte("logged_date", monthEnd);

  const totalsByDate = new Map<string, number>();
  for (const row of logs ?? []) {
    totalsByDate.set(row.logged_date, (totalsByDate.get(row.logged_date) ?? 0) + row.calories);
  }

  const cells = daysInMonthGrid(month);
  const today = todayIso();

  return (
    <main className="flex min-h-screen justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <Button size="sm" variant="ghost" render={<Link href="/meals" />}>
          Back
        </Button>

        <div className="flex items-center justify-between">
          <Button
            size="icon-sm"
            variant="outline"
            render={<Link href={`/meals/calendar?month=${shiftMonthParam(month, -1)}`} />}
          >
            ‹
          </Button>
          <span className="text-sm font-medium">{formatMonthLabel(month)}</span>
          <Button
            size="icon-sm"
            variant="outline"
            render={<Link href={`/meals/calendar?month=${shiftMonthParam(month, 1)}`} />}
          >
            ›
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-400">
          {WEEKDAY_LABELS.map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, i) => {
            if (!cell.dateIso) return <div key={i} />;
            const total = totalsByDate.get(cell.dateIso);
            const hasEntries = total !== undefined;
            const isOver = hasEntries && targetCalories > 0 && total > targetCalories;
            const isToday = cell.dateIso === today;

            return (
              <Link
                key={i}
                href={`/meals?date=${cell.dateIso}`}
                className={`flex flex-col items-center rounded-md border p-1.5 text-xs ${
                  isToday ? "border-neutral-900" : "border-neutral-200"
                } ${
                  hasEntries
                    ? isOver
                      ? "bg-red-50"
                      : "bg-green-50"
                    : "bg-transparent"
                }`}
              >
                <span className="font-medium">{Number(cell.dateIso.slice(-2))}</span>
                {hasEntries && (
                  <span className="text-[10px] text-neutral-500">{total}</span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-4 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <span className="size-2.5 rounded-full bg-green-100" /> Under target
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2.5 rounded-full bg-red-100" /> Over target
          </span>
        </div>
      </div>
    </main>
  );
}
