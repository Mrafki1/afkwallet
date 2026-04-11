import Image from "next/image";
import Link from "next/link";
import { getCards, getLastVerified } from "../lib/cards-db";
import { withUtm } from "../lib/utm";
import Navbar from "../components/Navbar";

export const dynamic = "force-dynamic";

export default async function DealsPage() {
  const allCards = await getCards();
  const elevatedCards = allCards
    .filter(c => c.elevated)
    .sort((a, b) => {
      const av = parseInt(a.firstYearValue.replace(/[^0-9]/g, "")) || 0;
      const bv = parseInt(b.firstYearValue.replace(/[^0-9]/g, "")) || 0;
      return bv - av;
    })
    .slice(0, 6);

  const lastVerified = await getLastVerified();
  const LAST_UPDATED = new Date(lastVerified).toLocaleDateString("en-CA", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc", color: "#0f172a" }}>
      <Navbar activePage="deals" />

      {/* Header */}
      <div style={{ background: "#0f172a", borderBottom: "1px solid #1e293b" }}>
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center gap-2 mb-3">
            <span className="badge badge-amber">⚡ Hot Deals</span>
            <span className="text-sm" style={{ color: "#475569" }}>· Updated {LAST_UPDATED}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2" style={{ letterSpacing: "-0.02em" }}>
            Elevated offers right now
          </h1>
          <p className="text-base max-w-xl" style={{ color: "#94a3b8" }}>
            These cards are running bonuses above their normal offer — apply before they drop back.
          </p>
        </div>
      </div>

      {/* Info bar */}
      <div style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a" }}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-2">
          <span className="text-sm shrink-0">ℹ️</span>
          <p className="text-xs" style={{ color: "#92400e" }}>
            <strong>What is an elevated offer?</strong>{" "}
            Card issuers run higher-than-normal bonuses for limited windows — sometimes 20–50% more points than the standard offer.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {elevatedCards.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-4xl mb-4">🔍</p>
            <h2 className="text-xl font-bold mb-2" style={{ color: "#0f172a" }}>No elevated offers right now</h2>
            <p className="text-sm mb-6" style={{ color: "#64748b" }}>Check back soon — bonuses change weekly.</p>
            <Link href="/cards" className="btn-primary text-sm px-6 py-3">Browse all cards →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {elevatedCards.map((card, i) => {
              const sortedPortals = [...card.portals].sort((a, b) => b.bonus - a.bonus);
              const bestPortal = sortedPortals[0] ?? null;
              const base = parseInt(card.firstYearValue.replace(/[^0-9]/g, "")) || 0;
              const fyv = bestPortal ? `~$${(base + bestPortal.bonus).toLocaleString()}` : card.firstYearValue;

              return (
                <div
                  key={card.id}
                  className="bg-white rounded-2xl overflow-hidden flex flex-col"
                  style={{ border: "1px solid #e2e8f0" }}
                >
                  {/* HOT banner */}
                  <div
                    className="px-4 py-2 flex items-center justify-between"
                    style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a" }}
                  >
                    <span className="text-xs font-bold" style={{ color: "#b45309" }}>🔥 Elevated Offer</span>
                    {i === 0 && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#fef9c3", color: "#854d0e" }}>
                        #1 Pick
                      </span>
                    )}
                  </div>

                  {/* Card image */}
                  <div className="relative mx-5 mt-5 aspect-[1.8/1] rounded-xl overflow-hidden" style={{ background: "#f8fafc" }}>
                    <Image src={card.image} alt={card.name} fill className="object-contain p-3" />
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col gap-3 flex-1">

                    {/* Name */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: "#94a3b8" }}>{card.issuer}</p>
                      <h2 className="font-bold text-base leading-snug" style={{ color: "#0f172a" }}>{card.name}</h2>
                      {card.elevatedNote && (
                        <p className="text-xs mt-1 italic" style={{ color: "#92400e" }}>{card.elevatedNote}</p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg p-2.5 text-center" style={{ background: "#f0fdf4" }}>
                        <p className="text-[10px] font-medium mb-0.5" style={{ color: "#64748b" }}>Year 1 value</p>
                        <p className="font-black text-sm" style={{ color: "#15803d" }}>{fyv}</p>
                      </div>
                      <div className="rounded-lg p-2.5 text-center" style={{ background: "#eff6ff" }}>
                        <p className="text-[10px] font-medium mb-0.5" style={{ color: "#64748b" }}>Bonus</p>
                        <p className="font-bold text-xs leading-tight" style={{ color: "#1d4ed8" }}>{card.pointsBonus}</p>
                      </div>
                      <div className="rounded-lg p-2.5 text-center" style={{ background: "#f8fafc" }}>
                        <p className="text-[10px] font-medium mb-0.5" style={{ color: "#64748b" }}>Annual fee</p>
                        <p className="font-bold text-sm" style={{ color: "#0f172a" }}>{card.annualFee}</p>
                      </div>
                    </div>

                    {/* Best portal */}
                    {bestPortal && (
                      <a
                        href={withUtm(bestPortal.url, card.id, bestPortal.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors"
                        style={{ background: "#f0fdf4", border: "1.5px solid #86efac" }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: "#16a34a", color: "#fff" }}>BEST</span>
                          <span className="text-xs font-semibold" style={{ color: "#15803d" }}>{bestPortal.name}</span>
                        </div>
                        <span className="text-sm font-black" style={{ color: "#15803d" }}>+${bestPortal.bonus} cash back</span>
                      </a>
                    )}

                    {/* Other portals */}
                    {sortedPortals.length > 1 && (
                      <div className="flex flex-wrap gap-1.5">
                        {sortedPortals.slice(1).map(portal => (
                          <a
                            key={portal.name}
                            href={withUtm(portal.url, card.id, portal.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium px-2.5 py-1 rounded-full transition-colors"
                            style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#64748b" }}
                          >
                            {portal.name} +${portal.bonus}
                          </a>
                        ))}
                      </div>
                    )}

                    {/* CTAs */}
                    <div className="flex gap-2 mt-auto pt-1">
                      {bestPortal ? (
                        <a
                          href={withUtm(bestPortal.url, card.id, bestPortal.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary flex-1 text-center text-xs py-2.5"
                          style={{ borderRadius: 8 }}
                        >
                          Apply via {bestPortal.name} →
                        </a>
                      ) : (
                        <a
                          href={card.directLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary flex-1 text-center text-xs py-2.5"
                          style={{ borderRadius: 8 }}
                        >
                          Apply direct →
                        </a>
                      )}
                      <Link
                        href={`/cards/${card.id}`}
                        className="btn-secondary text-xs py-2.5 px-4 shrink-0"
                        style={{ borderRadius: 8 }}
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom CTA */}
        {elevatedCards.length > 0 && (
          <div className="mt-10 bg-white rounded-2xl p-8 text-center" style={{ border: "1px solid #e2e8f0" }}>
            <h3 className="text-lg font-bold mb-2 tracking-tight" style={{ color: "#0f172a" }}>Not seeing what you need?</h3>
            <p className="text-sm mb-5" style={{ color: "#64748b" }}>
              Browse all 155+ Canadian cards filtered by program, fee, issuer, or first-year bonus.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/cards" className="btn-primary text-sm px-6 py-2.5">Browse all cards →</Link>
              <Link href="/auth"  className="btn-secondary text-sm px-6 py-2.5">Track my cards free</Link>
            </div>
          </div>
        )}

        <p className="text-xs text-center mt-6" style={{ color: "#94a3b8" }}>
          Offers change frequently. Always verify current terms before applying. Last updated {LAST_UPDATED}.
        </p>
      </div>
    </div>
  );
}
