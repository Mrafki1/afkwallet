import Navbar from "../components/Navbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | PointsBinder",
  description: "How PointsBinder collects, uses, and protects your personal information. PIPEDA-compliant privacy policy.",
  alternates: { canonical: "/privacy" },
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

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: "#ffffff" }}>
      <Navbar />

      <div style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-3xl mx-auto px-6 py-14">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#2563eb" }}>Legal</p>
          <h1 className="text-4xl font-bold mb-4" style={{ color: "#0f172a", letterSpacing: "-0.03em" }}>Privacy Policy</h1>
          <p className="text-sm" style={{ color: "#94a3b8" }}>Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-14">

        <Section title="1. Who we are">
          <p>PointsBinder (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates the website pointsbinder.com, a Canadian credit card comparison and personal tracker tool. We are committed to protecting your personal information and complying with the <em>Personal Information Protection and Electronic Documents Act</em> (PIPEDA) and Canada&rsquo;s Anti-Spam Legislation (CASL).</p>
          <p>Questions about this policy can be directed to: <strong>privacy@pointsbinder.com</strong></p>
        </Section>

        <Section title="2. Information we collect">
          <p>We collect only what is necessary to provide the service:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Account information:</strong> your email address when you create an account.</li>
            <li><strong>Card tracking data:</strong> credit card names, application dates, minimum spend amounts, spending progress, annual fee dates, and notes you enter into your dashboard. This data is entered voluntarily by you.</li>
            <li><strong>Email notification preferences:</strong> your choices about which reminder emails you receive.</li>
            <li><strong>Usage data:</strong> anonymous page views, session duration, and navigation patterns collected via Google Analytics 4. This data does not identify you personally. You can opt out via your browser&rsquo;s &ldquo;Do Not Track&rdquo; setting or a browser extension such as uBlock Origin.</li>
          </ul>
          <p>We do not collect payment information, Social Insurance Numbers, credit scores, or any financial account credentials.</p>
        </Section>

        <Section title="3. How we use your information">
          <ul className="list-disc pl-5 space-y-2">
            <li>To operate your account and provide the card tracking dashboard.</li>
            <li>To send you transactional reminder emails (MSR deadlines, annual fee alerts) that you have opted into.</li>
            <li>To improve the website based on anonymous usage analytics.</li>
            <li>To comply with our legal obligations.</li>
          </ul>
          <p>We do not sell, rent, or trade your personal information to third parties. We do not send marketing emails without your explicit consent.</p>
        </Section>

        <Section title="4. Third-party services">
          <p>We use the following third-party services to operate PointsBinder. Each has its own privacy policy:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Supabase</strong> (supabase.com) — our database and authentication provider. Data is stored on servers in the us-east-2 AWS region. Supabase is SOC 2 Type 2 certified.</li>
            <li><strong>Resend</strong> (resend.com) — transactional email delivery. Used only to send reminder emails you have opted into.</li>
            <li><strong>Vercel</strong> (vercel.com) — website hosting and infrastructure. Your IP address may be logged by Vercel&rsquo;s edge network in the course of serving web requests.</li>
            <li><strong>Google Analytics 4</strong> (google.com/analytics) — anonymous usage statistics. Data is processed under Google&rsquo;s standard terms and may be transferred outside Canada.</li>
          </ul>
        </Section>

        <Section title="5. Email communications and CASL">
          <p>We send reminder emails only to users who have created an account and have notifications enabled in their dashboard settings. These are considered transactional messages related to your use of the service.</p>
          <p>Every reminder email includes an unsubscribe link. Clicking it will immediately disable all email notifications. You can also manage your preferences at any time from your dashboard.</p>
        </Section>

        <Section title="6. Data retention">
          <p>We retain your personal information for as long as your account is active. If you delete your account, your data is deleted from our database within 30 days. Anonymous analytics data held by Google Analytics is subject to Google&rsquo;s own retention settings (default: 14 months).</p>
        </Section>

        <Section title="7. Your rights under PIPEDA">
          <p>You have the right to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Request access to the personal information we hold about you.</li>
            <li>Request correction of inaccurate information.</li>
            <li>Request deletion of your account and associated data.</li>
            <li>Withdraw consent to the collection or use of your information (subject to legal or contractual restrictions).</li>
          </ul>
          <p>To exercise any of these rights, email us at <strong>privacy@pointsbinder.com</strong>. We will respond within 30 days.</p>
        </Section>

        <Section title="8. Cookies">
          <p>PointsBinder uses session cookies required for authentication (set by Supabase) and analytics cookies set by Google Analytics 4. We do not use advertising cookies or third-party tracking pixels. You can disable cookies in your browser settings, but doing so may prevent you from staying logged in.</p>
        </Section>

        <Section title="9. Changes to this policy">
          <p>We may update this policy from time to time. The &ldquo;Last updated&rdquo; date at the top of this page reflects the most recent revision. Continued use of the site after changes are posted constitutes acceptance of the updated policy.</p>
        </Section>

        <Section title="10. Contact">
          <p>Questions, concerns, or requests regarding this privacy policy should be directed to:</p>
          <p><strong>PointsBinder</strong><br />privacy@pointsbinder.com</p>
        </Section>

      </div>
    </div>
  );
}
