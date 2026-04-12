import { getCards } from "../lib/cards-db";
import CardsClient from "./CardsClient";

export const dynamic = "force-dynamic";

export default async function CardsPage() {
  const cards = await getCards();
  return <CardsClient initialCards={cards} />;
}
