"use client";

import { useState, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { cards, type Card } from "../data/cards";
import Navbar from "../components/Navbar";

// ─── Tooltip ──────────────────────────────────────────────────────────────────
function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  function show() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      const x = Math.max(160, Math.min(r.left + r.width / 2, window.innerWidth - 160));
      setPos({ x, y: r.bottom });
    }
  }

  function hide() {
    hideTimer.current = setTimeout(() => setPos(null), 120);
  }

  return (
    <span ref={triggerRef} className="inline-flex items-center gap-1 cursor-help" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {pos && (
        <span
          style={{ position: "fixed", left: pos.x, top: pos.y + 8, transform: "translateX(-50%)", zIndex: 9999 }}
          className="w-72 rounded-xl bg-gray-900 text-white text-xs px-3 py-2.5 leading-relaxed shadow-xl normal-case tracking-normal font-normal text-center pointer-events-none whitespace-normal"
        >
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900" />
          {text}
        </span>
      )}
    </span>
  );
}

// ─── Tooltips ─────────────────────────────────────────────────────────────────
const TOOLTIPS = {
  firstYearValue: "Total estimated value in year one — welcome bonus + portal cash back minus the annual fee. Lets you compare cards on a level playing field.",
  welcomeBonus: "Points or cash back you earn after hitting the minimum spend. This is the main reason to apply for a new card. Higher is better.",
  annualFee: "Yearly fee charged by the card issuer. 'FYF' = First Year Free — the fee is waived for your first 12 months.",
  msr: "Minimum Spend Requirement — the total you need to charge to the card (usually within 3 months) to unlock the full welcome bonus.",
  roi: "First-year value divided by the minimum spend requirement. Shows how much value you get back per dollar of required spending. 20%+ is excellent — it means you earn $0.20 in value for every $1 you must spend to unlock the bonus.",
  bestPortal: "Rebate portals pay you extra cash back just for applying through their link. Stack this on top of your welcome bonus for free money.",
  topEarnRate: "The best points multiplier this card earns on everyday spending. e.g. '5x on dining' means 5 points per dollar at restaurants.",
  pointsProgram: "The rewards currency this card earns. Aeroplan and Amex MR are the most flexible — they can be transferred to multiple airlines.",
  pointsValue: "Estimated value per point in cents, based on common redemptions. 1.5¢+ is considered good; premium programs can reach 2–3¢.",
  foreignFee: "Fee charged on purchases in a foreign currency (e.g. USD). Most Canadian cards charge 2.5%. Cards that waive this save you money on travel and online shopping.",
  incomeReq: "Minimum personal or household income required to qualify for this card.",
  loungeAccess: "Airport lounge access included with the card. Priority Pass and Visa Airport Companion cover hundreds of lounges worldwide.",
  network: "Payment network (Visa, Mastercard, Amex). Amex is less widely accepted than Visa/MC but often has better earn rates and perks.",
  travelMedical: "Emergency medical insurance for you and your family while travelling. Coverage amount and trip length limits vary by card.",
};

// ─── Personas ─────────────────────────────────────────────────────────────────
type Persona = {
  id: string;
  label: string;
  tagline: string;
  icon: React.ReactNode;
  filters: { pills?: string[]; fee?: string; program?: string; excludeTags?: string[] };
};

const PERSONAS: Persona[] = [
  {
    id: "elevated",
    label: "⚡ Elevated Offers",
    tagline: "Cards running higher-than-normal welcome bonuses right now",
    icon: <></>,
    filters: { pills: ["elevated"] },
  },
  {
    id: "beginner",
    label: "Just Getting Started",
    tagline: "No annual fee, easy to get, simple rewards",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
    filters: { pills: ["no-fee"], fee: "free", excludeTags: ["Business"] },
  },
  {
    id: "cashback",
    label: "Cash Back",
    tagline: "Real dollars back, no points games",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    filters: { pills: ["cash-back"], program: "Cash Back", excludeTags: ["Business"] },
  },
  {
    id: "travel",
    label: "Travel & Points",
    tagline: "Transferable points, Aeroplan, lounge access, free bags",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    filters: { pills: ["transfer", "aeroplan", "lounge"], excludeTags: ["Business"] },
  },
  {
    id: "highspend",
    label: "High Spender",
    tagline: "Premium cards where the annual fee pays for itself",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    filters: { fee: "400plus", excludeTags: ["Business"] },
  },
  {
    id: "business",
    label: "Business Owner",
    tagline: "Separate expenses and earn big on every purchase",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    filters: { pills: ["business"] },
  },
];

// ─── CardArt ──────────────────────────────────────────────────────────────────
function CardArt({ name, image, gradient }: { name: string; image: string; gradient: string }) {
  return (
    <div className="relative w-full aspect-[1.6/1] rounded-xl overflow-hidden" style={{ background: "#f8fafc" }}>
      <Image
        src={image}
        alt={name}
        fill
        className="object-contain p-2"
        onError={(e) => {
          const parent = (e.target as HTMLImageElement).parentElement;
          if (parent) {
            parent.className = `relative w-full aspect-[1.6/1] rounded-xl overflow-hidden bg-gradient-to-br ${gradient}`;
            (e.target as HTMLImageElement).style.display = "none";
          }
        }}
      />
    </div>
  );
}

// ─── CardTile ─────────────────────────────────────────────────────────────────
function CardTile({ card, compareSet, onToggle }: { card: Card; compareSet: Set<string>; onToggle: (id: string) => void }) {
  const inCompare = compareSet.has(card.id);
  const maxed = compareSet.size >= 3 && !inCompare;

  return (
    <div
      className="rounded-2xl transition-all duration-200 ease-out hover:-translate-y-1 flex flex-col overflow-hidden"
      style={{
        background: "#ffffff",
        border: inCompare ? "2px solid #2563eb" : "1px solid #e2e8f0",
        boxShadow: inCompare
          ? "0 0 0 3px rgba(37,99,235,0.1), 0 1px 3px rgba(0,0,0,0.06)"
          : "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <div className="p-5 flex flex-col gap-4 flex-1">
        {card.elevated && (
          <div
            className="px-3 py-2 rounded-lg"
            style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
          >
            <p className="text-xs font-bold leading-tight" style={{ color: "#b45309" }}>⚡ Elevated Offer</p>
            {card.elevatedNote && (
              <p className="text-xs mt-0.5 leading-snug" style={{ color: "#92400e" }}>{card.elevatedNote}</p>
            )}
          </div>
        )}
        <div className="relative">
          <Link href={`/cards/${card.id}`}>
            <CardArt name={card.name} image={card.image} gradient={card.gradient} />
          </Link>
          <button
            onClick={() => onToggle(card.id)}
            disabled={maxed}
            title={inCompare ? "Remove from compare" : maxed ? "Max 3 cards" : "Add to compare"}
            className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors shadow-sm"
            style={{
              background: inCompare ? "#2563eb" : maxed ? "#f1f5f9" : "#ffffff",
              border: inCompare ? "2px solid #2563eb" : maxed ? "2px solid #e2e8f0" : "2px solid #e2e8f0",
              color: inCompare ? "#ffffff" : maxed ? "#94a3b8" : "#64748b",
              cursor: maxed ? "not-allowed" : "pointer",
            }}
          >
            {inCompare ? "✓" : "+"}
          </button>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "#94a3b8" }}>{card.issuer}</p>
          <Link href={`/cards/${card.id}`} className="hover:underline transition-colors">
            <h3 className="font-bold text-base leading-tight mt-0.5" style={{ color: "#0f172a" }}>{card.name}</h3>
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl p-2" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <p className="text-xs mb-0.5 leading-tight flex justify-center" style={{ color: "#94a3b8" }}>
              <Tooltip text={TOOLTIPS.firstYearValue}>1st Year Value <span className="ml-0.5 text-[10px]">ⓘ</span></Tooltip>
            </p>
            <p className="font-bold text-sm" style={{ color: "#2563eb" }}>{card.firstYearValue}</p>
          </div>
          <div className="rounded-xl p-2" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <p className="text-xs mb-0.5 leading-tight flex justify-center" style={{ color: "#94a3b8" }}>
              <Tooltip text={TOOLTIPS.welcomeBonus}>Welcome Bonus <span className="ml-0.5 text-[10px]">ⓘ</span></Tooltip>
            </p>
            <p className="font-bold text-xs leading-tight" style={{ color: "#0f172a" }}>{card.pointsBonus}</p>
          </div>
          <div className="rounded-xl p-2" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <p className="text-xs mb-0.5 leading-tight flex justify-center" style={{ color: "#94a3b8" }}>
              <Tooltip text={TOOLTIPS.annualFee}>Annual Fee <span className="ml-0.5 text-[10px]">ⓘ</span></Tooltip>
            </p>
            <p className="font-bold text-sm" style={{ color: "#0f172a" }}>{card.annualFee}</p>
          </div>
        </div>
        {card.rewards.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {card.rewards.slice(0, 2).map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="font-bold text-sm w-10 shrink-0" style={{ color: "#2563eb" }}>{r.multiplier}</span>
                <span className="text-xs" style={{ color: "#64748b" }}>{r.category}</span>
              </div>
            ))}
          </div>
        )}
        {card.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {card.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="text-xs px-2.5 py-0.5 rounded-full"
                style={{ background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto flex flex-col gap-2">
          {card.portals.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-2">
                {card.portals.map((portal, i) => (
                  <a
                    key={portal.name}
                    href={portal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                    style={
                      i === 0
                        ? { background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }
                        : { background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0" }
                    }
                  >
                    {i === 0 && <span style={{ color: "#16a34a" }}>★</span>}
                    {portal.name} <span className="font-bold">${portal.bonus}</span>
                  </a>
                ))}
              </div>
              <a
                href={card.portals[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full text-center text-sm font-bold py-2 rounded-xl transition-colors"
              >
                Apply via {card.portals[0].name} (+${card.portals[0].bonus})
              </a>
            </>
          ) : (
            <a
              href={card.directLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full text-center text-sm font-bold py-2 rounded-xl transition-colors"
            >
              Apply Direct
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Table view ───────────────────────────────────────────────────────────────
type SortCol = "value" | "bonus" | "fee" | "msr" | "portal" | "roi";
type SortDir = "asc" | "desc";

function parseNum(str: string) {
  return parseInt(str.replace(/[$,~a-zA-Z\s]/g, "")) || 0;
}

function calcROI(card: { firstYearValue: string; msr: string }): number | null {
  // Monthly MSRs (e.g. "$750/mo") don't map cleanly to a one-time ROI
  if (card.msr.includes("/mo")) return null;
  const value = parseNum(card.firstYearValue);
  const msr = parseNum(card.msr);
  if (!msr || !value) return null;
  return Math.round((value / msr) * 100);
}

function TableView({ cards, compareSet, onToggle }: { cards: Card[]; compareSet: Set<string>; onToggle: (id: string) => void }) {
  const [sortCol, setSortCol] = useState<SortCol>("value");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("desc"); }
  }

  const sorted = useMemo(() => [...cards].sort((a, b) => {
    let diff = 0;
    if (sortCol === "value")  diff = parseNum(a.firstYearValue) - parseNum(b.firstYearValue);
    if (sortCol === "bonus")  diff = parseNum(a.pointsBonus) - parseNum(b.pointsBonus);
    if (sortCol === "fee")    diff = a.annualFeeNum - b.annualFeeNum;
    if (sortCol === "msr")    diff = parseNum(a.msr) - parseNum(b.msr);
    if (sortCol === "portal") diff = (a.portals[0]?.bonus ?? 0) - (b.portals[0]?.bonus ?? 0);
    if (sortCol === "roi")    diff = (calcROI(a) ?? -1) - (calcROI(b) ?? -1);
    return sortDir === "asc" ? diff : -diff;
  }), [cards, sortCol, sortDir]);

  function Th({ col, label, tooltip, extraClass = "" }: { col: SortCol; label: string; tooltip?: string; extraClass?: string }) {
    const active = sortCol === col;
    return (
      <th
        onClick={() => handleSort(col)}
        className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer select-none whitespace-nowrap ${extraClass}`}
        style={{ color: active ? "#2563eb" : "#64748b" }}
      >
        {tooltip ? (
          <Tooltip text={tooltip}>
            <span>{label}</span>
            <span className="text-[10px] font-normal ml-0.5" style={{ color: "#94a3b8" }}>ⓘ</span>
          </Tooltip>
        ) : label}
        <span className="ml-1 text-xs" style={{ color: active ? "#2563eb" : "#94a3b8" }}>
          {active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </th>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl" style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <table className="w-full text-sm">
        <thead style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
          <tr>
            <th className="px-3 py-3 w-10"></th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748b" }}>Card</th>
            <Th col="value"  label="1st Yr Value"  tooltip={TOOLTIPS.firstYearValue} />
            <Th col="fee"    label="Annual Fee"    tooltip={TOOLTIPS.annualFee} />
            <Th col="msr"    label="Min. Spend"    tooltip={TOOLTIPS.msr} extraClass="hidden sm:table-cell" />
            <Th col="roi"    label="Value/MSR"     tooltip={TOOLTIPS.roi} extraClass="hidden sm:table-cell" />
            <Th col="portal" label="Best Portal"   tooltip={TOOLTIPS.bestPortal} extraClass="hidden md:table-cell" />
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((card, i) => {
            const best = card.portals[0] ?? null;
            const inCompare = compareSet.has(card.id);
            const maxed = compareSet.size >= 3 && !inCompare;
            return (
              <tr
                key={card.id}
                className="transition-colors"
                style={{ background: inCompare ? "#eff6ff" : i % 2 === 0 ? "#ffffff" : "#f8fafc", borderBottom: "1px solid #f1f5f9" }}
                onMouseEnter={e => { if (!inCompare) (e.currentTarget as HTMLElement).style.background = "#f1f5f9"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = inCompare ? "#eff6ff" : i % 2 === 0 ? "#ffffff" : "#f8fafc"; }}
              >
                <td className="px-3 py-3">
                  <button
                    onClick={() => onToggle(card.id)}
                    disabled={maxed}
                    title={inCompare ? "Remove from compare" : maxed ? "Max 3 cards" : "Compare"}
                    className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-colors"
                    style={{
                      background: inCompare ? "#2563eb" : "transparent",
                      border: inCompare ? "2px solid #2563eb" : maxed ? "2px solid #e2e8f0" : "2px solid #cbd5e1",
                      color: inCompare ? "#ffffff" : maxed ? "#94a3b8" : "#64748b",
                      cursor: maxed ? "not-allowed" : "pointer",
                    }}
                  >
                    {inCompare ? "✓" : ""}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/cards/${card.id}`} className="flex items-center gap-3 group">
                    <div className="relative w-16 aspect-[1.586/1] rounded-lg overflow-hidden shrink-0" style={{ background: "#f8fafc" }}>
                      <Image src={card.image} alt={card.name} fill className="object-contain p-1" />
                      {card.elevated && (
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center py-0.5" style={{ background: "rgba(180,83,9,0.88)" }}>
                          <span className="text-[8px] font-bold text-white tracking-wide">⚡ ELEVATED</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold leading-tight text-sm transition-colors group-hover:underline" style={{ color: "#0f172a" }}>{card.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{card.issuer}</p>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="font-bold" style={{ color: "#2563eb" }}>{card.firstYearValue}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-semibold text-sm" style={{ color: card.annualFeeNum === 0 ? "#16a34a" : "#0f172a" }}>{card.annualFee}</span>
                </td>
                <td className="hidden sm:table-cell px-4 py-3">
                  <span className="text-xs" style={{ color: "#64748b" }}>{card.msr}</span>
                </td>
                <td className="hidden sm:table-cell px-4 py-3">
                  {(() => {
                    const roi = calcROI(card);
                    if (roi === null) return <span style={{ color: "#94a3b8" }}>—</span>;
                    const color = roi >= 30 ? "#16a34a" : roi >= 15 ? "#2563eb" : "#64748b";
                    return <span className="font-semibold text-sm" style={{ color }}>{roi}%</span>;
                  })()}
                </td>
                <td className="hidden md:table-cell px-4 py-3">
                  {best ? (
                    <div className="flex flex-col gap-1">
                      <a
                        href={best.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                        style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}
                      >
                        ★ {best.name} +${best.bonus}
                      </a>
                      {card.portals.slice(1).map(p => (
                        <a
                          key={p.name}
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs hover:underline"
                          style={{ color: "#64748b" }}
                        >
                          {p.name} +${p.bonus}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs" style={{ color: "#94a3b8" }}>Direct only</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {card.rewards[0] && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold" style={{ color: "#2563eb" }}>{card.rewards[0].multiplier}</span>
                      <span className="text-xs" style={{ color: "#64748b" }}>{card.rewards[0].category}</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <a
                    href={best ? best.url : card.directLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary whitespace-nowrap text-xs font-bold px-3 py-2 rounded-lg transition-colors"
                  >
                    Apply →
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Compare modal ────────────────────────────────────────────────────────────
function CompareModal({ ids, onClose }: { ids: string[]; onClose: () => void }) {
  const compared = ids.map(id => cards.find(c => c.id === id)!).filter(Boolean);

  const rows: { label: string; tooltip?: string; render: (c: Card) => React.ReactNode }[] = [
    {
      label: "Card",
      render: c => (
        <div className="flex flex-col items-center gap-2">
          <div className="w-28 aspect-[1.586/1] relative rounded-xl overflow-hidden" style={{ background: "#f8fafc" }}>
            <Image
              src={c.image}
              alt={c.name}
              fill
              className="object-contain p-1"
              onError={(e) => {
                const p = (e.target as HTMLImageElement).parentElement;
                if (p) {
                  p.className = `w-28 aspect-[1.586/1] rounded-xl bg-gradient-to-br ${c.gradient}`;
                  (e.target as HTMLImageElement).style.display = "none";
                }
              }}
            />
          </div>
          <div className="text-center">
            <p className="text-xs" style={{ color: "#64748b" }}>{c.issuer}</p>
            <p className="font-bold text-sm leading-tight" style={{ color: "#0f172a" }}>{c.name}</p>
          </div>
        </div>
      ),
    },
    { label: "1st Year Value", tooltip: TOOLTIPS.firstYearValue, render: c => <span className="font-black text-xl" style={{ color: "#2563eb" }}>{c.firstYearValue}</span> },
    { label: "Welcome Bonus",  tooltip: TOOLTIPS.welcomeBonus,  render: c => <span className="font-semibold text-sm" style={{ color: "#0f172a" }}>{c.pointsBonus}</span> },
    { label: "Annual Fee",     tooltip: TOOLTIPS.annualFee,     render: c => <span className="font-bold text-lg" style={{ color: c.annualFeeNum === 0 ? "#16a34a" : "#0f172a" }}>{c.annualFee}</span> },
    { label: "Min. Spend",     tooltip: TOOLTIPS.msr,           render: c => <span className="text-sm" style={{ color: "#64748b" }}>{c.msr}</span> },
    { label: "Points Program", tooltip: TOOLTIPS.pointsProgram, render: c => <span className="text-sm" style={{ color: "#64748b" }}>{c.program}</span> },
    { label: "Points Value",   tooltip: TOOLTIPS.pointsValue,   render: c => <span className="text-xs" style={{ color: "#64748b" }}>{c.pointsValue ?? "—"}</span> },
    {
      label: "Best Portal",
      tooltip: TOOLTIPS.bestPortal,
      render: c => c.portals[0] ? (
        <a
          href={c.portals[0].url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
          style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}
        >
          ★ {c.portals[0].name} +${c.portals[0].bonus}
        </a>
      ) : (
        <span className="text-xs" style={{ color: "#94a3b8" }}>Direct only</span>
      ),
    },
    { label: "Network",        tooltip: TOOLTIPS.network,       render: c => <span className="text-sm" style={{ color: "#64748b" }}>{c.network ?? "—"}</span> },
    { label: "Foreign Fee",    tooltip: TOOLTIPS.foreignFee,    render: c => <span className="text-xs font-medium" style={{ color: c.foreignFee?.startsWith("0%") ? "#16a34a" : "#64748b" }}>{c.foreignFee ?? "—"}</span> },
    { label: "Income Req.",    tooltip: TOOLTIPS.incomeReq,     render: c => <span className="text-xs" style={{ color: "#64748b" }}>{c.incomeReq ?? "—"}</span> },
    { label: "Lounge Access",  tooltip: TOOLTIPS.loungeAccess,  render: c => <span className="text-xs" style={{ color: "#64748b" }}>{c.loungeDetails ?? "—"}</span> },
    {
      label: "Top Earn Rate",
      tooltip: TOOLTIPS.topEarnRate,
      render: c => c.rewards[0] ? (
        <span className="text-sm font-bold" style={{ color: "#0f172a" }}>
          {c.rewards[0].multiplier}{" "}
          <span className="font-normal text-xs" style={{ color: "#64748b" }}>{c.rewards[0].category}</span>
        </span>
      ) : (
        <span style={{ color: "#94a3b8" }}>—</span>
      ),
    },
    {
      label: "Travel Medical",
      render: c => {
        const m = c.insurance?.find(i => i.startsWith("Travel Medical"));
        return m
          ? <span className="text-xs font-medium" style={{ color: "#16a34a" }}>✓ {m.match(/\(\$[^)]+\)/)?.[0] ?? ""}</span>
          : <span className="text-xs" style={{ color: "#dc2626" }}>✗ None</span>;
      },
    },
    {
      label: "Trip Cancellation",
      render: c => c.insurance?.includes("Trip Cancellation")
        ? <span className="text-sm font-bold" style={{ color: "#16a34a" }}>✓</span>
        : <span className="text-sm" style={{ color: "#dc2626" }}>✗</span>,
    },
    {
      label: "Transfer Partners",
      render: c => (
        <div className="text-xs leading-relaxed" style={{ color: "#64748b" }}>
          {c.transferPartners && c.transferPartners[0] && !c.transferPartners[0].includes("no transfer") && !c.transferPartners[0].includes("Cash back")
            ? c.transferPartners.join(", ")
            : "None"}
        </div>
      ),
    },
    {
      label: "Tags / Perks",
      render: c => (
        <div className="flex flex-wrap gap-1 justify-center">
          {c.tags.map(t => (
            <span
              key={t}
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}
            >
              {t}
            </span>
          ))}
        </div>
      ),
    },
    {
      label: "Apply",
      render: c => (
        <a
          href={c.portals[0]?.url ?? c.directLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary text-xs font-bold px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
        >
          {c.portals[0] ? `Apply via ${c.portals[0].name}` : "Apply Direct"} →
        </a>
      ),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-10"
      style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}
    >
      <div className="w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
          <h2 className="text-lg font-bold" style={{ color: "#0f172a" }}>Card Comparison</h2>
          <button
            onClick={onClose}
            className="text-2xl font-light leading-none transition-colors"
            style={{ color: "#94a3b8" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#0f172a"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#94a3b8"; }}
          >
            ×
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody>
              {rows.map(row => (
                <tr key={row.label} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td
                    className="px-5 py-3 text-xs font-semibold uppercase tracking-wide w-32 shrink-0 align-middle whitespace-nowrap"
                    style={{ color: "#64748b" }}
                  >
                    {row.tooltip ? (
                      <Tooltip text={row.tooltip}>
                        <span>{row.label}</span>
                        <span className="ml-0.5 text-[10px] font-normal">ⓘ</span>
                      </Tooltip>
                    ) : row.label}
                  </td>
                  {compared.map(c => (
                    <td key={c.id} className="px-4 py-3 text-center align-middle">
                      {row.render(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Filter helpers ───────────────────────────────────────────────────────────
const ISSUERS = ["Any Issuer", "American Express", "BMO", "CIBC", "MBNA / TD", "RBC", "Scotiabank", "TD"];
const FEES = [
  { value: "any", label: "Any Fee" },
  { value: "free", label: "No Annual Fee" },
  { value: "under150", label: "Under $150" },
  { value: "150-399", label: "$150 – $399" },
  { value: "400plus", label: "$400+" },
];
const PROGRAMS = [
  "Any Program", "Aeroplan", "Membership Rewards", "Scene+", "Avion",
  "TD Rewards", "BMO Rewards", "Aventura", "Cash Back", "Air Miles",
  "WestJet Dollars", "Marriott Bonvoy", "MBNA Rewards",
];
const GRID_SORTS = [
  { value: "featured", label: "Featured" },
  { value: "value", label: "Best Value" },
  { value: "fee-asc", label: "Fee: Low → High" },
  { value: "fee-desc", label: "Fee: High → Low" },
];

function pillMatches(card: Card, pillId: string): boolean {
  switch (pillId) {
    case "aeroplan":  return card.program === "Aeroplan";
    case "no-fee":    return card.annualFeeNum === 0;
    case "cash-back": return card.program === "Cash Back";
    case "business":  return card.tags.includes("Business");
    case "lounge":    return card.tags.includes("Lounge Access");
    case "transfer":  return card.tags.includes("Transfer Partners");
    case "hotel":     return card.tags.includes("Hotel Rewards");
    case "elevated":  return !!card.elevated;
    default:          return false;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CardsPage() {
  const [view, setView]                       = useState<"grid" | "table">("table");
  const [compareSet, setCompareSet]           = useState<Set<string>>(new Set());
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [activePersona, setActivePersona]     = useState<string | null>(null);
  const [excludeTags, setExcludeTags]         = useState<string[]>(["Business"]);
  const [search, setSearch]                   = useState("");
  const [activePills, setActivePills]         = useState<Set<string>>(new Set());
  const [issuer, setIssuer]                   = useState("Any Issuer");
  const [fee, setFee]                         = useState("any");
  const [program, setProgram]                 = useState("Any Program");
  const [gridSort, setGridSort]               = useState("featured");
  const [showAdvanced, setShowAdvanced]       = useState(false);

  function toggleCompare(id: string) {
    setCompareSet(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 3) next.add(id);
      return next;
    });
  }

  function selectPersona(persona: Persona) {
    if (activePersona === persona.id) {
      setActivePersona(null);
      setActivePills(new Set());
      setFee("any");
      setProgram("Any Program");
      setExcludeTags([]);
      return;
    }
    setActivePersona(persona.id);
    setActivePills(new Set(persona.filters.pills ?? []));
    setFee(persona.filters.fee ?? "any");
    setProgram(persona.filters.program ?? "Any Program");
    setExcludeTags(persona.filters.excludeTags ?? []);
  }

  function clearAll() {
    setActivePersona(null);
    setSearch("");
    setActivePills(new Set());
    setIssuer("Any Issuer");
    setFee("any");
    setProgram("Any Program");
    setExcludeTags(["Business"]);
  }

  const filtered = useMemo(() => {
    const result = cards.filter(card => {
      if (search) {
        const q = search.toLowerCase();
        if (!card.name.toLowerCase().includes(q) && !card.issuer.toLowerCase().includes(q)) return false;
      }
      if (activePills.size > 0 && ![...activePills].some(p => pillMatches(card, p))) return false;
      if (excludeTags.length > 0 && excludeTags.some(t => card.tags.includes(t))) return false;
      if (issuer !== "Any Issuer" && card.issuer !== issuer) return false;
      if (fee !== "any") {
        if (fee === "free"     && card.annualFeeNum !== 0) return false;
        if (fee === "under150" && (card.annualFeeNum === 0 || card.annualFeeNum >= 150)) return false;
        if (fee === "150-399"  && (card.annualFeeNum < 150 || card.annualFeeNum > 399)) return false;
        if (fee === "400plus"  && card.annualFeeNum < 400) return false;
      }
      if (program !== "Any Program" && card.program !== program) return false;
      return true;
    });
    if (view === "grid") {
      result.sort((a, b) => {
        if (gridSort === "featured") return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        if (gridSort === "value")    return parseNum(b.firstYearValue) - parseNum(a.firstYearValue);
        if (gridSort === "fee-asc")  return a.annualFeeNum - b.annualFeeNum;
        if (gridSort === "fee-desc") return b.annualFeeNum - a.annualFeeNum;
        return 0;
      });
    }
    return result;
  }, [search, activePills, excludeTags, issuer, fee, program, gridSort, view]);

  const hasFilters = search || activePills.size > 0 || issuer !== "Any Issuer" || fee !== "any" || program !== "Any Program";

  const selectStyle: React.CSSProperties = {
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "14px",
    background: "#ffffff",
    color: "#0f172a",
    outline: "none",
  };

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      <Navbar activePage="cards" />

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <p className="section-label mb-2">All Cards</p>
          <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>
            Canadian Credit Cards
          </h1>
          <p className="text-sm" style={{ color: "#64748b" }}>
            75+ cards sorted by first-year value. Apply via rebate portals to earn extra cash back on top of your welcome bonus.
          </p>
        </div>

        {/* Persona pill row */}
        <div className="mb-5">
          <div className="flex flex-wrap gap-2">
            {PERSONAS.map(persona => {
              const active = activePersona === persona.id;
              return (
                <button
                  key={persona.id}
                  onClick={() => selectPersona(persona)}
                  className="flex flex-col items-start px-4 py-2.5 rounded-xl text-left transition-all duration-150"
                  style={{
                    background: active ? "#2563eb" : "#ffffff",
                    border: active ? "1px solid #2563eb" : "1px solid #e2e8f0",
                    color: active ? "#ffffff" : "#0f172a",
                    boxShadow: active ? "0 0 0 3px rgba(37,99,235,0.12)" : "none",
                  }}
                >
                  <span className="text-sm font-semibold leading-tight">{persona.label}</span>
                  <span className="text-xs mt-0.5 leading-tight" style={{ color: active ? "rgba(255,255,255,0.75)" : "#94a3b8" }}>
                    {persona.tagline}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search bar row */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input
            type="text"
            placeholder="Search cards..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="rounded-xl px-4 py-2 text-sm outline-none w-52"
            style={{ border: "1px solid #e2e8f0", background: "#ffffff", color: "#0f172a" }}
            onFocus={e => { (e.target as HTMLInputElement).style.borderColor = "#2563eb"; }}
            onBlur={e => { (e.target as HTMLInputElement).style.borderColor = "#e2e8f0"; }}
          />
          <button
            onClick={() => setShowAdvanced(v => !v)}
            className="flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: "#64748b" }}
          >
            <svg className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filters {showAdvanced ? "▲" : "▼"}
          </button>
          {hasFilters && (
            <button onClick={clearAll} className="text-sm font-medium hover:underline" style={{ color: "#2563eb" }}>
              Clear all
            </button>
          )}
          <div className="ml-auto flex items-center gap-3">
            {view === "grid" && (
              <select value={gridSort} onChange={e => setGridSort(e.target.value)} style={selectStyle}>
                {GRID_SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            )}
            <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
              <button
                onClick={() => setView("table")}
                title="Table view"
                className="px-3 py-2 transition-colors"
                style={{ background: view === "table" ? "#2563eb" : "#ffffff", color: view === "table" ? "#ffffff" : "#64748b" }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 6h18M3 14h18M3 18h18" />
                </svg>
              </button>
              <button
                onClick={() => setView("grid")}
                title="Grid view"
                className="px-3 py-2 transition-colors"
                style={{ background: view === "grid" ? "#2563eb" : "#ffffff", color: view === "grid" ? "#ffffff" : "#64748b", borderLeft: "1px solid #e2e8f0" }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Advanced filters panel */}
        {showAdvanced && (
          <div
            className="rounded-2xl p-5 mb-6 flex flex-wrap gap-3 items-center"
            style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}
          >
            <select value={issuer} onChange={e => setIssuer(e.target.value)} style={selectStyle}>
              {ISSUERS.map(i => <option key={i}>{i}</option>)}
            </select>
            <select value={fee} onChange={e => setFee(e.target.value)} style={selectStyle}>
              {FEES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <select value={program} onChange={e => setProgram(e.target.value)} style={selectStyle}>
              {PROGRAMS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        )}

        {/* Result count */}
        <p className="text-sm mb-5" style={{ color: "#64748b" }}>
          {activePersona && (
            <span className="mr-2 font-medium" style={{ color: "#2563eb" }}>
              {PERSONAS.find(p => p.id === activePersona)?.label} —
            </span>
          )}
          {filtered.length} card{filtered.length !== 1 ? "s" : ""}
          {view === "table" && (
            <span className="ml-2 text-xs" style={{ color: "#94a3b8" }}>click column headers to sort</span>
          )}
        </p>

        {/* Results */}
        {filtered.length > 0 ? (
          view === "table" ? (
            <TableView cards={filtered} compareSet={compareSet} onToggle={toggleCompare} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(card => (
                <CardTile key={card.id} card={card} compareSet={compareSet} onToggle={toggleCompare} />
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-20">
            <p className="text-lg font-medium" style={{ color: "#64748b" }}>No cards match your filters.</p>
            <button onClick={clearAll} className="mt-3 text-sm font-medium hover:underline" style={{ color: "#2563eb" }}>
              Clear all filters
            </button>
          </div>
        )}

        {/* Compare bar (sticky bottom) */}
        {compareSet.size > 0 && (
          <div
            className="fixed bottom-0 left-0 right-0 z-30 px-6 py-3 shadow-lg"
            style={{ background: "#ffffff", borderTop: "1px solid #e2e8f0" }}
          >
            <div className="max-w-7xl mx-auto flex items-center gap-4 flex-wrap">
              <span className="text-sm font-semibold shrink-0" style={{ color: "#0f172a" }}>
                Compare ({compareSet.size}/3):
              </span>
              <div className="flex items-center gap-3 flex-1 flex-wrap">
                {[...compareSet].map(id => {
                  const c = cards.find(x => x.id === id)!;
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm"
                      style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }}
                    >
                      <span className="font-medium" style={{ color: "#0f172a" }}>{c.name}</span>
                      <button
                        onClick={() => toggleCompare(id)}
                        className="font-bold leading-none text-lg transition-colors"
                        style={{ color: "#94a3b8" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#dc2626"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#94a3b8"; }}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {compareSet.size >= 2 && (
                  <button
                    onClick={() => setShowCompareModal(true)}
                    className="btn-primary text-sm font-bold px-5 py-2 rounded-xl transition-colors"
                  >
                    Compare →
                  </button>
                )}
                {compareSet.size < 2 && (
                  <span className="text-xs" style={{ color: "#94a3b8" }}>Select {2 - compareSet.size} more to compare</span>
                )}
                <button
                  onClick={() => setCompareSet(new Set())}
                  className="text-sm transition-colors"
                  style={{ color: "#94a3b8" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#0f172a"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#94a3b8"; }}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Compare modal */}
        {showCompareModal && (
          <CompareModal ids={[...compareSet]} onClose={() => setShowCompareModal(false)} />
        )}

        {/* Legend + disclaimer */}
        <div
          className="mt-14 pt-8 flex flex-wrap gap-4 text-xs"
          style={{ borderTop: "1px solid #e2e8f0", color: "#94a3b8" }}
        >
          <span><strong style={{ color: "#64748b" }}>GCR</strong> = Great Canadian Rebates</span>
          <span><strong style={{ color: "#64748b" }}>FF</strong> = Frugal Flyer</span>
          <span><strong style={{ color: "#64748b" }}>CCG</strong> = Credit Card Genius</span>
          <span><strong style={{ color: "#64748b" }}>FYF</strong> = First Year Free</span>
          <span><strong style={{ color: "#64748b" }}>MR</strong> = Amex Membership Rewards</span>
        </div>
        <p className="text-xs mt-2" style={{ color: "#94a3b8" }}>
          * First-year values are estimates. Offers change frequently — always verify before applying.
        </p>

      </div>
    </div>
  );
}
