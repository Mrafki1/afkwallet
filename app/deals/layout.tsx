import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hot Deals — Elevated Credit Card Offers",
  description: "Canadian credit cards currently running elevated welcome bonuses — higher than their normal public offer. Updated when offers change.",
  keywords: ["elevated credit card offer Canada", "best credit card bonus Canada 2025", "limited time credit card offer", "highest welcome bonus Canada"],
  alternates: { canonical: "/deals" },
  openGraph: {
    title: "Hot Deals — Elevated Credit Card Offers | PointsBinder",
    description: "Canadian credit cards currently running elevated welcome bonuses — higher than their normal public offer.",
    url: "/deals",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hot Deals — Elevated Credit Card Offers | PointsBinder",
    description: "Canadian credit cards currently running elevated welcome bonuses — higher than their normal public offer.",
  },
};

export default function DealsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
