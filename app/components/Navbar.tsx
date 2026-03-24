"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../lib/supabase";

export default function Navbar({ activePage }: { activePage?: "cards" | "blog" | "deals" }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setLoggedIn(!!s));
    return () => subscription.unsubscribe();
  }, []);

  const linkClass = (page?: string) =>
    `transition-colors font-semibold text-sm drop-shadow-[1px_1px_0px_rgba(61,39,16,0.7)] ${
      activePage === page ? "text-[#f0c840]" : "text-[#f5ead8] hover:text-[#f0c840]"
    }`;

  return (
    <nav
      className="sticky top-0 z-20"
      style={{
        background: "linear-gradient(to bottom, #9b7245 0%, #8b6343 35%, #7a5430 65%, #8b6343 100%)",
        borderBottom: "4px solid #5a3c20",
        boxShadow: "0 3px 0px #3d2710",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

        {/* Logo + desktop links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-1.5 group">
            <span className="text-base font-pixel text-[#f0c840] group-hover:text-[#f5d870] transition-colors drop-shadow-[1px_1px_0px_rgba(61,39,16,0.9)]">
              AFK
            </span>
            <span className="text-base font-pixel text-[#f5ead8] drop-shadow-[1px_1px_0px_rgba(61,39,16,0.9)]">
              WALLET
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/cards"         className={linkClass("cards")}>Cards</Link>
            <Link href="/deals"         className={linkClass("deals")}>⚡ Hot Deals</Link>
            <Link href="/blog"          className={linkClass("blog")}>Blog</Link>
            <Link href="/#how-it-works" className={linkClass()}>How It Works</Link>
          </div>
        </div>

        {/* Right — CTA + hamburger */}
        <div className="flex items-center gap-3">
          <Link
            href={loggedIn ? "/dashboard" : "/auth"}
            className="sdv-btn text-sm font-pixel px-4 py-2"
          >
            {loggedIn ? "Dashboard" : "Start Free"}
          </Link>
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="md:hidden p-2 transition-colors"
            style={{ color: "#f5ead8" }}
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
          className="md:hidden px-6 py-4 flex flex-col gap-4"
          style={{ background: "#7a5430", borderTop: "2px solid #5a3c20" }}
        >
          <Link href="/cards"         onClick={() => setMenuOpen(false)} className={linkClass("cards")}>Cards</Link>
          <Link href="/deals"         onClick={() => setMenuOpen(false)} className={linkClass("deals")}>⚡ Hot Deals</Link>
          <Link href="/blog"          onClick={() => setMenuOpen(false)} className={linkClass("blog")}>Blog</Link>
          <Link href="/#how-it-works" onClick={() => setMenuOpen(false)} className={linkClass()}>How It Works</Link>
          {loggedIn && (
            <Link href="/dashboard"   onClick={() => setMenuOpen(false)} className={linkClass()}>My Dashboard</Link>
          )}
        </div>
      )}
    </nav>
  );
}
