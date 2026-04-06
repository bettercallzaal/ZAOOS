'use client';

import { NotificationBell } from '@/components/navigation/NotificationBell';
import { PageHeader } from '@/components/navigation/PageHeader';

const NEXUS_LINKS = [
  {
    href: '/community',
    title: 'Community Members',
    description: 'Join as a creator and connect with the ZAO network',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    href: '/calendar',
    title: 'Calendar',
    description: 'Upcoming events, releases, and community activations',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    href: '/zao-leaderboard',
    title: 'ZAO Leaderboard',
    description: 'See who is leading the Respect rankings',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
      </svg>
    ),
  },
];

export default function NexusPage() {
  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-36">
      <PageHeader
        title="ZAO NEXUS"
        subtitle="Community resources"
        rightAction={<div className="md:hidden"><NotificationBell /></div>}
      />

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="space-y-4">
          {NEXUS_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="flex items-center gap-4 bg-[#0d1b2a] rounded-xl p-5 border border-white/[0.08] hover:border-[#f5a623]/30 transition-colors group"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#1a2a3a] flex items-center justify-center text-[#f5a623] group-hover:bg-[#f5a623]/10 transition-colors">
                {link.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-white group-hover:text-[#f5a623] transition-colors">
                  {link.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{link.description}</p>
              </div>
              <svg
                className="w-5 h-5 text-gray-600 group-hover:text-[#f5a623] group-hover:translate-x-0.5 transition-all flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
