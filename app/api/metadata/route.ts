import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data } = await supabase
    .from("site_metadata")
    .select("key, value, updated_at")
    .in("key", ["portals_last_scraped"]);

  const result: Record<string, string> = {};
  for (const row of data ?? []) {
    result[row.key] = row.updated_at ?? row.value;
  }

  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
  });
}
