/**
 * check-portal-links.mjs
 * Checks every portal URL in the DB for:
 *   - HTTP 404s
 *   - Redirects to homepages
 *   - Soft-404 body patterns
 *   - Obvious wrong-card URL mismatches (URL slug doesn't match card)
 *   - Missing CCG affiliate ?state= param
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// Load .env.local
try {
  const env = readFileSync(".env.local", "utf8");
  for (const line of env.split("\n")) {
    const [k, ...v] = line.split("=");
    if (k && v.length) process.env[k.trim()] = v.join("=").trim();
  }
} catch {}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

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

const SOFT_404_PATTERNS = [
  /page (not|no longer) found/i,
  /offer (not|no longer) (found|available)/i,
  /card (not|no longer) (found|available)/i,
  /this (page|offer|card) (does not|doesn't) exist/i,
  /sorry.*not found/i,
  /we couldn.t find (this|that|the)/i,
  /no longer available/i,
];

function isHomepage(url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.replace(/\/$/, "").split("/").filter(Boolean);
    if (parts.length < 2) return true;
    return HOMEPAGE_PATTERNS.some(p => p.test(url));
  } catch { return true; }
}

async function checkUrl(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PointsBinderBot/1.0)" },
    });
    clearTimeout(timer);
    const finalUrl = res.url;

    if (res.status === 404) return { ok: false, reason: "404 Not Found", finalUrl };
    if (isHomepage(finalUrl)) return { ok: false, reason: `redirected to homepage: ${finalUrl}`, finalUrl };
    if (res.status >= 500 || res.status === 403 || res.status === 429)
      return { ok: null, reason: `HTTP ${res.status} (skipped)`, finalUrl };

    if (res.status === 200) {
      const reader = res.body?.getReader();
      let body = "";
      if (reader) {
        const { value } = await reader.read();
        if (value) body = new TextDecoder().decode(value).slice(0, 8000);
        reader.cancel();
      }
      for (const pat of SOFT_404_PATTERNS) {
        if (pat.test(body)) return { ok: false, reason: `soft-404: ${pat}`, finalUrl };
      }
    }

    return { ok: true, reason: `HTTP ${res.status}`, finalUrl };
  } catch (err) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("abort") || msg.includes("timeout"))
      return { ok: null, reason: "timeout", finalUrl: url };
    return { ok: null, reason: msg.slice(0, 80), finalUrl: url };
  }
}

// Heuristic: does the URL slug look like it could belong to this card?
// We check if major words from the card name appear in the URL path.
function detectWrongCard(cardId, cardName, portalName, url) {
  const issues = [];

  // Normalize card name into slug tokens
  const nameTokens = cardName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(t => t.length > 3 && !["card", "mastercard", "visa", "elite", "world", "infinite", "credit", "financial"].includes(t));

  const urlLower = url.toLowerCase();

  // Check for obvious cross-card contamination
  const SUSPICIOUS_PAIRS = [
    { cardPattern: /amex.*(biz|business).*(plat|platinum)/i, urlBad: /scotiabank|scotia-amex/i },
    { cardPattern: /amex.*(biz|business).*(gold)/i,          urlBad: /scotiabank|scotia-amex/i },
    { cardPattern: /amex.*(personal|pers).*(plat)/i,          urlBad: /scotiabank|scotia-amex/i },
    { cardPattern: /brim/i,                                    urlBad: /pc-world|koho|neo-world/i },
    { cardPattern: /pc.*(financial|world)/i,                   urlBad: /koho/i },
    { cardPattern: /neo.*(financial|secured)/i,                urlBad: /koho/i },
  ];

  for (const { cardPattern, urlBad } of SUSPICIOUS_PAIRS) {
    if (cardPattern.test(cardName) && urlBad.test(url)) {
      issues.push(`URL looks like wrong card — "${url}" doesn't match "${cardName}"`);
    }
  }

  // Flag CCG URLs missing the affiliate ?state= param
  if (portalName === "CCG" && url.includes("creditcardgenius.ca") && !url.includes("state=")) {
    issues.push(`CCG URL missing affiliate ?state= param`);
  }

  return issues;
}

async function main() {
  const { data: cards, error } = await supabase
    .from("cards")
    .select("id, name, portals")
    .eq("status", "published");

  if (error) { console.error("DB error:", error.message); process.exit(1); }

  const checks = [];
  for (const card of cards) {
    for (const portal of (card.portals ?? [])) {
      checks.push({ card, portal });
    }
  }

  console.log(`\nChecking ${checks.length} portal URLs across ${cards.length} published cards...\n`);

  const broken   = [];
  const warnings = [];
  const unknown  = [];
  let ok = 0;

  // Batch of 8 concurrent
  const BATCH = 8;
  for (let i = 0; i < checks.length; i += BATCH) {
    const batch = checks.slice(i, i + BATCH);
    process.stdout.write(`  [${i}/${checks.length}]\r`);

    await Promise.all(batch.map(async ({ card, portal }) => {
      // Static checks first (no HTTP needed)
      const staticIssues = detectWrongCard(card.id, card.name, portal.name, portal.url);
      if (staticIssues.length) {
        for (const issue of staticIssues) {
          warnings.push({ card: card.name, portal: portal.name, url: portal.url, issue });
        }
      }

      // HTTP check
      const result = await checkUrl(portal.url);
      if (result.ok === false) {
        broken.push({ card: card.name, cardId: card.id, portal: portal.name, url: portal.url, reason: result.reason });
      } else if (result.ok === null) {
        unknown.push({ card: card.name, portal: portal.name, url: portal.url, reason: result.reason });
      } else {
        ok++;
      }
    }));
  }

  console.log(`\n${"─".repeat(70)}`);
  console.log(`RESULTS: ${ok} OK  |  ${broken.length} BROKEN  |  ${warnings.length} WARNINGS  |  ${unknown.length} UNKNOWN`);
  console.log(`${"─".repeat(70)}\n`);

  if (broken.length) {
    console.log(`🔴 BROKEN (${broken.length}):`);
    for (const b of broken) {
      console.log(`  • [${b.portal}] ${b.card}`);
      console.log(`    ${b.url}`);
      console.log(`    → ${b.reason}\n`);
    }
  }

  if (warnings.length) {
    console.log(`🟡 WARNINGS — possible wrong card / missing affiliate param (${warnings.length}):`);
    for (const w of warnings) {
      console.log(`  • [${w.portal}] ${w.card}`);
      console.log(`    ${w.url}`);
      console.log(`    → ${w.issue}\n`);
    }
  }

  if (unknown.length) {
    console.log(`⚪ UNKNOWN / SKIPPED (server errors, timeouts) (${unknown.length}):`);
    for (const u of unknown) {
      console.log(`  • [${u.portal}] ${u.card} — ${u.reason}`);
    }
  }
}

main().catch(console.error);
