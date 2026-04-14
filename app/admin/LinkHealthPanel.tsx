"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { LinkHealthRow } from "../lib/cards-db";

function statusStyle(status: string): { bg: string; color: string } {
  if (status === "broken") return { bg: "#fee2e2", color: "#b91c1c" };
  if (status === "unknown") return { bg: "#fef3c7", color: "#92400e" };
  return { bg: "#dcfce7", color: "#166534" };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-CA", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export default function LinkHealthPanel({ rows: initialRows }: { rows: LinkHealthRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "broken" | "unknown">("broken");
  const [suggestFor, setSuggestFor] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Record<string, Array<{ url: string; score: number }>>>({});
  const [suggestBusy, setSuggestBusy] = useState<string | null>(null);

  const visible = rows.filter(r => filter === "all" ? true : r.status === filter);

  async function recheck(cardId: string) {
    setBusy(cardId);
    try {
      const res = await fetch("/api/admin/recheck-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Recheck failed: ${data.error ?? "unknown"}`);
        return;
      }
      // Optimistically update rows for this card
      const now = new Date().toISOString();
      setRows(prev => {
        const others = prev.filter(r => r.card_id !== cardId);
        const cardName = prev.find(r => r.card_id === cardId)?.card_name ?? null;
        const updated: LinkHealthRow[] = (data.results as Array<{ label: string; status: string; reason: string }>).map(r => {
          const [kind, portalName] = r.label.startsWith("portal:")
            ? ["portal" as const, r.label.slice(7)]
            : ["direct" as const, null];
          return {
            card_id: cardId,
            card_name: cardName,
            kind,
            portal_name: portalName,
            url: "",
            status: r.status as "ok" | "broken" | "unknown",
            reason: r.reason,
            checked_at: now,
          };
        });
        return [...updated, ...others];
      });
    } catch (err) {
      alert(`Recheck error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(null);
    }
  }

  async function suggest(cardId: string) {
    setSuggestBusy(cardId);
    try {
      const res = await fetch("/api/admin/suggest-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Suggest failed: ${data.error ?? "unknown"}`);
        return;
      }
      setSuggestions(prev => ({ ...prev, [cardId]: data.candidates ?? [] }));
      setSuggestFor(cardId);
      if ((data.candidates ?? []).length === 0) {
        alert(data.reason ?? "No candidate URLs found on issuer site");
      }
    } catch (err) {
      alert(`Suggest error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSuggestBusy(null);
    }
  }

  async function applySuggestion(cardId: string, url: string) {
    if (!confirm(`Set direct_link for this card to:\n\n${url}\n\nProceed?`)) return;
    setSuggestBusy(cardId);
    try {
      const res = await fetch("/api/admin/update-direct-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, url }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Apply failed: ${data.error ?? "unknown"}`);
        return;
      }
      setSuggestFor(null);
      await recheck(cardId);
    } finally {
      setSuggestBusy(null);
    }
  }

  const counts = {
    broken: rows.filter(r => r.status === "broken").length,
    unknown: rows.filter(r => r.status === "unknown").length,
    ok: rows.filter(r => r.status === "ok").length,
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #f1f5f9", background: "#0f172a" }}>
        <h2 className="font-bold text-sm text-white">
          Link health — {counts.broken} broken, {counts.unknown} unknown, {counts.ok} ok
        </h2>
        <div className="flex gap-2">
          {(["broken", "unknown", "all"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{
                background: filter === f ? "#2563eb" : "#1e293b",
                color: "white",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="px-6 py-8 text-sm text-center" style={{ color: "#94a3b8" }}>
          No {filter === "all" ? "" : filter} links.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#64748b" }}>Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#64748b" }}>Card</th>
                <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#64748b" }}>Kind</th>
                <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#64748b" }}>Reason</th>
                <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#64748b" }}>Checked</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "#f8fafc" }}>
              {visible.map((r, i) => {
                const s = statusStyle(r.status);
                const key = `${r.card_id}-${r.kind}-${r.portal_name ?? "direct"}-${i}`;
                return (
                  <React.Fragment key={key}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full uppercase" style={{ background: s.bg, color: s.color }}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/cards/${r.card_id}`} className="text-xs font-medium hover:underline" style={{ color: "#2563eb" }}>
                        {r.card_name ?? r.card_id}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: "#64748b" }}>
                      {r.kind === "portal" ? `portal:${r.portal_name}` : "direct"}
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: "#64748b" }}>{r.reason ?? "—"}</td>
                    <td className="px-5 py-3 text-xs whitespace-nowrap" style={{ color: "#94a3b8" }}>
                      {formatDate(r.checked_at)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => recheck(r.card_id)}
                          disabled={busy === r.card_id}
                          className="text-xs font-semibold px-3 py-1 rounded-lg"
                          style={{
                            background: busy === r.card_id ? "#e2e8f0" : "#2563eb",
                            color: busy === r.card_id ? "#94a3b8" : "white",
                            cursor: busy === r.card_id ? "wait" : "pointer",
                          }}
                        >
                          {busy === r.card_id ? "Checking…" : "Recheck"}
                        </button>
                        {r.kind === "direct" && r.status === "broken" && (
                          <button
                            onClick={() => suggest(r.card_id)}
                            disabled={suggestBusy === r.card_id}
                            className="text-xs font-semibold px-3 py-1 rounded-lg"
                            style={{
                              background: suggestBusy === r.card_id ? "#e2e8f0" : "#f59e0b",
                              color: "white",
                              cursor: suggestBusy === r.card_id ? "wait" : "pointer",
                            }}
                          >
                            {suggestBusy === r.card_id ? "Scanning…" : "Suggest"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {suggestFor === r.card_id && suggestions[r.card_id] && suggestions[r.card_id].length > 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-3" style={{ background: "#fffbeb", borderTop: "1px solid #fde68a" }}>
                        <p className="text-xs font-semibold mb-2" style={{ color: "#92400e" }}>
                          Candidate replacement URLs (ranked by name match):
                        </p>
                        <ul className="flex flex-col gap-1">
                          {suggestions[r.card_id].map((c, j) => (
                            <li key={j} className="flex items-center gap-3">
                              <span className="text-xs font-mono flex-1 truncate" style={{ color: "#0f172a" }}>{c.url}</span>
                              <span className="text-xs" style={{ color: "#94a3b8" }}>score {c.score.toFixed(1)}</span>
                              <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold" style={{ color: "#2563eb" }}>open ↗</a>
                              <button
                                onClick={() => applySuggestion(r.card_id, c.url)}
                                className="text-xs font-semibold px-3 py-1 rounded-lg"
                                style={{ background: "#16a34a", color: "white" }}
                              >
                                Use
                              </button>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
