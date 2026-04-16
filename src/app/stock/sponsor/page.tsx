import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sponsor ZAO Stock | Community Music Festival',
  description:
    'Partner with ZAO Stock — a community-built outdoor music festival in Ellsworth, Maine. October 3, 2026. Tax-deductible via Fractured Atlas 501(c)(3).',
  openGraph: {
    title: 'Sponsor ZAO Stock | Community Music Festival',
    description:
      'Partner with ZAO Stock — October 3, 2026, Ellsworth, Maine. Tax-deductible sponsorships available.',
    images: ['/images/festivals/zao-stock-logo.jpeg'],
  },
};

const CREDIBILITY_STATS = [
  { number: '90+', label: 'Weekly Governance Sessions' },
  { number: '400+', label: 'Daily Newsletter Editions' },
  { number: '795', label: 'WaveWarZ Music Battles' },
  { number: '4M+', label: 'Acadia Visitors (2025)' },
  { number: '5', label: 'COC Concertz Events' },
  { number: '19', label: 'Team Members + Advisors' },
];

const SPONSOR_BENEFITS = [
  {
    category: 'Visibility',
    items: [
      'Logo on stage banner visible in all livestream footage',
      'Logo on zaoos.com/stock (permanent, not just event day)',
      'Mentioned in 400+ edition daily newsletter',
      'Social media campaign across Farcaster, X, LinkedIn',
      'Featured in COC Concertz monthly virtual events (4+ months of pre-event exposure)',
    ],
  },
  {
    category: 'On-Site',
    items: [
      'Booth or table space at the festival',
      'Welcome bag inserts for attendees',
      'Verbal shoutouts during performances',
      'Logo on printed lineup cards (200+)',
      'Wayfinding signage with your branding',
    ],
  },
  {
    category: 'Digital + Onchain',
    items: [
      'Livestream overlay branding (YouTube, Twitch, ZAO OS)',
      'Sponsored segment in post-event highlight reel',
      'Logo in digital attendance collectible (claimed by every attendee)',
      'Post-event metrics report: livestream views, social reach, attendance, content views',
    ],
  },
  {
    category: 'Partnership',
    items: [
      'Tax-deductible via Fractured Atlas 501(c)(3)',
      'Priority placement for Year 2 (multi-year partners get first pick)',
      'Advisory board seat for founding sponsors',
      'Year-round partnership, not just one day',
    ],
  },
];

const ADVISORS = [
  { name: 'Adam Place', title: 'Founder & CEO, Songjam' },
  { name: 'Craig Gonzalez', title: 'Partnerships, Whop ($1.6B)' },
  { name: 'Tom Fellenz', title: 'NFT Music Hall, 40+ artists hosted' },
  { name: 'Tyler Stambaugh', title: 'Ex-JPMorgan, Magnetiq COO' },
  { name: 'Steve Peer', title: '37 years Ellsworth music scene' },
];

const PAST_PROOF = [
  {
    name: 'ZAO-Chella',
    detail: 'Art Basel Miami, Dec 2024 - 10 Web3 artists, AR art, trading cards, Wynwood',
  },
  {
    name: 'COC Concertz',
    detail: '5 monthly metaverse concerts, free entry, artists from 4 countries',
  },
  {
    name: 'WaveWarZ',
    detail: '795 music battles, 435 SOL ($37K+) volume, artists paid instantly onchain',
  },
  {
    name: 'ZAO Fractals',
    detail: '90+ consecutive weekly governance sessions, never missed a Monday',
  },
];

export default function SponsorPage() {
  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-12">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a1628]/95 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">ZAO Stock</h1>
            <p className="text-xs text-gray-400">Sponsor Deck</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/stock"
              className="text-xs text-gray-400 hover:text-[#f5a623] transition-colors"
            >
              Festival Page
            </Link>
            <Link
              href="/"
              className="text-sm text-[#f5a623] hover:text-[#ffd700] transition-colors"
            >
              The ZAO
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-10">
        {/* Hero */}
        <div className="space-y-4">
          <div className="inline-block rounded-full bg-[#f5a623]/10 px-4 py-1.5 text-sm text-[#f5a623] font-medium border border-[#f5a623]/30">
            October 3, 2026 - Ellsworth, Maine
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
            Partner with ZAO Stock
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            A community-built outdoor music festival at the gateway to Acadia National Park.
            10 independent artists. One stage. All day. Tax-deductible.
          </p>
        </div>

        {/* The Story */}
        <section className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Why Ellsworth</p>
          <div className="bg-[#0d1b2a] rounded-xl p-5 border border-white/[0.08] space-y-3">
            <p className="text-sm text-gray-300 leading-relaxed">
              The founder bought a house in Ellsworth. This isn&apos;t a fly-in event - it&apos;s a
              local commitment. Year 1 of a multi-year festival built by a community that&apos;s been
              meeting every Monday for 90+ weeks straight.
            </p>
            <p className="text-sm text-gray-300 leading-relaxed">
              Downtown Ellsworth just received National Historic Register designation. Heart of
              Ellsworth facilitated 28 events in 2025 with $391K in grants and 50+ sponsors. Every
              car heading to Acadia passes through here - 4 million visitors last year.
            </p>
            <p className="text-sm text-gray-300 leading-relaxed">
              ZAO Stock is part of the 9th Annual Art of Ellsworth during Maine Craft Weekend - a
              statewide event that drives traffic to every participating town. We&apos;re not
              starting from zero. We&apos;re plugging into existing infrastructure.
            </p>
          </div>
        </section>

        {/* Credibility Numbers */}
        <section className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">The Numbers</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CREDIBILITY_STATS.map((stat) => (
              <div
                key={stat.label}
                className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08] text-center"
              >
                <p className="text-2xl font-bold text-[#f5a623]">{stat.number}</p>
                <p className="text-[11px] text-gray-500 mt-1 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Past Events */}
        <section className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Track Record</p>
          <div className="space-y-2">
            {PAST_PROOF.map((event) => (
              <div key={event.name} className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08]">
                <p className="font-bold text-white text-sm">{event.name}</p>
                <p className="text-xs text-gray-400 mt-1">{event.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What Sponsors Get */}
        <section className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">What You Get</p>
          <div className="space-y-3">
            {SPONSOR_BENEFITS.map((group) => (
              <div key={group.category} className="bg-[#0d1b2a] rounded-xl border border-white/[0.08] overflow-hidden">
                <div className="bg-gradient-to-r from-[#f5a623]/20 to-transparent px-4 py-2.5">
                  <span className="font-bold text-sm text-[#f5a623]">{group.category}</span>
                </div>
                <ul className="px-4 py-3 space-y-1.5">
                  {group.items.map((item) => (
                    <li key={item} className="text-xs text-gray-400 flex items-start gap-2">
                      <span className="text-[#f5a623] mt-0.5">&#8226;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Tax Deductible */}
        <section className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Tax-Deductible</p>
          <div className="bg-gradient-to-r from-[#f5a623]/10 to-[#ffd700]/5 rounded-xl p-5 border border-[#f5a623]/30">
            <p className="text-sm text-gray-300 leading-relaxed">
              ZAO Stock is a fiscally sponsored project of Fractured Atlas, a 501(c)(3) public
              charity. Contributions for the purposes of ZAO Stock are tax-deductible to the extent
              permitted by law.
            </p>
          </div>
        </section>

        {/* Advisory Board */}
        <section className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Advisory Board</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ADVISORS.map((advisor) => (
              <div key={advisor.name} className="bg-[#0d1b2a] rounded-xl p-3 border border-white/[0.08]">
                <p className="font-medium text-white text-sm">{advisor.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{advisor.title}</p>
              </div>
            ))}
          </div>
        </section>

        {/* The Event */}
        <section className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">The Event</p>
          <div className="bg-[#0d1b2a] rounded-xl p-5 border border-white/[0.08] space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Date</p>
                <p className="text-white font-medium">October 3, 2026</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Time</p>
                <p className="text-white font-medium">12pm - 6pm</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Venue</p>
                <p className="text-white font-medium">Franklin Street Parklet</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">After-Party</p>
                <p className="text-white font-medium">Black Moon Public House</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Artists</p>
                <p className="text-white font-medium">10 independent performers</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Livestream</p>
                <p className="text-white font-medium">YouTube + Twitch + ZAO OS</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Part of the 9th Annual Art of Ellsworth during Maine Craft Weekend (statewide)
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="space-y-3">
          <div className="bg-gradient-to-r from-[#f5a623]/10 to-[#ffd700]/5 rounded-xl p-6 border border-[#f5a623]/30 text-center space-y-3">
            <p className="text-xl font-bold text-white">Let&apos;s build something together</p>
            <p className="text-sm text-gray-400">
              Packages are flexible. We&apos;d rather find what works for you than force a tier.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <a
                href="mailto:zaal@zaoos.com?subject=ZAO%20Stock%20Sponsorship"
                className="bg-[#f5a623] hover:bg-[#ffd700] text-black font-bold rounded-lg px-6 py-3 text-sm transition-colors inline-block"
              >
                Email Us
              </a>
              <Link
                href="/stock"
                className="bg-white/[0.06] hover:bg-white/[0.1] text-white font-medium rounded-lg px-6 py-3 text-sm transition-colors border border-white/[0.08] inline-block"
              >
                View Festival Page
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
