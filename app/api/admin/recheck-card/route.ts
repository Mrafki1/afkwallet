/**
 * POST /api/admin/recheck-card { cardId }
 * Re-runs link health checks for a single card's portals + direct_link, inline.
 * Used by the admin "Recheck now" button.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "../../../lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const HOMEPAGE_PATTERNS = [
  /greatcanadianrebates\.ca\/display\/CreditCards\/?$/i,
  /greatcanadianrebates\.ca\/?$/i,
  /frugalflyer\.ca\/rebates\/?$/i,
  /frugalflyer\.ca\/?$/i,
  /finlywealth\.com\/rebates\/?$/i,
  /finlywealth\.com\/?$/i,
  /creditcardgenius\.ca\/offers\/?$/i,
  /creditcardgenius\.ca\/?$/i,
  /creditcardgenius\.ca\/credit-cards\/?$/i,
];

function isHomepageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const parts = u.pathname.replace(/\/$/, "").split("/").filter(Boolean);
    if (parts.length < 2) return true;
    return HOMEPAGE_PATTERNS.some(p => p.test(url));
  } catch { return true; }
}

type CheckResult = { status: "ok" | "broken" | "unknown"; reason: string };

async function checkUrl(url: string, portalName?: string): Promise<CheckResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    clearTimeout(timer);
    const finalUrl = res.url;
    if (res.status === 404) return { status: "broken", reason: "404 Not Found" };
    if (isHomepageUrl(finalUrl)) return { status: "broken", reason: `redirected to homepage: ${finalUrl}` };
    if (res.status >= 500 || res.status === 403 || res.status === 429)
      return { status: "unknown", reason: `HTTP ${res.status}` };
    if (portalName === "CCG") {
      try {
        const u = new URL(finalUrl);
        if (!/\/credit-cards\/[a-z0-9-]+/.test(u.pathname))
          return { status: "broken", reason: `CCG URL lost slug: ${finalUrl}` };
      } catch { return { status: "broken", reason: `invalid final URL: ${finalUrl}` }; }
    }
    return { status: "ok", reason: `HTTP ${res.status}` };
  } catch (err) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("abort") || msg.includes("timeout"))
      return { status: "unknown", reason: "timeout" };
    return { status: "unknown", reason: msg.slice(0, 80) };
  }
}

export async function POST(req: NextRequest) {
  // Admin auth
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cardId } = await req.json();
  if (!cardId) return NextResponse.json({ error: "Missing cardId" }, { status: 400 });

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: card } = await db
    .from("cards")
    .select("id, portals, direct_link")
    .eq("id", cardId)
    .single();
  if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });

  type Portal = { name: string; bonus: number; url: string };
  const portals = (card.portals as Portal[] | null) ?? [];
  const rows: {
    card_id: string; kind: "portal" | "direct"; portal_name: string | null;
    url: string; status: string; reason: string; checked_at: string;
  }[] = [];

  const now = new Date().toISOString();
  const results: { label: string; status: string; reason: string }[] = [];

  for (const p of portals) {
    const r = await checkUrl(p.url, p.name);
    rows.push({ card_id: cardId, kind: "portal", portal_name: p.name, url: p.url, status: r.status, reason: r.reason, checked_at: now });
    results.push({ label: `portal:${p.name}`, status: r.status, reason: r.reason });
  }
  if (card.direct_link && /^https?:\/\//.test(card.direct_link)) {
    const r = await checkUrl(card.direct_link);
    rows.push({ card_id: cardId, kind: "direct", portal_name: null, url: card.direct_link, status: r.status, reason: r.reason, checked_at: now });
    results.push({ label: "direct_link", status: r.status, reason: r.reason });
  }

  if (rows.length) await db.from("link_health").upsert(rows, { onConflict: "card_id,kind,portal_name" });

  return NextResponse.json({ ok: true, results });
}
