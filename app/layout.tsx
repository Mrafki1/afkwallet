import type { Metadata } from "next";
import { Geist, Geist_Mono, VT323 } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const vt323 = VT323({
  weight: "400",
  variable: "--font-pixel",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ChurnCA — Best Canadian Credit Card Offers",
    template: "%s | ChurnCA",
  },
  description: "Find the best Canadian credit card welcome bonuses, compare first-year value, and apply via cash back portals for extra rewards. Updated regularly.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://churning-site.vercel.app"),
  keywords: ["Canadian credit cards", "credit card churning Canada", "best credit card Canada", "welcome bonus Canada", "rebate portal", "Aeroplan credit card", "Amex Canada", "first year free credit card"],
  robots: { index: true, follow: true },
  openGraph: {
    siteName: "ChurnCA",
    type: "website",
    locale: "en_CA",
    description: "Find the best Canadian credit card welcome bonuses, compare first-year value, and apply via cash back portals for extra rewards.",
  },
  twitter: {
    card: "summary_large_image",
    site: "@ChurnCA",
    description: "Find the best Canadian credit card welcome bonuses and apply via cash back portals.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${vt323.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
