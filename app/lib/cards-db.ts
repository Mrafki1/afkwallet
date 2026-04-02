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
  return (data ?? []).map(rowToCard);
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

export async function getCardsCount(): Promise<number> {
  const supabase = getServiceClient();
  const { count } = await supabase
    .from("cards")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");
  return count ?? 0;
}
