"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase";

export default function TrackButton({ cardId }: { cardId: string }) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
  }, []);

  function handleClick() {
    if (loggedIn) {
      router.push(`/dashboard?add=${cardId}`);
    } else {
      router.push(`/auth?redirect=/dashboard?add=${cardId}`);
    }
  }

  if (loggedIn === null) return null; // waiting on auth check

  return (
    <button
      onClick={handleClick}
      className="border border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-700 hover:text-red-900 font-medium px-5 py-3 rounded-xl text-sm transition-colors"
    >
      + Track this card
    </button>
  );
}
