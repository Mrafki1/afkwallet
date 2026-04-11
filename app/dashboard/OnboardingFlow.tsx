"use client";

import { useRef, useState, useEffect } from "react";
import { createClient } from "../lib/supabase";

type DbCard = { id: string; name: string; issuer: string; msr: string | null; image: string | null };

type Props = {
  dbCards: DbCard[];
  userId: string;
  onComplete: () => void; // parent refreshes userCards after this
};

// ── Mini combobox ──────────────────────────────────────────────────────────────
function CardCombobox({ value, onChange, allCards }: {
  value: string;
  onChange: (name: string, cardId: string, msr: string | null) => void;
  allCards: DbCard[];
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen]   = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const suggestions = query.length > 0
    ? allCards.filter(c => c.name.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : allCards.slice(0, 6);

  useEffect(() => { setQuery(value); }, [value]);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input
        type="text" required value={query} placeholder="e.g. Amex Cobalt, TD Aeroplan…"
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={e => {
          setQuery(e.target.value);
          onChange(e.target.value, "", null);
          setOpen(true);
        }}
        className="w-full rounded-xl px-4 py-3 text-sm outline-none"
        style={{ border: "1px solid #e2e8f0", background: "#f8fafc" }}
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
          {suggestions.map(c => (
            <li key={c.id}>
              <button
                type="button"
                onMouseDown={() => { setQuery(c.name); onChange(c.name, c.id, c.msr); setOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between gap-2"
              >
                <span className="font-medium text-gray-900">{c.name}</span>
                <span className="text-xs text-gray-400 shrink-0">{c.issuer}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Value prop row ─────────────────────────────────────────────────────────────
function ValueProp({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4 text-left">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl"
        style={{ background: "#eff6ff" }}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>{title}</p>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#94a3b8" }}>{desc}</p>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function OnboardingFlow({ dbCards, userId, onComplete }: Props) {
  const supabase = createClient();
  const [step, setStep] = useState<"welcome" | "form" | "saving">("welcome");

  // Form state
  const [cardName, setCardName]     = useState("");
  const [cardId, setCardId]         = useState("");
  const [msrAmount, setMsrAmount]   = useState("");
  const [applyDate, setApplyDate]   = useState("");
  const [error, setError]           = useState("");

  function handleCardSelect(name: string, id: string, msr: string | null) {
    setCardName(name);
    setCardId(id);
    if (msr && !msrAmount) {
      const match = msr.match(/\$?([\d,]+)/);
      if (match) setMsrAmount(match[1].replace(",", ""));
    }
  }

  function handleApplyDate(val: string) {
    setApplyDate(val);
  }

  // Derived dates
  const msrDeadline = applyDate
    ? (() => { const d = new Date(applyDate); d.setMonth(d.getMonth() + 3); return d.toISOString().split("T")[0]; })()
    : "";
  const annualFeeDate = applyDate
    ? (() => { const d = new Date(applyDate); d.setFullYear(d.getFullYear() + 1); return d.toISOString().split("T")[0]; })()
    : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cardName || !applyDate) { setError("Please fill in both fields."); return; }
    setError("");
    setStep("saving");

    await supabase.from("user_cards").insert({
      user_id:         userId,
      card_id:         cardId || null,
      card_name:       cardName,
      apply_date:      applyDate,
      msr_amount:      parseInt(msrAmount) || 0,
      msr_spent:       0,
      msr_deadline:    msrDeadline || null,
      annual_fee_date: annualFeeDate || null,
      notes:           null,
    });

    onComplete();
  }

  // ── Welcome screen ──────────────────────────────────────────────────────────
  if (step === "welcome") {
    return (
      <div className="max-w-xl mx-auto text-center py-10">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "#eff6ff", border: "2px solid #bfdbfe" }}>
          <span className="text-3xl">💳</span>
        </div>

        <h2 className="text-2xl font-bold mb-2" style={{ color: "#0f172a", letterSpacing: "-0.03em" }}>
          Welcome to PointsBinder
        </h2>
        <p className="text-sm mb-8 max-w-sm mx-auto leading-relaxed" style={{ color: "#64748b" }}>
          Track your credit card welcome bonuses, hit every MSR deadline, and never pay an unexpected annual fee.
        </p>

        <div className="rounded-2xl p-6 mb-8 text-left flex flex-col gap-5"
          style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
          <ValueProp
            icon="📊"
            title="Track MSR progress"
            desc="Log spending as you go. See exactly how much you have left to unlock each welcome bonus."
          />
          <ValueProp
            icon="⏰"
            title="Get deadline reminders"
            desc="Email alerts 7 days before an MSR deadline and 30 days before an annual fee hits."
          />
          <ValueProp
            icon="📅"
            title="Upcoming deadlines at a glance"
            desc="A timeline sidebar keeps all your cancel windows, MSR dates, and fee dates in one place."
          />
        </div>

        <button
          onClick={() => setStep("form")}
          className="text-sm font-semibold px-8 py-3 rounded-xl text-white shadow-sm hover:opacity-90 transition-opacity"
          style={{ background: "#2563eb", boxShadow: "0 0 20px rgba(37,99,235,0.3)" }}
        >
          Add your first card →
        </button>
      </div>
    );
  }

  // ── Card form ───────────────────────────────────────────────────────────────
  if (step === "form" || step === "saving") {
    return (
      <div className="max-w-lg mx-auto py-8">
        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center"
              style={{ background: "#e2e8f0", color: "#94a3b8" }}>1</div>
            <span className="text-xs font-medium" style={{ color: "#94a3b8" }}>Welcome</span>
          </div>
          <div className="flex-1 h-px" style={{ background: "#e2e8f0" }} />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center"
              style={{ background: "#2563eb", color: "#fff" }}>2</div>
            <span className="text-xs font-bold" style={{ color: "#0f172a" }}>Add your first card</span>
          </div>
        </div>

        <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
          <h2 className="text-lg font-bold mb-1" style={{ color: "#0f172a" }}>Which card did you apply for?</h2>
          <p className="text-xs mb-6" style={{ color: "#94a3b8" }}>
            Just the basics — MSR amounts and deadlines fill in automatically.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: "#475569" }}>
                Card name
              </label>
              <CardCombobox value={cardName} onChange={handleCardSelect} allCards={dbCards} />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: "#475569" }}>
                Apply date
              </label>
              <input
                type="date"
                required
                value={applyDate}
                onChange={e => handleApplyDate(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ border: "1px solid #e2e8f0", background: "#f8fafc" }}
              />
            </div>

            {/* Auto-calculated preview */}
            {applyDate && (
              <div className="rounded-xl px-4 py-3 flex flex-col gap-1.5"
                style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#94a3b8" }}>
                  Auto-calculated
                </p>
                {msrAmount && (
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "#64748b" }}>MSR amount</span>
                    <span className="font-semibold" style={{ color: "#0f172a" }}>${parseInt(msrAmount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span style={{ color: "#64748b" }}>MSR deadline</span>
                  <span className="font-semibold" style={{ color: "#0f172a" }}>
                    {new Date(msrDeadline + "T12:00:00").toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "#64748b" }}>Annual fee date</span>
                  <span className="font-semibold" style={{ color: "#0f172a" }}>
                    {new Date(annualFeeDate + "T12:00:00").toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </div>
            )}

            {error && <p className="text-xs font-medium" style={{ color: "#dc2626" }}>{error}</p>}

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={step === "saving"}
                className="flex-1 text-sm font-semibold py-3 rounded-xl text-white disabled:opacity-50"
                style={{ background: "#2563eb" }}
              >
                {step === "saving" ? "Adding…" : "Start tracking →"}
              </button>
              <button
                type="button"
                onClick={() => setStep("welcome")}
                className="text-sm font-medium px-4 py-3 rounded-xl transition-colors"
                style={{ border: "1px solid #e2e8f0", color: "#64748b" }}
              >
                Back
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return null;
}
