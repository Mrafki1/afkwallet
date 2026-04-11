import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCards } from "../../lib/cards-db";
import type { Card } from "../../data/cards";
import { withUtm } from "../../lib/utm";
import Navbar from "../../components/Navbar";

export const dynamic = "force-dynamic";

// ── Category definitions ──────────────────────────────────────────────────────

type CategoryMeta = {
  slug: string;
  title: string;
  headline: string;
  description: string;
  filter: (card: Card) => boolean;
};

const CATEGORIES: CategoryMeta[] = [
  {
    slug: "travel-cards",
    title: "Best Travel Credit Cards in Canada (2026)",
    headline: "Best travel credit cards",
    description:
      "Earn points, miles, and travel rewards with the top Canadian travel credit cards. We show the exact first-year value including the best rebate portal payout.",
    filter: (c) =>
      c.program !== "Cash Back" &&
      !c.tags.includes("Cash Back") &&
      (c.tags.some(t => ["Travel", "Transfer Partners", "Lounge Access", "Aeroplan", "Free Checked Bag", "Hotel Rewards"].includes(t)) ||
        ["Aeroplan", "Membership Rewards", "Avion", "Aventura", "Scene+", "Air Miles", "WestJet Dollars", "Marriott Bonvoy", "BMO Rewards"].includes(c.program)),
  },
  {
    slug: "no-fee-cards",
    title: "Best No-Fee Credit Cards in Canada (2026)",
    headline: "Best no annual fee credit cards",
    description:
      "Earn rewards without paying an annual fee. These cards offer strong earn rates and welcome bonuses with zero annual cost.",
    filter: (c) => c.annualFeeNum === 0 || c.tags.includes("No Annual Fee"),
  },
  {
    slug: "cash-back-cards",
    title: "Best Cash Back Credit Cards in Canada (2026)",
    headline: "Best cash back credit cards",
    description:
      "The simplest way to earn from every purchase. These cards put real dollars back in your account — no points math required.",
    filter: (c) => c.program === "Cash Back" || c.tags.includes("Cash Back"),
  },
  {
    slug: "lounge-access",
    title: "Best Credit Cards with Lounge Access in Canada (2026)",
    headline: "Best credit cards with airport lounge access",
    description:
      "Turn any departure into a premium experience. These cards include free airport lounge access — Priority Pass, Visa Airport Companion, or Maple Leaf Lounges.",
    filter: (c) => c.tags.includes("Lounge Access") || !!(c.loungeDetails),
  },
  {
    slug: "no-fx-fee",
    title: "Best No Foreign Transaction Fee Cards in Canada (2026)",
    headline: "Best no foreign transaction fee credit cards",
    description:
      "Stop losing 2.5% on every USD or international purchase. These cards charge zero foreign transaction fees.",
    filter: (c) => c.foreignFee === "0%" || c.tags.includes("No FX Fee") || c.tags.includes("No FX Fees"),
  },
];

export async function generateStaticParams() {
  return CATEGORIES.map(c => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const meta = CATEGORIES.find(c => c.slug === category);
  if (!meta) return {};
  return {
    title: `${meta.title} | PointsBinder`,
    description: meta.description,
    alternates: { canonical: `/best/${category}` },
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function BestOfPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const meta = CATEGORIES.find(c => c.slug === category);
  if (!meta) notFound();

  const allCards = await getCards();
  const filtered = allCards
    .filter(meta.filter)
    .sort((a, b) => {
      // Elevated first, then by first-year value
      if (a.elevated && !b.elevated) return -1;
      if (!a.elevated && b.elevated) return 1;
      const av = parseInt(a.firstYearValue.replace(/[^0-9]/g, "")) || 0;
      const bv = parseInt(b.firstYearValue.replace(/[^0-9]/g, "")) || 0;
      return bv - av;
    });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pointsbinder.com";

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": meta.title,
      "description": meta.description,
      "url": `${siteUrl}/best/${category}`,
      "numberOfItems": filtered.length,
      "itemListElement": filtered.slice(0, 10).map((card, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "name": card.name,
        "url": `${siteUrl}/cards/${card.id}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
        { "@type": "ListItem", "position": 2, "name": "Best Cards", "item": `${siteUrl}/best` },
        { "@type": "ListItem", "position": 3, "name": meta.headline, "item": `${siteUrl}/best/${category}` },
      ],
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar activePage="best" />

      {/* Hero */}
      <div style={{ background: "#0f172a", borderBottom: "1px solid #1e293b" }}>
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="flex items-center gap-2 text-xs font-medium mb-4" style={{ color: "#64748b" }}>
            <Link href="/" style={{ color: "#64748b" }} className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span style={{ color: "#94a3b8" }}>{meta.headline}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3" style={{ letterSpacing: "-0.02em" }}>
            {meta.headline}
          </h1>
          <p className="text-lg max-w-2xl" style={{ color: "#94a3b8" }}>
            {meta.description}
          </p>
          <p className="mt-4 text-sm" style={{ color: "#475569" }}>
            {filtered.length} cards · Ranked by first-year value · Portal bonuses included
          </p>
        </div>
      </div>

      {/* Other categories */}
      <div style={{ background: "#f1f5f9", borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap gap-2">
          {CATEGORIES.filter(c => c.slug !== category).map(c => (
            <Link
              key={c.slug}
              href={`/best/${c.slug}`}
              className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
              style={{ background: "#fff", border: "1px solid #e2e8f0", color: "#64748b" }}
            >
              {c.headline.replace("Best ", "").replace(" in Canada (2026)", "").replace(" credit cards", " →")}
            </Link>
          ))}
        </div>
      </div>

      {/* Card grid */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-500 py-20">No cards found in this category.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((card, i) => {
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
                  {/* Top banner: rank + HOT badge */}
                  <div
                    className="px-4 py-2 flex items-center justify-between"
                    style={{ background: card.elevated ? "#fffbeb" : "#f8fafc", borderBottom: `1px solid ${card.elevated ? "#fde68a" : "#f1f5f9"}` }}
                  >
                    {card.elevated ? (
                      <span className="text-xs font-bold" style={{ color: "#b45309" }}>🔥 Elevated Offer</span>
                    ) : (
                      <span className="text-xs font-bold" style={{ color: "#94a3b8" }}>#{i + 1}</span>
                    )}
                    {i === 0 && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#eff6ff", color: "#1d4ed8" }}>
                        #1 Pick
                      </span>
                    )}
                  </div>

                  {/* Card image */}
                  <Link href={`/cards/${card.id}`} className="relative mx-5 mt-5 aspect-[1.8/1] rounded-xl overflow-hidden block" style={{ background: "#f8fafc" }}>
                    <Image src={card.image} alt={card.name} fill className="object-contain p-3 hover:scale-105 transition-transform duration-200" />
                  </Link>

                  {/* Content */}
                  <div className="p-5 flex flex-col gap-3 flex-1">

                    {/* Name */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: "#94a3b8" }}>{card.issuer}</p>
                      <h2 className="font-bold text-base leading-snug" style={{ color: "#0f172a" }}>{card.name}</h2>
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
                        <span className="text-sm font-black" style={{ color: "#15803d" }}>+${bestPortal.bonus}</span>
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

        <p className="mt-8 text-xs text-center" style={{ color: "#94a3b8" }}>
          Rankings based on estimated first-year value including portal cash back. Individual results vary. Always verify offer terms before applying.
        </p>
      </div>
    </div>
  );
}
