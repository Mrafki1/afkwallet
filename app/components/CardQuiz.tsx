"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Card } from "../data/cards";

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
    subtitle: "Pick the one that matters most to you right now.",
    options: [
      { value: "travel",    label: "Earn travel rewards",       icon: "✈️",  desc: "Points, miles & lounge access" },
      { value: "cashback",  label: "Get cash back",             icon: "💵",  desc: "Statement credits & real cash" },
      { value: "bonus",     label: "Maximize welcome bonus",    icon: "🎁",  desc: "Biggest first-year value possible" },
      { value: "everyday",  label: "Rewards on daily spending", icon: "🛒",  desc: "Groceries, dining & gas multipliers" },
    ],
  },
  {
    id: "spending",
    question: "How much do you spend monthly?",
    subtitle: "Across all cards and categories combined.",
    options: [
      { value: "low",       label: "Under $2,000",    icon: "💳", desc: "I keep spending lean" },
      { value: "medium",    label: "$2,000 – $4,000", icon: "💳", desc: "Average Canadian household" },
      { value: "high",      label: "$4,000 – $7,000", icon: "💳", desc: "High spender" },
      { value: "very-high", label: "$7,000+",          icon: "💳", desc: "Power spender / business expenses" },
    ],
  },
  {
    id: "fee",
    question: "How do you feel about annual fees?",
    subtitle: "Premium cards often pay for themselves many times over.",
    options: [
      { value: "none",   label: "Free only, please",      icon: "🚫", desc: "$0 annual fee" },
      { value: "low",    label: "Up to $150/year",        icon: "👍", desc: "Low fee is fine if value is there" },
      { value: "medium", label: "Up to $300/year",        icon: "✅", desc: "Happy to pay for solid perks" },
      { value: "any",    label: "Whatever earns the most", icon: "🏆", desc: "Fee doesn't matter if ROI is good" },
    ],
  },
  {
    id: "travel",
    question: "How often do you travel internationally?",
    subtitle: "Outside Canada and the continental US.",
    options: [
      { value: "frequent",   label: "3+ times per year",   icon: "🌍", desc: "Lounge access & travel insurance matter" },
      { value: "occasional", label: "1–2 times per year",  icon: "🗺️", desc: "Travel perks are a nice bonus" },
      { value: "domestic",   label: "Mostly Canada & US",  icon: "🍁", desc: "Aeroplan or hotel points are great" },
      { value: "none",       label: "I rarely travel",     icon: "🏠", desc: "Cash back or everyday rewards for me" },
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

  const isCashBack      = card.tags.includes("Cash Back") || card.program.toLowerCase().includes("cash");
  const hasTransfer     = (card.transferPartners?.length ?? 0) > 0;
  const hasLounge       = card.tags.includes("Lounge Access");
  const hasDining       = card.rewards.some(r => /dining|food|restaurant|delivery/i.test(r.category));
  const hasGrocery      = card.rewards.some(r => /grocer/i.test(r.category));
  const isBusiness      = card.tags.includes("Business");
  const feeNum          = card.annualFeeNum;
  const msrNum          = parseMsrNum(card.msr);
  const firstYearValue  = parseValueNum(card.firstYearValue);

  // ── Goal (0–40 pts) ──────────────────────────────────────────────────────
  if (answers.goal === "travel") {
    if (hasTransfer)           { score += 22; reasons.push("Flexible transfer partners"); }
    if (hasLounge)             { score += 12; reasons.push("Airport lounge access"); }
    if (card.tags.includes("Travel")) score += 6;
  } else if (answers.goal === "cashback") {
    if (isCashBack)            { score += 40; reasons.push("Cash back rewards"); }
    else                         score -= 20;
  } else if (answers.goal === "bonus") {
    score += Math.min(28, Math.round(firstYearValue / 60));
    if (card.elevated)         { score += 14; reasons.push("Currently elevated offer"); }
    if (firstYearValue >= 500)   reasons.push(`${card.firstYearValue} first-year value`);
  } else if (answers.goal === "everyday") {
    if (hasDining)             { score += 20; reasons.push("Dining & food bonus"); }
    if (hasGrocery)            { score += 20; reasons.push("Grocery multiplier"); }
    if (!hasDining && !hasGrocery) score -= 10;
  }

  // ── Annual fee (0–30 pts) ────────────────────────────────────────────────
  if (answers.fee === "none") {
    if (feeNum === 0)          { score += 30; reasons.push("No annual fee"); }
    else                         score -= 30;
  } else if (answers.fee === "low") {
    if (feeNum === 0)            score += 25;
    else if (feeNum <= 150)      score += 30;
    else if (feeNum <= 300)      score += 10;
    else                         score -= 10;
  } else if (answers.fee === "medium") {
    if (feeNum <= 300)           score += 25;
    else                         score += 12;
  } else {
    score += 15; // any fee is fine — small neutral boost
  }

  // ── MSR feasibility (0–20 pts) ───────────────────────────────────────────
  const monthlyBudget  = answers.spending === "low" ? 1800 : answers.spending === "medium" ? 3000 : answers.spending === "high" ? 5500 : 10000;
  const threeMonthBudget = monthlyBudget * 3;
  if (msrNum === 0 || threeMonthBudget >= msrNum * 1.1) score += 20;
  else if (threeMonthBudget >= msrNum * 0.75)           score += 10;
  else                                                   score -= 15;

  // ── Travel fit (0–15 pts) ────────────────────────────────────────────────
  if (answers.travel === "frequent") {
    if (hasLounge)               score += 15;
    else                         score += 3;
  } else if (answers.travel === "occasional") {
    if (card.tags.includes("Travel")) score += 8;
    else                         score += 4;
  } else if (answers.travel === "domestic") {
    if (card.program.includes("Aeroplan")) { score += 12; reasons.push("Aeroplan points for Air Canada"); }
    else                         score += 5;
  } else {
    // no travel — cash back and no-fee cards score better
    if (isCashBack || feeNum === 0) score += 10;
    else                         score += 3;
  }

  // ── Small bonus for currently elevated offers ────────────────────────────
  if (card.elevated) score += 4;

  // ── Exclude business cards for personal-focused answers ─────────────────
  if (isBusiness && answers.spending !== "very-high") score -= 20;

  return { card, score: Math.max(0, score), reasons: reasons.slice(0, 3) };
}

function getTopMatches(answers: Answers, allCards: Card[]): Result[] {
  return allCards
    .map(card => scoreCard(card, answers))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

// Normalise raw scores so top card shows ~97% and others scale relative to it
function normaliseScores(results: Result[]): Result[] {
  if (results.length === 0) return results;
  const max = results[0].score;
  if (max === 0) return results;
  return results.map((r, i) => ({
    ...r,
    score: i === 0 ? 97 : Math.round((r.score / max) * 97),
  }));
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CardQuiz() {
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [step, setStep]       = useState(0); // 0 = intro, 1–4 = questions, 5 = results
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    fetch("/api/cards").then(r => r.json()).then(data => {
      if (Array.isArray(data)) setAllCards(data);
    }).catch(() => {});
  }, []);

  function handleAnswer(questionId: string, value: string) {
    const newAnswers = { ...answers, [questionId]: value } as Answers;
    setAnswers(newAnswers);

    const nextStep = step + 1;

    if (nextStep > QUESTIONS.length) {
      setResults(normaliseScores(getTopMatches(newAnswers, allCards)));
    }

    setStep(nextStep);
  }

  function reset() {
    setStep(0);
    setAnswers({});
    setResults([]);
  }

  const currentQ  = QUESTIONS[step - 1];
  const progress  = step === 0 ? 0 : step > QUESTIONS.length ? 100 : (step / QUESTIONS.length) * 100;
  const isResults = step > QUESTIONS.length;

  return (
    <section style={{ background: "#0f172a", borderBottom: "1px solid #1e293b" }}>
      <div className="max-w-2xl mx-auto px-6 py-16">

        {/* ── Intro ── */}
        {step === 0 && (
          <div className="text-center">
            <div className="badge badge-blue mb-5 inline-flex">✨ Card Finder</div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-white" style={{ letterSpacing: "-0.02em" }}>
              Find your perfect card<br />in 60 seconds
            </h2>
            <p className="text-lg mb-8" style={{ color: "#94a3b8" }}>
              4 quick questions. We match you against 75+ Canadian cards and show your top picks with a fit score.
            </p>
            <button onClick={() => setStep(1)} className="btn-primary px-8 py-3.5">
              Find my card →
            </button>
          </div>
        )}

        {/* ── Questions ── */}
        {step >= 1 && !isResults && (
          <div>
            {/* Progress bar */}
            <div className="flex items-center gap-3 mb-8">
              <div className="flex-1 rounded-full h-1" style={{ background: "#1e293b" }}>
                <div
                  className="h-1 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, background: "#2563eb" }}
                />
              </div>
              <span className="text-xs font-medium shrink-0" style={{ color: "#475569" }}>
                {step} / {QUESTIONS.length}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1.5" style={{ letterSpacing: "-0.02em" }}>
              {currentQ.question}
            </h2>
            <p className="text-sm mb-7" style={{ color: "#64748b" }}>{currentQ.subtitle}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQ.options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(currentQ.id, opt.value)}
                  className="text-left p-4 rounded-xl transition-all duration-150"
                  style={{ background: "#1e293b", border: "1.5px solid #334155" }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "#2563eb";
                    el.style.background  = "#172554";
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "#334155";
                    el.style.background  = "#1e293b";
                  }}
                >
                  <div className="text-2xl mb-2">{opt.icon}</div>
                  <div className="font-semibold text-sm mb-0.5 text-white">{opt.label}</div>
                  <div className="text-xs" style={{ color: "#64748b" }}>{opt.desc}</div>
                </button>
              ))}
            </div>

            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="mt-6 text-xs font-medium hover:underline"
                style={{ color: "#475569" }}
              >
                ← Back
              </button>
            )}
          </div>
        )}

        {/* ── Results ── */}
        {isResults && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2" style={{ letterSpacing: "-0.02em" }}>
                Your top matches
              </h2>
              <p className="text-sm" style={{ color: "#64748b" }}>
                Ranked by fit score across 75+ Canadian cards
              </p>
            </div>

            <div className="flex flex-col gap-3 mb-8">
              {results.map(({ card, score, reasons }, i) => (
                <Link
                  key={card.id}
                  href={`/cards/${card.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl transition-all group"
                  style={{ background: "#1e293b", border: "1.5px solid #334155" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#2563eb"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#334155"; }}
                >
                  {/* Rank badge */}
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      background: i === 0 ? "#f59e0b" : "#1e293b",
                      color:      i === 0 ? "#000"    : "#475569",
                      border:     i === 0 ? "none"    : "1px solid #334155",
                    }}
                  >
                    {i === 0 ? "★" : i + 1}
                  </div>

                  {/* Card image */}
                  <div
                    className="relative shrink-0 rounded-lg overflow-hidden"
                    style={{ width: 64, height: 40, background: "#0f172a" }}
                  >
                    <Image src={card.image} alt={card.name} fill className="object-contain p-1" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-semibold text-sm text-white leading-tight">{card.name}</span>
                      {card.elevated && (
                        <span className="badge badge-amber" style={{ fontSize: 10 }}>⚡ Elevated</span>
                      )}
                    </div>
                    <p className="text-xs font-medium" style={{ color: "#16a34a" }}>
                      {card.firstYearValue} first-year value
                    </p>
                    {reasons.length > 0 && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: "#475569" }}>
                        {reasons.join(" · ")}
                      </p>
                    )}
                  </div>

                  {/* Match score */}
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-bold" style={{ color: "#2563eb" }}>{score}%</div>
                    <div className="text-xs" style={{ color: "#475569" }}>match</div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/cards" className="btn-primary text-sm px-6 py-3 text-center">
                Browse all 75+ cards →
              </Link>
              <button
                onClick={reset}
                className="text-sm px-6 py-3 rounded-lg font-semibold"
                style={{ background: "#1e293b", color: "#94a3b8", border: "1.5px solid #334155" }}
              >
                Retake quiz
              </button>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
