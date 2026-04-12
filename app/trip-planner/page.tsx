import type { Metadata } from "next";
import { getCards } from "../lib/cards-db";
import TripPlannerClient from "./TripPlannerClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reverse Trip Planner — Points Strategy from Destination Backwards",
  description: "Tell us where and when you're going. We work backwards to build a card-application timeline, point totals, and transfer strategy.",
  alternates: { canonical: "/trip-planner" },
};

export default async function TripPlannerPage() {
  const cards = await getCards();
  return <TripPlannerClient cards={cards} />;
}
