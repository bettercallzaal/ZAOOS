'use client';

import { m } from 'motion/react';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AddToPlaylistButton } from '@/components/music/AddToPlaylistButton';
import { ArtworkImage } from '@/components/music/ArtworkImage';
import { LikeButton } from '@/components/music/LikeButton';
import { Scrubber } from '@/components/music/Scrubber';
import { SleepTimer } from '@/components/music/SleepTimer';
import { WaveformComments } from '@/components/music/WaveformComments';
import { useQueue } from '@/contexts/QueueContext';
import { extractDominantColor } from '@/lib/music/colorExtractor';
import { usePlayer } from '@/providers/audio';
import type { TrackMetadata } from '@/types/music';

// Defer panels so initial bundle chunk stays slim
const LyricsPanel = dynamic(
  () => import('@/components/music/LyricsPanel').then((m) => ({ default: m.LyricsPanel })),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 min-h-0 flex items-center justify-center text-xs text-gray-500">
        Loading lyrics...
      </div>
    ),
  },
);

const QueuePanel = dynamic(
  () => import('@/components/music/QueuePanel').then((m) => ({ default: m.QueuePanel })),
  { ssr: false },
);

const ShareMenu = dynamic(
  () => import('@/components/music/ShareMenu').then((m) => ({ default: m.ShareMenu })),
  { ssr: false },
);

const SpectrumVisualizer = dynamic(() => import('@/components/music/SpectrumVisualizer'), {
  ssr: false,
});

const EqualizerPanel = dynamic(() => import('@/components/music/EqualizerPanel'), { ssr: false });

const AudioFiltersPanel = dynamic(
  () =>
    import('@/components/music/AudioFiltersPanel').then((m) => ({ default: m.AudioFiltersPanel })),
  { ssr: false },
);

interface ExpandedPlayerProps {
  metadata: TrackMetadata;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

type MainTab = 'playing' | 'lyrics' | 'queue';

export function ExpandedPlayer({ metadata, onClose, onPrev, onNext }: ExpandedPlayerProps) {
  const player = usePlayer();
  const { queueLength } = useQueue();
  const { isPlaying, isLoading, position, duration } = player;
  const [bgColor, setBgColor] = useState({ r: 10, g: 22, b: 40 }); // navy default
  const [activeTab, setActiveTab] = useState<MainTab>('playing');
  const [overlayPanel, setOverlayPanel] = useState<'eq' | 'share' | null>(null);

  useEffect(() => {
    if (!metadata?.artworkUrl) return;
    let cancelled = false;
    extractDominantColor(metadata.artworkUrl)
      .then((color) => {
        if (!cancelled) setBgColor(color);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [metadata?.artworkUrl]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      const target = e.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ') {
        e.preventDefault();
        if (isPlaying) player.pause();
        else player.resume();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        player.seek(Math.max(0, position - 5000));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        player.seek(Math.min(duration, position + 5000));
      } else if (e.key === 'l' || e.key === 'L') {
        setActiveTab((t) => (t === 'lyrics' ? 'playing' : 'lyrics'));
      } else if (e.key === 'q' || e.key === 'Q') {
        setActiveTab((t) => (t === 'queue' ? 'playing' : 'queue'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isPlaying, player, position, duration]);

  // Touch swipe to dismiss
  const touchStartY = useRef(0);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      if (dy > 80) onClose(); // swipe down > 80px = dismiss
    },
    [onClose],
  );

  // Swipe left/right on artwork to skip
  const touchStartX = useRef(0);
  const onArtworkTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const onArtworkTouchEnd = useCallback(
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

  const handlePlayPause = () => {
    if (isPlaying) player.pause();
    else player.resume();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#070d18] text-white flex flex-col select-none overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ─── Spotify Ambient Mesh Gradient ─────────────────────────── */}
      <div
        className="absolute inset-0 transition-colors duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 20%, rgba(${bgColor.r}, ${bgColor.g}, ${bgColor.b}, 0.55) 0%, rgba(${Math.round(
            bgColor.r * 0.25,
          )}, ${Math.round(bgColor.g * 0.25)}, ${Math.round(bgColor.b * 0.25)}, 0.4) 50%, #070d18 90%)`,
        }}
      />
      <div className="absolute inset-0 backdrop-blur-2xl pointer-events-none" />

      {/* ─── Top Bar: Close, Segmented Switcher, Minimize ─────────── */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          aria-label="Close expanded player"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Spotify-style Segmented View Switcher */}
        <div className="flex items-center bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/10">
          <button
            type="button"
            data-testid="tab-playing"
            onClick={() => setActiveTab('playing')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeTab === 'playing'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Now Playing
          </button>
          <button
            type="button"
            data-testid="tab-lyrics"
            onClick={() => setActiveTab('lyrics')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeTab === 'lyrics'
                ? 'bg-white/20 text-[#f5a623] shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Lyrics
          </button>
          <button
            type="button"
            data-testid="tab-queue"
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeTab === 'queue'
                ? 'bg-white/20 text-[#f5a623] shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>Queue</span>
            {queueLength > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#f5a623] text-[9px] font-bold text-[#0a1628] flex items-center justify-center">
                {queueLength > 9 ? '9+' : queueLength}
              </span>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-colors hidden sm:block"
        >
          Done
        </button>
        <div className="w-8 sm:hidden" />
      </div>

      {/* ─── Center Viewport Stage ─────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col min-h-0 px-6 py-2 overflow-hidden">
        {activeTab === 'lyrics' && (
          <div className="w-full max-w-xl mx-auto h-full flex flex-col bg-black/30 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 p-2">
            <LyricsPanel
              trackName={metadata.trackName}
              artistName={metadata.artistName || ''}
              className="flex-1 min-h-0"
            />
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="w-full max-w-xl mx-auto h-full flex flex-col">
            <QueuePanel fullHeight onClose={() => setActiveTab('playing')} />
          </div>
        )}

        {activeTab === 'playing' && (
          <div
            className="flex-1 flex flex-col items-center justify-center min-h-0"
            onTouchStart={onArtworkTouchStart}
            onTouchEnd={onArtworkTouchEnd}
          >
            {/* Artwork with subtle dynamic amber pulse */}
            <m.div
              layoutId="player-artwork"
              className={`relative w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 rounded-2xl overflow-hidden bg-gray-900 shadow-2xl flex-shrink-0 transition-transform duration-300 ${
                isPlaying
                  ? 'ring-2 ring-[#f5a623]/30 shadow-[#f5a623]/20 scale-100'
                  : 'scale-95 opacity-90'
              }`}
            >
              <ArtworkImage
                src={metadata.artworkUrl}
                alt={metadata.trackName}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 256px, 288px"
              />
              {isPlaying && (
                <div className="absolute inset-0 flex items-end justify-center pb-4 bg-gradient-to-t from-black/40 via-transparent to-transparent">
                  <div className="flex items-end gap-1 px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-1 bg-[#f5a623] rounded-full animate-bounce"
                        style={{
                          height: `${10 + i * 4}px`,
                          animationDelay: `${i * 0.12}s`,
                          animationDuration: '0.6s',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </m.div>

            {/* Spectrum Visualizer under artwork */}
            {isPlaying && (
              <div className="w-full max-w-xs h-8 mt-4 opacity-80">
                <SpectrumVisualizer isPlaying={isPlaying} className="h-full" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Waveform Comments (if in playing tab) ─────────────────── */}
      {activeTab === 'playing' && (
        <div className="relative z-10 px-8 py-1 flex-shrink-0 max-w-xl mx-auto w-full">
          <WaveformComments
            songUrl={metadata.url}
            duration={duration}
            position={position}
            onSeek={(ms) => player.seek(ms)}
          />
        </div>
      )}

      {/* ─── Anchored Bottom Audio Controls ────────────────────────── */}
      <div className="relative z-10 bg-black/30 backdrop-blur-xl border-t border-white/[0.06] px-6 pt-3 pb-5 flex-shrink-0 max-w-2xl mx-auto w-full rounded-t-3xl">
        {/* Track info & quick like */}
        <div className="flex items-center justify-between mb-2">
          <div className="min-w-0 pr-4">
            <h2 className="text-lg font-bold text-white truncate tracking-tight">
              {metadata.trackName}
            </h2>
            <p className="text-sm text-gray-400 truncate">
              {metadata.artistName || 'Unknown Artist'}
            </p>
          </div>
          <LikeButton songUrl={metadata.url} compact className="flex-shrink-0" />
        </div>

        {/* Scrubber */}
        <div className="py-1">
          <Scrubber
            position={position}
            duration={duration}
            feedId={metadata.feedId}
            onSeek={player.seek}
          />
        </div>

        {/* Transport controls */}
        <div className="flex items-center justify-center gap-6 py-2">
          {/* Shuffle */}
          <button
            type="button"
            onClick={player.toggleShuffle}
            className={`p-2 rounded-full transition-colors ${
              player.shuffle ? 'text-[#f5a623]' : 'text-gray-500 hover:text-white'
            }`}
            aria-label={player.shuffle ? 'Disable shuffle' : 'Enable shuffle'}
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"
              />
            </svg>
          </button>

          {/* Previous */}
          <button
            type="button"
            onClick={onPrev}
            disabled={!onPrev}
            className="p-2 text-gray-300 hover:text-white disabled:opacity-30 transition-colors"
            aria-label="Previous"
          >
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
            </svg>
          </button>

          {/* Play/Pause */}
          <button
            type="button"
            onClick={handlePlayPause}
            disabled={isLoading}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-[#f5a623] text-[#0a1628] hover:bg-[#ffd700] hover:scale-105 active:scale-95 transition-all disabled:opacity-60 shadow-lg shadow-[#f5a623]/25"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-[#0a1628] border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg
                className="w-6 h-6 ml-0.5"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Next */}
          <button
            type="button"
            onClick={onNext}
            disabled={!onNext}
            className="p-2 text-gray-300 hover:text-white disabled:opacity-30 transition-colors"
            aria-label="Next"
          >
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>

          {/* Repeat */}
          <button
            type="button"
            onClick={player.cycleRepeat}
            className={`relative p-2 rounded-full transition-colors ${
              player.repeat !== 'off' ? 'text-[#f5a623]' : 'text-gray-500 hover:text-white'
            }`}
            aria-label="Repeat"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
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
            {player.repeat === 'one' && (
              <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold text-[#f5a623]">
                1
              </span>
            )}
          </button>
        </div>

        {/* Drawer content for EQ or Share */}
        {overlayPanel !== null && (
          <div className="mt-3 p-3 bg-white/5 rounded-xl border border-white/10 max-h-40 overflow-y-auto">
            {overlayPanel === 'share' && (
              <div className="flex justify-center py-1">
                <ShareMenu
                  trackName={metadata.trackName}
                  artistName={metadata.artistName || ''}
                  artworkUrl={metadata.artworkUrl}
                  trackUrl={metadata.url}
                />
              </div>
            )}
            {overlayPanel === 'eq' && (
              <>
                <EqualizerPanel />
                <AudioFiltersPanel visible />
              </>
            )}
          </div>
        )}

        {/* Action utility bar & Volume */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1">
            <AddToPlaylistButton songUrl={metadata.url} compact className="flex-shrink-0" />

            <button
              type="button"
              onClick={() => setActiveTab((t) => (t === 'lyrics' ? 'playing' : 'lyrics'))}
              className={`p-2 rounded-lg transition-colors ${
                activeTab === 'lyrics'
                  ? 'text-[#f5a623] bg-white/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              aria-label="Lyrics"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V4.5l-10.5 3v7.003"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 19.875a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab((t) => (t === 'queue' ? 'playing' : 'queue'))}
              className={`relative p-2 rounded-lg transition-colors ${
                activeTab === 'queue'
                  ? 'text-[#f5a623] bg-white/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              aria-label="Queue"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
                />
              </svg>
              {queueLength > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#f5a623] text-[8px] font-bold text-[#0a1628] flex items-center justify-center">
                  {queueLength > 9 ? '9+' : queueLength}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setOverlayPanel((p) => (p === 'eq' ? null : 'eq'))}
              className={`p-2 rounded-lg transition-colors ${
                overlayPanel === 'eq'
                  ? 'text-[#f5a623] bg-white/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              aria-label="Equalizer"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => setOverlayPanel((p) => (p === 'share' ? null : 'share'))}
              className={`p-2 rounded-lg transition-colors ${
                overlayPanel === 'share'
                  ? 'text-[#f5a623] bg-white/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              aria-label="Share"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
                />
              </svg>
            </button>

            <SleepTimer />
          </div>

          {/* Volume slider */}
          <div className="flex items-center gap-2 max-w-[130px] w-full">
            <button
              type="button"
              onClick={() => player.setVolume(player.volume > 0 ? 0 : 1)}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Mute"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                {player.volume === 0 ? (
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                ) : (
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                )}
              </svg>
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={player.volume}
              onChange={(e) => player.setVolume(parseFloat(e.target.value))}
              className="w-full h-1 accent-[#f5a623] cursor-pointer bg-white/20 rounded-full"
              aria-label="Volume"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
