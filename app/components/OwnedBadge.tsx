"use client";

/**
 * OwnedBadge / OwnedToggle — indicators for "the user already has this card".
 *
 *  <OwnedToggle cardId="x" />            — heart button. Click to add/remove.
 *  <OwnedBadge cardId="x" />             — small "You have this" pill.
 *  <OwnedDimmer cardId="x"> ... </...>   — wraps children in a greyed-out overlay if owned.
 *  useIsOwned(cardId) → boolean          — bool hook for custom rendering.
 */

import { useOwnedCards } from "../lib/owned-cards";

export function useIsOwned(cardId: string): boolean {
  const { owned } = useOwnedCards();
  return owned.has(cardId);
}

export function OwnedToggle({ cardId, className = "" }: { cardId: string; className?: string }) {
  const { owned, toggle, signedIn, loading } = useOwnedCards();
  const isOwned = owned.has(cardId);

  if (loading) return null;

  return (
    <button
      onClick={e => { e.stopPropagation(); e.preventDefault(); toggle(cardId); }}
      title={!signedIn ? "Sign in to mark cards you have" : isOwned ? "Remove from your cards" : "Mark as owned"}
      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all shadow-sm ${className}`}
      style={{
        background: isOwned ? "#fee2e2" : "#ffffff",
        border:     isOwned ? "2px solid #dc2626" : "2px solid #e2e8f0",
        color:      isOwned ? "#dc2626" : "#94a3b8",
        cursor:     "pointer",
      }}
    >
      {isOwned ? "♥" : "♡"}
    </button>
  );
}

export function OwnedBadge({ cardId }: { cardId: string }) {
  const isOwned = useIsOwned(cardId);
  if (!isOwned) return null;
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5" }}
    >
      ♥ You have this
    </span>
  );
}

/**
 * Wraps children in an overlay that greys out + dims if the user owns this card.
 * Content remains clickable (e.g. you can still open the card detail page).
 */
export function OwnedDimmer({ cardId, children }: { cardId: string; children: React.ReactNode }) {
  const isOwned = useIsOwned(cardId);
  return (
    <div className="relative">
      <div style={{ opacity: isOwned ? 0.55 : 1, filter: isOwned ? "grayscale(0.6)" : undefined, transition: "opacity 0.2s,filter 0.2s" }}>
        {children}
      </div>
      {isOwned && (
        <div
          className="absolute top-3 left-3 z-10 flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full pointer-events-none"
          style={{ background: "#b91c1c", color: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}
        >
          ♥ OWNED
        </div>
      )}
    </div>
  );
}
