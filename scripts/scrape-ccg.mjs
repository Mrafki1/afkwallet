/**
 * PointsBinder — CCG Card Scraper (Browser + API interception)
 * =============================================================
 * Opens CCG in Playwright, intercepts the Angular app's API calls,
 * captures exact request headers, then replays with Playwright's
 * request context (which has all browser cookies/session state).
 *
 * Usage:
 *   node scripts/scrape-ccg.mjs                      # full scrape + upsert
 *   node scripts/scrape-ccg.mjs --dry-run             # no DB write
 *   node scripts/scrape-ccg.mjs --limit 10            # first 10 cards only
 *   node scripts/scrape-ccg.mjs --output cards.json   # save raw JSON to file
 *   node scripts/scrape-ccg.mjs --headed              # show browser window
 *
 * Env vars required (in .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
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

const args    = process.argv.slice(2);
const getArg  = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const hasFlag = (f) => args.includes(f);

const DRY_RUN = hasFlag("--dry-run");
const HEADED  = hasFlag("--headed");
const LIMIT   = getArg("--limit") ? parseInt(getArg("--limit")) : Infinity;
const OUTPUT  = getArg("--output");

const CCG_BASE = "https://www.creditcardgenius.ca";
const API_PATH = "/api/v2/card/cards";

// ── Issuer gradients ───────────────────────────────────────────────────────

const ISSUER_GRADIENTS = {
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
  "Brim":             "from-purple-600 to-indigo-900",
  "Neo Financial":    "from-green-600 to-teal-900",
  "Home Trust":       "from-blue-600 to-slate-800",
  "Meridian":         "from-teal-600 to-slate-800",
  "ATB":              "from-teal-700 to-green-900",
  "WestJet":          "from-teal-600 to-blue-900",
  "Triangle":         "from-red-600 to-orange-900",
  "Walmart":          "from-blue-700 to-yellow-900",
  "Koho":             "from-teal-500 to-cyan-800",
  "Neo Financial":    "from-green-600 to-teal-900",
  "EQ Bank":          "from-yellow-600 to-orange-800",
  "Wealthsimple":     "from-slate-500 to-slate-800",
  "Vancity":          "from-teal-600 to-green-800",
  "Float":            "from-violet-600 to-purple-900",
  "Loop":             "from-indigo-600 to-violet-900",
  "Servus":           "from-blue-600 to-slate-800",
  "Home Trust":       "from-blue-600 to-slate-800",
  "Venn":             "from-purple-600 to-pink-900",
};

function getGradient(issuer = "") {
  for (const [key, val] of Object.entries(ISSUER_GRADIENTS)) {
    if (issuer.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return "from-slate-600 to-slate-900";
}

// ── Field helpers ──────────────────────────────────────────────────────────

function detectProgram(name = "", issuer = "") {
  const n = (name + " " + issuer).toLowerCase();
  if (n.includes("aeroplan"))            return "Aeroplan";
  if (n.includes("membership rewards") || issuer.toLowerCase().includes("american express")) return "Membership Rewards";
  if (n.includes("avion"))               return "RBC Avion";
  if (n.includes("scene"))               return "Scene+";
  if (n.includes("air miles"))           return "Air Miles";
  if (n.includes("td rewards"))          return "TD Rewards";
  if (n.includes("bmo rewards"))         return "BMO Rewards";
  if (n.includes("aventura"))            return "Aventura";
  if (n.includes("westjet"))             return "WestJet Rewards";
  if (n.includes("national bank") || n.includes("nbc")) return "NBC Rewards";
  if (n.includes("desjardins") || n.includes("bonusdollar")) return "BONUSDOLLARS";
  if (n.includes("cash back") || n.includes("cashback")) return "Cash Back";
  return "Rewards";
}

function detectTags(name = "", isCashBack = false, fxFee = null, annualFeeNum = 0, program = "", hasLounge = false, cardType = "") {
  const tags = [];
  const n = (name + " " + cardType).toLowerCase();

  if (fxFee === 0) tags.push("No FX Fee");
  if (isCashBack)  tags.push("Cash Back");
  if (["Aeroplan","RBC Avion","Membership Rewards","Scene+","Air Miles","WestJet Rewards","TD Rewards","BMO Rewards","NBC Rewards","Aventura"].includes(program) ||
      n.includes("travel") || n.includes("miles")) tags.push("Travel");
  if (annualFeeNum === 0) tags.push("No Annual Fee");
  if (n.includes("business")) tags.push("Business");
  if (n.includes("student"))  tags.push("Student");
  if (["Aeroplan","Membership Rewards","RBC Avion"].includes(program)) tags.push("Transfer Partners");
  if (hasLounge) tags.push("Lounge Access");

  return [...new Set(tags)];
}

function detectNetwork(name = "", issuerObj = null) {
  const issuerName = typeof issuerObj === "object" ? (issuerObj?.name ?? "") : (issuerObj ?? "");
  const n = (name + " " + issuerName).toLowerCase();
  if (n.includes("mastercard"))          return "Mastercard";
  if (n.includes("american express") || n.includes("amex")) return "American Express";
  return "Visa";
}

function slugToId(slug = "") {
  return slug
    .replace(/^(american-express|amex)-/, "amex-")
    .replace(/^(royal-bank|rbc)-/, "rbc-")
    .replace(/^(toronto-dominion|td-bank|td)-/, "td-")
    .replace(/^(bank-of-montreal|bmo)-/, "bmo-")
    .replace(/^(cibc|canadian-imperial)-/, "cibc-")
    .replace(/^(scotiabank|bank-of-nova-scotia)-/, "scotia-")
    .replace(/^(national-bank|banque-nationale)-/, "nbc-")
    .replace(/^(mbna|mbna-canada)-/, "mbna-")
    .replace(/^(capital-one|capital-one-canada)-/, "capital-one-")
    .replace(/^hsbc-canada-/, "hsbc-")
    .replace(/^desjardins-caisse-/, "desjardins-")
    .replace(/-credit-card$/, "")
    .replace(/-card$/, "")
    .slice(0, 60);
}

function buildRewards(multipliers = []) {
  if (!Array.isArray(multipliers) || multipliers.length === 0) {
    return [{ multiplier: "1x", category: "all purchases" }];
  }
  const rewards = multipliers
    .filter(m => m && (m.multiplier || m.rate || m.value || m.earn))
    .map(m => ({
      multiplier: m.multiplier ? `${m.multiplier}x`
        : m.earn ? `${m.earn}x`
        : m.rate ? `${Math.round(m.rate * 100)}%`
        : `${m.value ?? 1}x`,
      category: (m.category ?? m.name ?? m.type ?? m.description ?? "all purchases")
        .toLowerCase().trim().slice(0, 60),
    }))
    .filter(r => r.category.length > 2);

  const seen = new Set();
  const unique = rewards.filter(r => {
    if (seen.has(r.category)) return false;
    seen.add(r.category);
    return true;
  });

  unique.sort((a, b) => {
    const va = parseFloat(a.multiplier.replace(/[x×%]/g, "")) || 0;
    const vb = parseFloat(b.multiplier.replace(/[x×%]/g, "")) || 0;
    return vb - va;
  });

  const result = unique.slice(0, 5);
  return result.length > 0 ? result : [{ multiplier: "1x", category: "all purchases" }];
}

// ── Map raw CCG API card → our Card shape ──────────────────────────────────

function mapCard(raw) {
  const slug    = raw.slug ?? raw.cardSlug ?? "";
  const id      = slugToId(slug) || `ccg-${raw.cardId ?? raw.id}`;
  const name    = (raw.name ?? raw.cardName ?? "Unknown").replace(/[®™]/g, "").trim();
  const issuerRaw = raw.issuer ?? "";
  const issuer = typeof issuerRaw === "object" ? (issuerRaw?.name ?? "") : String(issuerRaw);
  const networkObj = raw.network ?? {};
  const networkName = typeof networkObj === "object" ? (networkObj?.name ?? "") : String(networkObj);
  const network = networkName || detectNetwork(name, issuer);

  const feeNum  = typeof raw.annualFee === "number" ? Math.round(raw.annualFee) : 0;
  const program = detectProgram(name, issuer);

  // Bonus
  const bonusDollar = raw.signUpBonusDollarValue ?? 0;
  const bonusPts    = raw.signUpBonus ?? 0;
  const bonusStr    = bonusPts > 0
    ? `${Number(bonusPts).toLocaleString()} points${bonusDollar > 0 ? ` (~$${Math.round(bonusDollar)})` : ""}`
    : bonusDollar > 0 ? `~$${Math.round(bonusDollar)}` : "";

  // First year value: use netAnnualRewardsValue as a proxy
  const netVal = raw.netAnnualRewardsValue ?? raw.rewardsValue ?? raw.firstYearValue ?? 0;
  const fyvStr = netVal > 0 ? `~$${Math.round(netVal)}` : "$0";

  // MSR — not in the API fields, use a sensible default
  const msrStr = "$1,500";

  // Foreign fee
  const fxFee = raw.foreignExchangeFee ?? null;
  const fxStr = fxFee === 0 ? "0%" : fxFee != null ? `${Math.round(fxFee * 100)}%` : "2.5%";

  // Income
  const income = raw.minIncome ?? raw.minimumIncome ?? null;
  const incomeStr = income ? `$${Number(income).toLocaleString()}` : null;

  // Lounge — check perks/insurance count as proxy
  const hasLounge = !!(raw.loungeAccess ?? raw.hasLoungeAccess ?? false);
  const loungeDetails = hasLounge ? "Airport lounge access included" : "No lounge access";

  // Rewards multipliers
  const rewards = buildRewards(raw.multipliers ?? []);

  const cardType = raw.cardType ?? raw.cardTypeDescription ?? "";
  const tags = detectTags(name, raw.isCashBack ?? false, fxFee, feeNum, program, hasLounge, cardType);

  // Transfer partners
  const partners = Array.isArray(raw.transferPartners)
    ? raw.transferPartners.map(p => typeof p === "object" ? (p.name ?? p.partnerName ?? "") : p).filter(Boolean)
    : [];

  // Apply link — CCG uses cardUrl as affiliate link
  const directLink = raw.applyUrl ?? raw.cardUrl ?? raw.affiliateUrl ?? "";

  return {
    id,
    ccgSlug:          slug,
    name,
    issuer:           issuer || raw.issuer || "Unknown",
    annualFee:        `$${feeNum}`,
    annualFeeNum:     feeNum,
    firstYearValue:   fyvStr,
    pointsBonus:      bonusStr,
    msr:              msrStr,
    portals:          [],
    directLink:       directLink.startsWith("http") ? directLink : "",
    program,
    tags,
    rewards,
    featured:         !!(raw.promoted ?? raw.featured ?? false),
    image:            `/cards/${id}.png`,
    gradient:         getGradient(issuer),
    network,
    foreignFee:       fxStr,
    incomeReq:        incomeStr,
    insurance:        [],
    transferPartners: partners,
    loungeDetails,
    perks:            [],
    pointsValue:      null,
    welcomeMilestones: [],
    elevated:         false,
    elevatedNote:     null,
    source:           "ccg_scrape",
    status:           "published",
    lastVerified:     new Date().toISOString().slice(0, 10),
  };
}

// ── Deduplicate by id ──────────────────────────────────────────────────────

function dedup(cards) {
  const seen = new Map();
  for (const card of cards) {
    if (!seen.has(card.id) ||
        (seen.get(card.id).pointsBonus === "" && card.pointsBonus !== "")) {
      seen.set(card.id, card);
    }
  }
  return [...seen.values()];
}

// ── Supabase row mapper ────────────────────────────────────────────────────

function cardToRow(card) {
  return {
    id:                 card.id,
    name:               card.name,
    issuer:             card.issuer,
    annual_fee:         card.annualFee,
    annual_fee_num:     card.annualFeeNum,
    first_year_value:   card.firstYearValue,
    points_bonus:       card.pointsBonus,
    msr:                card.msr,
    portals:            card.portals,
    direct_link:        card.directLink,
    ccg_slug:           card.ccgSlug,
    program:            card.program,
    tags:               card.tags,
    rewards:            card.rewards,
    transfer_partners:  card.transferPartners ?? [],
    points_value:       null,
    network:            card.network ?? null,
    foreign_fee:        card.foreignFee ?? null,
    income_req:         card.incomeReq ?? null,
    insurance:          [],
    lounge_details:     card.loungeDetails ?? null,
    perks:              [],
    welcome_milestones: [],
    elevated:           false,
    elevated_note:      null,
    featured:           card.featured ?? false,
    image:              card.image,
    gradient:           card.gradient,
    source:             "ccg_scrape",
    status:             "published",
    last_verified:      card.lastVerified,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🌐  PointsBinder — CCG Card Scraper (API + Browser)");
  console.log("─".repeat(60));
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no DB writes)" : "LIVE"}`);
  console.log();

  const browser = await chromium.launch({ headless: !HEADED });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    extraHTTPHeaders: { "Accept-Language": "en-CA,en;q=0.9" },
  });

  const interceptedCards = [];
  let capturedBody = null;

  // Intercept and MODIFY every API request to widen the result set.
  // The quiz widget uses resultsPerPage:5 with filters — we remove all limits.
  await context.route(`**${API_PATH}*`, async (route) => {
    const request = route.request();
    try {
      capturedBody = JSON.parse(request.postData() ?? "{}");
    } catch {
      capturedBody = {};
    }
    const modifiedBody = {
      ...capturedBody,
      userPreferences: { flexOnly: false },
      resultsPerPage: 500,
      annualFeeMax: 9999,
      minIncome: 0,
      ratingFilter: 0,
      categories: [],
      categoriesExclude: [],
      nocache: true,
    };
    await route.continue({ postData: JSON.stringify(modifiedBody) });
  });

  // Collect all intercepted API responses
  context.on("response", async (response) => {
    if (response.url().includes(API_PATH)) {
      try {
        const body = await response.json();
        const arr = Array.isArray(body) ? body
          : Array.isArray(body?.cards) ? body.cards
          : Array.isArray(body?.data) ? body.data
          : null;
        if (arr && arr.length > 0) {
          interceptedCards.push(...arr);
          process.stdout.write(`  📥  ${arr.length} cards intercepted (total: ${interceptedCards.length})\n`);
        }
      } catch { /* non-JSON */ }
    }
  });

  const page = await context.newPage();
  await page.route("**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,eot,mp4}", r => r.abort());

  // ── Load the main listing page ───────────────────────────────────────────
  console.log("📡  Loading CCG credit cards listing…");
  await page.goto(`${CCG_BASE}/credit-cards`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(4000);

  // Scroll the page to trigger any deferred loads
  for (let i = 1; i <= 4; i++) {
    await page.evaluate((f) => window.scrollTo(0, document.body.scrollHeight * f), i / 4);
    await page.waitForTimeout(600);
  }
  await page.waitForTimeout(2000);

  // ── Load category-specific pages to capture more cards ──────────────────
  // CCG groups cards by category — hitting each category page triggers
  // a separate API call which returns that category's full card list.
  const categoryUrls = [
    "/credit-cards/travel",
    "/credit-cards/cash-back",
    "/credit-cards/business",
    "/credit-cards/no-annual-fee",
    "/credit-cards/rewards",
    "/credit-cards/low-interest",
    "/credit-cards/student",
    "/credit-cards/secured",
    "/credit-cards/aeroplan",
    "/credit-cards/scene-plus",
    "/credit-cards/air-miles",
    "/credit-cards/hotel",
  ];

  for (const catUrl of categoryUrls) {
    const prevCount = interceptedCards.length;
    console.log(`  → ${catUrl}`);
    try {
      await page.goto(`${CCG_BASE}${catUrl}`, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForTimeout(2500);
      for (let i = 1; i <= 3; i++) {
        await page.evaluate((f) => window.scrollTo(0, document.body.scrollHeight * f), i / 3);
        await page.waitForTimeout(500);
      }
      await page.waitForTimeout(1500);
      const newCards = interceptedCards.length - prevCount;
      if (newCards > 0) console.log(`     +${newCards} new cards`);
    } catch { /* category page may not exist — skip */ }
  }

  await page.waitForTimeout(1000);
  console.log(`\n📊  Total intercepted: ${interceptedCards.length} cards`);

  const allRawCards = [...interceptedCards];

  await browser.close();

  if (allRawCards.length === 0) {
    console.error("\n❌  No cards retrieved. Run with --headed to observe.");
    process.exit(1);
  }

  // Log the schema from the first card
  const sample = allRawCards[0];
  console.log(`\n✅  Total raw cards: ${allRawCards.length}`);
  console.log("\n🔍  API field schema (first card):");
  console.log("   ", Object.keys(sample).join(", "));
  console.log("\n   issuer type:", typeof sample.issuer, JSON.stringify(sample.issuer).slice(0, 80));
  console.log("   network type:", typeof sample.network, JSON.stringify(sample.network).slice(0, 80));
  console.log("   multipliers:", JSON.stringify(sample.multipliers ?? []).slice(0, 200));

  // ── Map to our Card shape ──────────────────────────────────────────────
  let cards = dedup(allRawCards.map(mapCard).filter(c => c.name !== "Unknown"));
  console.log(`\n✅  Unique mapped cards: ${cards.length}`);
  if (LIMIT < Infinity) cards = cards.slice(0, LIMIT);

  console.log(`\n📋  Card list (${cards.length}):`);
  for (const card of cards) {
    console.log(`   [${card.issuer.padEnd(20)}] ${card.name} — ${card.annualFee}`);
  }

  // ── Save output file ───────────────────────────────────────────────────
  if (OUTPUT) {
    fs.writeFileSync(path.resolve(OUTPUT), JSON.stringify(cards, null, 2));
    console.log(`\n💾  Saved to ${OUTPUT}`);
  }

  // ── Upsert to Supabase ─────────────────────────────────────────────────
  if (!DRY_RUN && cards.length > 0) {
    console.log(`\n🗄️   Writing ${cards.length} cards to Supabase…`);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    let upserted = 0;
    for (let i = 0; i < cards.length; i += 50) {
      const batch = cards.slice(i, i + 50).map(cardToRow);
      const { error } = await supabase.from("cards").upsert(batch, { onConflict: "id" });
      if (error) {
        console.error(`  ❌  Batch ${i}–${i + 50}:`, error.message);
      } else {
        upserted += batch.length;
        process.stdout.write(`  ✅  ${upserted}/${cards.length}\n`);
      }
    }
    console.log(`\n✅  Done — ${upserted} cards in Supabase`);
  }

  // ── Summary ────────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log(`📊  Summary: ${allRawCards.length} raw → ${cards.length} unique cards`);
  if (DRY_RUN) console.log("   (dry run — no DB writes)");
  console.log();
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
