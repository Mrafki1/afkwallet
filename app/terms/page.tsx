import Navbar from "../components/Navbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | PointsBinder",
  description: "Terms of service for PointsBinder — the Canadian credit card comparison and tracker tool.",
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "April 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold mb-4" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>{title}</h2>
      <div className="text-sm leading-relaxed space-y-3" style={{ color: "#475569" }}>
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: "#ffffff" }}>
      <Navbar />

      <div style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-3xl mx-auto px-6 py-14">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#2563eb" }}>Legal</p>
          <h1 className="text-4xl font-bold mb-4" style={{ color: "#0f172a", letterSpacing: "-0.03em" }}>Terms of Service</h1>
          <p className="text-sm" style={{ color: "#94a3b8" }}>Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-14">

        <Section title="1. Acceptance of terms">
          <p>By accessing or using pointsbinder.com (the &ldquo;Site&rdquo;), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use the Site.</p>
        </Section>

        <Section title="2. Not financial advice">
          <p className="font-semibold" style={{ color: "#0f172a" }}>PointsBinder is a comparison and information tool only. Nothing on this Site constitutes financial advice, investment advice, or a recommendation to apply for any credit product.</p>
          <p>Credit cards, welcome bonuses, annual fees, and portal rebates involve real money. Before applying for any credit card, you should independently verify all terms directly with the card issuer. Credit applications affect your credit score. You are solely responsible for any financial decisions you make based on information found on this Site.</p>
          <p>We recommend consulting a licensed financial advisor if you need personalized financial guidance.</p>
        </Section>

        <Section title="3. Accuracy of information">
          <p>We make reasonable efforts to keep card data, welcome bonuses, portal rebate amounts, and application links accurate and up to date. Our scraper runs weekly and our link checker runs daily. However:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Portal rebate amounts can change without notice. The amount shown on our Site may differ from what is actually offered at the time of your application.</li>
            <li>Welcome bonus terms, minimum spend requirements, and annual fees are set by the issuing bank and may change at any time.</li>
            <li>We do not guarantee that any specific bonus or offer will be available when you apply.</li>
          </ul>
          <p>Always verify the current offer directly on the issuer&rsquo;s website and the portal&rsquo;s website before applying.</p>
        </Section>

        <Section title="4. User accounts">
          <p>To use the dashboard features, you must create an account with a valid email address. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.</p>
          <p>You must be at least 18 years of age and a resident of Canada to use this Site.</p>
          <p>You agree not to use the Site for any unlawful purpose or in any way that could damage, disable, or impair the Site or interfere with other users.</p>
        </Section>

        <Section title="5. Intellectual property">
          <p>The content, design, and functionality of PointsBinder — including but not limited to text, graphics, logos, and code — are owned by PointsBinder and protected by applicable copyright and intellectual property laws. You may not reproduce, distribute, or create derivative works without our written permission.</p>
          <p>Card names, logos, and trademarks are the property of their respective issuers. PointsBinder is not affiliated with, endorsed by, or sponsored by any bank or credit card issuer.</p>
        </Section>

        <Section title="6. Third-party links">
          <p>The Site contains links to third-party websites including card issuers, rebate portals, and other resources. These links are provided for your convenience. We have no control over the content of those sites and accept no responsibility for them or for any loss or damage that may arise from your use of them.</p>
        </Section>

        <Section title="7. Limitation of liability">
          <p>To the fullest extent permitted by applicable law, PointsBinder and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Your use of or inability to use the Site.</li>
            <li>Any inaccuracy in card data, portal bonuses, or other information displayed on the Site.</li>
            <li>A missed welcome bonus, failed portal application, or any other financial outcome.</li>
            <li>Unauthorized access to or alteration of your data.</li>
          </ul>
          <p>Our total liability to you for any claim arising out of these Terms shall not exceed CAD $100.</p>
        </Section>

        <Section title="8. Disclaimer of warranties">
          <p>The Site and its content are provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement.</p>
        </Section>

        <Section title="9. Termination">
          <p>We reserve the right to suspend or terminate your account at any time, with or without notice, for conduct that we believe violates these Terms or is harmful to other users, the Site, or third parties.</p>
          <p>You may delete your account at any time by contacting us at privacy@pointsbinder.com.</p>
        </Section>

        <Section title="10. Governing law">
          <p>These Terms shall be governed by and construed in accordance with the laws of the Province of Ontario and the federal laws of Canada applicable therein, without regard to conflict of law provisions. Any disputes shall be resolved in the courts of Ontario.</p>
        </Section>

        <Section title="11. Changes to these terms">
          <p>We reserve the right to modify these Terms at any time. Changes will be posted on this page with an updated &ldquo;Last updated&rdquo; date. Continued use of the Site after changes are posted constitutes your acceptance of the updated Terms.</p>
        </Section>

        <Section title="12. Contact">
          <p>Questions about these Terms should be directed to: <strong>privacy@pointsbinder.com</strong></p>
        </Section>

      </div>
    </div>
  );
}
