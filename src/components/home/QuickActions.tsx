'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface QuickAction {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface StreakData {
  currentStreak: number;
  isActiveToday: boolean;
  isAtRisk: boolean;
}

const actions: QuickAction[] = [
  {
    label: 'Post',
    href: '/chat',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
  },
  {
    label: 'Submit Song',
    href: '/music',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
      </svg>
    ),
  },
  {
    label: 'Start Call',
    href: '/calls',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
      </svg>
    ),
  },
  {
    label: 'Vote',
    href: '/fractals',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
  },
];

function DailyActivityCard() {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchStreak() {
      try {
        const res = await fetch('/api/streaks');
        if (!res.ok) return;
        const data = await res.json();
        setStreak(data.streak);
      } catch {
        // Non-critical UI
      }
    }
    fetchStreak();
  }, []);

  if (!streak) return null;

  const isActive = streak.isActiveToday;
  const isAtRisk = streak.isAtRisk && !isActive;

  return (
    <div className="rounded-xl border border-white/[0.08] bg-gradient-to-br from-[#0d1b2a] to-[#1a2a3a] p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          {/* Flame icon */}
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isActive
                ? 'bg-[#f5a623]/15'
                : isAtRisk
                  ? 'bg-orange-500/15'
                  : 'bg-gray-800'
            }`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={
                isActive
                  ? 'text-[#f5a623] drop-shadow-[0_0_4px_rgba(245,166,35,0.5)]'
                  : isAtRisk
                    ? 'text-orange-400 animate-pulse'
                    : 'text-gray-500'
              }
            >
              <path
                d="M12 2C12 2 4 8.5 4 14.5C4 18.64 7.58 22 12 22C16.42 22 20 18.64 20 14.5C20 8.5 12 2 12 2ZM12 19.5C9.24 19.5 7 17.26 7 14.5C7 11.28 10 7.5 12 5.34C14 7.5 17 11.28 17 14.5C17 17.26 14.76 19.5 12 19.5ZM10.5 14.5C10.5 15.33 11.17 16 12 16C12.83 16 13.5 15.33 13.5 14.5C13.5 13.06 12 11.5 12 11.5C12 11.5 10.5 13.06 10.5 14.5Z"
                fill="currentColor"
              />
            </svg>
          </div>

          <div className="text-left">
            <p className="text-sm font-semibold text-white">
              {streak.currentStreak > 0
                ? `${streak.currentStreak}-day streak`
                : 'Start a streak!'}
            </p>
            <p className="text-[11px] text-gray-500">
              {isActive
                ? 'Active today — keep it up!'
                : isAtRisk
                  ? 'Keep your streak alive!'
                  : 'Be active today to start'}
            </p>
          </div>
        </div>

        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-white/[0.08] space-y-2">
          <p className="text-xs text-gray-400">Activities that count toward your streak:</p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/chat"
              className="text-xs px-3 py-1.5 rounded-full bg-[#f5a623]/10 text-[#f5a623] hover:bg-[#f5a623]/20 transition-colors"
            >
              Chat
            </Link>
            <Link
              href="/fractals"
              className="text-xs px-3 py-1.5 rounded-full bg-[#f5a623]/10 text-[#f5a623] hover:bg-[#f5a623]/20 transition-colors"
            >
              Vote
            </Link>
            <Link
              href="/music"
              className="text-xs px-3 py-1.5 rounded-full bg-[#f5a623]/10 text-[#f5a623] hover:bg-[#f5a623]/20 transition-colors"
            >
              Submit Music
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function QuickActions() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-around px-2">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-14 h-14 rounded-full border border-white/[0.08] flex items-center justify-center text-gray-400 group-hover:border-[#f5a623]/50 group-hover:text-[#f5a623] transition-all">
              {action.icon}
            </div>
            <span className="text-[10px] text-gray-500 group-hover:text-gray-300 transition-colors">
              {action.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Daily Activity streak card */}
      <DailyActivityCard />
    </div>
  );
}
