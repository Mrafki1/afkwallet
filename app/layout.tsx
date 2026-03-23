import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ChurnCA — Best Canadian Credit Card Offers",
    template: "%s — ChurnCA",
  },
  description: "Find the best Canadian credit card signup bonuses, compare first-year value, and apply via cash back portals for extra rewards.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://churning-site.vercel.app"),
  openGraph: {
    siteName: "ChurnCA",
    type: "website",
    locale: "en_CA",
  },
  twitter: {
    card: "summary_large_image",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
