import { Metadata } from 'next';
import Link from 'next/link';
import { getStockCounts } from '@/lib/stock/members';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ZAOstock Partner Deck | Oct 3, 2026',
  description: 'Partner packages for ZAOstock, a community-built outdoor music festival in Ellsworth, Maine on October 3, 2026. Tax-deductible via Fractured Atlas 501(c)(3).',
  openGraph: {
    title: 'ZAOstock Partner Deck',
    description: 'Become a Main Stage, Broadcast, or Year-Round Partner for ZAOstock on Oct 3, 2026.',
  },
};

const TRACKS = [
  {
    name: 'Main Stage Partner',
    range: '$500 - $2,500',
    fit: 'Local Ellsworth and Maine businesses who want to be credited at the stage and on-site.',
    credits: [
      'Named credit on stage banner and signage',
      'Booth or table space on-site',
      'Welcome bag inclusion',
      'Live verbal credit during the event',
      'Co-presented in all printed materials',
    ],
  },
  {
    name: 'Broadcast Partner',
    range: '$1,000 - $5,000',
    fit: 'Web3 brands, tools, and ecosystem partners who want reach across Farcaster + streaming.',
    credits: [
      'Named credit on festival website with backlink',
      'Livestream overlay credit',
      'Sponsored segment plus interview feature',
      'Social campaign across Farcaster, X, Bluesky, LinkedIn',
      'Newsletter credit (400+ editions)',
    ],
  },
  {
    name: 'Year-Round Partner',
    range: '$5,000+',
    fit: 'Strategic partners who want a long-term relationship with The ZAO.',
    credits: [
      'All Broadcast Partner credits',
      'Advisory seat for Year 2 planning',
      'Priority placement in 2027',
      'Quarterly collaboration across The ZAO calendar',
      'Tax-deductible via Fractured Atlas 501(c)(3)',
    ],
  },
];

const FAQ = [
  {
    q: 'Is this tax-deductible?',
    a: 'Yes. All partnerships flow through Fractured Atlas, our 501(c)(3) fiscal sponsor. You will receive proper documentation.',
  },
  {
    q: 'What do you do with the funds?',
    a: 'Every dollar goes to artist pay, production, and keeping the festival accessible. ZAOstock operates at break-even. No margin, no extraction.',
  },
  {
    q: 'Who is The ZAO?',
    a: 'A decentralized music community on Farcaster and Base, active since 2023. We have run virtual festivals (PALOOZA, ZAO-CHELLA) for two years. ZAOstock 2026 is our first IRL festival. Co-presented with Heart of Ellsworth and the Town of Ellsworth.',
  },
  {
    q: 'How many people show up?',
    a: 'ZAOstock runs during Maine Craft Weekend, pulling steady foot traffic from visitors heading to Acadia National Park. We are also marketing to our 188-member community and partner networks. Target: several hundred attendees plus digital livestream reach.',
  },
  {
    q: 'Can we customize the package?',
    a: 'Yes. Everything is modular. If you have a specific ask (booth placement, product integration, named stage, etc), let us talk.',
  },
  {
    q: 'What is the deadline?',
    a: 'We are locking partners by June 15, 2026 to hit print and digital deadlines. Earlier is better.',
  },
  {
    q: 'Can we pay in crypto?',
    a: 'Yes. USDC on Base preferred. Check, wire, or card also fine via Fractured Atlas.',
  },
];

export default async function DeckPage() {
  const counts = await getStockCounts();

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-12">
      <header className="sticky top-0 z-40 bg-[#0a1628]/95 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/stock" className="text-xs text-gray-400 hover:text-[#f5a623]">
            &larr; ZAOstock
          </Link>
          <span className="text-xs text-gray-500">Partner Deck</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-3">
          <p className="inline-block rounded-full bg-[#f5a623]/10 px-3 py-1 text-xs text-[#f5a623] font-medium border border-[#f5a623]/30">
            Partner Opportunity
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">ZAOstock Partners</h1>
          <p className="text-sm text-gray-400 max-w-xl mx-auto">
            October 3, 2026. Franklin Street Parklet, Ellsworth Maine. 10 artists, one stage, all day. Part of the 9th Annual Art of Ellsworth. Run by The ZAO, a decentralized music community.
          </p>
        </div>

        <section className="grid grid-cols-3 gap-2">
          <div className="bg-[#0d1b2a] rounded-lg p-3 border border-white/[0.06] text-center">
            <p className="text-2xl font-bold text-[#f5a623]">10</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Artists</p>
          </div>
          <div className="bg-[#0d1b2a] rounded-lg p-3 border border-white/[0.06] text-center">
            <p className="text-2xl font-bold text-[#f5a623]">{counts.rsvps || '-'}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">RSVPs so far</p>
          </div>
          <div className="bg-[#0d1b2a] rounded-lg p-3 border border-white/[0.06] text-center">
            <p className="text-2xl font-bold text-[#f5a623]">Oct 3</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">2026</p>
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Three Partner Tracks</p>
          {TRACKS.map((t) => (
            <div key={t.name} className="bg-[#0d1b2a] rounded-xl border border-white/[0.08] overflow-hidden">
              <div className="bg-gradient-to-r from-[#f5a623]/20 to-transparent px-4 py-3 flex items-baseline justify-between flex-wrap gap-2">
                <span className="font-bold text-base text-[#f5a623]">{t.name}</span>
                <span className="text-sm text-gray-300 font-medium">{t.range}</span>
              </div>
              <div className="px-4 py-3 space-y-3">
                <p className="text-sm text-gray-300 italic">{t.fit}</p>
                <ul className="text-sm text-gray-300 space-y-1.5">
                  {t.credits.map((c) => (
                    <li key={c} className="flex items-start gap-2">
                      <span className="text-[#f5a623] mt-1 text-xs">-</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </section>

        <section className="bg-gradient-to-br from-[#f5a623]/15 via-[#f5a623]/5 to-transparent rounded-xl p-5 border border-[#f5a623]/30 space-y-3">
          <p className="text-xs text-[#f5a623] uppercase tracking-wider font-bold">How to commit</p>
          <ol className="text-sm text-gray-300 space-y-2">
            <li><strong className="text-white">1.</strong> Email Zaal with the track you want (Main Stage / Broadcast / Year-Round) and any custom asks.</li>
            <li><strong className="text-white">2.</strong> We send a simple partner agreement + Fractured Atlas W-9 for tax docs.</li>
            <li><strong className="text-white">3.</strong> Partner contribution due by June 30 to lock printed materials.</li>
            <li><strong className="text-white">4.</strong> You ship your logo file by August 1 for all merch, stage, and broadcast use.</li>
            <li><strong className="text-white">5.</strong> Oct 3 - you are named on the stage, the broadcast, the website, and the day.</li>
          </ol>
          <div className="pt-2">
            <a
              href="mailto:zaalp99@gmail.com?subject=ZAOstock%20Partner%20Interest"
              className="inline-block bg-[#f5a623] hover:bg-[#ffd700] text-black font-bold rounded-lg px-4 py-2.5 text-sm transition-colors"
            >
              Email Zaal
            </a>
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">FAQ</p>
          <div className="space-y-2">
            {FAQ.map((f) => (
              <details key={f.q} className="bg-[#0d1b2a] rounded-lg border border-white/[0.06] p-3 group">
                <summary className="text-sm font-medium text-white cursor-pointer list-none flex justify-between items-center">
                  <span>{f.q}</span>
                  <span className="text-gray-500 text-xs group-open:rotate-180 transition-transform">v</span>
                </summary>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="bg-[#0d1b2a] rounded-xl p-5 border border-white/[0.08] space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Confirmed so far</p>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>- Heart of Ellsworth - Venue + Maine Craft Weekend promotion</li>
            <li>- Town of Ellsworth - Parklet venue</li>
            <li>- Fractured Atlas - 501(c)(3) fiscal sponsor</li>
            <li>- Black Moon Public House - Afterparty venue (30 seconds from the stage)</li>
          </ul>
          <p className="text-[11px] text-gray-500 italic pt-2">
            Reach out to be the first named partner in 2026.
          </p>
        </section>

        <div className="text-center">
          <Link href="/stock" className="text-sm text-[#f5a623] hover:text-[#ffd700]">
            Back to ZAOstock
          </Link>
        </div>
      </div>
    </div>
  );
}
