"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "../components/Navbar";
import { useOwnedCards } from "../lib/owned-cards";
import type { Card } from "../data/cards";
import {
  DESTINATIONS, POINTS_COST, PROGRAM_FIT, HOTEL_POINTS_ROUGH,
  cardProgramFeeds, type RegionKey, type CabinClass,
} from "../lib/trip-planner/knowledge";

function parsePoints(bonus: string): number {
  if (!bonus) return 0;
  const m = bonus.replace(/,/g, "").match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function monthsBetween(fromISO: string, toISO: string): number {
  const a = new Date(fromISO), b = new Date(toISO);
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) + (b.getDate() >= a.getDate() ? 0 : -1);
}

export default function TripPlannerClient({ cards }: { cards: Card[] }) {
  const { owned, signedIn } = useOwnedCards();

  // ── Form state ──
  const [region, setRegion]             = useState<RegionKey>("europe");
  const [cabin, setCabin]               = useState<CabinClass>("economy");
  const [travelers, setTravelers]       = useState(2);
  const [includeHotel, setIncludeHotel] = useState(true);
  const today = new Date().toISOString().slice(0, 10);
  const defaultTrip = new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString().slice(0, 10); // +6 months
  const [tripDate, setTripDate]         = useState(defaultTrip);
  const [excludeOwned, setExcludeOwned] = useState(true);
  const [onlyNoFee, setOnlyNoFee]       = useState(false);
  const [excludeBusiness, setExcludeBusiness] = useState(false);
  const [allowedIssuers, setAllowedIssuers]   = useState<Set<string>>(new Set());
  const [diversify, setDiversify]             = useState(true);
  const [maxPerIssuer, setMaxPerIssuer]       = useState(2);

  // All issuers present in the card catalog (alphabetical)
  const allIssuers = useMemo(
    () => Array.from(new Set(cards.map(c => c.issuer))).sort(),
    [cards]
  );

  function toggleIssuer(name: string) {
    setAllowedIssuers(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }

  const monthsOut = Math.max(0, monthsBetween(today, tripDate));

  // ── Calculated strategy ──
  const strategy = useMemo(() => {
    const perPaxPoints  = POINTS_COST[region][cabin];
    const flightsTotal  = perPaxPoints * travelers;
    const hotelTotal    = includeHotel ? HOTEL_POINTS_ROUGH[region] : 0;
    const totalNeeded   = flightsTotal + hotelTotal;

    const fit = PROGRAM_FIT[region];
    const preferredPrograms = new Set(fit.filter(p => p.rank <= 2).map(p => p.program));
    // When the user wants hotel points too, accept hotel-loyalty feeds (and
    // keep Marriott Bonvoy-earning cards like the Bonvoy Amex in the pool).
    if (includeHotel) preferredPrograms.add("Marriott Bonvoy");

    // Candidate cards = published, non-owned (if toggle), match preferred programs,
    // with a real welcome bonus.
    const candidates = cards
      .filter(c => (excludeOwned ? !owned.has(c.id) : true))
      .filter(c => (onlyNoFee ? c.annualFeeNum === 0 : true))
      .filter(c => (excludeBusiness ? !(c.tags ?? []).includes("Business") : true))
      .filter(c => (allowedIssuers.size === 0 ? true : allowedIssuers.has(c.issuer)))
      .map(c => {
        const feeds = cardProgramFeeds(c.program);
        const matchedProgram = feeds.find(f => preferredPrograms.has(f));
        const bonus = parsePoints(c.pointsBonus);
        return { card: c, matchedProgram, bonus };
      })
      .filter((x): x is { card: Card; matchedProgram: string; bonus: number } =>
        !!x.matchedProgram && x.bonus > 0);

    // Pick cards greedily. When `diversify` is on, penalize each subsequent
    // card from an already-used issuer so we spread applications across banks
    // instead of stacking e.g. 3 Amex cards just because Amex MR bonuses tend
    // to be the highest on paper.
    const remaining = [...candidates];
    const selected: { card: Card; matchedProgram: string; bonus: number }[] = [];
    const issuerCount = new Map<string, number>();
    let running = 0;
    let amexCount = 0;

    while (selected.length < 5 && remaining.length > 0) {
      if (running >= totalNeeded && selected.length >= 2) break;

      // Score each remaining candidate
      let bestIdx = -1, bestScore = -Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const c = remaining[i];
        const isAmex = c.card.issuer?.toLowerCase().includes("american express");
        if (isAmex && amexCount >= 2) continue;
        const used = issuerCount.get(c.card.issuer) ?? 0;
        if (used >= maxPerIssuer) continue;
        // 35% bonus penalty per prior card from same issuer if diversifying
        const score = diversify ? c.bonus * Math.pow(0.65, used) : c.bonus;
        if (score > bestScore) { bestScore = score; bestIdx = i; }
      }
      if (bestIdx < 0) break;
      const pick = remaining.splice(bestIdx, 1)[0];
      selected.push(pick);
      running += pick.bonus;
      issuerCount.set(pick.card.issuer, (issuerCount.get(pick.card.issuer) ?? 0) + 1);
      if (pick.card.issuer?.toLowerCase().includes("american express")) amexCount++;
    }

    // Timeline buckets based on months out
    const totalMsrWeeks = selected.length * 13; // ~3 months per card MSR
    const appliedTimelineOk = totalMsrWeeks / 4 <= monthsOut + 1;

    return {
      perPaxPoints, flightsTotal, hotelTotal, totalNeeded,
      selected, running,
      shortfall: Math.max(0, totalNeeded - running),
      appliedTimelineOk,
      preferredPrograms: fit,
    };
  }, [region, cabin, travelers, includeHotel, excludeOwned, onlyNoFee, excludeBusiness, allowedIssuers, diversify, maxPerIssuer, cards, owned, monthsOut]);

  // ── Render ──
  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#2563eb" }}>Reverse Trip Planner</p>
          <h1 className="text-3xl font-black" style={{ color: "#0f172a" }}>Tell us where. We&rsquo;ll work backwards.</h1>
          <p className="text-sm mt-2 max-w-2xl" style={{ color: "#64748b" }}>
            Pick a destination and departure date, and we&rsquo;ll estimate the points you need, the best programs to earn them in, and which cards to apply for on what schedule.
          </p>
        </div>

        <div className="grid md:grid-cols-[360px_1fr] gap-6">
          {/* ── Form ── */}
          <div className="bg-white rounded-2xl p-6 flex flex-col gap-5 h-fit sticky top-6" style={{ border: "1px solid #e2e8f0" }}>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: "#64748b" }}>Destination region</label>
              <select value={region} onChange={e => setRegion(e.target.value as RegionKey)} className="w-full px-3 py-2.5 rounded-xl text-sm" style={{ border: "1px solid #e2e8f0", background: "#fff", color: "#0f172a" }}>
                {DESTINATIONS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
              </select>
              <p className="text-[11px] mt-1" style={{ color: "#94a3b8" }}>
                e.g. {DESTINATIONS.find(d => d.key === region)?.examples.join(", ")}
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: "#64748b" }}>Departure date</label>
              <input type="date" value={tripDate} min={today} onChange={e => setTripDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm" style={{ border: "1px solid #e2e8f0", background: "#fff", color: "#0f172a" }} />
              <p className="text-[11px] mt-1" style={{ color: "#94a3b8" }}>~{monthsOut} month{monthsOut === 1 ? "" : "s"} out</p>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: "#64748b" }}>Cabin</label>
              <div className="grid grid-cols-3 gap-2">
                {(["economy", "premium", "business"] as CabinClass[]).map(c => (
                  <button
                    key={c}
                    onClick={() => setCabin(c)}
                    className="text-xs font-semibold px-2 py-2 rounded-lg capitalize transition-colors"
                    style={cabin === c
                      ? { background: "#2563eb", color: "#fff", border: "1px solid #2563eb" }
                      : { background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: "#64748b" }}>Travelers</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setTravelers(t => Math.max(1, t - 1))} className="w-9 h-9 rounded-lg font-bold" style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }}>−</button>
                <span className="font-bold text-lg px-3" style={{ color: "#0f172a" }}>{travelers}</span>
                <button onClick={() => setTravelers(t => Math.min(8, t + 1))} className="w-9 h-9 rounded-lg font-bold" style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }}>+</button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "#475569" }}>
              <input type="checkbox" checked={includeHotel} onChange={e => setIncludeHotel(e.target.checked)} />
              Include rough hotel points
            </label>

            {signedIn && owned.size > 0 && (
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "#475569" }}>
                <input type="checkbox" checked={excludeOwned} onChange={e => setExcludeOwned(e.target.checked)} />
                Don&rsquo;t suggest cards I already have
              </label>
            )}

            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "#475569" }}>
              <input type="checkbox" checked={onlyNoFee} onChange={e => setOnlyNoFee(e.target.checked)} />
              Only no-annual-fee cards
            </label>

            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "#475569" }}>
              <input type="checkbox" checked={excludeBusiness} onChange={e => setExcludeBusiness(e.target.checked)} />
              No business cards
            </label>

            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "#475569" }}>
              <input type="checkbox" checked={diversify} onChange={e => setDiversify(e.target.checked)} />
              Spread across issuers
            </label>

            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: "#64748b" }}>
                Max cards per bank
              </label>
              <div className="flex items-center gap-2">
                <button onClick={() => setMaxPerIssuer(n => Math.max(1, n - 1))} className="w-9 h-9 rounded-lg font-bold" style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }}>−</button>
                <span className="font-bold text-lg px-3" style={{ color: "#0f172a" }}>{maxPerIssuer}</span>
                <button onClick={() => setMaxPerIssuer(n => Math.min(5, n + 1))} className="w-9 h-9 rounded-lg font-bold" style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }}>+</button>
                <span className="text-[11px] ml-1" style={{ color: "#94a3b8" }}>(Amex stays capped at 2 per 90 days regardless)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold" style={{ color: "#64748b" }}>
                  Limit to banks ({allowedIssuers.size === 0 ? "all" : allowedIssuers.size})
                </label>
                {allowedIssuers.size > 0 && (
                  <button
                    onClick={() => setAllowedIssuers(new Set())}
                    className="text-[11px] font-semibold"
                    style={{ color: "#2563eb" }}
                  >
                    clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allIssuers.map(iss => {
                  const on = allowedIssuers.has(iss);
                  return (
                    <button
                      key={iss}
                      onClick={() => toggleIssuer(iss)}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors"
                      style={on
                        ? { background: "#2563eb", color: "#fff", border: "1px solid #2563eb" }
                        : { background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" }}
                    >
                      {iss}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] mt-1.5" style={{ color: "#94a3b8" }}>
                Leave empty to consider every bank. Pick one or more to restrict suggestions.
              </p>
            </div>
          </div>

          {/* ── Output ── */}
          <div className="flex flex-col gap-5">
            {/* Points target */}
            <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #e2e8f0" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#94a3b8" }}>Points you&rsquo;ll need</p>
              <p className="text-4xl font-black" style={{ color: "#0f172a" }}>
                {strategy.totalNeeded.toLocaleString()} <span className="text-base font-semibold" style={{ color: "#64748b" }}>pts total</span>
              </p>
              <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                <div className="rounded-xl p-3" style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                  <p className="text-xs font-medium" style={{ color: "#94a3b8" }}>Flights ({travelers}× {cabin})</p>
                  <p className="font-bold" style={{ color: "#0f172a" }}>{strategy.flightsTotal.toLocaleString()} pts</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>{strategy.perPaxPoints.toLocaleString()} / traveler</p>
                </div>
                {includeHotel && (
                  <div className="rounded-xl p-3" style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                    <p className="text-xs font-medium" style={{ color: "#94a3b8" }}>Hotel estimate</p>
                    <p className="font-bold" style={{ color: "#0f172a" }}>{strategy.hotelTotal.toLocaleString()} pts</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>~5-7 nights saver rate</p>
                  </div>
                )}
              </div>
            </div>

            {/* Preferred programs */}
            <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #e2e8f0" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>Best programs for this route</p>
              <ul className="flex flex-col gap-2">
                {strategy.preferredPrograms.map(p => (
                  <li key={p.program} className="flex items-start gap-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                      background: p.rank === 1 ? "#dbeafe" : p.rank === 2 ? "#f1f5f9" : "#fee2e2",
                      color:      p.rank === 1 ? "#1d4ed8" : p.rank === 2 ? "#475569" : "#b91c1c",
                    }}>
                      {p.rank === 1 ? "BEST" : p.rank === 2 ? "ALSO" : "LAST"}
                    </span>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "#0f172a" }}>{p.program}</p>
                      <p className="text-xs" style={{ color: "#64748b" }}>{p.note}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Card plan */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
              <div className="px-6 py-4 flex items-center justify-between" style={{ background: "#0f172a", borderBottom: "1px solid #1e293b" }}>
                <p className="text-sm font-bold text-white">Your card application plan</p>
                <p className="text-xs" style={{ color: "#94a3b8" }}>{monthsOut} month{monthsOut === 1 ? "" : "s"} until departure</p>
              </div>

              {strategy.selected.length === 0 ? (
                <p className="px-6 py-10 text-sm text-center" style={{ color: "#94a3b8" }}>
                  No matching cards in our database for this destination / filters.
                </p>
              ) : (
                <div className="divide-y" style={{ borderColor: "#f1f5f9" }}>
                  {strategy.selected.map((s, i) => {
                    const applyMonth = Math.max(0, monthsOut - i * 3);
                    const msrDue     = Math.max(0, applyMonth - 3);
                    return (
                      <div key={s.card.id} className="px-6 py-4 flex items-start gap-4">
                        <div className="w-16 aspect-[1.586/1] relative rounded-lg overflow-hidden shrink-0" style={{ background: "#f8fafc" }}>
                          <Image src={s.card.image} alt={s.card.name} fill className="object-contain p-1" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link href={`/cards/${s.card.id}`} className="font-semibold text-sm hover:underline" style={{ color: "#0f172a" }}>
                              {s.card.name}
                            </Link>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#dbeafe", color: "#1d4ed8" }}>
                              {s.matchedProgram}
                            </span>
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                            {s.card.issuer} · {s.card.annualFee} · MSR {s.card.msr}
                          </p>
                          <p className="text-xs mt-1" style={{ color: "#475569" }}>
                            <span className="font-semibold" style={{ color: "#15803d" }}>+{s.bonus.toLocaleString()} pts</span>
                            {" · "}Apply in ~{applyMonth === 0 ? "this month" : `${applyMonth} month${applyMonth === 1 ? "" : "s"}`} · MSR by {msrDue === 0 ? "trip" : `T-${msrDue} mo`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="px-6 py-4 flex items-center justify-between text-sm" style={{ background: "#f8fafc", borderTop: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b" }}>
                  Covered: <span className="font-bold" style={{ color: "#15803d" }}>{strategy.running.toLocaleString()}</span> / {strategy.totalNeeded.toLocaleString()}
                </span>
                {strategy.shortfall > 0 ? (
                  <span className="text-xs font-semibold" style={{ color: "#b91c1c" }}>
                    Short by {strategy.shortfall.toLocaleString()} pts — consider organic spend or adding a 2P player
                  </span>
                ) : (
                  <span className="text-xs font-semibold" style={{ color: "#15803d" }}>✓ Plan covers target</span>
                )}
              </div>
            </div>

            {!strategy.appliedTimelineOk && strategy.selected.length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                <p className="text-sm font-bold" style={{ color: "#92400e" }}>⚠ Timeline is tight</p>
                <p className="text-xs mt-1" style={{ color: "#78350f" }}>
                  With {strategy.selected.length} cards to apply for (~3 months each to meet MSR), you&rsquo;re cutting it close for a {monthsOut}-month timeline. Consider pushing the trip back, dropping to fewer cards, or adding a player 2 to parallelize applications.
                </p>
              </div>
            )}

            <p className="text-[11px]" style={{ color: "#94a3b8" }}>
              Estimates are starting points for strategy — not live award inventory. Actual availability and point cost depend on partner saver space. Amex caps you at 2 personal applications per 90 days; plan spacing accordingly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
