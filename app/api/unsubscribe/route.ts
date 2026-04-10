import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";

function makeToken(userId: string): string {
  return createHmac("sha256", process.env.CRON_SECRET ?? "").update(userId).digest("hex");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const uid   = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";

  if (!uid || !token || token !== makeToken(uid)) {
    return new NextResponse("Invalid or expired unsubscribe link.", { status: 400, headers: { "Content-Type": "text/plain" } });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase
    .from("user_notification_prefs")
    .upsert({ user_id: uid, email_opted_out: true, msr_reminder: false, fee_reminder: false, updated_at: new Date().toISOString() });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pointsbinder.com";
  return NextResponse.redirect(`${siteUrl}/unsubscribe?status=success`);
}

// Export the token generator so send-reminders can use it
export { makeToken };
