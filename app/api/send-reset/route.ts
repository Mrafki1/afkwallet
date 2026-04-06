import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const token_hash = data.properties.hashed_token;
  const resetLink = `https://pointsbinder.com/auth/reset?token_hash=${token_hash}&type=recovery`;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error: emailError } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: "Reset your PointsBinder password",
    html: `
      <p>You requested a password reset for your PointsBinder account.</p>
      <p><a href="${resetLink}" style="background:#2563eb;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Reset Password</a></p>
      <p>Or copy this link: ${resetLink}</p>
      <p>This link expires in 24 hours. If you didn't request this, ignore this email.</p>
    `,
  });

  if (emailError) return NextResponse.json({ error: "Failed to send email" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
