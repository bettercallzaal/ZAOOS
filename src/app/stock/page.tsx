import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'ZAO Stock — October 3, 2026 | Ellsworth, Maine',
  description:
    'ZAO Stock is the flagship outdoor music festival presented by The ZAO. 10 artists, free entry, livestreamed live from the Franklin Street Parklet in downtown Ellsworth, Maine.',
  openGraph: {
    title: 'ZAO Stock — October 3, 2026 | Ellsworth, Maine',
    description:
      'ZAO Stock is the flagship outdoor music festival presented by The ZAO. 10 artists, free entry, livestreamed live from the Franklin Street Parklet in downtown Ellsworth, Maine.',
    url: 'https://zaoos.com/stock',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZAO Stock — October 3, 2026 | Ellsworth, Maine',
    description:
      'ZAO Stock is the flagship outdoor music festival presented by The ZAO. 10 artists, free entry, livestreamed live.',
  },
};

const sponsorTiers = [
  {
    name: 'Community',
    amount: '$500',
    perks: [
      'Name on event banner',
      'Social media shoutout',
      'Listed in event program',
    ],
  },
  {
    name: 'Stage',
    amount: '$2,500',
    perks: [
      'Logo on stage backdrop',
      'Verbal recognition during event',
      'Featured in livestream',
      'Social media campaign',
    ],
  },
  {
    name: 'Title',
    amount: '$5,000',
    perks: [
      'Named placement in event title',
      'Premium logo placement',
      'Dedicated social posts',
      'Featured in all press',
      'On-site activation space',
    ],
  },
  {
    name: 'Founding',
    amount: '$10,000',
    perks: [
      'Everything in Title tier',
      'Co-presented branding',
      'Year-round ZAO partnership',
      'Custom activation package',
      'Advisory seat at planning table',
    ],
  },
];

export default function ZAOStockPage() {
  return (
    <main className="min-h-[100dvh] flex flex-col bg-[#0a1628] relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#f5a623]/[0.02] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-0 w-[600px] h-[600px] bg-[#f5a623]/[0.015] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#f5a623]/[0.01] rounded-full blur-3xl pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-white/[0.04]">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          ZAO OS
        </Link>
        <Link
          href="/festivals"
          className="text-sm text-gray-400 hover:text-[#f5a623] transition-colors"
        >
          All Festivals
        </Link>
      </nav>

      <div className="relative z-10 flex-1">

        {/* Hero */}
        <section className="px-6 py-16 flex flex-col items-center text-center max-w-2xl mx-auto">
          <div className="mb-6 rounded-2xl overflow-hidden shadow-2xl shadow-[#f5a623]/10 border border-white/[0.06]">
            <Image
              src="/images/zao-stock-logo.jpeg"
              alt="ZAO Stock"
              width={300}
              height={300}
              className="object-cover"
              priority
            />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#f5a623] to-[#ffd700] bg-clip-text text-transparent mb-4 tracking-tight">
            ZAO Stock
          </h1>

          <div className="flex flex-col gap-1 mb-2">
            <p className="text-xl md:text-2xl font-semibold text-white">October 3, 2026</p>
            <p className="text-base text-gray-300 font-medium">Franklin Street Parklet</p>
            <p className="text-sm text-gray-400">Downtown Ellsworth, Maine</p>
          </div>

          <p className="text-xs text-gray-500 mb-8 mt-1">
            Part of Art of Ellsworth: Maine Craft Weekend
          </p>

          {/* Tags */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { label: '12pm – 6pm', icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
              { label: '10 Artists', icon: 'M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z' },
              { label: 'Free Entry', icon: 'M16.5 6v.75a3.75 3.75 0 01-7.5 0V6m-4.125 1.5h15.375a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25H4.875A2.25 2.25 0 012.625 18.75v-9a2.25 2.25 0 012.25-2.25z' },
              { label: 'Livestreamed', icon: 'M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z' },
            ].map(({ label, icon }) => (
              <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
                <svg className="w-3.5 h-3.5 text-[#f5a623]/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
                <span className="text-xs text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* About */}
        <section className="px-6 py-12 max-w-2xl mx-auto">
          <h2 className="text-lg font-semibold text-white mb-4">About ZAO Stock</h2>
          <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
            <p>
              ZAO Stock is the flagship outdoor music festival presented by The ZAO — a decentralized music
              community built around artists who govern, collaborate, and build together. It&apos;s a full day of
              live performances from 10 independent artists, held in the open air of downtown Ellsworth, Maine.
              The philosophy is simple: art first, tech invisible, community forever.
            </p>
            <p>
              ZAO Stock is embedded in the 9th Annual Art of Ellsworth: Maine Craft Weekend — a celebrated
              regional arts event that draws visitors from across the state and beyond. By anchoring ZAO Stock
              within this established cultural moment, we bring live music into the heart of a weekend already
              dedicated to craft, community, and creativity. Free to attend. Open to all.
            </p>
          </div>
        </section>

        {/* Lineup */}
        <section className="px-6 py-12 max-w-2xl mx-auto">
          <h2 className="text-lg font-semibold text-white mb-4">Lineup</h2>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-8 text-center">
            <div className="text-4xl mb-4">🎵</div>
            <p className="text-white font-semibold text-base mb-2">Coming Soon</p>
            <p className="text-sm text-gray-400">
              10 artists performing throughout the day — lineup announcement coming this summer.
            </p>
          </div>
        </section>

        {/* Schedule */}
        <section className="px-6 py-12 max-w-2xl mx-auto">
          <h2 className="text-lg font-semibold text-white mb-4">Schedule</h2>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl divide-y divide-white/[0.04]">
            {[
              {
                time: '12:00 PM',
                label: 'Doors Open',
                detail: 'Franklin Street Parklet opens to the public',
              },
              {
                time: '12:00 – 6:00 PM',
                label: 'Live Performances',
                detail: '10 artists performing back-to-back sets throughout the afternoon',
              },
              {
                time: '6:00 PM',
                label: 'Sunset + After-Party',
                detail: 'After-party at Black Moon Public House, Ellsworth',
              },
            ].map(({ time, label, detail }) => (
              <div key={time} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                <span className="text-[#f5a623] font-mono text-xs font-medium min-w-[120px] shrink-0">{time}</span>
                <div>
                  <p className="text-white text-sm font-medium">{label}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Location */}
        <section className="px-6 py-12 max-w-2xl mx-auto">
          <h2 className="text-lg font-semibold text-white mb-4">Location</h2>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-start gap-3 mb-5">
              <div className="mt-0.5 w-8 h-8 rounded-lg bg-[#f5a623]/10 border border-[#f5a623]/20 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Franklin Street Parklet</p>
                <p className="text-gray-400 text-xs mt-0.5">Between Main St &amp; Store St</p>
                <p className="text-gray-400 text-xs">Ellsworth, ME 04605</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-5 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-gray-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
                ~30 min from Bangor International Airport
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-gray-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
                ~25 min from Bar Harbor / Acadia National Park
              </div>
            </div>

            <a
              href="https://maps.google.com/?q=Franklin+Street+Parklet+Ellsworth+ME+04605"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[#f5a623]/10 border border-[#f5a623]/20 text-sm text-[#f5a623] font-medium hover:bg-[#f5a623]/15 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              Open in Google Maps
            </a>
          </div>
        </section>

        {/* Watch Live */}
        <section className="px-6 py-12 max-w-2xl mx-auto">
          <h2 className="text-lg font-semibold text-white mb-4">Watch Live</h2>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-[#f5a623]/10 border border-[#f5a623]/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-5 h-5 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <p className="text-white font-semibold text-sm mb-2">Can&apos;t make it in person?</p>
            <p className="text-gray-400 text-sm mb-5">
              We&apos;re livestreaming the full event. The link will go live on the day of the show.
            </p>
            <div className="px-4 py-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs text-gray-500">
              Livestream link available October 3, 2026
            </div>
          </div>
        </section>

        {/* Become a Sponsor */}
        <section className="px-6 py-12 max-w-2xl mx-auto">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-2">Become a Sponsor</h2>
            <p className="text-sm text-gray-400">
              Support independent music and community-first culture. Four tiers to fit any budget.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {sponsorTiers.map((tier) => (
              <div key={tier.name} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold text-sm">{tier.name}</h3>
                  <span className="text-[#f5a623] font-bold text-sm">{tier.amount}</span>
                </div>
                <ul className="space-y-1.5">
                  {tier.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-xs text-gray-400">
                      <svg className="w-3 h-3 text-[#f5a623]/60 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <a
            href="mailto:zaal@thezao.com?subject=ZAO Stock Sponsorship"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#f5a623]/10 border border-[#f5a623]/20 text-[#f5a623] font-medium text-sm hover:bg-[#f5a623]/15 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            Contact for Sponsorship — zaal@thezao.com
          </a>
        </section>

        {/* Support ZAO Stock */}
        <section className="px-6 py-12 max-w-2xl mx-auto">
          <h2 className="text-lg font-semibold text-white mb-2">Support ZAO Stock</h2>
          <p className="text-sm text-gray-400 mb-6">
            Every contribution helps us pay artists, cover production costs, and keep the event free and open to the public.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="https://giveth.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-sm text-gray-300 font-medium hover:bg-white/[0.04] hover:text-white transition-colors"
            >
              <svg className="w-4 h-4 text-[#f5a623]/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              Donate on Giveth
            </a>
            <a
              href="https://gofundme.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-sm text-gray-300 font-medium hover:bg-white/[0.04] hover:text-white transition-colors"
            >
              <svg className="w-4 h-4 text-[#f5a623]/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              Donate on GoFundMe
            </a>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-10 border-t border-white/[0.04]">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs text-gray-500 mb-1">
            Presented by The ZAO &bull; Part of Art of Ellsworth: Maine Craft Weekend
          </p>
          <p className="text-xs text-gray-600 italic">
            Art first. Tech invisible. Community forever.
          </p>
        </div>
      </footer>
    </main>
  );
}
