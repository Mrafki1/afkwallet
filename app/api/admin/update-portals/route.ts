import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "../../../lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  // Auth guard
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!user || !adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cardId, portals } = await req.json();
  if (!cardId || !Array.isArray(portals)) {
    return NextResponse.json({ error: "Missing cardId or portals" }, { status: 400 });
  }

  // Validate each portal entry
  for (const p of portals) {
    if (!p.name || typeof p.bonus !== "number" || !p.url) {
      return NextResponse.json({ error: "Each portal needs name, bonus (number), and url" }, { status: 400 });
    }
  }

  const db = getServiceClient();
  const { error } = await db
    .from("cards")
    .update({ portals })
    .eq("id", cardId);

  if (error) {
    console.error(`[update-portals] failed for ${cardId}:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(`[update-portals] ${cardId} updated by ${user.email} — ${portals.length} portal(s)`);
  return NextResponse.json({ ok: true });
}
