import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  const { email, cardId } = await request.json();

  if (!email || !cardId) {
    return NextResponse.json({ error: "Missing email or cardId." }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("alert_subscriptions")
    .upsert({ email, card_id: cardId }, { onConflict: "email,card_id" });

  if (error) {
    console.error("alert-subscribe error:", error);
    return NextResponse.json({ error: "Failed to save. Try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
