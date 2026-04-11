"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "../lib/supabase";

const BEST_LINKS = [
  { href: "/best/travel-cards",    label: "✈️  Best Travel Cards" },
  { href: "/best/no-fee-cards",    label: "🆓  Best No-Fee Cards" },
  { href: "/best/cash-back-cards", label: "💵  Best Cash Back" },
  { href: "/best/lounge-access",   label: "🛋️  Lounge Access" },
  { href: "/best/no-fx-fee",       label: "🌍  No FX Fees" },
];

export default function Navbar({ activePage }: { activePage?: "cards" | "blog" | "deals" | "about" | "compare" | "best" }) {
  const [loggedIn, setLoggedIn]     = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const [bestOpen, setBestOpen]     = useState(false);
  const [mobileBest, setMobileBest] = useState(false);
  const bestRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setLoggedIn(!!s));

    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);

    function handleClickOutside(e: MouseEvent) {
      if (bestRef.current && !bestRef.current.contains(e.target as Node)) {
        setBestOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const linkClass = (page?: string) =>
    `text-sm font-medium transition-colors ${
      activePage === page
        ? "text-[#2563eb]"
        : "text-[#374151] hover:text-[#0f172a]"
    }`;

  return (
    <nav
      className="sticky top-0 z-50 bg-white"
      style={{
        borderBottom: "1px solid #e2e8f0",
        boxShadow: scrolled ? "0 1px 8px rgba(0,0,0,0.06)" : "none",
        transition: "box-shadow 0.2s",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo + desktop links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div
              className="w-7 h-7 flex items-center justify-center rounded-lg text-white text-xs font-bold"
              style={{ background: "#2563eb" }}
            >
              P
            </div>
            <span className="font-bold text-base tracking-tight" style={{ color: "#0f172a" }}>
              PointsBinder
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/cards"   className={linkClass("cards")}>Cards</Link>
            <Link href="/compare" className={linkClass("compare")}>Compare</Link>
            <Link href="/deals"   className={linkClass("deals")}>⚡ Hot Deals</Link>

            {/* Best dropdown */}
            <div ref={bestRef} className="relative">
              <button
                onClick={() => setBestOpen(o => !o)}
                className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                  activePage === "best" ? "text-[#2563eb]" : "text-[#374151] hover:text-[#0f172a]"
                }`}
              >
                Best Cards
                <svg
                  className="w-3.5 h-3.5 mt-px transition-transform duration-150"
                  style={{ transform: bestOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {bestOpen && (
                <div
                  className="absolute top-full left-0 mt-2 w-52 rounded-2xl overflow-hidden py-1"
                  style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}
                >
                  {BEST_LINKS.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setBestOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
                      style={{ color: "#374151" }}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div className="mx-4 my-1" style={{ borderTop: "1px solid #f1f5f9" }} />
                  <Link
                    href="/best"
                    onClick={() => setBestOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 transition-colors"
                    style={{ color: "#2563eb" }}
                  >
                    All categories →
                  </Link>
                </div>
              )}
            </div>

            <Link href="/blog"  className={linkClass("blog")}>Blog</Link>
            <Link href="/about" className={linkClass("about")}>About</Link>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("pb:open-quiz"))}
              className="text-sm font-medium transition-colors text-[#374151] hover:text-[#0f172a]"
            >
              ✨ Quiz
            </button>
          </div>
        </div>

        {/* Right — CTA + hamburger */}
        <div className="flex items-center gap-3">
          <Link
            href={loggedIn ? "/dashboard" : "/auth"}
            className="btn-primary text-sm px-4 py-2 hidden sm:inline-block"
          >
            {loggedIn ? "Dashboard" : "Login / Sign Up"}
          </Link>
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden px-6 py-4 flex flex-col gap-1 border-t"
          style={{ background: "#ffffff", borderColor: "#e2e8f0" }}
        >
          {[
            { href: "/cards",   label: "Cards",        page: "cards"   },
            { href: "/compare", label: "Compare",      page: "compare" },
            { href: "/deals",   label: "⚡ Hot Deals", page: "deals"   },
            { href: "/blog",    label: "Blog",         page: "blog"    },
            { href: "/about",   label: "About",        page: "about"   },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`py-2.5 text-sm font-medium ${activePage === item.page ? "text-blue-600" : "text-gray-700"}`}
            >
              {item.label}
            </Link>
          ))}

          {/* Best Cards accordion */}
          <button
            onClick={() => setMobileBest(o => !o)}
            className="flex items-center justify-between py-2.5 text-sm font-medium text-gray-700 w-full"
          >
            <span className={activePage === "best" ? "text-blue-600" : ""}>Best Cards</span>
            <svg
              className="w-3.5 h-3.5 transition-transform duration-150"
              style={{ transform: mobileBest ? "rotate(180deg)" : "rotate(0deg)" }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {mobileBest && (
            <div className="flex flex-col gap-0 pl-3 mb-1" style={{ borderLeft: "2px solid #e2e8f0" }}>
              {BEST_LINKS.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => { setMenuOpen(false); setMobileBest(false); }}
                  className="py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}

          <button
            onClick={() => { setMenuOpen(false); window.dispatchEvent(new CustomEvent("pb:open-quiz")); }}
            className="py-2.5 text-sm font-medium text-gray-700 text-left"
          >
            ✨ Take the Quiz
          </button>
          <div className="pt-3 border-t mt-1" style={{ borderColor: "#e2e8f0" }}>
            <Link
              href={loggedIn ? "/dashboard" : "/auth"}
              onClick={() => setMenuOpen(false)}
              className="btn-primary text-sm px-4 py-2.5 w-full text-center block"
            >
              {loggedIn ? "Dashboard" : "Login / Sign Up"}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
