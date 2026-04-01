/**
 * Seed existing cards.ts data into Supabase.
 * Run this ONCE after creating the cards table.
 *
 * Usage:
 *   node scripts/seed-cards.mjs
 *   node scripts/seed-cards.mjs --dry-run
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { execSync } from "child_process";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "../.env.local") });

const DRY_RUN = process.argv.includes("--dry-run");

// ── Compile cards.ts to a temporary JS file ───────────────────────────────
// cards.ts uses TypeScript syntax, so we need to transpile it first.

const TS_SOURCE = path.join(__dirname, "../app/data/cards.ts");
const TMP_JS    = path.join(__dirname, "__cards_tmp.mjs");

console.log("🔧  Compiling cards.ts…");

// Use esbuild if available, otherwise fallback to manual transpile
let cardsData;
try {
  execSync(
    `npx esbuild "${TS_SOURCE}" --bundle=false --format=esm --outfile="${TMP_JS}" --target=node18`,
    { cwd: path.join(__dirname, ".."), stdio: "ignore" }
  );
  const mod = await import(pathToFileURL(TMP_JS).href + "?t=" + Date.now());
  cardsData = mod.cards;
} catch {
  // Fallback: regex-based extraction (won't handle all edge cases)
  console.log("  esbuild not available — using regex fallback");
  const src = fs.readFileSync(TS_SOURCE, "utf8");

  // Remove type exports and annotations
  const cleaned = src
    .replace(/^export type .+$/gm, "")
    .replace(/^export const CARDS_LAST_VERIFIED.+$/gm, "")
    .replace(/: Card(\[\])? =/g, " =")
    .replace(/as const/g, "")
    .replace(/\?:/g, ":")
    .replace(/<[^>]+>/g, "")
    .replace(/^(const GCR|const FF|const CCG|const FW)/gm, "const _$1".slice(6));

  const tmpFallback = path.join(__dirname, "__cards_fallback.mjs");
  fs.writeFileSync(tmpFallback, cleaned.replace("export const cards", "export const cards"));
  try {
    const mod = await import(pathToFileURL(tmpFallback).href);
    cardsData = mod.cards;
    fs.unlinkSync(tmpFallback);
  } catch (e) {
    console.error("Could not parse cards.ts:", e.message);
    process.exit(1);
  }
}

// Cleanup temp file
if (fs.existsSync(TMP_JS)) fs.unlinkSync(TMP_JS);

if (!cardsData || !Array.isArray(cardsData)) {
  console.error("❌  Could not load cards array from cards.ts");
  process.exit(1);
}

console.log(`✅  Loaded ${cardsData.length} cards from cards.ts\n`);

// ── Map Card → DB row ─────────────────────────────────────────────────────

function cardToRow(card) {
  return {
    id:                 card.id,
    name:               card.name,
    issuer:             card.issuer,
    annual_fee:         card.annualFee,
    annual_fee_num:     card.annualFeeNum,
    first_year_value:   card.firstYearValue,
    points_bonus:       card.pointsBonus,
    msr:                card.msr ?? "$0",
    portals:            card.portals ?? [],
    direct_link:        card.directLink ?? "",
    ccg_slug:           null, // manually-added cards don't have a CCG slug yet
    program:            card.program,
    tags:               card.tags ?? [],
    rewards:            card.rewards ?? [],
    transfer_partners:  card.transferPartners ?? [],
    points_value:       card.pointsValue ?? null,
    network:            card.network ?? null,
    foreign_fee:        card.foreignFee ?? null,
    income_req:         card.incomeReq ?? null,
    insurance:          card.insurance ?? [],
    lounge_details:     card.loungeDetails ?? null,
    perks:              card.perks ?? [],
    welcome_milestones: card.welcomeMilestones ?? [],
    elevated:           card.elevated ?? false,
    elevated_note:      card.elevatedNote ?? null,
    featured:           card.featured ?? false,
    image:              card.image ?? `/cards/${card.id}.png`,
    gradient:           card.gradient ?? "from-slate-600 to-slate-900",
    source:             "manual",
    status:             "published",
    last_verified:      card.lastVerified ?? null,
  };
}

// ── Upsert to Supabase ────────────────────────────────────────────────────

if (DRY_RUN) {
  console.log("🔍  Dry run — first 3 rows that would be inserted:\n");
  console.log(JSON.stringify(cardsData.slice(0, 3).map(cardToRow), null, 2));
  process.exit(0);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const rows = cardsData.map(cardToRow);
let upserted = 0;

for (let i = 0; i < rows.length; i += 50) {
  const batch = rows.slice(i, i + 50);
  const { error } = await supabase.from("cards").upsert(batch, { onConflict: "id" });
  if (error) {
    console.error(`❌  Batch error at row ${i}:`, error.message);
    console.error("    First row in batch:", JSON.stringify(batch[0], null, 2));
  } else {
    upserted += batch.length;
    console.log(`✅  Seeded ${upserted}/${rows.length} cards`);
  }
}

console.log(`\n🎉  Done — ${upserted} cards seeded to Supabase`);
