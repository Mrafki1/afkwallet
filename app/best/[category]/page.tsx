import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCards } from "../../lib/cards-db";
import type { Card } from "../../data/cards";
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
      <Navbar activePage="cards" />

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

      {/* Card list */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-500 py-20">No cards found in this category.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((card, i) => {
              const bestPortal = [...card.portals].sort((a, b) => b.bonus - a.bonus)[0] ?? null;
              const fyv = parseInt(card.firstYearValue.replace(/[^0-9]/g, "")) || 0;
              const fyvWithPortal = bestPortal ? `~$${fyv + bestPortal.bonus}` : card.firstYearValue;

              return (
                <div
                  key={card.id}
                  className="bg-white rounded-2xl flex flex-col sm:flex-row gap-6 items-start overflow-hidden"
                  style={{ border: "1px solid #e2e8f0" }}
                >
                  {/* Rank */}
                  <div
                    className="hidden sm:flex w-16 shrink-0 items-center justify-center self-stretch text-2xl font-black"
                    style={{ background: i === 0 ? "#eff6ff" : "#f8fafc", color: i === 0 ? "#2563eb" : "#cbd5e1" }}
                  >
                    #{i + 1}
                  </div>

                  {/* Card image */}
                  <div className="sm:hidden w-full h-1.5" style={{ background: i === 0 ? "#2563eb" : "#e2e8f0" }} />
                  <div className="px-5 pt-5 sm:pt-5 sm:pl-0 sm:py-5 shrink-0">
                    <div className="relative w-32 h-20 rounded-xl overflow-hidden" style={{ background: "#f8fafc" }}>
                      <Image src={card.image} alt={card.name} fill className="object-contain p-2" />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 px-5 pb-5 sm:py-5 sm:px-0 flex flex-col gap-3">
                    <div>
                      {card.elevated && (
                        <span className="text-xs font-bold bg-red-600 text-white px-2 py-0.5 rounded-full mr-2">🔥 HOT</span>
                      )}
                      <p className="text-xs font-semibold uppercase tracking-wide inline" style={{ color: "#94a3b8" }}>{card.issuer}</p>
                      <h2 className="font-bold text-lg mt-0.5" style={{ color: "#0f172a" }}>{card.name}</h2>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <div className="rounded-lg px-3 py-2" style={{ background: "#f0fdf4" }}>
                        <p className="text-xs font-medium mb-0.5" style={{ color: "#64748b" }}>First-year value</p>
                        <p className="font-black text-sm" style={{ color: "#15803d" }}>{fyvWithPortal}</p>
                      </div>
                      <div className="rounded-lg px-3 py-2" style={{ background: "#eff6ff" }}>
                        <p className="text-xs font-medium mb-0.5" style={{ color: "#64748b" }}>Welcome bonus</p>
                        <p className="font-bold text-sm" style={{ color: "#1d4ed8" }}>{card.pointsBonus}</p>
                      </div>
                      <div className="rounded-lg px-3 py-2" style={{ background: "#f8fafc" }}>
                        <p className="text-xs font-medium mb-0.5" style={{ color: "#64748b" }}>Annual fee</p>
                        <p className="font-bold text-sm" style={{ color: "#0f172a" }}>{card.annualFee}</p>
                      </div>
                      {bestPortal && (
                        <div className="rounded-lg px-3 py-2" style={{ background: "#fefce8" }}>
                          <p className="text-xs font-medium mb-0.5" style={{ color: "#64748b" }}>Best portal</p>
                          <p className="font-bold text-sm" style={{ color: "#92400e" }}>+${bestPortal.bonus} via {bestPortal.name}</p>
                        </div>
                      )}
                    </div>

                    {card.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {card.tags.slice(0, 4).map(tag => (
                          <span key={tag} className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#f1f5f9", color: "#64748b" }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="px-5 pb-5 sm:py-5 sm:pr-6 sm:pl-0 flex items-center sm:self-center">
                    <Link
                      href={`/cards/${card.id}`}
                      className="btn-primary text-sm px-5 py-2.5 whitespace-nowrap"
                    >
                      View details →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-10 p-5 rounded-xl text-sm" style={{ background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e" }}>
          Rankings are based on estimated first-year value including portal cash back. Individual results vary. Always verify offer terms before applying.
        </div>
      </div>
    </div>
  );
}
