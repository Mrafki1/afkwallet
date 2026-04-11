import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "../components/Navbar";

export const metadata: Metadata = {
  title: "Best Credit Cards in Canada (2026) | PointsBinder",
  description: "Curated lists of the best Canadian credit cards by category — travel, no-fee, cash back, lounge access, and no foreign transaction fees.",
  alternates: { canonical: "/best" },
};

const CATEGORIES = [
  {
    slug: "travel-cards",
    title: "Best Travel Credit Cards",
    description: "Earn points, miles, and travel rewards. Includes Aeroplan, Membership Rewards, and more.",
    icon: "✈️",
    color: "#eff6ff",
    border: "#bfdbfe",
    textColor: "#1d4ed8",
  },
  {
    slug: "no-fee-cards",
    title: "Best No Annual Fee Cards",
    description: "Strong earn rates and welcome bonuses with zero annual cost.",
    icon: "🆓",
    color: "#f0fdf4",
    border: "#bbf7d0",
    textColor: "#15803d",
  },
  {
    slug: "cash-back-cards",
    title: "Best Cash Back Cards",
    description: "Simple, predictable rewards. Real dollars back on every purchase.",
    icon: "💵",
    color: "#fffbeb",
    border: "#fde68a",
    textColor: "#92400e",
  },
  {
    slug: "lounge-access",
    title: "Best Cards with Lounge Access",
    description: "Priority Pass, Visa Airport Companion, or Maple Leaf Lounge access.",
    icon: "🛋️",
    color: "#fdf4ff",
    border: "#e9d5ff",
    textColor: "#7e22ce",
  },
  {
    slug: "no-fx-fee",
    title: "Best No Foreign Transaction Fee Cards",
    description: "Stop losing 2.5% on every USD or international purchase.",
    icon: "🌍",
    color: "#fff1f2",
    border: "#fecdd3",
    textColor: "#be123c",
  },
];

export default function BestIndexPage() {
  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      <Navbar activePage="cards" />

      {/* Hero */}
      <div style={{ background: "#0f172a", borderBottom: "1px solid #1e293b" }}>
        <div className="max-w-5xl mx-auto px-6 py-14">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#60a5fa" }}>Best Cards</p>
          <h1 className="text-4xl font-bold mb-3 text-white" style={{ letterSpacing: "-0.03em" }}>
            Best Canadian credit cards by category
          </h1>
          <p className="text-base" style={{ color: "#94a3b8" }}>
            Curated rankings based on first-year value, welcome bonuses, and portal cash back. Updated regularly.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.slug}
              href={`/best/${cat.slug}`}
              className="group block rounded-2xl p-6 transition-all hover:shadow-md"
              style={{ background: cat.color, border: `1px solid ${cat.border}` }}
            >
              <div className="text-3xl mb-4">{cat.icon}</div>
              <h2 className="font-bold text-base mb-2 group-hover:underline" style={{ color: cat.textColor }}>
                {cat.title}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>
                {cat.description}
              </p>
              <div className="mt-4 text-sm font-semibold" style={{ color: cat.textColor }}>
                View rankings →
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/issuers" className="text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            style={{ background: "#fff", border: "1px solid #e2e8f0", color: "#64748b" }}>
            Browse by issuer →
          </Link>
          <Link href="/programs" className="text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            style={{ background: "#fff", border: "1px solid #e2e8f0", color: "#64748b" }}>
            Browse by program →
          </Link>
          <Link href="/compare" className="text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            style={{ background: "#fff", border: "1px solid #e2e8f0", color: "#64748b" }}>
            Compare cards side by side →
          </Link>
        </div>
      </div>
    </div>
  );
}
