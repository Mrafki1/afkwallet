"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { cards, type Card } from "../data/cards";
import Navbar from "../components/Navbar";

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
    label: "Travel Hacker",
    tagline: "Maximize first-year value with transferable points",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    filters: { pills: ["transfer"], excludeTags: ["Business"] },
  },
  {
    id: "flyer",
    label: "Frequent Flyer",
    tagline: "Lounge access, Aeroplan points, free checked bags",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
    filters: { pills: ["aeroplan", "lounge"], excludeTags: ["Business"] },
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

// ─── Card image ───────────────────────────────────────────────────────────────
function CardArt({ name, image, gradient, featured, elevated }: { name: string; image: string; gradient: string; featured: boolean; elevated?: boolean }) {
  return (
    <div className="relative w-full aspect-[1.6/1] rounded-xl overflow-hidden bg-gray-100">
      <Image src={image} alt={name} fill className="object-contain p-2"
        onError={(e) => {
          const parent = (e.target as HTMLImageElement).parentElement;
          if (parent) {
            parent.className = `relative w-full aspect-[1.6/1] rounded-xl overflow-hidden bg-gradient-to-br ${gradient}`;
            (e.target as HTMLImageElement).style.display = "none";
          }
        }}
      />
      {elevated && (
        <span className="absolute top-2 left-2 text-xs font-bold bg-red-600 text-white px-2 py-0.5 rounded-full shadow-sm tracking-wide animate-pulse">🔥 HOT OFFER</span>
      )}
      {!elevated && featured && (
        <span className="absolute top-2 left-2 text-xs font-semibold bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full shadow-sm">FEATURED</span>
      )}
    </div>
  );
}

// ─── Grid tile ────────────────────────────────────────────────────────────────
function CardTile({ card, compareSet, onToggle }: { card: Card; compareSet: Set<string>; onToggle: (id: string) => void }) {
  const inCompare = compareSet.has(card.id);
  const maxed = compareSet.size >= 3 && !inCompare;
  return (
    <div className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-[1.02] p-5 flex flex-col gap-4 border-2 ${inCompare ? "border-red-900" : "border-gray-100"}`}>
      <div className="relative">
        <Link href={`/cards/${card.id}`}>
          <CardArt name={card.name} image={card.image} gradient={card.gradient} featured={card.featured} elevated={card.elevated} />
        </Link>
        {card.elevated && card.elevatedNote && (
          <div className="mt-2 flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
            <span className="text-red-600 text-xs font-semibold">{card.elevatedNote}</span>
          </div>
        )}
        <button
          onClick={() => onToggle(card.id)}
          disabled={maxed}
          title={inCompare ? "Remove from compare" : maxed ? "Max 3 cards" : "Add to compare"}
          className={`absolute top-2 right-2 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors shadow-sm ${
            inCompare ? "bg-red-900 border-red-900 text-white" : maxed ? "bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed" : "bg-white border-gray-300 text-gray-400 hover:border-red-900 hover:text-red-900"
          }`}
        >
          {inCompare ? "✓" : "+"}
        </button>
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{card.issuer}</p>
        <Link href={`/cards/${card.id}`} className="hover:text-red-900 transition-colors">
          <h3 className="font-bold text-gray-900 text-base leading-tight mt-0.5">{card.name}</h3>
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-50 rounded-xl p-2">
          <p className="text-xs text-gray-400 mb-0.5 leading-tight">1st Year Value</p>
          <p className="font-bold text-orange-500 text-sm">{card.firstYearValue}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2">
          <p className="text-xs text-gray-400 mb-0.5 leading-tight">Welcome Bonus</p>
          <p className="font-bold text-gray-800 text-xs leading-tight">{card.pointsBonus}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2">
          <p className="text-xs text-gray-400 mb-0.5 leading-tight">Annual Fee</p>
          <p className="font-bold text-gray-800 text-sm">{card.annualFee}</p>
        </div>
      </div>
      {card.rewards.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {card.rewards.slice(0, 2).map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm w-10 shrink-0">{r.multiplier}</span>
              <span className="text-gray-500 text-xs">{r.category}</span>
            </div>
          ))}
        </div>
      )}
      {card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {card.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">{tag}</span>
          ))}
        </div>
      )}
      <div className="mt-auto flex flex-col gap-2">
        {card.portals.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-2">
              {card.portals.map((portal, i) => (
                <a key={portal.name} href={portal.url} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${i === 0 ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"}`}>
                  {i === 0 && <span className="text-green-500">★</span>}
                  {portal.name} <span className="font-bold">${portal.bonus}</span>
                </a>
              ))}
            </div>
            <a href={card.portals[0].url} target="_blank" rel="noopener noreferrer"
              className="w-full text-center bg-red-900 hover:bg-red-800 text-white text-sm font-semibold py-2 rounded-xl transition-colors">
              Apply via {card.portals[0].name} (+${card.portals[0].bonus})
            </a>
          </>
        ) : (
          <a href={card.directLink} target="_blank" rel="noopener noreferrer"
            className="w-full text-center bg-red-900 hover:bg-red-800 text-white text-sm font-semibold py-2 rounded-xl transition-colors">
            Apply Direct
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Table view ───────────────────────────────────────────────────────────────
type SortCol = "value" | "bonus" | "fee" | "msr" | "portal";
type SortDir = "asc" | "desc";

function parseNum(str: string) {
  return parseInt(str.replace(/[$,~a-zA-Z\s]/g, "")) || 0;
}

function TableView({ cards, compareSet, onToggle }: { cards: Card[]; compareSet: Set<string>; onToggle: (id: string) => void }) {
  const [sortCol, setSortCol] = useState<SortCol>("value");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  }

  const sorted = useMemo(() => [...cards].sort((a, b) => {
    let diff = 0;
    if (sortCol === "value")  diff = parseNum(a.firstYearValue) - parseNum(b.firstYearValue);
    if (sortCol === "bonus")  diff = parseNum(a.pointsBonus) - parseNum(b.pointsBonus);
    if (sortCol === "fee")    diff = a.annualFeeNum - b.annualFeeNum;
    if (sortCol === "msr")    diff = parseNum(a.msr) - parseNum(b.msr);
    if (sortCol === "portal") diff = (a.portals[0]?.bonus ?? 0) - (b.portals[0]?.bonus ?? 0);
    return sortDir === "asc" ? diff : -diff;
  }), [cards, sortCol, sortDir]);

  function Th({ col, label }: { col: SortCol; label: string }) {
    const active = sortCol === col;
    return (
      <th onClick={() => handleSort(col)}
        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-900 select-none whitespace-nowrap">
        {label}
        <span className={`ml-1 text-xs ${active ? "text-red-900" : "text-gray-300"}`}>
          {active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </th>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-3 py-3 w-10"></th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-64">Card</th>
            <Th col="value"  label="1st Year Value" />
            <Th col="bonus"  label="Welcome Bonus" />
            <Th col="fee"    label="Annual Fee" />
            <Th col="msr"    label="Min. Spend" />
            <Th col="portal" label="Best Portal" />
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Top Earn Rate</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sorted.map((card, i) => {
            const best = card.portals[0] ?? null;
            const inCompare = compareSet.has(card.id);
            const maxed = compareSet.size >= 3 && !inCompare;
            return (
              <tr key={card.id} className={`hover:bg-gray-50 transition-colors ${inCompare ? "bg-red-50/40" : i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                <td className="px-3 py-3">
                  <button
                    onClick={() => onToggle(card.id)}
                    disabled={maxed}
                    title={inCompare ? "Remove from compare" : maxed ? "Max 3 cards" : "Compare"}
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                      inCompare ? "bg-red-900 border-red-900 text-white" : maxed ? "border-gray-200 text-gray-300 cursor-not-allowed" : "border-gray-300 text-gray-300 hover:border-red-900 hover:text-red-900"
                    }`}
                  >
                    {inCompare ? "✓" : ""}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/cards/${card.id}`} className="flex items-center gap-3 group">
                    <div className="relative w-16 aspect-[1.586/1] rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      <Image src={card.image} alt={card.name} fill className="object-contain p-1" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-red-900 transition-colors leading-tight text-sm">{card.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{card.issuer}</p>
                      {card.featured && <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">FEATURED</span>}
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3"><span className="font-bold text-orange-500">{card.firstYearValue}</span></td>
                <td className="px-4 py-3">
                  <span className="font-semibold text-gray-800 text-xs">{card.pointsBonus}</span>
                  <p className="text-xs text-gray-400 mt-0.5">{card.program}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-semibold text-sm ${card.annualFeeNum === 0 ? "text-green-600" : "text-gray-800"}`}>{card.annualFee}</span>
                </td>
                <td className="px-4 py-3"><span className="text-gray-600 text-xs">{card.msr}</span></td>
                <td className="px-4 py-3">
                  {best ? (
                    <div className="flex flex-col gap-1">
                      <a href={best.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors">
                        ★ {best.name} +${best.bonus}
                      </a>
                      {card.portals.slice(1).map(p => (
                        <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-gray-400 hover:text-gray-600">
                          {p.name} +${p.bonus}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Direct only</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {card.rewards[0] && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-gray-900">{card.rewards[0].multiplier}</span>
                      <span className="text-xs text-gray-400">{card.rewards[0].category}</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <a href={best ? best.url : card.directLink} target="_blank" rel="noopener noreferrer"
                    className="whitespace-nowrap bg-red-900 hover:bg-red-800 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
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

  const rows: { label: string; render: (c: Card) => React.ReactNode }[] = [
    { label: "Card", render: c => (
      <div className="flex flex-col items-center gap-2">
        <div className="w-28 aspect-[1.586/1] relative rounded-xl overflow-hidden bg-gray-100">
          <Image src={c.image} alt={c.name} fill className="object-contain p-1"
            onError={(e) => {
              const p = (e.target as HTMLImageElement).parentElement;
              if (p) { p.className = `w-28 aspect-[1.586/1] rounded-xl bg-gradient-to-br ${c.gradient}`; (e.target as HTMLImageElement).style.display = "none"; }
            }} />
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400">{c.issuer}</p>
          <p className="font-bold text-gray-900 text-sm leading-tight">{c.name}</p>
        </div>
      </div>
    )},
    { label: "1st Year Value", render: c => <span className="font-black text-orange-500 text-xl">{c.firstYearValue}</span> },
    { label: "Welcome Bonus",  render: c => <span className="font-semibold text-gray-800 text-sm">{c.pointsBonus}</span> },
    { label: "Annual Fee",     render: c => <span className={`font-bold text-lg ${c.annualFeeNum === 0 ? "text-green-600" : "text-gray-800"}`}>{c.annualFee}</span> },
    { label: "Min. Spend",     render: c => <span className="text-sm text-gray-700">{c.msr}</span> },
    { label: "Points Program", render: c => <span className="text-sm text-gray-700">{c.program}</span> },
    { label: "Points Value",   render: c => <span className="text-xs text-gray-600">{c.pointsValue ?? "—"}</span> },
    { label: "Best Portal",    render: c => c.portals[0] ? (
      <a href={c.portals[0].url} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-lg text-xs font-semibold hover:bg-green-100">
        ★ {c.portals[0].name} +${c.portals[0].bonus}
      </a>
    ) : <span className="text-xs text-gray-400">Direct only</span> },
    { label: "Network",        render: c => <span className="text-sm text-gray-700">{c.network ?? "—"}</span> },
    { label: "Foreign Fee",    render: c => <span className={`text-xs font-medium ${c.foreignFee?.startsWith("0%") ? "text-green-600" : "text-gray-700"}`}>{c.foreignFee ?? "—"}</span> },
    { label: "Income Req.",    render: c => <span className="text-xs text-gray-600">{c.incomeReq ?? "—"}</span> },
    { label: "Lounge Access",  render: c => <span className="text-xs text-gray-600">{c.loungeDetails ?? "—"}</span> },
    { label: "Top Earn Rate",  render: c => c.rewards[0] ? (
      <span className="text-sm font-bold text-gray-800">{c.rewards[0].multiplier} <span className="font-normal text-gray-500 text-xs">{c.rewards[0].category}</span></span>
    ) : <span className="text-gray-400">—</span> },
    { label: "Travel Medical", render: c => {
      const m = c.insurance?.find(i => i.startsWith("Travel Medical"));
      return m ? <span className="text-xs text-green-600 font-medium">✓ {m.match(/\(\$[^)]+\)/)?.[0] ?? ""}</span> : <span className="text-xs text-gray-400">✗ None</span>;
    }},
    { label: "Trip Cancellation", render: c => c.insurance?.includes("Trip Cancellation") ? <span className="text-green-600 text-sm font-bold">✓</span> : <span className="text-gray-400 text-sm">✗</span> },
    { label: "Transfer Partners", render: c => (
      <div className="text-xs text-gray-600 leading-relaxed">
        {c.transferPartners && c.transferPartners[0] && !c.transferPartners[0].includes("no transfer") && !c.transferPartners[0].includes("Cash back")
          ? c.transferPartners.join(", ") : "None"}
      </div>
    )},
    { label: "Tags / Perks",  render: c => (
      <div className="flex flex-wrap gap-1 justify-center">
        {c.tags.map(t => <span key={t} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{t}</span>)}
      </div>
    )},
    { label: "Apply",         render: c => (
      <a href={c.portals[0]?.url ?? c.directLink} target="_blank" rel="noopener noreferrer"
        className="bg-red-900 hover:bg-red-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors whitespace-nowrap">
        {c.portals[0] ? `Apply via ${c.portals[0].name}` : "Apply Direct"} →
      </a>
    )},
  ];


  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4 py-10">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Card Comparison</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl font-light leading-none">×</button>
        </div>
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody>
              {rows.map(row => (
                <tr key={row.label} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide w-32 shrink-0 align-middle whitespace-nowrap">
                    {row.label}
                  </td>
                  {compared.map(c => (
                    <td key={c.id} className={`px-4 py-3 text-center align-middle`}>
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
const ISSUERS  = ["Any Issuer", "American Express", "BMO", "CIBC", "MBNA / TD", "RBC", "Scotiabank", "TD"];
const FEES     = [
  { value: "any", label: "Any Fee" }, { value: "free", label: "No Annual Fee" },
  { value: "under150", label: "Under $150" }, { value: "150-399", label: "$150 – $399" },
  { value: "400plus", label: "$400+" },
];
const PROGRAMS = [
  "Any Program", "Aeroplan", "Membership Rewards", "Scene+", "Avion",
  "TD Rewards", "BMO Rewards", "Aventura", "Cash Back", "Air Miles",
  "WestJet Dollars", "Marriott Bonvoy", "MBNA Rewards",
];
const GRID_SORTS = [
  { value: "featured", label: "Featured" }, { value: "value", label: "Best Value" },
  { value: "fee-asc", label: "Fee: Low → High" }, { value: "fee-desc", label: "Fee: High → Low" },
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
    default:          return false;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CardsPage() {
  const [view, setView]               = useState<"grid" | "table">("table");
  const [compareSet, setCompareSet]   = useState<Set<string>>(new Set());
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [activePersona, setActivePersona] = useState<string | null>(null);
  const [excludeTags, setExcludeTags] = useState<string[]>(["Business"]);

  function toggleCompare(id: string) {
    setCompareSet(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else if (next.size < 3) next.add(id);
      return next;
    });
  }
  const [search, setSearch]           = useState("");
  const [activePills, setActivePills] = useState<Set<string>>(new Set());
  const [issuer, setIssuer]           = useState("Any Issuer");
  const [fee, setFee]                 = useState("any");
  const [program, setProgram]         = useState("Any Program");
  const [gridSort, setGridSort]       = useState("featured");
  const [showAdvanced, setShowAdvanced] = useState(false);

  function selectPersona(persona: Persona) {
    if (activePersona === persona.id) {
      // Deselect — clear all
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
        if (fee === "free"     && card.annualFeeNum !== 0)                               return false;
        if (fee === "under150" && (card.annualFeeNum === 0 || card.annualFeeNum >= 150)) return false;
        if (fee === "150-399"  && (card.annualFeeNum < 150 || card.annualFeeNum > 399))  return false;
        if (fee === "400plus"  && card.annualFeeNum < 400)                               return false;
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

  return (
    <div className="min-h-screen bg-white">
      <Navbar activePage="cards" />

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Best Canadian Credit Cards</h1>
          <p className="text-gray-500 mt-1.5 text-sm">
            Top signup offers from{" "}
            <a href="https://www.reddit.com/r/churningcanada" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700">r/churningcanada</a>.
            Apply via rebate portals to stack extra cash back on top of your signup bonus.
          </p>
        </div>

        {/* ── Persona picker ── */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">I&apos;m looking for cards for...</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {PERSONAS.map(persona => {
              const active = activePersona === persona.id;
              return (
                <button
                  key={persona.id}
                  onClick={() => selectPersona(persona)}
                  className={`flex flex-col items-center text-center gap-2 p-4 rounded-2xl border-2 transition-all duration-150 ${
                    active
                      ? "border-red-900 bg-red-50 text-red-900 shadow-md"
                      : "border-gray-100 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900 hover:shadow-sm"
                  }`}
                >
                  <div className={`p-2 rounded-xl ${active ? "bg-red-100 text-red-900" : "bg-gray-100 text-gray-500"}`}>
                    {persona.icon}
                  </div>
                  <div>
                    <p className={`text-xs font-bold leading-tight ${active ? "text-red-900" : "text-gray-800"}`}>{persona.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-tight hidden sm:block">{persona.tagline}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Search + view toggle + advanced toggle ── */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input type="text" placeholder="Search cards..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-gray-400 bg-white w-52" />

          <button
            onClick={() => setShowAdvanced(v => !v)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors"
          >
            <svg className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filters {showAdvanced ? "▲" : "▼"}
          </button>

          {hasFilters && (
            <button onClick={clearAll} className="text-sm text-red-900 hover:underline font-medium">
              Clear all
            </button>
          )}

          <div className="ml-auto flex items-center gap-3">
            {view === "grid" && (
              <select value={gridSort} onChange={e => setGridSort(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white text-gray-700 outline-none focus:border-gray-400">
                {GRID_SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            )}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button onClick={() => setView("table")}
                title="Table view"
                className={`px-3 py-2 transition-colors ${view === "table" ? "bg-red-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 6h18M3 14h18M3 18h18" />
                </svg>
              </button>
              <button onClick={() => setView("grid")}
                title="Grid view"
                className={`px-3 py-2 border-l border-gray-200 transition-colors ${view === "grid" ? "bg-red-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── Advanced filters (collapsed by default) ── */}
        {showAdvanced && (
          <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100 flex flex-wrap gap-3 items-center">
            <select value={issuer} onChange={e => setIssuer(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 outline-none focus:border-gray-400">
              {ISSUERS.map(i => <option key={i}>{i}</option>)}
            </select>
            <select value={fee} onChange={e => setFee(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 outline-none focus:border-gray-400">
              {FEES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <select value={program} onChange={e => setProgram(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 outline-none focus:border-gray-400">
              {PROGRAMS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        )}

        {/* Result count */}
        <p className="text-sm text-gray-400 mb-5">
          {activePersona && (
            <span className="mr-2 text-red-900 font-medium">
              {PERSONAS.find(p => p.id === activePersona)?.label} —
            </span>
          )}
          {filtered.length} card{filtered.length !== 1 ? "s" : ""}
          {view === "table" && <span className="ml-2 text-gray-300 text-xs">click column headers to sort</span>}
        </p>

        {/* Results */}
        {filtered.length > 0 ? (
          view === "table"
            ? <TableView cards={filtered} compareSet={compareSet} onToggle={toggleCompare} />
            : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(card => <CardTile key={card.id} card={card} compareSet={compareSet} onToggle={toggleCompare} />)}
              </div>
            )
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium text-gray-500">No cards match your filters.</p>
            <button onClick={clearAll} className="mt-3 text-sm text-red-900 hover:underline font-medium">Clear all filters</button>
          </div>
        )}

        {/* ── Compare bar (sticky bottom) ── */}
        {compareSet.size > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-2xl px-6 py-3">
            <div className="max-w-7xl mx-auto flex items-center gap-4 flex-wrap">
              <span className="text-sm font-semibold text-gray-700 shrink-0">
                Compare ({compareSet.size}/3):
              </span>
              <div className="flex items-center gap-3 flex-1 flex-wrap">
                {[...compareSet].map(id => {
                  const c = cards.find(x => x.id === id)!;
                  return (
                    <div key={id} className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-1.5 text-sm">
                      <span className="font-medium text-gray-800">{c.name}</span>
                      <button onClick={() => toggleCompare(id)} className="text-gray-400 hover:text-red-900 font-bold leading-none text-lg">×</button>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {compareSet.size >= 2 && (
                  <button
                    onClick={() => setShowCompareModal(true)}
                    className="bg-red-900 hover:bg-red-800 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
                  >
                    Compare →
                  </button>
                )}
                {compareSet.size < 2 && (
                  <span className="text-xs text-gray-400">Select {2 - compareSet.size} more to compare</span>
                )}
                <button onClick={() => setCompareSet(new Set())} className="text-sm text-gray-400 hover:text-gray-700">
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Compare modal ── */}
        {showCompareModal && (
          <CompareModal ids={[...compareSet]} onClose={() => setShowCompareModal(false)} />
        )}

        {/* Legend */}
        <div className="mt-14 pt-8 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-400">
          <span><strong className="text-gray-500">GCR</strong> = Great Canadian Rebates</span>
          <span><strong className="text-gray-500">FF</strong> = Frugal Flyer</span>
          <span><strong className="text-gray-500">CCG</strong> = Credit Card Genius</span>
          <span><strong className="text-gray-500">FYF</strong> = First Year Free</span>
          <span><strong className="text-gray-500">MR</strong> = Amex Membership Rewards</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          * First-year values are estimates. Offers change frequently — always verify before applying. Last updated Mar 22, 2026.
        </p>
      </div>
    </div>
  );
}
