import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getCards } from "../../lib/cards-db";
import { slugify, nameFromSlug } from "../../lib/slug";
import Navbar from "../../components/Navbar";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const cards = await getCards();
  const issuers = [...new Set(cards.map(c => c.issuer))];
  return issuers.map(issuer => ({ issuer: slugify(issuer) }));
}

export async function generateMetadata({ params }: { params: Promise<{ issuer: string }> }): Promise<Metadata> {
  const { issuer: issuerSlug } = await params;
  const cards = await getCards();
  const issuerName = nameFromSlug(issuerSlug, [...new Set(cards.map(c => c.issuer))]);
  if (!issuerName) return {};
  const issuerCards = cards.filter(c => c.issuer === issuerName);
  return {
    title: `${issuerName} Credit Cards Canada 2026 | PointsBinder`,
    description: `Compare all ${issuerCards.length} ${issuerName} credit cards available in Canada. Welcome bonuses, annual fees, and rebate portal offers in one place.`,
    alternates: { canonical: `/issuers/${issuerSlug}` },
    keywords: [`${issuerName} credit card`, `${issuerName} Canada`, "credit card Canada", "welcome bonus"],
  };
}

export default async function IssuerPage({ params }: { params: Promise<{ issuer: string }> }) {
  const { issuer: issuerSlug } = await params;
  const cards = await getCards();
  const issuerName = nameFromSlug(issuerSlug, [...new Set(cards.map(c => c.issuer))]);
  if (!issuerName) notFound();

  const issuerCards = cards.filter(c => c.issuer === issuerName).sort((a, b) => {
    // Sort: elevated first, then by firstYearValue desc
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
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
        { "@type": "ListItem", "position": 2, "name": "Issuers", "item": `${siteUrl}/issuers` },
        { "@type": "ListItem", "position": 3, "name": issuerName, "item": `${siteUrl}/issuers/${issuerSlug}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": `${issuerName} Credit Cards`,
      "description": `All ${issuerName} credit cards available in Canada`,
      "numberOfItems": issuerCards.length,
      "itemListElement": issuerCards.map((card, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "url": `${siteUrl}/cards/${card.id}`,
        "name": card.name,
      })),
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />

      {/* Hero */}
      <div style={{ background: "#0f172a" }}>
        <div className="max-w-5xl mx-auto px-6 py-14">
          <nav className="flex items-center gap-2 text-xs mb-4" style={{ color: "#64748b" }}>
            <Link href="/issuers" className="hover:text-blue-400 transition-colors">All Issuers</Link>
            <span>/</span>
            <span style={{ color: "#94a3b8" }}>{issuerName}</span>
          </nav>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#60a5fa" }}>Issuer</p>
          <h1 className="text-4xl font-bold mb-3" style={{ color: "#ffffff", letterSpacing: "-0.03em" }}>
            {issuerName} Credit Cards
          </h1>
          <p className="text-base" style={{ color: "#94a3b8" }}>
            {issuerCards.length} card{issuerCards.length !== 1 ? "s" : ""} available in Canada
          </p>
        </div>
      </div>

      {/* Cards grid */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {issuerCards.map(card => {
            const bestPortal = [...card.portals].sort((a, b) => b.bonus - a.bonus)[0] ?? null;
            return (
              <Link
                key={card.id}
                href={`/cards/${card.id}`}
                className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-blue-200 hover:shadow-md transition-all flex flex-col"
              >
                {/* Card image */}
                <div className={`relative h-36 bg-gradient-to-br ${card.gradient} flex items-center justify-center`}>
                  <div className="relative w-44 aspect-[1.586/1]">
                    <Image src={card.image} alt={card.name} fill className="object-contain drop-shadow-lg" />
                  </div>
                  {card.elevated && (
                    <span className="absolute top-3 left-3 text-xs font-bold bg-red-600 text-white px-2 py-0.5 rounded-full">
                      🔥 HOT
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">{card.program}</p>
                    <h2 className="font-bold text-gray-900 text-sm leading-tight group-hover:text-blue-600 transition-colors">{card.name}</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-gray-400 mb-0.5">Annual fee</p>
                      <p className="font-bold text-gray-800">{card.annualFee}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg px-3 py-2">
                      <p className="text-blue-400 mb-0.5">1st year value</p>
                      <p className="font-bold text-blue-700">{card.firstYearValue}</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 leading-snug">{card.pointsBonus}</p>

                  {bestPortal && (
                    <p className="text-xs font-semibold text-green-700">
                      +${bestPortal.bonus} via {bestPortal.name}
                    </p>
                  )}
                </div>

                <div className="px-5 pb-4">
                  <span className="text-xs font-semibold text-blue-600 group-hover:underline">View offer →</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
