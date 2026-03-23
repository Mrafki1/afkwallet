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

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}

function MsrBar({ spent, total }: { spent: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((spent / total) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>${spent.toLocaleString()} spent</span>
        <span>${total.toLocaleString()} required</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${pct >= 100 ? "bg-green-500" : "bg-red-900"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs mt-1 font-medium">
        {pct >= 100
          ? <span className="text-green-600">✓ MSR complete!</span>
          : <span className="text-gray-500">{pct}% complete — ${(total - spent).toLocaleString()} to go</span>
        }
      </p>
    </div>
  );
}

function StatusBadge({ days, label }: { days: number | null; label: string }) {
  if (days === null) return null;
  const urgent = days <= 30;
  const soon   = days <= 90;
  return (
    <div className={`text-xs font-medium px-2.5 py-1 rounded-full ${
      urgent ? "bg-red-100 text-red-700" :
      soon   ? "bg-amber-100 text-amber-700" :
               "bg-gray-100 text-gray-600"
    }`}>
      {days < 0 ? `${label} passed` : days === 0 ? `${label} today!` : `${label} in ${days}d`}
    </div>
  );
}

// Searchable combobox — shows suggestions from cards list but accepts any free text
function CardCombobox({ value, onChange }: { value: string; onChange: (name: string, cardId: string) => void }) {
  const [query, setQuery]     = useState(value);
  const [open, setOpen]       = useState(false);
  const containerRef          = useRef<HTMLDivElement>(null);

  const suggestions = query.length > 0
    ? cards.filter(c => c.name.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : cards.slice(0, 6);

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
      next.has(id) ? next.delete(id) : next.add(id);
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
      const { data } = await supabase
        .from("user_cards")
        .select("*")
        .order("apply_date", { ascending: false });
      setUserCards(data ?? []);
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
      const card = cards.find(c => c.id === cardId);
      if (card) {
        const match = card.msr.match(/\$?([\d,]+)/);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white/95 backdrop-blur sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">ChurnCA</Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:block">{userEmail}</span>
            <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
              Log out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Cards</h1>
            <p className="text-sm text-gray-500 mt-1">Track your MSR progress and annual fee deadlines.</p>
          </div>
          <button
            onClick={openAdd}
            className="bg-red-900 hover:bg-red-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            + Add Card
          </button>
        </div>

        {/* Cards list */}
        {userCards.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-gray-400 text-lg font-medium">No cards tracked yet.</p>
            <p className="text-gray-400 text-sm mt-1">Add your first card to start tracking.</p>
            <button onClick={openAdd} className="mt-4 bg-red-900 hover:bg-red-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
              + Add Card
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {userCards.map(uc => {
              const msrDays    = daysUntil(uc.msr_deadline);
              const feeDays    = daysUntil(uc.annual_fee_date);
              const cancelDate = uc.annual_fee_date
                ? new Date(new Date(uc.annual_fee_date).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
                : null;
              const cancelDays = daysUntil(cancelDate);
              const msrDone    = uc.msr_amount > 0 && uc.msr_spent >= uc.msr_amount;
              return (
                <div key={uc.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h2 className="font-bold text-gray-900 text-lg leading-tight">{uc.card_name}</h2>
                      <p className="text-xs text-gray-400 mt-0.5">Applied {formatDate(uc.apply_date)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end shrink-0">
                      {msrDays !== null && !msrDone && <StatusBadge days={msrDays} label="MSR deadline" />}
                      {cancelDays !== null && <StatusBadge days={cancelDays} label="Cancel window" />}
                      {feeDays !== null && <StatusBadge days={feeDays} label="Annual fee" />}
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
                              <span className="text-xs text-gray-500">Add spending:</span>
                              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                                <span className="px-2 text-xs text-gray-400 bg-gray-50 border-r border-gray-200 py-1.5">$</span>
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
                                className="text-xs bg-red-900 hover:bg-red-800 text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-50 transition-colors"
                              >
                                {msrSaving ? "…" : "Add"}
                              </button>
                              <button
                                type="button"
                                onClick={() => { setMsrUpdateId(null); setMsrUpdateInput(""); }}
                                className="text-xs text-gray-400 hover:text-gray-600"
                              >
                                Cancel
                              </button>
                            </form>
                          ) : (
                            <button
                              onClick={() => { setMsrUpdateId(uc.id); setMsrUpdateInput(""); }}
                              className="text-xs text-red-900 hover:underline font-medium"
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
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-0.5">Annual Fee Date</p>
                      <p className="text-sm font-semibold text-gray-800">{formatDate(uc.annual_fee_date)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-0.5">Cancel By</p>
                      <p className="text-sm font-semibold text-gray-800">{formatDate(cancelDate)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-0.5">MSR Deadline</p>
                      <p className="text-sm font-semibold text-gray-800">{formatDate(uc.msr_deadline)}</p>
                    </div>
                  </div>

                  {uc.notes && (
                    <p className="text-xs text-gray-500 italic mb-4">&ldquo;{uc.notes}&rdquo;</p>
                  )}

                  <div className="flex gap-3 items-center">
                    <button
                      onClick={() => toggleBenefits(uc.id)}
                      className="text-xs text-red-900 hover:underline font-medium transition-colors"
                    >
                      {benefitsOpen.has(uc.id) ? "Hide benefits ↑" : "View benefits ↓"}
                    </button>
                    <span className="text-gray-200">|</span>
                    <button onClick={() => openEdit(uc)} className="text-xs text-gray-500 hover:text-gray-800 font-medium transition-colors">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(uc.id)} className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors">
                      Remove
                    </button>
                  </div>

                  {benefitsOpen.has(uc.id) && <BenefitsPanel cardId={uc.card_id} />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              {editCard ? "Edit Card" : "Add Applied Card"}
            </h2>
            <p className="text-sm text-gray-400 mb-5">
              {editCard ? "Update your card details." : "Just the basics — everything else fills in automatically."}
            </p>

            <form onSubmit={handleSave} className="flex flex-col gap-4">

              {/* Card name — searchable combobox */}
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Card name</label>
                <CardCombobox value={cardName} onChange={handleCardSelect} />
              </div>

              {/* Apply date */}
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Apply date</label>
                <input
                  type="date"
                  required
                  value={applyDate}
                  onChange={e => handleApplyDateChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                />
              </div>

              {/* Auto-fill summary — shown after date is entered */}
              {applyDate && !showDetails && (
                <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 flex flex-col gap-1">
                  {msrAmount && <p>MSR: <span className="font-semibold text-gray-700">${parseInt(msrAmount).toLocaleString()}</span></p>}
                  {msrDeadline && <p>MSR deadline: <span className="font-semibold text-gray-700">{formatDate(msrDeadline)}</span> (3 months)</p>}
                  {annualFeeDate && <p>Annual fee date: <span className="font-semibold text-gray-700">{formatDate(annualFeeDate)}</span> (1 year)</p>}
                  <button
                    type="button"
                    onClick={() => setShowDetails(true)}
                    className="text-red-900 font-medium hover:underline mt-1 text-left"
                  >
                    Edit details →
                  </button>
                </div>
              )}

              {/* Collapsible details */}
              {showDetails && (
                <div className="flex flex-col gap-4 border-t border-gray-100 pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">MSR Amount ($)</label>
                      <input
                        type="number"
                        value={msrAmount}
                        onChange={e => setMsrAmount(e.target.value)}
                        placeholder="e.g. 3000"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Amount Spent ($)</label>
                      <input
                        type="number"
                        value={msrSpent}
                        onChange={e => setMsrSpent(e.target.value)}
                        placeholder="e.g. 1500"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">MSR Deadline</label>
                    <input
                      type="date"
                      value={msrDeadline}
                      onChange={e => setMsrDeadline(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Annual Fee Date</label>
                    <input
                      type="date"
                      value={annualFeeDate}
                      onChange={e => setAnnualFeeDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Notes</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="e.g. used referral link"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-red-900 hover:bg-red-800 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                >
                  {saving ? "Saving..." : editCard ? "Save Changes" : "Add Card"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium py-2.5 rounded-xl transition-colors"
                >
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
