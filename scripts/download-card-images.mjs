/**
 * PointsBinder — Card Image Downloader
 * ======================================
 * Downloads card images from CCG for cards that are missing them.
 * Tries direct CDN URL patterns first, then falls back to page scraping.
 * Saves to public/cards/{id}.{ext} and updates Supabase.
 *
 * Usage:
 *   node scripts/download-card-images.mjs              # cards missing images
 *   node scripts/download-card-images.mjs --all        # re-download everything
 *   node scripts/download-card-images.mjs --id amex-cobalt
 *   node scripts/download-card-images.mjs --dry-run
 *   node scripts/download-card-images.mjs --headed
 */

import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "../.env.local") });

const args        = process.argv.slice(2);
const getArg      = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const hasFlag     = (f) => args.includes(f);
const DRY_RUN     = hasFlag("--dry-run");
const HEADED      = hasFlag("--headed");
const FORCE       = hasFlag("--all");
const ID_ONLY     = getArg("--id");
const DELAY_MS    = parseInt(getArg("--delay") ?? "800");
const CONCURRENCY = parseInt(getArg("--concurrency") ?? "2");

const CCG_BASE   = "https://www.creditcardgenius.ca";
const CCG_MEDIA  = "https://media.creditcardgenius.ca";
const IMAGES_DIR = path.join(__dirname, "../public/cards");

// ── HTTP download helper ───────────────────────────────────────────────────

function checkUrlExists(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith("https") ? https : http;
    const req = protocol.request(url, { method: "HEAD" }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(5000, () => { req.destroy(); resolve(false); });
    req.end();
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const protocol = url.startsWith("https") ? https : http;
    const req = protocol.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        try { fs.unlinkSync(destPath); } catch { /* ignore */ }
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        try { fs.unlinkSync(destPath); } catch { /* ignore */ }
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
      file.on("error", (err) => { try { fs.unlinkSync(destPath); } catch { /* ignore */ } reject(err); });
    });
    req.on("error", reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

function extFromUrl(url) {
  const u = url.split("?")[0];
  const ext = path.extname(u).toLowerCase();
  return [".png", ".jpg", ".jpeg", ".webp"].includes(ext) ? ext : ".png";
}

// ── CCG direct CDN URL patterns ────────────────────────────────────────────
// Try known patterns before launching a browser

function buildCdnCandidates(slug, affiliateId) {
  const candidates = [];

  // Pattern 1: slug-based (primary CDN)
  if (slug) {
    candidates.push(
      `${CCG_MEDIA}/credit-card-images/lg/${slug}.png`,
      `${CCG_MEDIA}/credit-card-images/lg/${slug}.jpg`,
      `${CCG_MEDIA}/credit-card-images/lg/${slug}.webp`,
      `${CCG_BASE}/images/credit-cards/${slug}.png`,
      `${CCG_BASE}/images/credit-cards/${slug}.jpg`,
    );
  }

  // Pattern 2: affiliateId-based (camelCase from API)
  if (affiliateId) {
    const lc = affiliateId.charAt(0).toLowerCase() + affiliateId.slice(1);
    candidates.push(
      `${CCG_BASE}/images/credit-cards/${affiliateId}.png`,
      `${CCG_BASE}/images/credit-cards/${lc}.png`,
      `${CCG_BASE}/images/cards/${affiliateId}.png`,
      `${CCG_BASE}/assets/images/${affiliateId}.png`,
    );
  }

  return candidates;
}

// ── Browser-based page scrape fallback ────────────────────────────────────

async function scrapeCardImage(page, slug) {
  await page.goto(`${CCG_BASE}/credit-cards/${slug}`, {
    waitUntil: "domcontentloaded",
    timeout: 25000,
  });
  // Wait for Angular to render the card component
  await page.waitForTimeout(3000);

  // Try to find the card image via various selectors
  const imgUrl = await page.evaluate(() => {
    const selectors = [
      // Angular component-rendered card
      "ccg-card-image img",
      "ccg-credit-card img",
      "app-card-image img",
      // Class-based
      ".card-image img",
      ".product-image img",
      ".card-overview img",
      ".card-hero img",
      ".hero-card img",
      ".credit-card-image img",
      // Attribute hints
      "img[alt*='card' i]:not([src*='sprite']):not([src*='icon'])",
      "img[alt*='credit' i]:not([src*='sprite']):not([src*='icon'])",
      // Image in a header/hero section
      "header img",
      ".hero img",
      ".overview img",
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (!el) continue;
      const src = el.src || el.currentSrc || el.getAttribute("src") || "";
      if (src && src.startsWith("http") && !src.includes("sprite") && !src.includes("favicon")) {
        return src;
      }
    }

    // Last resort: find the largest image on the page (likely the card)
    const allImgs = [...document.querySelectorAll("img[src]")]
      .filter(i => {
        const src = i.src || "";
        return src.startsWith("http") && !src.includes("sprite") && !src.includes("favicon") &&
               !src.includes("logo") && !src.includes("icon") && !src.includes("avatar");
      })
      .map(i => ({ src: i.src, w: i.naturalWidth || i.width || 0 }))
      .filter(i => i.w > 100) // skip tiny images
      .sort((a, b) => b.w - a.w);

    return allImgs[0]?.src ?? null;
  });

  return imgUrl ?? null;
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🖼️   PointsBinder — Card Image Downloader");
  console.log("─".repeat(60));
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

  // Load cards from Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  let query = supabase.from("cards").select("id, name, ccg_slug, image").eq("status", "published");
  if (ID_ONLY) query = query.eq("id", ID_ONLY);
  const { data: allCards, error } = await query;
  if (error) { console.error("Supabase error:", error.message); process.exit(1); }

  // Find cards that need images
  const cards = allCards.filter(card => {
    if (!card.ccg_slug) return false; // can't look up without a slug
    if (ID_ONLY || FORCE) return true;
    const imgField = card.image ?? "";
    const isPlaceholder = !imgField || imgField === "/cards/placeholder.png";
    if (isPlaceholder) return true;
    // Check if the file actually exists on disk
    const filename = imgField.replace(/^\/cards\//, "");
    return !fs.existsSync(path.join(IMAGES_DIR, filename));
  });

  console.log(`📋  ${cards.length} cards need images (of ${allCards.length} total)\n`);
  if (cards.length === 0) { console.log("✅  All done."); return; }

  // Phase 1: Try direct CDN URLs (fast, no browser)
  console.log("🔗  Phase 1: Trying direct CCG CDN URLs…");
  const needsBrowser = [];

  for (const card of cards) {
    const candidates = buildCdnCandidates(card.ccg_slug, null);
    let found = null;
    for (const url of candidates) {
      if (await checkUrlExists(url)) { found = url; break; }
    }

    if (found) {
      const ext = extFromUrl(found);
      const filename = `${card.id}${ext}`;
      const destPath = path.join(IMAGES_DIR, filename);
      const imageField = `/cards/${filename}`;
      if (!DRY_RUN) {
        try {
          await downloadFile(found, destPath);
          await supabase.from("cards").update({ image: imageField }).eq("id", card.id);
          console.log(`  ✅  ${card.id} → ${imageField} (CDN)`);
        } catch (err) {
          console.log(`  ❌  ${card.id} CDN download failed: ${err.message}`);
          needsBrowser.push(card);
        }
      } else {
        console.log(`  🔍  [DRY] ${card.id} → ${imageField} (CDN: ${found})`);
      }
    } else {
      needsBrowser.push(card);
    }
  }

  if (needsBrowser.length === 0) {
    console.log("\n✅  All images found via CDN.");
    return;
  }

  // Phase 2: Browser-based scraping for remaining cards
  console.log(`\n🌐  Phase 2: Browser scraping for ${needsBrowser.length} remaining cards…`);

  const browser = await chromium.launch({ headless: !HEADED });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    extraHTTPHeaders: { "Accept-Language": "en-CA,en;q=0.9" },
  });
  // Only block fonts and media — keep JS and CSS for Angular rendering
  await context.route("**/*.{woff,woff2,ttf,eot,mp4,pdf}", r => r.abort());
  context.setDefaultTimeout(20000);

  let downloaded = 0;
  let skipped    = 0;
  let failed     = 0;

  for (let i = 0; i < needsBrowser.length; i += CONCURRENCY) {
    const batch = needsBrowser.slice(i, i + CONCURRENCY);

    const results = await Promise.all(batch.map(async (card) => {
      const page = await context.newPage();
      try {
        const imgUrl = await scrapeCardImage(page, card.ccg_slug);
        await page.close();
        if (!imgUrl) return { card, status: "no_img" };

        const ext = extFromUrl(imgUrl);
        const filename = `${card.id}${ext}`;
        const destPath = path.join(IMAGES_DIR, filename);
        const imageField = `/cards/${filename}`;

        if (DRY_RUN) return { card, status: "dry", imgUrl, imageField };
        await downloadFile(imgUrl, destPath);
        return { card, status: "ok", imgUrl, imageField };
      } catch (err) {
        await page.close().catch(() => {});
        return { card, status: "error", error: err.message };
      }
    }));

    for (const r of results) {
      if (r.status === "ok") {
        await supabase.from("cards").update({ image: r.imageField }).eq("id", r.card.id);
        console.log(`  ✅  ${r.card.id} → ${r.imageField}`);
        downloaded++;
      } else if (r.status === "dry") {
        console.log(`  🔍  [DRY] ${r.card.id} → ${r.imageField}`);
        downloaded++;
      } else if (r.status === "no_img") {
        console.log(`  ⚠️   ${r.card.id} (${r.card.name}) — not found on CCG`);
        skipped++;
      } else {
        console.log(`  ❌  ${r.card.id} — ${r.error}`);
        failed++;
      }
    }

    if (i + CONCURRENCY < needsBrowser.length) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  await browser.close();

  console.log("\n" + "─".repeat(60));
  console.log(`📊  Downloaded: ${downloaded}  |  Skipped: ${skipped}  |  Failed: ${failed}`);
  if (DRY_RUN) console.log("   (dry run — no files written)");
  console.log();
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
