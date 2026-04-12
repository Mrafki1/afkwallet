"use client";

/**
 * OwnedCardsProvider — tracks which cards the logged-in user has.
 *
 * Queries `user_cards` directly from the browser (RLS ensures they only see their own).
 * Exposes:
 *   - useOwnedCards() → { owned: Set<string>, loading, toggle(id), signedIn }
 *
 * If the user is not signed in, `owned` is an empty set and toggle() is a no-op that
 * redirects to /auth?next=<current path>.
 */

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "./supabase";

type Ctx = {
  owned:    Set<string>;
  loading:  boolean;
  signedIn: boolean;
  toggle:   (cardId: string) => Promise<void>;
};

const OwnedCardsContext = createContext<Ctx>({
  owned:    new Set(),
  loading:  true,
  signedIn: false,
  toggle:   async () => {},
});

export function OwnedCardsProvider({ children }: { children: React.ReactNode }) {
  const [owned, setOwned]     = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [signedIn, setSigned] = useState(false);
  const router   = useRouter();
  const pathname = usePathname();

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSigned(false);
      setOwned(new Set());
      setLoading(false);
      return;
    }
    setSigned(true);
    const { data, error } = await supabase
      .from("user_cards")
      .select("card_id")
      .eq("user_id", user.id);
    if (!error && data) setOwned(new Set(data.map(r => r.card_id as string)));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange(() => refresh());
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  const toggle = useCallback(async (cardId: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/auth?next=${encodeURIComponent(pathname || "/cards")}`);
      return;
    }

    // Optimistic update
    const had = owned.has(cardId);
    setOwned(prev => {
      const next = new Set(prev);
      if (had) next.delete(cardId); else next.add(cardId);
      return next;
    });

    if (had) {
      const { error } = await supabase
        .from("user_cards")
        .delete()
        .eq("user_id", user.id)
        .eq("card_id", cardId);
      if (error) await refresh();
    } else {
      const { error } = await supabase
        .from("user_cards")
        .insert({ user_id: user.id, card_id: cardId });
      if (error) await refresh();
    }
  }, [owned, refresh, router, pathname]);

  return (
    <OwnedCardsContext.Provider value={{ owned, loading, signedIn, toggle }}>
      {children}
    </OwnedCardsContext.Provider>
  );
}

export function useOwnedCards() {
  return useContext(OwnedCardsContext);
}
