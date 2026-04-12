/**
 * POST /api/scrape-cards
 * Triggers the CCG card scraper and upserts results to Supabase.
 * Protected by CRON_SECRET header.
 *
 * Called by Vercel cron job (see vercel.json).
 * Can also be called manually: POST /api/scrape-cards with Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright-core";
import chromiumBin from "@sparticuz/chromium";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { upsertCards, getCards, recordBonusHistory, recordCardChanges } from "../../lib/cards-db";
import { pingHealthcheck } from "../../lib/healthcheck";
import { sendAlert } from "../../lib/notify";
import type { Card } from "../../data/cards";
import type { CardChange } from "../../lib/cards-db";

export const maxDuration = 300; // 5 minutes (Vercel Pro max)
export const dynamic = "force-dynamic";

const CCG_BASE = "https://www.creditcardgenius.ca";

// ── Type helpers ──────────────────────────────────────────────────────────

type ScrapedCard = Card & { ccgSlug: string; source: "ccg_scrape"; status: "published" };

// ── Shared logic (mirrors scrape-ccg.mjs) ────────────────────────────────

function parseFee(text: string): { str: string; num: number } {
  if (!text || text === "—") return { str: "$0", num: 0 };
  const m = text.replace(/,/g, "").match(/\d+\.?\d*/);
  if (!m) return { str: text.trim(), num: 0 };
  const num = Math.round(parseFloat(m[0]));
  return { str: `$${num}`, num };
}

function parseValue(text: string): string {
  if (!text || text === "—") return "$0";
  const m = text.replace(/,/g, "").match(/\d+/);
  if (!m) return text.trim();
  return `~$${m[0]}`;
}

const ISSUER_GRADIENTS: Record<string, string> = {
  "American Express": "from-blue-600 to-indigo-900",
  "TD":               "from-green-700 to-teal-900",
  "RBC":              "from-blue-700 to-blue-900",
  "CIBC":             "from-red-600 to-red-900",
  "BMO":              "from-blue-600 to-indigo-900",
  "Scotiabank":       "from-red-700 to-red-900",
  "National Bank":    "from-red-600 to-slate-800",
  "HSBC":             "from-red-700 to-slate-900",
  "Desjardins":       "from-green-700 to-teal-900",
  "MBNA":             "from-blue-700 to-slate-900",
  "Capital One":      "from-blue-600 to-slate-800",
  "Tangerine":        "from-orange-500 to-orange-800",
  "PC Financial":     "from-orange-600 to-red-900",
  "Rogers":           "from-red-600 to-slate-900",
};

function getGradient(issuer: string): string {
  for (const [key, val] of Object.entries(ISSUER_GRADIENTS)) {
    if (issuer.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return "from-slate-600 to-slate-900";
}

function detectProgram(name: string, issuer: string): string {
  const n = (name + " " + issuer).toLowerCase();
  if (n.includes("aeroplan"))             return "Aeroplan";
  if (n.includes("membership rewards") || issuer.includes("American Express")) return "Membership Rewards";
  if (n.includes("avion"))                return "RBC Avion";
  if (n.includes("scene"))                return "Scene+";
  if (n.includes("air miles"))            return "Air Miles";
  if (n.includes("td rewards"))           return "TD Rewards";
  if (n.includes("westjet"))              return "WestJet Rewards";
  if (n.includes("cash") || n.includes("cash back")) return "Cash Back";
  return "Rewards";
}

function slugToId(slug: string): string {
  return slug
    .replace(/^american-express-/, "amex-")
    .replace(/^royal-bank-of-canada-/, "rbc-")
    .replace(/^(toronto-dominion|td-bank)-/, "td-")
    .replace(/^bank-of-montreal-/, "bmo-")
    .replace(/^scotiabank-/, "scotia-")
    .replace(/^national-bank-/, "nbc-")
    .replace(/-credit-card$/, "")
    .replace(/-card$/, "")
    .slice(0, 60);
}

// ── Elevation helpers ─────────────────────────────────────────────────────

/**
 * Parse a rough numeric points value from a string like "60,000 pts" or "75,000 points (CAD $750)".
 * Returns 0 if unparseable.
 */
function parsePoints(bonus: string): number {
  if (!bonus) return 0;
  const m = bonus.replace(/,/g, "").match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

// ── Main scrape logic ─────────────────────────────────────────────────────

async function scrapeAllCards(): Promise<ScrapedCard[]> {
  const isVercel = !!process.env.VERCEL;
  const browser = await chromium.launch({
    args: isVercel ? chromiumBin.args : ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    executablePath: isVercel ? await chromiumBin.executablePath() : undefined,
    headless: true,
  });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36",
    extraHTTPHeaders: { "Accept-Language": "en-CA,en;q=0.9" },
  });
  await context.route("**/*.{png,jpg,gif,webp,svg,woff,woff2,ttf}", (r) => r.abort());

  // Step 1: Get card slugs
  const listPage = await context.newPage();
  await listPage.goto(`${CCG_BASE}/credit-cards`, { waitUntil: "networkidle", timeout: 30000 });

  let prev = 0;
  let stable = 0;
  while (stable < 3) {
    await listPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await listPage.waitForTimeout(1500);
    const count = await listPage.evaluate(() =>
      document.querySelectorAll("[id^='card-'], ccg-card-v2, .card-row").length
    );
    if (count === prev) stable++; else stable = 0;
    prev = count;
    if (prev >= 233) break;
  }

  const slugs: string[] = await listPage.evaluate(() => {
    const links = [...document.querySelectorAll('a[href*="/credit-cards/"]')];
    const seen = new Set<string>();
    return links.reduce<string[]>((acc, a) => {
      const m = (a.getAttribute("href") ?? "").match(/\/credit-cards\/([a-z0-9-]+)$/);
      if (m && !seen.has(m[1])) { seen.add(m[1]); acc.push(m[1]); }
      return acc;
    }, []);
  });
  await listPage.close();

  // Step 2: Scrape each detail page
  const results: ScrapedCard[] = [];

  for (let i = 0; i < slugs.length; i += 3) {
    const batch = slugs.slice(i, i + 3);
    const batchCards = await Promise.all(batch.map(async (slug) => {
      const page = await context.newPage();
      try {
        await page.goto(`${CCG_BASE}/credit-cards/${slug}`, { waitUntil: "networkidle", timeout: 20000 });
        await page.waitForTimeout(1000);

        const data = await page.evaluate(() => {
          const text = (s: string, el: Element | Document = document) =>
            el.querySelector(s)?.textContent?.trim() ?? "";
          const blocks = [...document.querySelectorAll(".fees-and-rewards .hidden-card-small")];
          return {
            name:        text("h1"),
            issuer:      text(".breadcrumb li:first-child a"),
            feeText:     blocks[0]?.querySelector(".value")?.textContent?.trim() ?? "",
            bonusVal:    blocks[1]?.querySelector(".value")?.textContent?.trim() ?? "",
            bonusPts:    blocks[1]?.querySelector(".value-subtext span")?.textContent?.trim() ?? "",
            annualVal:   blocks[2]?.querySelector(".value")?.textContent?.trim() ?? "",
            description: text(".short-description, .card-description") || text("meta[name='description']"),
            hasLounge:   document.body.innerText.toLowerCase().includes("lounge access"),
            noFx:        document.body.innerText.toLowerCase().includes("no foreign transaction"),
            applyLink:   document.querySelector("a.apply-button, a.btn-apply")?.getAttribute("href") ?? "",
          };
        });

        if (!data.name) return null;
        const fee = parseFee(data.feeText);
        const id  = slugToId(slug);
        const program = detectProgram(data.name, data.issuer);

        const card: ScrapedCard = {
          id,
          ccgSlug:         slug,
          name:            data.name.replace(/[®™©]/g, "").trim(),
          issuer:          data.issuer || "Unknown",
          annualFee:       fee.str,
          annualFeeNum:    fee.num,
          firstYearValue:  parseValue(data.annualVal),
          pointsBonus:     data.bonusPts ? `${data.bonusPts}${data.bonusVal ? ` (${data.bonusVal})` : ""}` : data.bonusVal,
          msr:             "$3,000",
          portals:         [],
          directLink:      data.applyLink.startsWith("http") ? data.applyLink : "",
          program,
          tags:            [...new Set([
            ...(data.noFx ? ["No FX Fee"] : []),
            ...(data.hasLounge ? ["Lounge Access"] : []),
            ...(fee.num === 0 ? ["No Annual Fee"] : []),
            ...(program === "Cash Back" ? ["Cash Back"] : ["Travel"]),
          ])],
          rewards:         [{ multiplier: "1x", category: "all purchases" }],
          featured:        false,
          image:           `/cards/${id}.png`,
          gradient:        getGradient(data.issuer),
          network:         data.name.toLowerCase().includes("mastercard") ? "Mastercard"
                           : data.issuer.includes("American Express") ? "American Express"
                           : "Visa",
          foreignFee:      data.noFx ? "0%" : "2.5%",
          transferPartners: [],
          insurance:       [],
          perks:           [],
          welcomeMilestones: [],
          elevated:        false,
          lastVerified:    new Date().toISOString().slice(0, 10),
          source:          "ccg_scrape",
          status:          "published",
        };
        return card;
      } catch {
        return null;
      } finally {
        await page.close();
      }
    }));

    results.push(...batchCards.filter((c): c is ScrapedCard => c !== null));
    await new Promise(r => setTimeout(r, 800));
  }

  await browser.close();
  return results;
}

// ── Admin email digest ────────────────────────────────────────────────────

type ChangeDigest = {
  newCards: string[];
  bonusChanges: { name: string; id: string; old: string; new: string; direction: "up" | "down" | "changed" }[];
  feeChanges:   { name: string; id: string; old: string; new: string }[];
  msrChanges:   { name: string; id: string; old: string; new: string }[];
};

async function sendAdminDigest(digest: ChangeDigest, scraped: number): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const resendKey  = process.env.RESEND_API_KEY;
  const fromEmail  = process.env.EMAIL_FROM;
  const siteUrl    = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  if (!adminEmail || !resendKey || !fromEmail) return;

  const totalChanges = digest.newCards.length + digest.bonusChanges.length + digest.feeChanges.length + digest.msrChanges.length;
  if (totalChanges === 0) return; // Nothing to report

  const resend = new Resend(resendKey);

  const rows = (items: string[]) => items.map(r => `<tr>${r}</tr>`).join("");

  const bonusRows = digest.bonusChanges.map(c => {
    const arrow = c.direction === "up" ? "⬆️" : c.direction === "down" ? "⬇️" : "↔️";
    const color = c.direction === "up" ? "#15803d" : c.direction === "down" ? "#b91c1c" : "#1d4ed8";
    return `<td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;">${arrow} <a href="${siteUrl}/cards/${c.id}" style="color:#2563eb;text-decoration:none;font-weight:600;">${c.name}</a></td>
            <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#6b7280;">${c.old}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:${color};font-weight:600;">${c.new}</td>`;
  });

  const feeRows = digest.feeChanges.map(c =>
    `<td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;"><a href="${siteUrl}/cards/${c.id}" style="color:#2563eb;text-decoration:none;">${c.name}</a></td>
     <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#6b7280;">${c.old}</td>
     <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-weight:600;">${c.new}</td>`
  );

  const msrRows = digest.msrChanges.map(c =>
    `<td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;"><a href="${siteUrl}/cards/${c.id}" style="color:#2563eb;text-decoration:none;">${c.name}</a></td>
     <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#6b7280;">${c.old}</td>
     <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-weight:600;">${c.new}</td>`
  );

  const newCardRows = digest.newCards.map(name =>
    `<li style="padding:4px 0;color:#374151;">${name}</li>`
  );

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:640px;background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
        <tr><td style="background:#0f172a;padding:24px 32px;">
          <p style="margin:0;color:#fff;font-size:18px;font-weight:700;">PointsBinder — Weekly Scrape Digest</p>
          <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">${new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })} · ${scraped} cards scraped · ${totalChanges} change${totalChanges !== 1 ? "s" : ""} detected</p>
        </td></tr>
        <tr><td style="padding:32px;">

          ${digest.bonusChanges.length > 0 ? `
          <h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#111827;">Welcome Bonus Changes (${digest.bonusChanges.length})</h2>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:28px;font-size:13px;">
            <thead><tr style="background:#f8fafc;">
              <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600;">Card</th>
              <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600;">Before</th>
              <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600;">After</th>
            </tr></thead>
            <tbody>${rows(bonusRows)}</tbody>
          </table>` : ""}

          ${digest.feeChanges.length > 0 ? `
          <h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#111827;">Annual Fee Changes (${digest.feeChanges.length})</h2>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:28px;font-size:13px;">
            <thead><tr style="background:#f8fafc;">
              <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600;">Card</th>
              <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600;">Before</th>
              <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600;">After</th>
            </tr></thead>
            <tbody>${rows(feeRows)}</tbody>
          </table>` : ""}

          ${digest.msrChanges.length > 0 ? `
          <h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#111827;">MSR Changes (${digest.msrChanges.length})</h2>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:28px;font-size:13px;">
            <thead><tr style="background:#f8fafc;">
              <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600;">Card</th>
              <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600;">Before</th>
              <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600;">After</th>
            </tr></thead>
            <tbody>${rows(msrRows)}</tbody>
          </table>` : ""}

          ${digest.newCards.length > 0 ? `
          <h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#111827;">New Cards Added (${digest.newCards.length})</h2>
          <ul style="margin:0 0 28px;padding-left:20px;font-size:13px;">${newCardRows.join("")}</ul>` : ""}

          <p style="margin:0;font-size:12px;color:#9ca3af;">This is an automated digest from your weekly CCG scrape. <a href="${siteUrl}/admin" style="color:#9ca3af;">Admin panel</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from: fromEmail,
    to: adminEmail,
    subject: `[PointsBinder] ${totalChanges} card change${totalChanges !== 1 ? "s" : ""} detected — ${new Date().toLocaleDateString("en-CA")}`,
    html,
  });
}

// ── Route handler ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  return POST(req);
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET ?? "";

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = new Date().toISOString();
  console.log(`[scrape-cards] starting at ${startedAt}`);

  try {
    // ── Snapshot existing card data before scraping ────────────────────────
    const existing = await getCards();
    const existingMap = new Map(existing.map(c => [c.id, c]));

    const cards = await scrapeAllCards();

    if (cards.length === 0) {
      return NextResponse.json({ ok: false, error: "No cards scraped" }, { status: 500 });
    }

    // ── Detect changes & build elevation overrides ────────────────────────
    const allChanges: CardChange[] = [];
    const digest: ChangeDigest = { newCards: [], bonusChanges: [], feeChanges: [], msrChanges: [] };

    // Cards that need elevated flag updated in DB (id → elevated value)
    const elevationUpdates: { id: string; elevated: boolean }[] = [];

    for (const card of cards) {
      const prev = existingMap.get(card.id);

      if (!prev) {
        // Brand new card
        digest.newCards.push(card.name);
        await recordBonusHistory(card.id, card.pointsBonus, "First recorded");
        continue;
      }

      // ── points_bonus ──
      if (prev.pointsBonus !== card.pointsBonus) {
        const prevPts = parsePoints(prev.pointsBonus);
        const newPts  = parsePoints(card.pointsBonus);
        const direction = newPts > prevPts ? "up" : newPts < prevPts ? "down" : "changed";

        // Flag suspicious magnitude swings (drop >50%, jump >3x) for manual review
        const ratio = prevPts > 0 ? newPts / prevPts : 0;
        const suspicious = prevPts > 0 && (ratio < 0.5 || ratio > 3);

        allChanges.push({
          card_id:      card.id,
          field:        "points_bonus",
          old_value:    prev.pointsBonus,
          new_value:    card.pointsBonus,
          note:         `${direction === "up" ? "Increased" : direction === "down" ? "Decreased" : "Changed"} from ${prev.pointsBonus}${suspicious ? " [suspicious magnitude]" : ""}`,
          needs_review: suspicious,
        });
        digest.bonusChanges.push({ name: card.name, id: card.id, old: prev.pointsBonus, new: card.pointsBonus, direction });
        await recordBonusHistory(card.id, card.pointsBonus, `Changed from: ${prev.pointsBonus}`);

        // Auto-elevation: set elevated=true on increase, clear on decrease/change
        if (direction === "up") {
          card.elevated = true;
          elevationUpdates.push({ id: card.id, elevated: true });
        } else if (direction === "down") {
          card.elevated = false;
          elevationUpdates.push({ id: card.id, elevated: false });
        }
      } else {
        // Preserve existing elevated flag when bonus hasn't changed
        card.elevated = prev.elevated ?? false;
      }

      // ── annual_fee ──
      if (prev.annualFee !== card.annualFee) {
        allChanges.push({
          card_id:   card.id,
          field:     "annual_fee",
          old_value: prev.annualFee,
          new_value: card.annualFee,
          note:      `Changed from ${prev.annualFee}`,
        });
        digest.feeChanges.push({ name: card.name, id: card.id, old: prev.annualFee, new: card.annualFee });
      }

      // ── msr ──
      if (prev.msr !== card.msr) {
        allChanges.push({
          card_id:   card.id,
          field:     "msr",
          old_value: prev.msr ?? null,
          new_value: card.msr ?? "",
          note:      `Changed from ${prev.msr}`,
        });
        digest.msrChanges.push({ name: card.name, id: card.id, old: prev.msr ?? "", new: card.msr ?? "" });
      }
    }

    // ── Upsert all cards ──────────────────────────────────────────────────
    const { inserted } = await upsertCards(cards);

    // ── Apply elevation overrides directly if scraper reset them ─────────
    // (upsertCards already includes card.elevated set above, but belt+suspenders
    //  for any cards where the scraper always emits elevated:false)
    if (elevationUpdates.length > 0) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      );
      for (const { id, elevated } of elevationUpdates) {
        await supabase.from("cards").update({ elevated }).eq("id", id);
      }
    }

    // ── Persist all detected changes ──────────────────────────────────────
    await recordCardChanges(allChanges);

    // ── Send admin digest email ───────────────────────────────────────────
    await sendAdminDigest(digest, cards.length);

    // ── Fire alert on suspicious-magnitude changes ───────────────────────
    const suspicious = allChanges.filter(c => c.needs_review);
    if (suspicious.length > 0) {
      console.warn(`[scrape-cards] ${suspicious.length} suspicious change(s) need review`);
      await sendAlert({
        level:   "warn",
        title:   `${suspicious.length} suspicious bonus change${suspicious.length === 1 ? "" : "s"} need review`,
        summary: "These welcome-bonus changes exceed the magnitude threshold (drop >50% or jump >3x). Check the source before trusting the scrape.",
        lines:   suspicious.slice(0, 15).map(c => `${c.card_id}: ${c.old_value} → ${c.new_value}`),
        link:    { label: "Open admin panel", url: "/admin" },
      });
    }

    await pingHealthcheck("HEALTHCHECK_URL_SCRAPE_CARDS");

    console.log(`[scrape-cards] done — scraped:${cards.length} upserted:${inserted} changes:${allChanges.length} suspicious:${suspicious.length}`);

    return NextResponse.json({
      ok: true,
      scraped: cards.length,
      upserted: inserted,
      changes: allChanges.length,
      suspicious: suspicious.length,
      newCards: digest.newCards.length,
      bonusChanges: digest.bonusChanges.length,
      feeChanges: digest.feeChanges.length,
      msrChanges: digest.msrChanges.length,
      startedAt,
      completedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[scrape-cards] failed:`, message);
    return NextResponse.json({ ok: false, error: message, startedAt }, { status: 500 });
  }
}
