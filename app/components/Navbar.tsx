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

  return (
    <nav className="border-b border-slate-800 sticky top-0 bg-[#080d1a]/95 backdrop-blur z-20">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

        {/* Logo + desktop links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-1 group">
            <span className="text-lg font-black text-amber-400 tracking-tight group-hover:text-amber-300 transition-colors font-pixel">AFK</span>
            <span className="text-lg font-black text-white tracking-tight font-pixel">WALLET</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/cards" className={`transition-colors ${activePage === "cards" ? "text-white border-b-2 border-amber-400 pb-0.5" : "text-slate-400 hover:text-white"}`}>
              Cards
            </Link>
            <Link href="/deals" className={`transition-colors ${activePage === "deals" ? "text-white border-b-2 border-amber-400 pb-0.5" : "text-slate-400 hover:text-white"}`}>
              ⚡ Hot Deals
            </Link>
            <Link href="/blog" className={`transition-colors ${activePage === "blog" ? "text-white border-b-2 border-amber-400 pb-0.5" : "text-slate-400 hover:text-white"}`}>
              Blog
            </Link>
            <Link href="/#how-it-works" className="text-slate-400 hover:text-white transition-colors">How It Works</Link>
          </div>
        </div>

        {/* Right — CTA + hamburger */}
        <div className="flex items-center gap-3">
          <Link
            href={loggedIn ? "/dashboard" : "/auth"}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-bold px-4 py-2 rounded-lg transition-colors"
          >
            {loggedIn ? "Dashboard" : "Start Free"}
          </Link>
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#080d1a] px-6 py-4 flex flex-col gap-4">
          <Link href="/cards" onClick={() => setMenuOpen(false)} className={`text-sm font-medium transition-colors ${activePage === "cards" ? "text-amber-400" : "text-slate-400 hover:text-white"}`}>
            Cards
          </Link>
          <Link href="/deals" onClick={() => setMenuOpen(false)} className={`text-sm font-medium transition-colors ${activePage === "deals" ? "text-amber-400" : "text-slate-400 hover:text-white"}`}>
            ⚡ Hot Deals
          </Link>
          <Link href="/blog" onClick={() => setMenuOpen(false)} className={`text-sm font-medium transition-colors ${activePage === "blog" ? "text-amber-400" : "text-slate-400 hover:text-white"}`}>
            Blog
          </Link>
          <Link href="/#how-it-works" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
            How It Works
          </Link>
          {loggedIn && (
            <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              My Dashboard
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
