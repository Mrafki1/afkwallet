"use client";

import { useState } from "react";

type Props = {
  source?: string;
  variant?: "hero" | "inline" | "banner";
};

export default function EmailCapture({ source = "homepage", variant = "inline" }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.alreadySubscribed ? "You're already on the list!" : "You're in — check your inbox.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div
        className="flex items-center gap-3 px-5 py-4 rounded-2xl"
        style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
      >
        <svg className="w-5 h-5 shrink-0" style={{ color: "#16a34a" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <p className="text-sm font-semibold" style={{ color: "#15803d" }}>{message}</p>
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <div>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 px-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ borderColor: "#e2e8f0", color: "#0f172a" }}
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="btn-primary px-6 py-3 text-sm whitespace-nowrap"
          >
            {status === "loading" ? "Subscribing…" : "Get deal alerts →"}
          </button>
        </form>
        {status === "error" && (
          <p className="mt-2 text-xs" style={{ color: "#dc2626" }}>{message}</p>
        )}
        <p className="mt-2 text-xs" style={{ color: "#94a3b8" }}>
          No spam. Just alerts when bonuses go up. Unsubscribe anytime.
        </p>
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div
        className="rounded-2xl px-6 py-8 text-center"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)", border: "1px solid #1e293b" }}
      >
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#60a5fa" }}>Deal Alerts</p>
        <h3 className="text-xl font-bold text-white mb-2" style={{ letterSpacing: "-0.02em" }}>
          Never miss a hot offer
        </h3>
        <p className="text-sm mb-5" style={{ color: "#94a3b8" }}>
          We'll email you when Canadian card bonuses spike — so you apply at the peak, not after.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            style={{ border: "1px solid #334155", background: "rgba(255,255,255,0.07)", color: "#f1f5f9" }}
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="btn-primary px-5 py-2.5 text-sm whitespace-nowrap"
          >
            {status === "loading" ? "…" : "Subscribe →"}
          </button>
        </form>
        {status === "error" && (
          <p className="mt-2 text-xs" style={{ color: "#f87171" }}>{message}</p>
        )}
        <p className="mt-3 text-xs" style={{ color: "#475569" }}>
          No spam. Unsubscribe anytime.
        </p>
      </div>
    );
  }

  // Default: inline
  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ borderColor: "#e2e8f0", color: "#0f172a" }}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="btn-primary px-5 py-2.5 text-sm whitespace-nowrap"
        >
          {status === "loading" ? "…" : "Subscribe →"}
        </button>
      </form>
      {status === "error" && (
        <p className="mt-1.5 text-xs" style={{ color: "#dc2626" }}>{message}</p>
      )}
      <p className="mt-1.5 text-xs" style={{ color: "#94a3b8" }}>No spam. Unsubscribe anytime.</p>
    </div>
  );
}
