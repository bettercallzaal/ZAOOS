'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePlayer } from '@/providers/audio';
import type { RepeatMode } from '@/providers/audio/PlayerProvider';
import { Scrubber } from './Scrubber';
import { formatDuration } from '@/lib/music/formatDuration';

interface GlobalPlayerProps {
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  queueLength?: number;
  onToggleQueue?: () => void;
  queueOpen?: boolean;
}

export function GlobalPlayer({
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
  queueLength = 0,
  onToggleQueue,
  queueOpen = false,
}: GlobalPlayerProps) {
  const player = usePlayer();
  const [safeBottom, setSafeBottom] = useState(0);

  useEffect(() => {
    const applySafeArea = async () => {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        const ctx = await sdk.context;
        const inset = ctx?.client?.safeAreaInsets?.bottom ?? 0;
        setSafeBottom(inset);
      } catch {
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
      className="bg-[#0d1b2a]/95 backdrop-blur-xl border-t border-gray-800/80 w-full relative"
      style={{ paddingBottom: safeBottom > 0 ? safeBottom : undefined }}
    >
      {/* Artwork glow effect — subtle color bleed behind the player */}
      {metadata.artworkUrl && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -left-4 top-1/2 -translate-y-1/2 w-32 h-32 rounded-full opacity-[0.07] blur-3xl"
            style={{
              backgroundImage: `url(${metadata.artworkUrl})`,
              backgroundSize: 'cover',
            }}
          />
        </div>
      )}

      {/* ─── Desktop: full bar ─────────────────────────────────────── */}
      <div className="hidden sm:flex items-center gap-4 px-4 py-2.5 relative z-10">
        {/* Left: Artwork + Track info */}
        <div className="flex items-center gap-3 w-56 flex-shrink-0">
          <div className={`relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800 shadow-lg ${isPlaying ? 'ring-1 ring-[#f5a623]/30' : ''}`}>
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
                <svg className="w-6 h-6 text-[#f5a623]/50" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
            )}
            {/* Playing indicator overlay */}
            {isPlaying && (
              <div className="absolute inset-0 flex items-end justify-center pb-1 bg-gradient-to-t from-black/40 to-transparent">
                <div className="flex items-end gap-px">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-[3px] bg-[#f5a623] rounded-full animate-bounce"
                      style={{
                        height: `${8 + i * 3}px`,
                        animationDelay: `${i * 0.15}s`,
                        animationDuration: '0.6s',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{metadata.trackName}</p>
            {metadata.artistName && (
              <p className="text-xs text-gray-400 truncate">{metadata.artistName}</p>
            )}
          </div>
        </div>

        {/* Center: Controls + Scrubber */}
        <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
          {/* Transport controls */}
          <div className="flex items-center gap-2">
            <ShuffleButton active={player.shuffle} onClick={player.toggleShuffle} />

            <button
              onClick={onPrev}
              disabled={!hasPrev}
              className="text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-default p-1"
              aria-label="Previous track"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
              </svg>
            </button>

            <button
              onClick={handlePlayPause}
              disabled={isLoading}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white text-[#0d1b2a] hover:scale-105 active:scale-95 transition-all disabled:opacity-60 shadow-md"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="3" className="opacity-25" />
                  <path d="M12 2a10 10 0 0110 10" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                </svg>
              ) : isPlaying ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              onClick={onNext}
              disabled={!hasNext && player.repeat === 'off'}
              className="text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-default p-1"
              aria-label="Next track"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>

            <RepeatButton mode={player.repeat} onClick={player.cycleRepeat} />
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-2xl">
            <Scrubber
              position={position}
              duration={duration}
              feedId={metadata.feedId}
              onSeek={player.seek}
            />
          </div>
        </div>

        {/* Right: Queue + platform badge */}
        <div className="flex items-center gap-3 w-36 flex-shrink-0 justify-end">
          <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded capitalize">
            {metadata.type === 'applemusic' ? 'Apple Music' : metadata.type === 'soundxyz' ? 'Sound.xyz' : metadata.type}
          </span>

          {onToggleQueue && (
            <button
              onClick={onToggleQueue}
              className={`relative p-1.5 rounded transition-colors ${
                queueOpen ? 'text-[#f5a623] bg-[#f5a623]/10' : 'text-gray-400 hover:text-white'
              }`}
              aria-label="Toggle queue"
              title={`Queue (${queueLength})`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
              </svg>
              {queueLength > 0 && !queueOpen && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#f5a623] text-[7px] font-bold text-black flex items-center justify-center">
                  {queueLength > 9 ? '9+' : queueLength}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => player.stop()}
            className="text-gray-500 hover:text-gray-300 transition-colors p-1"
            aria-label="Close player"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* ─── Mobile: compact + swipe-friendly ──────────────────────── */}
      <div className="flex sm:hidden flex-col relative z-10">
        {/* Progress bar on top — thin, always visible */}
        <div className="h-1 bg-gray-800 w-full">
          <div
            className="h-full bg-[#f5a623] transition-[width] duration-300"
            style={{ width: duration > 0 ? `${(position / duration) * 100}%` : '0%' }}
          />
        </div>

        <div className="flex items-center gap-3 px-3 py-2">
          {/* Artwork */}
          <div className={`relative w-11 h-11 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800 ${isPlaying ? 'ring-1 ring-[#f5a623]/30' : ''}`}>
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
                <svg className="w-5 h-5 text-[#f5a623]/50" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
            )}
          </div>

          {/* Track info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{metadata.trackName}</p>
            <div className="flex items-center gap-2">
              {metadata.artistName && (
                <p className="text-xs text-gray-400 truncate">{metadata.artistName}</p>
              )}
              <span className="text-[9px] text-gray-500 tabular-nums flex-shrink-0">
                {formatDuration(position)} / {formatDuration(duration)}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onPrev}
              disabled={!hasPrev}
              className="text-gray-400 p-1.5 disabled:opacity-30"
              aria-label="Previous"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
              </svg>
            </button>

            <button
              onClick={handlePlayPause}
              disabled={isLoading}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-[#0d1b2a] active:scale-95 transition-transform disabled:opacity-60"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-[#0d1b2a] border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              onClick={onNext}
              disabled={!hasNext}
              className="text-gray-400 p-1.5 disabled:opacity-30"
              aria-label="Next"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shuffle / Repeat buttons ────────────────────────────────────────────────

function ShuffleButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`p-1 rounded transition-colors ${active ? 'text-[#f5a623]' : 'text-gray-500 hover:text-gray-300'}`}
      aria-label={active ? 'Disable shuffle' : 'Enable shuffle'}
      title="Shuffle"
    >
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
      </svg>
      {active && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#f5a623]" />}
    </button>
  );
}

function RepeatButton({ mode, onClick }: { mode: RepeatMode; onClick: () => void }) {
  const active = mode !== 'off';
  return (
    <button
      onClick={onClick}
      className={`relative p-1 rounded transition-colors ${active ? 'text-[#f5a623]' : 'text-gray-500 hover:text-gray-300'}`}
      aria-label={mode === 'off' ? 'Enable repeat' : mode === 'all' ? 'Repeat one' : 'Disable repeat'}
      title={mode === 'off' ? 'Repeat' : mode === 'all' ? 'Repeat all' : 'Repeat one'}
    >
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M4.5 12c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 7.5l4.5-3-4.5-3M9.75 16.5l-4.5 3 4.5 3" />
      </svg>
      {mode === 'one' && (
        <span className="absolute -top-0.5 -right-0.5 text-[8px] font-bold text-[#f5a623]">1</span>
      )}
      {active && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#f5a623]" />}
    </button>
  );
}
