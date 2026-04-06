import Link from "next/link";
import Navbar from "../components/Navbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About PointsBinder — How We Work",
  description: "PointsBinder is a Canadian credit card comparison and tracker built to show you which rebate portal pays the most for each card. Learn how our data is collected and updated.",
  alternates: { canonical: "/about" },
};

const METHODOLOGY = [
  {
    step: "01",
    title: "Card catalog — scraped from CreditCardGenius",
    body: "Our card database is built by scraping the CreditCardGenius API directly, capturing the official annual fee, welcome bonus, earn rates, insurance coverage, and first-year value estimate for every Canadian credit card. This runs automatically every Monday.",
  },
  {
    step: "02",
    title: "Portal bonuses — scraped from 4 portals",
    body: "Every Monday we scrape GCR (Great Canadian Rebates), Frugal Flyer, FinlyWealth, and CreditCardGenius GeniusCash for their current rebate offers. Each portal's bonus and card-specific URL is matched to our card database by name. The highest bonus is shown as \"BEST\" on each card.",
  },
  {
    step: "03",
    title: "Link verification — checked daily",
    body: "Every portal link in our database is checked daily. If a link returns a 404 or redirects to a homepage (meaning the offer has expired), it is automatically removed. This prevents you from clicking through to a dead offer.",
  },
  {
    step: "04",
    title: "First-year value — bonus + portal stacked",
    body: "The first-year value shown on every card is the CCG base estimate (welcome bonus minus annual fee) plus the best available portal cash back. This is the total you could realistically collect in year one if you apply through the highest-paying portal.",
  },
];

const PORTALS = [
  { name: "GCR", full: "Great Canadian Rebates", url: "https://www.greatcanadianrebates.ca", what: "Cash back on application, paid after card is approved and active" },
  { name: "FF", full: "Frugal Flyer", url: "https://frugalflyer.ca", what: "FlyerFunds (redeemable for gift cards or cash)" },
  { name: "FW", full: "FinlyWealth", url: "https://finlywealth.com", what: "Cash back deposited to your FinlyWealth account" },
  { name: "CCG", full: "CreditCardGenius GeniusCash", url: "https://creditcardgenius.ca/offers", what: "GeniusCash credited after card approval" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ background: "#ffffff", color: "#0f172a" }}>
      <Navbar />

      {/* ── Header ── */}
      <div style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-3xl mx-auto px-6 py-16">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#2563eb" }}>About PointsBinder</p>
          <h1 className="text-4xl font-bold tracking-tight mb-5" style={{ color: "#0f172a", letterSpacing: "-0.03em" }}>
            Built to answer one question:<br />which portal pays the most?
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: "#475569" }}>
            PointsBinder is a Canadian credit card aggregator that automatically tracks rebate portal bonuses across GCR, Frugal Flyer, FinlyWealth, and CreditCardGenius — and shows you the highest payout for each card, updated every week.
          </p>
        </div>
      </div>

      {/* ── Why we built it ── */}
      <div style={{ borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold tracking-tight mb-6" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>Why this exists</h2>
          <div className="prose prose-slate max-w-none" style={{ color: "#475569", lineHeight: 1.8 }}>
            <p className="mb-4">
              Canadian credit card churning communities — Reddit&apos;s r/PersonalFinanceCanada, RedFlagDeals, and various blogs — have long discussed rebate portals as a way to stack extra cash on top of a welcome bonus. The problem is that portal bonuses change constantly, vary by card, and are spread across four different sites with no central comparison.
            </p>
            <p className="mb-4">
              Before PointsBinder, checking which portal paid the most for a specific card meant opening four tabs, searching for the card on each site, and manually comparing numbers. Most people skipped this step and left $50–$200 on the table for every card they applied for.
            </p>
            <p className="mb-4">
              PointsBinder automates that process. Our scraper runs every week and pushes the current portal bonus directly into each card&apos;s detail page. You see the comparison without doing the work.
            </p>
            <p>
              The tracker was added because the other half of maximizing credit card rewards is not forfeiting bonuses you&apos;ve already earned. Missing an MSR deadline or forgetting to cancel before an annual fee is a common and expensive mistake. The dashboard gives you the deadlines and the progress bar in one place.
            </p>
          </div>
        </div>
      </div>

      {/* ── Methodology ── */}
      <div style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold tracking-tight mb-2" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>How the data works</h2>
          <p className="mb-10" style={{ color: "#64748b" }}>Everything is automated. No manual entry, no spreadsheets.</p>

          <div className="flex flex-col gap-8">
            {METHODOLOGY.map(item => (
              <div key={item.step} className="flex gap-5">
                <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "#eff6ff", color: "#2563eb", border: "2px solid #bfdbfe" }}>
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold mb-2" style={{ color: "#0f172a" }}>{item.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Update schedule */}
          <div className="mt-10 rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#94a3b8" }}>Update Schedule</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { freq: "Every Monday",  label: "Card catalog re-scraped" },
                { freq: "Every Monday",  label: "Portal bonuses updated" },
                { freq: "Every day",     label: "Portal links verified" },
              ].map(row => (
                <div key={row.label} className="rounded-xl p-4" style={{ background: "#f8fafc" }}>
                  <p className="text-sm font-bold mb-0.5" style={{ color: "#2563eb" }}>{row.freq}</p>
                  <p className="text-xs" style={{ color: "#64748b" }}>{row.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── The portals ── */}
      <div style={{ borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold tracking-tight mb-2" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>The four portals we track</h2>
          <p className="mb-8 text-sm" style={{ color: "#64748b" }}>These are independent third-party services. PointsBinder is not affiliated with any of them.</p>

          <div className="flex flex-col gap-4">
            {PORTALS.map(p => (
              <div key={p.name} className="rounded-2xl p-5 flex gap-5 items-start" style={{ border: "1px solid #e2e8f0" }}>
                <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black"
                  style={{ background: "#eff6ff", color: "#2563eb" }}>
                  {p.name}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm" style={{ color: "#0f172a" }}>{p.full}</h3>
                    <a href={p.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs" style={{ color: "#94a3b8" }}>↗</a>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>{p.what}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Disclosure ── */}
      <div style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold tracking-tight mb-6" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>Disclosures</h2>
          <div className="flex flex-col gap-4 text-sm leading-relaxed" style={{ color: "#64748b" }}>
            <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
              <p className="font-semibold mb-1" style={{ color: "#0f172a" }}>Not financial advice</p>
              <p>PointsBinder is an information tool. Nothing on this site constitutes financial, tax, or legal advice. Credit card rewards and portal bonuses change frequently — always verify current terms directly with the issuer and portal before applying.</p>
            </div>
            <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
              <p className="font-semibold mb-1" style={{ color: "#0f172a" }}>Data accuracy</p>
              <p>We make every effort to keep portal bonus data accurate and current. Bonuses are scraped weekly and links are verified daily — but figures may be out of date between update cycles. The portal&apos;s own site is always the authoritative source.</p>
            </div>
            <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
              <p className="font-semibold mb-1" style={{ color: "#0f172a" }}>Affiliate relationships</p>
              <p>PointsBinder may earn a commission if you apply for a card through links on this site. This does not affect how cards are ranked or which portals are shown. The portal with the highest current bonus is always shown first, regardless of any commercial relationship.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Contact ── */}
      <div>
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold tracking-tight mb-4" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>Get in touch</h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: "#64748b" }}>
            Found a data error? Portal bonus that doesn&apos;t match what you see on the site? We want to know. Reach out at{" "}
            <a href="mailto:hello@pointsbinder.com" className="font-medium hover:underline" style={{ color: "#2563eb" }}>
              hello@pointsbinder.com
            </a>
          </p>
          <div className="flex gap-3">
            <Link href="/cards" className="text-sm font-semibold px-5 py-2.5 rounded-xl text-white" style={{ background: "#2563eb" }}>
              Browse cards →
            </Link>
            <Link href="/blog" className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors" style={{ border: "1px solid #e2e8f0", color: "#64748b" }}>
              Read the guides
            </Link>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{ background: "#0f172a", borderTop: "1px solid #1e293b" }} className="py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 flex items-center justify-center rounded-md text-white text-xs font-bold" style={{ background: "#2563eb" }}>P</div>
            <span className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>PointsBinder</span>
          </div>
          <div className="flex gap-6 text-sm">
            {[
              { href: "/cards", label: "Cards" },
              { href: "/deals", label: "Hot Deals" },
              { href: "/blog",  label: "Blog" },
              { href: "/about", label: "About" },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{ color: "#64748b" }} className="hover:text-white transition-colors">{l.label}</Link>
            ))}
          </div>
          <p className="text-xs" style={{ color: "#334155" }}>Not financial advice. Verify all offers before applying.</p>
        </div>
      </footer>
    </div>
  );
}
