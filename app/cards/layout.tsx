import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Canadian Credit Cards",
  description: "Browse 75+ Canadian credit card offers. Filter by rewards program, annual fee, and persona. Compare first-year value and apply via cash back portals.",
  openGraph: {
    title: "Canadian Credit Cards — ChurnCA",
    description: "Browse 75+ Canadian credit card offers. Filter by rewards program, annual fee, and persona. Compare first-year value and apply via cash back portals.",
  },
};

export default function CardsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
