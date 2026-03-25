'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Curator {
  fid: number;
  username: string;
  displayName: string | null;
  pfpUrl: string | null;
  totalLikes: number;
  trackCount: number;
}

export function TopCurators() {
  const [curators, setCurators] = useState<Curator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/music/curators', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json();
      })
      .then((data) => setCurators(data.curators || []))
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const rankColors: Record<number, string> = {
    1: 'text-[#f5a623]', // gold
    2: 'text-gray-300',   // silver
    3: 'text-amber-600',  // bronze
  };

  const rankBgColors: Record<number, string> = {
    1: 'bg-[#f5a623]/10 border-[#f5a623]/30',
    2: 'bg-gray-300/5 border-gray-300/20',
    3: 'bg-amber-600/10 border-amber-600/20',
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-[#f5a623]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        Top Curators
      </h2>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 animate-pulse">
              <div className="w-6 h-4 bg-white/10 rounded" />
              <div className="w-8 h-8 rounded-full bg-white/10" />
              <div className="flex-1 space-y-1.5">
                <div className="w-24 h-3.5 bg-white/10 rounded" />
                <div className="w-32 h-2.5 bg-white/10 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : curators.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
          </svg>
          <p className="text-sm">No curators yet — share music to earn your spot</p>
        </div>
      ) : (
        <div className="space-y-2">
          {curators.map((curator, index) => {
            const rank = index + 1;
            const isTop3 = rank <= 3;
            const borderClass = isTop3
              ? rankBgColors[rank]
              : 'bg-white/[0.02] border-transparent';

            return (
              <div
                key={curator.fid}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-white/5 ${borderClass}`}
              >
                {/* Rank */}
                <span
                  className={`w-6 text-center font-bold text-sm tabular-nums ${
                    isTop3 ? rankColors[rank] : 'text-gray-500'
                  }`}
                >
                  #{rank}
                </span>

                {/* Avatar */}
                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                  {curator.pfpUrl ? (
                    <Image
                      src={curator.pfpUrl}
                      alt={curator.displayName || curator.username}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-medium">
                      {(curator.displayName || curator.username || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Name + stats */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isTop3 ? 'text-white' : 'text-gray-300'}`}>
                    {curator.displayName || curator.username}
                  </p>
                  <p className="text-xs text-gray-500">
                    {curator.totalLikes} like{curator.totalLikes === 1 ? '' : 's'} on{' '}
                    {curator.trackCount} track{curator.trackCount === 1 ? '' : 's'}
                  </p>
                </div>

                {/* Like count badge for top 3 */}
                {isTop3 && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${rankBgColors[rank]} ${rankColors[rank]}`}>
                    {curator.totalLikes}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
