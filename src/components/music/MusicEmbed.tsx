'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { TrackMetadata } from '@/types/music';
import { usePlayer } from '@/providers/audio';

interface MusicEmbedProps {
  url: string;
  castHash: string;
}

export function MusicEmbed({ url, castHash }: MusicEmbedProps) {
  const [metadata, setMetadata] = useState<TrackMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);

  const player = usePlayer();

  const isThisPlaying =
    player.metadata?.feedId === castHash &&
    (player.isPlaying || player.isLoading);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchFailed(false);

    fetch(`/api/music/metadata?url=${encodeURIComponent(url)}`)
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
      });

    return () => {
      cancelled = true;
    };
  }, [url, castHash]);

  // Apple Music & Tidal don't have free streaming embeds — open externally
  const externalOnly = metadata?.type === 'applemusic' || metadata?.type === 'tidal';

  const handlePlayPause = () => {
    if (!metadata) return;

    if (externalOnly) {
      window.open(url, '_blank');
      return;
    }

    if (isThisPlaying) {
      if (player.isPlaying) player.pause();
      else player.resume();
    } else {
      player.play({ ...metadata, feedId: castHash });
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="mt-2 flex items-center gap-3 p-3 rounded-lg border border-gray-700 bg-[#0d1b2a] animate-pulse">
        <div className="w-12 h-12 rounded bg-gray-700 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-700 rounded w-3/4" />
          <div className="h-3 bg-gray-700 rounded w-1/2" />
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0" />
      </div>
    );
  }

  // Graceful fallback — let caller render OG card instead
  if (fetchFailed || !metadata) return null;

  const currentlyPlayingThis =
    player.metadata?.feedId === castHash && player.isPlaying;
  const isPlayingOrLoading = player.metadata?.feedId === castHash &&
    (player.isPlaying || player.isLoading);

  return (
    <div
      className={`mt-2 flex items-center gap-3 p-3 rounded-lg border bg-[#0d1b2a] transition-colors ${
        isPlayingOrLoading
          ? 'border-l-4 border-l-[#f5a623] border-gray-700'
          : 'border-gray-700 hover:border-gray-600'
      }`}
    >
      {/* Artwork */}
      <div
        className={`relative w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-800 ${
          currentlyPlayingThis ? 'animate-pulse' : ''
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
            <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
        )}
      </div>

      {/* Track info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{metadata.trackName}</p>
        {metadata.artistName && (
          <p className="text-xs text-gray-400 truncate">{metadata.artistName}</p>
        )}
        <p className="text-xs text-gray-600 capitalize mt-0.5">{metadata.type}</p>
      </div>

      {/* Play/pause or external link button */}
      <button
        onClick={handlePlayPause}
        className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-[#f5a623] text-[#0d1b2a] hover:bg-[#f5b84a] transition-colors"
        aria-label={externalOnly ? 'Open' : isThisPlaying ? 'Pause' : 'Play'}
      >
        {externalOnly ? (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        ) : player.isLoading && player.metadata?.feedId === castHash ? (
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="3" className="opacity-25" />
            <path
              d="M12 2a10 10 0 0110 10"
              strokeWidth="3"
              strokeLinecap="round"
              className="opacity-75"
            />
          </svg>
        ) : isThisPlaying && player.isPlaying ? (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
    </div>
  );
}
