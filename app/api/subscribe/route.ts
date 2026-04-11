/**
 * POST /api/subscribe
 * Adds an email to the subscribers table and sends a welcome email.
 * Body: { email: string; source?: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = (body.email ?? "").trim().toLowerCase();
  const source = (body.source ?? "homepage").trim();

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Insert — ignore duplicate (email is UNIQUE)
  const { error } = await supabase
    .from("subscribers")
    .insert({ email, source });

  if (error) {
    if (error.code === "23505") {
      // Already subscribed — treat as success so we don't leak whether an email exists
      return NextResponse.json({ ok: true, alreadySubscribed: true });
    }
    console.error("subscribe insert error:", error.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  // Send welcome email
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM;
  const siteUrl   = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pointsbinder.com";

  if (resendKey && fromEmail) {
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "You're on the PointsBinder list 🇨🇦",
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">

        <tr><td style="background:#0f172a;padding:28px 32px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#2563eb;width:28px;height:28px;border-radius:8px;text-align:center;vertical-align:middle;">
                <span style="color:#fff;font-size:13px;font-weight:700;">P</span>
              </td>
              <td style="padding-left:10px;">
                <span style="color:#fff;font-size:16px;font-weight:700;">PointsBinder</span>
              </td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.02em;">
            You're in. 🎉
          </h1>
          <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
            You'll be the first to know when Canadian credit card welcome bonuses go up — so you can apply at the right time and collect the maximum payout.
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
            In the meantime, here's where to start:
          </p>

          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
            <tr>
              <td style="padding:12px;background:#eff6ff;border-radius:10px;border:1px solid #bfdbfe;">
                <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#1d4ed8;">Browse the best cards right now</p>
                <p style="margin:0 0 10px;font-size:13px;color:#64748b;">Compare first-year value and portal bonuses side by side.</p>
                <a href="${siteUrl}/cards" style="display:inline-block;background:#2563eb;color:#fff;font-size:13px;font-weight:600;padding:8px 18px;border-radius:8px;text-decoration:none;">View all cards →</a>
              </td>
            </tr>
          </table>

          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding:12px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
                <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#0f172a;">What is a rebate portal?</p>
                <p style="margin:0 0 10px;font-size:13px;color:#64748b;">Get $50–$200 extra just for applying through the right link.</p>
                <a href="${siteUrl}/blog/what-is-a-rebate-portal-and-why-you-should-always-use-one" style="display:inline-block;color:#2563eb;font-size:13px;font-weight:600;text-decoration:none;">Read the guide →</a>
              </td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="padding:16px 32px;border-top:1px solid #f1f5f9;">
          <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">
            You subscribed at <a href="${siteUrl}" style="color:#94a3b8;">${siteUrl}</a>.
            Not financial advice. Offer details change — always verify before applying.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
    }).catch(err => console.error("welcome email failed:", err));
  }

  return NextResponse.json({ ok: true });
}
