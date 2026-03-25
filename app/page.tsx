"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "./components/Navbar";

// ── Data ─────────────────────────────────────────────────────────────────────

const FEATURED_CARDS = [
  {
    src: "/cards/amex-plat.png", alt: "Amex Platinum",
    issuer: "American Express",  name: "The Platinum Card",
    value: "~$1,800", portal: "+$125 via GCR",
    badge: "Best Overall", badgeClass: "badge-amber",
    href: "/cards/amex-plat",
  },
  {
    src: "/cards/amex-cobalt.png", alt: "Amex Cobalt",
    issuer: "American Express",   name: "Cobalt Card",
    value: "~$500", portal: "+$100 via GCR",
    badge: "Best No-Fee-Alt", badgeClass: "badge-blue",
    href: "/cards/amex-cobalt",
  },
  {
    src: "/cards/scotia-gold-amex.png", alt: "Scotia Gold Amex",
    issuer: "Scotiabank",               name: "Gold American Express",
    value: "~$885", portal: "+$150 via GCR",
    badge: "Best Portal Bonus", badgeClass: "badge-green",
    href: "/cards/scotia-amex-gold",
  },
];


const HOW_IT_WORKS_STEPS = [
  {
    number: "01",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
      </svg>
    ),
    title: "Find the best card",
    body: "Browse 75+ Canadian credit cards filtered by program, issuer, annual fee, and first-year value. We show the math up front.",
  },
  {
    number: "02",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
      </svg>
    ),
    title: "Apply via a rebate portal",
    body: "Portals like GCR and Frugal Flyer pay you $50–$200 in cash back just for applying through their link. We compare them all.",
  },
  {
    number: "03",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Hit the spend requirement",
    body: "Your MSR tracker shows real-time progress. Hit the target before the deadline and your welcome bonus unlocks.",
  },
  {
    number: "04",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Collect your reward",
    body: "Points, miles, or cash — it lands in your account. The average person earns $1,000–$2,000 in year one.",
  },
];

const VALUE_ROWS = [
  { label: "Welcome Bonus (100k MR pts)", value: "+$2,000", positive: true },
  { label: "Portal Bonus (GCR)",          value: "+$125",   positive: true },
  { label: "Annual Fee",                  value: "−$799",   positive: false },
];

const TRACKER_FEATURES = [
  {
    title: "MSR Progress Tracker",
    desc: "Real-time spend progress bars. Never miss a deadline or forfeit a welcome bonus.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    title: "Fee Renewal Alerts",
    desc: "Get flagged 60 days before your annual fee hits so you can keep or cancel in time.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    ),
  },
  {
    title: "Card Collection",
    desc: "Your full card inventory with status, annual fee dates, and first-year value.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
  },
  {
    title: "Reward History",
    desc: "Every bonus you've earned, what it was worth, and what's still in progress.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
  },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "#ffffff", color: "#0f172a" }}>
      <Navbar />

      {/* ── Hero ── */}
      <section style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: copy */}
            <div>
              <div className="badge badge-blue mb-6">🇨🇦 Canadian Credit Card Rewards</div>

              <h1 className="text-5xl sm:text-6xl font-bold leading-[1.08] tracking-tight mb-6" style={{ color: "#0f172a", letterSpacing: "-0.03em" }}>
                Maximize every<br />credit card bonus<br />
                <span style={{ color: "#2563eb" }}>in Canada.</span>
              </h1>

              <p className="text-xl leading-relaxed mb-10 max-w-2xl" style={{ color: "#475569" }}>
                Compare 75+ Canadian credit cards by first-year value, find the best rebate portal for each one, and track your welcome bonuses — all in one place.
              </p>

              <div className="flex flex-wrap gap-3 mb-16">
                <Link href="/cards" className="btn-primary text-sm px-6 py-3">
                  Browse all cards →
                </Link>
                <Link href="/auth" className="btn-secondary text-sm px-6 py-3">
                  Track my cards free
                </Link>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap gap-8">
                {[
                  { value: "75+",    label: "Cards indexed" },
                  { value: "4",      label: "Portals compared" },
                  { value: "$1,800", label: "Top first-year value" },
                  { value: "Free",   label: "No account required to browse" },
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
              {/* glow blob behind */}
              <div
                className="absolute w-80 h-56 rounded-3xl opacity-20 blur-3xl"
                style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed)" }}
              />
              {/* card 1 — back */}
              <div className="absolute w-72 rounded-2xl overflow-hidden shadow-2xl hero-card hero-card-1" style={{ zIndex: 10 }}>
                <Image src="/cards/rbc-avion-vi.png" alt="RBC Avion" width={288} height={182} className="object-cover w-full" />
              </div>
              {/* card 2 — middle */}
              <div className="absolute w-72 rounded-2xl overflow-hidden shadow-2xl hero-card hero-card-2" style={{ zIndex: 20 }}>
                <Image src="/cards/scotia-amex-gold.png" alt="Scotia Gold Amex" width={288} height={182} className="object-cover w-full" />
              </div>
              {/* card 3 — front */}
              <div className="absolute w-72 rounded-2xl overflow-hidden shadow-2xl hero-card hero-card-3" style={{ zIndex: 30 }}>
                <Image src="/cards/amex-plat.png" alt="Amex Platinum" width={288} height={182} className="object-cover w-full" />
                {/* value chip on front card */}
                <div
                  className="absolute bottom-4 left-4 right-4 rounded-xl px-4 py-2.5 flex items-center justify-between"
                  style={{ background: "rgba(15,23,42,0.85)", backdropFilter: "blur(8px)" }}
                >
                  <span className="text-xs font-semibold" style={{ color: "#94a3b8" }}>1st Year Value</span>
                  <span className="text-sm font-bold" style={{ color: "#4ade80" }}>~$1,800</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <p className="section-label mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>
              From browsing to bonus in four steps
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "#64748b" }}>
              No spreadsheets. No guesswork. Just the clearest path to your first welcome bonus.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6" style={{ alignItems: "stretch" }}>
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <div key={step.number} className="relative flex flex-col h-full">
                {i < HOW_IT_WORKS_STEPS.length - 1 && (
                  <div
                    className="hidden md:block absolute top-8 left-full w-6 h-px z-10"
                    style={{ background: "#cbd5e1" }}
                  />
                )}
                <div className="card p-6 flex flex-col flex-1" style={{ borderRadius: 12 }}>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: "#eff6ff", color: "#2563eb" }}
                  >
                    {step.icon}
                  </div>
                  <span className="text-xs font-bold" style={{ color: "#94a3b8" }}>Step {step.number}</span>
                  <h3 className="font-semibold text-sm mt-1 mb-2" style={{ color: "#0f172a" }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── First Year Value ── */}
      <section style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="section-label mb-3">First Year Value</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-5" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>
                One card.<br />$1,326 net value.
              </h2>
              <p className="leading-relaxed mb-4" style={{ color: "#64748b" }}>
                Welcome bonuses are the biggest single-hit reward in personal finance. Stack a rebate portal on top and you&apos;re collecting cash from two sources at once.
              </p>
              <p className="leading-relaxed mb-8" style={{ color: "#64748b" }}>
                Most Canadians leave this on the table because nobody showed them the math. AFK Wallet makes it visible before you apply.
              </p>
              <Link href="/cards" className="btn-primary inline-block text-sm px-6 py-3">
                Browse all deals →
              </Link>
            </div>

            {/* Value breakdown card */}
            <div className="card overflow-hidden" style={{ borderRadius: 16 }}>
              <div className="px-6 py-5" style={{ background: "#0f172a" }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#64748b" }}>Example breakdown</p>
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
                Based on 100k MR pts via Aeroplan at ~2¢/pt. Portal rates vary — verify before applying.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Cards ── */}
      <section style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="section-label mb-2">Top Picks</p>
              <h2 className="text-3xl font-bold tracking-tight" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>Best cards right now</h2>
            </div>
            <Link href="/cards" className="text-sm font-semibold hidden sm:block" style={{ color: "#2563eb" }}>
              View all 75+ cards →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {FEATURED_CARDS.map(card => (
              <div key={card.src} className="card flex flex-col overflow-hidden">
                {/* Badge */}
                <div className="px-5 pt-5 pb-3">
                  <span className={`badge ${card.badgeClass}`}>{card.badge}</span>
                </div>

                {/* Card image */}
                <div className="relative mx-5 aspect-[1.8/1] rounded-lg overflow-hidden" style={{ background: "#f8fafc" }}>
                  <Image src={card.src} alt={card.alt} fill className="object-contain p-4" />
                </div>

                {/* Info */}
                <div className="p-5 flex flex-col gap-4 flex-1">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: "#94a3b8" }}>{card.issuer}</p>
                    <h3 className="font-semibold" style={{ color: "#0f172a" }}>{card.name}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg p-3" style={{ background: "#f0fdf4" }}>
                      <p className="text-xs font-medium mb-0.5" style={{ color: "#64748b" }}>1st Year Value</p>
                      <p className="font-bold text-sm" style={{ color: "#15803d" }}>{card.value}</p>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: "#eff6ff" }}>
                      <p className="text-xs font-medium mb-0.5" style={{ color: "#64748b" }}>Best Portal</p>
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

          <div className="mt-6 text-center sm:hidden">
            <Link href="/cards" className="text-sm font-semibold" style={{ color: "#2563eb" }}>View all 75+ cards →</Link>
          </div>
        </div>
      </section>

      {/* ── Card Tracker ── */}
      <section style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="section-label mb-3">Card Tracker</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-5" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>
                Never miss a deadline.
              </h2>
              <p className="leading-relaxed mb-4" style={{ color: "#64748b" }}>
                Miss your MSR deadline and you lose the welcome bonus entirely. Forget to cancel before your annual fee and you&apos;re paying $120–$799 for nothing.
              </p>
              <p className="leading-relaxed mb-8" style={{ color: "#64748b" }}>
                AFK Wallet tracks every active deal — spend progress, fee dates, cancel windows — so every dollar gets captured.
              </p>
              <Link href="/auth" className="btn-primary inline-block text-sm px-6 py-3">
                Start tracking free →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TRACKER_FEATURES.map(f => (
                <div key={f.title} className="card p-5">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                    style={{ background: "#eff6ff", color: "#2563eb" }}
                  >
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-sm mb-1.5" style={{ color: "#0f172a" }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Blog Previews ── */}
      <section style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="section-label mb-2">Guides & Strategy</p>
              <h2 className="text-3xl font-bold tracking-tight" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>Learn the basics</h2>
            </div>
            <Link href="/blog" className="text-sm font-semibold hidden sm:block" style={{ color: "#2563eb" }}>
              All guides →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { title: "Credit Card Churning Canada: A Beginner's Guide", slug: "credit-card-churning-canada-beginners-guide", tag: "Beginner" },
              { title: "How to Hit Your Minimum Spend Requirement (MSR)",  slug: "how-to-hit-minimum-spend-requirement-canada",    tag: "Strategy" },
              { title: "Best Aeroplan Credit Card in Canada (2025)",        slug: "best-aeroplan-credit-card-canada-2025",          tag: "Top Picks" },
            ].map(post => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="card p-6 flex flex-col gap-4"
              >
                <span className="badge badge-blue w-fit">{post.tag}</span>
                <h3 className="font-semibold text-sm leading-snug" style={{ color: "#0f172a" }}>{post.title}</h3>
                <span className="text-sm font-semibold mt-auto" style={{ color: "#2563eb" }}>Read guide →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: "#0f172a" }} className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-white" style={{ letterSpacing: "-0.02em" }}>
            Start earning more on every card.
          </h2>
          <p className="text-lg mb-10" style={{ color: "#94a3b8" }}>
            Browse 75+ Canadian cards, compare portals, and track every deal — free, forever.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/auth"  className="btn-primary text-sm px-7 py-3.5">Create your free account →</Link>
            <Link
              href="/cards"
              className="text-sm px-7 py-3.5 rounded-lg font-semibold transition-colors"
              style={{ background: "rgba(255,255,255,0.08)", color: "#f1f5f9", border: "1.5px solid rgba(255,255,255,0.12)" }}
            >
              Browse cards first
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: "#0f172a", borderTop: "1px solid #1e293b" }} className="py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 flex items-center justify-center rounded-md text-white text-xs font-bold"
              style={{ background: "#2563eb" }}
            >
              A
            </div>
            <span className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>AFK Wallet</span>
          </div>

          <div className="flex gap-6 text-sm">
            {[
              { href: "/cards",     label: "Cards"     },
              { href: "/deals",     label: "Hot Deals" },
              { href: "/blog",      label: "Blog"      },
              { href: "/auth",      label: "Sign up"   },
              { href: "/dashboard", label: "Dashboard" },
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
