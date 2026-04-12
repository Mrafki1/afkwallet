/**
 * Server-side card data layer.
 * Use this in server components and API routes — NOT in "use client" files.
 * Client components should fetch from /api/cards instead.
 */

import { createClient } from "@supabase/supabase-js";
import type { Card } from "../data/cards";

// Service role client — can bypass RLS for admin operations
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// ── Type mapping ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToCard(row: any): Card {
  return {
    id:                 row.id,
    name:               row.name,
    issuer:             row.issuer,
    annualFee:          row.annual_fee,
    annualFeeNum:       row.annual_fee_num,
    firstYearValue:     row.first_year_value,
    pointsBonus:        row.points_bonus,
    msr:                row.msr,
    portals:            row.portals ?? [],
    directLink:         row.direct_link,
    program:            row.program,
    tags:               row.tags ?? [],
    rewards:            row.rewards ?? [],
    featured:           row.featured,
    image:              row.image,
    gradient:           row.gradient,
    network:            row.network,
    foreignFee:         row.foreign_fee,
    incomeReq:          row.income_req,
    insurance:          row.insurance ?? [],
    transferPartners:   row.transfer_partners ?? [],
    loungeDetails:      row.lounge_details,
    perks:              row.perks ?? [],
    pointsValue:        row.points_value,
    welcomeMilestones:  row.welcome_milestones ?? [],
    elevated:           row.elevated,
    elevatedNote:       row.elevated_note,
    lastVerified:       row.last_verified,
  };
}

function cardToRow(card: Card & { ccgSlug?: string; source?: string; status?: string }) {
  return {
    id:                  card.id,
    name:                card.name,
    issuer:              card.issuer,
    annual_fee:          card.annualFee,
    annual_fee_num:      card.annualFeeNum,
    first_year_value:    card.firstYearValue,
    points_bonus:        card.pointsBonus,
    msr:                 card.msr,
    portals:             card.portals,
    direct_link:         card.directLink,
    ccg_slug:            card.ccgSlug ?? null,
    program:             card.program,
    tags:                card.tags,
    rewards:             card.rewards,
    transfer_partners:   card.transferPartners ?? [],
    points_value:        card.pointsValue ?? null,
    network:             card.network ?? null,
    foreign_fee:         card.foreignFee ?? null,
    income_req:          card.incomeReq ?? null,
    insurance:           card.insurance ?? [],
    lounge_details:      card.loungeDetails ?? null,
    perks:               card.perks ?? [],
    welcome_milestones:  card.welcomeMilestones ?? [],
    elevated:            card.elevated ?? false,
    elevated_note:       card.elevatedNote ?? null,
    featured:            card.featured ?? false,
    image:               card.image,
    gradient:            card.gradient,
    source:              card.source ?? "manual",
    status:              card.status ?? "published",
    last_verified:       card.lastVerified ?? null,
  };
}

// ── Duplicate suppression ─────────────────────────────────────────────────────
// The CCG scraper imports cards under different IDs than our canonical local IDs.
// Both end up in Supabase as published, creating duplicate entries on listing pages.
// These are the CCG IDs to suppress — the canonical version is preferred.
const DUPLICATE_IDS = new Set([
  // CCG alias IDs (mapped in dashboard CARD_ID_ALIASES)
  "cibc-aventura-gold-visa",
  "bmo-eclipse-vi-infinite",
  "bmo-eclipse-vi-infinite-privilege",
  "bmo-ascend-world-elite-mc",
  "bmo-cashback-we-mc",
  "amex-marriott-bonvoy",
  "amex-marriott-bonvoy-business",
  "tangerine-moneyback-mastercard",
  "td-aeroplan-visa-infinite",
  "td-travel-visa-platinum",
  "mbna-smart-cash-platinum-plus-mastercard",
  // Additional scraper duplicates (same card, different slug)
  "td-aeroplan-vi-infinite-privilege",   // duplicate of td-aeroplan-vi-privilege
  // Note: scotia-passport-vi-infinite, scotia-momentum-vi-infinite, td-cashback-vi-infinite,
  // scotia-scene-plus-visa, cibc-aeroplan-vi-no-fee are now archived in DB — no longer needed here
]);

// ── Public queries ────────────────────────────────────────────────────────────

export async function getCards(): Promise<Card[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("status", "published")
    .order("name");
  if (error) {
    console.warn("getCards warning:", error.message);
    return [];
  }
  return (data ?? []).map(rowToCard).filter(c => !DUPLICATE_IDS.has(c.id));
}

export async function getCard(id: string): Promise<Card | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .single();
  if (error) return null;
  return data ? rowToCard(data) : null;
}

export async function getCardIds(): Promise<string[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("cards")
    .select("id")
    .eq("status", "published");
  if (error) {
    console.warn("getCardIds warning:", error.message);
    return [];
  }
  return (data ?? []).map(r => r.id);
}

export async function getLastVerified(): Promise<string> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("cards")
    .select("updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();
  if (!data) return new Date().toISOString().slice(0, 10);
  return new Date(data.updated_at).toISOString().slice(0, 10);
}

// ── Write operations (service role only) ─────────────────────────────────────

export async function upsertCard(
  card: Card & { ccgSlug?: string; source?: string; status?: string }
): Promise<void> {
  const supabase = getServiceClient();
  const row = cardToRow(card);
  const { error } = await supabase
    .from("cards")
    .upsert(row, { onConflict: "id" });
  if (error) throw new Error(`upsertCard(${card.id}): ${error.message}`);
}

export async function upsertCards(
  cards: Array<Card & { ccgSlug?: string; source?: string; status?: string }>
): Promise<{ inserted: number; updated: number }> {
  const supabase = getServiceClient();
  const rows = cards.map(cardToRow);

  // Batch in groups of 50 to avoid request size limits
  let inserted = 0;
  const updated = 0;
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error, count } = await supabase
      .from("cards")
      .upsert(batch, { onConflict: "id", count: "exact" });
    if (error) throw new Error(`upsertCards batch ${i}: ${error.message}`);
    inserted += count ?? batch.length;
  }
  return { inserted, updated };
}

// ── Bonus history ─────────────────────────────────────────────────────────────

export type BonusHistoryEntry = {
  points_bonus: string;
  recorded_at: string;
  note: string | null;
};

export async function getBonusHistory(cardId: string): Promise<BonusHistoryEntry[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("bonus_history")
    .select("points_bonus, recorded_at, note")
    .eq("card_id", cardId)
    .order("recorded_at", { ascending: false })
    .limit(20);
  if (error) return [];
  return data ?? [];
}

export async function recordBonusHistory(
  cardId: string,
  pointsBonus: string,
  note?: string
): Promise<void> {
  const supabase = getServiceClient();
  const today = new Date().toISOString().split("T")[0];
  await supabase.from("bonus_history").upsert(
    { card_id: cardId, points_bonus: pointsBonus, recorded_at: today, note: note ?? null },
    { onConflict: "card_id,recorded_at" }
  );
}

// ── Card change tracking ──────────────────────────────────────────────────────

export type CardChange = {
  card_id: string;
  field: "points_bonus" | "annual_fee" | "msr";
  old_value: string | null;
  new_value: string;
  note?: string;
  needs_review?: boolean;
};

export async function recordCardChanges(changes: CardChange[]): Promise<void> {
  if (changes.length === 0) return;
  const supabase = getServiceClient();
  const today = new Date().toISOString().split("T")[0];
  const rows = changes.map(c => ({
    card_id:      c.card_id,
    field:        c.field,
    old_value:    c.old_value ?? null,
    new_value:    c.new_value,
    recorded_at:  today,
    note:         c.note ?? null,
    needs_review: c.needs_review ?? false,
  }));
  const { error } = await supabase.from("card_changes").insert(rows);
  if (error) console.warn("recordCardChanges:", error.message);
}

export async function getPortalsLastScraped(): Promise<string | null> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("site_metadata")
    .select("updated_at")
    .eq("key", "portals_last_scraped")
    .single();
  return data?.updated_at ?? null;
}

export async function getCardsCount(): Promise<number> {
  const supabase = getServiceClient();
  const { count } = await supabase
    .from("cards")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");
  return count ?? 0;
}

// ── Admin queries ─────────────────────────────────────────────────────────────

export type RecentChange = {
  id: string;
  card_id: string;
  card_name: string | null;
  field: string;
  old_value: string | null;
  new_value: string;
  recorded_at: string;
  note: string | null;
};

export async function getRecentChanges(limit = 50): Promise<RecentChange[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("card_changes")
    .select("id, card_id, field, old_value, new_value, recorded_at, note")
    .order("recorded_at", { ascending: false })
    .limit(limit);
  if (error) return [];

  // Enrich with card names
  const cardIds = [...new Set((data ?? []).map(r => r.card_id))];
  let nameMap: Record<string, string> = {};
  if (cardIds.length > 0) {
    const { data: cards } = await supabase
      .from("cards")
      .select("id, name")
      .in("id", cardIds);
    nameMap = Object.fromEntries((cards ?? []).map(c => [c.id, c.name]));
  }

  return (data ?? []).map(r => ({ ...r, card_name: nameMap[r.card_id] ?? null }));
}

// ── Link health ──────────────────────────────────────────────────────────────

export type LinkHealthRow = {
  card_id:     string;
  card_name:   string | null;
  kind:        "portal" | "direct";
  portal_name: string | null;
  url:         string;
  status:      "ok" | "broken" | "unknown";
  reason:      string | null;
  checked_at:  string;
};

export async function getLinkHealth(): Promise<LinkHealthRow[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("link_health")
    .select("card_id, kind, portal_name, url, status, reason, checked_at")
    .order("status", { ascending: false })    // broken > unknown > ok
    .order("checked_at", { ascending: false })
    .limit(500);
  if (!data) return [];
  const cardIds = [...new Set(data.map(r => r.card_id))];
  let nameMap: Record<string, string> = {};
  if (cardIds.length > 0) {
    const { data: cards } = await supabase.from("cards").select("id, name").in("id", cardIds);
    nameMap = Object.fromEntries((cards ?? []).map(c => [c.id, c.name]));
  }
  return data.map(r => ({ ...r, card_name: nameMap[r.card_id] ?? null })) as LinkHealthRow[];
}

export async function getElevatedCards(): Promise<Card[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("elevated", true)
    .eq("status", "published")
    .order("name");
  if (error) return [];
  return (data ?? []).map(rowToCard);
}

export async function setCardElevated(cardId: string, elevated: boolean, note?: string): Promise<void> {
  const supabase = getServiceClient();
  await supabase
    .from("cards")
    .update({ elevated, elevated_note: note ?? null })
    .eq("id", cardId);
}
