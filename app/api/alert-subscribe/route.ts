import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { cards } from "../../data/cards";

export async function POST(request: NextRequest) {
  const { email, cardId } = await request.json();

  if (!email || !cardId) {
    return NextResponse.json({ error: "Missing email or cardId." }, { status: 400 });
  }

  const card = cards.find(c => c.id === cardId);
  const cardName = card?.name ?? cardId;

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: "PointsBinder Alerts <onboarding@resend.dev>",
    to: process.env.ADMIN_EMAIL!,
    subject: `New alert subscriber: ${cardName}`,
    html: `<p><strong>${email}</strong> wants to be notified when <strong>${cardName}</strong> goes elevated.</p>`,
  });

  if (error) {
    console.error("alert-subscribe resend error:", error);
    return NextResponse.json({ error: "Failed to send. Try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
