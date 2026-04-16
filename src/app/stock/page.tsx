import { Metadata } from 'next';
import Link from 'next/link';
import { CountdownTimer } from '@/components/events/CountdownTimer';
import { RSVPForm } from './RSVPForm';

export const metadata: Metadata = {
  title: 'ZAO Stock | Community Music Festival',
  description:
    'ZAO Stock — a community-built outdoor music festival in Ellsworth, Maine. October 3, 2026 at the Franklin Street Parklet.',
  openGraph: {
    title: 'ZAO Stock | Community Music Festival',
    description:
      'ZAO Stock — a community-built outdoor music festival in Ellsworth, Maine. October 3, 2026.',
    images: ['/images/festivals/zao-stock-logo.jpeg'],
  },
};

// Festival date — October 3, 2026, 12pm ET
const FESTIVAL_DATE = '2026-10-03T12:00:00-04:00';

const SPONSOR_OFFERINGS = [
  { category: 'On-Site', items: [
    'Logo on stage banner & signage',
    'Booth / table space at festival',
    'Welcome bag inserts',
    'Verbal shoutouts during event',
    'Co-presented branding across all materials',
  ]},
  { category: 'Digital', items: [
    'Logo on festival website with backlink',
    'Livestream overlay branding',
    'Sponsored segment + interview feature',
    'Social media campaign & Farcaster announcement',
    'Newsletter shoutout (400+ editions)',
  ]},
  { category: 'Partnership', items: [
    'Post-event thank-you feature & recap',
    'Year-round partnership & advisory seat',
    'Priority placement for Year 2',
    'Tax-deductible via Fractured Atlas 501(c)(3)',
  ]},
];

const PAST_EVENTS = [
  {
    name: 'PALOOZA',
    description: 'The ZAO\'s first virtual music festival — a celebration of independent artists in the Farcaster ecosystem.',
  },
  {
    name: 'ZAO-CHELLA',
    description: 'A multi-day virtual music experience showcasing emerging talent from The ZAO community.',
  },
];

const TEAMS = [
  {
    name: 'Operations',
    lead: 'Zaal',
    second: 'Candy',
    members: ['FailOften', 'Hurric4n3Ike', 'Swarthy Hatter'],
  },
  {
    name: 'Finance',
    lead: 'Zaal',
    second: '',
    members: ['Tyler Stambaugh', 'Ohnahji B', 'DFresh', 'Craig G', 'Maceo'],
  },
  {
    name: 'Design',
    lead: 'DaNici',
    second: 'Candy',
    members: ['FailOften', 'Shawn'],
  },
  {
    name: 'Music',
    lead: 'Zaal',
    second: 'DCoop',
    members: ['AttaBotty', 'Shawn'],
  },
];

const PARTNERS = [
  { name: 'Heart of Ellsworth', role: 'Venue + MCW statewide promotion', confirmed: true },
  { name: 'Town of Ellsworth', role: 'Parklet venue', confirmed: true },
  { name: 'Fractured Atlas', role: '501(c)(3) fiscal sponsor', confirmed: true },
  { name: 'Black Moon Public House', role: 'After-party venue', confirmed: false },
  { name: 'Wallace Events', role: 'Tent rental + weather backup', confirmed: false },
];

export default function StockPage() {
  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-12">
      {/* Simple public header */}
      <header className="sticky top-0 z-40 bg-[#0a1628]/95 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">ZAO Stock</h1>
            <p className="text-xs text-gray-400">Community Music Festival</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/stock/sponsor"
              className="text-xs text-gray-400 hover:text-[#f5a623] transition-colors"
            >
              Sponsors
            </Link>
            <Link
              href="/stock/team"
              className="text-xs text-gray-400 hover:text-[#f5a623] transition-colors"
            >
              Team
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

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-block rounded-full bg-[#f5a623]/10 px-4 py-1.5 text-sm text-[#f5a623] font-medium border border-[#f5a623]/30">
            October 3, 2026
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">ZAO Stock</h2>
          <p className="text-gray-400 text-lg max-w-md mx-auto">
            A community-built outdoor music festival in Ellsworth, Maine. 10 artists. One stage. All day.
          </p>
          <p className="text-sm text-gray-500">
            Franklin Street Parklet &middot; 12pm&ndash;6pm &middot; Part of Art of Ellsworth
          </p>
        </div>

        {/* Countdown */}
        <div className="bg-[#0d1b2a] rounded-xl p-6 border border-white/[0.08]">
          <CountdownTimer targetDate={FESTIVAL_DATE} eventName="ZAO Stock" />
        </div>

        {/* About */}
        <section className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">About the Festival</p>
          <div className="bg-[#0d1b2a] rounded-xl p-5 border border-white/[0.08] space-y-3">
            <p className="text-sm text-gray-300 leading-relaxed">
              ZAO Stock is The ZAO&apos;s flagship IRL music festival &mdash; a full-day outdoor showcase at the
              Franklin Street Parklet in downtown Ellsworth, Maine. Ten independent artists perform equal sets
              with DJs between, followed by an after-party at Black Moon Public House (30 seconds away).
            </p>
            <p className="text-sm text-gray-300 leading-relaxed">
              Part of the 9th Annual Art of Ellsworth during Maine Craft Weekend, ZAO Stock brings the
              decentralized music community together in the &ldquo;Crossroads of Downeast&rdquo; &mdash; where
              every car heading to Acadia National Park passes through.
            </p>
          </div>
        </section>

        {/* Lineup */}
        <section className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Lineup</p>
          <div className="bg-[#0d1b2a] rounded-xl border border-white/[0.08] p-5 text-center">
            <p className="text-sm text-gray-300">Full lineup coming soon</p>
            <p className="text-xs text-gray-500 mt-1">Artists performing equal sets with DJs between</p>
          </div>
        </section>

        {/* Team */}
        <section className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">The Team</p>
          <div className="space-y-3">
            {TEAMS.map((team) => (
              <div key={team.name} className="bg-[#0d1b2a] rounded-xl border border-white/[0.08] overflow-hidden">
                <div className="bg-gradient-to-r from-[#f5a623]/20 to-transparent px-4 py-2.5">
                  <span className="font-bold text-sm text-[#f5a623]">{team.name}</span>
                </div>
                <div className="px-4 py-3 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 text-xs bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/30 rounded-full px-2.5 py-1 font-medium">
                      {team.lead}
                      <span className="text-[10px] text-[#f5a623]/60">Lead</span>
                    </span>
                    {team.second && (
                    <span className="inline-flex items-center gap-1 text-xs bg-white/[0.04] text-gray-300 border border-white/[0.08] rounded-full px-2.5 py-1">
                      {team.second}
                      <span className="text-[10px] text-gray-500">2nd</span>
                    </span>
                    )}
                    {team.members.map((m) => (
                      <span key={m} className="text-xs bg-white/[0.04] text-gray-400 border border-white/[0.06] rounded-full px-2.5 py-1">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Partners */}
        <section className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Partners</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PARTNERS.map((partner) => (
              <div key={partner.name} className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-white text-sm">{partner.name}</p>
                  {partner.confirmed && (
                    <span className="text-[10px] text-[#f5a623] bg-[#f5a623]/10 rounded-full px-1.5 py-0.5">Confirmed</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">{partner.role}</p>
              </div>
            ))}
          </div>
        </section>

        {/* RSVP */}
        <section className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">RSVP</p>
          <div className="bg-gradient-to-r from-[#f5a623]/10 to-[#ffd700]/5 rounded-xl p-5 border border-[#f5a623]/30">
            <p className="text-lg font-bold text-white">Get Notified</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">
              Be the first to know when tickets drop, the lineup is announced, and more.
            </p>
            <RSVPForm eventSlug="zao-stock-2026" />
          </div>
        </section>

        {/* Sponsorship */}
        <section className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Sponsorship</p>
          <div className="bg-[#0d1b2a] rounded-xl p-5 border border-white/[0.08] space-y-2">
            <p className="text-sm text-gray-300 leading-relaxed">
              Two tracks available: Local Partners (Ellsworth businesses) and Digital Partners (Web3 brands).
              All sponsorships are tax-deductible through Fractured Atlas 501(c)(3). Packages are flexible
              - let&apos;s build something that works for you.
            </p>
            <p className="text-xs text-gray-500">
              Sponsorship deck coming soon &middot; Contact us for early partnership opportunities
            </p>
          </div>
          <div className="space-y-3">
            {SPONSOR_OFFERINGS.map((group) => (
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

        {/* Past Events */}
        <section className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Past Events</p>
          <div className="space-y-3">
            {PAST_EVENTS.map((event) => (
              <div key={event.name} className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08]">
                <p className="font-bold text-white">{event.name}</p>
                <p className="text-sm text-gray-400 mt-1">{event.description}</p>
                <p className="text-xs text-gray-600 mt-2">Photos coming soon</p>
              </div>
            ))}
          </div>
        </section>

        {/* Fundraising Links */}
        <section className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Support ZAO Stock</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08] opacity-60">
              <p className="font-medium text-white text-sm">Giveth Campaign</p>
              <p className="text-xs text-gray-500 mt-1">Coming soon</p>
            </div>
            <div className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08] opacity-60">
              <p className="font-medium text-white text-sm">GoFundMe Campaign</p>
              <p className="text-xs text-gray-500 mt-1">Coming soon</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
