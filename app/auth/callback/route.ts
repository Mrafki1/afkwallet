import { NextResponse } from "next/server";
import { createClient } from "../../lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code       = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type       = searchParams.get("type") as "recovery" | "signup" | "magiclink" | "email" | null;
  const next       = searchParams.get("next") ?? "/dashboard";

  // PKCE flow — code exchanged server-side (requires code verifier cookie in same browser)
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Token-hash flow — used when PKCE verifier cookie is missing (e.g. different browser / email app)
  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Both failed — link expired, already used, or invalid
  return NextResponse.redirect(`${origin}/auth/reset?error=invalid`);
}
