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
      <a href={directLink} target="_blank" rel="noopener noreferrer"
        className="w-full text-center bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-3 rounded-xl text-sm transition-colors block">
        Apply direct →
      </a>
    );
  }
  const best = portals[0];
  return (
    <a href={best.url} target="_blank" rel="noopener noreferrer"
      className="w-full text-center bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-3 rounded-xl text-sm transition-colors block">
      Apply via {best.name} — get ${best.bonus} back →
    </a>
  );
}

export default function DealsPage() {
  return (
    <div className="min-h-screen bg-[#080d1a]">
      <Navbar activePage="deals" />

      {/* Header */}
      <div className="bg-[#080d1a] pt-16 pb-12 border-b border-slate-800/50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-amber-400 text-xs font-pixel uppercase tracking-widest">⚡ Hot Deals</span>
            <span className="text-slate-600 text-xs">· Updated {LAST_UPDATED}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-4">
            Elevated offers.<br />
            <span className="text-amber-400">Limited time deals.</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
            These cards are running welcome bonuses above their normal offer — some for a limited time, some while stock lasts. We update this page when offers change.
          </p>
        </div>
      </div>

      {/* Info bar */}
      <div className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-start gap-3">
          <span className="text-amber-400 text-lg shrink-0">ℹ️</span>
          <p className="text-sm text-slate-400 leading-relaxed">
            <strong className="text-white">What does &ldquo;elevated&rdquo; mean?</strong> Card issuers periodically run higher-than-normal welcome bonuses. An elevated offer might be 20–50% more points than the standard public offer. These windows are time-limited — when they end, the bonus drops back down.
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="flex flex-col gap-8">
          {elevatedCards.map((card, i) => (
            <div key={card.id} className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden hover:border-amber-400/30 transition-colors">

              {/* Top banner */}
              <div className="bg-amber-400/10 border-b border-amber-400/20 px-6 py-2.5 flex items-center gap-2">
                <span className="text-amber-400 text-xs font-black uppercase tracking-widest">⚡ Elevated Offer</span>
                <span className="text-slate-600 text-xs">·</span>
                <span className="text-slate-400 text-xs">{card.elevatedNote}</span>
              </div>

              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row gap-6">

                  {/* Card image */}
                  <div className="relative w-full sm:w-48 shrink-0 aspect-[1.586/1] rounded-2xl overflow-hidden bg-slate-800 shadow-md">
                    <Image src={card.image} alt={card.name} fill className="object-contain p-3" />
                  </div>

                  {/* Info */}
                  <div className="flex flex-col gap-4 flex-1">
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-0.5">{card.issuer}</p>
                      <h2 className="text-xl font-black text-white">{card.name}</h2>
                      <p className="text-sm text-slate-500 mt-0.5">{card.program}</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-800 rounded-xl p-3 text-center">
                        <p className="text-xs text-amber-400/70 font-medium mb-0.5">1st Year Value</p>
                        <p className="font-bold text-amber-400 text-sm">{card.firstYearValue}</p>
                      </div>
                      <div className="bg-slate-800 rounded-xl p-3 text-center">
                        <p className="text-xs text-slate-500 font-medium mb-0.5">Welcome Bonus</p>
                        <p className="font-bold text-white text-xs leading-tight">{card.pointsBonus}</p>
                      </div>
                      <div className="bg-slate-800 rounded-xl p-3 text-center">
                        <p className="text-xs text-slate-500 font-medium mb-0.5">Annual Fee</p>
                        <p className="font-bold text-white text-sm">{card.annualFee}</p>
                      </div>
                      <div className="bg-slate-800 rounded-xl p-3 text-center">
                        <p className="text-xs text-slate-500 font-medium mb-0.5">MSR</p>
                        <p className="font-bold text-white text-xs leading-tight">{card.msr}</p>
                      </div>
                    </div>

                    {/* Portal comparison */}
                    {card.portals.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Best portal cash back</p>
                        <div className="flex flex-wrap gap-2">
                          {card.portals.map((portal, pi) => (
                            <a key={portal.name} href={portal.url} target="_blank" rel="noopener noreferrer"
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${pi === 0
                                ? "bg-emerald-400/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-400/20"
                                : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"}`}>
                              {pi === 0 && <span className="text-emerald-400">★</span>}
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
                      <Link href={`/cards/${card.id}`}
                        className="flex-none text-center border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium py-3 px-5 rounded-xl text-sm transition-colors">
                        Full details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Editor pick */}
              {i === 0 && (
                <div className="border-t border-amber-400/20 bg-amber-400/5 px-6 py-3">
                  <p className="text-xs text-amber-400 font-medium">⭐ Editor&apos;s pick — highest first-year value of any current elevated offer</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 bg-slate-900 rounded-3xl border border-slate-800 p-8 text-center">
          <h3 className="text-xl font-black text-white mb-2">Not seeing what you need?</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
            Browse all 75+ Canadian cards — filtered by program, fee, issuer, or first-year value.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/cards" className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-6 py-3 rounded-xl text-sm transition-colors">
              Browse all cards →
            </Link>
            <Link href="/auth" className="border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium px-6 py-3 rounded-xl text-sm transition-colors">
              Track my cards free
            </Link>
          </div>
        </div>

        <p className="text-xs text-slate-600 text-center mt-8">
          Offers change frequently. Always verify current terms on the issuer&apos;s website before applying. Last updated {LAST_UPDATED}.
        </p>
      </div>
    </div>
  );
}
