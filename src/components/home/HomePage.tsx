'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { communityConfig } from '@/../community.config';
import { NotificationBell } from '@/components/navigation/NotificationBell';
import StreakBadge from '@/components/streaks/StreakBadge';
import { NowPlayingHero } from '@/components/home/NowPlayingHero';
import { QuickActions } from '@/components/home/QuickActions';
import { PillarCard } from '@/components/home/PillarCard';
import { ActivityFeed } from '@/components/home/ActivityFeed';

export function HomePage() {
  const { user } = useAuth();
  const loginRecorded = useRef(false);

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
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-20 md:pt-12">
      {/* Header */}
      <header className="px-4 py-3 flex items-center justify-between">
        <h1
          className="text-lg font-bold tracking-wide bg-gradient-to-r from-[#f5a623] to-[#ffd700] bg-clip-text text-transparent"
        >
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

        {/* Quick Actions */}
        <QuickActions />

        {/* Pillar Cards Grid */}
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
          <PillarCard
            label="Chat"
            href="/chat"
            icon={
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            }
          />
          <PillarCard
            label="Music"
            href="/music"
            icon={
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
              </svg>
            }
          />
          <PillarCard
            label="Governance"
            href="/fractals"
            icon={
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            }
          />
          <PillarCard
            label="Social"
            href="/social"
            icon={
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            }
          />
          <PillarCard
            label="Ecosystem"
            href="/ecosystem"
            icon={
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 003 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
            }
          />
          <PillarCard
            label="Tools"
            href="/tools"
            icon={
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.049.58.025 1.193-.14 1.743" />
              </svg>
            }
          />
        </div>

        {/* Activity Feed */}
        <ActivityFeed />
      </div>
    </div>
  );
}
