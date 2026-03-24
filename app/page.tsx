"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "./components/Navbar";

const HERO_CARDS = [
  { src: "/cards/amex-plat.png",     alt: "Amex Platinum",   rotate: "-rotate-[14deg]", z: "z-10", offset: "-translate-x-16 translate-y-4", glow: "shadow-[0_0_32px_rgba(251,191,36,0.5)]",   border: "border-2 border-amber-400/70" },
  { src: "/cards/amex-cobalt.png",   alt: "Amex Cobalt",     rotate: "-rotate-[5deg]",  z: "z-20", offset: "-translate-x-6 -translate-y-1",  glow: "shadow-[0_0_24px_rgba(168,85,247,0.45)]", border: "border-2 border-purple-500/60" },
  { src: "/cards/td-fct-vi.png",     alt: "TD First Class",  rotate: "rotate-[14deg]",  z: "z-40", offset: "translate-x-16 translate-y-2",   glow: "shadow-[0_0_20px_rgba(96,165,250,0.35)]",  border: "border-2 border-blue-400/50" },
];

const FEATURED_CARDS = [
  {
    src: "/cards/amex-plat.png", alt: "Amex Platinum",
    issuer: "American Express", name: "The Platinum Card",
    value: "~$1,800", portal: "+$125 via GCR",
    rarity: "LEGENDARY", rarityColor: "text-amber-400",
    rarityBorder: "border-amber-400/40", rarityBg: "bg-amber-400/10",
    rarityGlow: "shadow-[0_0_20px_rgba(251,191,36,0.15)]",
    href: "/cards/amex-plat",
  },
  {
    src: "/cards/amex-cobalt.png", alt: "Amex Cobalt",
    issuer: "American Express", name: "Cobalt Card",
    value: "~$500", portal: "+$100 via GCR",
    rarity: "EPIC", rarityColor: "text-purple-400",
    rarityBorder: "border-purple-500/40", rarityBg: "bg-purple-500/10",
    rarityGlow: "shadow-[0_0_16px_rgba(168,85,247,0.12)]",
    href: "/cards/amex-cobalt",
  },
  {
    src: "/cards/scotia-gold-amex.png", alt: "Scotia Gold Amex",
    issuer: "Scotiabank", name: "Gold American Express",
    value: "~$885", portal: "+$150 via GCR",
    rarity: "RARE", rarityColor: "text-blue-400",
    rarityBorder: "border-blue-400/40", rarityBg: "bg-blue-500/10",
    rarityGlow: "",
    href: "/cards/scotia-amex-gold",
  },
];

const HOW_IT_WORKS_STEPS = [
  { number: "01", label: "CHOOSE YOUR CLASS",  title: "Pick your playstyle",        body: "Cash Back Farmer, Points Hoarder, Travel Ranger, or Business Mogul — pick how you want to earn rewards." },
  { number: "02", label: "ACCEPT A QUEST",      title: "Apply via a rebate portal",  body: "Portals like GCR and Frugal Flyer pay you $50–$200 in bonus cash just for applying through their link. Extra rewards stacked on top." },
  { number: "03", label: "COMPLETE THE QUEST",  title: "Hit your spend requirement", body: "Your MSR tracker shows real-time progress. Hit the target before the deadline and your welcome bonus unlocks." },
  { number: "04", label: "CLAIM YOUR REWARD",   title: "Collect the welcome bonus",  body: "Points, miles, or cash — it lands in your account. Repeat the loop. The average person earns $1,000–$2,000 in year one." },
];

const VALUE_ROWS = [
  { label: "Welcome Bonus  (100k MR pts)", value: "+$2,000", color: "text-emerald-400" },
  { label: "Portal Bonus  (GCR)",          value: "+$125",   color: "text-emerald-400" },
  { label: "Annual Fee",                   value: "−$799",   color: "text-red-400"     },
];

const TRACKER_FEATURES = [
  { icon: "⚔️", label: "MSR Progress Tracker", desc: "Real-time spend progress bars. Never miss a deadline or forfeit a welcome bonus." },
  { icon: "📅", label: "Fee Renewal Alerts",   desc: "Get flagged 60 days before your annual fee hits so you can keep or cancel in time." },
  { icon: "💳", label: "Card Collection",      desc: "Your full card inventory with rarity, status, and value — always one tap away." },
  { icon: "📊", label: "Reward History",       desc: "Every bonus you've ever earned, what it was worth, and what's still in progress." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080d1a]">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[#080d1a]">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-amber-400/5 blur-3xl" />
          <div className="absolute top-1/2 -left-32 w-80 h-80 rounded-full bg-indigo-500/5 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-400/10 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-full mb-6 border border-amber-400/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse" />
              Canadian Credit Card Rewards
            </div>

            <h1 className="text-5xl sm:text-6xl font-black text-white leading-[1.05] tracking-tight">
              Credit cards<br />were always<br />a game.<br />
              <span className="text-amber-400">Now you have<br />the tracker.</span>
            </h1>

            <p className="mt-6 text-lg text-slate-400 leading-relaxed max-w-md">
              AFK Wallet tracks your quests, manages your card collection, and makes sure you never miss a bonus. Earn $1,000–$2,000 a year on autopilot.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/cards" className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-6 py-3 rounded-xl text-sm transition-colors shadow-lg shadow-amber-400/20">
                Browse Cards →
              </Link>
              <Link href="/auth" className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-6 py-3 rounded-xl text-sm border border-slate-700 transition-colors">
                Start Free
              </Link>
            </div>

            <div className="mt-10 flex gap-8">
              <div>
                <p className="text-3xl font-black text-white">75+</p>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Cards indexed</p>
              </div>
              <div className="w-px bg-slate-800" />
              <div>
                <p className="text-3xl font-black text-white">4</p>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Portals tracked</p>
              </div>
              <div className="w-px bg-slate-800" />
              <div>
                <p className="text-3xl font-black text-amber-400">$0</p>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Free to use</p>
              </div>
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
                  <div className={`relative w-80 aspect-[1.586/1] rounded-2xl overflow-hidden ${card.glow} ${card.border}`}>
                    <Image src={card.src} alt={card.alt} fill className="object-cover" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-base font-pixel text-amber-400 mb-2">✦ How It Works ✦</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white">How It Works</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">Four steps from zero to your first bonus. No spreadsheets. No guesswork.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <div key={step.number} className="relative flex flex-col items-center text-center px-6 pb-10 md:pb-0">
                {i < HOW_IT_WORKS_STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-px bg-amber-400/20" />
                )}
                <div className="relative z-10 w-16 h-16 rounded-sm bg-slate-900 border-2 border-amber-400/60 flex items-center justify-center mb-5 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.15)]">
                  <span className="text-sm font-black text-amber-400 font-pixel">{step.number}</span>
                </div>
                <p className="text-[10px] font-bold text-amber-400/60 uppercase tracking-widest mb-1 font-pixel">{step.label}</p>
                <h3 className="font-bold text-white text-sm mb-2">{step.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed max-w-[180px]">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Deals ── */}
      <section className="bg-slate-900/40 py-20 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-base font-pixel text-amber-400 mb-1">✦ Featured Deals</p>
              <h2 className="text-3xl font-black text-white">Top Deals Right Now</h2>
            </div>
            <Link href="/cards" className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:block">
              View all 75+ cards →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {FEATURED_CARDS.map(card => (
              <div key={card.src} className={`group bg-slate-900 rounded-2xl border ${card.rarityBorder} ${card.rarityGlow} hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col shadow-[0_0_0_1px_rgba(251,191,36,0.04)]`}>
                <div className={`px-4 py-1.5 flex items-center gap-2 ${card.rarityBg} border-b ${card.rarityBorder}`}>
                  <span className={`text-[11px] font-pixel uppercase ${card.rarityColor}`}>{card.rarity}</span>
                </div>
                <div className="relative w-full aspect-[1.8/1] bg-slate-800">
                  <Image src={card.src} alt={card.alt} fill className="object-contain p-4" />
                </div>
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{card.issuer}</p>
                    <h3 className="font-bold text-white mt-0.5">{card.name}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-800 rounded-xl p-3 text-center">
                      <p className="text-xs text-amber-400/70 font-medium mb-0.5">1st Year Value</p>
                      <p className="font-bold text-amber-400 text-sm">{card.value}</p>
                    </div>
                    <div className="bg-slate-800 rounded-xl p-3 text-center">
                      <p className="text-xs text-emerald-400/70 font-medium mb-0.5">Best Portal</p>
                      <p className="font-bold text-emerald-400 text-sm">{card.portal}</p>
                    </div>
                  </div>
                  <Link href={card.href} className="mt-auto w-full text-center bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-bold py-2.5 rounded-xl transition-colors">
                    View & Apply
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center sm:hidden">
            <Link href="/cards" className="text-sm font-medium text-amber-400 hover:underline">View all 75+ cards →</Link>
          </div>
        </div>
      </section>

      {/* ── First Year Value ── */}
      <section className="py-24 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-base font-pixel text-amber-400 mb-3">✦ First Year Value</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-5">
                One card.<br />
                <span className="text-amber-400">$1,326 net reward.</span>
              </h2>
              <p className="text-slate-400 leading-relaxed mb-4">
                Welcome bonuses are the biggest single-hit reward in personal finance. Stack a rebate portal on top and you&apos;re collecting rewards from two sources at once.
              </p>
              <p className="text-slate-400 leading-relaxed mb-8">
                Most Canadians leave this on the table because nobody showed them the math. AFK Wallet makes it visible before you apply.
              </p>
              <Link href="/cards" className="inline-block bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-6 py-3 rounded-xl text-sm transition-colors">
                Browse deals →
              </Link>
            </div>

            <div className="bg-slate-900 rounded-3xl p-8 border border-slate-700 shadow-[0_0_0_1px_rgba(251,191,36,0.08)]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-sm bg-amber-400/20 border border-amber-400/30 flex items-center justify-center shrink-0">
                  <span className="text-amber-400 text-sm">⚔️</span>
                </div>
                <div>
                  <p className="text-[11px] font-pixel text-amber-400 uppercase tracking-widest">Legendary Deal</p>
                  <p className="text-white font-bold text-sm">Amex Platinum — Year One</p>
                </div>
              </div>

              <div className="flex flex-col gap-4 mb-6">
                {VALUE_ROWS.map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">{row.label}</span>
                    <span className={`font-bold text-lg ${row.color}`}>{row.value}</span>
                  </div>
                ))}
                <div className="border-t border-slate-700 pt-4 flex items-center justify-between">
                  <span className="text-white font-bold">Net Value</span>
                  <span className="text-amber-400 font-black text-2xl">+$1,326</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Based on 100k MR pts via Aeroplan at ~2¢/pt. Portal rates change — verify before applying.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Card Tracker ── */}
      <section className="bg-slate-900/40 py-24 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-base font-pixel text-amber-400 mb-3">✦ Card Tracker</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-5">
                Your card tracker.<br />
                <span className="text-amber-400">Never miss a deadline.</span>
              </h2>
              <p className="text-slate-400 leading-relaxed mb-4">
                Miss your MSR deadline and you lose the welcome bonus entirely. Forget to cancel before your annual fee and you&apos;re paying $120–$799 for nothing. Expensive, avoidable losses.
              </p>
              <p className="text-slate-400 leading-relaxed mb-8">
                AFK Wallet tracks every active deal — spend progress, fee dates, cancel windows — so every dollar gets captured.
              </p>
              <Link href="/auth" className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-6 py-3 rounded-xl text-sm transition-colors">
                Track your cards →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TRACKER_FEATURES.map(f => (
                <div key={f.label} className="bg-slate-900 rounded-2xl p-5 border border-slate-700 hover:border-amber-400/30 transition-colors shadow-[0_0_0_1px_rgba(251,191,36,0.03)]">
                  <div className="text-2xl mb-3">{f.icon}</div>
                  <h3 className="font-bold text-white text-sm mb-1.5">{f.label}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Blog ── */}
      <section className="py-16 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-base font-pixel text-amber-400 mb-1">✦ Blog</p>
              <h2 className="text-2xl font-black text-white">Guides & Strategy</h2>
            </div>
            <Link href="/blog" className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:block">
              All guides →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { title: "Credit Card Churning Canada: A Beginner's Guide", slug: "credit-card-churning-canada-beginners-guide", tag: "Beginner" },
              { title: "How to Hit Your Minimum Spend Requirement (MSR)", slug: "how-to-hit-minimum-spend-requirement-canada", tag: "Strategy" },
              { title: "Best Aeroplan Credit Card in Canada (2025)", slug: "best-aeroplan-credit-card-canada-2025", tag: "Top Picks" },
            ].map(post => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group bg-slate-900 rounded-2xl border border-slate-700 hover:border-amber-400/30 transition-all duration-200 p-6 flex flex-col gap-3">
                <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full w-fit border border-amber-400/20">{post.tag}</span>
                <h3 className="font-bold text-white text-sm leading-snug group-hover:text-amber-400 transition-colors">{post.title}</h3>
                <span className="text-xs text-amber-400/60 font-medium mt-auto">Read guide →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="mx-6 my-16 rounded-3xl bg-slate-900 border border-amber-400/20 overflow-hidden relative shadow-[0_0_40px_rgba(251,191,36,0.05)]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-amber-400/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-indigo-500/5 blur-3xl" />
        </div>
        <div className="relative px-10 py-16 max-w-lg">
          <p className="text-base font-pixel text-amber-400 mb-3">✦ Get Started</p>
          <h2 className="text-3xl font-black text-white leading-tight mb-3">
            Your wallet should be<br />earning right now.
          </h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Browse 75+ Canadian cards, compare portals, and track every deal in your wallet — free, forever.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/auth" className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-6 py-3 rounded-xl text-sm transition-colors shadow-lg shadow-amber-400/20">
              Create your wallet →
            </Link>
            <Link href="/cards" className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-6 py-3 rounded-xl text-sm border border-slate-700 transition-colors">
              Browse cards first
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-1">
            <span className="font-black text-amber-400 text-sm font-pixel">AFK</span>
            <span className="font-black text-white text-sm font-pixel">WALLET</span>
          </div>
          <div className="flex gap-5">
            <Link href="/cards"     className="hover:text-slate-300 transition-colors">Cards</Link>
            <Link href="/deals"     className="hover:text-slate-300 transition-colors">⚡ Hot Deals</Link>
            <Link href="/blog"      className="hover:text-slate-300 transition-colors">Blog</Link>
            <Link href="/auth"      className="hover:text-slate-300 transition-colors">Sign up</Link>
            <Link href="/dashboard" className="hover:text-slate-300 transition-colors">Dashboard</Link>
          </div>
          <p>Not financial advice. Verify offers before applying.</p>
        </div>
      </footer>
    </div>
  );
}
