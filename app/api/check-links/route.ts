/**
 * GET /api/check-links
 * Checks every portal URL AND direct_link URL for every published card.
 *   - 404 → auto-remove portal (direct_link is kept, only flagged)
 *   - Redirect to a known homepage → treat as dead offer
 *   - Soft-404 body patterns → dead offer
 *   - CCG is a client-side SPA: skip body check, only verify URL structure
 *
 * Writes per-URL status to the `link_health` table.
 * Fires an alert (Slack/email) when previously-OK links go broken.
 *
 * Protected by CRON_SECRET. Called by Vercel cron daily.
 */

import { NextRequest, NextResponse } from "next/server";
import { pingHealthcheck } from "../../lib/healthcheck";
import { sendAlert } from "../../lib/notify";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// ── Patterns ───────────────────────────────────────────────────────────────

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

const EXPIRED_PATTERNS = [
  /page (not|no longer) found/i,
  /offer (not|no longer) (found|available|valid)/i,
  /offer has (ended|expired)/i,
  /this offer is (expired|no longer available|closed)/i,
  /card (not|no longer) (found|available)/i,
  /this (page|offer|card) (does not|doesn't) exist/i,
  /sorry.*not found/i,
  /we couldn.t find (this|that|the)/i,
  /no longer available/i,
  /promotion has (ended|expired)/i,
];

function isHomepageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const parts = u.pathname.replace(/\/$/, "").split("/").filter(Boolean);
    if (parts.length < 2) return true;
    return HOMEPAGE_PATTERNS.some(p => p.test(url));
  } catch { return true; }
}

// ── Single URL check ──────────────────────────────────────────────────────

type CheckResult = { status: "ok" | "broken" | "unknown"; reason: string; finalUrl: string };

async function checkUrl(url: string, portalName?: string): Promise<CheckResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-CA,en;q=0.9",
      },
    });
    clearTimeout(timer);
    const finalUrl = res.url;

    if (res.status === 404)  return { status: "broken",  reason: "404 Not Found",                finalUrl };
    if (isHomepageUrl(finalUrl)) return { status: "broken", reason: `redirected to homepage: ${finalUrl}`, finalUrl };
    if (res.status >= 500 || res.status === 403 || res.status === 429)
      return { status: "unknown", reason: `HTTP ${res.status}`, finalUrl };

    // CCG is a client-side SPA — body check gives false positives.
    // Verify URL structure only.
    if (portalName === "CCG") {
      try {
        const u = new URL(finalUrl);
        if (!/\/credit-cards\/[a-z0-9-]+/.test(u.pathname))
          return { status: "broken", reason: `CCG URL lost slug: ${finalUrl}`, finalUrl };
      } catch {
        return { status: "broken", reason: `invalid final URL: ${finalUrl}`, finalUrl };
      }
      return { status: "ok", reason: "HTTP 200 (CCG)", finalUrl };
    }

    if (res.status === 200) {
      const reader = res.body?.getReader();
      let body = "";
      if (reader) {
        const { value } = await reader.read();
        if (value) body = new TextDecoder().decode(value).slice(0, 16_000);
        reader.cancel();
      }
      for (const pat of EXPIRED_PATTERNS) {
        if (pat.test(body)) return { status: "broken", reason: `soft-404: ${pat}`, finalUrl };
      }
    }

    return { status: "ok", reason: `HTTP ${res.status}`, finalUrl };
  } catch (err) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("abort") || msg.includes("timeout"))
      return { status: "unknown", reason: "timeout", finalUrl: url };
    return { status: "unknown", reason: msg.slice(0, 80), finalUrl: url };
  }
}

// ── Route handler ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth   = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[check-links] starting link check run");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: cards, error: dbError } = await supabase
    .from("cards")
    .select("id, name, portals, direct_link")
    .eq("status", "published");
  if (dbError) {
    console.error("[check-links] failed to fetch cards:", dbError.message);
    return NextResponse.json({ ok: false, error: dbError.message }, { status: 500 });
  }

  // Previous link_health state — used to detect *new* breakages for alerting
  const { data: prevRows } = await supabase
    .from("link_health")
    .select("card_id, kind, portal_name, status");
  type PrevRow = { card_id: string; kind: "portal" | "direct"; portal_name: string | null; status: "ok" | "broken" | "unknown" };
  const prevMap = new Map<string, "ok" | "broken" | "unknown">();
  for (const r of (prevRows ?? []) as PrevRow[]) {
    prevMap.set(`${r.card_id}::${r.kind}::${r.portal_name ?? ""}`, r.status);
  }

  type Portal = { name: string; bonus: number; url: string };
  type Card   = { id: string; name: string; portals: Portal[] | null; direct_link: string | null };

  // Build job list
  type Job = { card: Card; kind: "portal" | "direct"; portalName: string | null; url: string };
  const jobs: Job[] = [];
  for (const card of (cards as Card[])) {
    for (const p of (card.portals ?? [])) {
      if (p?.url) jobs.push({ card, kind: "portal", portalName: p.name, url: p.url });
    }
    if (card.direct_link && card.direct_link.startsWith("http")) {
      jobs.push({ card, kind: "direct", portalName: null, url: card.direct_link });
    }
  }

  console.log(`[check-links] ${jobs.length} URLs queued across ${cards!.length} cards`);

  // ── Run in batches ──
  const BATCH = 8;
  type JobResult = Job & CheckResult;
  const results: JobResult[] = [];
  for (let i = 0; i < jobs.length; i += BATCH) {
    const batch = jobs.slice(i, i + BATCH);
    const out = await Promise.all(batch.map(async j => ({ ...j, ...(await checkUrl(j.url, j.portalName ?? undefined)) })));
    results.push(...out);
  }

  const broken  = results.filter(r => r.status === "broken");
  const unknown = results.filter(r => r.status === "unknown");
  const ok      = results.filter(r => r.status === "ok");

  // ── Persist link_health (upsert) ──
  const rows = results.map(r => ({
    card_id:     r.card.id,
    kind:        r.kind,
    portal_name: r.portalName,
    url:         r.url,
    status:      r.status,
    reason:      r.reason,
    checked_at:  new Date().toISOString(),
  }));
  if (rows.length) {
    const { error: upErr } = await supabase
      .from("link_health")
      .upsert(rows, { onConflict: "card_id,kind,portal_name" });
    if (upErr) console.warn("[check-links] link_health upsert:", upErr.message);
  }

  // ── Auto-remove broken PORTAL entries from cards.portals (direct_link is never auto-cleared) ──
  const portalBroken = broken.filter(b => b.kind === "portal");
  const byCard = new Map<string, Set<string>>();  // cardId → set of broken portal names
  for (const b of portalBroken) {
    if (!b.portalName) continue;
    if (!byCard.has(b.card.id)) byCard.set(b.card.id, new Set());
    byCard.get(b.card.id)!.add(b.portalName);
  }

  const removed: { card: string; portal: string; url: string; reason: string }[] = [];
  let updatedCards = 0;
  for (const [cardId, badNames] of byCard) {
    const card = (cards as Card[]).find(c => c.id === cardId);
    if (!card) continue;
    const clean = (card.portals ?? []).filter(p => {
      if (badNames.has(p.name)) {
        const match = portalBroken.find(b => b.card.id === cardId && b.portalName === p.name);
        removed.push({ card: card.name, portal: p.name, url: p.url, reason: match?.reason ?? "broken" });
        return false;
      }
      return true;
    });
    const { error } = await supabase.from("cards").update({ portals: clean }).eq("id", cardId);
    if (!error) updatedCards++;
  }

  // ── Detect NEW breakages for alerting (was "ok" or absent, now "broken") ──
  const newlyBroken = broken.filter(b => {
    const key = `${b.card.id}::${b.kind}::${b.portalName ?? ""}`;
    const prev = prevMap.get(key);
    return prev !== "broken";
  });

  if (newlyBroken.length > 0) {
    const lines = newlyBroken.slice(0, 20).map(b => {
      const label = b.kind === "direct" ? "direct_link" : `portal:${b.portalName}`;
      return `${b.card.name} [${label}] — ${b.reason}`;
    });
    await sendAlert({
      level:   "error",
      title:   `${newlyBroken.length} new broken link${newlyBroken.length === 1 ? "" : "s"} detected`,
      summary: `Portal entries auto-removed. direct_link URLs flagged but preserved (need manual fix).`,
      lines,
      link:    { label: "Open Link Health dashboard", url: "/admin#link-health" },
    });
  }

  console.log(`[check-links] done — checked:${jobs.length} ok:${ok.length} broken:${broken.length} unknown:${unknown.length} portalsRemoved:${removed.length} newlyBroken:${newlyBroken.length}`);

  await pingHealthcheck("HEALTHCHECK_URL_CHECK_LINKS");
  return NextResponse.json({
    ok: true,
    checked:     jobs.length,
    okCount:     ok.length,
    brokenCount: broken.length,
    unknownCount: unknown.length,
    portalsRemoved: removed.length,
    cardsUpdated: updatedCards,
    newlyBroken: newlyBroken.length,
    broken:      broken.map(b => ({
      card: b.card.name, cardId: b.card.id, kind: b.kind, portal: b.portalName, url: b.url, reason: b.reason,
    })),
    removed,
    checkedAt: new Date().toISOString(),
  });
}
