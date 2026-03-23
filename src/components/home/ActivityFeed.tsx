'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { timeAgo } from '@/lib/format/timeAgo';

type ActivityType = 'cast' | 'song' | 'vote' | 'member' | 'proposal' | 'respect' | 'fractal' | 'battle';

interface ActivityItem {
  id: string;
  type: ActivityType;
  actor: { fid: number; displayName: string; pfpUrl: string | null };
  description: string;
  timestamp: string;
  link?: string;
}

const FILTERS = ['All', 'Music', 'Governance', 'Social', 'Fractals', 'WaveWarZ'] as const;
type Filter = (typeof FILTERS)[number];

const FILTER_TO_PARAM: Record<Filter, string> = {
  All: 'all',
  Music: 'music',
  Governance: 'governance',
  Social: 'social',
  Fractals: 'fractals',
  WaveWarZ: 'wavewarz',
};

/** SVG icon per activity type */
function ActivityIcon({ type }: { type: ActivityType }) {
  const base = 'w-4 h-4 flex-shrink-0';

  switch (type) {
    case 'cast':
      // Chat bubble
      return (
        <svg className={base} viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zm-4 0H9v2h2V9z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'vote':
      // Check/vote icon
      return (
        <svg className={base} viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'song':
      // Music note
      return (
        <svg className={base} viewBox="0 0 20 20" fill="currentColor">
          <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
        </svg>
      );
    case 'member':
      // User plus
      return (
        <svg className={base} viewBox="0 0 20 20" fill="currentColor">
          <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
        </svg>
      );
    case 'proposal':
      // Document
      return (
        <svg className={base} viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'fractal':
      // Star
      return (
        <svg className={base} viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    case 'respect':
      return (
        <svg className={base} viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    case 'battle':
      // Crossed swords
      return (
        <svg className={base} viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
            clipRule="evenodd"
          />
        </svg>
      );
    default:
      return (
        <svg className={base} viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      );
  }
}

/** Color accent per type */
function iconColor(type: ActivityType): string {
  switch (type) {
    case 'cast':
      return 'text-blue-400';
    case 'song':
      return 'text-pink-400';
    case 'vote':
      return 'text-green-400';
    case 'member':
      return 'text-[#f5a623]';
    case 'proposal':
      return 'text-purple-400';
    case 'fractal':
      return 'text-yellow-400';
    case 'respect':
      return 'text-yellow-400';
    case 'battle':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
}

/** Badge label per type */
function typeBadge(type: ActivityType): string {
  switch (type) {
    case 'cast':
      return 'Chat';
    case 'song':
      return 'Music';
    case 'vote':
      return 'Vote';
    case 'member':
      return 'New Member';
    case 'proposal':
      return 'Proposal';
    case 'fractal':
      return 'Fractal';
    case 'respect':
      return 'Respect';
    case 'battle':
      return 'WaveWarZ';
    default:
      return '';
  }
}

export function ActivityFeed() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      setLoading(true);
      setError(false);
    });

    const filterParam = FILTER_TO_PARAM[activeFilter];
    const url = filterParam === 'all'
      ? '/api/activity/feed'
      : `/api/activity/feed?filter=${filterParam}`;

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) { setItems([]); return; }
        return res.json();
      })
      .then((data) => {
        if (data) setItems(data.activities ?? []);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(true);
        setItems([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [activeFilter, retryCount]);

  function handleItemClick(item: ActivityItem) {
    if (item.link) {
      router.push(item.link);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
        <span className="text-[10px] text-gray-600">
          {!loading && items.length > 0 ? `${items.length} items` : ''}
        </span>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeFilter === filter
                ? 'bg-[#f5a623] text-black'
                : 'bg-gray-800/50 text-gray-500 hover:text-gray-300'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] animate-pulse"
            >
              <div className="w-8 h-8 rounded-full bg-gray-800 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-800 rounded w-3/4" />
                <div className="h-2.5 bg-gray-800 rounded w-full" />
                <div className="h-2 bg-gray-800 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-xs text-gray-600">Could not load activity</p>
          <button
            onClick={() => setRetryCount((c) => c + 1)}
            className="text-xs text-[#f5a623] hover:text-[#ffd700] mt-2 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-xs text-gray-600">No recent activity</p>
          <p className="text-[10px] text-gray-700 mt-1">
            Posts, votes, music submissions, and more will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 20).map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="w-full text-left flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-[#f5a623]/20 hover:bg-[#f5a623]/[0.03] transition-all duration-200 group"
            >
              {/* Avatar + type icon overlay */}
              <div className="relative flex-shrink-0">
                {item.actor.pfpUrl ? (
                  <Image
                    src={item.actor.pfpUrl}
                    alt={`${item.actor.displayName} avatar`}
                    width={36}
                    height={36}
                    className="rounded-full"
                    unoptimized
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500">
                    {item.actor.displayName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                {/* Type icon badge — bottom-right of avatar */}
                <div
                  className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#0a1628] border border-gray-800 flex items-center justify-center ${iconColor(item.type)}`}
                >
                  <ActivityIcon type={item.type} />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-white truncate group-hover:text-[#f5a623] transition-colors">
                    {item.actor.displayName}
                  </span>
                  <span
                    className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-white/[0.04] ${iconColor(item.type)}`}
                  >
                    {typeBadge(item.type)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-snug line-clamp-2">
                  {item.description}
                </p>
                <p className="text-[10px] text-gray-600 mt-1">{timeAgo(item.timestamp)}</p>
              </div>

              {/* Chevron */}
              {item.link && (
                <svg
                  className="w-4 h-4 text-gray-700 group-hover:text-[#f5a623] transition-colors flex-shrink-0 mt-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
