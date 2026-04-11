import Link from "next/link";
import { getCards } from "../lib/cards-db";
import { slugify } from "../lib/slug";
import Navbar from "../components/Navbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Canadian Credit Cards by Rewards Program | PointsBinder",
  description: "Browse Canadian credit cards by rewards program — Aeroplan, Membership Rewards, Scene+, Air Miles, Avion, and more.",
  alternates: { canonical: "/programs" },
};

const PROGRAM_DESCRIPTIONS: Record<string, string> = {
  "Aeroplan":            "Air Canada's frequent flyer program. Points transfer to 45+ airline partners.",
  "Membership Rewards":  "American Express's flexible points. Transfer to Aeroplan, Avios, and more.",
  "RBC Avion":           "RBC's premium travel rewards program with airline transfer options.",
  "Scene+":              "Scotiabank's rewards program for movies, dining, travel, and groceries.",
  "Air Miles":           "Canada's largest coalition loyalty program. Redeem for travel and merchandise.",
  "TD Rewards":          "TD Bank's flexible points redeemable for travel, cash, and merchandise.",
  "WestJet Rewards":     "WestJet dollars — straightforward cash value redeemed on WestJet flights.",
  "Cash Back":           "Straightforward cash back on everyday spending. No points to manage.",
  "Rewards":             "General rewards points redeemable through the issuer's travel or merchandise portal.",
};

export default async function ProgramsIndexPage() {
  const cards = await getCards();

  const programMap = new Map<string, typeof cards>();
  for (const card of cards) {
    if (!programMap.has(card.program)) programMap.set(card.program, []);
    programMap.get(card.program)!.push(card);
  }

  const programs = [...programMap.entries()].sort((a, b) => b[1].length - a[1].length);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pointsbinder.com";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
      { "@type": "ListItem", "position": 2, "name": "Rewards Programs", "item": `${siteUrl}/programs` },
    ],
  };

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />

      {/* Hero */}
      <div style={{ background: "#0f172a" }}>
        <div className="max-w-5xl mx-auto px-6 py-14">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#60a5fa" }}>Browse by Program</p>
          <h1 className="text-4xl font-bold mb-3" style={{ color: "#ffffff", letterSpacing: "-0.03em" }}>
            Credit Cards by Rewards Program
          </h1>
          <p className="text-base" style={{ color: "#94a3b8" }}>
            {cards.length} Canadian credit cards across {programs.length} rewards programs.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map(([program, programCards]) => (
            <Link
              key={program}
              href={`/programs/${slugify(program)}`}
              className="group bg-white border border-gray-100 rounded-2xl p-6 hover:border-blue-200 hover:shadow-md transition-all"
            >
              <h2 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-blue-600 transition-colors">{program}</h2>
              <p className="text-sm text-gray-500 mb-3">{programCards.length} card{programCards.length !== 1 ? "s" : ""}</p>
              {PROGRAM_DESCRIPTIONS[program] && (
                <p className="text-xs text-gray-400 leading-relaxed mb-3">{PROGRAM_DESCRIPTIONS[program]}</p>
              )}
              <p className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors">View cards →</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
