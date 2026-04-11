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

  async function handleOAuth(provider: "google" | "github") {
    setError("");
    setLoading(true);
    const redirect = searchParams.get("redirect") ?? "/dashboard";
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`,
      },
    });
    if (error) { setError(error.message); setLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "forgot") {
      const res = await fetch("/api/send-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) { setError("Failed to send reset email. Try again."); setLoading(false); return; }
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

          {/* OAuth buttons */}
          {mode !== "forgot" && (
            <div className="flex flex-col gap-2 mb-5">
              <button
                type="button"
                onClick={() => handleOAuth("google")}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 rounded-lg text-sm font-semibold transition-colors hover:bg-gray-50 disabled:opacity-50"
                style={{ border: "1.5px solid #e2e8f0", color: "#0f172a", background: "#fff" }}
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              <button
                type="button"
                onClick={() => handleOAuth("github")}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 rounded-lg text-sm font-semibold transition-colors hover:bg-gray-50 disabled:opacity-50"
                style={{ border: "1.5px solid #e2e8f0", color: "#0f172a", background: "#fff" }}
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                Continue with GitHub
              </button>

              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px" style={{ background: "#e2e8f0" }} />
                <span className="text-xs font-medium" style={{ color: "#94a3b8" }}>or</span>
                <div className="flex-1 h-px" style={{ background: "#e2e8f0" }} />
              </div>
            </div>
          )}

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
