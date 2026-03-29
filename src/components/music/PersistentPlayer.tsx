'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePlayer } from '@/providers/audio';
import { formatDuration } from '@/lib/music/formatDuration';
import { ArtworkImage } from '@/components/music/ArtworkImage';
import { communityConfig } from '@/../community.config';
import { LikeButton } from '@/components/music/LikeButton';
import { AddToPlaylistButton } from '@/components/music/AddToPlaylistButton';
import dynamic from 'next/dynamic';
const ExpandedPlayer = dynamic(() => import('@/components/music/ExpandedPlayer').then(m => ({ default: m.ExpandedPlayer })), {
  ssr: false,
  loading: () => <div className="fixed inset-0 z-50 bg-[#0a1628] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" /></div>,
});

interface PersistentPlayerProps {
  onPrev?: () => void;
  onNext?: () => void;
  // Radio controls
  isRadioMode?: boolean;
  radioLoading?: boolean;
  onRadioStart?: () => void;
  onRadioStop?: () => void;
  // Sidebar controls
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

/**
 * Persistent music player that renders on ALL authenticated pages.
 * Sits above the bottom nav.
 * - When a track is loaded: shows play/pause, prev/next, track info, progress, sidebar toggle.
 * - When idle: shows "ZAO Radio — tap to play" with one-tap start + sidebar toggle.
 */
export function PersistentPlayer({
  onPrev,
  onNext,
  isRadioMode = false,
  radioLoading = false,
  onRadioStart,
  onRadioStop,
  sidebarOpen = false,
  onToggleSidebar,
}: PersistentPlayerProps) {
  const player = usePlayer();
  const [expanded, setExpanded] = useState(false);

  // ─── Swipe to skip on compact bar ──────────────────────────────────
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const onSwipeStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const onSwipeEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx > 0 && onPrev) { onPrev(); navigator.vibrate?.(10); }
      else if (dx < 0 && onNext) { onNext(); navigator.vibrate?.(10); }
    }
  }, [onPrev, onNext]);

  // Show restored track as if paused (user sees what was playing before refresh)
  const restored = player.restoredTrack;
  const hasTrack = !!player.metadata || !!restored;

  // ─── Idle state: entire bar tappable to start radio ────────────────
  if (!hasTrack) {
    return (
      <div className="fixed bottom-14 md:bottom-0 left-0 right-0 z-30 bg-[#0d1b2a]/95 backdrop-blur-xl border-t border-gray-800/80">
        <button
          onClick={() => radioLoading ? undefined : onRadioStart?.()}
          disabled={radioLoading}
          aria-label={radioLoading ? 'Loading ZAO Radio' : 'Play ZAO Radio'}
          className="w-full flex items-center gap-3 px-3 py-2.5 active:bg-white/5 transition-colors disabled:opacity-70"
        >
          {/* Radio icon */}
          <div className="w-9 h-9 rounded-lg bg-[#f5a623]/15 flex items-center justify-center flex-shrink-0">
            {radioLoading ? (
              <div className="w-4 h-4 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-[18px] h-[18px] text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.5l16.5-4.125M12 6.75c-2.708 0-5.363.224-7.948.655C2.999 7.58 2.25 8.507 2.25 9.574v9.176A2.25 2.25 0 004.5 21h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169A48.329 48.329 0 0012 6.75z" />
              </svg>
            )}
          </div>

          {/* Label */}
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-[#f5a623]">{communityConfig.music.radioName}</p>
            <p className="text-xs text-gray-500">{radioLoading ? 'Loading...' : 'Tap to play'}</p>
          </div>

          {/* Play icon hint */}
          {!radioLoading && (
            <svg className="w-5 h-5 text-[#f5a623]/60 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>
    );
  }

  // ─── Active state: track playing or restored ───────────────────────
  const metadata = player.metadata ?? restored?.metadata ?? null;
  if (!metadata) return null;
  const isPlaying = player.isPlaying;
  const isLoading = player.isLoading;
  const position = player.metadata ? player.position : (restored?.position ?? 0);
  const duration = player.metadata ? player.duration : (restored?.duration ?? 0);
  const isRestored = !player.metadata && !!restored;

  const handlePlayPause = () => {
    if (isRestored) {
      player.resumeRestored();
      return;
    }
    if (isPlaying) player.pause();
    else player.resume();
  };

  return (
    <>
    {/* Expanded full-screen player — overlay on top of compact bar */}
    {expanded && metadata && (
      <ExpandedPlayer
        metadata={metadata}
        onClose={() => setExpanded(false)}
        onPrev={onPrev}
        onNext={onNext}
      />
    )}

    <div className="fixed bottom-14 md:bottom-0 left-0 right-0 z-30 bg-[#0d1b2a]/95 backdrop-blur-xl border-t border-gray-800/80">
      {/* Seekable progress bar */}
      <div
        role="slider"
        aria-label="Playback progress"
        aria-valuemin={0}
        aria-valuemax={duration > 0 ? Math.round(duration) : 100}
        aria-valuenow={Math.round(position)}
        aria-valuetext={`${formatDuration(position)} of ${formatDuration(duration)}`}
        tabIndex={0}
        className="h-1.5 bg-gray-800 w-full cursor-pointer group hover:h-2.5 transition-all focus-visible:h-2.5"
        onClick={(e) => {
          if (duration <= 0) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const fraction = (e.clientX - rect.left) / rect.width;
          player.seek(fraction * duration);
        }}
        onKeyDown={(e) => {
          if (duration <= 0) return;
          if (e.key === 'ArrowRight') player.seek(Math.min(position + 10000, duration));
          else if (e.key === 'ArrowLeft') player.seek(Math.max(position - 10000, 0));
        }}
      >
        <div
          className="h-full bg-[#f5a623] transition-[width] duration-300 pointer-events-none"
          style={{ width: duration > 0 ? `${(position / duration) * 100}%` : '0%' }}
        />
      </div>

      <div
        className="flex items-center gap-2 px-3 py-1.5"
        onTouchStart={onSwipeStart}
        onTouchEnd={onSwipeEnd}
      >
        {/* Artwork — tap to expand */}
        <button
          onClick={() => metadata && setExpanded(true)}
          className={`relative w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800 ${isPlaying ? 'ring-1 ring-[#f5a623]/30' : ''}`}
          aria-label="Expand player"
        >
          <ArtworkImage
            src={metadata.artworkUrl}
            alt={metadata.trackName}
            fill
            className="object-cover"
          />
          {isPlaying && (
            <div className="absolute inset-0 flex items-end justify-center pb-0.5 bg-gradient-to-t from-black/40 to-transparent">
              <div className="flex items-end gap-px">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-[2px] bg-[#f5a623] rounded-full animate-bounce"
                    style={{ height: `${5 + i * 2}px`, animationDelay: `${i * 0.15}s`, animationDuration: '0.6s' }}
                  />
                ))}
              </div>
            </div>
          )}
        </button>

        {/* Track info — tap to expand */}
        <button
          onClick={() => metadata && setExpanded(true)}
          className="flex-1 min-w-0 text-left"
          aria-label="Expand player"
        >
          <p className="text-sm font-medium text-white truncate">{metadata.trackName}</p>
          <div className="flex items-center gap-2">
            {metadata.artistName && (
              <p className="text-xs text-gray-400 truncate">{metadata.artistName}</p>
            )}
            <span className="text-[9px] text-gray-500 tabular-nums flex-shrink-0">
              {formatDuration(position)} / {formatDuration(duration)}
            </span>
          </div>
        </button>

        {/* Volume */}
        <PersistentVolumeButton />

        {/* Like */}
        <LikeButton songUrl={metadata.url} compact className="flex-shrink-0" />

        {/* Add to playlist */}
        <AddToPlaylistButton songUrl={metadata.url} compact className="flex-shrink-0" />

        {/* Previous */}
        <button
          onClick={onPrev}
          className={`w-8 h-8 flex items-center justify-center flex-shrink-0 transition-colors active:scale-95 ${onPrev ? 'text-gray-400 hover:text-white' : 'text-gray-700'}`}
          aria-label="Previous track"
          disabled={!onPrev}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          onClick={handlePlayPause}
          disabled={isLoading}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white text-[#0d1b2a] active:scale-95 transition-transform disabled:opacity-60 flex-shrink-0"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-[#0d1b2a] border-t-transparent rounded-full animate-spin" />
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

        {/* Next */}
        <button
          onClick={onNext}
          className={`w-8 h-8 flex items-center justify-center flex-shrink-0 transition-colors active:scale-95 ${onNext ? 'text-gray-400 hover:text-white' : 'text-gray-700'}`}
          aria-label="Next track"
          disabled={!onNext}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>

        {/* Dismiss player */}
        <button
          onClick={(e) => { e.stopPropagation(); if (isRadioMode && onRadioStop) onRadioStop(); player.stop(); }}
          className="text-gray-500 hover:text-gray-300 transition-colors p-1 flex-shrink-0"
          aria-label="Dismiss player"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Sidebar toggle */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors flex-shrink-0 ${
              sidebarOpen
                ? 'bg-[#f5a623]/20 text-[#f5a623]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            aria-label="Toggle music sidebar"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
            </svg>
          </button>
        )}
      </div>
    </div>
    </>
  );
}

// ─── Volume button with popover ─────────────────────────────────────────

function PersistentVolumeButton() {
  const player = usePlayer();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        aria-label="Volume"
      >
        {player.volume === 0 ? (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
          </svg>
        ) : player.volume < 0.5 ? (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-[#111827] border border-gray-700 rounded-xl shadow-2xl shadow-black/60 p-3 z-50">
          <div className="flex items-center gap-2 w-40">
            <button
              onClick={() => player.setVolume(player.volume > 0 ? 0 : 1)}
              className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
              aria-label={player.volume === 0 ? 'Unmute' : 'Mute'}
            >
              {player.volume === 0 ? (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={player.volume}
              onChange={(e) => player.setVolume(parseFloat(e.target.value))}
              className="flex-1 h-1.5 accent-[#f5a623] cursor-pointer"
              aria-label="Volume"
            />
            <span className="text-[10px] text-gray-500 tabular-nums w-6 text-right flex-shrink-0">
              {Math.round(player.volume * 100)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
