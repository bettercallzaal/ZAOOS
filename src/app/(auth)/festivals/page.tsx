import { Metadata } from 'next';
import Link from 'next/link';
import { NotificationBell } from '@/components/navigation/NotificationBell';
import { PageHeader } from '@/components/navigation/PageHeader';

export const metadata: Metadata = {
  title: 'Festivals | The ZAO',
  description: 'ZAO festivals — past and upcoming music events from The ZAO community.',
};

const UPCOMING = [
  {
    name: 'ZAO Stock',
    date: 'October 3, 2026',
    location: 'Franklin Street Parklet, Ellsworth, Maine',
    description:
      'The ZAO\'s flagship outdoor music festival. 10 artists, one stage, all day. Part of the 9th Annual Art of Ellsworth.',
    href: '/stock',
    highlight: true,
  },
  {
    name: 'MCW 2026',
    date: 'TBD (Maine Craft Weekend)',
    location: 'Ellsworth, Maine',
    description:
      'Participation in Maine Craft Weekend — dates pending confirmation from Heart of Ellsworth.',
    href: null,
    highlight: false,
  },
];

const PAST = [
  {
    name: 'PALOOZA',
    date: '2024',
    description:
      'The ZAO\'s first virtual music festival — a celebration of independent artists in the Farcaster ecosystem.',
  },
  {
    name: 'ZAO-CHELLA',
    date: '2025',
    description:
      'A multi-day virtual music experience showcasing emerging talent from The ZAO community.',
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
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Upcoming</p>
          <div className="space-y-3">
            {UPCOMING.map((event) => {
              const card = (
                <div
                  className={`bg-[#0d1b2a] rounded-xl p-5 border ${
                    event.highlight
                      ? 'border-[#f5a623]/30 bg-gradient-to-r from-[#f5a623]/5 to-transparent'
                      : 'border-gray-800'
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
                    {event.highlight && (
                      <span className="shrink-0 bg-[#f5a623]/10 text-[#f5a623] text-xs font-medium px-2.5 py-1 rounded-full border border-[#f5a623]/30">
                        Featured
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

        {/* Past */}
        <section className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Past Events</p>
          <div className="space-y-3">
            {PAST.map((event) => (
              <div key={event.name} className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-bold text-white">{event.name}</p>
                    <p className="text-xs text-gray-500">{event.date}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-2">{event.description}</p>
                <p className="text-xs text-gray-600 mt-2">Photos coming soon</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
