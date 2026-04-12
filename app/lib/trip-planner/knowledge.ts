/**
 * Trip planner knowledge base.
 * Canadian-focused: rough points costs + preferred programs for common destinations.
 * Values are round-trip per traveler, approximate peak-season saver inventory.
 */

export type CabinClass = "economy" | "premium" | "business";

export type RegionKey =
  | "domestic_short"    // e.g. YYZ-YUL
  | "domestic_long"     // YYZ-YVR / YYC
  | "us_continental"
  | "hawaii_alaska"
  | "mexico_caribbean"
  | "europe"
  | "asia_north"        // Japan, Korea, Taiwan
  | "asia_southeast"    // Thailand, Vietnam, Singapore, Indonesia
  | "south_america"
  | "oceania";          // Australia, NZ

export type Destination = {
  key: RegionKey;
  label: string;
  examples: string[];
};

export const DESTINATIONS: Destination[] = [
  { key: "domestic_short",   label: "Canada — short haul (same province / neighbouring)", examples: ["Toronto–Montreal", "Calgary–Edmonton"] },
  { key: "domestic_long",    label: "Canada — long haul", examples: ["Toronto–Vancouver", "Halifax–Calgary"] },
  { key: "us_continental",   label: "Continental US", examples: ["New York", "San Francisco", "Chicago"] },
  { key: "hawaii_alaska",    label: "Hawaii or Alaska", examples: ["Honolulu", "Maui", "Anchorage"] },
  { key: "mexico_caribbean", label: "Mexico / Caribbean", examples: ["Cancun", "Punta Cana", "Jamaica"] },
  { key: "europe",           label: "Europe", examples: ["London", "Paris", "Rome"] },
  { key: "asia_north",       label: "North Asia", examples: ["Tokyo", "Seoul", "Taipei"] },
  { key: "asia_southeast",   label: "Southeast Asia", examples: ["Bangkok", "Bali", "Singapore"] },
  { key: "south_america",    label: "South America", examples: ["Buenos Aires", "Lima", "Rio"] },
  { key: "oceania",          label: "Australia / New Zealand", examples: ["Sydney", "Auckland"] },
];

/**
 * Rough round-trip points cost per traveler.
 * Based on Air Canada / Aeroplan distance-based chart (primary), and Marriott/Hotel
 * where relevant. These are starting-point estimates for strategy, not live quotes.
 */
export const POINTS_COST: Record<RegionKey, Record<CabinClass, number>> = {
  domestic_short:   { economy: 12_000,  premium: 20_000,  business: 35_000  },
  domestic_long:    { economy: 25_000,  premium: 45_000,  business: 70_000  },
  us_continental:   { economy: 25_000,  premium: 50_000,  business: 70_000  },
  hawaii_alaska:    { economy: 50_000,  premium: 90_000,  business: 110_000 },
  mexico_caribbean: { economy: 30_000,  premium: 60_000,  business: 90_000  },
  europe:           { economy: 70_000,  premium: 120_000, business: 140_000 },
  asia_north:       { economy: 90_000,  premium: 150_000, business: 150_000 },
  asia_southeast:   { economy: 105_000, premium: 180_000, business: 180_000 },
  south_america:    { economy: 70_000,  premium: 130_000, business: 150_000 },
  oceania:          { economy: 90_000,  premium: 160_000, business: 180_000 },
};

/**
 * Per region: which points programs are actually useful, ranked.
 * (1) = best for that route, (2) = also workable, (3) = last resort.
 */
export type ProgramRec = { program: string; rank: 1 | 2 | 3; note: string };

export const PROGRAM_FIT: Record<RegionKey, ProgramRec[]> = {
  domestic_short: [
    { program: "Aeroplan",         rank: 1, note: "Best domestic saver availability; short-haul floor is reasonable" },
    { program: "WestJet Rewards",  rank: 2, note: "Works if routing via WS; no award chart surprises" },
  ],
  domestic_long: [
    { program: "Aeroplan",         rank: 1, note: "Distance pricing rewards cross-country redemptions" },
    { program: "WestJet Rewards",  rank: 2, note: "Dollar-denominated — predictable but not lucrative" },
  ],
  us_continental: [
    { program: "Aeroplan",         rank: 1, note: "Direct AC/UA saver redemptions, 6k–25k zones" },
    { program: "Membership Rewards", rank: 2, note: "Transfer to Aeroplan 1:1 or Delta (seasonal sweet spots)" },
    { program: "RBC Avion",        rank: 3, note: "Fixed chart flights beat cash in shoulder season" },
  ],
  hawaii_alaska: [
    { program: "Aeroplan",         rank: 1, note: "Hawaii zone is a known Aeroplan sweet spot" },
    { program: "Membership Rewards", rank: 2, note: "MR → Aeroplan transfer preserves sweet spot" },
  ],
  mexico_caribbean: [
    { program: "Aeroplan",         rank: 1, note: "Dense AC inventory, predictable saver levels" },
    { program: "Membership Rewards", rank: 2, note: "Also works via Aeroplan transfer" },
    { program: "RBC Avion",        rank: 3, note: "Fixed chart covers Caribbean cheaply if booked early" },
  ],
  europe: [
    { program: "Aeroplan",         rank: 1, note: "Partner awards on Star Alliance (LH, LX, TP, SN) — 60k–70k economy" },
    { program: "Membership Rewards", rank: 1, note: "Transfer to Aeroplan, or to Marriott → hotel side of trip" },
    { program: "RBC Avion",        rank: 2, note: "Fixed chart economy redemptions can undercut Aeroplan" },
  ],
  asia_north: [
    { program: "Aeroplan",         rank: 1, note: "ANA, EVA, Asiana partners — classic long-haul sweet spot" },
    { program: "Membership Rewards", rank: 1, note: "Transfer to Aeroplan for the same redemptions" },
  ],
  asia_southeast: [
    { program: "Aeroplan",         rank: 1, note: "Partner awards via NH/TG/SQ — premium cabin value is high" },
    { program: "Membership Rewards", rank: 1, note: "Transfer to Aeroplan or (rare) Marriott → SQ KrisFlyer" },
  ],
  south_america: [
    { program: "Aeroplan",         rank: 1, note: "AC direct + LATAM/Avianca partners" },
    { program: "Membership Rewards", rank: 2, note: "Backup via Aeroplan transfer" },
  ],
  oceania: [
    { program: "Aeroplan",         rank: 1, note: "Air NZ + UA partner awards; premium cabin pricing is attractive" },
    { program: "Membership Rewards", rank: 1, note: "Transfer to Aeroplan for the same" },
  ],
};

/**
 * Rough percentage to add to "just flights" for hotel stays.
 * Used when traveler selects "include hotel points" on the form.
 */
export const HOTEL_POINTS_ROUGH: Record<RegionKey, number> = {
  domestic_short:   25_000,
  domestic_long:    40_000,
  us_continental:   50_000,
  hawaii_alaska:    120_000,
  mexico_caribbean: 100_000,
  europe:           150_000,
  asia_north:       120_000,
  asia_southeast:   80_000,
  south_america:    100_000,
  oceania:          150_000,
};

/**
 * Convert a card's `program` field (as stored in Supabase) to the programs it feeds.
 * A card can feed multiple programs (e.g. Amex MR feeds Aeroplan + Marriott).
 */
export function cardProgramFeeds(cardProgram: string): string[] {
  const p = (cardProgram || "").toLowerCase();
  if (p.includes("aeroplan"))              return ["Aeroplan"];
  if (p.includes("membership rewards"))    return ["Membership Rewards", "Aeroplan", "Marriott Bonvoy"];
  if (p.includes("avion"))                 return ["RBC Avion"];
  if (p.includes("westjet"))               return ["WestJet Rewards"];
  if (p.includes("marriott") || p.includes("bonvoy")) return ["Marriott Bonvoy"];
  if (p.includes("scene"))                 return ["Scene+"];
  if (p.includes("air miles"))             return ["Air Miles"];
  if (p.includes("td rewards"))            return ["TD Rewards"];
  if (p.includes("cash back") || p === "cash back") return ["Cash Back"];
  return [cardProgram];
}
