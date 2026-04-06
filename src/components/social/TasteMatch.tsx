'use client';

import { useState, useEffect } from 'react';

interface SharedTrack {
  id: string;
  title: string;
  artist: string | null;
  url: string;
  artworkUrl: string | null;
}

interface TasteMatchData {
  matchPercent: number;
  sharedTracks: SharedTrack[];
  totalYours: number;
  totalTheirs: number;
  sharedCount: number;
}

interface TasteMatchProps {
  targetFid: number;
  targetUsername: string;
}

function matchColor(pct: number): string {
  if (pct >= 70) return 'text-[#ffd700]';
  if (pct >= 40) return 'text-[#f5a623]';
  return 'text-[#a0aec0]';
}

export function TasteMatch({ targetFid, targetUsername }: TasteMatchProps) {
  const [data, setData] = useState<TasteMatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!targetFid) return;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    fetch(`/api/social/taste-match?targetFid=${targetFid}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!controller.signal.aborted) setData(d); })
      .catch(() => {
        if (controller.signal.aborted) return;
        setError('Couldn\'t calculate taste match');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); };
  }, [targetFid]);

  if (loading) {
    return (
      <div className="p-3 rounded-xl bg-white/5 border border-white/[0.08] animate-pulse">
        <div className="h-4 bg-white/10 rounded w-2/3" />
      </div>
    );
  }

  if (error) return (
    <div className="p-3 rounded-xl bg-white/5 border border-white/[0.08]">
      <p className="text-red-400 text-sm">{error}</p>
    </div>
  );
  if (!data || (data.totalYours === 0 && data.totalTheirs === 0)) return null;

  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/[0.08]">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10">
          <span className={`text-lg font-bold ${matchColor(data.matchPercent)}`}>
            {data.matchPercent}%
          </span>
        </div>
        <div>
          <p className="text-white text-sm font-medium">
            Music taste match with @{targetUsername}
          </p>
          <p className="text-gray-500 text-xs">
            {data.sharedCount} shared {data.sharedCount === 1 ? 'track' : 'tracks'}
            {' '}&middot; {data.totalYours} yours &middot; {data.totalTheirs} theirs
          </p>
        </div>
      </div>

      {data.sharedTracks.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">
            Shared favorites
          </p>
          {data.sharedTracks.map((track) => (
            <a
              key={track.id}
              href={track.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors group"
            >
              {track.artworkUrl ? (
                <img
                  src={track.artworkUrl}
                  alt=""
                  className="w-8 h-8 rounded object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-gray-500">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm truncate group-hover:text-[#f5a623] transition-colors">
                  {track.title}
                </p>
                {track.artist && (
                  <p className="text-gray-500 text-xs truncate">{track.artist}</p>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
