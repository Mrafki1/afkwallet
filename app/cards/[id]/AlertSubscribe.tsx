"use client";

import { useState } from "react";

export default function AlertSubscribe({ cardId, cardName }: { cardId: string; cardName: string }) {
  const [email, setEmail]     = useState("");
  const [status, setStatus]   = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/alert-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, cardId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Something went wrong.");
        setStatus("error");
      } else {
        setStatus("done");
      }
    } catch {
      setMessage("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d" }}>
        ✓ You&apos;re on the list — we&apos;ll email you if this offer goes elevated.
      </div>
    );
  }

  return (
    <div className="rounded-xl p-4" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
      <p className="text-xs font-semibold mb-0.5" style={{ color: "#0f172a" }}>Get notified when this offer goes elevated</p>
      <p className="text-xs mb-3" style={{ color: "#64748b" }}>
        We&apos;ll email you if {cardName} runs a higher-than-normal welcome bonus.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 text-sm px-3 py-2 rounded-lg outline-none min-w-0"
          style={{ border: "1px solid #e2e8f0", color: "#0f172a" }}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 shrink-0"
          style={{ background: "#2563eb", color: "#ffffff" }}
        >
          {status === "loading" ? "…" : "Notify me"}
        </button>
      </form>
      {status === "error" && (
        <p className="text-xs mt-2" style={{ color: "#dc2626" }}>{message}</p>
      )}
    </div>
  );
}
