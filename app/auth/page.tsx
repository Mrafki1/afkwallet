"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { createClient } from "../lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthPage() {
  return <Suspense><AuthForm /></Suspense>;
}

function AuthForm() {
  const [mode, setMode]         = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset`,
      });
      if (error) { setError(error.message); setLoading(false); return; }
      setError("Check your email for a password reset link.");
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      setError("Check your email for a confirmation link.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    const redirect = searchParams.get("redirect");
    router.push(redirect ?? "/dashboard");
  }

  function switchMode(next: "login" | "signup" | "forgot") {
    setMode(next);
    setError("");
  }

  const headings = {
    login:  { title: "Welcome back",   sub: "Log in to view your card tracker." },
    signup: { title: "Create account", sub: "Start tracking your cards for free." },
    forgot: { title: "Reset password", sub: "We'll send a reset link to your email." },
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#f8fafc" }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <div
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white text-sm font-bold"
            style={{ background: "#2563eb" }}
          >
            P
          </div>
          <span className="font-bold text-lg tracking-tight" style={{ color: "#0f172a" }}>PointsBinder</span>
        </Link>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8" style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h1 className="text-2xl font-bold mb-1 tracking-tight" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>
            {headings[mode].title}
          </h1>
          <p className="text-sm mb-6" style={{ color: "#64748b" }}>{headings[mode].sub}</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: "#374151" }}>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
                style={{ border: "1.5px solid #e2e8f0", color: "#0f172a" }}
                onFocus={e => e.target.style.borderColor = "#2563eb"}
                onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                placeholder="you@example.com"
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold" style={{ color: "#374151" }}>Password</label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="text-xs font-medium hover:underline"
                      style={{ color: "#2563eb" }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
                  style={{ border: "1.5px solid #e2e8f0", color: "#0f172a" }}
                  onFocus={e => e.target.style.borderColor = "#2563eb"}
                  onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                  placeholder="••••••••"
                />
              </div>
            )}

            {error && (
              <p className={`text-xs font-medium`} style={{ color: error.startsWith("Check") ? "#16a34a" : "#dc2626" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-sm disabled:opacity-50"
            >
              {loading ? "Please wait…" : mode === "login" ? "Log in" : mode === "signup" ? "Create account" : "Send reset link"}
            </button>
          </form>

          <div className="text-xs mt-6 text-center" style={{ color: "#64748b" }}>
            {mode === "forgot" ? (
              <p>
                Back to{" "}
                <button onClick={() => switchMode("login")} className="font-semibold hover:underline" style={{ color: "#2563eb" }}>
                  Log in
                </button>
              </p>
            ) : (
              <p>
                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                  className="font-semibold hover:underline"
                  style={{ color: "#2563eb" }}
                >
                  {mode === "login" ? "Sign up" : "Log in"}
                </button>
              </p>
            )}
          </div>
        </div>

        <p className="text-xs text-center mt-6" style={{ color: "#94a3b8" }}>
          Not financial advice. Always verify offers before applying.
        </p>
      </div>
    </div>
  );
}
