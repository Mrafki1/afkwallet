import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best Canadian Credit Cards 2025",
  description: "Browse and compare 75+ Canadian credit cards. Filter by rewards program, annual fee, or persona. See first-year bonus, welcome bonuses, and apply via the highest-paying cash back portal.",
  keywords: ["best Canadian credit card 2025", "credit card comparison Canada", "Aeroplan card", "Amex Canada", "no fee credit card Canada", "travel credit card Canada", "cash back credit card Canada"],
  alternates: { canonical: "/cards" },
  openGraph: {
    title: "Best Canadian Credit Cards 2025 | PointsBinder",
    description: "Browse and compare 75+ Canadian credit cards. Filter by rewards program, annual fee, or persona.",
    url: "/cards",
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Canadian Credit Cards 2025 | PointsBinder",
    description: "Browse and compare 75+ Canadian credit cards. Filter by rewards, fee, or persona.",
  },
};

export default function CardsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
