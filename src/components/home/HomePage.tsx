'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { communityConfig } from '@/../community.config';
import { NotificationBell } from '@/components/navigation/NotificationBell';
import StreakBadge from '@/components/streaks/StreakBadge';
import { NowPlayingHero } from '@/components/home/NowPlayingHero';
import { ActivityFeed } from '@/components/home/ActivityFeed';

/* ── Navigation Data ─────────────────────────────────────────────── */

interface NavItem {
  label: string;
  href: string;
  description: string;
  icon: React.ReactNode;
}

const coreNav: NavItem[] = [
  {
    label: 'Chat',
    href: '/chat',
    description: 'Community feed & cross-post',
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
  },
  {
    label: 'Music',
    href: '/music',
    description: 'Radio, discover, submit',
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
      </svg>
    ),
  },
  {
    label: 'Governance',
    href: '/fractals',
    description: 'Fractals, proposals, voting',
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
      </svg>
    ),
  },
  {
    label: 'Social',
    href: '/social',
    description: 'Social graph & connections',
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
];

const createNav: NavItem[] = [
  {
    label: 'Spaces',
    href: '/spaces',
    description: 'Live audio rooms',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    label: 'Calls',
    href: '/calls',
    description: 'Voice & video',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
      </svg>
    ),
  },
  {
    label: 'Contribute',
    href: '/contribute',
    description: 'Tasks & bounties',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
  },
  {
    label: 'Library',
    href: '/library',
    description: 'Research & docs',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
];

const ecosystemNav: NavItem[] = [
  {
    label: 'Ecosystem',
    href: '/ecosystem',
    description: 'Partner apps & tools',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 003 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
  },
  {
    label: 'WaveWarZ',
    href: '/wavewarz',
    description: 'Music battles',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    label: 'Respect',
    href: '/respect',
    description: 'Leaderboard & tokens',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-3.52 1.022 6.023 6.023 0 01-3.52-1.022" />
      </svg>
    ),
  },
  {
    label: 'Members',
    href: '/members',
    description: 'Community members',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
];

interface SettingsItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const settingsNav: SettingsItem[] = [
  {
    label: 'Settings',
    href: '/settings',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.38.138.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: 'Notifications',
    href: '/notifications',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    ),
  },
  {
    label: 'Tools',
    href: '/tools',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.049.58.025 1.193-.14 1.743" />
      </svg>
    ),
  },
];

/* ── Section Components ──────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 px-1 mb-2">
      {children}
    </h2>
  );
}

function CoreCard({ item }: { item: NavItem }) {
  return (
    <Link
      href={item.href}
      className="group flex items-center gap-4 rounded-2xl border border-[#1a2a44] bg-gradient-to-br from-[#0d1b2a] to-[#111f33] p-4 hover:border-[#f5a623]/40 hover:shadow-[0_0_20px_rgba(245,166,35,0.06)] transition-all"
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#f5a623]/10 flex items-center justify-center text-[#f5a623]/70 group-hover:text-[#f5a623] group-hover:bg-[#f5a623]/15 transition-colors">
        {item.icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white group-hover:text-[#f5a623] transition-colors">
          {item.label}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{item.description}</p>
      </div>
      <svg
        className="w-4 h-4 text-gray-600 ml-auto flex-shrink-0 group-hover:text-[#f5a623]/60 transition-colors"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </Link>
  );
}

function MediumCard({ item }: { item: NavItem }) {
  return (
    <Link
      href={item.href}
      className="group flex items-center gap-3 rounded-xl border border-[#1a2a44] bg-[#0d1b2a] p-3.5 hover:border-[#f5a623]/30 hover:bg-[#0f1f30] transition-all"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-800/60 flex items-center justify-center text-gray-400 group-hover:text-[#f5a623] group-hover:bg-[#f5a623]/10 transition-colors">
        {item.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-gray-200 group-hover:text-white transition-colors">
          {item.label}
        </p>
        <p className="text-[11px] text-gray-500 truncate">{item.description}</p>
      </div>
    </Link>
  );
}

function SettingsRow({ item }: { item: SettingsItem }) {
  return (
    <Link
      href={item.href}
      className="group flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-[#1a2a44]/50 transition-colors"
    >
      <div className="text-gray-500 group-hover:text-gray-300 transition-colors">
        {item.icon}
      </div>
      <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">
        {item.label}
      </span>
      <svg
        className="w-3.5 h-3.5 text-gray-700 ml-auto group-hover:text-gray-500 transition-colors"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </Link>
  );
}

/* ── Main Component ──────────────────────────────────────────────── */

export function HomePage() {
  const { user } = useAuth();
  const loginRecorded = useRef(false);
  const [activityOpen, setActivityOpen] = useState(false);

  // Fire-and-forget: record daily login for streak tracking
  useEffect(() => {
    if (!user || loginRecorded.current) return;
    loginRecorded.current = true;
    fetch('/api/streaks/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activity_type: 'login' }),
    }).catch(() => {
      // Non-critical — silently ignore failures
    });
  }, [user]);

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-36 md:pt-12">
      {/* Header */}
      <header className="px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-wide bg-gradient-to-r from-[#f5a623] to-[#ffd700] bg-clip-text text-transparent">
          {communityConfig.name}
        </h1>
        <div className="flex items-center gap-3">
          <StreakBadge />
          <NotificationBell />
          {user?.pfpUrl ? (
            <Image
              src={user.pfpUrl}
              alt={user.displayName || 'Profile'}
              width={28}
              height={28}
              className="rounded-full"
              unoptimized
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500">
              {user?.displayName?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-lg mx-auto px-4 space-y-6 mt-2">
        {/* Now Playing Hero */}
        <NowPlayingHero />

        {/* ── Core ─────────────────────────────────────── */}
        <section>
          <SectionLabel>Core</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {coreNav.map((item) => (
              <CoreCard key={item.label} item={item} />
            ))}
          </div>
        </section>

        {/* ── Create & Contribute ──────────────────────── */}
        <section>
          <SectionLabel>Create &amp; Contribute</SectionLabel>
          <div className="grid grid-cols-2 gap-2.5">
            {createNav.map((item) => (
              <MediumCard key={item.label} item={item} />
            ))}
          </div>
        </section>

        {/* ── Ecosystem ────────────────────────────────── */}
        <section>
          <SectionLabel>Ecosystem</SectionLabel>
          <div className="grid grid-cols-2 gap-2.5">
            {ecosystemNav.map((item) => (
              <MediumCard key={item.label} item={item} />
            ))}
          </div>
        </section>

        {/* ── Settings & Admin ─────────────────────────── */}
        <section>
          <SectionLabel>Settings &amp; Admin</SectionLabel>
          <div className="rounded-xl border border-[#1a2a44] bg-[#0d1b2a] divide-y divide-[#1a2a44]">
            {settingsNav.map((item) => (
              <SettingsRow key={item.label} item={item} />
            ))}
          </div>
        </section>

        {/* ── Activity Feed (collapsible) ──────────────── */}
        <section>
          <button
            onClick={() => setActivityOpen(!activityOpen)}
            className="w-full flex items-center justify-between px-1 mb-2 group"
          >
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 group-hover:text-gray-400 transition-colors">
              Recent Activity
            </span>
            <svg
              className={`w-4 h-4 text-gray-600 transition-transform ${activityOpen ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {activityOpen && <ActivityFeed />}
        </section>
      </div>
    </div>
  );
}
