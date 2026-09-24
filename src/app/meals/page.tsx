import { redirect } from "next/navigation";

export default async function MealsRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  redirect(date ? `/dashboard?date=${date}` : "/dashboard");
}
