'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePlayer } from '@/providers/audio';
import { PlayerButtons } from './PlayerButtons';
import { Scrubber } from './Scrubber';

export function GlobalPlayer() {
  const player = usePlayer();
  const [safeBottom, setSafeBottom] = useState(0);

  // Apply safe area inset for Farcaster miniapp on iPhone
  useEffect(() => {
    const applySafeArea = async () => {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        const ctx = await sdk.context;
        const inset = ctx?.client?.safeAreaInsets?.bottom ?? 0;
        setSafeBottom(inset);
      } catch {
        // Not in miniapp context — use CSS env() fallback
        setSafeBottom(0);
      }
    };
    applySafeArea();
  }, []);

  if (!player.metadata) return null;

  const { metadata, isPlaying, isLoading, position, duration } = player;

  const handlePlayPause = () => {
    if (isPlaying) player.pause();
    else player.resume();
  };

  return (
    <div
      className="bg-[#0d1b2a] border-t border-gray-800 w-full"
      style={{ paddingBottom: safeBottom > 0 ? safeBottom : undefined }}
    >
      {/* Desktop: single row */}
      <div className="hidden sm:flex items-center gap-3 px-4 py-2">
        {/* Artwork */}
        <div className="relative w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-gray-800">
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
              <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          )}
        </div>

        {/* Track info */}
        <div className="w-36 flex-shrink-0 min-w-0">
          <p className="text-sm font-medium text-white truncate">{metadata.trackName}</p>
          {metadata.artistName && (
            <p className="text-xs text-gray-400 truncate">{metadata.artistName}</p>
          )}
        </div>

        {/* Controls */}
        <PlayerButtons
          isPlaying={isPlaying}
          isLoading={isLoading}
          onPlayPause={handlePlayPause}
        />

        {/* Scrubber */}
        <div className="flex-1 min-w-0">
          <Scrubber
            position={position}
            duration={duration}
            feedId={metadata.feedId}
            onSeek={player.seek}
          />
        </div>
      </div>

      {/* Mobile: two rows */}
      <div className="flex sm:hidden flex-col px-3 py-2 gap-1.5">
        {/* Row 1: artwork + title + play/pause */}
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 flex-shrink-0 rounded overflow-hidden bg-gray-800">
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

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{metadata.trackName}</p>
            {metadata.artistName && (
              <p className="text-xs text-gray-400 truncate">{metadata.artistName}</p>
            )}
          </div>

          <PlayerButtons
            isPlaying={isPlaying}
            isLoading={isLoading}
            onPlayPause={handlePlayPause}
            size="sm"
          />
        </div>

        {/* Row 2: scrubber */}
        <Scrubber
          position={position}
          duration={duration}
          feedId={metadata.feedId}
          onSeek={player.seek}
        />
      </div>
    </div>
  );
}
