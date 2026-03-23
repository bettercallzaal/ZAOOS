'use client';

import { useEffect, useState } from 'react';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  totalActiveDays: number;
  streakFreezesAvailable: number;
  isActiveToday: boolean;
  isAtRisk: boolean;
}

export default function StreakBadge() {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStreak() {
      try {
        const res = await fetch('/api/streaks');
        if (!res.ok) return;
        const data = await res.json();
        setStreak(data.streak);
      } catch {
        // Silently fail — badge is non-critical UI
      } finally {
        setLoading(false);
      }
    }
    fetchStreak();
  }, []);

  if (loading || !streak) {
    return null;
  }

  const isActive = streak.isActiveToday;
  const isAtRisk = streak.isAtRisk && !isActive;
  const displayCount = streak.currentStreak;

  // Don't render if no streak
  if (displayCount === 0 && !isAtRisk) {
    return null;
  }

  return (
    <div
      className="flex items-center gap-1 rounded-full px-2 py-1"
      title={
        isActive
          ? `${displayCount}-day streak! Longest: ${streak.longestStreak}`
          : isAtRisk
            ? `${displayCount}-day streak at risk! Log activity today to keep it.`
            : `Start a new streak by being active today!`
      }
    >
      {/* Flame icon */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={
          isActive
            ? 'text-[#f5a623] drop-shadow-[0_0_4px_rgba(245,166,35,0.5)]'
            : isAtRisk
              ? 'text-[#f5a623] animate-pulse'
              : 'text-gray-500'
        }
      >
        <path
          d="M12 2C12 2 4 8.5 4 14.5C4 18.64 7.58 22 12 22C16.42 22 20 18.64 20 14.5C20 8.5 12 2 12 2ZM12 19.5C9.24 19.5 7 17.26 7 14.5C7 11.28 10 7.5 12 5.34C14 7.5 17 11.28 17 14.5C17 17.26 14.76 19.5 12 19.5ZM10.5 14.5C10.5 15.33 11.17 16 12 16C12.83 16 13.5 15.33 13.5 14.5C13.5 13.06 12 11.5 12 11.5C12 11.5 10.5 13.06 10.5 14.5Z"
          fill="currentColor"
        />
      </svg>

      {/* Count */}
      <span
        className={`text-xs font-bold tabular-nums ${
          isActive
            ? 'text-[#f5a623]'
            : isAtRisk
              ? 'text-[#f5a623] animate-pulse'
              : 'text-gray-500'
        }`}
      >
        {displayCount}
      </span>
    </div>
  );
}
