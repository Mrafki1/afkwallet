"use client";

import { useState } from "react";

export default function ElevatedToggle({
  cardId,
  cardName,
  elevated,
  elevatedNote,
}: {
  cardId: string;
  cardName: string;
  elevated: boolean;
  elevatedNote?: string | null;
}) {
  const [current, setCurrent] = useState(elevated);
  const [note, setNote] = useState(elevatedNote ?? "");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  async function toggle(newElevated: boolean) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/set-elevated", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, elevated: newElevated, note: note || undefined }),
      });
      if (res.ok) {
        setCurrent(newElevated);
        if (!newElevated) setNote("");
        setEditing(false);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <button
          onClick={() => current ? toggle(false) : setEditing(e => !e)}
          disabled={loading}
          className="text-xs font-semibold px-3 py-1 rounded-full transition-colors"
          style={{
            background: current ? "#fef2f2" : "#f0fdf4",
            border: `1px solid ${current ? "#fecaca" : "#bbf7d0"}`,
            color: current ? "#dc2626" : "#16a34a",
          }}
        >
          {loading ? "…" : current ? "🔥 HOT — click to remove" : "Mark as HOT"}
        </button>
      </div>

      {(editing || (current && note)) && (
        <div className="flex items-center gap-2 mt-1">
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Offer note (e.g. Highest ever offer — ends May 31)"
            className="flex-1 text-xs px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-400"
            style={{ borderColor: "#e2e8f0" }}
            onKeyDown={e => { if (e.key === "Enter") toggle(true); }}
          />
          {editing && (
            <button
              onClick={() => toggle(true)}
              disabled={loading}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: "#2563eb", color: "#fff" }}
            >
              Save
            </button>
          )}
        </div>
      )}
    </div>
  );
}
