/**
 * GET /api/check-links
 * Checks all portal URLs stored in Supabase for each card.
 * Removes entries that are clearly broken (404) or redirect to a known homepage.
 * Protected by CRON_SECRET.
 *
 * Called by Vercel cron daily (see vercel.json).
 * Can also be triggered manually: GET /api/check-links with Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from "next/server";
import { pingHealthcheck } from "../../lib/healthcheck";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// ── Homepage patterns — if a portal URL redirects here, the offer is gone ──

const HOMEPAGE_PATTERNS = [
  /greatcanadianrebates\.ca\/display\/CreditCards\/?$/i,
  /greatcanadianrebates\.ca\/?$/i,
  /frugalflyer\.ca\/rebates\/?$/i,
  /frugalflyer\.ca\/?$/i,
  /finlywealth\.com\/rebates\/?$/i,
  /finlywealth\.com\/?$/i,
  /creditcardgenius\.ca\/offers\/?$/i,
  /creditcardgenius\.ca\/?$/i,
];

function isHomepageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const parts = u.pathname.replace(/\/$/, "").split("/").filter(Boolean);
    if (parts.length < 2) return true;
    return HOMEPAGE_PATTERNS.some(p => p.test(url));
  } catch {
    return true;
  }
}

// ── Check a single URL ─────────────────────────────────────────────────────
// Returns: "ok" | "broken" | "unknown"
// "unknown" = server error/timeout/blocked — keep the entry, can't confirm

async function checkUrl(url: string): Promise<{ status: "ok" | "broken" | "unknown"; reason: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  try {
    // Some sites reject HEAD — use GET with a range header to avoid downloading the whole page
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PointsBinderBot/1.0)",
        "Range": "bytes=0-0",
      },
    });

    clearTimeout(timer);

    // Final URL after redirects
    const finalUrl = res.url;

    if (res.status === 404) {
      return { status: "broken", reason: "404 Not Found" };
    }

    if (isHomepageUrl(finalUrl)) {
      return { status: "broken", reason: `redirected to homepage: ${finalUrl}` };
    }

    // 403, 429, 5xx — can't confirm broken, keep it
    if (res.status >= 500 || res.status === 403 || res.status === 429) {
      return { status: "unknown", reason: `HTTP ${res.status}` };
    }

    return { status: "ok", reason: `HTTP ${res.status}` };
  } catch (err: unknown) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("abort") || msg.includes("timeout")) {
      return { status: "unknown", reason: "timeout" };
    }
    return { status: "unknown", reason: msg.slice(0, 80) };
  }
}

// ── Route handler ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth   = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET ?? "";

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: cards, error: dbError } = await supabase
    .from("cards")
    .select("id, name, portals")
    .eq("status", "published");

  if (dbError) {
    return NextResponse.json({ ok: false, error: dbError.message }, { status: 500 });
  }

  type Portal = { name: string; bonus: number; url: string };
  type Card   = { id: string; name: string; portals: Portal[] | null };

  const broken:  { card: string; portal: string; url: string; reason: string }[] = [];
  const unknown: { card: string; portal: string; url: string; reason: string }[] = [];
  const removed: { card: string; portal: string; url: string }[] = [];
  let   checked = 0;

  // Collect all URLs to check
  const checks: { card: Card; portal: Portal }[] = [];
  for (const card of (cards as Card[])) {
    for (const portal of (card.portals ?? [])) {
      checks.push({ card, portal });
    }
  }

  // Check in batches of 8 (avoid hammering servers or hitting Vercel memory limits)
  const BATCH = 8;
  const results = new Map<string, "ok" | "broken" | "unknown">();

  for (let i = 0; i < checks.length; i += BATCH) {
    const batch = checks.slice(i, i + BATCH);
    await Promise.all(batch.map(async ({ card, portal }) => {
      const key = `${card.id}::${portal.name}`;
      const { status, reason } = await checkUrl(portal.url);
      checked++;
      results.set(key, status);

      if (status === "broken") {
        broken.push({ card: card.name, portal: portal.name, url: portal.url, reason });
      } else if (status === "unknown") {
        unknown.push({ card: card.name, portal: portal.name, url: portal.url, reason });
      }
    }));
  }

  // Remove broken entries from Supabase
  const toUpdate = (cards as Card[]).filter(card =>
    (card.portals ?? []).some(p => results.get(`${card.id}::${p.name}`) === "broken")
  );

  let updated = 0;
  for (const card of toUpdate) {
    const cleanPortals = (card.portals ?? []).filter(p => {
      const status = results.get(`${card.id}::${p.name}`);
      if (status === "broken") {
        removed.push({ card: card.name, portal: p.name, url: p.url });
        return false;
      }
      return true;
    });
    const { error } = await supabase.from("cards").update({ portals: cleanPortals }).eq("id", card.id);
    if (!error) updated++;
  }

  await pingHealthcheck("HEALTHCHECK_URL_CHECK_LINKS");
  return NextResponse.json({
    ok: true,
    checked,
    brokenFound: broken.length,
    removedFromDb: removed.length,
    cardsUpdated: updated,
    broken,
    unknown,
    removed,
    checkedAt: new Date().toISOString(),
  });
}
