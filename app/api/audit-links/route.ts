/**
 * GET|POST /api/audit-links
 * Audits every directLink and portal URL stored in Supabase.
 *
 * For each card it:
 *   1. HEAD-checks the directLink (logs broken ones, does NOT auto-remove)
 *   2. HEAD-checks every portal URL; removes stale or homepage-only entries
 *      from the card's portals array and writes the fix back to Supabase
 *
 * Protected by Authorization: Bearer <CRON_SECRET>
 * Called by Vercel cron (see vercel.json) — also callable manually.
 *
 * Returns a JSON report with:
 *   { ok, audited, brokenDirectLinks[], fixedCards[], removedPortalEntries[], startedAt, completedAt }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 300;
export const dynamic     = "force-dynamic";

// ── Types ─────────────────────────────────────────────────────────────────

type Portal = { name: string; bonus: number; url: string };
type DbCard = { id: string; name: string; direct_link: string; portals: Portal[] | null };

type CheckResult = { ok: boolean; status: number | null; error?: string };

type BrokenDirectLink  = { cardId: string; cardName: string; url: string; status: number | null; error?: string };
type RemovedPortalEntry = { cardId: string; cardName: string; portal: string; url: string; reason: string };

// ── Homepage / listing-page URLs that are never card-specific ─────────────

const HOMEPAGE_URLS = new Set([
  "https://www.greatcanadianrebates.ca/",
  "https://www.greatcanadianrebates.ca",
  "https://www.greatcanadianrebates.ca/display/CreditCards/",
  "https://www.greatcanadianrebates.ca/display/CreditCards",
  "https://frugalflyer.ca/",
  "https://frugalflyer.ca",
  "https://frugalflyer.ca/rebates/",
  "https://frugalflyer.ca/rebates",
  "https://finlywealth.com/",
  "https://finlywealth.com",
  "https://finlywealth.com/rebates/",
  "https://finlywealth.com/rebates",
  "https://www.creditcardgenius.ca/",
  "https://www.creditcardgenius.ca",
  "https://creditcardgenius.ca/",
  "https://creditcardgenius.ca",
  "https://www.americanexpress.com/en-ca/",
  "https://www.americanexpress.com/en-ca",
]);

function isHomepageUrl(url: string): boolean {
  if (!url) return true;
  if (HOMEPAGE_URLS.has(url)) return true;
  try {
    const u = new URL(url);
    const parts = u.pathname.replace(/\/$/, "").split("/").filter(Boolean);
    // Must have at least 2 path segments to be a card-specific URL
    return parts.length < 2;
  } catch {
    return true;
  }
}

// ── URL checker ──────────────────────────────────────────────────────────

async function checkUrl(url: string): Promise<CheckResult> {
  if (!url) return { ok: false, status: null, error: "empty url" };

  const UA = "Mozilla/5.0 (compatible; PointsBinder-LinkAudit/1.0; +https://pointsbinder.com)";

  // Try HEAD first — fast, low bandwidth
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": UA },
    });

    // Some servers return 405 for HEAD — fall back to GET with Range header
    if (res.status === 405 || res.status === 501) {
      const res2 = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(8000),
        headers: { "User-Agent": UA, "Range": "bytes=0-0" },
      });
      // 206 = Partial Content (Range accepted) → OK
      return { ok: res2.status < 400 || res2.status === 206, status: res2.status };
    }

    return { ok: res.status < 400, status: res.status };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Timeout or network error
    return { ok: false, status: null, error: msg.slice(0, 100) };
  }
}

// ── Batch concurrency helper ──────────────────────────────────────────────

async function runBatched<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    results.push(...await Promise.all(batch.map(fn)));
  }
  return results;
}

// ── Route handler ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }

async function handler(req: NextRequest) {
  const auth   = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET ?? "";

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = new Date().toISOString();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Load all published cards
  const { data, error } = await supabase
    .from("cards")
    .select("id, name, direct_link, portals")
    .eq("status", "published");

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const cards: DbCard[] = (data ?? []);
  const brokenDirectLinks: BrokenDirectLink[]   = [];
  const removedPortalEntries: RemovedPortalEntry[] = [];
  const fixedCardIds: string[]                   = [];

  // ── Check every card ──────────────────────────────────────────────────

  await runBatched(cards, 20, async (card) => {
    const portals: Portal[] = card.portals ?? [];
    const keepPortals: Portal[] = [];
    let portalsDirty = false;

    // 1. Check directLink
    if (card.direct_link) {
      const result = await checkUrl(card.direct_link);
      if (!result.ok) {
        brokenDirectLinks.push({
          cardId:   card.id,
          cardName: card.name,
          url:      card.direct_link,
          status:   result.status,
          error:    result.error,
        });
      }
    }

    // 2. Check each portal URL
    for (const portal of portals) {
      // Remove immediately if it's a homepage / listing URL
      if (isHomepageUrl(portal.url)) {
        removedPortalEntries.push({
          cardId:   card.id,
          cardName: card.name,
          portal:   portal.name,
          url:      portal.url,
          reason:   "homepage/listing URL — not card-specific",
        });
        portalsDirty = true;
        continue;
      }

      // HEAD-check the portal URL
      const result = await checkUrl(portal.url);
      if (!result.ok) {
        removedPortalEntries.push({
          cardId:   card.id,
          cardName: card.name,
          portal:   portal.name,
          url:      portal.url,
          reason:   result.error ?? `HTTP ${result.status}`,
        });
        portalsDirty = true;
      } else {
        keepPortals.push(portal);
      }
    }

    // Write back cleaned portals if anything was removed
    if (portalsDirty) {
      const { error: updateErr } = await supabase
        .from("cards")
        .update({ portals: keepPortals })
        .eq("id", card.id);

      if (!updateErr) {
        fixedCardIds.push(card.id);
      } else {
        console.error(`audit-links: failed to update ${card.id}: ${updateErr.message}`);
      }
    }
  });

  const completedAt = new Date().toISOString();

  const report = {
    ok:                   true,
    audited:              cards.length,
    brokenDirectLinks,
    removedPortalEntries,
    fixedCards:           fixedCardIds.length,
    fixedCardIds,
    startedAt,
    completedAt,
    durationMs:           new Date(completedAt).getTime() - new Date(startedAt).getTime(),
  };

  // Log a compact summary so it shows up in Vercel function logs
  console.log(
    `[audit-links] audited=${cards.length}` +
    ` brokenDirect=${brokenDirectLinks.length}` +
    ` removedPortals=${removedPortalEntries.length}` +
    ` fixedCards=${fixedCardIds.length}` +
    ` duration=${report.durationMs}ms`
  );

  return NextResponse.json(report);
}
