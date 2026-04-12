"use client";

import { useState, useMemo } from "react";

type Portal = { name: string; bonus: number; url: string };
type CardStub = { id: string; name: string; issuer: string; portals: Portal[] };

const PORTAL_NAMES = ["GCR", "FF", "FW", "CCG"];

export default function PortalEditor({ cards }: { cards: CardStub[] }) {
  const [query, setQuery]         = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [portals, setPortals]     = useState<Portal[]>([]);
  const [status, setStatus]       = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errMsg, setErrMsg]       = useState("");
  const [showList, setShowList]   = useState(false);

  const filtered = useMemo(() =>
    query.trim().length < 2 ? [] :
    cards.filter(c =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.issuer.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 12),
  [cards, query]);

  const selectedCard = cards.find(c => c.id === selectedId);

  function selectCard(card: CardStub) {
    setSelectedId(card.id);
    setPortals(card.portals.map(p => ({ ...p })));
    setQuery(card.name);
    setShowList(false);
    setStatus("idle");
  }

  function updatePortal(i: number, field: keyof Portal, value: string) {
    setPortals(prev => {
      const next = [...prev];
      if (field === "bonus") {
        next[i] = { ...next[i], bonus: parseInt(value) || 0 };
      } else {
        next[i] = { ...next[i], [field]: value };
      }
      return next;
    });
    setStatus("idle");
  }

  function addPortal() {
    setPortals(prev => [...prev, { name: "GCR", bonus: 0, url: "" }]);
    setStatus("idle");
  }

  function removePortal(i: number) {
    setPortals(prev => prev.filter((_, idx) => idx !== i));
    setStatus("idle");
  }

  async function save() {
    if (!selectedId) return;
    setStatus("saving");
    setErrMsg("");
    try {
      const res = await fetch("/api/admin/update-portals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: selectedId, portals }),
      });
      const data = await res.json();
      if (!res.ok) { setErrMsg(data.error ?? "Failed"); setStatus("error"); return; }
      setStatus("saved");
    } catch {
      setErrMsg("Network error"); setStatus("error");
    }
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
      <div className="px-6 py-4" style={{ borderBottom: "1px solid #f1f5f9", background: "#0f172a" }}>
        <h2 className="font-bold text-sm text-white">Portal editor</h2>
        <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>Manually correct portal URLs and bonus amounts for any card</p>
      </div>

      <div className="p-6 flex flex-col gap-5">

        {/* Card search */}
        <div className="relative">
          <label className="text-xs font-semibold block mb-1.5" style={{ color: "#64748b" }}>Search card</label>
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setShowList(true); setSelectedId(null); }}
            onFocus={() => setShowList(true)}
            placeholder="Type card name or issuer…"
            className="w-full text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ border: "1px solid #e2e8f0", color: "#0f172a" }}
          />
          {showList && filtered.length > 0 && (
            <div
              className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-20"
              style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}
            >
              {filtered.map(card => (
                <button
                  key={card.id}
                  type="button"
                  onMouseDown={() => selectCard(card)}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-medium block" style={{ color: "#0f172a" }}>{card.name}</span>
                  <span className="text-xs" style={{ color: "#94a3b8" }}>
                    {card.issuer} · {card.portals.length} portal{card.portals.length !== 1 ? "s" : ""}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Portal table */}
        {selectedCard && (
          <>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold" style={{ color: "#64748b" }}>
                  Portals for <span style={{ color: "#0f172a" }}>{selectedCard.name}</span>
                </p>
                <button
                  onClick={addPortal}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  style={{ background: "#eff6ff", color: "#2563eb" }}
                >
                  + Add portal
                </button>
              </div>

              {portals.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: "#94a3b8" }}>
                  No portals — click &ldquo;Add portal&rdquo; to add one.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {portals.map((portal, i) => (
                    <div key={i} className="grid gap-2 items-center rounded-xl p-3" style={{ background: "#f8fafc", border: "1px solid #f1f5f9", gridTemplateColumns: "100px 90px 1fr 32px" }}>
                      {/* Portal name */}
                      <select
                        value={portal.name}
                        onChange={e => updatePortal(i, "name", e.target.value)}
                        className="text-sm font-semibold px-2 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ border: "1px solid #e2e8f0", background: "#fff", color: "#0f172a" }}
                      >
                        {PORTAL_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>

                      {/* Bonus */}
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold" style={{ color: "#64748b" }}>$</span>
                        <input
                          type="number"
                          value={portal.bonus}
                          onChange={e => updatePortal(i, "bonus", e.target.value)}
                          className="w-full text-sm font-bold px-2 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{ border: "1px solid #e2e8f0", background: "#fff", color: "#15803d" }}
                          min={0}
                        />
                      </div>

                      {/* URL */}
                      <input
                        type="url"
                        value={portal.url}
                        onChange={e => updatePortal(i, "url", e.target.value)}
                        placeholder="https://…"
                        className="text-xs px-2 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 truncate"
                        style={{ border: "1px solid #e2e8f0", background: "#fff", color: "#64748b" }}
                      />

                      {/* Remove */}
                      <button
                        onClick={() => removePortal(i)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors"
                        style={{ color: "#ef4444" }}
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save */}
            <div className="flex items-center gap-3">
              <button
                onClick={save}
                disabled={status === "saving"}
                className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                style={{ background: "#2563eb", color: "#fff" }}
              >
                {status === "saving" ? "Saving…" : "Save changes"}
              </button>
              {status === "saved" && (
                <span className="text-xs font-semibold" style={{ color: "#16a34a" }}>✓ Saved — live immediately</span>
              )}
              {status === "error" && (
                <span className="text-xs font-semibold" style={{ color: "#dc2626" }}>✕ {errMsg}</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
