'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ActivityItem {
  id: string;
  type: 'music' | 'governance' | 'social' | 'system';
  actor_display_name: string;
  actor_pfp_url: string | null;
  action_text: string;
  created_at: string;
  href?: string;
}

const FILTERS = ['All', 'Music', 'Governance', 'Social'] as const;
type Filter = (typeof FILTERS)[number];

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function ActivityFeed() {
  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);

    const filterParam = activeFilter === 'All' ? '' : `?type=${activeFilter.toLowerCase()}`;
    fetch(`/api/activity/feed${filterParam}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) { setItems([]); return; }
        return res.json();
      })
      .then((data) => {
        if (data) setItems(data.items ?? data.activities ?? []);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(true);
        setItems([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [activeFilter, retryCount]);

  return (
    <div>
      {/* Header + filters */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
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
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-800" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-800 rounded w-3/4" />
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
            Posts, votes, and music submissions will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {items.slice(0, 20).map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-white/[0.02] transition-colors"
            >
              {/* Avatar */}
              {item.actor_pfp_url ? (
                <Image
                  src={item.actor_pfp_url}
                  alt={`${item.actor_display_name} avatar`}
                  width={32}
                  height={32}
                  className="rounded-full flex-shrink-0"
                  unoptimized
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-800 flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-500">
                  {item.actor_display_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}

              {/* Action text */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-300 leading-snug">
                  <span className="font-semibold text-white">{item.actor_display_name}</span>{' '}
                  {item.action_text}
                </p>
                <p className="text-[10px] text-gray-600 mt-0.5">{timeAgo(item.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
