import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cards } from "../../data/cards";
import CardImage from "./CardImage";
import TrackButton from "./TrackButton";

export async function generateStaticParams() {
  return cards.map(card => ({ id: card.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const card = cards.find(c => c.id === id);
  if (!card) return {};
  const description = `${card.pointsBonus} welcome bonus. ${card.firstYearValue} first-year value. ${card.annualFee} annual fee. Compare rebate portals and apply via the highest payout.`;
  return {
    title: card.name,
    description,
    openGraph: {
      title: `${card.name} — ChurnCA`,
      description,
      images: [{ url: card.image, width: 600, height: 375, alt: card.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${card.name} — ChurnCA`,
      description,
      images: [card.image],
    },
  };
}

function CheckIcon({ checked }: { checked: boolean }) {
  return checked ? (
    <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ) : (
    <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}


export default async function CardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const card = cards.find(c => c.id === id);
  if (!card) notFound();

  const bestPortal = card.portals.length > 0 ? card.portals[0] : null;

  // Normalise insurance for checklist display
  const hasMedical = card.insurance?.some(i => i.startsWith("Travel Medical"));
  const medicalStr = card.insurance?.find(i => i.startsWith("Travel Medical")) ?? "";
  const insuranceChecklist = [
    { label: `Travel Medical ${medicalStr.match(/\(\$[^)]+\)/)?.[0] ?? ""}`.trim(), has: !!hasMedical },
    { label: "Trip Cancellation",   has: !!card.insurance?.includes("Trip Cancellation") },
    { label: "Trip Interruption",   has: !!card.insurance?.includes("Trip Interruption") },
    { label: "Baggage Delay",       has: !!card.insurance?.includes("Baggage Delay") },
    { label: "Lost Baggage",        has: !!card.insurance?.includes("Lost Baggage") },
    { label: "Rental Car",          has: !!card.insurance?.includes("Rental Car") },
    { label: "Purchase Protection", has: !!card.insurance?.includes("Purchase Protection") },
    { label: "Extended Warranty",   has: !!card.insurance?.includes("Extended Warranty") },
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ── */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-20">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">ChurnCA</Link>
            <span className="text-gray-300">/</span>
            <Link href="/cards" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Credit Cards</Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm text-gray-700 font-medium truncate max-w-48">{card.name}</span>
          </div>
          <Link href="/cards" className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden sm:block">
            ← All cards
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* ── Hero ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 mb-12">

          {/* Card image */}
          <div className="lg:col-span-2">
            <div className="relative shadow-xl rounded-2xl">
              <CardImage src={card.image} alt={card.name} gradient={card.gradient} />
              {card.elevated && (
                <span className="absolute top-3 left-3 text-xs font-bold bg-red-600 text-white px-2.5 py-1 rounded-full shadow-sm tracking-wide">
                  🔥 HOT OFFER
                </span>
              )}
              {!card.elevated && card.featured && (
                <span className="absolute top-3 left-3 text-xs font-semibold bg-amber-400 text-amber-900 px-2.5 py-1 rounded-full shadow-sm">
                  FEATURED
                </span>
              )}
            </div>
            {card.elevated && card.elevatedNote && (
              <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <span className="text-red-500 mt-0.5 shrink-0">🔥</span>
                <div>
                  <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-0.5">Elevated Offer</p>
                  <p className="text-sm text-red-700">{card.elevatedNote}</p>
                </div>
              </div>
            )}

            {/* Quick badges */}
            <div className="mt-4 flex flex-wrap gap-2">
              {card.network && (
                <span className="text-xs bg-gray-100 text-gray-700 font-medium px-2.5 py-1 rounded-full">{card.network}</span>
              )}
              {card.foreignFee && (
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${card.foreignFee.startsWith("0%") ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                  FX: {card.foreignFee.startsWith("0%") ? "No foreign fees" : card.foreignFee}
                </span>
              )}
              {card.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-xs bg-blue-50 text-blue-700 font-medium px-2.5 py-1 rounded-full">{tag}</span>
              ))}
            </div>
          </div>

          {/* Card info */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">{card.issuer}</p>
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">{card.name}</h1>
              <p className="text-sm text-gray-500 mt-1">{card.program}</p>
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-orange-50 rounded-2xl p-4 text-center">
                <p className="text-xs text-orange-400 font-medium mb-1">1st Year Value</p>
                <p className="font-black text-orange-600 text-xl">{card.firstYearValue}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 text-center">
                <p className="text-xs text-gray-400 font-medium mb-1">Welcome Bonus</p>
                <p className="font-bold text-gray-800 text-sm leading-tight">{card.pointsBonus}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 text-center">
                <p className="text-xs text-gray-400 font-medium mb-1">Annual Fee</p>
                <p className="font-bold text-gray-800 text-lg">{card.annualFee}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 text-center">
                <p className="text-xs text-gray-400 font-medium mb-1">Spend Required</p>
                <p className="font-bold text-gray-800 text-sm leading-tight">{card.msr}</p>
              </div>
            </div>

            {/* Portal comparison */}
            {card.portals.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-3">Apply via rebate portal</p>
                <div className="flex flex-col gap-2">
                  {card.portals.map((portal, i) => (
                    <a
                      key={portal.name}
                      href={portal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                        i === 0
                          ? "bg-green-50 border-green-200 hover:bg-green-100"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {i === 0 && <span className="text-xs font-bold bg-green-500 text-white px-1.5 py-0.5 rounded">BEST</span>}
                        <span className={`font-semibold text-sm ${i === 0 ? "text-green-800" : "text-gray-700"}`}>{portal.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-black text-lg ${i === 0 ? "text-green-700" : "text-gray-700"}`}>+${portal.bonus}</span>
                        <span className={`text-xs ${i === 0 ? "text-green-600" : "text-gray-400"}`}>cash back</span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Apply CTA */}
            <div className="flex flex-wrap gap-3">
              <a
                href={bestPortal ? bestPortal.url : card.directLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-red-900 hover:bg-red-800 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors shadow-sm"
              >
                {bestPortal ? `Apply via ${bestPortal.name} (+$${bestPortal.bonus})` : "Apply Now"}
              </a>
              {bestPortal && (
                <a
                  href={card.directLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-gray-200 hover:border-gray-400 text-gray-600 hover:text-gray-900 font-medium px-5 py-3 rounded-xl text-sm transition-colors"
                >
                  Apply direct (no bonus)
                </a>
              )}
              <TrackButton cardId={card.id} />
            </div>

          </div>
        </div>

        {/* ── Detail sections ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left column — rewards + transfer partners */}
          <div className="lg:col-span-2 flex flex-col gap-8">

            {/* Welcome bonus milestones */}
            {card.welcomeMilestones && card.welcomeMilestones.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-gray-900 text-lg mb-1">Welcome bonus</h2>
                <p className="text-sm text-gray-400 mb-5">Total: <span className="font-semibold text-gray-700">{card.pointsBonus}</span></p>
                <div className="flex flex-col gap-4">
                  {card.welcomeMilestones.map((m, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="w-7 h-7 rounded-full bg-red-50 border-2 border-red-100 text-red-900 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3">
                        <p className="font-bold text-gray-900 text-sm">{m.points}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{m.condition}</p>
                        {m.note && <p className="text-xs text-amber-600 mt-1 font-medium">{m.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Earn rates */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h2 className="font-bold text-gray-900 text-lg mb-4">Earn rates</h2>
              <div className="flex flex-col gap-3">
                {card.rewards.map((r, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={`font-black text-lg w-14 shrink-0 ${i === 0 ? "text-red-900" : "text-gray-600"}`}>{r.multiplier}</span>
                    <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-sm text-gray-700">{r.category}</span>
                    </div>
                  </div>
                ))}
              </div>
              {card.pointsValue && (
                <p className="mt-4 text-xs text-gray-500 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg">
                  <strong>Points value:</strong> {card.pointsValue}
                </p>
              )}
            </div>

            {/* Transfer partners */}
            {card.transferPartners && card.transferPartners.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-gray-900 text-lg mb-4">Transfer partners</h2>
                <div className="flex flex-col gap-2">
                  {card.transferPartners.map((partner, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-900 shrink-0" />
                      {partner}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lounge access */}
            {card.loungeDetails && (
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-gray-900 text-lg mb-3">Lounge access</h2>
                <p className="text-sm text-gray-700 leading-relaxed">{card.loungeDetails}</p>
              </div>
            )}

            {/* Additional perks */}
            {card.perks && card.perks.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-gray-900 text-lg mb-4">Additional perks</h2>
                <ul className="flex flex-col gap-2">
                  {card.perks.map((perk, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>

          {/* Right column — insurance + card details */}
          <div className="flex flex-col gap-6">

            {/* Insurance checklist */}
            {card.insurance && card.insurance.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-gray-900 text-lg mb-4">Insurance coverage</h2>
                <div className="flex flex-col gap-2.5">
                  {insuranceChecklist.map(item => (
                    <div key={item.label} className="flex items-center gap-2.5">
                      <CheckIcon checked={item.has} />
                      <span className={`text-sm ${item.has ? "text-gray-700" : "text-gray-400 line-through"}`}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Card details */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h2 className="font-bold text-gray-900 text-lg mb-4">Card details</h2>
              <div className="flex flex-col gap-3 text-sm">
                {[
                  { label: "Network",       value: card.network },
                  { label: "Annual fee",    value: card.annualFee },
                  { label: "Foreign fee",   value: card.foreignFee },
                  { label: "Income req.",   value: card.incomeReq },
                  { label: "Program",       value: card.program },
                ].map(row => row.value ? (
                  <div key={row.label} className="flex justify-between gap-4">
                    <span className="text-gray-400 shrink-0">{row.label}</span>
                    <span className={`font-medium text-right ${row.label === "Foreign fee" && row.value.startsWith("0%") ? "text-green-700" : "text-gray-800"}`}>
                      {row.value}
                    </span>
                  </div>
                ) : null)}
              </div>
            </div>

          </div>
        </div>

        {/* ── Related cards ── */}
        <div className="mt-12 pt-10 border-t border-gray-100">
          <h2 className="font-bold text-gray-900 text-xl mb-6">Other {card.issuer} cards</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {cards
              .filter(c => c.issuer === card.issuer && c.id !== card.id)
              .slice(0, 3)
              .map(related => (
                <Link
                  key={related.id}
                  href={`/cards/${related.id}`}
                  className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-2xl hover:border-red-200 hover:shadow-md transition-all"
                >
                  <div className="relative w-20 aspect-[1.586/1] rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    <Image src={related.image} alt={related.name} fill className="object-contain p-1" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm leading-tight">{related.name}</p>
                    <p className="text-xs text-orange-500 font-bold mt-0.5">{related.firstYearValue}</p>
                    <p className="text-xs text-gray-400">{related.annualFee}</p>
                  </div>
                </Link>
              ))}
          </div>
        </div>

      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 mt-16 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <Link href="/" className="font-bold text-gray-600 text-sm">ChurnCA</Link>
          <div className="flex gap-5">
            <Link href="/cards" className="hover:text-gray-600 transition-colors">All Cards</Link>
            <Link href="/auth" className="hover:text-gray-600 transition-colors">Sign up</Link>
            <Link href="/dashboard" className="hover:text-gray-600 transition-colors">Dashboard</Link>
          </div>
          <p>Offers change frequently — always verify before applying.</p>
        </div>
      </footer>
    </div>
  );
}
