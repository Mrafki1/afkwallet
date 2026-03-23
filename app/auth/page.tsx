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
        redirectTo: `${window.location.origin}/auth/reset`,
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
    login:  { title: "Welcome back",      sub: "Log in to view your card tracker." },
    signup: { title: "Create account",    sub: "Start tracking your cards for free." },
    forgot: { title: "Reset password",    sub: "We'll send a reset link to your email." },
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 w-full max-w-sm p-8">

        <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight block mb-8">ChurnCA</Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">{headings[mode].title}</h1>
        <p className="text-sm text-gray-500 mb-6">{headings[mode].sub}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
              placeholder="you@example.com"
            />
          </div>

          {mode !== "forgot" && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-600">Password</label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => switchMode("forgot")}
                    className="text-xs text-red-900 hover:underline"
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
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                placeholder="••••••••"
              />
            </div>
          )}

          {error && (
            <p className={`text-xs ${error.startsWith("Check") ? "text-green-600" : "text-red-500"}`}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-red-900 hover:bg-red-800 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
          >
            {loading ? "Please wait..." : mode === "login" ? "Log in" : mode === "signup" ? "Create account" : "Send reset link"}
          </button>
        </form>

        <div className="text-xs text-gray-500 mt-6 text-center flex flex-col gap-2">
          {mode === "forgot" ? (
            <p>
              Back to{" "}
              <button onClick={() => switchMode("login")} className="text-red-900 font-medium hover:underline">
                Log in
              </button>
            </p>
          ) : (
            <>
              <p>
                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                  className="text-red-900 font-medium hover:underline"
                >
                  {mode === "login" ? "Sign up" : "Log in"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
