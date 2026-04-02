"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "../lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { cards } from "../data/cards";

type UserCard = {
  id: string;
  card_id: string;
  card_name: string;
  apply_date: string;
  msr_amount: number;
  msr_spent: number;
  msr_deadline: string | null;
  annual_fee_date: string | null;
  notes: string | null;
};

type DbCard = {
  id: string;
  name: string;
  issuer: string;
  msr: string | null;
  image: string | null;
};

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function spendVelocity(uc: { msr_amount: number; msr_spent: number; msr_deadline: string | null }): string | null {
  const remaining = uc.msr_amount - uc.msr_spent;
  if (remaining <= 0 || !uc.msr_deadline) return null;
  const days = daysUntil(uc.msr_deadline);
  if (!days || days <= 0) return null;
  const perDay = Math.ceil(remaining / days);
  return `$${perDay.toLocaleString()}/day needed`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}

function MsrBar({ spent, total }: { spent: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((spent / total) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1" style={{ color: "#64748b" }}>
        <span>${spent.toLocaleString()} spent</span>
        <span>${total.toLocaleString()} required</span>
      </div>
      <div className="w-full rounded-full h-2" style={{ background: "#e2e8f0" }}>
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${pct}%`, background: pct >= 100 ? "#16a34a" : "#2563eb" }}
        />
      </div>
      <p className="text-xs mt-1 font-medium">
        {pct >= 100
          ? <span style={{ color: "#16a34a" }}>✓ MSR complete!</span>
          : <span style={{ color: "#64748b" }}>{pct}% — ${(total - spent).toLocaleString()} to go</span>
        }
      </p>
    </div>
  );
}

function StatusBadge({ days, label }: { days: number | null; label: string }) {
  if (days === null) return null;
  const urgent = days <= 30;
  const soon   = days <= 90;
  const bg    = urgent ? "#fef2f2" : soon ? "#fffbeb" : "#f8fafc";
  const color = urgent ? "#b91c1c" : soon ? "#b45309" : "#64748b";
  const border = urgent ? "#fecaca" : soon ? "#fde68a" : "#e2e8f0";
  return (
    <div className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: bg, color, border: `1px solid ${border}` }}>
      {days < 0 ? `${label} passed` : days === 0 ? `${label} today!` : `${label} in ${days}d`}
    </div>
  );
}

// Searchable combobox — shows suggestions from cards list but accepts any free text
function CardCombobox({ value, onChange, allCards }: { value: string; onChange: (name: string, cardId: string) => void; allCards: DbCard[] }) {
  const [query, setQuery]     = useState(value);
  const [open, setOpen]       = useState(false);
  const containerRef          = useRef<HTMLDivElement>(null);

  const suggestions = query.length > 0
    ? allCards.filter(c => c.name.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : allCards.slice(0, 6);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        required
        value={query}
        placeholder="Search or type any card name…"
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={e => {
          setQuery(e.target.value);
          onChange(e.target.value, "");
          setOpen(true);
        }}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
      />
      {open && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
          {suggestions.length > 0 ? suggestions.map(c => (
            <li key={c.id}>
              <button
                type="button"
                onMouseDown={() => {
                  setQuery(c.name);
                  onChange(c.name, c.id);
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between gap-2"
              >
                <span className="font-medium text-gray-900">{c.name}</span>
                <span className="text-xs text-gray-400 shrink-0">{c.issuer}</span>
              </button>
            </li>
          )) : (
            <li className="px-4 py-2.5 text-sm text-gray-400">
              No match — &ldquo;{query}&rdquo; will be saved as-is
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function BenefitsPanel({ cardId }: { cardId: string }) {
  const card = cards.find(c => c.id === cardId);
  if (!card) return (
    <p className="text-xs text-gray-400 py-2">No benefit data available for this card yet.</p>
  );

  return (
    <div className="mt-4 border-t border-gray-100 pt-4 flex flex-col gap-5">

      {/* Welcome bonus milestones */}
      {card.welcomeMilestones && card.welcomeMilestones.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Welcome Bonus</p>
          <div className="flex flex-col gap-2">
            {card.welcomeMilestones.map((m, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-red-50 text-red-900 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{m.points}</p>
                  <p className="text-xs text-gray-500">{m.condition}</p>
                  {m.note && <p className="text-xs text-amber-600 mt-0.5">{m.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Earn rates */}
      {card.rewards.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Earn Rates</p>
          <div className="flex flex-wrap gap-2">
            {card.rewards.map((r, i) => (
              <div key={i} className="bg-blue-50 rounded-lg px-3 py-1.5 flex items-center gap-2">
                <span className="text-blue-700 font-bold text-sm">{r.multiplier}</span>
                <span className="text-blue-600 text-xs">{r.category}</span>
              </div>
            ))}
          </div>
          {card.pointsValue && <p className="text-xs text-gray-400 mt-1.5">Points value: {card.pointsValue}</p>}
        </div>
      )}

      {/* Perks */}
      {card.perks && card.perks.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Perks & Credits</p>
          <ul className="flex flex-col gap-1">
            {card.perks.map((p, i) => (
              <li key={i} className="flex gap-2 items-start text-xs text-gray-600">
                <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Lounge */}
      {card.loungeDetails && card.loungeDetails !== "No lounge access" && card.loungeDetails !== "No direct lounge access" && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Lounge Access</p>
          <p className="text-xs text-gray-600">{card.loungeDetails}</p>
        </div>
      )}

      {/* Insurance */}
      {card.insurance && card.insurance.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Insurance</p>
          <div className="flex flex-wrap gap-1.5">
            {card.insurance.map((ins, i) => (
              <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-lg">{ins}</span>
            ))}
          </div>
        </div>
      )}

      {/* Transfer partners */}
      {card.transferPartners && card.transferPartners.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Transfer Partners</p>
          <div className="flex flex-wrap gap-1.5">
            {card.transferPartners.map((tp, i) => (
              <span key={i} className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-lg">{tp}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  return <Suspense><DashboardInner /></Suspense>;
}

function DashboardInner() {
  const [userCards, setUserCards]   = useState<UserCard[]>([]);
  const [dbCards, setDbCards]       = useState<DbCard[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showAdd, setShowAdd]       = useState(false);
  const [editCard, setEditCard]     = useState<UserCard | null>(null);
  const [userEmail, setUserEmail]   = useState("");
  const [showDetails, setShowDetails] = useState(false);

  // expanded benefits panels
  const [benefitsOpen, setBenefitsOpen] = useState<Set<string>>(new Set());
  function toggleBenefits(id: string) {
    setBenefitsOpen(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  // inline MSR update state
  const [msrUpdateId, setMsrUpdateId]     = useState<string | null>(null);
  const [msrUpdateInput, setMsrUpdateInput] = useState("");
  const [msrSaving, setMsrSaving]         = useState(false);

  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createClient();

  // form state
  const [cardName, setCardName]             = useState("");
  const [selectedCardId, setSelectedCardId] = useState("");
  const [applyDate, setApplyDate]           = useState("");
  const [msrAmount, setMsrAmount]           = useState("");
  const [msrSpent, setMsrSpent]             = useState("");
  const [msrDeadline, setMsrDeadline]       = useState("");
  const [annualFeeDate, setAnnualFeeDate]   = useState("");
  const [notes, setNotes]                   = useState("");
  const [saving, setSaving]                 = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      setUserEmail(user.email ?? "");
      const [{ data: ucData }, { data: cardData }] = await Promise.all([
        supabase.from("user_cards").select("*").order("apply_date", { ascending: false }),
        supabase.from("cards").select("id, name, issuer, msr, image").eq("status", "published").order("name"),
      ]);
      setUserCards(ucData ?? []);
      setDbCards(cardData ?? []);
      setLoading(false);

      // Auto-open add form if arriving from a card page
      const addCardId = searchParams.get("add");
      if (addCardId) {
        const card = cards.find(c => c.id === addCardId);
        if (card) {
          setCardName(card.name);
          setSelectedCardId(card.id);
          const match = card.msr.match(/\$?([\d,]+)/);
          if (match) setMsrAmount(match[1].replace(",", ""));
        }
        setShowAdd(true);
        router.replace("/dashboard");
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setCardName(""); setSelectedCardId(""); setApplyDate("");
    setMsrAmount(""); setMsrSpent("0"); setMsrDeadline("");
    setAnnualFeeDate(""); setNotes(""); setShowDetails(false);
  }

  function openAdd() {
    setEditCard(null);
    resetForm();
    setShowAdd(true);
  }

  function openEdit(uc: UserCard) {
    setEditCard(uc);
    setCardName(uc.card_name);
    setSelectedCardId(uc.card_id);
    setApplyDate(uc.apply_date);
    setMsrAmount(String(uc.msr_amount));
    setMsrSpent(String(uc.msr_spent));
    setMsrDeadline(uc.msr_deadline ?? "");
    setAnnualFeeDate(uc.annual_fee_date ?? "");
    setNotes(uc.notes ?? "");
    setShowDetails(true);
    setShowAdd(true);
  }

  function handleCardSelect(name: string, cardId: string) {
    setCardName(name);
    setSelectedCardId(cardId);
    // Auto-fill MSR amount from card data if field is empty
    if (cardId && !msrAmount) {
      const card = dbCards.find(c => c.id === cardId) ?? cards.find(c => c.id === cardId);
      if (card) {
        const match = (card.msr ?? "").match(/\$?([\d,]+)/);
        if (match) setMsrAmount(match[1].replace(",", ""));
      }
    }
  }

  function handleApplyDateChange(val: string) {
    setApplyDate(val);
    if (!val) return;
    const d = new Date(val);
    // Auto-fill annual fee date (1 year after apply)
    if (!annualFeeDate) {
      const fee = new Date(d);
      fee.setFullYear(fee.getFullYear() + 1);
      setAnnualFeeDate(fee.toISOString().split("T")[0]);
    }
    // Auto-fill MSR deadline (3 months after apply — most common)
    if (!msrDeadline) {
      const deadline = new Date(d);
      deadline.setMonth(deadline.getMonth() + 3);
      setMsrDeadline(deadline.toISOString().split("T")[0]);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const payload = {
      user_id:         user.id,
      card_id:         selectedCardId,
      card_name:       cardName,
      apply_date:      applyDate,
      msr_amount:      parseInt(msrAmount) || 0,
      msr_spent:       parseInt(msrSpent) || 0,
      msr_deadline:    msrDeadline || null,
      annual_fee_date: annualFeeDate || null,
      notes:           notes || null,
    };
    if (editCard) {
      await supabase.from("user_cards").update(payload).eq("id", editCard.id);
    } else {
      await supabase.from("user_cards").insert(payload);
    }
    const { data } = await supabase.from("user_cards").select("*").order("apply_date", { ascending: false });
    setUserCards(data ?? []);
    setShowAdd(false);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this card from your tracker?")) return;
    await supabase.from("user_cards").delete().eq("id", id);
    setUserCards(prev => prev.filter(c => c.id !== id));
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  // Inline MSR quick-update
  async function handleMsrUpdate(uc: UserCard) {
    const added = parseInt(msrUpdateInput);
    if (!added || added <= 0) { setMsrUpdateId(null); return; }
    setMsrSaving(true);
    const newSpent = uc.msr_spent + added;
    await supabase.from("user_cards").update({ msr_spent: newSpent }).eq("id", uc.id);
    setUserCards(prev => prev.map(c => c.id === uc.id ? { ...c, msr_spent: newSpent } : c));
    setMsrUpdateId(null);
    setMsrUpdateInput("");
    setMsrSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8fafc" }}>
        <p className="text-sm" style={{ color: "#94a3b8" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      {/* Navbar */}
      <nav className="sticky top-0 z-20" style={{ background: "rgba(255,255,255,0.95)", borderBottom: "1px solid #e2e8f0", backdropFilter: "blur(8px)" }}>
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 flex items-center justify-center rounded-md text-white text-xs font-bold" style={{ background: "#2563eb" }}>P</div>
            <span className="font-bold text-sm" style={{ color: "#0f172a" }}>PointsBinder</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm hidden sm:block" style={{ color: "#64748b" }}>{userEmail}</span>
            <button onClick={handleLogout} className="text-sm transition-colors" style={{ color: "#64748b" }}>
              Log out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0f172a" }}>My Cards</h1>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>Track your MSR progress and annual fee deadlines.</p>
          </div>
          <button
            onClick={openAdd}
            className="btn-primary text-sm font-semibold px-4 py-2"
            style={{ borderRadius: 10 }}
          >
            + Add Card
          </button>
        </div>

        {/* Summary stats */}
        {userCards.length > 0 && (() => {
          const activeMsr    = userCards.filter(c => c.msr_amount > 0 && c.msr_spent < c.msr_amount);
          const remaining    = activeMsr.reduce((sum, c) => sum + (c.msr_amount - c.msr_spent), 0);
          const urgentCount  = userCards.filter(c => {
            const msrD = daysUntil(c.msr_deadline);
            const feeD = daysUntil(c.annual_fee_date ? new Date(new Date(c.annual_fee_date).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] : null);
            return (msrD !== null && msrD <= 30 && c.msr_spent < c.msr_amount) || (feeD !== null && feeD <= 30);
          }).length;
          return (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: "Cards tracked", value: String(userCards.length) },
                { label: "MSR remaining", value: remaining > 0 ? `$${remaining.toLocaleString()}` : "All done ✓" },
                { label: "Action needed", value: urgentCount > 0 ? `${urgentCount} deadline${urgentCount > 1 ? "s" : ""}` : "All clear ✓", urgent: urgentCount > 0 },
              ].map(stat => (
                <div key={stat.label} className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
                  <p className="text-xs mb-1" style={{ color: "#94a3b8" }}>{stat.label}</p>
                  <p className="text-xl font-bold tracking-tight" style={{ color: stat.urgent ? "#b91c1c" : "#0f172a", letterSpacing: "-0.02em" }}>{stat.value}</p>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Cards list */}
        {userCards.length === 0 ? (
          <div className="text-center py-20 rounded-2xl" style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
            <p className="text-lg font-medium mb-1" style={{ color: "#94a3b8" }}>No cards tracked yet.</p>
            <p className="text-sm mb-4" style={{ color: "#94a3b8" }}>Add your first card to start tracking MSR progress and deadlines.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={openAdd} className="btn-primary text-sm font-semibold px-4 py-2" style={{ borderRadius: 10 }}>
                + Add Card
              </button>
              <Link href="/cards" className="text-sm font-semibold px-4 py-2 rounded-lg transition-colors" style={{ border: "1px solid #e2e8f0", color: "#64748b" }}>
                Browse cards →
              </Link>
            </div>
          </div>
        ) : (() => {
          // Group cards: needs attention → active MSR → completed
          const urgent      = userCards.filter(uc => {
            const msrD = daysUntil(uc.msr_deadline);
            const feeD = daysUntil(uc.annual_fee_date);
            const msrDone = uc.msr_amount > 0 && uc.msr_spent >= uc.msr_amount;
            return (!msrDone && msrD !== null && msrD <= 30) || (feeD !== null && feeD <= 60);
          });
          const active      = userCards.filter(uc => {
            const msrDone = uc.msr_amount > 0 && uc.msr_spent >= uc.msr_amount;
            return !msrDone && !urgent.includes(uc);
          });
          const completed   = userCards.filter(uc => {
            const msrDone = uc.msr_amount === 0 || uc.msr_spent >= uc.msr_amount;
            return msrDone && !urgent.includes(uc);
          });

          const groups = [
            { label: "Needs Attention", cards: urgent,    color: "#b91c1c" },
            { label: "Active",          cards: active,    color: "#2563eb" },
            { label: "Completed",       cards: completed, color: "#16a34a" },
          ].filter(g => g.cards.length > 0);

          return (
          <div className="flex flex-col gap-8">
            {groups.map(group => (
              <div key={group.label}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: group.color }}>{group.label}</p>
                <div className="flex flex-col gap-4">
            {group.cards.map(uc => {
              const msrDays    = daysUntil(uc.msr_deadline);
              const feeDays    = daysUntil(uc.annual_fee_date);
              const cancelDate = uc.annual_fee_date
                ? new Date(new Date(uc.annual_fee_date).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
                : null;
              const cancelDays = daysUntil(cancelDate);
              const msrDone    = uc.msr_amount > 0 && uc.msr_spent >= uc.msr_amount;
              const velocity   = spendVelocity(uc);
              const dbCard     = dbCards.find(c => c.id === uc.card_id);
              const cardImage  = dbCard?.image ?? null;
              return (
                <div key={uc.id} className="rounded-2xl p-6" style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <div className="flex gap-4 mb-4">
                    {/* Card image */}
                    {cardImage && (
                      <div className="shrink-0 w-20 h-[50px] rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                        <img src={cardImage} alt={uc.card_name} className="w-full h-full object-contain p-1" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="font-bold text-lg leading-tight" style={{ color: "#0f172a" }}>{uc.card_name}</h2>
                        {uc.card_id && (
                          <Link href={`/cards/${uc.card_id}`} className="text-xs font-medium shrink-0 hover:underline" style={{ color: "#2563eb" }}>
                            View card →
                          </Link>
                        )}
                      </div>
                      <p className="text-xs mt-0.5 mb-2" style={{ color: "#94a3b8" }}>Applied {formatDate(uc.apply_date)}</p>
                      <div className="flex flex-wrap gap-2">
                        {msrDays !== null && !msrDone && <StatusBadge days={msrDays} label="MSR deadline" />}
                        {cancelDays !== null && <StatusBadge days={cancelDays} label="Cancel window" />}
                        {feeDays !== null && <StatusBadge days={feeDays} label="Annual fee" />}
                        {velocity && <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>{velocity}</span>}
                      </div>
                    </div>
                  </div>

                  {/* MSR progress */}
                  {uc.msr_amount > 0 && (
                    <div className="mb-4">
                      <MsrBar spent={uc.msr_spent} total={uc.msr_amount} />
                      {uc.msr_deadline && (
                        <p className="text-xs text-gray-400 mt-1">MSR deadline: {formatDate(uc.msr_deadline)}</p>
                      )}

                      {/* Inline MSR quick-update */}
                      {!msrDone && (
                        <div className="mt-3">
                          {msrUpdateId === uc.id ? (
                            <form
                              onSubmit={e => { e.preventDefault(); handleMsrUpdate(uc); }}
                              className="flex items-center gap-2"
                            >
                              <span className="text-xs" style={{ color: "#64748b" }}>Add spending:</span>
                              <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
                                <span className="px-2 text-xs py-1.5" style={{ color: "#94a3b8", background: "#f8fafc", borderRight: "1px solid #e2e8f0" }}>$</span>
                                <input
                                  type="number"
                                  autoFocus
                                  min="1"
                                  value={msrUpdateInput}
                                  onChange={e => setMsrUpdateInput(e.target.value)}
                                  placeholder="amount"
                                  className="w-24 px-2 py-1.5 text-xs outline-none"
                                />
                              </div>
                              <button
                                type="submit"
                                disabled={msrSaving}
                                className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50"
                                style={{ borderRadius: 8 }}
                              >
                                {msrSaving ? "…" : "Add"}
                              </button>
                              <button
                                type="button"
                                onClick={() => { setMsrUpdateId(null); setMsrUpdateInput(""); }}
                                className="text-xs" style={{ color: "#94a3b8" }}
                              >
                                Cancel
                              </button>
                            </form>
                          ) : (
                            <button
                              onClick={() => { setMsrUpdateId(uc.id); setMsrUpdateInput(""); }}
                              className="text-xs font-medium hover:underline" style={{ color: "#2563eb" }}
                            >
                              + Log spending
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dates row */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    <div className="rounded-xl p-3" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                      <p className="text-xs mb-0.5" style={{ color: "#94a3b8" }}>Annual Fee Date</p>
                      <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>{formatDate(uc.annual_fee_date)}</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                      <p className="text-xs mb-0.5" style={{ color: "#94a3b8" }}>Cancel By</p>
                      <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>{formatDate(cancelDate)}</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                      <p className="text-xs mb-0.5" style={{ color: "#94a3b8" }}>MSR Deadline</p>
                      <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>{formatDate(uc.msr_deadline)}</p>
                    </div>
                  </div>

                  {uc.notes && (
                    <p className="text-xs italic mb-4" style={{ color: "#64748b" }}>&ldquo;{uc.notes}&rdquo;</p>
                  )}

                  <div className="flex gap-3 items-center">
                    <button
                      onClick={() => toggleBenefits(uc.id)}
                      className="text-xs font-medium hover:underline transition-colors" style={{ color: "#2563eb" }}
                    >
                      {benefitsOpen.has(uc.id) ? "Hide benefits ↑" : "View benefits ↓"}
                    </button>
                    <span style={{ color: "#e2e8f0" }}>|</span>
                    <button onClick={() => openEdit(uc)} className="text-xs font-medium transition-colors hover:underline" style={{ color: "#64748b" }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(uc.id)} className="text-xs font-medium transition-colors hover:underline" style={{ color: "#ef4444" }}>
                      Remove
                    </button>
                  </div>

                  {benefitsOpen.has(uc.id) && <BenefitsPanel cardId={uc.card_id} />}
                </div>
              );
            })}
                </div>
              </div>
            ))}
          </div>
          );
        })()}
      </div>

      {/* Add / Edit modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" style={{ background: "#ffffff" }}>
            <h2 className="text-lg font-bold mb-1" style={{ color: "#0f172a" }}>
              {editCard ? "Edit Card" : "Add Applied Card"}
            </h2>
            <p className="text-sm mb-5" style={{ color: "#94a3b8" }}>
              {editCard ? "Update your card details." : "Just the basics — everything else fills in automatically."}
            </p>

            <form onSubmit={handleSave} className="flex flex-col gap-4">

              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "#475569" }}>Card name</label>
                <CardCombobox value={cardName} onChange={handleCardSelect} allCards={dbCards} />
              </div>

              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "#475569" }}>Apply date</label>
                <input
                  type="date"
                  required
                  value={applyDate}
                  onChange={e => handleApplyDateChange(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ border: "1px solid #e2e8f0" }}
                />
              </div>

              {applyDate && !showDetails && (
                <div className="rounded-xl p-3 text-xs flex flex-col gap-1" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b" }}>
                  {msrAmount && <p>MSR: <span className="font-semibold" style={{ color: "#0f172a" }}>${parseInt(msrAmount).toLocaleString()}</span></p>}
                  {msrDeadline && <p>MSR deadline: <span className="font-semibold" style={{ color: "#0f172a" }}>{formatDate(msrDeadline)}</span> (3 months)</p>}
                  {annualFeeDate && <p>Annual fee date: <span className="font-semibold" style={{ color: "#0f172a" }}>{formatDate(annualFeeDate)}</span> (1 year)</p>}
                  <button type="button" onClick={() => setShowDetails(true)} className="font-medium hover:underline mt-1 text-left" style={{ color: "#2563eb" }}>
                    Edit details →
                  </button>
                </div>
              )}

              {showDetails && (
                <div className="flex flex-col gap-4 pt-4" style={{ borderTop: "1px solid #f1f5f9" }}>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium block mb-1" style={{ color: "#475569" }}>MSR Amount ($)</label>
                      <input type="number" value={msrAmount} onChange={e => setMsrAmount(e.target.value)} placeholder="e.g. 3000"
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid #e2e8f0" }} />
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1" style={{ color: "#475569" }}>Amount Spent ($)</label>
                      <input type="number" value={msrSpent} onChange={e => setMsrSpent(e.target.value)} placeholder="e.g. 1500"
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid #e2e8f0" }} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: "#475569" }}>MSR Deadline</label>
                    <input type="date" value={msrDeadline} onChange={e => setMsrDeadline(e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid #e2e8f0" }} />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: "#475569" }}>Annual Fee Date</label>
                    <input type="date" value={annualFeeDate} onChange={e => setAnnualFeeDate(e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid #e2e8f0" }} />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: "#475569" }}>Notes</label>
                    <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. used referral link"
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid #e2e8f0" }} />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm font-semibold py-2.5 disabled:opacity-50" style={{ borderRadius: 10 }}>
                  {saving ? "Saving..." : editCard ? "Save Changes" : "Add Card"}
                </button>
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 text-sm font-medium py-2.5 transition-colors" style={{ border: "1px solid #e2e8f0", borderRadius: 10, color: "#64748b" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
