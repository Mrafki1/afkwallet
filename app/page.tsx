"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "./components/Navbar";
import VineDivider from "./components/VineDivider";

// ── Data ─────────────────────────────────────────────────────────────────────

const HERO_CARDS = [
  { src: "/cards/amex-plat.png",   alt: "Amex Platinum",  rotate: "-rotate-[14deg]", z: "z-10", offset: "-translate-x-16 translate-y-4"  },
  { src: "/cards/amex-cobalt.png", alt: "Amex Cobalt",    rotate: "-rotate-[5deg]",  z: "z-20", offset: "-translate-x-6 -translate-y-1"  },
  { src: "/cards/td-fct-vi.png",   alt: "TD First Class", rotate: "rotate-[14deg]",  z: "z-40", offset: "translate-x-16 translate-y-2"   },
];

const FEATURED_CARDS = [
  {
    src: "/cards/amex-plat.png", alt: "Amex Platinum",
    issuer: "American Express",  name: "The Platinum Card",
    value: "~$1,800", portal: "+$125 via GCR",
    rarity: "LEGENDARY", rarityColor: "#d4a017", rarityBg: "#7a5c3a",
    href: "/cards/amex-plat",
  },
  {
    src: "/cards/amex-cobalt.png", alt: "Amex Cobalt",
    issuer: "American Express",   name: "Cobalt Card",
    value: "~$500", portal: "+$100 via GCR",
    rarity: "EPIC", rarityColor: "#c4a0e8", rarityBg: "#5a3a7a",
    href: "/cards/amex-cobalt",
  },
  {
    src: "/cards/scotia-gold-amex.png", alt: "Scotia Gold Amex",
    issuer: "Scotiabank",               name: "Gold American Express",
    value: "~$885", portal: "+$150 via GCR",
    rarity: "RARE", rarityColor: "#90c0e8", rarityBg: "#2a5a7a",
    href: "/cards/scotia-amex-gold",
  },
];

const HOW_IT_WORKS_STEPS = [
  { number: "01", label: "CHOOSE YOUR CLASS",  title: "Pick your playstyle",        body: "Cash Back Farmer, Points Hoarder, Travel Ranger, or Business Mogul — pick how you want to earn rewards." },
  { number: "02", label: "ACCEPT A QUEST",      title: "Apply via a rebate portal",  body: "Portals like GCR and Frugal Flyer pay you $50–$200 in bonus cash just for applying through their link." },
  { number: "03", label: "COMPLETE THE QUEST",  title: "Hit your spend requirement", body: "Your MSR tracker shows real-time progress. Hit the target before the deadline and your welcome bonus unlocks." },
  { number: "04", label: "CLAIM YOUR REWARD",   title: "Collect the welcome bonus",  body: "Points, miles, or cash — it lands in your account. The average person earns $1,000–$2,000 in year one." },
];

const VALUE_ROWS = [
  { label: "Welcome Bonus  (100k MR pts)", value: "+$2,000", color: "#4a7c59" },
  { label: "Portal Bonus  (GCR)",          value: "+$125",   color: "#4a7c59" },
  { label: "Annual Fee",                   value: "−$799",   color: "#a03020" },
];

const TRACKER_FEATURES = [
  { icon: "⚔️", label: "MSR Progress Tracker", desc: "Real-time spend progress bars. Never miss a deadline or forfeit a welcome bonus." },
  { icon: "📅", label: "Fee Renewal Alerts",   desc: "Get flagged 60 days before your annual fee hits so you can keep or cancel in time." },
  { icon: "💳", label: "Card Collection",      desc: "Your full card inventory with rarity, status, and value — always one tap away." },
  { icon: "📊", label: "Reward History",       desc: "Every bonus you've ever earned, what it was worth, and what's still in progress." },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "#f9f0d9", color: "#3d2b1f" }}>
      <Navbar />

      {/* ── Hero ── */}
      <section style={{ background: "#f9f0d9" }} className="relative overflow-hidden">
        {/* Decorative background wheat */}
        <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none select-none text-3xl flex items-end gap-2 px-8 opacity-20">
          🌾🌾🌾🌾🌾🌾🌾🌾🌾🌾🌾🌾🌾🌾🌾🌾🌾🌾🌾🌾🌾🌾🌾🌾🌾🌾
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            {/* Wooden sign badge */}
            <div className="sdv-sign inline-block text-xs px-3 py-1.5 mb-6">
              🍃 Canadian Credit Card Rewards
            </div>

            <h1 className="text-5xl sm:text-6xl font-black leading-[1.05] tracking-tight" style={{ color: "#3d2b1f" }}>
              Credit cards<br />were always<br />a game.<br />
              <span style={{ color: "#4a7c59" }}>Now you have<br />the tracker.</span>
            </h1>

            <p className="mt-6 text-lg leading-relaxed max-w-md" style={{ color: "#7a6048" }}>
              AFK Wallet tracks your quests, manages your card collection, and makes sure you never miss a bonus. Earn $1,000–$2,000 a year on autopilot.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/cards" className="sdv-btn text-sm font-pixel px-6 py-3">
                Browse Cards →
              </Link>
              <Link href="/auth" className="sdv-btn-tan text-sm font-pixel px-6 py-3">
                Start Free
              </Link>
            </div>

            {/* Stats row */}
            <div className="mt-10 flex gap-4 flex-wrap">
              {[
                { value: "75+",  label: "Cards indexed" },
                { value: "4",    label: "Portals tracked" },
                { value: "$0",   label: "Free to use", gold: true },
              ].map(s => (
                <div
                  key={s.label}
                  className="px-4 py-3 text-center"
                  style={{
                    background: "#ede0c0",
                    border: "3px solid #7a5c3a",
                    boxShadow: "2px 2px 0px #5a3c20",
                    minWidth: 80,
                  }}
                >
                  <p className="text-2xl font-black" style={{ color: s.gold ? "#d4a017" : "#3d2b1f" }}>{s.value}</p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: "#7a6048" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Card stack */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-[420px] h-[320px]">
              {HERO_CARDS.map((card) => (
                <div
                  key={card.src}
                  className={`absolute inset-0 flex items-center justify-center ${card.z} transform ${card.rotate} ${card.offset} transition-transform duration-300`}
                >
                  <div
                    className="relative w-80 aspect-[1.586/1] overflow-hidden"
                    style={{ border: "4px solid #7a5c3a", boxShadow: "4px 4px 0px #5a3c20" }}
                  >
                    <Image src={card.src} alt={card.alt} fill className="object-cover" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Vine divider ── */}
      <VineDivider />

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-20" style={{ background: "#f0e4c0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="sdv-sign inline-block text-sm px-5 py-2 mb-4">✦ How It Works ✦</div>
            <h2 className="text-3xl sm:text-4xl font-black" style={{ color: "#3d2b1f" }}>How It Works</h2>
            <p className="mt-3 max-w-xl mx-auto" style={{ color: "#7a6048" }}>
              Four steps from zero to your first bonus. No spreadsheets. No guesswork.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <div key={step.number} className="relative flex flex-col items-center text-center p-6 sdv-panel">
                {/* Connector line */}
                {i < HOW_IT_WORKS_STEPS.length - 1 && (
                  <div
                    className="hidden md:block absolute top-10 left-full w-4 h-1 z-20"
                    style={{ background: "#d4a017" }}
                  />
                )}
                <div className="sdv-step-num w-14 h-14 flex items-center justify-center mb-4 text-lg">
                  {step.number}
                </div>
                <p className="text-[10px] font-pixel mb-1" style={{ color: "#7a5c3a" }}>{step.label}</p>
                <h3 className="font-bold text-sm mb-2" style={{ color: "#3d2b1f" }}>{step.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "#7a6048" }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Vine divider ── */}
      <VineDivider flip />

      {/* ── Featured Deals ── */}
      <section className="py-20" style={{ background: "#f9f0d9" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="sdv-sign inline-block text-xs px-3 py-1.5 mb-3">✦ Featured Deals</div>
              <h2 className="text-3xl font-black" style={{ color: "#3d2b1f" }}>Top Deals Right Now</h2>
            </div>
            <Link href="/cards" className="text-sm font-semibold hidden sm:block" style={{ color: "#4a7c59" }}>
              View all 75+ cards →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {FEATURED_CARDS.map(card => (
              <div key={card.src} className="sdv-card flex flex-col overflow-hidden hover:-translate-y-1 transition-transform duration-200">
                {/* Rarity banner */}
                <div
                  className="px-4 py-1.5 text-center"
                  style={{ background: card.rarityBg, borderBottom: "2px solid #5a3c20" }}
                >
                  <span className="text-[11px] font-pixel" style={{ color: card.rarityColor }}>
                    {card.rarity}
                  </span>
                </div>

                {/* Card image */}
                <div className="relative w-full aspect-[1.8/1]" style={{ background: "#ede0c0" }}>
                  <Image src={card.src} alt={card.alt} fill className="object-contain p-4" />
                </div>

                {/* Info */}
                <div className="p-5 flex flex-col gap-3 flex-1" style={{ background: "#f5ead8" }}>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#7a6048" }}>{card.issuer}</p>
                    <h3 className="font-bold mt-0.5" style={{ color: "#3d2b1f" }}>{card.name}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 text-center" style={{ background: "#ede0c0", border: "2px solid #7a5c3a" }}>
                      <p className="text-xs font-medium mb-0.5" style={{ color: "#7a5c3a" }}>1st Year Value</p>
                      <p className="font-bold text-sm" style={{ color: "#d4a017" }}>{card.value}</p>
                    </div>
                    <div className="p-3 text-center" style={{ background: "#ede0c0", border: "2px solid #7a5c3a" }}>
                      <p className="text-xs font-medium mb-0.5" style={{ color: "#7a5c3a" }}>Best Portal</p>
                      <p className="font-bold text-sm" style={{ color: "#4a7c59" }}>{card.portal}</p>
                    </div>
                  </div>
                  <Link href={card.href} className="sdv-btn mt-auto w-full text-center text-sm font-pixel py-2.5">
                    View & Apply
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center sm:hidden">
            <Link href="/cards" className="text-sm font-semibold" style={{ color: "#4a7c59" }}>View all 75+ cards →</Link>
          </div>
        </div>
      </section>

      {/* ── Vine divider ── */}
      <VineDivider />

      {/* ── First Year Value ── */}
      <section className="py-20" style={{ background: "#f0e4c0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="sdv-sign inline-block text-xs px-3 py-1.5 mb-4">✦ First Year Value</div>
              <h2 className="text-3xl sm:text-4xl font-black leading-tight mb-5" style={{ color: "#3d2b1f" }}>
                One card.<br />
                <span style={{ color: "#4a7c59" }}>$1,326 net reward.</span>
              </h2>
              <p className="leading-relaxed mb-4" style={{ color: "#7a6048" }}>
                Welcome bonuses are the biggest single-hit reward in personal finance. Stack a rebate portal on top and you&apos;re collecting rewards from two sources at once.
              </p>
              <p className="leading-relaxed mb-8" style={{ color: "#7a6048" }}>
                Most Canadians leave this on the table because nobody showed them the math. AFK Wallet makes it visible before you apply.
              </p>
              <Link href="/cards" className="sdv-btn inline-block text-sm font-pixel px-6 py-3">
                Browse deals →
              </Link>
            </div>

            {/* Ledger panel */}
            <div className="sdv-panel p-0 overflow-hidden">
              {/* Panel header */}
              <div
                className="px-6 py-4 flex items-center gap-3"
                style={{
                  background: "linear-gradient(to bottom, #8b6343, #7a5430)",
                  borderBottom: "3px solid #5a3c20",
                }}
              >
                <div
                  className="w-8 h-8 flex items-center justify-center text-sm"
                  style={{ background: "#3d2b1f", border: "2px solid #d4a017" }}
                >
                  ⚔️
                </div>
                <div>
                  <p className="text-[11px] font-pixel" style={{ color: "#f0c840" }}>Legendary Deal</p>
                  <p className="font-bold text-sm" style={{ color: "#f5ead8" }}>Amex Platinum — Year One</p>
                </div>
              </div>

              {/* Rows */}
              <div className="p-6 flex flex-col gap-4">
                {VALUE_ROWS.map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: "#7a6048" }}>{row.label}</span>
                    <span className="font-bold text-lg" style={{ color: row.color }}>{row.value}</span>
                  </div>
                ))}
                <div className="pt-4 flex items-center justify-between" style={{ borderTop: "2px solid #c4a06a" }}>
                  <span className="font-bold" style={{ color: "#3d2b1f" }}>Net Value</span>
                  <span className="font-black text-2xl" style={{ color: "#d4a017" }}>+$1,326</span>
                </div>
              </div>

              <p className="px-6 pb-4 text-xs" style={{ color: "#9a7858" }}>
                Based on 100k MR pts via Aeroplan at ~2¢/pt. Portal rates change — verify before applying.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Vine divider ── */}
      <VineDivider flip />

      {/* ── Card Tracker ── */}
      <section className="py-20" style={{ background: "#f9f0d9" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="sdv-sign inline-block text-xs px-3 py-1.5 mb-4">✦ Card Tracker</div>
              <h2 className="text-3xl sm:text-4xl font-black leading-tight mb-5" style={{ color: "#3d2b1f" }}>
                Your card tracker.<br />
                <span style={{ color: "#4a7c59" }}>Never miss a deadline.</span>
              </h2>
              <p className="leading-relaxed mb-4" style={{ color: "#7a6048" }}>
                Miss your MSR deadline and you lose the welcome bonus entirely. Forget to cancel before your annual fee and you&apos;re paying $120–$799 for nothing.
              </p>
              <p className="leading-relaxed mb-8" style={{ color: "#7a6048" }}>
                AFK Wallet tracks every active deal — spend progress, fee dates, cancel windows — so every dollar gets captured.
              </p>
              <Link href="/auth" className="sdv-btn inline-block text-sm font-pixel px-6 py-3">
                Track your cards →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TRACKER_FEATURES.map(f => (
                <div
                  key={f.label}
                  className="sdv-card p-5"
                  style={{ transition: "transform 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.transform = "translate(-1px,-1px)")}
                  onMouseLeave={e => (e.currentTarget.style.transform = "")}
                >
                  <div className="text-2xl mb-3">{f.icon}</div>
                  <h3 className="font-bold text-sm mb-1.5" style={{ color: "#3d2b1f" }}>{f.label}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "#7a6048" }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Vine divider ── */}
      <VineDivider />

      {/* ── Blog ── */}
      <section className="py-16" style={{ background: "#f0e4c0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="sdv-sign inline-block text-xs px-3 py-1.5 mb-3">✦ Blog</div>
              <h2 className="text-2xl font-black" style={{ color: "#3d2b1f" }}>Guides & Strategy</h2>
            </div>
            <Link href="/blog" className="text-sm font-semibold hidden sm:block" style={{ color: "#4a7c59" }}>
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
                className="sdv-card p-6 flex flex-col gap-3 hover:-translate-y-1 transition-transform duration-200"
              >
                <span
                  className="text-xs font-pixel px-2.5 py-1 w-fit"
                  style={{ background: "#7a5c3a", color: "#f0c840", border: "2px solid #5a3c20" }}
                >
                  {post.tag}
                </span>
                <h3 className="font-bold text-sm leading-snug" style={{ color: "#3d2b1f" }}>{post.title}</h3>
                <span className="text-xs font-semibold mt-auto" style={{ color: "#4a7c59" }}>Read guide →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Vine divider ── */}
      <VineDivider flip />

      {/* ── CTA — Bulletin Board ── */}
      <section className="py-20 px-6" style={{ background: "#f9f0d9" }}>
        <div
          className="max-w-2xl mx-auto text-center p-12"
          style={{
            background: "#ede0c0",
            border: "6px solid #5a3c20",
            boxShadow: "6px 6px 0px #3d2710, inset 0 0 0 3px #c4a06a",
          }}
        >
          <div className="sdv-sign inline-block text-xs px-3 py-1.5 mb-4">📌 Bulletin Board</div>
          <h2 className="text-3xl font-black leading-tight mb-3" style={{ color: "#3d2b1f" }}>
            Your wallet should be<br />earning right now.
          </h2>
          <p className="text-sm mb-8 leading-relaxed" style={{ color: "#7a6048" }}>
            Browse 75+ Canadian cards, compare portals, and track every deal — free, forever.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/auth"  className="sdv-btn text-sm font-pixel px-6 py-3">Create your wallet →</Link>
            <Link href="/cards" className="sdv-btn-tan text-sm font-pixel px-6 py-3">Browse cards first</Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <div style={{ position: "relative" }}>
        <VineDivider />
        <footer style={{ background: "#4a3220", borderTop: "4px solid #3d2710" }} className="py-8">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs" style={{ color: "#c4a06a" }}>
            <div className="flex items-center gap-1">
              <span className="font-pixel text-sm" style={{ color: "#f0c840" }}>AFK</span>
              <span className="font-pixel text-sm" style={{ color: "#f5ead8" }}>WALLET</span>
            </div>
            <div className="flex gap-5">
              {[
                { href: "/cards",     label: "Cards"      },
                { href: "/deals",     label: "⚡ Hot Deals" },
                { href: "/blog",      label: "Blog"        },
                { href: "/auth",      label: "Sign up"     },
                { href: "/dashboard", label: "Dashboard"   },
              ].map(l => (
                <Link key={l.href} href={l.href} className="hover:text-[#f5ead8] transition-colors">{l.label}</Link>
              ))}
            </div>
            <p style={{ color: "#8b6343" }}>Not financial advice. Verify offers before applying.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
