'use client';

import { memo, useState, useEffect } from 'react';
import Image from 'next/image';
import { TrackMetadata } from '@/types/music';
import { TrackType } from '@/types/music';
import { usePlayer } from '@/providers/audio';

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

const PLATFORM_COLORS: Record<TrackType, string> = {
  spotify: 'text-green-400',
  soundcloud: 'text-orange-400',
  soundxyz: 'text-purple-400',
  youtube: 'text-red-400',
  audius: 'text-purple-500',
  applemusic: 'text-pink-400',
  tidal: 'text-cyan-400',
  bandcamp: 'text-sky-400',
  audio: 'text-blue-400',
};

interface MusicQueueTrackCardProps {
  url: string;
  type: TrackType;
  castHash: string;
  index: number;
  isCurrentSection?: boolean;
  onPlay?: () => void;
}

// Simple module-level cache so cards don't re-fetch what MusicEmbed already loaded
// Capped at 200 entries — oldest evicted first
const MAX_CACHE = 200;
const metadataCache = new Map<string, TrackMetadata>();

function cacheSet(key: string, value: TrackMetadata) {
  if (metadataCache.size >= MAX_CACHE) {
    // Delete the oldest entry (first key in Map iteration order)
    const firstKey = metadataCache.keys().next().value;
    if (firstKey) metadataCache.delete(firstKey);
  }
  metadataCache.set(key, value);
}

export const MusicQueueTrackCard = memo(function MusicQueueTrackCard({
  url,
  type,
  castHash,
  index,
  onPlay,
}: MusicQueueTrackCardProps) {
  const player = usePlayer();
  const [metadata, setMetadata] = useState<TrackMetadata | null>(
    metadataCache.get(url) ?? null,
  );
  const [loading, setLoading] = useState(!metadataCache.has(url));

  const isCurrentTrack = player.metadata?.feedId === castHash;

  useEffect(() => {
    if (metadataCache.has(url)) return;
    let cancelled = false;

    fetch(`/api/music/metadata?url=${encodeURIComponent(url)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: TrackMetadata | null) => {
        if (!cancelled && data) {
          const full = { ...data, feedId: castHash };
          cacheSet(url, full);
          setMetadata(full);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [url, castHash]);

  const handleClick = () => {
    if (!metadata) return;
    const track = { ...metadata, feedId: castHash };
    if (isCurrentTrack && player.isPlaying) {
      player.pause();
    } else if (isCurrentTrack && !player.isPlaying) {
      player.resume();
    } else {
      player.play(track);
    }
    onPlay?.();
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 animate-pulse">
        <span className="text-xs text-gray-600 w-5 text-right flex-shrink-0">
          {index + 1}
        </span>
        <div className="w-8 h-8 rounded bg-gray-800 flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-2.5 bg-gray-800 rounded w-3/4" />
          <div className="h-2 bg-gray-800 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 opacity-50">
        <span className="text-xs text-gray-600 w-5 text-right flex-shrink-0">
          {index + 1}
        </span>
        <div className="w-8 h-8 rounded bg-gray-800 flex-shrink-0 flex items-center justify-center">
          <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 truncate">Unknown track</p>
          <p className={`text-xs ${PLATFORM_COLORS[type]}`}>
            {PLATFORM_LABELS[type]}
          </p>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-white/5 rounded-sm ${
        isCurrentTrack ? 'bg-[#f5a623]/10' : ''
      }`}
    >
      {/* Track number / playing indicator */}
      <div className="w-5 flex-shrink-0 flex items-center justify-center">
        {isCurrentTrack && player.isPlaying ? (
          <svg className="w-3 h-3 text-[#f5a623]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : isCurrentTrack ? (
          <svg className="w-3 h-3 text-[#f5a623]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        ) : (
          <span className="text-xs text-gray-600">{index + 1}</span>
        )}
      </div>

      {/* Artwork */}
      <div
        className={`relative w-8 h-8 flex-shrink-0 rounded overflow-hidden bg-gray-800 ${
          isCurrentTrack && player.isPlaying ? 'ring-1 ring-[#f5a623]' : ''
        }`}
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
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-xs font-medium truncate ${
            isCurrentTrack ? 'text-[#f5a623]' : 'text-white'
          }`}
        >
          {metadata.trackName}
        </p>
        <p className="text-xs text-gray-400 truncate">
          {metadata.artistName || PLATFORM_LABELS[type]}
        </p>
      </div>
    </button>
  );
});
