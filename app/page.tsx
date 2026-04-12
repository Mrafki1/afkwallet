"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "./components/Navbar";
import { cards } from "./data/cards";
import QuizModal from "./components/QuizModal";
import EmailCapture from "./components/EmailCapture";

// ── Find My Card button ───────────────────────────────────────────────────────
function FindMyCardButton() {
  return (
    <button
      className="btn-primary text-sm px-6 py-3"
      onClick={() => window.dispatchEvent(new CustomEvent("pb:open-quiz"))}
    >
      Find my best card →
    </button>
  );
}

// ── Data ─────────────────────────────────────────────────────────────────────

const FEATURED_CARD_IDS = ["amex-plat", "amex-cobalt", "scotia-amex-gold"];
const FEATURED_CARD_BADGES: Record<string, { label: string; cls: string }> = {
  "amex-plat":        { label: "Best Overall",       cls: "badge-amber" },
  "amex-cobalt":      { label: "Best Everyday Earn", cls: "badge-blue"  },
  "scotia-amex-gold": { label: "Best No-Fee Value",  cls: "badge-green" },
};
const FEATURED_CARDS = FEATURED_CARD_IDS.map(id => {
  const card = cards.find(c => c.id === id)!;
  const bestPortal = [...card.portals].sort((a, b) => b.bonus - a.bonus)[0];
  const badge = FEATURED_CARD_BADGES[id];
  const base = parseInt(card.firstYearValue.replace(/[^0-9]/g, "")) || 0;
  const effectiveFyv = bestPortal ? `~$${(base + bestPortal.bonus).toLocaleString()}` : card.firstYearValue;
  return {
    src: card.image,
    alt: card.name,
    issuer: card.issuer,
    name: card.name,
    value: effectiveFyv,
    portal: bestPortal ? `+$${bestPortal.bonus} via ${bestPortal.name}` : "Direct apply",
    badge: badge.label,
    badgeClass: badge.cls,
    href: `/cards/${card.id}`,
  };
});

const HOW_IT_WORKS_STEPS = [
  {
    number: "01",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
      </svg>
    ),
    title: "Find the right card",
    body: "Browse 130+ Canadian credit cards. Filter by program, issuer, or fee. We show the full first-year value — welcome bonus plus portal cash back.",
  },
  {
    number: "02",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
      </svg>
    ),
    title: "Apply via the best portal",
    body: "Portals like GCR and Frugal Flyer pay you $50–$200 cash back just for applying through their link. We compare all four so you always use the highest one.",
  },
  {
    number: "03",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Track your spend",
    body: "Add the card to your dashboard. Your MSR deadline counts down in real time — so you never accidentally miss the spend window and forfeit the bonus.",
  },
  {
    number: "04",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Collect and repeat",
    body: "Points, miles, or cash — it lands in your account. Cancel before the annual fee renews, then move on to the next card. Most people earn $1,000–$2,000 in year one.",
  },
];

const VALUE_ROWS = [
  { label: "Welcome Bonus (100k MR pts @ ~2¢)", value: "+$2,000", positive: true },
  { label: "Portal Cash Back (GCR)",             value: "+$125",   positive: true },
  { label: "Annual Fee",                          value: "−$799",   positive: false },
];

const TRACKER_FEATURES = [
  {
    title: "MSR Deadline Tracker",
    desc: "Progress bars show exactly how much you need to spend and how many days are left. No spreadsheet required.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    title: "Annual Fee Alerts",
    desc: "Get notified 60 days before your fee renews so you can decide to keep or cancel — and never pay for a card you forgot about.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    ),
  },
  {
    title: "Card Inventory",
    desc: "Every card you hold in one place — status, apply date, annual fee date, and bonus earned.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
  },
  {
    title: "Bonus History",
    desc: "A running record of every welcome bonus earned, what it was worth, and what you have in progress.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
  },
];

const BLOG_POSTS = [
  {
    title: "Credit Card Churning in Canada: A Beginner's Guide",
    slug: "credit-card-churning-canada-beginners-guide",
    tag: "Beginner",
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&h=300&fit=crop&q=80",
  },
  {
    title: "How to Hit Your Minimum Spend Requirement",
    slug: "how-to-hit-minimum-spend-requirement-canada",
    tag: "Strategy",
    image: "https://images.unsplash.com/photo-1483181994823-12c503a179ea?w=600&h=300&fit=crop&q=80",
  },
  {
    title: "Best Aeroplan Credit Card in Canada (2026)",
    slug: "best-aeroplan-credit-card-canada-2025",
    tag: "Top Picks",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&h=300&fit=crop&q=80",
  },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "#ffffff", color: "#0f172a" }}>
      <QuizModal />
      <Navbar />

      {/* ── Hero ── */}
      <section style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left: copy */}
            <div>
              <div className="badge badge-blue mb-5">🇨🇦 Built for Canadians</div>

              <h1 className="text-5xl sm:text-6xl font-bold leading-[1.06] tracking-tight mb-5" style={{ color: "#0f172a", letterSpacing: "-0.03em" }}>
                Earn more from<br />every credit card<br />
                <span style={{ color: "#2563eb" }}>you apply for.</span>
              </h1>

              <p className="text-lg leading-relaxed mb-8 max-w-lg" style={{ color: "#475569" }}>
                Compare welcome bonuses, find the portal that pays the most cash back, and track your spend — all in one place. Most Canadians earn $1,000+ in year one.
              </p>

              <div className="flex flex-wrap gap-3 mb-12">
                <FindMyCardButton />
                <Link href="/cards" className="btn-secondary text-sm px-6 py-3">
                  Browse all cards
                </Link>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap gap-x-8 gap-y-4">
                {[
                  { value: "130+",   label: "Canadian cards tracked" },
                  { value: "$1,800", label: "Top first-year value" },
                  { value: "4",      label: "Portals compared per card" },
                  { value: "Free",   label: "Always free to use" },
                ].map(s => (
                  <div key={s.label}>
                    <p className="text-2xl font-bold tracking-tight" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>{s.value}</p>
                    <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: floating card stack */}
            <div className="relative hidden lg:flex items-center justify-center h-72">
              <div className="absolute w-80 h-56 rounded-3xl opacity-20 blur-3xl"
                style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed)" }} />
              <div className="absolute w-72 rounded-2xl overflow-hidden shadow-2xl hero-card hero-card-1" style={{ zIndex: 10 }}>
                <Image src="/cards/rbc-avion-vi.png" alt="RBC Avion" width={288} height={182} className="object-cover w-full" />
              </div>
              <div className="absolute w-72 rounded-2xl overflow-hidden shadow-2xl hero-card hero-card-2" style={{ zIndex: 20 }}>
                <Image src="/cards/scotia-amex-gold.png" alt="Scotia Gold Amex" width={288} height={182} className="object-cover w-full" />
              </div>
              <div className="absolute w-72 rounded-2xl overflow-hidden shadow-2xl hero-card hero-card-3" style={{ zIndex: 30 }}>
                <Image src="/cards/amex-plat.png" alt="Amex Platinum" width={288} height={182} className="object-cover w-full" />
                <div className="absolute bottom-4 left-4 right-4 rounded-xl px-4 py-2.5 flex items-center justify-between"
                  style={{ background: "rgba(15,23,42,0.85)", backdropFilter: "blur(8px)" }}>
                  <span className="text-xs font-semibold" style={{ color: "#94a3b8" }}>First-Year Value</span>
                  <span className="text-sm font-bold" style={{ color: "#4ade80" }}>~$1,800</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Browse by Category ── */}
      <section style={{ background: "#0f172a", borderBottom: "1px solid #1e293b" }}>
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            {[
              { href: "/best/travel-cards",   label: "Best Travel Cards",  icon: "✈️" },
              { href: "/best/no-fee-cards",   label: "Best No-Fee Cards",  icon: "🆓" },
              { href: "/best/cash-back-cards",label: "Best Cash Back",     icon: "💵" },
              { href: "/best/lounge-access",  label: "Lounge Access",      icon: "🛋️" },
              { href: "/best/no-fx-fee",      label: "No FX Fees",         icon: "🌍" },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition-colors hover:bg-white/10"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs font-semibold leading-snug text-white">{item.label}</span>
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/issuers" className="text-sm font-semibold px-4 py-2 rounded-lg"
              style={{ background: "rgba(255,255,255,0.08)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)" }}>
              Browse by issuer →
            </Link>
            <Link href="/programs" className="text-sm font-semibold px-4 py-2 rounded-lg"
              style={{ background: "rgba(255,255,255,0.08)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)" }}>
              Browse by program →
            </Link>
            <Link href="/compare" className="text-sm font-semibold px-4 py-2 rounded-lg"
              style={{ background: "rgba(255,255,255,0.08)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)" }}>
              Compare cards side by side →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Featured Cards ── */}
      <section style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="section-label mb-2">Top Picks</p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>
                Best welcome bonuses right now
              </h2>
            </div>
            <Link href="/cards" className="text-sm font-semibold hidden sm:block" style={{ color: "#2563eb" }}>
              View all 130+ cards →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {FEATURED_CARDS.map(card => (
              <div key={card.src} className="card flex flex-col overflow-hidden">
                <div className="px-5 pt-5 pb-3">
                  <span className={`badge ${card.badgeClass}`}>{card.badge}</span>
                </div>
                <Link href={card.href} className="relative mx-5 aspect-[1.8/1] rounded-lg overflow-hidden block" style={{ background: "#f8fafc" }}>
                  <Image src={card.src} alt={card.alt} fill className="object-contain p-4 hover:scale-105 transition-transform duration-200" />
                </Link>
                <div className="p-5 flex flex-col gap-4 flex-1">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: "#94a3b8" }}>{card.issuer}</p>
                    <h3 className="font-semibold" style={{ color: "#0f172a" }}>{card.name}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg p-3" style={{ background: "#f0fdf4" }}>
                      <p className="text-xs font-medium mb-0.5" style={{ color: "#64748b" }}>Year 1 value</p>
                      <p className="font-bold text-sm" style={{ color: "#15803d" }}>{card.value}</p>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: "#eff6ff" }}>
                      <p className="text-xs font-medium mb-0.5" style={{ color: "#64748b" }}>Best portal</p>
                      <p className="font-bold text-sm" style={{ color: "#1d4ed8" }}>{card.portal}</p>
                    </div>
                  </div>
                  <Link href={card.href} className="btn-primary mt-auto w-full text-center text-sm py-2.5" style={{ borderRadius: 8 }}>
                    View details →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 text-center sm:hidden">
            <Link href="/cards" className="text-sm font-semibold" style={{ color: "#2563eb" }}>View all 130+ cards →</Link>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <p className="section-label mb-3">How It Works</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>
              From application to bonus in four steps
            </h2>
            <p className="text-base max-w-lg mx-auto" style={{ color: "#64748b" }}>
              No spreadsheets. No guesswork. Just a clear path to your first welcome bonus.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <div key={step.number} className="relative flex flex-col">
                {i < HOW_IT_WORKS_STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-5 h-px z-10" style={{ background: "#cbd5e1" }} />
                )}
                <div className="card p-5 flex flex-col flex-1" style={{ borderRadius: 12 }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: "#eff6ff", color: "#2563eb" }}>
                    {step.icon}
                  </div>
                  <span className="text-xs font-bold mb-1" style={{ color: "#94a3b8" }}>Step {step.number}</span>
                  <h3 className="font-semibold text-sm mb-1.5" style={{ color: "#0f172a" }}>{step.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Value Breakdown ── */}
      <section style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <p className="section-label mb-3">The Math</p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>
                One card. Over $1,300 in value.
              </h2>
              <p className="leading-relaxed mb-4" style={{ color: "#64748b" }}>
                Welcome bonuses are the biggest single-hit reward in personal finance. Stack a rebate portal on top and you&apos;re collecting cash from two sources on the same application.
              </p>
              <p className="leading-relaxed mb-7" style={{ color: "#64748b" }}>
                Most Canadians leave this on the table because nobody showed them the math. PointsBinder shows you the full breakdown before you apply — so you always know what you&apos;re getting.
              </p>
              <Link href="/cards" className="btn-primary inline-block text-sm px-6 py-3">
                See all card values →
              </Link>
            </div>

            <div className="card overflow-hidden" style={{ borderRadius: 16 }}>
              <div className="px-6 py-4" style={{ background: "#0f172a" }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: "#64748b" }}>Real example</p>
                <p className="font-semibold text-white">Amex Platinum — Year One</p>
              </div>
              <div className="divide-y" style={{ borderColor: "#f1f5f9" }}>
                {VALUE_ROWS.map(row => (
                  <div key={row.label} className="px-6 py-4 flex items-center justify-between">
                    <span className="text-sm" style={{ color: "#64748b" }}>{row.label}</span>
                    <span className="font-semibold text-sm" style={{ color: row.positive ? "#16a34a" : "#dc2626" }}>{row.value}</span>
                  </div>
                ))}
                <div className="px-6 py-5 flex items-center justify-between" style={{ background: "#f8fafc" }}>
                  <span className="font-semibold" style={{ color: "#0f172a" }}>Net value, year one</span>
                  <span className="font-bold text-2xl tracking-tight" style={{ color: "#16a34a", letterSpacing: "-0.02em" }}>+$1,326</span>
                </div>
              </div>
              <p className="px-6 py-3 text-xs" style={{ color: "#94a3b8", borderTop: "1px solid #f1f5f9" }}>
                Based on 100k MR pts redeemed via Aeroplan at ~2¢/pt. Portal rates change — verify before applying.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Card Tracker ── */}
      <section style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <p className="section-label mb-3">Card Tracker</p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>
                The part people always mess up.
              </h2>
              <p className="leading-relaxed mb-4" style={{ color: "#64748b" }}>
                Miss your MSR deadline and you lose the welcome bonus entirely — there&apos;s no getting it back. Forget to cancel before your annual fee and you&apos;re paying $120–$799 for a card you&apos;re done with.
              </p>
              <p className="leading-relaxed mb-7" style={{ color: "#64748b" }}>
                PointsBinder tracks every active card — spend progress, deadline countdowns, fee renewal dates — so nothing slips through.
              </p>
              <Link href="/auth" className="btn-primary inline-block text-sm px-6 py-3">
                Start tracking free →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TRACKER_FEATURES.map(f => (
                <div key={f.title} className="card p-5">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                    style={{ background: "#eff6ff", color: "#2563eb" }}>
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-sm mb-1" style={{ color: "#0f172a" }}>{f.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Email Capture ── */}
      <section style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="max-w-xl mx-auto">
            <EmailCapture source="homepage" variant="banner" />
          </div>
        </div>
      </section>

      {/* ── Blog Previews ── */}
      <section style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="section-label mb-2">Guides & Strategy</p>
              <h2 className="text-2xl font-bold tracking-tight" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>
                New to this? Start here.
              </h2>
            </div>
            <Link href="/blog" className="text-sm font-semibold hidden sm:block" style={{ color: "#2563eb" }}>
              All guides →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {BLOG_POSTS.map(post => (
              <Link key={post.slug} href={`/blog/${post.slug}`}
                className="group card flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative h-40 w-full overflow-hidden">
                  <Image src={post.image} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <span className="badge badge-blue w-fit">{post.tag}</span>
                  <h3 className="font-semibold text-sm leading-snug" style={{ color: "#0f172a" }}>{post.title}</h3>
                  <span className="text-sm font-semibold mt-auto" style={{ color: "#2563eb" }}>Read guide →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ background: "#0f172a" }} className="py-20 px-6">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-white" style={{ letterSpacing: "-0.02em" }}>
            Ready to stop leaving money on the table?
          </h2>
          <p className="text-base mb-8" style={{ color: "#94a3b8" }}>
            Browse 130+ Canadian cards, find the best portal, and track every deadline — free.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/auth" className="btn-primary text-sm px-7 py-3.5">Create your free account →</Link>
            <Link href="/cards"
              className="text-sm px-7 py-3.5 rounded-lg font-semibold"
              style={{ background: "rgba(255,255,255,0.08)", color: "#f1f5f9", border: "1.5px solid rgba(255,255,255,0.12)" }}>
              Browse cards first
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
