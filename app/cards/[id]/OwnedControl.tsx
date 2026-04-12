"use client";

import { useOwnedCards } from "../../lib/owned-cards";

export default function OwnedControl({ cardId }: { cardId: string }) {
  const { owned, toggle, loading, signedIn } = useOwnedCards();
  if (loading) return null;
  const isOwned = owned.has(cardId);

  return (
    <button
      onClick={() => toggle(cardId)}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors"
      style={{
        background: isOwned ? "#fee2e2" : "#f8fafc",
        border:     isOwned ? "1px solid #fca5a5" : "1px solid #e2e8f0",
        color:      isOwned ? "#b91c1c" : "#475569",
      }}
      title={!signedIn ? "Sign in to track which cards you have" : isOwned ? "Remove from your cards" : "Mark as owned"}
    >
      <span>{isOwned ? "♥" : "♡"}</span>
      <span>{isOwned ? "You have this" : "Mark as owned"}</span>
    </button>
  );
}
