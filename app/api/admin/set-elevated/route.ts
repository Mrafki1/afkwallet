/**
 * POST /api/admin/set-elevated
 * Toggles the elevated flag on a card. Admin-only.
 * Body: { cardId: string; elevated: boolean; note?: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "../../../lib/supabase-server";
import { setCardElevated } from "../../../lib/cards-db";

export async function POST(req: NextRequest) {
  // Verify the caller is the admin
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!user || !adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { cardId, elevated, note } = body as { cardId: string; elevated: boolean; note?: string };
  if (!cardId || typeof elevated !== "boolean") {
    return NextResponse.json({ error: "Missing cardId or elevated" }, { status: 400 });
  }

  await setCardElevated(cardId, elevated, note);
  return NextResponse.json({ ok: true });
}
