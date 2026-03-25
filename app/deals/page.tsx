"use client";

import Image from "next/image";
import Link from "next/link";
import { cards } from "../data/cards";
import Navbar from "../components/Navbar";

const elevatedCards = cards.filter(c => c.elevated);
const LAST_UPDATED = "March 23, 2025";

function BestPortal({ portals, directLink }: { portals: typeof cards[0]["portals"]; directLink: string }) {
  if (portals.length === 0) {
    return (
      <a href={directLink} target="_blank" rel="noopener noreferrer" className="btn-primary w-full text-center text-sm py-2.5 block" style={{ borderRadius: 8 }}>
        Apply direct →
      </a>
    );
  }
  const best = portals[0];
  return (
    <a href={best.url} target="_blank" rel="noopener noreferrer" className="btn-primary w-full text-center text-sm py-2.5 block" style={{ borderRadius: 8 }}>
      Apply via {best.name} — get ${best.bonus} back →
    </a>
  );
}

export default function DealsPage() {
  return (
    <div className="min-h-screen" style={{ background: "#ffffff", color: "#0f172a" }}>
      <Navbar activePage="deals" />

      {/* Header */}
      <div className="py-16" style={{ borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="badge badge-amber">⚡ Hot Deals</span>
            <span className="text-sm" style={{ color: "#94a3b8" }}>· Updated {LAST_UPDATED}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>
            Elevated offers.<br />
            <span style={{ color: "#2563eb" }}>Limited time deals.</span>
          </h1>
          <p className="text-lg max-w-2xl" style={{ color: "#64748b" }}>
            These cards are running welcome bonuses above their normal offer. We update this page when offers change.
          </p>
        </div>
      </div>

      {/* Info bar */}
      <div style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-start gap-3">
          <span className="text-base shrink-0 mt-0.5">ℹ️</span>
          <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>
            <strong style={{ color: "#0f172a" }}>What does &ldquo;elevated&rdquo; mean?</strong>{" "}
            Card issuers periodically run higher-than-normal welcome bonuses — sometimes 20–50% more points than the standard offer. These windows are time-limited.
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="flex flex-col gap-6">
          {elevatedCards.map((card, i) => (
            <div key={card.id} className="card overflow-hidden" style={{ borderRadius: 16 }}>

              {/* Top banner */}
              <div
                className="px-6 py-3 flex items-center gap-2"
                style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a" }}
              >
                <span className="text-sm font-semibold" style={{ color: "#b45309" }}>⚡ Elevated Offer</span>
                <span style={{ color: "#d97706" }}>·</span>
                <span className="text-sm" style={{ color: "#92400e" }}>{card.elevatedNote}</span>
              </div>

              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row gap-6">

                  {/* Card image */}
                  <div
                    className="relative w-full sm:w-48 shrink-0 aspect-[1.586/1] overflow-hidden rounded-xl"
                    style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
                  >
                    <Image src={card.image} alt={card.name} fill className="object-contain p-3" />
                  </div>

                  {/* Info */}
                  <div className="flex flex-col gap-4 flex-1">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: "#94a3b8" }}>{card.issuer}</p>
                      <h2 className="text-xl font-bold tracking-tight" style={{ color: "#0f172a", letterSpacing: "-0.01em" }}>{card.name}</h2>
                      <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>{card.program}</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "1st Year Value", value: card.firstYearValue, highlight: true },
                        { label: "Welcome Bonus",  value: card.pointsBonus,   highlight: false },
                        { label: "Annual Fee",      value: card.annualFee,     highlight: false },
                        { label: "MSR",             value: card.msr,           highlight: false },
                      ].map(stat => (
                        <div key={stat.label} className="p-3 text-center rounded-lg" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                          <p className="text-xs font-medium mb-0.5" style={{ color: "#64748b" }}>{stat.label}</p>
                          <p className="font-semibold text-sm" style={{ color: stat.highlight ? "#16a34a" : "#0f172a" }}>{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Portal comparison */}
                    {card.portals.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#64748b" }}>Best portal cash back</p>
                        <div className="flex flex-wrap gap-2">
                          {card.portals.map((portal, pi) => (
                            <a
                              key={portal.name}
                              href={portal.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-all"
                              style={pi === 0
                                ? { background: "#f0fdf4", color: "#15803d", border: "1.5px solid #86efac" }
                                : { background: "#f8fafc", color: "#64748b", border: "1.5px solid #e2e8f0" }
                              }
                            >
                              {pi === 0 && <span>★</span>}
                              {portal.name} +${portal.bonus}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-auto pt-2">
                      <div className="flex-1">
                        <BestPortal portals={card.portals} directLink={card.directLink} />
                      </div>
                      <Link
                        href={`/cards/${card.id}`}
                        className="btn-secondary flex-none text-center text-sm py-2.5 px-5"
                        style={{ borderRadius: 8 }}
                      >
                        Full details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Editor pick */}
              {i === 0 && (
                <div style={{ borderTop: "1px solid #e2e8f0", background: "#f8fafc" }} className="px-6 py-3">
                  <p className="text-xs font-medium" style={{ color: "#16a34a" }}>⭐ Editor&apos;s pick — highest first-year value of any current elevated offer</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 card p-8 text-center" style={{ borderRadius: 16 }}>
          <h3 className="text-xl font-bold mb-2 tracking-tight" style={{ color: "#0f172a", letterSpacing: "-0.01em" }}>Not seeing what you need?</h3>
          <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: "#64748b" }}>
            Browse all 75+ Canadian cards — filtered by program, fee, issuer, or first-year value.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/cards" className="btn-primary text-sm px-6 py-3">Browse all cards →</Link>
            <Link href="/auth"  className="btn-secondary text-sm px-6 py-3">Track my cards free</Link>
          </div>
        </div>

        <p className="text-xs text-center mt-8" style={{ color: "#94a3b8" }}>
          Offers change frequently. Always verify current terms on the issuer&apos;s website before applying. Last updated {LAST_UPDATED}.
        </p>
      </div>
    </div>
  );
}
