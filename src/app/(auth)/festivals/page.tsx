import type { Metadata } from 'next';
import Link from 'next/link';
import { NotificationBell } from '@/components/navigation/NotificationBell';
import { PageHeader } from '@/components/navigation/PageHeader';

export const metadata: Metadata = {
  title: 'Festivals | The ZAO',
  description: 'ZAO festivals -- past, present, and upcoming music events from The ZAO community.',
};

interface FestivalEvent {
  name: string;
  date: string;
  location?: string;
  description: string;
  href?: string | null;
  highlight?: boolean;
  badge?: string;
}

const UPCOMING: FestivalEvent[] = [
  {
    name: 'ZAOville 2027',
    date: 'Summer 2027',
    location: 'Maine',
    description:
      'Headline multi-day community music gathering and decentralized artist showcase.',
    href: null,
    highlight: true,
    badge: 'Headline 2027',
  },
  {
    name: 'ZAOstock 2027',
    date: 'Autumn 2027',
    location: 'Franklin Street Parklet, Ellsworth, Maine',
    description:
      'Annual outdoor music festival celebrating independent creators, Web3 music, and live sound.',
    href: '/stock',
    highlight: true,
    badge: 'Confirmed',
  },
  {
    name: 'MCW 2027',
    date: 'Fall 2027 (Maine Craft Weekend)',
    location: 'Ellsworth, Maine',
    description:
      'Participation in Maine Craft Weekend with acoustic sets coordinated with Heart of Ellsworth.',
    href: null,
    highlight: false,
  },
];

const RECENT: FestivalEvent[] = [
  {
    name: 'ZAOstock 2026',
    date: 'October 3, 2026',
    location: 'Franklin Street Parklet, Ellsworth, Maine',
    description:
      '7 acts played live (Maceo, dcoop, and community roster) at the 9th Annual Art of Ellsworth. 4K ground footage and drone clips are staged. Community video edits are incentivized via POIDH Bounties on Base.',
    href: '/bounties',
    highlight: false,
    badge: '7 Acts Live',
  },
];

const PAST: FestivalEvent[] = [
  {
    name: 'ZAO-CHELLA',
    date: '2025',
    description:
      'A multi-day virtual music experience showcasing emerging talent from The ZAO community.',
  },
  {
    name: 'ZAO-PALOOZA',
    date: '2024',
    description:
      "The ZAO's first virtual music festival -- a celebration of independent artists in the Farcaster ecosystem.",
  },
];

export default function FestivalsPage() {
  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-36">
      <PageHeader
        title="Festivals"
        subtitle="ZAO music events"
        rightAction={
          <div className="md:hidden">
            <NotificationBell />
          </div>
        }
      />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
        {/* Upcoming */}
        <section className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Upcoming Season</p>
          <div className="space-y-3">
            {UPCOMING.map((event) => {
              const card = (
                <div
                  className={`bg-[#0d1b2a] rounded-xl p-5 border ${
                    event.highlight
                      ? 'border-[#f5a623]/30 bg-gradient-to-r from-[#f5a623]/5 to-transparent'
                      : 'border-white/[0.08]'
                  } ${event.href ? 'hover:border-[#f5a623]/40 transition-colors' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-white text-lg">{event.name}</p>
                      <p className="text-sm text-[#f5a623] mt-0.5">{event.date}</p>
                      {event.location && (
                        <p className="text-xs text-gray-500 mt-0.5">{event.location}</p>
                      )}
                    </div>
                    {event.badge && (
                      <span className="shrink-0 bg-[#f5a623]/10 text-[#f5a623] text-xs font-medium px-2.5 py-1 rounded-full border border-[#f5a623]/30">
                        {event.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mt-3">{event.description}</p>
                </div>
              );

              if (event.href) {
                return (
                  <Link key={event.name} href={event.href} className="block">
                    {card}
                  </Link>
                );
              }
              return <div key={event.name}>{card}</div>;
            })}
          </div>
        </section>

        {/* Recent Recap */}
        <section className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Recent Festival</p>
          <div className="space-y-3">
            {RECENT.map((event) => {
              const card = (
                <div
                  className={`bg-[#0d1b2a] rounded-xl p-5 border border-white/[0.08] ${
                    event.href ? 'hover:border-[#f5a623]/40 transition-colors' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-white text-lg">{event.name}</p>
                      <p className="text-sm text-green-400 mt-0.5">{event.date}</p>
                      {event.location && (
                        <p className="text-xs text-gray-500 mt-0.5">{event.location}</p>
                      )}
                    </div>
                    {event.badge && (
                      <span className="shrink-0 bg-green-500/10 text-green-400 text-xs font-medium px-2.5 py-1 rounded-full border border-green-500/30">
                        {event.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 mt-3">{event.description}</p>
                  {event.href && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-[#f5a623] font-medium">
                      <span>View POIDH Video Bounties</span>
                      <span>-&gt;</span>
                    </div>
                  )}
                </div>
              );

              if (event.href) {
                return (
                  <Link key={event.name} href={event.href} className="block">
                    {card}
                  </Link>
                );
              }
              return <div key={event.name}>{card}</div>;
            })}
          </div>
        </section>

        {/* Past Virtual */}
        <section className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Past Events</p>
          <div className="space-y-3">
            {PAST.map((event) => (
              <div
                key={event.name}
                className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08]"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-bold text-white">{event.name}</p>
                    <p className="text-xs text-gray-500">{event.date}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-2">{event.description}</p>
                <p className="text-xs text-gray-600 mt-2">Archived virtual broadcast</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
