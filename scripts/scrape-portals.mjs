/**
 * PointsBinder — Portal Bonus Scraper
 * =====================================
 * Scrapes GCR, Frugal Flyer, and FinlyWealth for current cash rebate offers,
 * matches cards by name to our Supabase DB, and writes portal data back.
 *
 * Usage:
 *   node scripts/scrape-portals.mjs                     # all portals
 *   node scripts/scrape-portals.mjs --portal GCR        # one portal
 *   node scripts/scrape-portals.mjs --dry-run           # no DB writes
 *   node scripts/scrape-portals.mjs --headed            # show browser
 *   node scripts/scrape-portals.mjs --output report.json
 */

import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "../.env.local") });

// ── CLI Args ───────────────────────────────────────────────────────────────

const args          = process.argv.slice(2);
const getArg        = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const hasFlag       = (f) => args.includes(f);
const FILTER_PORTAL = getArg("--portal")?.toUpperCase();
const DRY_RUN       = hasFlag("--dry-run");
const HEADED        = hasFlag("--headed");
const OUTPUT_FILE   = getArg("--output");
const DELAY_MS      = parseInt(getArg("--delay") ?? "1200");

// ── Name normalization & matching ──────────────────────────────────────────

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
    .replace(/\bvisa platinum\b/g, "vp")
    .replace(/\bcredit card\b|\bcard\b/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchScore(a, b) {
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

function findBestMatch(portalName, dbCards, threshold = 0.45) {
  let best = null;
  let bestScore = threshold;
  for (const card of dbCards) {
    const score = matchScore(portalName, card.name);
    if (score > bestScore) { bestScore = score; best = card; }
  }
  return best;
}

// ── Browser context factory ────────────────────────────────────────────────

async function newCtx(browser) {
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    extraHTTPHeaders: { "Accept-Language": "en-CA,en;q=0.9" },
  });
  await ctx.route("**/*.{woff,woff2,ttf,eot,mp4,pdf}", r => r.abort());
  return ctx;
}

// ── CCG Scraper ────────────────────────────────────────────────────────────
// URL: https://creditcardgenius.ca/offers
// Structure: Angular SPA — each offer card has "GC: $X" label link (href with ?state=)
//            and a card-name link pointing to the same URL

async function scrapeCCG(browser) {
  console.log("  📡  CCG — https://creditcardgenius.ca/offers");
  const ctx = await newCtx(browser);
  const page = await ctx.newPage();
  const results = [];

  try {
    await page.goto("https://creditcardgenius.ca/offers", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(5000); // Angular render

    results.push(...await page.evaluate(() => {
      const items = [];

      // Find all links that have the GeniusCash state param — these are the offer URLs
      const offerLinks = [...document.querySelectorAll('a[href*="/credit-cards/"][href*="state="]')];

      // Group by href: each offer URL appears 2-3 times (GC label, card name, Learn More)
      const byHref = new Map();
      for (const a of offerLinks) {
        const href = a.href;
        if (!byHref.has(href)) byHref.set(href, []);
        byHref.get(href).push(a.textContent?.replace(/[®™©*∗\n]/g, "").replace(/\s+/g, " ").trim());
      }

      for (const [url, texts] of byHref) {
        // Find the "GC: $X" text to get bonus amount
        const gcText = texts.find(t => /^GC:\s*\$\d+/.test(t));
        if (!gcText) continue;
        const bonusMatch = gcText.match(/\$(\d+)/);
        if (!bonusMatch) continue;
        const bonus = parseInt(bonusMatch[1]);
        if (bonus < 20 || bonus > 500) continue;

        // Card name is the longest non-GC, non-"Learn More" text
        const name = texts
          .filter(t => !t.startsWith("GC:") && t !== "Learn More" && t !== "I Want This Deal" && t.length > 5)
          .sort((a, b) => b.length - a.length)[0] ?? "";
        if (!name) continue;

        items.push({ name, bonus, url });
      }

      return items;
    }));

    console.log(`  → ${results.length} cards found`);
  } catch (err) {
    console.error("  ❌  CCG error:", err.message);
  } finally {
    await ctx.close();
  }

  return results;
}

// ── GCR Scraper ────────────────────────────────────────────────────────────
// URL: https://www.greatcanadianrebates.ca/display/CreditCards/
// Structure: table rows with a.listshopname (name) and span.listrebate (bonus)

async function scrapeGCR(browser) {
  console.log("  📡  GCR — https://www.greatcanadianrebates.ca/display/CreditCards/");
  const ctx = await newCtx(browser);
  const page = await ctx.newPage();
  const results = [];

  try {
    await page.goto("https://www.greatcanadianrebates.ca/display/CreditCards/", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(2500);

    results.push(...await page.evaluate(() => {
      const items = [];
      // Find all listlogo images — each is one card entry
      const logoImgs = document.querySelectorAll("img.listlogo");

      for (const img of logoImgs) {
        // Walk up to the <tr>
        let row = img.parentElement;
        for (let i = 0; i < 8; i++) {
          if (!row || row.tagName === "TR") break;
          row = row.parentElement;
        }
        if (!row || row.tagName !== "TR") continue;

        // Card name from a.listshopname or img.listlogo alt
        const nameEl = row.querySelector("a.listshopname");
        const rawName = nameEl?.title || nameEl?.textContent?.trim() || img.alt || "";
        const name = rawName.replace(/<[^>]+>/g, "").replace(/Shop @ /i, "").trim();

        // Bonus amount from span.listrebate
        const rebateEl = row.querySelector("span.listrebate");
        const rebateText = rebateEl?.textContent?.trim() ?? "";
        const bonusMatch = rebateText.match(/\$\s?(\d+(?:\.\d+)?)/);
        const bonus = bonusMatch ? Math.round(parseFloat(bonusMatch[1])) : null;

        // URL: prefer /details/ link, fall back to goShopping path
        const detailsEl = row.querySelector("a.moredetails");
        const detailsHref = detailsEl?.getAttribute("href") ?? "";
        const shopEl = row.querySelector("a[href*='goShopping'], a[onclick*='goShopping']");
        const shopOnclick = shopEl?.getAttribute("href") || shopEl?.getAttribute("onclick") || "";
        const shopMatch = shopOnclick.match(/goShopping\(['"]([^'"]+)['"]\)/);
        const shopPath = shopMatch ? shopMatch[1] : "";

        const url = detailsHref
          ? "https://www.greatcanadianrebates.ca" + detailsHref
          : shopPath
          ? "https://www.greatcanadianrebates.ca" + shopPath
          : "https://www.greatcanadianrebates.ca/display/CreditCards/";

        if (name.length > 3) {
          items.push({ name, bonus, url });
        }
      }

      // Deduplicate by name (keep first occurrence — usually has the bonus)
      const seen = new Map();
      for (const item of items) {
        if (!seen.has(item.name) || (seen.get(item.name).bonus == null && item.bonus != null)) {
          seen.set(item.name, item);
        }
      }
      return [...seen.values()];
    }));

    console.log(`  → ${results.length} cards found`);
  } catch (err) {
    console.error("  ❌  GCR error:", err.message);
  } finally {
    await ctx.close();
  }

  return results;
}

// ── Frugal Flyer Scraper ───────────────────────────────────────────────────
// URL: https://frugalflyer.ca/rebates/
// Structure: article.wpgb-card → h3.wpgb-block-1 a (name), .wpgb-block-2 strong (amount)

async function scrapeFF(browser) {
  console.log("  📡  Frugal Flyer — https://frugalflyer.ca/rebates/");
  const ctx = await newCtx(browser);
  const page = await ctx.newPage();
  const results = [];

  try {
    await page.goto("https://frugalflyer.ca/rebates/", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(3000);

    // Scroll to load all cards (FF lazy-loads them)
    for (let i = 1; i <= 4; i++) {
      await page.evaluate((f) => window.scrollTo(0, document.body.scrollHeight * f), i / 4);
      await page.waitForTimeout(600);
    }
    await page.waitForTimeout(1000);

    results.push(...await page.evaluate(() => {
      const items = [];

      // Each card is an article.wpgb-card
      const cards = document.querySelectorAll("article.wpgb-card, article[class*='wpgb']");

      for (const card of cards) {
        // Card name — in h3.wpgb-block-1 > a, or any h3/h4 > a
        const nameEl = card.querySelector("h3 a, h4 a, .wpgb-block-1 a, [class*='block-1'] a");
        let name = nameEl?.textContent?.trim() || "";
        name = name.replace(/[®™©*]/g, "").trim();
        if (!name || name.length < 5) continue;

        // FlyerFunds amount — in .wpgb-block-2 strong, text: "$200 FlyerFunds"
        const amountEl = card.querySelector(".wpgb-block-2, [class*='block-2']");
        const amountText = amountEl?.textContent || "";
        const flyerMatch = amountText.match(/\$(\d+)\s+FlyerFunds/i)
                        || amountText.match(/Earn\s+\$(\d+)/i);
        const bonus = flyerMatch ? parseInt(flyerMatch[1]) : null;

        // Rebate URL — wpgb-block-3 or GET THIS OFFER link
        const rebateLink = card.querySelector(".wpgb-block-3, a[href*='/rebate/']");
        const url = rebateLink?.href || "https://frugalflyer.ca/rebates/";

        items.push({ name, bonus, url });
      }

      return items;
    }));

    console.log(`  → ${results.length} cards found`);
  } catch (err) {
    console.error("  ❌  FF error:", err.message);
  } finally {
    await ctx.close();
  }

  return results;
}

// ── FinlyWealth Scraper ────────────────────────────────────────────────────
// URL: https://finlywealth.com/rebates/  (Next.js/React app, paginated)
// Pattern in page text: "{Card Name} + $X" or "{Card Name} + $X $Y (use last)"

async function scrapeFW(browser) {
  console.log("  📡  FinlyWealth — https://finlywealth.com/rebates/");
  const ctx = await newCtx(browser);
  const page = await ctx.newPage();
  const allItems = [];

  try {
    await page.goto("https://finlywealth.com/rebates/", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(5000);

    // Try to set "per page" to show all, or paginate through pages
    // FW shows 10 per page with pagination. Detect max page.
    let maxPage = 1;
    try {
      await page.waitForSelector("[aria-label*='page'], .pagination, nav[class*='page']", { timeout: 5000 });
      maxPage = await page.evaluate(() => {
        // Find pagination buttons — highest page number
        const buttons = [...document.querySelectorAll("button, a")].filter(el => /^\d+$/.test(el.textContent.trim()));
        const nums = buttons.map(b => parseInt(b.textContent.trim())).filter(n => n > 0 && n < 50);
        return nums.length > 0 ? Math.max(...nums) : 1;
      });
    } catch { /* no pagination found */ }

    console.log(`  → ${maxPage} page(s) detected`);

    for (let p = 1; p <= maxPage; p++) {
      if (p > 1) {
        // Click page button
        const clicked = await page.evaluate((pageNum) => {
          const buttons = [...document.querySelectorAll("button, a")]
            .filter(el => el.textContent.trim() === String(pageNum));
          if (buttons[0]) { buttons[0].click(); return true; }
          return false;
        }, p);
        if (!clicked) break;
        await page.waitForTimeout(2000);
      }

      // Scroll to load all cards on this page
      for (let i = 1; i <= 3; i++) {
        await page.evaluate((f) => window.scrollTo(0, document.body.scrollHeight * f), i / 3);
        await page.waitForTimeout(400);
      }
      await page.waitForTimeout(1000);

      // Extract from card links: <a href="/rebates/{slug}"> containing "+ $X" pattern
      const pageItems = await page.evaluate(() => {
        const items = [];

        const anchors = [...document.querySelectorAll('a[href*="/rebates/"]')].filter(a => {
          const href = a.href;
          return href !== "https://www.finlywealth.com/rebates/" &&
                 href !== "https://finlywealth.com/rebates" &&
                 !href.includes("/rebates/#") &&
                 /\/rebates\/[a-z]/.test(href);
        });

        for (const a of anchors) {
          const text = a.textContent?.trim().replace(/[®™©*∗]/g, "").replace(/\s+/g, " ") ?? "";

          // Split on " + $" — everything before is the name, everything after is the amount section
          const plusIdx = text.indexOf(" + $");
          if (plusIdx === -1) continue;

          let name = text.slice(0, plusIdx).trim();
          const amountSection = text.slice(plusIdx + 4); // after " + $"

          // Match "$X" or "$X $Y" (strikethrough old→new price)
          // Reject if the digits are immediately followed by "%" — means it's a rate not a dollar amount
          // e.g. "+ $500% rate" is actually "$50" + "0% rate" concatenated without space
          const amountMatch = amountSection.match(/^(\d+)(?:\s+\$(\d+))?/);
          if (!amountMatch) continue;
          const afterFirstNum = amountSection.slice(amountMatch[1].length);
          if (afterFirstNum.startsWith("%")) continue; // e.g. "$500%" is a rate, not a bonus

          // If two amounts present, use the last (strikethrough old → new price)
          const bonus = parseInt(amountMatch[2] ?? amountMatch[1]);
          if (bonus < 20 || bonus > 500) continue;

          // Strip repeated issuer prefixes from names like:
          // "Scotiabank Credit Card Expires in 29 days Scotiabank Passport Visa..."
          name = name.replace(/^.*(scotiabank|bmo|rbc|td bank|td|cibc|mbna|amex|american express|tangerine|neo|koho|pc financial|simplii|rogers|virgin plus)\s+credit\s+card\s+(?:expires?\s+in\s+\d+\s+days?\s+)?/i, "").trim();
          name = name.replace(/expires?\s+in\s+\d+\s+days?\s*/i, "").trim();
          if (name.length < 5) continue;
          if (/^(scotiabank|bmo|rbc|td|cibc|mbna|amex|american express|tangerine|neo|koho|pc financial)$/i.test(name)) continue;

          items.push({ name, bonus, url: a.href });
        }

        return items;
      });

      allItems.push(...pageItems);
    }

    // Deduplicate by name (keep highest bonus if duplicated)
    const seen = new Map();
    for (const item of allItems) {
      const existing = seen.get(item.name);
      if (!existing || item.bonus > (existing.bonus ?? 0)) {
        seen.set(item.name, item);
      }
    }
    const results = [...seen.values()];
    console.log(`  → ${results.length} unique cards found`);
    return results;

  } catch (err) {
    console.error("  ❌  FW error:", err.message);
    return allItems;
  } finally {
    await ctx.close();
  }
}

// ── Homepage URL patterns — never save these as portal links ──────────────

const HOMEPAGE_URLS = new Set([
  "https://www.greatcanadianrebates.ca/display/CreditCards/",
  "https://www.greatcanadianrebates.ca/",
  "https://frugalflyer.ca/rebates/",
  "https://frugalflyer.ca/",
  "https://www.finlywealth.com/rebates/",
  "https://finlywealth.com/rebates/",
  "https://www.finlywealth.com/",
  "https://finlywealth.com/",
  "https://www.creditcardgenius.ca/",
  "https://www.creditcardgenius.ca",
  "https://creditcardgenius.ca/",
  "https://creditcardgenius.ca",
]);

function isCardSpecificUrl(url) {
  if (!url || HOMEPAGE_URLS.has(url)) return false;
  try {
    const u = new URL(url);
    // Must have a path with at least 2 segments (e.g. /rebates/card-slug or /details/Card-Name/)
    const parts = u.pathname.replace(/\/$/, "").split("/").filter(Boolean);
    return parts.length >= 2;
  } catch {
    return false;
  }
}

// ── Merge portal into card's portals array ─────────────────────────────────

function mergePortal(existingPortals, portalName, bonus, url) {
  const filtered = (existingPortals ?? []).filter(p => p.name !== portalName);
  if (bonus != null && bonus > 0 && isCardSpecificUrl(url)) {
    filtered.push({ name: portalName, bonus, url });
  }
  filtered.sort((a, b) => b.bonus - a.bonus);
  return filtered;
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🔍  PointsBinder — Portal Bonus Scraper");
  console.log("─".repeat(60));
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"} | Portals: ${FILTER_PORTAL ?? "CCG + GCR + FF + FW"}`);
  console.log();

  // Load cards from Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const { data: dbCards, error } = await supabase
    .from("cards")
    .select("id, name, issuer, portals")
    .eq("status", "published");

  if (error) { console.error("Supabase error:", error.message); process.exit(1); }
  console.log(`📋  Loaded ${dbCards.length} cards from Supabase\n`);

  const browser = await chromium.launch({ headless: !HEADED });

  const portals = [
    { id: "CCG", scrape: scrapeCCG },
    { id: "GCR", scrape: scrapeGCR },
    { id: "FF",  scrape: scrapeFF  },
    { id: "FW",  scrape: scrapeFW  },
  ].filter(p => !FILTER_PORTAL || p.id === FILTER_PORTAL);

  // cardId → { portals accumulated from all scrapers }
  const updates = {}; // cardId → { card, portalsMap }
  const report  = [];

  for (const portal of portals) {
    console.log(`${"─".repeat(40)}`);
    console.log(`🌐  ${portal.id}`);
    await new Promise(r => setTimeout(r, DELAY_MS));

    const portalCards = await portal.scrape(browser);
    let matched = 0;
    let unmatched = 0;

    for (const pc of portalCards) {
      const dbCard = findBestMatch(pc.name, dbCards);
      if (!dbCard) {
        unmatched++;
        continue;
      }
      matched++;

      if (!updates[dbCard.id]) updates[dbCard.id] = { card: dbCard, portalsMap: {} };
      updates[dbCard.id].portalsMap[portal.id] = { bonus: pc.bonus, url: pc.url };

      const storedBonus = (dbCard.portals ?? []).find(p => p.name === portal.id)?.bonus;
      const changed = storedBonus != null && storedBonus !== pc.bonus;
      const icon = changed ? "⚠️ " : pc.bonus ? "✅" : "❓";
      const bonusStr = pc.bonus ? `$${pc.bonus}` : "no bonus";
      console.log(`  ${icon}  ${dbCard.name.padEnd(42)} ${bonusStr}${changed ? `  (was $${storedBonus})` : ""}`);

      report.push({
        portal: portal.id,
        portalCardName: pc.name,
        cardId:         dbCard.id,
        cardName:       dbCard.name,
        bonus:          pc.bonus,
        url:            pc.url,
        storedBonus,
        changed,
      });
    }

    console.log(`  → Matched: ${matched} | Unmatched: ${unmatched}`);
  }

  await browser.close();

  // Write to Supabase
  if (!DRY_RUN && Object.keys(updates).length > 0) {
    console.log(`\n🗄️   Updating ${Object.keys(updates).length} cards in Supabase…`);
    let updated = 0;
    for (const { card, portalsMap } of Object.values(updates)) {
      let currentPortals = [...(card.portals ?? [])];
      for (const [portalName, { bonus, url }] of Object.entries(portalsMap)) {
        currentPortals = mergePortal(currentPortals, portalName, bonus, url);
      }
      const { error } = await supabase
        .from("cards")
        .update({ portals: currentPortals })
        .eq("id", card.id);
      if (error) console.error(`  ❌  ${card.id}: ${error.message}`);
      else updated++;
    }
    console.log(`  ✅  ${updated} cards updated`);
  }

  // Summary
  console.log("\n" + "─".repeat(60));
  console.log("📊  Summary");
  for (const portal of portals) {
    const pr = report.filter(r => r.portal === portal.id);
    const withBonus = pr.filter(r => r.bonus != null).length;
    const changed   = pr.filter(r => r.changed).length;
    console.log(`   ${portal.id.padEnd(4)} ${withBonus} bonuses${changed ? `, ${changed} changed` : ""}`);
  }
  if (DRY_RUN) console.log("   (dry run — no DB writes)");
  console.log();

  if (OUTPUT_FILE) {
    fs.writeFileSync(
      path.resolve(OUTPUT_FILE),
      JSON.stringify({ scrapedAt: new Date().toISOString(), results: report }, null, 2)
    );
    console.log(`💾  Saved to ${path.resolve(OUTPUT_FILE)}`);
  }
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
