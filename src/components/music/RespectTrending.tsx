'use client';

import { useState, useEffect } from 'react';
import { usePlayer } from '@/providers/audio';
import { ArtworkImage } from '@/components/music/ArtworkImage';
import type { TrackType } from '@/types/music';

interface WeightedTrack {
  song: {
    id: string;
    url: string;
    title: string;
    artist: string | null;
    artworkUrl: string | null;
    platform: string;
  };
  weightedScore: number;
  likeCount: number;
  topCurators: string[];
}

export function RespectTrending() {
  const [tracks, setTracks] = useState<WeightedTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const player = usePlayer();

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/music/trending-weighted', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json();
      })
      .then((data) => {
        setTracks(data.tracks || []);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(true);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const handlePlay = (track: WeightedTrack) => {
    player.play({
      id: track.song.id,
      trackName: track.song.title,
      artistName: track.song.artist || 'Unknown Artist',
      artworkUrl: track.song.artworkUrl || '',
      streamUrl: track.song.platform === 'audius' ? `https://api.audius.co/v1/tracks/${track.song.id}/stream?app_name=ZAO-OS` : undefined,
      url: track.song.url,
      type: track.song.platform as TrackType,
      feedId: `respect-trending-${track.song.id}`,
    });
  };

  if (loading) {
    return (
      <div className="mt-8">
        <div className="h-5 bg-gray-800 rounded w-40 mb-4 animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-12 h-12 rounded-lg bg-gray-800 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="h-3.5 bg-gray-800 rounded w-3/4 mb-1.5" />
                <div className="h-3 bg-gray-800/60 rounded w-1/2" />
              </div>
              <div className="w-14 h-6 rounded-full bg-gray-800" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || tracks.length === 0) {
    return (
      <div className="mt-8">
        <h2 className="text-lg font-bold text-white mb-4">Trending in ZAO</h2>
        <div className="text-center py-8 rounded-xl bg-[#0d1b2a] border border-gray-800">
          <svg
            className="w-8 h-8 text-[#f5a623]/30 mx-auto mb-2"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
            />
          </svg>
          <p className="text-sm text-gray-400">No community-curated tracks yet</p>
          <p className="text-xs text-gray-600 mt-1">
            Like songs to surface them here — high-Respect members&apos; taste weighs more
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white">Trending in ZAO</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Curated by taste authority — weighted by Respect
        </p>
      </div>

      <div className="space-y-2">
        {tracks.map((track, index) => {
          const isThisTrack = player.metadata?.feedId === `respect-trending-${track.song.id}`;
          const isThisPlaying = isThisTrack && player.isPlaying;

          return (
            <button
              key={track.song.id}
              onClick={() => handlePlay(track)}
              className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors ${
                isThisTrack
                  ? 'bg-[#f5a623]/10 border border-[#f5a623]/20'
                  : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              {/* Rank number */}
              <span className="w-5 text-center text-xs font-mono text-gray-500 flex-shrink-0">
                {index + 1}
              </span>

              {/* Artwork */}
              <div
                className={`w-12 h-12 rounded-lg border overflow-hidden relative flex-shrink-0 ${
                  isThisTrack ? 'border-[#f5a623]/40' : 'border-gray-800'
                }`}
              >
                <ArtworkImage
                  src={track.song.artworkUrl}
                  alt={track.song.title}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
                {isThisPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="flex items-end gap-px">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-[2px] bg-[#f5a623] rounded-full animate-bounce"
                          style={{
                            height: `${4 + i * 2}px`,
                            animationDelay: `${i * 0.15}s`,
                            animationDuration: '0.6s',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    isThisTrack ? 'text-[#f5a623]' : 'text-white'
                  }`}
                >
                  {track.song.title}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {track.song.artist || 'Unknown Artist'}
                </p>
                {track.topCurators.length > 0 && (
                  <p className="text-[10px] text-gray-600 truncate mt-0.5">
                    Liked by {track.topCurators.join(', ')}
                  </p>
                )}
              </div>

              {/* Weighted score badge */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f5a623]/10 border border-[#f5a623]/20">
                  <svg
                    className="w-3 h-3 text-[#f5a623]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                    />
                  </svg>
                  <span className="text-xs font-bold text-[#f5a623]">
                    {track.weightedScore}
                  </span>
                </span>
                <span className="text-[10px] text-gray-600">
                  {track.likeCount} {track.likeCount === 1 ? 'like' : 'likes'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
