'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { timeAgo } from '@/lib/format/timeAgo';

interface ActivityItem {
  id: string;
  type: string;
  actor: { fid: number; displayName: string; pfpUrl: string | null };
  description: string;
  timestamp: string;
  link?: string;
}

const TYPE_COLORS: Record<string, string> = {
  cast: 'text-blue-400',
  song: 'text-pink-400',
  vote: 'text-green-400',
  member: 'text-[#f5a623]',
  proposal: 'text-purple-400',
  fractal: 'text-yellow-400',
  respect: 'text-yellow-400',
  battle: 'text-red-400',
};

export function CommunityActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeed = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/activity/feed?limit=10', { signal });
      if (!res.ok) return;
      const data = await res.json();
      if (!signal?.aborted) {
        setItems(data.activities ?? []);
      }
    } catch {
      // ignore abort / network errors
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchFeed(controller.signal);

    const interval = setInterval(() => {
      fetchFeed();
    }, 60_000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [fetchFeed]);

  if (loading) {
    return (
      <div className="px-4 py-3 space-y-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Activity</h3>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2.5 animate-pulse">
            <div className="w-7 h-7 rounded-full bg-gray-800 flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-3 bg-gray-800 rounded w-3/4" />
              <div className="h-2 bg-gray-800 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="px-4 py-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Activity</h3>
      <div className="space-y-2.5">
        {items.map((item) => {
          const color = TYPE_COLORS[item.type] || 'text-gray-400';
          const content = (
            <div className="flex items-start gap-2.5 group">
              <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
                {item.actor.pfpUrl ? (
                  <Image src={item.actor.pfpUrl} alt="" width={28} height={28} className="rounded-full" unoptimized />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center text-[9px] font-bold text-gray-500">
                    {item.actor.displayName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-300 leading-snug">
                  <span className={`font-semibold ${color} group-hover:text-[#f5a623] transition-colors`}>
                    {item.actor.displayName}
                  </span>{' '}
                  <span className="text-gray-400">{item.description}</span>
                </p>
                <p className="text-[10px] text-gray-600 mt-0.5">{timeAgo(item.timestamp)}</p>
              </div>
            </div>
          );

          return item.link ? (
            <Link key={item.id} href={item.link} className="block hover:bg-white/[0.02] rounded-lg -mx-2 px-2 py-1 transition-colors">
              {content}
            </Link>
          ) : (
            <div key={item.id} className="py-1">{content}</div>
          );
        })}
      </div>
    </div>
  );
}
