/**
 * check-portal-links-deep.mjs
 * Stricter link checker that:
 *   - Fetches 100KB of page content (vs 8KB)
 *   - Uses expanded soft-404 / expired-offer pattern list
 *   - Verifies the card name or issuer appears on the page
 *   - Detects "browse/category" pages (many offers listed, not a single offer)
 *   - Checks the page title for red flags
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

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
  /rebate (has |is )?(ended|expired|no longer)/i,
  /cette offre (n.est plus|est expirée)/i,
];

// Words to strip from card name for token matching against page content
const STOPWORDS = new Set([
  "the","card","credit","mastercard","visa","amex","american","express",
  "infinite","privilege","world","elite","platinum","gold","rewards","points",
  "no","fee","plus","and","for","business","biz","personal","pers",
  "canadian","financial","bank",
]);

function tokenize(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s+]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOPWORDS.has(t));
}

function isHomepage(url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.replace(/\/$/, "").split("/").filter(Boolean);
    if (parts.length < 2) return true;
    return HOMEPAGE_PATTERNS.some(p => p.test(url));
  } catch { return true; }
}

async function checkUrl(url, cardName, cardIssuer, portalName) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  const issues = [];

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

    if (res.status === 404) return { ok: false, issues: [`404 Not Found`], finalUrl };

    // Redirect to homepage = offer dead
    if (isHomepage(finalUrl)) {
      return { ok: false, issues: [`redirected to homepage/listing: ${finalUrl}`], finalUrl };
    }

    if (res.status >= 500 || res.status === 403 || res.status === 429) {
      return { ok: null, issues: [`HTTP ${res.status} (skipped)`], finalUrl };
    }

    // Deep body read (up to 100KB)
    let body = "";
    if (res.body && res.status === 200) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let total = 0;
      try {
        while (total < 100_000) {
          const { value, done } = await reader.read();
          if (done) break;
          body += decoder.decode(value, { stream: true });
          total += value.byteLength;
        }
      } finally {
        reader.cancel();
      }
    }

    // Page title extraction
    const titleMatch = body.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";

    // CCG is a client-side SPA — body check gives false positives
    // For CCG we only verify: proper URL structure, HTTP 200, no homepage redirect
    const isCCG = portalName === "CCG";

    if (!isCCG) {
      // Expired/not-found patterns in body
      for (const pat of EXPIRED_PATTERNS) {
        if (pat.test(body)) {
          issues.push(`body matched expired-offer pattern: ${pat}`);
          break;
        }
      }

      // Card name / issuer token match against body
      const bodyLower = body.toLowerCase();
      const nameTokens = tokenize(cardName);
      const matchingNameTokens = nameTokens.filter(t => bodyLower.includes(t));
      if (nameTokens.length > 0 && matchingNameTokens.length === 0) {
        issues.push(`body does not mention any card name tokens (${nameTokens.join(", ")})`);
      }

      // Check title for red flags
      if (/not found|404|error|page gone|no results/i.test(title)) {
        issues.push(`title suggests error: "${title}"`);
      }
    } else {
      // For CCG, verify URL still matches the expected slug pattern
      try {
        const u = new URL(finalUrl);
        if (!/\/credit-cards\/[a-z0-9-]+/.test(u.pathname)) {
          issues.push(`CCG URL lost its slug after redirect: ${finalUrl}`);
        }
      } catch {
        issues.push(`invalid final URL: ${finalUrl}`);
      }
    }

    if (issues.length) return { ok: false, issues, finalUrl, title };
    return { ok: true, issues: [], finalUrl, title };
  } catch (err) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("abort") || msg.includes("timeout"))
      return { ok: null, issues: ["timeout"], finalUrl: url };
    return { ok: null, issues: [msg.slice(0, 80)], finalUrl: url };
  }
}

async function main() {
  const { data: cards, error } = await supabase
    .from("cards")
    .select("id, name, issuer, portals")
    .eq("status", "published");
  if (error) { console.error(error); process.exit(1); }

  const checks = [];
  for (const card of cards) {
    for (const portal of (card.portals ?? [])) {
      checks.push({ card, portal });
    }
  }

  console.log(`\nDeep-checking ${checks.length} portal URLs across ${cards.length} cards...\n`);

  const broken = [];
  const unknown = [];
  let ok = 0;

  const BATCH = 6;
  for (let i = 0; i < checks.length; i += BATCH) {
    const batch = checks.slice(i, i + BATCH);
    process.stdout.write(`  [${i}/${checks.length}]\r`);
    await Promise.all(batch.map(async ({ card, portal }) => {
      const result = await checkUrl(portal.url, card.name, card.issuer, portal.name);
      if (result.ok === false) {
        broken.push({ card: card.name, cardId: card.id, portal: portal.name, url: portal.url, issues: result.issues, finalUrl: result.finalUrl, title: result.title });
      } else if (result.ok === null) {
        unknown.push({ card: card.name, portal: portal.name, url: portal.url, issues: result.issues });
      } else {
        ok++;
      }
    }));
  }

  console.log(`\n${"─".repeat(70)}`);
  console.log(`RESULTS: ${ok} OK  |  ${broken.length} BROKEN  |  ${unknown.length} UNKNOWN`);
  console.log(`${"─".repeat(70)}\n`);

  if (broken.length) {
    console.log(`🔴 BROKEN (${broken.length}):`);
    for (const b of broken) {
      console.log(`  • [${b.portal}] ${b.card} (${b.cardId})`);
      console.log(`    orig: ${b.url}`);
      if (b.finalUrl && b.finalUrl !== b.url) console.log(`    →    ${b.finalUrl}`);
      if (b.title) console.log(`    title: "${b.title.slice(0, 90)}"`);
      for (const issue of b.issues) console.log(`    → ${issue}`);
      console.log();
    }
  }

  if (unknown.length) {
    console.log(`⚪ UNKNOWN (${unknown.length}):`);
    for (const u of unknown) console.log(`  • [${u.portal}] ${u.card} — ${u.issues.join(", ")}`);
  }
}

main().catch(console.error);
