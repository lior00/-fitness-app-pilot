export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysIso(dateIso: string, days: number): string {
  const date = new Date(`${dateIso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function currentMonthParam(): string {
  return new Date().toISOString().slice(0, 7);
}

export function shiftMonthParam(monthIso: string, delta: number): string {
  const [year, month] = monthIso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return date.toISOString().slice(0, 7);
}

export function formatMonthLabel(monthIso: string): string {
  const [year, month] = monthIso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

export function monthEndIso(monthIso: string): string {
  const [year, month] = monthIso.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${monthIso}-${String(lastDay).padStart(2, "0")}`;
}

export function daysInMonthGrid(monthIso: string): { dateIso: string | null }[] {
  const [year, month] = monthIso.split("-").map(Number);
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const leadingBlanks = firstDay.getUTCDay();

  const cells: { dateIso: string | null }[] = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push({ dateIso: null });
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ dateIso: iso });
  }
  return cells;
}

export function formatDisplayDate(dateIso: string): string {
  const date = new Date(`${dateIso}T00:00:00Z`);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
