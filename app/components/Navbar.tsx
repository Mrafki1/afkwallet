"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../lib/supabase";

export default function Navbar({ activePage }: { activePage?: "cards" | "blog" }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setLoggedIn(!!s));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-20">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

        {/* Left — logo + desktop links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">ChurnCA</Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
            <Link
              href="/cards"
              className={`hover:text-gray-900 transition-colors ${activePage === "cards" ? "text-gray-900 border-b-2 border-red-900 pb-0.5" : ""}`}
            >
              Credit Cards
            </Link>
            <Link
              href="/blog"
              className={`hover:text-gray-900 transition-colors ${activePage === "blog" ? "text-gray-900 border-b-2 border-red-900 pb-0.5" : ""}`}
            >
              Blog
            </Link>
            <Link href="/#how-it-works" className="hover:text-gray-900 transition-colors">How It Works</Link>
          </div>
        </div>

        {/* Right — CTA + hamburger */}
        <div className="flex items-center gap-3">
          {loggedIn ? (
            <Link href="/dashboard" className="bg-red-900 hover:bg-red-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              Dashboard
            </Link>
          ) : (
            <Link href="/auth" className="bg-red-900 hover:bg-red-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              Log in
            </Link>
          )}

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 flex flex-col gap-4">
          <Link
            href="/cards"
            onClick={() => setMenuOpen(false)}
            className="text-sm font-medium text-gray-700 hover:text-red-900 transition-colors"
          >
            Credit Cards
          </Link>
          <Link
            href="/blog"
            onClick={() => setMenuOpen(false)}
            className="text-sm font-medium text-gray-700 hover:text-red-900 transition-colors"
          >
            Blog
          </Link>
          <Link
            href="/#how-it-works"
            onClick={() => setMenuOpen(false)}
            className="text-sm font-medium text-gray-700 hover:text-red-900 transition-colors"
          >
            How It Works
          </Link>
          {loggedIn && (
            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium text-gray-700 hover:text-red-900 transition-colors"
            >
              My Dashboard
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
