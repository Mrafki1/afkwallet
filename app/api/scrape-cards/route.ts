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
import { upsertCards } from "../../lib/cards-db";
import type { Card } from "../../data/cards";

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

// ── Main scrape logic ─────────────────────────────────────────────────────

async function scrapeAllCards(): Promise<ScrapedCard[]> {
  const isVercel = !!process.env.VERCEL;
  const browser = await chromium.launch({
    args: isVercel ? chromiumBin.args : ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    defaultViewport: isVercel ? chromiumBin.defaultViewport : null,
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

// ── Route handler ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET ?? "";

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = new Date().toISOString();

  try {
    const cards = await scrapeAllCards();

    if (cards.length === 0) {
      return NextResponse.json({ ok: false, error: "No cards scraped" }, { status: 500 });
    }

    const { inserted } = await upsertCards(cards);

    return NextResponse.json({
      ok: true,
      scraped: cards.length,
      upserted: inserted,
      startedAt,
      completedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message, startedAt }, { status: 500 });
  }
}
