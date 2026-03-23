import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-CA", {
    year: "numeric", month: "long", day: "numeric",
  });
}

export async function GET(request: NextRequest) {
  // Verify this is coming from Vercel cron (or a manual test with the secret)
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const in30 = addDays(30);
  const in7  = addDays(7);

  // Cards with annual fee due in 30 days
  const { data: feeCards } = await supabase
    .from("user_cards")
    .select("*")
    .eq("annual_fee_date", in30);

  // Cards with MSR deadline in 7 days that aren't complete yet
  const { data: msrCards } = await supabase
    .from("user_cards")
    .select("*")
    .eq("msr_deadline", in7);

  const incompleteMsr = (msrCards ?? []).filter(c => c.msr_spent < c.msr_amount);

  let sent = 0;
  let errors = 0;

  // ── Annual fee reminders ────────────────────────────────────────────────────
  for (const card of feeCards ?? []) {
    try {
      const { data: { user } } = await supabase.auth.admin.getUserById(card.user_id);
      if (!user?.email) continue;

      const cancelBy = new Date(card.annual_fee_date);
      cancelBy.setDate(cancelBy.getDate() - 30);
      const cancelByStr = cancelBy.toISOString().split("T")[0];

      await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: user.email,
        subject: `Annual fee reminder — ${card.card_name} renews in 30 days`,
        html: emailHtml({
          title: `Your ${card.card_name} annual fee is due soon`,
          preheader: `Annual fee renews on ${formatDate(card.annual_fee_date)} — decide before ${formatDate(cancelByStr)}.`,
          body: `
            <p>Your <strong>${card.card_name}</strong> annual fee renews on <strong>${formatDate(card.annual_fee_date)}</strong>.</p>
            <p>If you want to cancel and avoid the fee, you typically need to call before <strong>${formatDate(cancelByStr)}</strong> (30 days before renewal).</p>
            <p>Log in to your dashboard to review this card.</p>
          `,
          ctaText: "View my dashboard",
          ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
        }),
      });
      sent++;
    } catch {
      errors++;
    }
  }

  // ── MSR deadline reminders ──────────────────────────────────────────────────
  for (const card of incompleteMsr) {
    try {
      const { data: { user } } = await supabase.auth.admin.getUserById(card.user_id);
      if (!user?.email) continue;

      const remaining = card.msr_amount - card.msr_spent;
      const pct = Math.round((card.msr_spent / card.msr_amount) * 100);

      await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: user.email,
        subject: `MSR deadline in 7 days — ${card.card_name}`,
        html: emailHtml({
          title: `MSR deadline approaching — ${card.card_name}`,
          preheader: `7 days left to spend $${remaining.toLocaleString()} more to hit your welcome bonus.`,
          body: `
            <p>Your minimum spend requirement for the <strong>${card.card_name}</strong> is due on <strong>${formatDate(card.msr_deadline)}</strong> — that's in 7 days.</p>
            <p>You've spent <strong>$${card.msr_spent.toLocaleString()}</strong> of $${card.msr_amount.toLocaleString()} (${pct}%). You still need <strong>$${remaining.toLocaleString()}</strong> more to unlock your welcome bonus.</p>
          `,
          ctaText: "Log spending",
          ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
        }),
      });
      sent++;
    } catch {
      errors++;
    }
  }

  return NextResponse.json({ sent, errors, feeReminders: feeCards?.length ?? 0, msrReminders: incompleteMsr.length });
}

// ── Simple email template ───────────────────────────────────────────────────
function emailHtml({ title, preheader, body, ctaText, ctaUrl }: {
  title: string; preheader: string; body: string; ctaText: string; ctaUrl: string;
}) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:#7f1d1d;padding:24px 32px;">
          <p style="margin:0;color:#fff;font-size:18px;font-weight:700;letter-spacing:-0.3px;">ChurnCA</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#111827;line-height:1.3;">${title}</h1>
          <div style="font-size:14px;color:#4b5563;line-height:1.7;">${body}</div>
          <div style="margin-top:28px;">
            <a href="${ctaUrl}" style="display:inline-block;background:#7f1d1d;color:#fff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:10px;text-decoration:none;">${ctaText} →</a>
          </div>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">You're receiving this because you track cards on ChurnCA. Offers change frequently — always verify before acting.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
