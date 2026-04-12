import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient as createServerClient } from "../lib/supabase-server";
import {
  getRecentChanges,
  getElevatedCards,
  getCards,
  getPortalsLastScraped,
  getCardsCount,
} from "../lib/cards-db";
import ElevatedToggle from "./ElevatedToggle";
import PortalEditor from "./PortalEditor";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatField(field: string) {
  return { points_bonus: "Bonus", annual_fee: "Annual Fee", msr: "MSR" }[field] ?? field;
}

export default async function AdminPage() {
  // Auth guard — must be logged in as admin
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!user || !adminEmail || user.email !== adminEmail) {
    redirect("/auth");
  }

  const [recentChanges, elevatedCards, allCards, portalsLastScraped, cardsCount] = await Promise.all([
    getRecentChanges(30),
    getElevatedCards(),
    getCards(),
    getPortalsLastScraped(),
    getCardsCount(),
  ]);

  // Cards with portals (for portal coverage stats)
  const withPortals = allCards.filter(c => c.portals.length > 0).length;
  const portalBreakdown = ["GCR", "FF", "CCG", "FW"].map(name => ({
    name,
    count: allCards.filter(c => c.portals.some(p => p.name === name)).length,
  }));

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>

      {/* Header */}
      <div style={{ background: "#0f172a", borderBottom: "1px solid #1e293b" }}>
        <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 flex items-center justify-center rounded-md text-white text-xs font-bold" style={{ background: "#2563eb" }}>P</div>
              <span className="font-bold text-sm text-white">PointsBinder</span>
            </Link>
            <h1 className="text-2xl font-bold text-white" style={{ letterSpacing: "-0.02em" }}>Admin Panel</h1>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>Logged in as {user.email}</p>
          </div>
          <Link href="/cards" className="text-sm font-medium" style={{ color: "#64748b" }}>← Back to site</Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col gap-10">

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total cards",          value: cardsCount },
            { label: "Cards with portals",   value: withPortals },
            { label: "Elevated / HOT cards", value: elevatedCards.length },
            { label: "Portals last scraped", value: portalsLastScraped ? formatDate(portalsLastScraped) : "Never" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: "1px solid #e2e8f0" }}>
              <p className="text-2xl font-black" style={{ color: "#0f172a" }}>{s.value}</p>
              <p className="text-xs mt-1 font-medium" style={{ color: "#64748b" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Portal coverage ── */}
        <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #e2e8f0" }}>
          <h2 className="font-bold text-base mb-4" style={{ color: "#0f172a" }}>Portal coverage</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {portalBreakdown.map(p => (
              <div key={p.name} className="rounded-xl p-4 text-center" style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                <p className="text-xl font-black" style={{ color: "#0f172a" }}>{p.count}</p>
                <p className="text-xs font-semibold mt-1" style={{ color: "#64748b" }}>{p.name} offers</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Elevated cards ── */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #f1f5f9", background: "#0f172a" }}>
            <h2 className="font-bold text-sm text-white">🔥 Currently elevated cards ({elevatedCards.length})</h2>
            <span className="text-xs" style={{ color: "#64748b" }}>Set manually or auto-raised on bonus increase</span>
          </div>

          {elevatedCards.length === 0 ? (
            <p className="px-6 py-8 text-sm text-center" style={{ color: "#94a3b8" }}>No elevated cards right now.</p>
          ) : (
            <div className="divide-y" style={{ borderColor: "#f1f5f9" }}>
              {elevatedCards.map(card => (
                <div key={card.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <Link href={`/cards/${card.id}`} className="font-semibold text-sm hover:underline" style={{ color: "#0f172a" }}>
                      {card.name}
                    </Link>
                    <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{card.issuer} · {card.pointsBonus}</p>
                    {card.elevatedNote && (
                      <p className="text-xs mt-0.5 italic" style={{ color: "#64748b" }}>{card.elevatedNote}</p>
                    )}
                  </div>
                  <ElevatedToggle
                    cardId={card.id}
                    cardName={card.name}
                    elevated={true}
                    elevatedNote={card.elevatedNote}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Mark non-elevated cards as HOT ── */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
          <div className="px-6 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <h2 className="font-bold text-sm" style={{ color: "#0f172a" }}>Mark a card as HOT offer</h2>
            <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>Select any non-elevated card to flag it manually</p>
          </div>
          <div className="divide-y max-h-72 overflow-y-auto" style={{ borderColor: "#f1f5f9" }}>
            {allCards
              .filter(c => !c.elevated)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(card => (
                <div key={card.id} className="px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex-1">
                    <Link href={`/cards/${card.id}`} className="text-sm hover:underline" style={{ color: "#0f172a" }}>
                      {card.name}
                    </Link>
                    <span className="text-xs ml-2" style={{ color: "#94a3b8" }}>{card.pointsBonus}</span>
                  </div>
                  <ElevatedToggle
                    cardId={card.id}
                    cardName={card.name}
                    elevated={false}
                    elevatedNote={null}
                  />
                </div>
              ))}
          </div>
        </div>

        {/* ── Recent card changes ── */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
          <div className="px-6 py-4" style={{ borderBottom: "1px solid #f1f5f9", background: "#0f172a" }}>
            <h2 className="font-bold text-sm text-white">Recent card changes (last 30)</h2>
          </div>

          {recentChanges.length === 0 ? (
            <p className="px-6 py-8 text-sm text-center" style={{ color: "#94a3b8" }}>No changes recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                    <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#64748b" }}>Date</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#64748b" }}>Card</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#64748b" }}>Field</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#64748b" }}>Before</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#64748b" }}>After</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#64748b" }}>Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "#f8fafc" }}>
                  {recentChanges.map(change => (
                    <tr key={change.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-xs whitespace-nowrap" style={{ color: "#64748b" }}>
                        {formatDate(change.recorded_at)}
                      </td>
                      <td className="px-5 py-3">
                        <Link
                          href={`/cards/${change.card_id}`}
                          className="text-xs font-medium hover:underline"
                          style={{ color: "#2563eb" }}
                        >
                          {change.card_name ?? change.card_id}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#f1f5f9", color: "#64748b" }}>
                          {formatField(change.field)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs" style={{ color: "#94a3b8" }}>
                        {change.old_value ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-xs font-semibold" style={{ color: "#0f172a" }}>
                        {change.new_value}
                      </td>
                      <td className="px-5 py-3 text-xs italic" style={{ color: "#94a3b8" }}>
                        {change.note ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Portal editor ── */}
        <PortalEditor cards={allCards.map(c => ({
          id: c.id,
          name: c.name,
          issuer: c.issuer,
          portals: c.portals,
        }))} />

        {/* ── Cron triggers ── */}
        <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #e2e8f0" }}>
          <h2 className="font-bold text-base mb-1" style={{ color: "#0f172a" }}>Manual cron triggers</h2>
          <p className="text-xs mb-5" style={{ color: "#94a3b8" }}>
            Run scrapes manually. Requires <code className="bg-gray-100 px-1 rounded">CRON_SECRET</code> set in Vercel env vars.
          </p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Scrape cards",   path: "/api/scrape-cards"  },
              { label: "Scrape portals", path: "/api/scrape-portals" },
              { label: "Check links",    path: "/api/check-links"   },
              { label: "Send reminders", path: "/api/send-reminders" },
            ].map(job => (
              <a
                key={job.path}
                href={job.path}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b" }}
              >
                {job.label} →
              </a>
            ))}
          </div>
          <p className="mt-3 text-xs" style={{ color: "#94a3b8" }}>
            Note: These links open the route in a new tab. The routes require the <code className="bg-gray-100 px-1 rounded">Authorization: Bearer &lt;CRON_SECRET&gt;</code> header — use a tool like curl or Postman for authenticated calls.
          </p>
        </div>

      </div>
    </div>
  );
}
