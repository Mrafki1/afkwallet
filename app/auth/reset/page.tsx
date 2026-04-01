"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

export default function ResetPasswordPage() {
  return <Suspense><ResetForm /></Suspense>;
}

function ResetForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [ready, setReady]       = useState(false);
  const [invalid, setInvalid]   = useState(false);
  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createClient();

  useEffect(() => {
    // If the callback route failed (code expired / already used), show error immediately
    if (searchParams.get("error") === "invalid") {
      setInvalid(true);
      return;
    }

    // The server-side callback route already exchanged the code for a session.
    // Just verify the session is active.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
      } else {
        // No session — wait briefly for PASSWORD_RECOVERY event (implicit-flow fallback)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
          if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
        });
        const timeout = setTimeout(() => setInvalid(true), 5000);
        return () => { subscription.unsubscribe(); clearTimeout(timeout); };
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords don't match."); return; }
    if (password.length < 6)  { setError("Password must be at least 6 characters."); return; }
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/dashboard");
  }

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
            Set new password
          </h1>
          <p className="text-sm mb-6" style={{ color: "#64748b" }}>Choose a strong password for your account.</p>

          {invalid ? (
            <div className="text-center py-4">
              <p className="text-sm font-medium mb-4" style={{ color: "#dc2626" }}>
                This reset link has expired or is invalid.
              </p>
              <Link href="/auth" className="btn-primary text-sm px-5 py-2.5 inline-block">
                Request a new link
              </Link>
            </div>
          ) : !ready ? (
            <div className="flex items-center justify-center gap-2 py-8" style={{ color: "#94a3b8" }}>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="text-sm">Verifying reset link…</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: "#374151" }}>New password</label>
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
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: "#374151" }}>Confirm password</label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
                  style={{ border: "1.5px solid #e2e8f0", color: "#0f172a" }}
                  onFocus={e => e.target.style.borderColor = "#2563eb"}
                  onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-xs font-medium" style={{ color: "#dc2626" }}>{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 text-sm disabled:opacity-50"
              >
                {loading ? "Saving…" : "Update password"}
              </button>
            </form>
          )}
        </div>

        <p className="text-xs text-center mt-6" style={{ color: "#94a3b8" }}>
          Not financial advice. Always verify offers before applying.
        </p>
      </div>
    </div>
  );
}
