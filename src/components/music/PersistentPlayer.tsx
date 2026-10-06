'use client';

import { AnimatePresence, LayoutGroup, LazyMotion, m } from 'motion/react';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { communityConfig } from '@/../community.config';
import { AddToPlaylistButton } from '@/components/music/AddToPlaylistButton';
import { ArtworkImage } from '@/components/music/ArtworkImage';
import { LikeButton } from '@/components/music/LikeButton';
import { useQueue } from '@/contexts/QueueContext';
import { formatDuration } from '@/lib/music/formatDuration';
import { usePlayer } from '@/providers/audio';
import type { RepeatMode } from '@/providers/audio/PlayerProvider';

const loadMotionFeatures = () => import('motion/react').then((mod) => mod.domMax);

const ExpandedPlayer = dynamic(
  () => import('@/components/music/ExpandedPlayer').then((m) => ({ default: m.ExpandedPlayer })),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 bg-[#0a1628] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  },
);

const QueuePanel = dynamic(
  () => import('@/components/music/QueuePanel').then((m) => ({ default: m.QueuePanel })),
  { ssr: false },
);

const LyricsPanel = dynamic(
  () => import('@/components/music/LyricsPanel').then((m) => ({ default: m.LyricsPanel })),
  { ssr: false },
);

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
 * Spotify-like persistent music player that renders on all authenticated pages.
 * Responsive:
 * - Desktop: Full 3-column Spotify layout (Track info + controls + scrubber + queue/lyrics/volume).
 * - Mobile: Compact floating bar above bottom nav with swipe-to-skip and tap-to-expand.
 * - Drawers: Slide-over Queue drawer (Q) and Lyrics drawer.
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
  const queue = useQueue();
  const [expanded, setExpanded] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [showRemaining, setShowRemaining] = useState(false);
  const [hoverTime, setHoverTime] = useState(0);
  const [hoverX, setHoverX] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);

  // Swipe gestures on compact mobile bar
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const onSwipeStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const onSwipeEnd = useCallback(
    (e: React.TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx > 0 && onPrev) {
          onPrev();
          navigator.vibrate?.(10);
        } else if (dx < 0 && onNext) {
          onNext();
          navigator.vibrate?.(10);
        }
      }
    },
    [onPrev, onNext],
  );

  // Listen for global toggle-queue event (from shortcut Q)
  useEffect(() => {
    const handleToggleQueue = () => setQueueOpen((prev) => !prev);
    window.addEventListener('zao:toggle-queue', handleToggleQueue);
    return () => window.removeEventListener('zao:toggle-queue', handleToggleQueue);
  }, []);

  // Close drawers on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setQueueOpen(false);
        setLyricsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const restored = player.restoredTrack;
  const hasTrack = !!player.metadata || !!restored;

  // Idle state: bar to start radio
  if (!hasTrack) {
    return (
      <div
        className="fixed bottom-14 md:bottom-0 left-0 right-0 z-30 bg-[#0d1b2a]/95 backdrop-blur-xl border-t border-white/[0.08]"
        style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <button
          type="button"
          onClick={() => (radioLoading ? undefined : onRadioStart?.())}
          disabled={radioLoading}
          aria-label={radioLoading ? 'Loading ZAO Radio' : 'Play ZAO Radio'}
          className="w-full flex items-center gap-3 px-4 py-3 active:bg-white/5 transition-colors disabled:opacity-70 text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-[#f5a623]/15 flex items-center justify-center flex-shrink-0">
            {radioLoading ? (
              <div className="w-5 h-5 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                aria-hidden="true"
                className="w-5 h-5 text-[#f5a623]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 7.5l16.5-4.125M12 6.75c-2.708 0-5.363.224-7.948.655C2.999 7.58 2.25 8.507 2.25 9.574v9.176A2.25 2.25 0 004.5 21h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169A48.329 48.329 0 0012 6.75z"
                />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#f5a623]">
              {communityConfig.music.radioName}
            </p>
            <p className="text-xs text-gray-400">
              {radioLoading ? 'Connecting...' : 'Tap to start live radio'}
            </p>
          </div>
          {!radioLoading && (
            <div className="w-8 h-8 rounded-full bg-[#f5a623]/20 flex items-center justify-center text-[#f5a623]">
              <svg
                aria-hidden="true"
                className="w-4 h-4 ml-0.5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}
        </button>
      </div>
    );
  }

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
    <LazyMotion features={loadMotionFeatures} strict>
      <LayoutGroup>
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {metadata && `Now playing: ${metadata.trackName} by ${metadata.artistName}`}
        </div>

        {/* Full-screen Expanded Player */}
        <AnimatePresence>
          {expanded && metadata && (
            <m.div
              key="expanded-player"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-50"
            >
              <ExpandedPlayer
                metadata={metadata}
                onClose={() => setExpanded(false)}
                onPrev={onPrev}
                onNext={onNext}
              />
            </m.div>
          )}
        </AnimatePresence>

        {/* Slide-over Queue Drawer */}
        <AnimatePresence>
          {queueOpen && (
            <>
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setQueueOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              />
              <m.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                className="fixed top-0 right-0 bottom-14 md:bottom-20 w-full sm:w-[400px] z-50 bg-[#0a1628]/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl overflow-y-auto p-4 flex flex-col"
              >
                <QueuePanel onClose={() => setQueueOpen(false)} />
              </m.div>
            </>
          )}
        </AnimatePresence>

        {/* Slide-over Lyrics Drawer */}
        <AnimatePresence>
          {lyricsOpen && (
            <>
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setLyricsOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              />
              <m.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                className="fixed top-0 right-0 bottom-14 md:bottom-20 w-full sm:w-[420px] z-50 bg-[#0a1628]/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl p-6 flex flex-col"
              >
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Lyrics
                    </h3>
                    <p className="text-xs text-gray-400 truncate max-w-[280px]">
                      {metadata.trackName} - {metadata.artistName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLyricsOpen(false)}
                    className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                    aria-label="Close lyrics"
                  >
                    <svg
                      aria-hidden="true"
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <LyricsPanel
                    trackName={metadata.trackName}
                    artistName={metadata.artistName || ''}
                  />
                </div>
              </m.div>
            </>
          )}
        </AnimatePresence>

        {/* Master Player Container */}
        <div
          className="fixed bottom-14 md:bottom-0 left-0 right-0 z-30 bg-[#0d1b2a]/95 backdrop-blur-xl border-t border-white/[0.08]"
          style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {/* Subtle Ambient Background Artwork Glow */}
          {metadata.artworkUrl && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
              <div
                className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full blur-3xl"
                style={{
                  backgroundImage: `url(${metadata.artworkUrl})`,
                  backgroundSize: 'cover',
                }}
              />
            </div>
          )}

          {/* ── Desktop Spotify 3-Column Bar (>= md) ──────────────────── */}
          <div className="hidden md:flex items-center justify-between px-4 py-2.5 h-[80px] relative z-10">
            {/* Left: Track Info & Artwork */}
            <div className="flex items-center gap-3.5 w-[30%] min-w-[200px]">
              <div className="relative w-[52px] h-[52px] flex-shrink-0 rounded-md overflow-hidden bg-gray-900 group shadow-lg">
                <ArtworkImage
                  src={metadata.artworkUrl}
                  alt={metadata.trackName}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  title="Expand view"
                  aria-label="Expand player"
                >
                  <svg
                    aria-hidden="true"
                    className="w-5 h-5 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                    />
                  </svg>
                </button>
              </div>

              <div className="min-w-0 flex-1 flex flex-col justify-center">
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="text-sm font-semibold text-white hover:underline truncate text-left"
                >
                  {metadata.trackName}
                </button>
                {metadata.artistName && (
                  <p className="text-xs text-gray-400 hover:text-white truncate cursor-pointer transition-colors mt-0.5">
                    {metadata.artistName}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <LikeButton
                  songUrl={metadata.url}
                  compact
                  className="text-gray-400 hover:text-white"
                />
                <AddToPlaylistButton
                  songUrl={metadata.url}
                  compact
                  className="text-gray-400 hover:text-white"
                />
              </div>
            </div>

            {/* Center: Transport Controls & Scrubber */}
            <div className="flex flex-col items-center justify-center max-w-[680px] w-[40%] px-4">
              <div className="flex items-center gap-4 mb-1">
                <ShuffleButton active={player.shuffle} onClick={player.toggleShuffle} />

                <button
                  type="button"
                  onClick={onPrev}
                  disabled={!onPrev}
                  className="text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed p-1 active:scale-95"
                  title="Previous track"
                  aria-label="Previous track"
                >
                  <svg
                    aria-hidden="true"
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={handlePlayPause}
                  disabled={isLoading}
                  className="w-9 h-9 rounded-full bg-white text-[#0a1628] hover:scale-105 active:scale-95 transition-all shadow-md flex items-center justify-center disabled:opacity-60"
                  title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-[#0a1628] border-t-transparent rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <svg
                      aria-hidden="true"
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg
                      aria-hidden="true"
                      className="w-4 h-4 ml-0.5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onNext}
                  disabled={!onNext && player.repeat === 'off'}
                  className="text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed p-1 active:scale-95"
                  title="Next track"
                  aria-label="Next track"
                >
                  <svg
                    aria-hidden="true"
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                  </svg>
                </button>

                <RepeatButton mode={player.repeat} onClick={player.cycleRepeat} />
              </div>

              {/* Center Spotify Scrubber */}
              <div className="flex items-center gap-2.5 w-full">
                <span className="text-[11px] text-gray-400 tabular-nums w-10 text-right select-none">
                  {formatDuration(position)}
                </span>

                <div
                  role="slider"
                  tabIndex={0}
                  aria-label="Playback scrubber"
                  aria-valuemin={0}
                  aria-valuemax={duration > 0 ? Math.round(duration) : 100}
                  aria-valuenow={Math.round(position)}
                  aria-valuetext={`${formatDuration(position)} of ${formatDuration(duration)}`}
                  className="relative flex-1 h-3 flex items-center cursor-pointer group"
                  onClick={(e) => {
                    if (duration <= 0) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    player.seek(fraction * duration);
                  }}
                  onKeyDown={(e) => {
                    if (duration <= 0) return;
                    if (e.key === 'ArrowRight') player.seek(Math.min(position + 5000, duration));
                    else if (e.key === 'ArrowLeft') player.seek(Math.max(0, position - 5000));
                  }}
                  onMouseMove={(e) => {
                    if (duration <= 0) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    setHoverTime(fraction * duration);
                    setHoverX(e.clientX - rect.left);
                  }}
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  {showTooltip && (
                    <div
                      className="absolute -top-7 px-1.5 py-0.5 rounded bg-black/90 text-white text-[10px] font-semibold tabular-nums pointer-events-none -translate-x-1/2 shadow-lg border border-white/10"
                      style={{ left: `${hoverX}px` }}
                    >
                      {formatDuration(hoverTime)}
                    </div>
                  )}

                  <div className="w-full h-1 group-hover:h-1.5 rounded-full bg-white/20 transition-all overflow-hidden">
                    <div
                      className="h-full bg-[#f5a623] group-hover:bg-[#ffd700] rounded-full transition-colors"
                      style={{ width: duration > 0 ? `${(position / duration) * 100}%` : '0%' }}
                    />
                  </div>

                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -translate-x-1/2"
                    style={{ left: duration > 0 ? `${(position / duration) * 100}%` : '0%' }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowRemaining(!showRemaining)}
                  className="text-[11px] text-gray-400 hover:text-white tabular-nums w-10 text-left select-none transition-colors"
                  title="Click to toggle remaining time"
                >
                  {showRemaining && duration > 0
                    ? `-${formatDuration(Math.max(0, duration - position))}`
                    : formatDuration(duration)}
                </button>
              </div>
            </div>

            {/* Right: Lyrics, Queue, Volume, Fullscreen */}
            <div className="flex items-center justify-end gap-3 w-[30%] min-w-[200px]">
              <button
                type="button"
                onClick={() => setLyricsOpen(!lyricsOpen)}
                className={`p-1.5 rounded-md transition-colors ${
                  lyricsOpen
                    ? 'text-[#f5a623] bg-[#f5a623]/15'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                title="Lyrics"
                aria-label="Toggle lyrics"
              >
                <svg
                  aria-hidden="true"
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                  />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => setQueueOpen(!queueOpen)}
                className={`relative p-1.5 rounded-md transition-colors ${
                  queueOpen
                    ? 'text-[#f5a623] bg-[#f5a623]/15'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                title="Queue (Q)"
                aria-label="Toggle queue"
              >
                <svg
                  aria-hidden="true"
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
                  />
                </svg>
                {queue.queueLength > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#f5a623] text-black text-[9px] font-bold flex items-center justify-center shadow">
                    {queue.queueLength > 9 ? '9+' : queue.queueLength}
                  </span>
                )}
              </button>

              <div className="flex items-center gap-2 group">
                <button
                  type="button"
                  onClick={() => player.setVolume(player.volume > 0 ? 0 : 1)}
                  className="text-gray-400 hover:text-white transition-colors"
                  title={player.volume === 0 ? 'Unmute (M)' : 'Mute (M)'}
                  aria-label="Toggle mute"
                >
                  {player.volume === 0 ? (
                    <svg
                      aria-hidden="true"
                      className="w-4 h-4 text-red-400"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                    </svg>
                  ) : player.volume < 0.5 ? (
                    <svg
                      aria-hidden="true"
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
                    </svg>
                  ) : (
                    <svg
                      aria-hidden="true"
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.02}
                  value={player.volume}
                  onChange={(e) => player.setVolume(parseFloat(e.target.value))}
                  className="w-20 lg:w-24 h-1 accent-[#f5a623] cursor-pointer hover:opacity-100 opacity-80 transition-opacity"
                  title={`Volume: ${Math.round(player.volume * 100)}%`}
                  aria-label="Volume slider"
                />
              </div>

              <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded capitalize font-medium">
                {isRadioMode
                  ? 'Radio'
                  : metadata.type === 'applemusic'
                    ? 'Apple'
                    : metadata.type === 'soundxyz'
                      ? 'Sound.xyz'
                      : metadata.type}
              </span>

              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                title="Fullscreen view"
                aria-label="Fullscreen view"
              >
                <svg
                  aria-hidden="true"
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                  />
                </svg>
              </button>

              {onToggleSidebar && (
                <button
                  type="button"
                  onClick={onToggleSidebar}
                  className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                    sidebarOpen
                      ? 'bg-[#f5a623]/20 text-[#f5a623]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  title="Music sidebar"
                  aria-label="Toggle music sidebar"
                >
                  <svg
                    aria-hidden="true"
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
                  </svg>
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isRadioMode && onRadioStop) onRadioStop();
                  player.stop();
                }}
                className="text-gray-500 hover:text-gray-300 p-1 transition-colors"
                title="Dismiss player"
                aria-label="Dismiss player"
              >
                <svg
                  aria-hidden="true"
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* ── Mobile Compact View (< md) ────────────────────────────── */}
          <div className="flex md:hidden flex-col relative z-10">
            {/* Top Seeker Bar on Mobile */}
            <div
              role="slider"
              tabIndex={0}
              aria-label="Playback progress"
              aria-valuemin={0}
              aria-valuemax={duration > 0 ? Math.round(duration) : 100}
              aria-valuenow={Math.round(position)}
              aria-valuetext={`${formatDuration(position)} of ${formatDuration(duration)}`}
              className="h-1 bg-gray-800 w-full cursor-pointer"
              onClick={(e) => {
                if (duration <= 0) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                player.seek(fraction * duration);
              }}
              onKeyDown={(e) => {
                if (duration <= 0) return;
                if (e.key === 'ArrowRight') player.seek(Math.min(position + 5000, duration));
                else if (e.key === 'ArrowLeft') player.seek(Math.max(0, position - 5000));
              }}
            >
              <div
                className="h-full bg-[#f5a623] transition-[width] duration-300 pointer-events-none"
                style={{ width: duration > 0 ? `${(position / duration) * 100}%` : '0%' }}
              />
            </div>

            <div
              className="flex items-center gap-2.5 px-3 py-1.5"
              onTouchStart={onSwipeStart}
              onTouchEnd={onSwipeEnd}
            >
              {/* Artwork with expand click */}
              <button
                type="button"
                onClick={() => metadata && setExpanded(true)}
                className="relative w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800"
                aria-label="Expand player"
              >
                <m.div layoutId="player-artwork" className="w-10 h-10 rounded-lg overflow-hidden">
                  <ArtworkImage
                    src={metadata.artworkUrl}
                    alt={metadata.trackName}
                    fill
                    className="object-cover"
                  />
                </m.div>
                {isPlaying && (
                  <div className="absolute inset-0 flex items-end justify-center pb-0.5 bg-gradient-to-t from-black/40 to-transparent">
                    <div className="flex items-end gap-px">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-[2px] bg-[#f5a623] rounded-full motion-safe:animate-bounce"
                          style={{
                            height: `${5 + i * 2}px`,
                            animationDelay: `${i * 0.15}s`,
                            animationDuration: '0.6s',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </button>

              {/* Track info tap to expand */}
              <button
                type="button"
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

              <LikeButton songUrl={metadata.url} compact className="flex-shrink-0" />
              <AddToPlaylistButton songUrl={metadata.url} compact className="flex-shrink-0" />

              {/* Mobile Transport Controls */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={onPrev}
                  className={`w-9 h-9 flex items-center justify-center transition-colors active:scale-95 ${
                    onPrev ? 'text-gray-400 hover:text-white' : 'text-gray-700'
                  }`}
                  aria-label="Previous track"
                  disabled={!onPrev}
                >
                  <svg
                    aria-hidden="true"
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={handlePlayPause}
                  disabled={isLoading}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-[#0a1628] active:scale-95 transition-transform disabled:opacity-60 flex-shrink-0 shadow"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-[#0a1628] border-t-transparent rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <svg
                      aria-hidden="true"
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg
                      aria-hidden="true"
                      className="w-4 h-4 ml-0.5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onNext}
                  className={`w-9 h-9 flex items-center justify-center transition-colors active:scale-95 ${
                    onNext ? 'text-gray-400 hover:text-white' : 'text-gray-700'
                  }`}
                  aria-label="Next track"
                  disabled={!onNext}
                >
                  <svg
                    aria-hidden="true"
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isRadioMode && onRadioStop) onRadioStop();
                    player.stop();
                  }}
                  className="text-gray-500 hover:text-gray-300 p-1 flex-shrink-0"
                  aria-label="Dismiss player"
                >
                  <svg
                    aria-hidden="true"
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </LayoutGroup>
    </LazyMotion>
  );
}

// ── Transport Buttons ────────────────────────────────────────────────────────

function ShuffleButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative p-1.5 rounded transition-colors ${
        active ? 'text-[#f5a623]' : 'text-gray-500 hover:text-gray-300'
      }`}
      aria-label={active ? 'Disable shuffle' : 'Enable shuffle'}
      title="Shuffle (S)"
    >
      <svg
        aria-hidden="true"
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"
        />
      </svg>
      {active && (
        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#f5a623]" />
      )}
    </button>
  );
}

function RepeatButton({ mode, onClick }: { mode: RepeatMode; onClick: () => void }) {
  const active = mode !== 'off';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative p-1.5 rounded transition-colors ${
        active ? 'text-[#f5a623]' : 'text-gray-500 hover:text-gray-300'
      }`}
      aria-label={
        mode === 'off' ? 'Enable repeat' : mode === 'all' ? 'Repeat one' : 'Disable repeat'
      }
      title={
        mode === 'off'
          ? 'Repeat (R): Off'
          : mode === 'all'
            ? 'Repeat (R): All'
            : 'Repeat (R): Track'
      }
    >
      <svg
        aria-hidden="true"
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M4.5 12c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.25 7.5l4.5-3-4.5-3M9.75 16.5l-4.5 3 4.5 3"
        />
      </svg>
      {mode === 'one' && (
        <span className="absolute -top-1 -right-1 text-[8px] font-bold text-[#f5a623] bg-black/60 px-1 rounded-full">
          1
        </span>
      )}
      {active && (
        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#f5a623]" />
      )}
    </button>
  );
}
