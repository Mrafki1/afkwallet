"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { cards } from "../data/cards";
import type { Card } from "../data/cards";
import Navbar from "../components/Navbar";

// ── Comparison rows ───────────────────────────────────────────────────────────

type Row = {
  label: string;
  key: keyof Card | "bestPortal" | "fyvWithPortal";
  render?: (card: Card) => React.ReactNode;
  highlight?: "high" | "low" | "none";
};

const ROWS: Row[] = [
  {
    label: "First-year value (incl. portal)",
    key: "fyvWithPortal",
    highlight: "high",
    render: (c) => {
      const best = [...c.portals].sort((a, b) => b.bonus - a.bonus)[0];
      const base = parseInt(c.firstYearValue.replace(/[^0-9]/g, "")) || 0;
      return best ? `~$${(base + best.bonus).toLocaleString()}` : c.firstYearValue;
    },
  },
  {
    label: "Welcome bonus",
    key: "pointsBonus",
    render: (c) => c.pointsBonus || "—",
  },
  {
    label: "Annual fee",
    key: "annualFeeNum",
    highlight: "low",
    render: (c) => c.annualFee,
  },
  {
    label: "Min. spend requirement",
    key: "msr",
    render: (c) => c.msr || "—",
  },
  {
    label: "Rewards program",
    key: "program",
    render: (c) => c.program,
  },
  {
    label: "Network",
    key: "network",
    render: (c) => c.network ?? "—",
  },
  {
    label: "Best portal payout",
    key: "bestPortal",
    highlight: "high",
    render: (c) => {
      const best = [...c.portals].sort((a, b) => b.bonus - a.bonus)[0];
      return best ? `+$${best.bonus} via ${best.name}` : "No portal";
    },
  },
  {
    label: "Foreign transaction fee",
    key: "foreignFee",
    highlight: "low",
    render: (c) => c.foreignFee ?? "2.5%",
  },
  {
    label: "Lounge access",
    key: "loungeDetails",
    render: (c) => c.loungeDetails ?? "None",
  },
  {
    label: "Transfer partners",
    key: "transferPartners",
    render: (c) =>
      c.transferPartners?.length
        ? c.transferPartners.slice(0, 3).join(", ") + (c.transferPartners.length > 3 ? ` +${c.transferPartners.length - 3} more` : "")
        : "None",
  },
  {
    label: "Points value",
    key: "pointsValue",
    render: (c) => c.pointsValue ?? "—",
  },
  {
    label: "Income requirement",
    key: "incomeReq",
    render: (c) => c.incomeReq ?? "None stated",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getNumericValue(card: Card, key: Row["key"]): number {
  if (key === "fyvWithPortal") {
    const best = [...card.portals].sort((a, b) => b.bonus - a.bonus)[0];
    const base = parseInt(card.firstYearValue.replace(/[^0-9]/g, "")) || 0;
    return best ? base + best.bonus : base;
  }
  if (key === "annualFeeNum") return card.annualFeeNum;
  if (key === "bestPortal") {
    const best = [...card.portals].sort((a, b) => b.bonus - a.bonus)[0];
    return best?.bonus ?? 0;
  }
  return 0;
}

function getWinnerIndex(cards: (Card | null)[], row: Row): number {
  if (!row.highlight || row.highlight === "none") return -1;
  const values = cards.map(c => (c ? getNumericValue(c, row.key) : -Infinity));
  const best = row.highlight === "high" ? Math.max(...values) : Math.min(...values.filter(v => v > 0));
  const idx = values.indexOf(best);
  // Only highlight if there's an actual winner (not all equal)
  const unique = new Set(values.filter(v => v > 0));
  return unique.size > 1 ? idx : -1;
}

// ── Selector ─────────────────────────────────────────────────────────────────

function CardSelector({
  value,
  onChange,
  exclude,
  slot,
}: {
  value: string;
  onChange: (id: string) => void;
  exclude: string[];
  slot: number;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const available = cards
    .filter(c => !exclude.includes(c.id) || c.id === value)
    .filter(c =>
      query.trim() === "" ||
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.issuer.toLowerCase().includes(query.toLowerCase()) ||
      c.program.toLowerCase().includes(query.toLowerCase())
    );

  const selected = cards.find(c => c.id === value);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function pick(id: string) {
    onChange(id);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
        style={{ borderColor: open ? "#2563eb" : "#e2e8f0", color: selected ? "#0f172a" : "#94a3b8", background: "#fff" }}
      >
        <span className="truncate">{selected ? `${selected.name} (${selected.annualFee})` : `Select card ${slot}…`}</span>
        <svg className="w-4 h-4 shrink-0 ml-2 transition-transform" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", color: "#94a3b8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-30"
          style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}
        >
          {/* Search input */}
          <div className="p-2" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or issuer…"
              className="w-full text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ border: "1px solid #e2e8f0", color: "#0f172a" }}
            />
          </div>

          {/* Options */}
          <div className="overflow-y-auto" style={{ maxHeight: 260 }}>
            {value && (
              <button
                type="button"
                onClick={() => pick("")}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                style={{ color: "#64748b" }}
              >
                — Clear selection
              </button>
            )}
            {available.length === 0 ? (
              <p className="px-4 py-3 text-sm" style={{ color: "#94a3b8" }}>No cards match &ldquo;{query}&rdquo;</p>
            ) : (
              available.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pick(c.id)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                  style={{
                    color: c.id === value ? "#2563eb" : "#0f172a",
                    fontWeight: c.id === value ? 600 : 400,
                    background: c.id === value ? "#eff6ff" : "transparent",
                  }}
                >
                  <span className="block font-medium">{c.name}</span>
                  <span className="text-xs" style={{ color: "#64748b" }}>{c.issuer} · {c.annualFee}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ComparePage() {
  const [ids, setIds] = useState<[string, string, string]>(["", "", ""]);

  function setId(slot: 0 | 1 | 2, id: string) {
    setIds(prev => {
      const next = [...prev] as [string, string, string];
      next[slot] = id;
      return next;
    });
  }

  const selected = ids.map(id => cards.find(c => c.id === id) ?? null);
  const activeCards = selected.filter((c): c is Card => c !== null);
  const cols = activeCards.length;

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      <Navbar activePage="compare" />

      {/* Header */}
      <div style={{ background: "#0f172a", borderBottom: "1px solid #1e293b" }}>
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3" style={{ letterSpacing: "-0.02em" }}>
            Compare credit cards
          </h1>
          <p className="text-lg" style={{ color: "#94a3b8" }}>
            Select up to 3 Canadian credit cards to compare side by side.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Card selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {([0, 1, 2] as const).map(slot => (
            <CardSelector
              key={slot}
              value={ids[slot]}
              onChange={id => setId(slot, id)}
              exclude={ids.filter((_, i) => i !== slot).filter(Boolean)}
              slot={slot + 1}
            />
          ))}
        </div>

        {cols === 0 ? (
          <div className="text-center py-20 text-gray-400">Select at least one card above to start comparing.</div>
        ) : (
          <>
            {/* Card header row */}
            <div
              className="grid gap-4 mb-0 rounded-t-2xl overflow-hidden"
              style={{
                gridTemplateColumns: `200px repeat(${cols}, 1fr)`,
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderBottom: "none",
              }}
            >
              {/* empty label cell */}
              <div className="px-4 py-5" style={{ borderRight: "1px solid #f1f5f9" }} />

              {activeCards.map(card => (
                <div key={card.id} className="px-4 py-5 text-center" style={{ borderRight: "1px solid #f1f5f9" }}>
                  <div className="relative w-28 h-16 mx-auto mb-3 rounded-lg overflow-hidden" style={{ background: "#f8fafc" }}>
                    <Image src={card.image} alt={card.name} fill className="object-contain p-2" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: "#94a3b8" }}>{card.issuer}</p>
                  <p className="font-bold text-sm leading-snug mb-1" style={{ color: "#0f172a" }}>{card.name}</p>
                  {card.elevated && (
                    <span className="text-xs font-bold bg-red-600 text-white px-2 py-0.5 rounded-full">🔥 HOT</span>
                  )}
                </div>
              ))}
            </div>

            {/* Comparison rows */}
            <div className="rounded-b-2xl overflow-hidden" style={{ border: "1px solid #e2e8f0", borderTop: "none" }}>
              {ROWS.map((row, ri) => {
                const winnerIdx = getWinnerIndex(selected, row);
                return (
                  <div
                    key={row.label}
                    className="grid"
                    style={{
                      gridTemplateColumns: `200px repeat(${cols}, 1fr)`,
                      background: ri % 2 === 0 ? "#fff" : "#f8fafc",
                      borderTop: "1px solid #f1f5f9",
                    }}
                  >
                    {/* Label */}
                    <div
                      className="px-4 py-3.5 flex items-center text-xs font-semibold"
                      style={{ color: "#64748b", borderRight: "1px solid #f1f5f9" }}
                    >
                      {row.label}
                    </div>

                    {/* Values */}
                    {activeCards.map((card, ci) => {
                      const isWinner = winnerIdx === ci;
                      return (
                        <div
                          key={card.id}
                          className="px-4 py-3.5 flex items-center justify-center text-center text-sm"
                          style={{
                            borderRight: "1px solid #f1f5f9",
                            background: isWinner ? "#f0fdf4" : "transparent",
                            color: isWinner ? "#15803d" : "#0f172a",
                            fontWeight: isWinner ? 700 : 400,
                          }}
                        >
                          {row.render ? row.render(card) : String((card as Record<string, unknown>)[row.key as string] ?? "—")}
                          {isWinner && (
                            <svg className="ml-1.5 w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: "#16a34a" }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Apply row */}
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `200px repeat(${cols}, 1fr)`,
                  borderTop: "1px solid #e2e8f0",
                  background: "#fff",
                }}
              >
                <div className="px-4 py-4" style={{ borderRight: "1px solid #f1f5f9" }} />
                {activeCards.map(card => (
                  <div key={card.id} className="px-4 py-4 flex items-center justify-center" style={{ borderRight: "1px solid #f1f5f9" }}>
                    <Link href={`/cards/${card.id}`} className="btn-primary text-sm px-4 py-2">
                      View details →
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-4 text-xs text-center" style={{ color: "#94a3b8" }}>
              First-year value is an estimate. Portal rates change frequently — verify before applying.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
