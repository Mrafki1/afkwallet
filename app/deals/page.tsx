"use client";

import Image from "next/image";
import Link from "next/link";
import { cards } from "../data/cards";
import Navbar from "../components/Navbar";
import VineDivider from "../components/VineDivider";

const elevatedCards = cards.filter(c => c.elevated);
const LAST_UPDATED = "March 23, 2025";

function BestPortal({ portals, directLink }: { portals: typeof cards[0]["portals"]; directLink: string }) {
  if (portals.length === 0) {
    return (
      <a href={directLink} target="_blank" rel="noopener noreferrer" className="sdv-btn w-full text-center font-pixel text-sm py-3 block">
        Apply direct →
      </a>
    );
  }
  const best = portals[0];
  return (
    <a href={best.url} target="_blank" rel="noopener noreferrer" className="sdv-btn w-full text-center font-pixel text-sm py-3 block">
      Apply via {best.name} — get ${best.bonus} back →
    </a>
  );
}

export default function DealsPage() {
  return (
    <div className="min-h-screen" style={{ background: "#f9f0d9", color: "#3d2b1f" }}>
      <Navbar activePage="deals" />

      {/* Header */}
      <div className="pt-16 pb-12" style={{ background: "#f9f0d9", borderBottom: "3px solid #c4a06a" }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-pixel" style={{ color: "#d4a017" }}>⚡ Hot Deals</span>
            <span className="text-xs" style={{ color: "#9a7858" }}>· Updated {LAST_UPDATED}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4" style={{ color: "#3d2b1f" }}>
            Elevated offers.<br />
            <span style={{ color: "#4a7c59" }}>Limited time deals.</span>
          </h1>
          <p className="text-lg leading-relaxed max-w-2xl" style={{ color: "#7a6048" }}>
            These cards are running welcome bonuses above their normal offer — some for a limited time, some while stock lasts. We update this page when offers change.
          </p>
        </div>
      </div>

      {/* Vine */}
      <VineDivider />

      {/* Info bar */}
      <div style={{ background: "#f0e4c0", borderBottom: "2px solid #c4a06a" }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-start gap-3">
          <span className="text-lg shrink-0">🌿</span>
          <p className="text-sm leading-relaxed" style={{ color: "#7a6048" }}>
            <strong style={{ color: "#3d2b1f" }}>What does &ldquo;elevated&rdquo; mean?</strong> Card issuers periodically run higher-than-normal welcome bonuses — sometimes 20–50% more points than the standard offer. These windows are time-limited.
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="flex flex-col gap-8">
          {elevatedCards.map((card, i) => (
            <div key={card.id} className="sdv-panel overflow-hidden">

              {/* Top banner */}
              <div
                className="px-6 py-2.5 flex items-center gap-2"
                style={{
                  background: "linear-gradient(to right, #7a5430, #8b6343)",
                  borderBottom: "3px solid #5a3c20",
                }}
              >
                <span className="text-xs font-pixel" style={{ color: "#f0c840" }}>⚡ Elevated Offer</span>
                <span className="text-xs" style={{ color: "#c4a06a" }}>·</span>
                <span className="text-xs" style={{ color: "#f5ead8" }}>{card.elevatedNote}</span>
              </div>

              <div className="p-6 sm:p-8" style={{ background: "#f5ead8" }}>
                <div className="flex flex-col sm:flex-row gap-6">

                  {/* Card image */}
                  <div
                    className="relative w-full sm:w-48 shrink-0 aspect-[1.586/1] overflow-hidden"
                    style={{ background: "#ede0c0", border: "2px solid #7a5c3a" }}
                  >
                    <Image src={card.image} alt={card.name} fill className="object-contain p-3" />
                  </div>

                  {/* Info */}
                  <div className="flex flex-col gap-4 flex-1">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: "#7a6048" }}>{card.issuer}</p>
                      <h2 className="text-xl font-black" style={{ color: "#3d2b1f" }}>{card.name}</h2>
                      <p className="text-sm mt-0.5" style={{ color: "#9a7858" }}>{card.program}</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "1st Year Value",  value: card.firstYearValue, gold: true },
                        { label: "Welcome Bonus",    value: card.pointsBonus,   gold: false },
                        { label: "Annual Fee",       value: card.annualFee,     gold: false },
                        { label: "MSR",              value: card.msr,           gold: false },
                      ].map(stat => (
                        <div key={stat.label} className="p-3 text-center" style={{ background: "#ede0c0", border: "2px solid #7a5c3a" }}>
                          <p className="text-xs font-medium mb-0.5" style={{ color: "#7a6048" }}>{stat.label}</p>
                          <p className="font-bold text-sm leading-tight" style={{ color: stat.gold ? "#d4a017" : "#3d2b1f" }}>{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Portal comparison */}
                    {card.portals.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#7a6048" }}>Best portal cash back</p>
                        <div className="flex flex-wrap gap-2">
                          {card.portals.map((portal, pi) => (
                            <a
                              key={portal.name}
                              href={portal.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all"
                              style={pi === 0
                                ? { background: "#4a7c59", color: "#f5ead8", border: "2px solid #2d5a3a" }
                                : { background: "#ede0c0", color: "#7a6048", border: "2px solid #7a5c3a" }
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
                        className="sdv-btn-tan flex-none text-center font-pixel py-3 px-5 text-sm"
                      >
                        Full details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Editor pick */}
              {i === 0 && (
                <div style={{ borderTop: "2px solid #c4a06a", background: "#f0e4c0" }} className="px-6 py-3">
                  <p className="text-xs font-medium" style={{ color: "#d4a017" }}>⭐ Editor&apos;s pick — highest first-year value of any current elevated offer</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 sdv-panel p-8 text-center">
          <h3 className="text-xl font-black mb-2" style={{ color: "#3d2b1f" }}>Not seeing what you need?</h3>
          <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: "#7a6048" }}>
            Browse all 75+ Canadian cards — filtered by program, fee, issuer, or first-year value.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/cards" className="sdv-btn text-sm font-pixel px-6 py-3">Browse all cards →</Link>
            <Link href="/auth"  className="sdv-btn-tan text-sm font-pixel px-6 py-3">Track my cards free</Link>
          </div>
        </div>

        <p className="text-xs text-center mt-8" style={{ color: "#9a7858" }}>
          Offers change frequently. Always verify current terms on the issuer&apos;s website before applying. Last updated {LAST_UPDATED}.
        </p>
      </div>
    </div>
  );
}
