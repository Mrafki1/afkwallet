import Navbar from "../components/Navbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Affiliate Disclosure | PointsBinder",
  description: "PointsBinder's affiliate and referral disclosure. How we earn revenue and how it affects (or doesn't affect) what we show you.",
  alternates: { canonical: "/disclosure" },
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "April 2026";

export default function DisclosurePage() {
  return (
    <div className="min-h-screen" style={{ background: "#ffffff" }}>
      <Navbar />

      <div style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-3xl mx-auto px-6 py-14">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#2563eb" }}>Legal</p>
          <h1 className="text-4xl font-bold mb-4" style={{ color: "#0f172a", letterSpacing: "-0.03em" }}>Affiliate &amp; Referral Disclosure</h1>
          <p className="text-sm" style={{ color: "#94a3b8" }}>Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-14 text-sm leading-relaxed space-y-8" style={{ color: "#475569" }}>

        <div className="rounded-2xl p-6" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
          <p className="font-semibold mb-2" style={{ color: "#1e40af" }}>The short version</p>
          <p style={{ color: "#1e3a8a" }}>
            Some links on this site may earn us a referral fee. This never affects which portals we show, what bonus amounts we display, or how we rank anything — those are determined purely by the data we scrape. We disclose this so you can make an informed decision.
          </p>
        </div>

        <section>
          <h2 className="text-xl font-bold mb-4" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>How PointsBinder earns revenue</h2>
          <p>PointsBinder aggregates rebate portal offers from third-party portals including Great Canadian Rebates (GCR), Frugal Flyer (FF), FinlyWealth (FW), and CreditCardGenius (CCG). When you click a portal link and apply for a credit card through that portal, the portal may pay PointsBinder a referral fee.</p>
          <p className="mt-3">PointsBinder may also participate in direct affiliate programs offered by credit card issuers or comparison platforms, under which we may earn a commission for approved applications.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>What this does NOT affect</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Which portals we show:</strong> We show every portal that has a current offer for a card, regardless of whether it pays us anything. If GCR has an offer and FinlyWealth doesn&rsquo;t, we show GCR only. We do not hide offers.</li>
            <li><strong>Portal ranking:</strong> Portals are ranked strictly by bonus amount, highest to lowest. The portal marked &ldquo;BEST&rdquo; is always the highest cash amount, not the one that pays us the most.</li>
            <li><strong>Which cards appear on the site:</strong> Our card database is scraped from CreditCardGenius and covers all published Canadian credit cards, not just ones with affiliate relationships.</li>
            <li><strong>First-year value calculations:</strong> The values shown are calculated mechanically (CCG base estimate + best portal bonus). They are not adjusted based on commercial relationships.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>Your portal bonus is not affected</h2>
          <p>The cash back or bonus you receive from a portal is paid by the portal directly to you. Any referral fee we earn is separate — it is paid by the portal out of their own margin and does not reduce what you receive. Using a portal link from PointsBinder does not result in a lower bonus for you.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>Compliance</h2>
          <p>This disclosure is provided in accordance with the Competition Bureau of Canada&rsquo;s guidelines on influencer marketing and affiliate relationships, and the Federal Trade Commission&rsquo;s guidance for endorsement disclosures (for US visitors).</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>Questions</h2>
          <p>If you have questions about our affiliate relationships or how we earn revenue, email us at <strong>privacy@pointsbinder.com</strong>.</p>
        </section>

      </div>
    </div>
  );
}
