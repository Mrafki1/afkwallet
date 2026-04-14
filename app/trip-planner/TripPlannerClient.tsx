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

const BALANCE_PROGRAMS = [
  "Aeroplan",
  "Membership Rewards",
  "RBC Avion",
  "Marriott Bonvoy",
  "WestJet Rewards",
  "TD Rewards",
] as const;

export default function TripPlannerClient({ cards }: { cards: Card[] }) {
  const { owned, signedIn } = useOwnedCards();

  // ── Essentials ──
  const [region, setRegion]       = useState<RegionKey>("europe");
  const [cabin, setCabin]         = useState<CabinClass>("economy");
  const [travelers, setTravelers] = useState(2);
  const today       = new Date().toISOString().slice(0, 10);
  const defaultTrip = new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString().slice(0, 10);
  const [tripDate, setTripDate]   = useState(defaultTrip);

  // ── Advanced filters (hidden by default) ──
  const [includeHotel, setIncludeHotel]       = useState(true);
  const [excludeOwned, setExcludeOwned]       = useState(true);
  const [onlyNoFee, setOnlyNoFee]             = useState(false);
  const [excludeBusiness, setExcludeBusiness] = useState(true);
  const [allowedIssuers, setAllowedIssuers]   = useState<Set<string>>(new Set());
  const [diversify, setDiversify]             = useState(true);
  const [maxPerIssuer, setMaxPerIssuer]       = useState(2);
  const [balances, setBalances]               = useState<Record<string, number>>({});

  // ── UI: which tune panel is expanded (null = collapsed) ──
  const [openPanel, setOpenPanel] = useState<"filters" | "balances" | null>(null);

  // Issuers worth showing in the trip planner, ranked by how useful they are
  // for points-based travel. Cash-back-only or non-travel issuers (PC Financial,
  // Canadian Tire, Rogers, Tangerine, EQ, HSBC CA wind-down, etc.) are excluded
  // because none of their cards feed Aeroplan / MR / Avion / Bonvoy.
  const TRAVEL_ISSUER_ORDER = [
    "American Express",
    "TD",
    "RBC",
    "CIBC",
    "Scotiabank",
    "BMO",
    "National Bank",
    "MBNA",
    "MBNA / TD",
  ];
  const allIssuers = useMemo(() => {
    const present = new Set(cards.map(c => c.issuer));
    return TRAVEL_ISSUER_ORDER.filter(i => present.has(i));
  }, [cards]);
  function toggleIssuer(name: string) {
    setAllowedIssuers(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }
  function setBalance(prog: string, val: number) {
    setBalances(prev => ({ ...prev, [prog]: val }));
  }

  const monthsOut = Math.max(0, monthsBetween(today, tripDate));

  // ── Strategy ──
  const strategy = useMemo(() => {
    const perPaxPoints = POINTS_COST[region][cabin];
    const flightsTotal = perPaxPoints * travelers;
    const hotelTotal   = includeHotel ? HOTEL_POINTS_ROUGH[region] : 0;
    const grossNeeded  = flightsTotal + hotelTotal;

    const fit = PROGRAM_FIT[region];
    const preferredPrograms = new Set(fit.filter(p => p.rank <= 2).map(p => p.program));
    if (includeHotel) preferredPrograms.add("Marriott Bonvoy");

    const existingCredit = [...preferredPrograms].reduce(
      (sum, p) => sum + (balances[p] ?? 0), 0
    );
    const creditApplied = Math.min(existingCredit, grossNeeded);
    const totalNeeded   = Math.max(0, grossNeeded - creditApplied);

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

    const remaining = [...candidates];
    const selected: { card: Card; matchedProgram: string; bonus: number }[] = [];
    const issuerCount = new Map<string, number>();
    let running = 0;
    let amexCount = 0;

    while (selected.length < 5 && remaining.length > 0) {
      if (running >= totalNeeded && selected.length >= 2) break;
      let bestIdx = -1, bestScore = -Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const c = remaining[i];
        const isAmex = c.card.issuer?.toLowerCase().includes("american express");
        if (isAmex && amexCount >= 2) continue;
        const used = issuerCount.get(c.card.issuer) ?? 0;
        if (used >= maxPerIssuer) continue;
        let score = diversify ? c.bonus * Math.pow(0.65, used) : c.bonus;
        if ((balances[c.matchedProgram] ?? 0) > 0) score *= 1.2;
        if (score > bestScore) { bestScore = score; bestIdx = i; }
      }
      if (bestIdx < 0) break;
      const pick = remaining.splice(bestIdx, 1)[0];
      selected.push(pick);
      running += pick.bonus;
      issuerCount.set(pick.card.issuer, (issuerCount.get(pick.card.issuer) ?? 0) + 1);
      if (pick.card.issuer?.toLowerCase().includes("american express")) amexCount++;
    }

    const totalMsrWeeks = selected.length * 13;
    const appliedTimelineOk = totalMsrWeeks / 4 <= monthsOut + 1;

    return {
      perPaxPoints, flightsTotal, hotelTotal, grossNeeded, creditApplied, totalNeeded,
      selected, running,
      shortfall: Math.max(0, totalNeeded - running),
      appliedTimelineOk,
      preferredPrograms: fit,
    };
  }, [region, cabin, travelers, includeHotel, excludeOwned, onlyNoFee, excludeBusiness, allowedIssuers, diversify, maxPerIssuer, balances, cards, owned, monthsOut]);

  const coverage = strategy.totalNeeded > 0
    ? Math.min(100, Math.round((strategy.running / strategy.totalNeeded) * 100))
    : 100;

  // ── Small inline styles ──
  const card        = "bg-white rounded-2xl";
  const cardBorder  = { border: "1px solid #e2e8f0" } as const;
  const fieldLabel  = "text-xs font-semibold block mb-1.5";
  const fieldColor  = { color: "#64748b" } as const;
  const inputStyle  = { border: "1px solid #e2e8f0", background: "#fff", color: "#0f172a" } as const;

  const activeFiltersCount =
    (includeHotel ? 0 : 1) +
    (excludeOwned ? 0 : 1) +
    (onlyNoFee ? 1 : 0) +
    (excludeBusiness ? 0 : 1) +
    (diversify ? 0 : 1) +
    (maxPerIssuer !== 2 ? 1 : 0) +
    (allowedIssuers.size > 0 ? 1 : 0);

  const balancesCount = Object.values(balances).filter(v => v > 0).length;

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-10 flex flex-col gap-6">

        {/* ── Header ── */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#2563eb" }}>Trip Planner</p>
          <h1 className="text-3xl font-black" style={{ color: "#0f172a" }}>Where do you want to go?</h1>
          <p className="text-sm mt-2 max-w-2xl" style={{ color: "#64748b" }}>
            Pick a destination and a date. We&rsquo;ll tell you how many points you need and which cards to apply for.
          </p>
        </div>

        {/* ── Essentials: where, when, how ── */}
        <div className={card} style={{ ...cardBorder, padding: "24px" }}>
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className={fieldLabel} style={fieldColor}>Where to?</label>
              <select value={region} onChange={e => setRegion(e.target.value as RegionKey)} className="w-full px-3 py-2.5 rounded-xl text-sm" style={inputStyle}>
                {DESTINATIONS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
              </select>
              <p className="text-[11px] mt-1" style={{ color: "#94a3b8" }}>
                e.g. {DESTINATIONS.find(d => d.key === region)?.examples.join(", ")}
              </p>
            </div>

            <div>
              <label className={fieldLabel} style={fieldColor}>When?</label>
              <input type="date" value={tripDate} min={today} onChange={e => setTripDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm" style={inputStyle} />
              <p className="text-[11px] mt-1" style={{ color: "#94a3b8" }}>~{monthsOut} month{monthsOut === 1 ? "" : "s"} from today</p>
            </div>

            <div>
              <label className={fieldLabel} style={fieldColor}>Cabin class</label>
              <div className="grid grid-cols-3 gap-2">
                {(["economy", "premium", "business"] as CabinClass[]).map(c => (
                  <button
                    key={c}
                    onClick={() => setCabin(c)}
                    className="text-xs font-semibold px-2 py-2.5 rounded-lg capitalize transition-colors"
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
              <label className={fieldLabel} style={fieldColor}>Travelers</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setTravelers(t => Math.max(1, t - 1))} className="w-10 h-10 rounded-lg font-bold" style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }}>−</button>
                <span className="font-bold text-lg px-3 min-w-[32px] text-center" style={{ color: "#0f172a" }}>{travelers}</span>
                <button onClick={() => setTravelers(t => Math.min(8, t + 1))} className="w-10 h-10 rounded-lg font-bold" style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }}>+</button>
                <label className="flex items-center gap-2 text-xs cursor-pointer ml-3" style={{ color: "#64748b" }}>
                  <input type="checkbox" checked={includeHotel} onChange={e => setIncludeHotel(e.target.checked)} />
                  Plus hotel points
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ── Compact tune bar: filters + balances ── */}
        <div className={card} style={cardBorder}>
          <div className="grid grid-cols-2">
            <button
              onClick={() => setOpenPanel(p => p === "filters" ? null : "filters")}
              className="px-5 py-3.5 flex items-center justify-between text-sm font-semibold transition-colors"
              style={{
                color: "#0f172a",
                background: openPanel === "filters" ? "#f8fafc" : "transparent",
                borderRight: "1px solid #f1f5f9",
              }}
            >
              <span className="flex items-center gap-2">
                Filters
                {activeFiltersCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#dbeafe", color: "#1d4ed8" }}>
                    {activeFiltersCount}
                  </span>
                )}
              </span>
              <span style={{ color: "#94a3b8" }}>{openPanel === "filters" ? "▴" : "▾"}</span>
            </button>
            <button
              onClick={() => setOpenPanel(p => p === "balances" ? null : "balances")}
              className="px-5 py-3.5 flex items-center justify-between text-sm font-semibold transition-colors"
              style={{
                color: "#0f172a",
                background: openPanel === "balances" ? "#f8fafc" : "transparent",
              }}
            >
              <span className="flex items-center gap-2">
                My points
                {balancesCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#dcfce7", color: "#166534" }}>
                    {balancesCount}
                  </span>
                )}
              </span>
              <span style={{ color: "#94a3b8" }}>{openPanel === "balances" ? "▴" : "▾"}</span>
            </button>
          </div>

          {openPanel === "filters" && (
            <div className="px-6 pb-6 flex flex-col gap-5" style={{ borderTop: "1px solid #f1f5f9", paddingTop: "20px" }}>
              <div className="grid sm:grid-cols-2 gap-4">
                {signedIn && owned.size > 0 && (
                  <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "#475569" }}>
                    <input type="checkbox" checked={excludeOwned} onChange={e => setExcludeOwned(e.target.checked)} />
                    Skip cards I already own
                  </label>
                )}
                <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "#475569" }}>
                  <input type="checkbox" checked={onlyNoFee} onChange={e => setOnlyNoFee(e.target.checked)} />
                  Only no-annual-fee cards
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "#475569" }}>
                  <input type="checkbox" checked={!excludeBusiness} onChange={e => setExcludeBusiness(!e.target.checked)} />
                  Include business cards
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "#475569" }}>
                  <input type="checkbox" checked={diversify} onChange={e => setDiversify(e.target.checked)} />
                  Spread across issuers
                </label>
              </div>
              <div>
                <label className={fieldLabel} style={fieldColor}>Max cards per bank</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setMaxPerIssuer(n => Math.max(1, n - 1))} className="w-9 h-9 rounded-lg font-bold" style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }}>−</button>
                  <span className="font-bold text-lg px-3 min-w-[32px] text-center" style={{ color: "#0f172a" }}>{maxPerIssuer}</span>
                  <button onClick={() => setMaxPerIssuer(n => Math.min(5, n + 1))} className="w-9 h-9 rounded-lg font-bold" style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }}>+</button>
                  <span className="text-[11px] ml-2" style={{ color: "#94a3b8" }}>Amex stays at 2 per 90 days</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={fieldLabel + " mb-0"} style={fieldColor}>Only show cards from (optional)</label>
                  {allowedIssuers.size > 0 && (
                    <button onClick={() => setAllowedIssuers(new Set())} className="text-[11px] font-semibold" style={{ color: "#2563eb" }}>clear</button>
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
              </div>
            </div>
          )}

          {openPanel === "balances" && (
            <div className="px-6 pb-6" style={{ borderTop: "1px solid #f1f5f9", paddingTop: "20px" }}>
              <p className="text-xs mb-4" style={{ color: "#64748b" }}>
                Enter current balances. Points in programs useful for this destination count toward the target, and their cards get boosted in the plan.
              </p>
              <div className="grid sm:grid-cols-2 gap-2">
                {BALANCE_PROGRAMS.map(prog => (
                  <div key={prog} className="flex items-center gap-2">
                    <span className="text-sm flex-1" style={{ color: "#475569" }}>{prog}</span>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={balances[prog] ?? ""}
                      onChange={e => setBalance(prog, parseInt(e.target.value, 10) || 0)}
                      placeholder="0"
                      className="w-28 px-2 py-1.5 rounded-md text-sm text-right"
                      style={{ border: "1px solid #e2e8f0", background: "#fff", color: "#0f172a" }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Results: big headline number + card plan ── */}
        <div className={card} style={{ ...cardBorder, padding: "24px" }}>
          <div className="flex items-baseline gap-3 flex-wrap">
            <p className="text-5xl font-black tracking-tight" style={{ color: "#0f172a" }}>
              {strategy.totalNeeded.toLocaleString()}
            </p>
            <p className="text-sm font-semibold" style={{ color: "#64748b" }}>
              points to earn for this trip
            </p>
          </div>
          {strategy.creditApplied > 0 && (
            <p className="text-xs mt-1" style={{ color: "#15803d" }}>
              Credited {strategy.creditApplied.toLocaleString()} from your existing balances (gross: {strategy.grossNeeded.toLocaleString()})
            </p>
          )}
          <div className="flex flex-wrap gap-4 mt-4 text-xs" style={{ color: "#64748b" }}>
            <span>
              Flights: <span className="font-bold" style={{ color: "#0f172a" }}>{strategy.flightsTotal.toLocaleString()}</span>
              <span className="ml-1" style={{ color: "#94a3b8" }}>({travelers}× {cabin})</span>
            </span>
            {includeHotel && (
              <span>Hotel est.: <span className="font-bold" style={{ color: "#0f172a" }}>{strategy.hotelTotal.toLocaleString()}</span></span>
            )}
          </div>
        </div>

        {/* ── Card plan (main output) ── */}
        <div className={card + " overflow-hidden"} style={cardBorder}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ background: "#0f172a" }}>
            <p className="text-sm font-bold text-white">Your application plan</p>
            <p className="text-xs" style={{ color: "#94a3b8" }}>{monthsOut} month{monthsOut === 1 ? "" : "s"} until departure</p>
          </div>

          {strategy.selected.length === 0 ? (
            <p className="px-6 py-10 text-sm text-center" style={{ color: "#94a3b8" }}>
              No matching cards for these filters. Try widening your criteria below.
            </p>
          ) : (
            <ol className="divide-y" style={{ borderColor: "#f1f5f9" }}>
              {strategy.selected.map((s, i) => {
                const applyMonth = Math.max(0, monthsOut - i * 3);
                const msrDue     = Math.max(0, applyMonth - 3);
                return (
                  <li key={s.card.id} className="px-6 py-4 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm" style={{ background: "#dbeafe", color: "#1d4ed8" }}>
                      {i + 1}
                    </div>
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
                        {" · Apply "}{applyMonth === 0 ? "now" : `in ~${applyMonth} mo`}
                        {" · Hit MSR by "}{msrDue === 0 ? "trip date" : `T-${msrDue} mo`}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          {/* Coverage bar */}
          <div className="px-6 py-4" style={{ background: "#f8fafc", borderTop: "1px solid #f1f5f9" }}>
            <div className="flex items-center justify-between text-xs mb-2" style={{ color: "#64748b" }}>
              <span>
                Covered <span className="font-bold" style={{ color: "#0f172a" }}>{strategy.running.toLocaleString()}</span> of {strategy.totalNeeded.toLocaleString()}
              </span>
              <span className="font-semibold" style={{ color: strategy.shortfall > 0 ? "#b91c1c" : "#15803d" }}>
                {strategy.shortfall > 0 ? `Short ${strategy.shortfall.toLocaleString()}` : "✓ Target met"}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "#e2e8f0" }}>
              <div
                style={{
                  width: `${coverage}%`,
                  height: "100%",
                  background: strategy.shortfall > 0 ? "#f59e0b" : "#16a34a",
                  transition: "width 300ms",
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Warning if tight ── */}
        {!strategy.appliedTimelineOk && strategy.selected.length > 0 && (
          <div className="rounded-2xl p-4 text-sm" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
            <p className="font-bold mb-0.5" style={{ color: "#92400e" }}>Heads up: timeline is tight</p>
            <p className="text-xs" style={{ color: "#78350f" }}>
              {strategy.selected.length} cards with ~3-month MSRs is a stretch in {monthsOut} months. Consider pushing the trip back, dropping to fewer cards, or adding a P2.
            </p>
          </div>
        )}

        {/* ── Program fit (condensed one-liner) ── */}
        <div className={card} style={{ ...cardBorder, padding: "16px 24px" }}>
          <p className="text-xs" style={{ color: "#64748b" }}>
            <span className="font-semibold" style={{ color: "#0f172a" }}>Why these cards: </span>
            For {DESTINATIONS.find(d => d.key === region)?.label.toLowerCase()}, the best programs are{" "}
            {strategy.preferredPrograms.filter(p => p.rank === 1).map(p => (
              <span key={p.program} className="font-semibold" style={{ color: "#1d4ed8" }}>{p.program}</span>
            )).reduce<React.ReactNode[]>((acc, el, i, arr) => {
              acc.push(el);
              if (i < arr.length - 1) acc.push(<span key={`sep-${i}`}>, </span>);
              return acc;
            }, [])}
            {strategy.preferredPrograms.filter(p => p.rank === 2).length > 0 && (
              <>
                {". Also works: "}
                {strategy.preferredPrograms.filter(p => p.rank === 2).map(p => p.program).join(", ")}
              </>
            )}
            .
          </p>
        </div>


        <p className="text-[11px] text-center" style={{ color: "#94a3b8" }}>
          Point costs are starting-point estimates based on saver inventory, not live quotes. Actual availability varies by route and season. Amex Canada limits personal approvals to 2 per 90 days.
        </p>
      </div>
    </div>
  );
}
