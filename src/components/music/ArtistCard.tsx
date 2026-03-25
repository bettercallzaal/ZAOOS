'use client';

import { useState, useEffect } from 'react';

interface ArtistTrack {
  id: string;
  url: string;
  title: string;
  artist: string | null;
  artworkUrl: string | null;
  platform: string;
  duration: number;
  playCount: number;
}

interface ArtistData {
  artist: string;
  trackCount: number;
  totalPlays: number;
  totalLikes: number;
  tracks: ArtistTrack[];
}

interface ArtistCardProps {
  artistName: string;
  className?: string;
}

export function ArtistCard({ artistName, className = '' }: ArtistCardProps) {
  const [data, setData] = useState<ArtistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!artistName) return;
    setLoading(true);
    fetch(`/api/music/artists?artist=${encodeURIComponent(artistName)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [artistName]);

  if (loading) {
    return (
      <div className={`animate-pulse bg-white/5 rounded-xl p-4 ${className}`}>
        <div className="h-4 bg-white/10 rounded w-1/2 mb-3" />
        <div className="h-3 bg-white/10 rounded w-3/4" />
      </div>
    );
  }

  if (!data || data.trackCount === 0) return null;

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-white/5 border border-white/10 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Artist icon */}
          <div className="w-9 h-9 rounded-full bg-[#f5a623]/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-[#f5a623]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <div className="text-left min-w-0">
            <p className="text-sm font-semibold text-white truncate">{data.artist}</p>
            <div className="flex items-center gap-3 text-[11px] text-gray-400">
              <span>{data.trackCount} track{data.trackCount !== 1 ? 's' : ''}</span>
              <span className="flex items-center gap-0.5">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
                {data.totalPlays.toLocaleString()} plays
              </span>
              <span className="flex items-center gap-0.5">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                {data.totalLikes}
              </span>
            </div>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Track list (expandable) */}
      {expanded && (
        <div className="border-t border-white/5">
          {data.tracks.map((track, i) => (
            <a
              key={track.id}
              href={track.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors"
            >
              <span className="text-[10px] text-gray-600 w-4 text-right flex-shrink-0 tabular-nums">
                {i + 1}
              </span>
              {track.artworkUrl ? (
                <img
                  src={track.artworkUrl}
                  alt=""
                  className="w-8 h-8 rounded bg-gray-800 object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-white truncate">{track.title}</p>
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  <span>{track.playCount.toLocaleString()} plays</span>
                  {track.duration > 0 && <span>{formatDuration(track.duration)}</span>}
                  <span className="capitalize">{track.platform === 'soundxyz' ? 'Sound.xyz' : track.platform}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
