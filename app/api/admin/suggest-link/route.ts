/**
 * POST /api/admin/suggest-link { cardId }
 * Scrapes the card's issuer index page and returns ranked replacement
 * URL candidates based on token overlap with the card name.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "../../../lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

// Issuer → candidate index pages (we try each until one returns HTML)
const ISSUER_INDEXES: Record<string, string[]> = {
  "American Express": [
    "https://www.americanexpress.com/en-ca/credit-cards/",
    "https://www.americanexpress.com/en-ca/business/credit-cards/",
  ],
  "TD":           ["https://www.td.com/ca/en/personal-banking/products/credit-cards/"],
  "RBC":          ["https://www.rbcroyalbank.com/credit-cards/all-credit-cards.html"],
  "CIBC":         ["https://www.cibc.com/en/personal-banking/credit-cards.html"],
  "Scotiabank":   ["https://www.scotiabank.com/ca/en/personal/credit-cards.html"],
  "BMO":          ["https://www.bmo.com/main/personal/credit-cards/"],
  "National Bank":["https://www.nbc.ca/personal/credit-cards.html"],
  "MBNA":         ["https://www.mbna.ca/en/credit-cards.html", "https://www.mbna.ca/en/credit-cards/"],
  "MBNA / TD":    ["https://www.mbna.ca/en/credit-cards.html"],
};

// Small words to strip from card names so they don't pollute token matching
const STOP_WORDS = new Set([
  "card", "credit", "the", "a", "and", "of", "for", "plus", "mc", "mastercard",
  "visa", "amex", "american", "express",
]);

function tokenize(s: string): string[] {
  return s.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter(t => t && !STOP_WORDS.has(t) && t.length > 1);
}

function extractHrefs(html: string, baseHost: string): string[] {
  const urls = new Set<string>();
  const re = /href\s*=\s*["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const href = m[1];
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    try {
      const u = new URL(href, `https://${baseHost}`);
      if (u.hostname.endsWith(baseHost)) urls.add(u.toString().split("#")[0]);
    } catch { /* ignore */ }
  }
  return [...urls];
}

function scoreUrl(url: string, cardTokens: string[]): number {
  const urlLower = url.toLowerCase();
  let score = 0;
  for (const t of cardTokens) {
    if (urlLower.includes(t)) score += 1;
    // boost for path segment match
    if (urlLower.includes(`/${t}`) || urlLower.includes(`${t}-`) || urlLower.includes(`-${t}`)) score += 0.5;
  }
  // prefer URLs that look like product pages
  if (/credit-cards?\/[a-z]/.test(urlLower)) score += 0.5;
  // penalize obvious non-product pages
  if (/\/(en|fr|personal|business|ca)\/?$/.test(urlLower)) score -= 2;
  if (/\.(pdf|jpg|png|svg)$/.test(urlLower)) score -= 5;
  return score;
}

async function fetchHtml(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    clearTimeout(timer);
    return null;
  }
}

export async function POST(req: NextRequest) {
  // Admin auth
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cardId } = await req.json();
  if (!cardId) return NextResponse.json({ error: "Missing cardId" }, { status: 400 });

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: card } = await db
    .from("cards")
    .select("id, name, issuer, direct_link")
    .eq("id", cardId)
    .single();

  if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });

  console.log(`[suggest-link] ${cardId} (${card.issuer}) requested by ${user.email}`);

  const indexes = ISSUER_INDEXES[card.issuer];
  if (!indexes) {
    return NextResponse.json({
      ok: true,
      candidates: [],
      reason: `No known index page for issuer "${card.issuer}"`,
    });
  }

  const tokens = tokenize(card.name);

  // Gather all hrefs across index pages
  const allHrefs = new Set<string>();
  for (const indexUrl of indexes) {
    const html = await fetchHtml(indexUrl);
    if (!html) continue;
    const host = new URL(indexUrl).hostname;
    for (const u of extractHrefs(html, host)) allHrefs.add(u);
  }

  // Rank
  const ranked = [...allHrefs]
    .map(url => ({ url, score: scoreUrl(url, tokens) }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return NextResponse.json({
    ok: true,
    card: { id: card.id, name: card.name, issuer: card.issuer, current: card.direct_link },
    tokens,
    candidates: ranked,
  });
}
