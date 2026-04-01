/**
 * Portal scraper configurations.
 *
 * Each portal has:
 *   - name:       Short ID matching the Portal.name in cards.ts
 *   - baseUrl:    Root URL
 *   - buildUrl:   Function(card) → URL to scrape for that card's bonus
 *   - extract:    Async function(page) → number | null  (the cash bonus in $)
 *
 * NOTE: Selectors are based on publicly visible page structure.
 * If a portal redesigns, update the extract() function for that portal.
 */

export const PORTAL_CONFIGS = [

  // ── Great Canadian Rebates ─────────────────────────────────────────────────
  {
    name: "GCR",
    baseUrl: "https://www.greatcanadianrebates.ca",

    buildUrl(card) {
      // cards.ts stores the full GCR URL in the portal object
      return card.gcrUrl ?? null;
    },

    async extract(page) {
      // GCR shows the rebate amount prominently — look for dollar amounts near
      // "cash back", "rebate", or "bonus" text.
      // Selector targets the rebate dollar value displayed on the card detail page.
      try {
        await page.waitForSelector(".rebate-amount, .cashback-amount, [class*='rebate'], [class*='bonus-amount']", { timeout: 8000 });
      } catch {
        // fall through to text scan
      }

      const text = await page.evaluate(() => document.body.innerText);
      return extractDollarFromText(text, ["cash back", "rebate", "bonus", "reward"]);
    },
  },

  // ── Credit Card Genius ─────────────────────────────────────────────────────
  {
    name: "CCG",
    baseUrl: "https://www.creditcardgenius.ca",

    buildUrl(card) {
      return card.ccgUrl ?? null;
    },

    async extract(page) {
      try {
        await page.waitForSelector("[class*='bonus'], [class*='offer'], [class*='reward']", { timeout: 8000 });
      } catch { /* fall through */ }

      // CCG often shows "Get $XXX bonus" or "$XXX cash back through us"
      const text = await page.evaluate(() => document.body.innerText);
      return extractDollarFromText(text, ["through us", "via ccg", "exclusive", "bonus", "cash back"]);
    },
  },

  // ── Frugal Flyer ──────────────────────────────────────────────────────────
  {
    name: "FF",
    baseUrl: "https://frugalflyer.ca",

    buildUrl(card) {
      return card.ffUrl ?? null;
    },

    async extract(page) {
      try {
        await page.waitForSelector("article, .entry-content, main", { timeout: 8000 });
      } catch { /* fall through */ }

      const text = await page.evaluate(() => document.body.innerText);
      return extractDollarFromText(text, ["bonus", "referral bonus", "cash back", "through frugal flyer"]);
    },
  },

  // ── Finly Wealth ──────────────────────────────────────────────────────────
  {
    name: "FW",
    baseUrl: "https://finlywealth.com",

    buildUrl(card) {
      return card.fwUrl ?? null;
    },

    async extract(page) {
      try {
        await page.waitForSelector("[class*='bonus'], [class*='offer'], [class*='reward'], main", { timeout: 8000 });
      } catch { /* fall through */ }

      const text = await page.evaluate(() => document.body.innerText);
      return extractDollarFromText(text, ["bonus", "exclusive", "cash back", "referral"]);
    },
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Scan page text for dollar amounts near keyword context.
 * Returns the highest dollar value found near a keyword (most likely the bonus).
 *
 * @param {string} text     Full page text
 * @param {string[]} hints  Keywords to look near
 * @returns {number | null}
 */
export function extractDollarFromText(text, hints) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const candidates = [];

  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase();
    const isNearHint = hints.some(h => {
      // Check this line and ±3 surrounding lines
      const window = lines.slice(Math.max(0, i - 3), i + 4).join(" ").toLowerCase();
      return window.includes(h);
    });

    if (!isNearHint) continue;

    // Extract all dollar amounts from this line
    const matches = lines[i].matchAll(/\$\s?(\d[\d,]*)/g);
    for (const m of matches) {
      const val = parseInt(m[1].replace(/,/g, ""), 10);
      // Plausible portal bonus range: $20–$500
      if (val >= 20 && val <= 500) {
        candidates.push(val);
      }
    }
  }

  if (candidates.length === 0) return null;
  // Return the most common value, or the max if all unique
  const freq = {};
  let maxFreq = 0;
  let result = candidates[0];
  for (const v of candidates) {
    freq[v] = (freq[v] ?? 0) + 1;
    if (freq[v] > maxFreq) { maxFreq = freq[v]; result = v; }
  }
  return result;
}
