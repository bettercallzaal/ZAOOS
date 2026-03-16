'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { TrackMetadata, TrackType } from '@/types/music';
import { usePlayer } from '@/providers/audio';
import { formatDuration } from '@/lib/music/formatDuration';

interface MusicEmbedProps {
  url: string;
  castHash: string;
}

const PLATFORM_COLORS: Record<TrackType, { bg: string; text: string; dot: string }> = {
  spotify: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400' },
  soundcloud: { bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-400' },
  soundxyz: { bg: 'bg-purple-500/10', text: 'text-purple-400', dot: 'bg-purple-400' },
  youtube: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  audius: { bg: 'bg-purple-500/10', text: 'text-purple-400', dot: 'bg-purple-400' },
  applemusic: { bg: 'bg-pink-500/10', text: 'text-pink-400', dot: 'bg-pink-400' },
  tidal: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', dot: 'bg-cyan-400' },
  bandcamp: { bg: 'bg-sky-500/10', text: 'text-sky-400', dot: 'bg-sky-400' },
  audio: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
};

const PLATFORM_LABELS: Record<TrackType, string> = {
  spotify: 'Spotify',
  soundcloud: 'SoundCloud',
  soundxyz: 'Sound.xyz',
  youtube: 'YouTube',
  audius: 'Audius',
  applemusic: 'Apple Music',
  tidal: 'Tidal',
  bandcamp: 'Bandcamp',
  audio: 'Audio',
};

export function MusicEmbed({ url, castHash }: MusicEmbedProps) {
  const [metadata, setMetadata] = useState<TrackMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);

  const player = usePlayer();

  const isThisTrack = player.metadata?.feedId === castHash;
  const isThisPlaying = isThisTrack && player.isPlaying;
  const isThisLoading = isThisTrack && player.isLoading;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchFailed(false);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    fetch(`/api/music/metadata?url=${encodeURIComponent(url)}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json();
      })
      .then((data: TrackMetadata) => {
        if (!cancelled) {
          setMetadata({ ...data, feedId: castHash });
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFetchFailed(true);
          setLoading(false);
        }
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      cancelled = true;
    };
  }, [url, castHash]);

  const externalOnly = metadata?.type === 'applemusic' || metadata?.type === 'tidal';

  const handlePlayPause = () => {
    if (!metadata) return;

    if (externalOnly) {
      window.open(url, '_blank');
      return;
    }

    if (isThisTrack) {
      if (player.isPlaying) player.pause();
      else player.resume();
    } else {
      player.play({ ...metadata, feedId: castHash });
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="mt-2 rounded-xl border border-gray-700/50 bg-[#0d1b2a] overflow-hidden animate-pulse">
        <div className="flex items-center gap-3 p-3">
          <div className="w-14 h-14 rounded-lg bg-gray-800 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-gray-800 rounded w-3/4" />
            <div className="h-3 bg-gray-800/60 rounded w-1/2" />
            <div className="h-2.5 bg-gray-800/40 rounded w-20" />
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-800 flex-shrink-0" />
        </div>
      </div>
    );
  }

  if (fetchFailed || !metadata) return null;

  const colors = PLATFORM_COLORS[metadata.type] || PLATFORM_COLORS.audio;

  return (
    <div
      className={`mt-2 rounded-xl border overflow-hidden transition-all ${
        isThisTrack
          ? 'border-[#f5a623]/30 bg-[#f5a623]/[0.03] shadow-lg shadow-[#f5a623]/5'
          : 'border-gray-700/50 bg-[#0d1b2a] hover:border-gray-600/60'
      }`}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Artwork — larger, with play overlay */}
        <button
          onClick={handlePlayPause}
          className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800 group"
          aria-label={isThisPlaying ? 'Pause' : 'Play'}
        >
          {metadata.artworkUrl ? (
            <Image
              src={metadata.artworkUrl}
              alt={metadata.trackName}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a2a3a] to-[#0a1628]">
              <svg className="w-7 h-7 text-[#f5a623]/40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          )}

          {/* Play/pause overlay on hover */}
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
            isThisTrack ? 'bg-black/40 opacity-100' : 'bg-black/50 opacity-0 group-hover:opacity-100'
          }`}>
            {isThisLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isThisPlaying ? (
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </div>
        </button>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${isThisTrack ? 'text-[#f5a623]' : 'text-white'}`}>
            {metadata.trackName}
          </p>
          {metadata.artistName && (
            <p className="text-xs text-gray-400 truncate mt-0.5">{metadata.artistName}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md ${colors.bg} ${colors.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
              {PLATFORM_LABELS[metadata.type]}
            </span>
            {isThisTrack && player.duration > 0 && (
              <span className="text-[10px] text-gray-500 tabular-nums">
                {formatDuration(player.position)} / {formatDuration(player.duration)}
              </span>
            )}
          </div>
        </div>

        {/* Play button — visible when not hovering artwork */}
        <button
          onClick={handlePlayPause}
          className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full transition-all ${
            isThisTrack
              ? 'bg-[#f5a623] text-[#0d1b2a] shadow-md shadow-[#f5a623]/20'
              : externalOnly
              ? 'bg-white/10 text-white hover:bg-white/15'
              : 'bg-[#f5a623] text-[#0d1b2a] hover:bg-[#ffd700]'
          }`}
          aria-label={externalOnly ? 'Open' : isThisPlaying ? 'Pause' : 'Play'}
        >
          {externalOnly ? (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          ) : isThisLoading ? (
            <div className="w-4 h-4 border-2 border-[#0d1b2a] border-t-transparent rounded-full animate-spin" />
          ) : isThisPlaying ? (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Progress bar — shown when this track is playing */}
      {isThisTrack && player.duration > 0 && (
        <div className="h-0.5 bg-gray-800">
          <div
            className="h-full bg-[#f5a623] transition-[width] duration-300"
            style={{ width: `${(player.position / player.duration) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
