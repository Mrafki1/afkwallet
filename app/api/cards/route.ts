/**
 * GET /api/cards
 * Returns all published cards as JSON.
 * Used by client components (QuizModal, CardQuiz, cards listing page).
 * Cached for 5 minutes via Next.js cache headers.
 */

import { NextResponse } from "next/server";
import { getCards } from "../../lib/cards-db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cards = await getCards();
    return NextResponse.json(cards, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    console.error("GET /api/cards error:", err);
    return NextResponse.json({ error: "Failed to load cards" }, { status: 500 });
  }
}
