"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "./components/Navbar";

const HERO_CARDS = [
  { src: "/cards/amex-plat.png",          alt: "Amex Platinum",         rotate: "-rotate-[14deg]", z: "z-10", offset: "-translate-x-16 translate-y-4"  },
  { src: "/cards/amex-cobalt.png",        alt: "Amex Cobalt",           rotate: "-rotate-[5deg]",  z: "z-20", offset: "-translate-x-6 -translate-y-1"  },
  { src: "/cards/scotia-passport-vi.png", alt: "Scotiabank Passport VI", rotate: "rotate-[5deg]",  z: "z-30", offset: "translate-x-6 -translate-y-3"   },
];

const MATH_ROWS = [
  { label: "Welcome bonus value",      value: "+$1,800", color: "text-green-600" },
  { label: "GCR portal cash back",     value: "+$125",   color: "text-green-600" },
  { label: "Annual fee",               value: "−$799",   color: "text-red-500"   },
];

const FEATURED_CARDS = [
  {
    src: "/cards/amex-plat.png",
    alt: "American Express Platinum",
    issuer: "American Express",
    name: "The Platinum Card",
    value: "~$1,800",
    portal: "+$125 via GCR",
    tag: "Best overall",
    tagColor: "bg-amber-100 text-amber-800",
    href: "/cards/amex-plat",
  },
  {
    src: "/cards/amex-cobalt.png",
    alt: "Amex Cobalt",
    issuer: "American Express",
    name: "Cobalt Card",
    value: "~$500",
    portal: "+$100 via GCR",
    tag: "Best for dining",
    tagColor: "bg-green-100 text-green-800",
    href: "/cards/amex-cobalt",
  },
  {
    src: "/cards/scotia-passport-vi.png",
    alt: "Scotiabank Passport Visa Infinite",
    issuer: "Scotiabank",
    name: "Passport Visa Infinite",
    value: "~$500",
    portal: "+$150 via GCR",
    tag: "No FX fees",
    tagColor: "bg-blue-100 text-blue-800",
    href: "/cards/scotia-passport-vi",
  },
];

const HOW_IT_WORKS = [
  {
    number: "01",
    title: "Find the right card",
    body: "Browse 75+ Canadian cards filtered by what matters to you — annual fee, program, issuer, or first-year value. Every card shows exactly what you'd earn in year one.",
  },
  {
    number: "02",
    title: "Apply through the highest-paying portal",
    body: "Rebate portals like GCR and Frugal Flyer pay you $50–$200 in cash just for applying through their link. We compare all of them side-by-side so you never miss the best payout.",
  },
  {
    number: "03",
    title: "Track until it's done",
    body: "Log your card in the free dashboard. ChurnCA watches your MSR deadline, annual fee date, and cancel window — so every dollar of value gets captured.",
  },
];

const TRACKER_FEATURES = [
  { icon: "📅", label: "MSR deadline tracker", desc: "See exactly how much you've spent and how much is left before your bonus window closes." },
  { icon: "💳", label: "Annual fee alerts", desc: "Get warned before your annual fee renews so you can decide whether to keep or cancel." },
  { icon: "✂️", label: "Cancel window reminder", desc: "We flag the 30-day window before your fee hits — the safe zone to cancel without paying again." },
  { icon: "📊", label: "Full card history", desc: "See every card you've held, what you earned, and what's still in progress — in one view." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-red-50 opacity-60 blur-3xl" />
          <div className="absolute top-1/2 -left-24 w-80 h-80 rounded-full bg-orange-50 opacity-50 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-red-50 text-red-900 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-red-900 inline-block" />
              Built for Canadian cardholders
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-[1.08] tracking-tight">
              Your spending<br />
              should be<br />
              <span className="text-red-900">working for you</span>
            </h1>

            <p className="mt-6 text-lg text-gray-500 leading-relaxed max-w-md">
              Canadians who optimize their credit cards earn $1,000–$2,000+ a year in free travel and cash back — from money they were already spending. ChurnCA shows you exactly how.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/cards" className="bg-red-900 hover:bg-red-800 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors shadow-sm">
                Browse 75+ cards →
              </Link>
              <Link href="/auth" className="bg-white hover:bg-gray-50 text-gray-900 font-semibold px-6 py-3 rounded-xl text-sm border border-gray-200 transition-colors">
                Track my cards free
              </Link>
            </div>

            <div className="mt-10 flex gap-8">
              <div>
                <p className="text-3xl font-black text-gray-900">75+</p>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">Cards tracked</p>
              </div>
              <div className="w-px bg-gray-100" />
              <div>
                <p className="text-3xl font-black text-gray-900">4</p>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">Portals compared</p>
              </div>
              <div className="w-px bg-gray-100" />
              <div>
                <p className="text-3xl font-black text-red-900">$0</p>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">To use ChurnCA</p>
              </div>
            </div>
          </div>

          {/* Right — card stack */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-[420px] h-[320px]">
              {HERO_CARDS.map((card) => (
                <div
                  key={card.src}
                  className={`absolute inset-0 flex items-center justify-center ${card.z} transform ${card.rotate} ${card.offset} transition-transform duration-300`}
                >
                  <div className="relative w-80 aspect-[1.586/1] rounded-2xl overflow-hidden shadow-2xl">
                    <Image src={card.src} alt={card.alt} fill className="object-cover" />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── The math ── */}
      <section className="bg-gray-950 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left — copy */}
            <div>
              <p className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-3">The real numbers</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-5">
                A single well-timed card<br />can put $1,000+ back<br />in your pocket
              </h2>
              <p className="text-gray-400 leading-relaxed mb-6">
                Welcome bonuses are designed to reward new cardholders with a large upfront value. When you add a rebate portal payout on top, the math is hard to ignore — even after the annual fee.
              </p>
              <p className="text-gray-400 leading-relaxed">
                Most people leave this money behind simply because they don&apos;t know it exists. ChurnCA makes the whole picture visible before you apply.
              </p>
              <Link href="/cards" className="inline-block mt-8 bg-red-900 hover:bg-red-800 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
                See current offers →
              </Link>
            </div>

            {/* Right — math card */}
            <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-6">Example: Amex Platinum, year one</p>

              <div className="flex flex-col gap-4 mb-6">
                {MATH_ROWS.map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">{row.label}</span>
                    <span className={`font-bold text-lg ${row.color}`}>{row.value}</span>
                  </div>
                ))}
                <div className="border-t border-gray-700 pt-4 flex items-center justify-between">
                  <span className="text-white font-bold">Net gain, year one</span>
                  <span className="text-white font-black text-2xl">$1,126</span>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                Based on 110,000 MR pts redeemed via Aeroplan at ~2¢/pt. Portal rate subject to change. Always verify before applying.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── Portal trust bar ── */}
      <div className="border-y border-gray-100 bg-gray-50 py-4">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500 font-medium">
          <span className="text-gray-400">We compare rebate portals so you earn the most:</span>
          {[
            { name: "Great Canadian Rebates", short: "GCR",  color: "bg-blue-600"    },
            { name: "Frugal Flyer",           short: "FF",   color: "bg-sky-500"     },
            { name: "Credit Card Genius",     short: "CCG",  color: "bg-purple-600"  },
            { name: "Finly Wealth",           short: "FW",   color: "bg-emerald-600" },
          ].map(p => (
            <div key={p.short} className="flex items-center gap-1.5">
              <span className={`${p.color} text-white text-[10px] font-bold px-1.5 py-0.5 rounded`}>{p.short}</span>
              <span>{p.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-red-900 uppercase tracking-widest mb-2">Simple process</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">From browsing to bonus in three steps</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">No spreadsheets. No guesswork. ChurnCA handles the research so you can focus on the rewards.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.number} className="relative flex flex-col items-center text-center px-8 pb-10 md:pb-0">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-1/2 w-full h-px bg-gray-200" />
                )}
                <div className="relative z-10 w-20 h-20 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center mb-6">
                  <span className="text-2xl font-black text-red-900">{step.number}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured cards ── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold text-red-900 uppercase tracking-widest mb-1">Top picks right now</p>
              <h2 className="text-3xl font-bold text-gray-900">Cards worth applying for</h2>
            </div>
            <Link href="/cards" className="text-sm font-medium text-red-900 hover:underline hidden sm:block">
              View all 75+ cards →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {FEATURED_CARDS.map(card => (
              <div key={card.src} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden flex flex-col">
                <div className="relative w-full aspect-[1.8/1] bg-gray-100">
                  <Image src={card.src} alt={card.alt} fill className="object-contain p-4" />
                  <span className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full ${card.tagColor}`}>
                    {card.tag}
                  </span>
                </div>
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{card.issuer}</p>
                    <h3 className="font-bold text-gray-900 mt-0.5">{card.name}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-orange-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-orange-400 font-medium mb-0.5">1st Year Value</p>
                      <p className="font-bold text-orange-600 text-sm">{card.value}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-green-500 font-medium mb-0.5">Best Portal</p>
                      <p className="font-bold text-green-700 text-sm">{card.portal}</p>
                    </div>
                  </div>
                  <Link
                    href={card.href}
                    className="mt-auto w-full text-center bg-red-900 hover:bg-red-800 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                  >
                    View & apply
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center sm:hidden">
            <Link href="/cards" className="text-sm font-medium text-red-900 hover:underline">View all 75+ cards →</Link>
          </div>
        </div>
      </section>

      {/* ── Tracker feature highlight ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left — copy */}
            <div>
              <p className="text-xs font-semibold text-red-900 uppercase tracking-widest mb-3">Free card tracker</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-5">
                The bonus is just the start.<br />
                <span className="text-red-900">Keeping track is how you win.</span>
              </h2>
              <p className="text-gray-500 leading-relaxed mb-4">
                Missing an MSR deadline means losing the welcome bonus entirely. Forgetting to cancel before your annual fee means paying $120–$799 for a card you don&apos;t need. These are expensive, avoidable mistakes.
              </p>
              <p className="text-gray-500 leading-relaxed mb-8">
                ChurnCA&apos;s free dashboard tracks every card you hold — MSR progress, annual fee date, and the 30-day cancel window — so nothing slips through the cracks.
              </p>
              <Link href="/auth" className="inline-flex items-center gap-2 bg-red-900 hover:bg-red-800 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
                Create free account →
              </Link>
            </div>

            {/* Right — feature grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TRACKER_FEATURES.map(f => (
                <div key={f.label} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                  <div className="text-2xl mb-3">{f.icon}</div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1.5">{f.label}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── Blog strip ── */}
      <section className="bg-gray-50 border-t border-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold text-red-900 uppercase tracking-widest mb-1">Learn the game</p>
              <h2 className="text-2xl font-bold text-gray-900">Guides & strategy</h2>
            </div>
            <Link href="/blog" className="text-sm font-medium text-red-900 hover:underline hidden sm:block">
              All posts →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { title: "Credit Card Churning Canada: A Beginner's Guide", slug: "credit-card-churning-canada-beginners-guide", tag: "Beginner Guide" },
              { title: "How to Hit Your Minimum Spend Requirement (MSR)", slug: "how-to-hit-minimum-spend-requirement-canada", tag: "Strategy" },
              { title: "Best Aeroplan Credit Card in Canada (2025)", slug: "best-aeroplan-credit-card-canada-2025", tag: "Top Picks" },
            ].map(post => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-6 flex flex-col gap-3">
                <span className="text-xs font-semibold text-red-900 bg-red-50 px-2.5 py-1 rounded-full w-fit">{post.tag}</span>
                <h3 className="font-bold text-gray-900 text-sm leading-snug group-hover:text-red-900 transition-colors">{post.title}</h3>
                <span className="text-xs text-red-900 font-medium mt-auto">Read more →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="mx-6 my-20 rounded-3xl bg-red-900 overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full bg-red-800 opacity-50" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-red-800 opacity-40" />
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex gap-4 opacity-30">
          {["/cards/amex-marriott-biz.png", "/cards/bmo-ascend.webp"].map((src, i) => (
            <div key={i} className={`relative w-48 aspect-[1.586/1] rounded-xl overflow-hidden ${i === 0 ? "rotate-[-6deg]" : "rotate-[4deg] translate-y-3"}`}>
              <Image src={src} alt="" fill className="object-cover" />
            </div>
          ))}
        </div>
        <div className="relative px-10 py-16 max-w-lg">
          <h2 className="text-3xl font-bold text-white leading-tight mb-3">
            Ready to make your<br />spending work harder?
          </h2>
          <p className="text-red-200 text-sm mb-8 leading-relaxed">
            Browse 75+ Canadian card offers, compare rebate portals, and track every card in your wallet — all free, forever.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/auth" className="bg-white text-red-900 hover:bg-red-50 font-semibold px-6 py-3 rounded-xl text-sm transition-colors shadow-sm">
              Get started free →
            </Link>
            <Link href="/cards" className="bg-red-800 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl text-sm border border-red-700 transition-colors">
              Browse cards first
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <span className="font-bold text-gray-600 text-sm">ChurnCA</span>
          <div className="flex gap-5">
            <Link href="/cards"     className="hover:text-gray-600 transition-colors">Credit Cards</Link>
            <Link href="/blog"      className="hover:text-gray-600 transition-colors">Blog</Link>
            <Link href="/auth"      className="hover:text-gray-600 transition-colors">Sign up</Link>
            <Link href="/dashboard" className="hover:text-gray-600 transition-colors">Dashboard</Link>
          </div>
          <p>Offers change frequently — always verify before applying.</p>
        </div>
      </footer>
    </div>
  );
}
