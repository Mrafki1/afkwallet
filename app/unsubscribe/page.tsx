import Link from "next/link";
import Navbar from "../components/Navbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unsubscribed | PointsBinder",
  robots: { index: false, follow: false },
};

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      <Navbar />
      <div className="max-w-lg mx-auto px-6 py-32 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "#eff6ff" }}>
          <svg className="w-7 h-7" style={{ color: "#2563eb" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-3" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>You&apos;re unsubscribed</h1>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: "#64748b" }}>
          You won&apos;t receive any more reminder emails from PointsBinder. You can re-enable notifications any time from your dashboard settings.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard" className="text-sm font-semibold px-5 py-2.5 rounded-xl text-white" style={{ background: "#2563eb" }}>
            Go to dashboard
          </Link>
          <Link href="/" className="text-sm font-semibold px-5 py-2.5 rounded-xl" style={{ border: "1px solid #e2e8f0", color: "#64748b" }}>
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
