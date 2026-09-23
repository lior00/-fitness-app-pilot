import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchUsda } from "@/lib/food-sources/usda";
import { searchOpenFoodFacts } from "@/lib/food-sources/off";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const [usdaResults, offResults] = await Promise.all([
    searchUsda(query).catch(() => []),
    searchOpenFoodFacts(query).catch(() => []),
  ]);

  return NextResponse.json({ results: [...usdaResults, ...offResults].slice(0, 25) });
}
