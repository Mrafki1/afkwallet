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
  return `$${Math.ceil(remaining / days).toLocaleString()}/day`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}

function MsrBar({ spent, total }: { spent: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((spent / total) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1" style={{ color: "#64748b" }}>
        <span>${spent.toLocaleString()} spent</span>
        <span>${total.toLocaleString()} required</span>
      </div>
      <div className="w-full rounded-full h-1.5" style={{ background: "#e2e8f0" }}>
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 100 ? "#16a34a" : "#2563eb" }} />
      </div>
      <p className="text-[11px] mt-1 font-medium">
        {pct >= 100
          ? <span style={{ color: "#16a34a" }}>✓ MSR complete</span>
          : <span style={{ color: "#64748b" }}>{pct}% · ${(total - spent).toLocaleString()} to go</span>}
      </p>
    </div>
  );
}

function StatusBadge({ days, label }: { days: number | null; label: string }) {
  if (days === null) return null;
  const urgent = days <= 30;
  const soon   = days <= 90;
  const bg     = urgent ? "#fef2f2" : soon ? "#fffbeb" : "#f8fafc";
  const color  = urgent ? "#b91c1c" : soon ? "#b45309" : "#64748b";
  const border = urgent ? "#fecaca" : soon ? "#fde68a" : "#e2e8f0";
  return (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: bg, color, border: `1px solid ${border}` }}>
      {days < 0 ? `${label} passed` : days === 0 ? `${label} today!` : `${label} ${days}d`}
    </span>
  );
}

function CardCombobox({ value, onChange, allCards }: { value: string; onChange: (name: string, cardId: string) => void; allCards: DbCard[] }) {
  const [query, setQuery] = useState(value);
  const [open, setOpen]   = useState(false);
  const containerRef      = useRef<HTMLDivElement>(null);

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
        type="text" required value={query} placeholder="Search or type any card name…" autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value, ""); setOpen(true); }}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
      />
      {open && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
          {suggestions.length > 0 ? suggestions.map(c => (
            <li key={c.id}>
              <button type="button" onMouseDown={() => { setQuery(c.name); onChange(c.name, c.id); setOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between gap-2">
                <span className="font-medium text-gray-900">{c.name}</span>
                <span className="text-xs text-gray-400 shrink-0">{c.issuer}</span>
              </button>
            </li>
          )) : (
            <li className="px-4 py-2.5 text-sm text-gray-400">No match — &ldquo;{query}&rdquo; will be saved as-is</li>
          )}
        </ul>
      )}
    </div>
  );
}

function BenefitsPanel({ cardId }: { cardId: string }) {
  const card = cards.find(c => c.id === cardId);
  if (!card) return <p className="text-xs text-gray-400 py-2">No benefit data available for this card yet.</p>;
  return (
    <div className="mt-3 border-t border-gray-100 pt-3 flex flex-col gap-4">
      {card.welcomeMilestones && card.welcomeMilestones.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Welcome Bonus</p>
          <div className="flex flex-col gap-1.5">
            {card.welcomeMilestones.map((m, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="w-4 h-4 rounded-full bg-blue-50 text-blue-800 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <div>
                  <p className="text-xs font-semibold text-gray-900">{m.points}</p>
                  <p className="text-[11px] text-gray-500">{m.condition}</p>
                  {m.note && <p className="text-[11px] text-amber-600 mt-0.5">{m.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {card.rewards.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Earn Rates</p>
          <div className="flex flex-wrap gap-1.5">
            {card.rewards.map((r, i) => (
              <div key={i} className="bg-blue-50 rounded-lg px-2.5 py-1 flex items-center gap-1.5">
                <span className="text-blue-700 font-bold text-xs">{r.multiplier}</span>
                <span className="text-blue-600 text-[11px]">{r.category}</span>
              </div>
            ))}
          </div>
          {card.pointsValue && <p className="text-[11px] text-gray-400 mt-1">Points value: {card.pointsValue}</p>}
        </div>
      )}
      {card.perks && card.perks.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Perks & Credits</p>
          <ul className="flex flex-col gap-1">
            {card.perks.map((p, i) => (
              <li key={i} className="flex gap-1.5 items-start text-[11px] text-gray-600">
                <span className="text-green-500 mt-0.5 shrink-0">✓</span>{p}
              </li>
            ))}
          </ul>
        </div>
      )}
      {card.loungeDetails && card.loungeDetails !== "No lounge access" && card.loungeDetails !== "No direct lounge access" && (
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Lounge Access</p>
          <p className="text-[11px] text-gray-600">{card.loungeDetails}</p>
        </div>
      )}
      {card.insurance && card.insurance.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Insurance</p>
          <div className="flex flex-wrap gap-1">
            {card.insurance.map((ins, i) => (
              <span key={i} className="bg-gray-100 text-gray-600 text-[11px] px-2 py-0.5 rounded-lg">{ins}</span>
            ))}
          </div>
        </div>
      )}
      {card.transferPartners && card.transferPartners.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Transfer Partners</p>
          <div className="flex flex-wrap gap-1">
            {card.transferPartners.map((tp, i) => (
              <span key={i} className="bg-purple-50 text-purple-700 text-[11px] px-2 py-0.5 rounded-lg">{tp}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Timeline Sidebar ───────────────────────────────────────────────────────

type TimelineEvent = {
  date: string;
  type: "msr" | "cancel" | "fee";
  cardName: string;
  cardId: string;
  days: number;
  extra?: string;
};

const TYPE_CFG = {
  msr:    { label: "MSR Due",    dot: "#ef4444", urgentColor: "#b91c1c", urgentBg: "#fef2f2" },
  cancel: { label: "Cancel By",  dot: "#f59e0b", urgentColor: "#b45309", urgentBg: "#fffbeb" },
  fee:    { label: "Annual Fee", dot: "#22c55e", urgentColor: "#166534", urgentBg: "#f0fdf4" },
};

function buildTimeline(userCards: UserCard[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  for (const uc of userCards) {
    const msrDone = uc.msr_amount > 0 && uc.msr_spent >= uc.msr_amount;
    if (!msrDone && uc.msr_deadline) {
      const days = daysUntil(uc.msr_deadline);
      if (days !== null && days >= -7 && days <= 365) {
        events.push({ date: uc.msr_deadline, type: "msr", cardName: uc.card_name, cardId: uc.card_id, days,
          extra: uc.msr_amount - uc.msr_spent > 0 ? `$${(uc.msr_amount - uc.msr_spent).toLocaleString()} left` : undefined });
      }
    }
    if (uc.annual_fee_date) {
      const cancelDate = new Date(new Date(uc.annual_fee_date).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const cDays = daysUntil(cancelDate);
      if (cDays !== null && cDays >= -7 && cDays <= 365)
        events.push({ date: cancelDate, type: "cancel", cardName: uc.card_name, cardId: uc.card_id, days: cDays });
      const fDays = daysUntil(uc.annual_fee_date);
      if (fDays !== null && fDays >= 0 && fDays <= 365)
        events.push({ date: uc.annual_fee_date, type: "fee", cardName: uc.card_name, cardId: uc.card_id, days: fDays });
    }
  }
  return events.sort((a, b) => a.days - b.days);
}

function TimelineSidebar({ userCards }: { userCards: UserCard[] }) {
  const events = buildTimeline(userCards);

  if (events.length === 0) return (
    <div className="sticky top-6">
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>Upcoming</p>
      <div className="rounded-2xl p-5 text-center" style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
        <p className="text-sm font-medium" style={{ color: "#94a3b8" }}>No deadlines</p>
        <p className="text-xs mt-1" style={{ color: "#cbd5e1" }}>All clear!</p>
      </div>
    </div>
  );

  // Group by month
  const byMonth = new Map<string, TimelineEvent[]>();
  for (const ev of events) {
    const key = new Date(ev.date + "T12:00:00").toLocaleDateString("en-CA", { year: "numeric", month: "long" });
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(ev);
  }

  return (
    <div className="sticky top-6 max-h-[calc(100vh-120px)] overflow-y-auto pr-1">
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>Upcoming</p>
      <div className="flex flex-col gap-4">
        {[...byMonth.entries()].map(([month, evs]) => (
          <div key={month}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: "#cbd5e1" }}>{month}</p>
            <div className="flex flex-col gap-1.5">
              {evs.map((ev, i) => {
                const cfg = TYPE_CFG[ev.type];
                const urgent = ev.days <= 30;
                const soon   = ev.days <= 60;
                return (
                  <div key={i} className="rounded-xl px-3 py-2.5" style={{
                    background: urgent ? cfg.urgentBg : "#fff",
                    border: `1px solid ${urgent ? "transparent" : "#f1f5f9"}`,
                  }}>
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.dot }} />
                        <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: urgent ? cfg.urgentColor : "#94a3b8" }}>
                          {cfg.label}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{
                        background: ev.days <= 0 ? "#fef2f2" : urgent ? "#fee2e2" : soon ? "#fef9c3" : "#f1f5f9",
                        color:      ev.days <= 0 ? "#b91c1c" : urgent ? "#b91c1c" : soon ? "#854d0e" : "#64748b",
                      }}>
                        {ev.days <= 0 ? "overdue" : ev.days === 0 ? "today" : `${ev.days}d`}
                      </span>
                    </div>
                    <p className="text-xs font-semibold truncate pl-3" style={{ color: "#0f172a" }}>{ev.cardName}</p>
                    {ev.extra && <p className="text-[10px] pl-3" style={{ color: "#64748b" }}>{ev.extra}</p>}
                    <p className="text-[10px] pl-3 mt-0.5" style={{ color: "#94a3b8" }}>
                      {new Date(ev.date + "T12:00:00").toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────

export default function Dashboard() {
  return <Suspense><DashboardInner /></Suspense>;
}

function DashboardInner() {
  const [userCards, setUserCards]     = useState<UserCard[]>([]);
  const [dbCards, setDbCards]         = useState<DbCard[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showAdd, setShowAdd]         = useState(false);
  const [editCard, setEditCard]       = useState<UserCard | null>(null);
  const [userEmail, setUserEmail]     = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab]     = useState<"all" | "active" | "done">("all");
  const [benefitsOpen, setBenefitsOpen] = useState<Set<string>>(new Set());

  const [msrUpdateId, setMsrUpdateId]     = useState<string | null>(null);
  const [msrUpdateInput, setMsrUpdateInput] = useState("");
  const [msrSaving, setMsrSaving]         = useState(false);

  const [notifPrefs, setNotifPrefs]       = useState({ msr_reminder: true, fee_reminder: true });
  const [notifSaving, setNotifSaving]     = useState(false);

  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createClient();

  const [cardName, setCardName]             = useState("");
  const [selectedCardId, setSelectedCardId] = useState("");
  const [applyDate, setApplyDate]           = useState("");
  const [msrAmount, setMsrAmount]           = useState("");
  const [msrSpent, setMsrSpent]             = useState("");
  const [msrDeadline, setMsrDeadline]       = useState("");
  const [annualFeeDate, setAnnualFeeDate]   = useState("");
  const [notes, setNotes]                   = useState("");
  const [saving, setSaving]                 = useState(false);

  function toggleBenefits(id: string) {
    setBenefitsOpen(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      setUserEmail(user.email ?? "");
      const [{ data: ucData }, { data: cardData }, { data: prefsData }] = await Promise.all([
        supabase.from("user_cards").select("*").order("apply_date", { ascending: false }),
        supabase.from("cards").select("id, name, issuer, msr, image").eq("status", "published").order("name"),
        supabase.from("user_notification_prefs").select("msr_reminder, fee_reminder").eq("user_id", user.id).maybeSingle(),
      ]);
      setUserCards(ucData ?? []);
      setDbCards(cardData ?? []);
      if (prefsData) setNotifPrefs({ msr_reminder: prefsData.msr_reminder, fee_reminder: prefsData.fee_reminder });
      setLoading(false);
      const addCardId = searchParams.get("add");
      if (addCardId) {
        const card = cards.find(c => c.id === addCardId);
        if (card) {
          setCardName(card.name); setSelectedCardId(card.id);
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
  function openAdd() { setEditCard(null); resetForm(); setShowAdd(true); }
  function openEdit(uc: UserCard) {
    setEditCard(uc); setCardName(uc.card_name); setSelectedCardId(uc.card_id);
    setApplyDate(uc.apply_date); setMsrAmount(String(uc.msr_amount)); setMsrSpent(String(uc.msr_spent));
    setMsrDeadline(uc.msr_deadline ?? ""); setAnnualFeeDate(uc.annual_fee_date ?? "");
    setNotes(uc.notes ?? ""); setShowDetails(true); setShowAdd(true);
  }
  function handleCardSelect(name: string, cardId: string) {
    setCardName(name); setSelectedCardId(cardId);
    if (cardId && !msrAmount) {
      const card = dbCards.find(c => c.id === cardId) ?? cards.find(c => c.id === cardId);
      if (card) { const match = (card.msr ?? "").match(/\$?([\d,]+)/); if (match) setMsrAmount(match[1].replace(",", "")); }
    }
  }
  function handleApplyDateChange(val: string) {
    setApplyDate(val); if (!val) return;
    const d = new Date(val);
    if (!annualFeeDate) { const f = new Date(d); f.setFullYear(f.getFullYear() + 1); setAnnualFeeDate(f.toISOString().split("T")[0]); }
    if (!msrDeadline)   { const m = new Date(d); m.setMonth(m.getMonth() + 3); setMsrDeadline(m.toISOString().split("T")[0]); }
  }
  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const payload = { user_id: user.id, card_id: selectedCardId, card_name: cardName, apply_date: applyDate,
      msr_amount: parseInt(msrAmount) || 0, msr_spent: parseInt(msrSpent) || 0,
      msr_deadline: msrDeadline || null, annual_fee_date: annualFeeDate || null, notes: notes || null };
    if (editCard) await supabase.from("user_cards").update(payload).eq("id", editCard.id);
    else await supabase.from("user_cards").insert(payload);
    const { data } = await supabase.from("user_cards").select("*").order("apply_date", { ascending: false });
    setUserCards(data ?? []); setShowAdd(false); setSaving(false);
  }
  async function handleDelete(id: string) {
    if (!confirm("Remove this card from your tracker?")) return;
    await supabase.from("user_cards").delete().eq("id", id);
    setUserCards(prev => prev.filter(c => c.id !== id));
  }
  async function handleLogout() { await supabase.auth.signOut(); router.push("/"); }
  async function handleNotifToggle(key: "msr_reminder" | "fee_reminder") {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    setNotifSaving(true);
    await supabase.from("user_notification_prefs").upsert({ user_id: user.id, ...updated, updated_at: new Date().toISOString() });
    setNotifSaving(false);
  }
  async function handleMsrUpdate(uc: UserCard) {
    const added = parseInt(msrUpdateInput);
    if (!added || added <= 0) { setMsrUpdateId(null); return; }
    setMsrSaving(true);
    const newSpent = uc.msr_spent + added;
    await supabase.from("user_cards").update({ msr_spent: newSpent }).eq("id", uc.id);
    setUserCards(prev => prev.map(c => c.id === uc.id ? { ...c, msr_spent: newSpent } : c));
    setMsrUpdateId(null); setMsrUpdateInput(""); setMsrSaving(false);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8fafc" }}>
      <p className="text-sm" style={{ color: "#94a3b8" }}>Loading...</p>
    </div>
  );

  // ── Computed stats ─────────────────────────────────────────────────────
  const activeMsr     = userCards.filter(c => c.msr_amount > 0 && c.msr_spent < c.msr_amount);
  const msrRemaining  = activeMsr.reduce((s, c) => s + (c.msr_amount - c.msr_spent), 0);
  const firstName     = userEmail.split("@")[0];

  // Next single most urgent deadline
  const nextDeadline = (() => {
    let best: { label: string; days: number; cardName: string } | null = null;
    for (const uc of userCards) {
      const msrDone = uc.msr_amount > 0 && uc.msr_spent >= uc.msr_amount;
      if (!msrDone && uc.msr_deadline) {
        const d = daysUntil(uc.msr_deadline);
        if (d !== null && d >= 0 && (!best || d < best.days)) best = { label: "MSR", days: d, cardName: uc.card_name };
      }
      if (uc.annual_fee_date) {
        const cancel = new Date(new Date(uc.annual_fee_date).getTime() - 30 * 86400000).toISOString().split("T")[0];
        const d = daysUntil(cancel);
        if (d !== null && d >= 0 && (!best || d < best.days)) best = { label: "Cancel", days: d, cardName: uc.card_name };
      }
    }
    return best;
  })();

  // Urgent items for banner (MSR deadline ≤14d or cancel window ≤14d)
  const urgentItems = userCards.filter(uc => {
    const msrDone  = uc.msr_amount > 0 && uc.msr_spent >= uc.msr_amount;
    const msrD     = daysUntil(uc.msr_deadline);
    const cancel   = uc.annual_fee_date
      ? new Date(new Date(uc.annual_fee_date).getTime() - 30 * 86400000).toISOString().split("T")[0] : null;
    const cancelD  = daysUntil(cancel);
    return (!msrDone && msrD !== null && msrD <= 14) || (cancelD !== null && cancelD <= 14);
  });

  // Filter tabs
  const filteredCards = userCards.filter(uc => {
    const done = uc.msr_amount === 0 || uc.msr_spent >= uc.msr_amount;
    if (activeTab === "active") return !done;
    if (activeTab === "done")   return done;
    return true;
  });

  const activeCount    = userCards.filter(uc => uc.msr_amount > 0 && uc.msr_spent < uc.msr_amount).length;
  const completedCount = userCards.filter(uc => uc.msr_amount === 0 || uc.msr_spent >= uc.msr_amount).length;

  return (
    <div className="min-h-screen" style={{ background: "#f1f5f9" }}>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)" }}>
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 flex items-center justify-center rounded-lg text-white text-xs font-bold" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}>P</div>
            <span className="font-bold text-sm text-white">PointsBinder</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm hidden sm:block" style={{ color: "rgba(255,255,255,0.45)" }}>{userEmail}</span>
            <button onClick={handleLogout} className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>Log out</button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-6 pt-4 pb-8">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-sm mb-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>Welcome back</p>
              <h1 className="text-2xl font-bold text-white" style={{ letterSpacing: "-0.03em" }}>{firstName}&apos;s Dashboard</h1>
            </div>
            <button onClick={openAdd} className="shrink-0 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:opacity-90"
              style={{ background: "#2563eb", color: "#fff", boxShadow: "0 0 20px rgba(37,99,235,0.4)" }}>
              + Add Card
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <p className="text-[11px] font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Cards Tracked</p>
              <p className="text-2xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>{userCards.length}</p>
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{activeCount} active · {completedCount} done</p>
            </div>
            <div className="rounded-2xl p-4" style={{
              background: msrRemaining > 0 ? "rgba(251,191,36,0.12)" : "rgba(34,197,94,0.1)",
              border: msrRemaining > 0 ? "1px solid rgba(251,191,36,0.25)" : "1px solid rgba(34,197,94,0.2)"
            }}>
              <p className="text-[11px] font-medium mb-1.5" style={{ color: msrRemaining > 0 ? "rgba(251,191,36,0.65)" : "rgba(34,197,94,0.65)" }}>MSR Remaining</p>
              <p className="text-2xl font-black" style={{ color: msrRemaining > 0 ? "#fbbf24" : "#4ade80", letterSpacing: "-0.04em" }}>
                {msrRemaining > 0 ? `$${msrRemaining.toLocaleString()}` : "✓"}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: msrRemaining > 0 ? "rgba(251,191,36,0.4)" : "rgba(34,197,94,0.4)" }}>
                {msrRemaining > 0 ? `across ${activeMsr.length} card${activeMsr.length !== 1 ? "s" : ""}` : "all complete"}
              </p>
            </div>
            <div className="rounded-2xl p-4" style={{
              background: nextDeadline && nextDeadline.days <= 30 ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.07)",
              border: nextDeadline && nextDeadline.days <= 30 ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(255,255,255,0.1)"
            }}>
              <p className="text-[11px] font-medium mb-1.5" style={{ color: nextDeadline && nextDeadline.days <= 30 ? "rgba(239,68,68,0.65)" : "rgba(255,255,255,0.4)" }}>
                Next Deadline
              </p>
              {nextDeadline ? (
                <>
                  <p className="text-2xl font-black" style={{ color: nextDeadline.days <= 30 ? "#f87171" : "white", letterSpacing: "-0.04em" }}>{nextDeadline.days}d</p>
                  <p className="text-[11px] mt-0.5 truncate" style={{ color: nextDeadline.days <= 30 ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.3)" }}>
                    {nextDeadline.label} · {nextDeadline.cardName}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>✓</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>all clear</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Urgent banner */}
        {urgentItems.length > 0 && (
          <div className="mb-5 rounded-2xl px-5 py-4" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
            <p className="text-sm font-bold mb-2.5" style={{ color: "#b91c1c" }}>⚠ Action needed this week</p>
            <div className="flex flex-col gap-1.5">
              {urgentItems.map(uc => {
                const msrDone  = uc.msr_amount > 0 && uc.msr_spent >= uc.msr_amount;
                const msrD     = daysUntil(uc.msr_deadline);
                const cancel   = uc.annual_fee_date
                  ? new Date(new Date(uc.annual_fee_date).getTime() - 30 * 86400000).toISOString().split("T")[0] : null;
                const cancelD  = daysUntil(cancel);
                return (
                  <div key={uc.id} className="flex items-center gap-3 text-sm">
                    <span className="font-semibold" style={{ color: "#0f172a" }}>{uc.card_name}</span>
                    {!msrDone && msrD !== null && msrD <= 14 && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "#fee2e2", color: "#b91c1c" }}>
                        MSR due {msrD === 0 ? "today" : `in ${msrD}d`} · ${(uc.msr_amount - uc.msr_spent).toLocaleString()} left
                      </span>
                    )}
                    {cancelD !== null && cancelD <= 14 && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "#fee2e2", color: "#b91c1c" }}>
                        Cancel window {cancelD === 0 ? "today" : `in ${cancelD}d`}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {userCards.length === 0 ? (
          <div className="text-center py-24 rounded-2xl" style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#eff6ff" }}>
              <span className="text-2xl">💳</span>
            </div>
            <p className="text-lg font-bold mb-1" style={{ color: "#0f172a" }}>No cards yet</p>
            <p className="text-sm mb-6" style={{ color: "#94a3b8" }}>Add your first card to track MSR progress and annual fee deadlines.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={openAdd} className="text-sm font-semibold px-5 py-2.5 rounded-xl text-white" style={{ background: "#2563eb" }}>+ Add Card</button>
              <Link href="/cards" className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors" style={{ border: "1px solid #e2e8f0", color: "#64748b" }}>Browse cards →</Link>
            </div>
          </div>
        ) : (
          <div className="flex gap-6 items-start">

            {/* ── Left: card grid ───────────────────────────────────── */}
            <div className="flex-1 min-w-0">

              {/* Filter tabs */}
              <div className="flex items-center gap-1 mb-4 p-1 rounded-xl w-fit" style={{ background: "#e2e8f0" }}>
                {([
                  { key: "all",    label: `All (${userCards.length})` },
                  { key: "active", label: `Active (${activeCount})` },
                  { key: "done",   label: `Done (${completedCount})` },
                ] as const).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                    style={activeTab === tab.key
                      ? { background: "#fff", color: "#0f172a", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                      : { color: "#64748b" }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* 2-column card grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCards.map(uc => {
                  const msrDays   = daysUntil(uc.msr_deadline);
                  const feeDays   = daysUntil(uc.annual_fee_date);
                  const cancel    = uc.annual_fee_date
                    ? new Date(new Date(uc.annual_fee_date).getTime() - 30 * 86400000).toISOString().split("T")[0] : null;
                  const cancelDays = daysUntil(cancel);
                  const msrDone   = uc.msr_amount > 0 && uc.msr_spent >= uc.msr_amount;
                  const velocity  = spendVelocity(uc);
                  const dbCard    = dbCards.find(c => c.id === uc.card_id);
                  const cardImage = dbCard?.image ?? null;

                  // Left border colour based on urgency
                  const borderColor = (() => {
                    if (urgentItems.includes(uc)) return "#fca5a5";
                    if (!msrDone && uc.msr_amount > 0) return "#93c5fd";
                    return "#86efac";
                  })();

                  return (
                    <div key={uc.id} className="rounded-2xl overflow-hidden" style={{
                      background: "#fff", border: "1px solid #e2e8f0",
                      borderLeft: `4px solid ${borderColor}`,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
                    }}>
                      <div className="p-4">

                        {/* Row 1: image + name */}
                        <div className="flex gap-3 mb-3">
                          {cardImage ? (
                            <img src={cardImage} alt={uc.card_name}
                              className="shrink-0 rounded-xl object-contain"
                              style={{ width: 80, height: 51, background: "#f8fafc", border: "1px solid #e2e8f0", padding: "3px" }}
                            />
                          ) : (
                            <div className="shrink-0 rounded-xl flex items-center justify-center"
                              style={{ width: 80, height: 51, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                              <span className="text-xl">💳</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <h2 className="text-sm font-bold leading-tight" style={{ color: "#0f172a" }}>{uc.card_name}</h2>
                              {uc.card_id && (
                                <Link href={`/cards/${uc.card_id}`}
                                  className="text-[10px] font-semibold shrink-0 px-1.5 py-0.5 rounded-md hover:opacity-80 transition-opacity"
                                  style={{ background: "#eff6ff", color: "#2563eb" }}>
                                  View →
                                </Link>
                              )}
                            </div>
                            <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>Applied {formatDate(uc.apply_date)}</p>
                            {/* Key dates inline */}
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {msrDays !== null && !msrDone && <StatusBadge days={msrDays} label="MSR" />}
                              {cancelDays !== null && <StatusBadge days={cancelDays} label="Cancel" />}
                              {feeDays !== null && msrDone && <StatusBadge days={feeDays} label="Fee" />}
                            </div>
                          </div>
                        </div>

                        {/* MSR progress */}
                        {uc.msr_amount > 0 && (
                          <div className="mb-3">
                            <MsrBar spent={uc.msr_spent} total={uc.msr_amount} />
                            {!msrDone && velocity && (
                              <p className="text-[10px] mt-0.5" style={{ color: "#94a3b8" }}>{velocity} to hit deadline</p>
                            )}
                          </div>
                        )}

                        {/* Quick MSR update */}
                        {!msrDone && uc.msr_amount > 0 && (
                          <div className="mb-3">
                            {msrUpdateId === uc.id ? (
                              <form onSubmit={e => { e.preventDefault(); handleMsrUpdate(uc); }} className="flex items-center gap-2">
                                <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
                                  <span className="px-2 text-xs py-1.5" style={{ color: "#94a3b8", background: "#f8fafc", borderRight: "1px solid #e2e8f0" }}>$</span>
                                  <input type="number" autoFocus min="1" value={msrUpdateInput}
                                    onChange={e => setMsrUpdateInput(e.target.value)} placeholder="amount"
                                    className="w-20 px-2 py-1.5 text-xs outline-none" />
                                </div>
                                <button type="submit" disabled={msrSaving}
                                  className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
                                  style={{ background: "#2563eb" }}>
                                  {msrSaving ? "…" : "Add"}
                                </button>
                                <button type="button" onClick={() => { setMsrUpdateId(null); setMsrUpdateInput(""); }}
                                  className="text-xs" style={{ color: "#94a3b8" }}>✕</button>
                              </form>
                            ) : (
                              <button onClick={() => { setMsrUpdateId(uc.id); setMsrUpdateInput(""); }}
                                className="text-xs font-semibold px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity"
                                style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
                                + Log spending
                              </button>
                            )}
                          </div>
                        )}

                        {uc.notes && <p className="text-[11px] italic mb-3" style={{ color: "#64748b" }}>&ldquo;{uc.notes}&rdquo;</p>}

                        {/* Action row */}
                        <div className="flex gap-1.5 flex-wrap items-center pt-2" style={{ borderTop: "1px solid #f1f5f9" }}>
                          <button onClick={() => toggleBenefits(uc.id)}
                            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors"
                            style={{ background: benefitsOpen.has(uc.id) ? "#eff6ff" : "#f8fafc", color: benefitsOpen.has(uc.id) ? "#2563eb" : "#64748b", border: "1px solid #e2e8f0" }}>
                            {benefitsOpen.has(uc.id) ? "Hide ↑" : "Benefits ↓"}
                          </button>
                          <button onClick={() => openEdit(uc)}
                            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors"
                            style={{ background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0" }}>
                            Edit
                          </button>
                          <button onClick={() => handleDelete(uc.id)}
                            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg ml-auto"
                            style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca" }}>
                            Remove
                          </button>
                        </div>

                        {benefitsOpen.has(uc.id) && <BenefitsPanel cardId={uc.card_id} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Right: timeline sidebar ───────────────────────────── */}
            <div className="hidden lg:block w-64 xl:w-72 shrink-0">
              <TimelineSidebar userCards={userCards} />
            </div>

          </div>
        )}
      </div>

      {/* ── Notifications panel ──────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 pb-10">
        <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-bold" style={{ color: "#0f172a" }}>Email Notifications</h2>
            {notifSaving && <span className="text-[11px]" style={{ color: "#94a3b8" }}>Saving…</span>}
          </div>
          <p className="text-xs mb-5" style={{ color: "#94a3b8" }}>Choose which reminder emails you want to receive.</p>
          <div className="flex flex-col gap-4">
            {([
              { key: "msr_reminder" as const, label: "MSR deadline reminder", desc: "Email 7 days before a minimum spend deadline is due" },
              { key: "fee_reminder" as const, label: "Annual fee reminder",    desc: "Email 30 days before an annual fee is charged" },
            ]).map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between gap-4 py-3" style={{ borderTop: "1px solid #f1f5f9" }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleNotifToggle(key)}
                  className="relative shrink-0 rounded-full transition-colors duration-200"
                  style={{
                    width: 44, height: 24,
                    background: notifPrefs[key] ? "#2563eb" : "#e2e8f0",
                  }}
                  aria-label={notifPrefs[key] ? `Disable ${label}` : `Enable ${label}`}
                >
                  <span
                    className="absolute top-0.5 rounded-full transition-transform duration-200"
                    style={{
                      width: 20, height: 20,
                      background: "#fff",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                      left: notifPrefs[key] ? 22 : 2,
                    }}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Add / Edit modal ─────────────────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" style={{ background: "#fff" }}>
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
                <input type="date" required value={applyDate} onChange={e => handleApplyDateChange(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid #e2e8f0" }} />
              </div>
              {applyDate && !showDetails && (
                <div className="rounded-xl p-3 text-xs flex flex-col gap-1" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b" }}>
                  {msrAmount    && <p>MSR: <span className="font-semibold" style={{ color: "#0f172a" }}>${parseInt(msrAmount).toLocaleString()}</span></p>}
                  {msrDeadline  && <p>MSR deadline: <span className="font-semibold" style={{ color: "#0f172a" }}>{formatDate(msrDeadline)}</span> (3 months)</p>}
                  {annualFeeDate && <p>Annual fee date: <span className="font-semibold" style={{ color: "#0f172a" }}>{formatDate(annualFeeDate)}</span> (1 year)</p>}
                  <button type="button" onClick={() => setShowDetails(true)} className="font-medium hover:underline mt-1 text-left" style={{ color: "#2563eb" }}>Edit details →</button>
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
                <button type="submit" disabled={saving}
                  className="flex-1 text-sm font-semibold py-2.5 rounded-xl text-white disabled:opacity-50"
                  style={{ background: "#2563eb" }}>
                  {saving ? "Saving..." : editCard ? "Save Changes" : "Add Card"}
                </button>
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 text-sm font-medium py-2.5 rounded-xl transition-colors"
                  style={{ border: "1px solid #e2e8f0", color: "#64748b" }}>
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
