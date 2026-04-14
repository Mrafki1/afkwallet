/**
 * POST /api/admin/update-direct-link { cardId, url }
 * Updates a card's direct_link to the provided URL (admin only).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "../../../lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cardId, url } = await req.json();
  if (!cardId || !url) return NextResponse.json({ error: "Missing cardId or url" }, { status: 400 });
  if (!/^https:\/\//i.test(url)) return NextResponse.json({ error: "URL must be https" }, { status: 400 });

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { error } = await db.from("cards").update({ direct_link: url }).eq("id", cardId);
  if (error) {
    console.error(`[update-direct-link] ${cardId} failed:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  console.log(`[update-direct-link] ${cardId} → ${url} by ${user.email}`);
  return NextResponse.json({ ok: true });
}
