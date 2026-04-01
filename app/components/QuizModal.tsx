"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Card } from "../data/cards";

const STORAGE_KEY = "pb_quiz_seen";

// ── Types ─────────────────────────────────────────────────────────────────────

type Answers = {
  goal:     "travel" | "cashback" | "bonus" | "everyday";
  spending: "low" | "medium" | "high" | "very-high";
  fee:      "none" | "low" | "medium" | "any";
  travel:   "frequent" | "occasional" | "domestic" | "none";
};

type Result = { card: Card; score: number; reasons: string[] };

// ── Questions ─────────────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    id: "goal",
    question: "What's your main goal?",
    options: [
      { value: "travel",   label: "Earn travel rewards",       icon: "✈️",  desc: "Points, miles & lounge access" },
      { value: "cashback", label: "Get cash back",             icon: "💵",  desc: "Statement credits & real cash" },
      { value: "bonus",    label: "Maximize welcome bonus",    icon: "🎁",  desc: "Biggest first-year value" },
      { value: "everyday", label: "Rewards on daily spending", icon: "🛒",  desc: "Groceries, dining & gas" },
    ],
  },
  {
    id: "spending",
    question: "Monthly spending?",
    options: [
      { value: "low",       label: "Under $2,000",    icon: "💳", desc: "Light spender" },
      { value: "medium",    label: "$2,000 – $4,000", icon: "💳", desc: "Average household" },
      { value: "high",      label: "$4,000 – $7,000", icon: "💳", desc: "High spender" },
      { value: "very-high", label: "$7,000+",          icon: "💳", desc: "Power spender" },
    ],
  },
  {
    id: "fee",
    question: "Annual fee comfort?",
    options: [
      { value: "none",   label: "Free only",               icon: "🚫", desc: "$0 annual fee" },
      { value: "low",    label: "Up to $150/year",         icon: "👍", desc: "Low fee if value is there" },
      { value: "medium", label: "Up to $300/year",         icon: "✅", desc: "Happy to pay for perks" },
      { value: "any",    label: "Whatever earns the most", icon: "🏆", desc: "ROI is all that matters" },
    ],
  },
  {
    id: "travel",
    question: "International travel?",
    options: [
      { value: "frequent",   label: "3+ times/year",    icon: "🌍", desc: "Lounge access matters" },
      { value: "occasional", label: "1–2 times/year",   icon: "🗺️", desc: "Travel perks are a bonus" },
      { value: "domestic",   label: "Mostly Canada/US", icon: "🍁", desc: "Aeroplan is great" },
      { value: "none",       label: "I rarely travel",  icon: "🏠", desc: "Cash back for me" },
    ],
  },
] as const;

// ── Scoring ───────────────────────────────────────────────────────────────────

function parseMsrNum(msr: string): number {
  const m = msr.replace(/,/g, "").match(/\d+/);
  return m ? parseInt(m[0]) : 0;
}

function parseValueNum(val: string): number {
  const m = val.replace(/[~$,\s]/g, "").match(/\d+/);
  return m ? parseInt(m[0]) : 0;
}

function scoreCard(card: Card, answers: Answers): Result {
  let score = 0;
  const reasons: string[] = [];

  const isCashBack  = card.tags.includes("Cash Back") || card.program.toLowerCase().includes("cash");
  const hasTransfer = (card.transferPartners?.length ?? 0) > 0;
  const hasLounge   = card.tags.includes("Lounge Access");
  const hasDining   = card.rewards.some(r => /dining|food|restaurant|delivery/i.test(r.category));
  const hasGrocery  = card.rewards.some(r => /grocer/i.test(r.category));
  const isBusiness  = card.tags.includes("Business");
  const feeNum      = card.annualFeeNum;
  const msrNum      = parseMsrNum(card.msr);
  const fyv         = parseValueNum(card.firstYearValue);

  if (answers.goal === "travel") {
    if (hasTransfer) { score += 22; reasons.push("Flexible transfer partners"); }
    if (hasLounge)   { score += 12; reasons.push("Airport lounge access"); }
    if (card.tags.includes("Travel")) score += 6;
  } else if (answers.goal === "cashback") {
    if (isCashBack) { score += 40; reasons.push("Cash back rewards"); }
    else score -= 20;
  } else if (answers.goal === "bonus") {
    score += Math.min(28, Math.round(fyv / 60));
    if (card.elevated) { score += 14; reasons.push("Currently elevated offer"); }
    if (fyv >= 500) reasons.push(`${card.firstYearValue} first-year value`);
  } else if (answers.goal === "everyday") {
    if (hasDining)  { score += 20; reasons.push("Dining & food bonus"); }
    if (hasGrocery) { score += 20; reasons.push("Grocery multiplier"); }
    if (!hasDining && !hasGrocery) score -= 10;
  }

  if (answers.fee === "none") {
    if (feeNum === 0) { score += 30; reasons.push("No annual fee"); }
    else score -= 30;
  } else if (answers.fee === "low") {
    if (feeNum === 0) score += 25;
    else if (feeNum <= 150) score += 30;
    else if (feeNum <= 300) score += 10;
    else score -= 10;
  } else if (answers.fee === "medium") {
    if (feeNum <= 300) score += 25;
    else score += 12;
  } else {
    score += 15;
  }

  const budget = answers.spending === "low" ? 1800 : answers.spending === "medium" ? 3000 : answers.spending === "high" ? 5500 : 10000;
  if (msrNum === 0 || budget * 3 >= msrNum * 1.1) score += 20;
  else if (budget * 3 >= msrNum * 0.75) score += 10;
  else score -= 15;

  if (answers.travel === "frequent") {
    if (hasLounge) score += 15; else score += 3;
  } else if (answers.travel === "occasional") {
    score += card.tags.includes("Travel") ? 8 : 4;
  } else if (answers.travel === "domestic") {
    if (card.program.includes("Aeroplan")) { score += 12; reasons.push("Aeroplan for Air Canada"); }
    else score += 5;
  } else {
    score += (isCashBack || feeNum === 0) ? 10 : 3;
  }

  if (card.elevated) score += 4;
  if (isBusiness && answers.spending !== "very-high") score -= 20;

  return { card, score: Math.max(0, score), reasons: reasons.slice(0, 3) };
}

function getTopMatches(answers: Answers, allCards: Card[]): Result[] {
  const raw = allCards
    .map(card => scoreCard(card, answers))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const max = raw[0]?.score ?? 1;
  return raw.map((r, i) => ({ ...r, score: i === 0 ? 97 : Math.round((r.score / max) * 97) }));
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export default function QuizModal() {
  const [visible, setVisible] = useState(false);
  const [step, setStep]       = useState(1);
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [results, setResults] = useState<Result[]>([]);
  const [allCards, setAllCards] = useState<Card[]>([]);

  useEffect(() => {
    fetch("/api/cards").then(r => r.json()).then(data => {
      if (Array.isArray(data)) setAllCards(data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    // Auto-show for first-time visitors
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }

    // Allow the hero button to reopen the quiz for returning visitors
    const handler = () => {
      setStep(1);
      setAnswers({});
      setResults([]);
      setVisible(true);
    };
    window.addEventListener("pb:open-quiz", handler);
    return () => window.removeEventListener("pb:open-quiz", handler);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  function handleAnswer(questionId: string, value: string) {
    const newAnswers = { ...answers, [questionId]: value } as Answers;
    setAnswers(newAnswers);
    const nextStep = step + 1;
    if (nextStep > QUESTIONS.length) {
      setResults(getTopMatches(newAnswers, allCards));
    }
    setStep(nextStep);
  }

  const isResults = step > QUESTIONS.length;
  const currentQ  = QUESTIONS[step - 1];
  const progress  = Math.min(100, (step / QUESTIONS.length) * 100);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) dismiss(); }}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: "#0f172a", border: "1px solid #1e293b", boxShadow: "0 25px 60px rgba(0,0,0,0.5)", maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4" style={{ borderBottom: "1px solid #1e293b" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: "#2563eb" }}>P</div>
            <span className="font-bold text-sm text-white">Card Finder</span>
            {!isResults && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#1e293b", color: "#64748b" }}>
                {step} of {QUESTIONS.length}
              </span>
            )}
          </div>
          <button
            onClick={dismiss}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: "#475569", background: "#1e293b" }}
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-6">
          {/* Progress bar */}
          {!isResults && (
            <div className="w-full rounded-full h-1 mb-6" style={{ background: "#1e293b" }}>
              <div
                className="h-1 rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: "#2563eb" }}
              />
            </div>
          )}

          {/* Question */}
          {!isResults && (
            <>
              <h2 className="text-xl font-bold text-white mb-5 tracking-tight" style={{ letterSpacing: "-0.01em" }}>
                {currentQ.question}
              </h2>
              <div className="grid grid-cols-2 gap-2.5">
                {currentQ.options.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleAnswer(currentQ.id, opt.value)}
                    className="text-left p-4 rounded-xl transition-all duration-150"
                    style={{ background: "#1e293b", border: "1.5px solid #334155" }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#2563eb"; el.style.background = "#172554"; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#334155"; el.style.background = "#1e293b"; }}
                  >
                    <div className="text-xl mb-1.5">{opt.icon}</div>
                    <div className="font-semibold text-xs mb-0.5 text-white leading-tight">{opt.label}</div>
                    <div className="text-[11px] leading-snug" style={{ color: "#64748b" }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
              {step > 1 && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="mt-5 text-xs font-medium hover:underline"
                  style={{ color: "#475569" }}
                >
                  ← Back
                </button>
              )}
            </>
          )}

          {/* Results */}
          {isResults && (
            <>
              <div className="mb-5">
                <h2 className="text-xl font-bold text-white tracking-tight mb-1" style={{ letterSpacing: "-0.01em" }}>
                  Your top matches
                </h2>
                <p className="text-xs" style={{ color: "#64748b" }}>
                  Ranked by fit across 75+ Canadian cards
                </p>
              </div>

              <div className="flex flex-col gap-2.5 mb-6">
                {results.map(({ card, score, reasons }, i) => (
                  <Link
                    key={card.id}
                    href={`/cards/${card.id}`}
                    onClick={dismiss}
                    className="flex items-center gap-3 p-3.5 rounded-xl transition-all"
                    style={{ background: "#1e293b", border: "1.5px solid #334155" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#2563eb"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#334155"; }}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: i === 0 ? "#f59e0b" : "#0f172a", color: i === 0 ? "#000" : "#475569", border: i === 0 ? "none" : "1px solid #334155" }}
                    >
                      {i === 0 ? "★" : i + 1}
                    </div>
                    <div className="relative shrink-0 rounded-lg overflow-hidden" style={{ width: 56, height: 36, background: "#0f172a" }}>
                      <Image src={card.image} alt={card.name} fill className="object-contain p-1" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-xs text-white leading-tight">{card.name}</span>
                        {card.elevated && <span className="badge badge-amber" style={{ fontSize: 9 }}>⚡</span>}
                      </div>
                      <p className="text-[11px] font-medium" style={{ color: "#16a34a" }}>{card.firstYearValue} first-year value</p>
                      {reasons.length > 0 && (
                        <p className="text-[11px] truncate mt-0.5" style={{ color: "#475569" }}>{reasons.join(" · ")}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-bold" style={{ color: "#2563eb" }}>{score}%</div>
                      <div className="text-[10px]" style={{ color: "#475569" }}>match</div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="flex gap-2">
                <Link href="/cards" onClick={dismiss} className="btn-primary text-xs px-4 py-2.5 text-center flex-1">
                  Browse all cards →
                </Link>
                <button
                  onClick={() => { setStep(1); setAnswers({}); setResults([]); }}
                  className="text-xs px-4 py-2.5 rounded-lg font-semibold flex-1"
                  style={{ background: "#1e293b", color: "#94a3b8", border: "1.5px solid #334155" }}
                >
                  Retake quiz
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
