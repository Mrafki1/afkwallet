import Link from "next/link";
import { getCards } from "../lib/cards-db";
import { slugify } from "../lib/slug";
import Navbar from "../components/Navbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Canadian Credit Cards by Issuer | PointsBinder",
  description: "Browse Canadian credit cards by bank or issuer — American Express, TD, RBC, CIBC, BMO, Scotiabank, and more.",
  alternates: { canonical: "/issuers" },
};

export default async function IssuersIndexPage() {
  const cards = await getCards();

  // Build issuer → cards map
  const issuerMap = new Map<string, typeof cards>();
  for (const card of cards) {
    if (!issuerMap.has(card.issuer)) issuerMap.set(card.issuer, []);
    issuerMap.get(card.issuer)!.push(card);
  }

  // Sort issuers by card count desc
  const issuers = [...issuerMap.entries()].sort((a, b) => b[1].length - a[1].length);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pointsbinder.com";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
      { "@type": "ListItem", "position": 2, "name": "Issuers", "item": `${siteUrl}/issuers` },
    ],
  };

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />

      {/* Hero */}
      <div style={{ background: "#0f172a" }}>
        <div className="max-w-5xl mx-auto px-6 py-14">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#60a5fa" }}>Browse by Bank</p>
          <h1 className="text-4xl font-bold mb-3" style={{ color: "#ffffff", letterSpacing: "-0.03em" }}>
            Credit Cards by Issuer
          </h1>
          <p className="text-base" style={{ color: "#94a3b8" }}>
            {cards.length} Canadian credit cards across {issuers.length} issuers.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {issuers.map(([issuer, issuerCards]) => {
            const bestFYV = issuerCards.reduce((best, c) => {
              const v = parseInt(c.firstYearValue.replace(/[^0-9]/g, "")) || 0;
              return v > best ? v : best;
            }, 0);
            return (
              <Link
                key={issuer}
                href={`/issuers/${slugify(issuer)}`}
                className="group bg-white border border-gray-100 rounded-2xl p-6 hover:border-blue-200 hover:shadow-md transition-all"
              >
                <h2 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-blue-600 transition-colors">{issuer}</h2>
                <p className="text-sm text-gray-500 mb-3">{issuerCards.length} card{issuerCards.length !== 1 ? "s" : ""}</p>
                {bestFYV > 0 && (
                  <p className="text-xs font-semibold" style={{ color: "#2563eb" }}>
                    Up to ~${bestFYV.toLocaleString()} first-year value
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2 group-hover:text-blue-500 transition-colors">View cards →</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
