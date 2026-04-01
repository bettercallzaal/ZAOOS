import { Metadata } from 'next';
import { NotificationBell } from '@/components/navigation/NotificationBell';
import { PageHeader } from '@/components/navigation/PageHeader';
import { communityConfig } from '@/community.config';

export const metadata: Metadata = {
  title: 'Calendar | ZAO OS',
  description: 'ZAO community calendar — upcoming events, releases, and community activations.',
};

// Weekly fractal session recurring event
const RECURRING_EVENTS = [
  {
    id: 'fractal-weekly',
    title: 'Fractal Session',
    description: 'Weekly fractal governance circle. Discuss, decide, and align on community priorities.',
    day: 'Monday',
    time: '6:00 PM EST',
    recurrence: 'Every Monday',
    emoji: '🔄',
    color: 'border-[#f5a623]',
  },
];

// One-time community events (can be extended via Supabase)
const COMMUNITY_EVENTS = [
  {
    id: 'fractal-mon-archive',
    title: 'Monday Fractal Archive',
    description: 'Review past fractal session notes and decisions.',
    day: 'Tuesday',
    time: '8:00 PM EST',
    recurrence: 'Weekly (post-session)',
    emoji: '📋',
    color: 'border-blue-500',
  },
];

export default function CalendarPage() {
  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-36">
      <PageHeader
        title="ZAO Calendar"
        subtitle="Events, releases & community activations"
        rightAction={<div className="md:hidden"><NotificationBell /></div>}
      />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Upcoming Events */}
        <section>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 px-1">
            Upcoming
          </p>
          <div className="space-y-3">
            {RECURRING_EVENTS.map((event) => (
              <div
                key={event.id}
                className={`bg-[#0d1b2a] rounded-xl p-4 border-l-4 ${event.color} border border-gray-800`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{event.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{event.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{event.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-[#f5a623] font-medium">{event.day}s</span>
                      <span className="text-xs text-gray-600">•</span>
                      <span className="text-xs text-gray-500">{event.time}</span>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-1">{event.recurrence}</p>
                  </div>
                </div>
              </div>
            ))}

            {COMMUNITY_EVENTS.map((event) => (
              <div
                key={event.id}
                className={`bg-[#0d1b2a] rounded-xl p-4 border-l-4 ${event.color} border border-gray-800`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{event.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{event.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{event.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-500 font-medium">{event.day}</span>
                      <span className="text-xs text-gray-600">•</span>
                      <span className="text-xs text-gray-500">{event.time}</span>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-1">{event.recurrence}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Add to Calendar */}
        <section>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 px-1">
            Add to Calendar
          </p>
          <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 overflow-hidden">
            <a
              href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=ZAO+Fractal+Session&details=Weekly+fractal+governance+circle&recurrence=weekly&location=Farcaster"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#1a2a3a]/50 transition-colors border-b border-gray-800"
            >
              <svg className="w-5 h-5 text-[#4285F4]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.3333 10.6667H12V8H21.3333C21.3333 5.054 18.946 2.66667 16 2.66667C13.054 2.66667 10.6667 5.054 10.6667 8V10.6667H2.66667C2.66667 13.6127 5.054 16 8 16H10.6667V10.6667H8C5.054 10.6667 2.66667 13.054 2.66667 16C2.66667 18.946 5.054 21.3333 8 21.3333C10.6667 21.3333 12.7373 19.496 13.032 16.888L13.3333 16H16C18.946 16 21.3333 13.6127 21.3333 10.6667Z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Google Calendar</p>
                <p className="text-xs text-gray-500">Add fractal sessions to your calendar</p>
              </div>
              <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>

            <a
              href="https://calendar.apple.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#1a2a3a]/50 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.4 2.2H5.6C3.58 2.2 2 3.78 2 5.8V18.4C2 20.42 3.58 22 5.6 22H18.4C20.42 22 22 20.42 22 18.4V5.8C22 3.78 20.42 2.2 18.4 2.2ZM12 19c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3Z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Apple Calendar</p>
                <p className="text-xs text-gray-500">Sync with your iCloud calendar</p>
              </div>
              <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          </div>
        </section>

        {/* Subscribe */}
        <section>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 px-1">
            Subscribe
          </p>
          <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-400 mb-3">
              Get iCal URL for any calendar app
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-[#f5a623] bg-[#1a2a3a] rounded-lg px-3 py-2 truncate">
                webcal://thezao.com/api/calendar/feed
              </code>
              <button
                onClick={() => navigator.clipboard?.writeText('webcal://thezao.com/api/calendar/feed')}
                className="flex-shrink-0 px-3 py-2 bg-[#1a2a3a] rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
