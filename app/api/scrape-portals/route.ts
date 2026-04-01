/**
 * POST /api/scrape-portals
 * Scrapes CCG, GCR, Frugal Flyer, and FinlyWealth for current portal bonuses,
 * matches cards by name to Supabase, and writes portal data back.
 * Protected by CRON_SECRET header.
 *
 * Called by Vercel cron (see vercel.json).
 * Can also be triggered manually: POST /api/scrape-portals with Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright-core";
import chromiumBin from "@sparticuz/chromium";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// ── Name normalisation & fuzzy matching ───────────────────────────────────

function normalizeName(name = "") {
  return name
    .toLowerCase()
    .replace(/[®™©*]/g, "")
    .replace(/\bamerican express\b/g, "amex")
    .replace(/\bscotiabank\b/g, "scotia")
    .replace(/\bbank of montreal\b/g, "bmo")
    .replace(/\broyal bank\b/g, "rbc")
    .replace(/\bnational bank\b/g, "nbc")
    .replace(/\bworld elite\b/g, "we")
    .replace(/\bvisa infinite\b/g, "vi")
    .replace(/\bcredit card\b|\bcard\b/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchScore(a: string, b: string) {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  const wa = new Set(na.split(" ").filter(w => w.length > 2));
  const wb = new Set(nb.split(" ").filter(w => w.length > 2));
  const shared = [...wa].filter(w => wb.has(w)).length;
  const total  = Math.max(wa.size, wb.size, 1);
  return shared / total;
}

type DbCard = { id: string; name: string; portals: Portal[] | null };
type Portal = { name: string; bonus: number; url: string };
type PortalHit = { name: string; bonus: number | null; url: string };

function findBestMatch(portalName: string, dbCards: DbCard[], threshold = 0.45): DbCard | null {
  let best: DbCard | null = null;
  let bestScore = threshold;
  for (const card of dbCards) {
    const score = matchScore(portalName, card.name);
    if (score > bestScore) { bestScore = score; best = card; }
  }
  return best;
}

function mergePortal(existing: Portal[], portalName: string, bonus: number | null, url: string): Portal[] {
  const filtered = existing.filter(p => p.name !== portalName);
  if (bonus != null && bonus > 0 && url && !isHomepage(url)) {
    filtered.push({ name: portalName, bonus, url });
  }
  return filtered.sort((a, b) => b.bonus - a.bonus);
}

const HOMEPAGES = new Set([
  "https://www.greatcanadianrebates.ca/display/CreditCards/",
  "https://frugalflyer.ca/rebates/",
  "https://finlywealth.com/rebates/",
  "https://creditcardgenius.ca/offers",
]);
function isHomepage(url: string) {
  try { return HOMEPAGES.has(url) || new URL(url).pathname.replace(/\/$/, "").split("/").filter(Boolean).length < 2; }
  catch { return true; }
}

// ── Scrapers ──────────────────────────────────────────────────────────────

type BrowserContext = Awaited<ReturnType<typeof chromium.launchPersistentContext>> | Awaited<ReturnType<Awaited<ReturnType<typeof chromium.launch>>["newContext"]>>;

async function scrapeCCG(ctx: BrowserContext): Promise<PortalHit[]> {
  const page = await ctx.newPage();
  try {
    await page.goto("https://creditcardgenius.ca/offers", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(5000);

    return await page.evaluate(() => {
      const items: { name: string; bonus: number | null; url: string }[] = [];
      const offerLinks = [...document.querySelectorAll('a[href*="/credit-cards/"][href*="state="]')] as HTMLAnchorElement[];
      const byHref = new Map<string, string[]>();
      for (const a of offerLinks) {
        const href = a.href;
        if (!byHref.has(href)) byHref.set(href, []);
        byHref.get(href)!.push((a.textContent ?? "").replace(/[®™©*∗\n]/g, "").replace(/\s+/g, " ").trim());
      }
      for (const [url, texts] of byHref) {
        const gcText = texts.find(t => /^GC:\s*\$\d+/.test(t));
        if (!gcText) continue;
        const bonusMatch = gcText.match(/\$(\d+)/);
        if (!bonusMatch) continue;
        const bonus = parseInt(bonusMatch[1]);
        if (bonus < 20 || bonus > 500) continue;
        const name = texts.filter(t => !t.startsWith("GC:") && t !== "Learn More" && t !== "I Want This Deal" && t.length > 5).sort((a, b) => b.length - a.length)[0] ?? "";
        if (name) items.push({ name, bonus, url });
      }
      return items;
    });
  } finally {
    await page.close();
  }
}

async function scrapeGCR(ctx: BrowserContext): Promise<PortalHit[]> {
  const page = await ctx.newPage();
  try {
    await page.goto("https://www.greatcanadianrebates.ca/display/CreditCards/", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2500);

    return await page.evaluate(() => {
      const items: { name: string; bonus: number | null; url: string }[] = [];
      const logoImgs = document.querySelectorAll("img.listlogo");
      for (const img of logoImgs) {
        let row: Element | null = img.parentElement;
        for (let i = 0; i < 8; i++) {
          if (!row || row.tagName === "TR") break;
          row = row.parentElement;
        }
        if (!row || row.tagName !== "TR") continue;
        const nameEl = row.querySelector("a.listshopname") as HTMLAnchorElement | null;
        const rawName = nameEl?.title || nameEl?.textContent?.trim() || (img as HTMLImageElement).alt || "";
        const name = rawName.replace(/<[^>]+>/g, "").replace(/Shop @ /i, "").trim();
        const rebateEl = row.querySelector("span.listrebate");
        const rebateText = rebateEl?.textContent?.trim() ?? "";
        const bonusMatch = rebateText.match(/\$\s?(\d+(?:\.\d+)?)/);
        const bonus = bonusMatch ? Math.round(parseFloat(bonusMatch[1])) : null;
        const detailsEl = row.querySelector("a.moredetails") as HTMLAnchorElement | null;
        const url = detailsEl?.href ? detailsEl.href : "https://www.greatcanadianrebates.ca/display/CreditCards/";
        if (name.length > 3) items.push({ name, bonus, url });
      }
      const seen = new Map<string, typeof items[0]>();
      for (const item of items) {
        if (!seen.has(item.name) || (seen.get(item.name)!.bonus == null && item.bonus != null)) {
          seen.set(item.name, item);
        }
      }
      return [...seen.values()];
    });
  } finally {
    await page.close();
  }
}

async function scrapeFF(ctx: BrowserContext): Promise<PortalHit[]> {
  const page = await ctx.newPage();
  try {
    await page.goto("https://frugalflyer.ca/rebates/", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);
    for (let i = 1; i <= 4; i++) {
      await page.evaluate((f: number) => window.scrollTo(0, document.body.scrollHeight * f), i / 4);
      await page.waitForTimeout(600);
    }
    await page.waitForTimeout(1000);

    return await page.evaluate(() => {
      const items: { name: string; bonus: number | null; url: string }[] = [];
      const cards = document.querySelectorAll("article.wpgb-card, article[class*='wpgb']");
      for (const card of cards) {
        const nameEl = card.querySelector("h3 a, h4 a, .wpgb-block-1 a, [class*='block-1'] a") as HTMLAnchorElement | null;
        let name = (nameEl?.textContent?.trim() ?? "").replace(/[®™©*]/g, "").trim();
        if (!name || name.length < 5) continue;
        const amountEl = card.querySelector(".wpgb-block-2, [class*='block-2']");
        const amountText = amountEl?.textContent ?? "";
        const flyerMatch = amountText.match(/\$(\d+)\s+FlyerFunds/i) || amountText.match(/Earn\s+\$(\d+)/i);
        const bonus = flyerMatch ? parseInt(flyerMatch[1]) : null;
        const rebateLink = card.querySelector(".wpgb-block-3 a, a[href*='/rebate/']") as HTMLAnchorElement | null;
        const url = rebateLink?.href || "https://frugalflyer.ca/rebates/";
        items.push({ name, bonus, url });
      }
      return items;
    });
  } finally {
    await page.close();
  }
}

async function scrapeFW(ctx: BrowserContext): Promise<PortalHit[]> {
  const page = await ctx.newPage();
  const allItems: PortalHit[] = [];
  try {
    await page.goto("https://finlywealth.com/rebates/", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(5000);

    let maxPage = 1;
    try {
      maxPage = await page.evaluate(() => {
        const buttons = [...document.querySelectorAll("button, a")].filter(el => /^\d+$/.test((el.textContent ?? "").trim()));
        const nums = buttons.map(b => parseInt((b.textContent ?? "").trim())).filter(n => n > 0 && n < 50);
        return nums.length > 0 ? Math.max(...nums) : 1;
      });
    } catch { /* no pagination */ }

    for (let p = 1; p <= maxPage; p++) {
      if (p > 1) {
        const clicked = await page.evaluate((pageNum: number) => {
          const buttons = [...document.querySelectorAll("button, a")].filter(el => (el.textContent ?? "").trim() === String(pageNum));
          if (buttons[0]) { (buttons[0] as HTMLElement).click(); return true; }
          return false;
        }, p);
        if (!clicked) break;
        await page.waitForTimeout(2000);
      }
      for (let i = 1; i <= 3; i++) {
        await page.evaluate((f: number) => window.scrollTo(0, document.body.scrollHeight * f), i / 3);
        await page.waitForTimeout(400);
      }
      await page.waitForTimeout(1000);

      const pageItems = await page.evaluate(() => {
        const items: { name: string; bonus: number | null; url: string }[] = [];
        const anchors = [...document.querySelectorAll('a[href*="/rebates/"]')].filter(a => {
          const href = (a as HTMLAnchorElement).href;
          return href !== "https://finlywealth.com/rebates/" && /\/rebates\/[a-z]/.test(href);
        }) as HTMLAnchorElement[];
        for (const a of anchors) {
          const text = (a.textContent ?? "").trim().replace(/[®™©*∗]/g, "").replace(/\s+/g, " ");
          const plusIdx = text.indexOf(" + $");
          if (plusIdx === -1) continue;
          let name = text.slice(0, plusIdx).trim();
          const amountSection = text.slice(plusIdx + 4);
          const amountMatch = amountSection.match(/^(\d+)(?:\s+\$(\d+))?/);
          if (!amountMatch) continue;
          if (amountSection.slice(amountMatch[1].length).startsWith("%")) continue;
          const bonus = parseInt(amountMatch[2] ?? amountMatch[1]);
          if (bonus < 20 || bonus > 500) continue;
          name = name.replace(/^.*(scotiabank|bmo|rbc|td bank|td|cibc|mbna|amex|american express|tangerine|neo|koho|pc financial)\s+credit\s+card\s+(?:expires?\s+in\s+\d+\s+days?\s+)?/i, "").trim();
          name = name.replace(/expires?\s+in\s+\d+\s+days?\s*/i, "").trim();
          if (name.length < 5) continue;
          items.push({ name, bonus, url: a.href });
        }
        return items;
      });
      allItems.push(...pageItems);
    }

    const seen = new Map<string, PortalHit>();
    for (const item of allItems) {
      const existing = seen.get(item.name);
      if (!existing || (item.bonus ?? 0) > (existing.bonus ?? 0)) seen.set(item.name, item);
    }
    return [...seen.values()];
  } finally {
    await page.close();
  }
}

// ── Route handler ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
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

  const { data: dbCards, error: dbError } = await supabase
    .from("cards")
    .select("id, name, portals")
    .eq("status", "published");

  if (dbError) {
    return NextResponse.json({ ok: false, error: dbError.message }, { status: 500 });
  }

  const isVercel = !!process.env.VERCEL;
  const browser = await chromium.launch({
    args: isVercel ? chromiumBin.args : ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: isVercel ? chromiumBin.defaultViewport : null,
    executablePath: isVercel ? await chromiumBin.executablePath() : undefined,
    headless: true,
  });

  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36",
    extraHTTPHeaders: { "Accept-Language": "en-CA,en;q=0.9" },
  });
  await ctx.route("**/*.{woff,woff2,ttf,eot,mp4,pdf}", r => r.abort());

  const portals: { id: string; scrape: (ctx: BrowserContext) => Promise<PortalHit[]> }[] = [
    { id: "CCG", scrape: scrapeCCG },
    { id: "GCR", scrape: scrapeGCR },
    { id: "FF",  scrape: scrapeFF  },
    { id: "FW",  scrape: scrapeFW  },
  ];

  // cardId → merged portals
  const updates: Record<string, { card: DbCard; portalsMap: Record<string, { bonus: number | null; url: string }> }> = {};
  const summary: Record<string, { matched: number; unmatched: number }> = {};

  for (const portal of portals) {
    try {
      const hits = await portal.scrape(ctx);
      let matched = 0;
      let unmatched = 0;

      for (const hit of hits) {
        const dbCard = findBestMatch(hit.name, dbCards as DbCard[]);
        if (!dbCard) { unmatched++; continue; }
        matched++;
        if (!updates[dbCard.id]) updates[dbCard.id] = { card: dbCard as DbCard, portalsMap: {} };
        updates[dbCard.id].portalsMap[portal.id] = { bonus: hit.bonus, url: hit.url };
      }

      summary[portal.id] = { matched, unmatched };
    } catch (err) {
      summary[portal.id] = { matched: 0, unmatched: 0 };
      console.error(`Portal ${portal.id} failed:`, err);
    }
  }

  await ctx.close();
  await browser.close();

  // Write updates to Supabase
  let updated = 0;
  for (const { card, portalsMap } of Object.values(updates)) {
    let portals = [...(card.portals ?? [])];
    for (const [portalName, { bonus, url }] of Object.entries(portalsMap)) {
      portals = mergePortal(portals, portalName, bonus, url);
    }
    const { error } = await supabase.from("cards").update({ portals }).eq("id", card.id);
    if (!error) updated++;
  }

  return NextResponse.json({
    ok: true,
    updated,
    summary,
    startedAt,
    completedAt: new Date().toISOString(),
  });
}
