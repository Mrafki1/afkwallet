import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer style={{ borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">

          {/* Brand + disclaimer */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 flex items-center justify-center rounded-md text-white text-xs font-bold" style={{ background: "#2563eb" }}>P</div>
              <span className="font-bold text-sm" style={{ color: "#0f172a" }}>PointsBinder</span>
            </div>
            <p className="text-xs max-w-sm leading-relaxed" style={{ color: "#94a3b8" }}>
              Not financial advice. Portal bonuses change frequently — always verify before applying.
              We may earn a referral fee when you apply through a portal link.{" "}
              <Link href="/disclosure" className="underline hover:text-gray-600">Learn more.</Link>
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {[
              { href: "/cards",      label: "Cards"       },
              { href: "/deals",      label: "Hot Deals"   },
              { href: "/blog",       label: "Blog"        },
              { href: "/about",      label: "About"       },
              { href: "/privacy",    label: "Privacy"     },
              { href: "/terms",      label: "Terms"       },
              { href: "/disclosure", label: "Disclosure"  },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="text-xs hover:text-gray-900 transition-colors" style={{ color: "#64748b" }}>
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 pt-6" style={{ borderTop: "1px solid #e2e8f0" }}>
          <p className="text-xs" style={{ color: "#cbd5e1" }}>
            © {year} PointsBinder. All rights reserved. PointsBinder is an independent comparison site and is not affiliated with any bank or credit card issuer.
          </p>
        </div>
      </div>
    </footer>
  );
}
