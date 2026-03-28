'use client';

import { useRef, useCallback, useState } from 'react';
import { usePlayer } from '@/providers/audio';
import { formatDuration } from '@/lib/music/formatDuration';
import { ArtworkImage } from '@/components/music/ArtworkImage';
import { Scrubber } from '@/components/music/Scrubber';
import { WaveformComments } from '@/components/music/WaveformComments';
import { LikeButton } from '@/components/music/LikeButton';
import { AddToPlaylistButton } from '@/components/music/AddToPlaylistButton';
import { ShareToChatButton } from '@/components/music/ShareToChatButton';
import { TrackReactions } from '@/components/music/TrackReactions';
import { LyricsPanel } from '@/components/music/LyricsPanel';
import { AudioFiltersPanel, getActiveFilterKey } from '@/components/music/AudioFiltersPanel';
import { SleepTimer } from '@/components/music/SleepTimer';
import { ShareMenu } from '@/components/music/ShareMenu';
import { QueuePanel } from '@/components/music/QueuePanel';
import { useQueue } from '@/contexts/QueueContext';
import type { TrackMetadata } from '@/types/music';

interface ExpandedPlayerProps {
  metadata: TrackMetadata;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export function ExpandedPlayer({ metadata, onClose, onPrev, onNext }: ExpandedPlayerProps) {
  const player = usePlayer();
  const { queueLength } = useQueue();
  const { isPlaying, isLoading, position, duration } = player;
  const [showLyrics, setShowLyrics] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  // ─── Swipe down to dismiss ──────────────────────────────────────────
  const touchStartY = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (dy > 80) onClose(); // swipe down > 80px = dismiss
  }, [onClose]);

  // ─── Swipe left/right to skip ──────────────────────────────────────
  const touchStartX = useRef(0);

  const onArtworkTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const onArtworkTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx > 0 && onPrev) { onPrev(); navigator.vibrate?.(10); }
      else if (dx < 0 && onNext) { onNext(); navigator.vibrate?.(10); }
    }
  }, [onPrev, onNext]);

  const handlePlayPause = () => {
    if (isPlaying) player.pause();
    else player.resume();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0a1628] flex flex-col"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ─── Header: drag handle + close ───────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-white transition-colors"
          aria-label="Close expanded player"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="w-10 h-1 rounded-full bg-gray-700" />
        <div className="w-9" /> {/* spacer for centering */}
      </div>

      {/* ─── Artwork / Lyrics (large, swipeable) ─────────────────── */}
      <div
        className="flex-1 flex items-center justify-center px-8 min-h-0"
        onTouchStart={onArtworkTouchStart}
        onTouchEnd={onArtworkTouchEnd}
      >
        {showLyrics ? (
          <div className="w-full max-w-[360px] h-full flex flex-col bg-white/5 rounded-2xl overflow-hidden">
            <LyricsPanel
              trackName={metadata.trackName}
              artistName={metadata.artistName || ''}
              className="flex-1 min-h-0"
            />
          </div>
        ) : (
          <div className={`relative w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden bg-gray-800 shadow-2xl ${
            isPlaying ? 'ring-2 ring-[#f5a623]/20 shadow-[#f5a623]/10' : ''
          }`}>
            <ArtworkImage
              src={metadata.artworkUrl}
              alt={metadata.trackName}
              fill
              className="object-cover"
              sizes="320px"
            />
            {isPlaying && (
              <div className="absolute inset-0 flex items-end justify-center pb-4 bg-gradient-to-t from-black/30 to-transparent">
                <div className="flex items-end gap-1">
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
            {/* Swipe hint */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
              <span className="text-[9px] text-white/30 bg-black/20 px-2 py-0.5 rounded-full">
                Swipe to skip
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ─── Track info ────────────────────────────────────────────── */}
      <div className="px-8 pt-6 pb-2 flex-shrink-0">
        <p className="text-xl font-bold text-white truncate">{metadata.trackName}</p>
        {metadata.artistName && (
          <p className="text-sm text-gray-400 truncate mt-1">{metadata.artistName}</p>
        )}
      </div>

      {/* ─── Scrubber ──────────────────────────────────────────────── */}
      <div className="px-8 py-2 flex-shrink-0">
        <Scrubber
          position={position}
          duration={duration}
          feedId={metadata.feedId}
          onSeek={player.seek}
        />
      </div>

      {/* ─── Waveform Comments ───────────────────────────────────── */}
      <div className="px-8 py-1 flex-shrink-0">
        <WaveformComments
          songUrl={metadata.url}
          duration={duration}
          position={position}
        />
      </div>

      {/* ─── Transport controls ────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-6 py-4 flex-shrink-0">
        {/* Shuffle */}
        <button
          onClick={player.toggleShuffle}
          className={`p-2 rounded-full transition-colors ${player.shuffle ? 'text-[#f5a623]' : 'text-gray-500'}`}
          aria-label={player.shuffle ? 'Disable shuffle' : 'Enable shuffle'}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
          </svg>
        </button>

        {/* Previous */}
        <button
          onClick={onPrev}
          disabled={!onPrev}
          className="p-2 text-gray-300 hover:text-white disabled:opacity-30 transition-colors"
          aria-label="Previous"
        >
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          onClick={handlePlayPause}
          disabled={isLoading}
          className="w-16 h-16 flex items-center justify-center rounded-full bg-[#f5a623] text-[#0a1628] hover:bg-[#ffd700] active:scale-95 transition-all disabled:opacity-60 shadow-lg shadow-[#f5a623]/25"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isLoading ? (
            <div className="w-6 h-6 border-3 border-[#0a1628] border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-7 h-7 ml-1" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Next */}
        <button
          onClick={onNext}
          disabled={!onNext}
          className="p-2 text-gray-300 hover:text-white disabled:opacity-30 transition-colors"
          aria-label="Next"
        >
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>

        {/* Repeat */}
        <button
          onClick={player.cycleRepeat}
          className={`relative p-2 rounded-full transition-colors ${player.repeat !== 'off' ? 'text-[#f5a623]' : 'text-gray-500'}`}
          aria-label="Repeat"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M4.5 12c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 7.5l4.5-3-4.5-3M9.75 16.5l-4.5 3 4.5 3" />
          </svg>
          {player.repeat === 'one' && (
            <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold text-[#f5a623]">1</span>
          )}
        </button>
      </div>

      {/* ─── Action buttons + Volume ───────────────────────────────── */}
      <div className="px-8 pb-6 flex-shrink-0 space-y-4">
        {/* Actions row */}
        <div className="flex items-center justify-between">
          <LikeButton songUrl={metadata.url} className="flex-shrink-0" />
          <AddToPlaylistButton songUrl={metadata.url} className="flex-shrink-0" />
          <ShareToChatButton songUrl={metadata.url} trackName={metadata.trackName} className="flex-shrink-0" />

          {/* Lyrics toggle */}
          <button
            onClick={() => setShowLyrics((v) => !v)}
            className={`p-1.5 rounded-lg text-sm font-bold transition-colors ${
              showLyrics ? 'text-[#f5a623] bg-[#f5a623]/10' : 'text-gray-400 hover:text-white'
            }`}
            aria-label={showLyrics ? 'Hide lyrics' : 'Show lyrics'}
            title={showLyrics ? 'Hide lyrics' : 'Show lyrics'}
          >
            Aa
          </button>

          {/* Share menu (Farcaster, X, copy link, download card) */}
          <ShareMenu
            trackName={metadata.trackName}
            artistName={metadata.artistName || ''}
            artworkUrl={metadata.artworkUrl}
            trackUrl={metadata.url}
          />

          {/* Crossfade toggle */}
          <button
            onClick={() => player.setCrossfade(player.crossfade > 0 ? 0 : 3)}
            className={`p-1.5 rounded-lg transition-colors ${
              player.crossfade > 0 ? 'text-[#f5a623] bg-[#f5a623]/10' : 'text-gray-400 hover:text-white'
            }`}
            aria-label={player.crossfade > 0 ? `Crossfade ${player.crossfade}s` : 'Enable crossfade'}
            title={player.crossfade > 0 ? `Crossfade: ${player.crossfade}s` : 'Crossfade: off'}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          </button>

          {/* Sleep timer */}
          <SleepTimer />

          {/* Audio filters toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`p-1.5 rounded-lg transition-colors ${
              showFilters || getActiveFilterKey()
                ? 'text-[#f5a623] bg-[#f5a623]/10'
                : 'text-gray-400 hover:text-white'
            }`}
            aria-label={showFilters ? 'Hide audio filters' : 'Show audio filters'}
            title={showFilters ? 'Hide filters' : 'Audio filters'}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
          </button>

          {/* Queue toggle */}
          <button
            onClick={() => setShowQueue((v) => !v)}
            className={`relative p-1.5 rounded-lg transition-colors ${
              showQueue ? 'text-[#f5a623] bg-[#f5a623]/10' : 'text-gray-400 hover:text-white'
            }`}
            aria-label={showQueue ? 'Hide queue' : 'Up Next'}
            title={showQueue ? 'Hide queue' : 'Up Next'}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
            </svg>
            {queueLength > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#f5a623] text-[8px] font-bold text-[#0a1628] flex items-center justify-center">
                {queueLength > 9 ? '9+' : queueLength}
              </span>
            )}
          </button>

          {/* Platform badge */}
          <span className="text-[10px] text-gray-500 bg-white/5 px-2.5 py-1 rounded-full capitalize">
            {metadata.type === 'applemusic' ? 'Apple Music' : metadata.type === 'soundxyz' ? 'Sound.xyz' : metadata.type}
          </span>
        </div>

        {/* Audio filters panel */}
        <AudioFiltersPanel visible={showFilters} />

        {/* Queue panel */}
        {showQueue && (
          <QueuePanel onClose={() => setShowQueue(false)} />
        )}

        {/* Emoji reactions */}
        <TrackReactions songUrl={metadata.url} className="justify-center" />

        {/* Volume slider */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => player.setVolume(player.volume > 0 ? 0 : 1)}
            className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
            aria-label={player.volume === 0 ? 'Unmute' : 'Mute'}
          >
            {player.volume === 0 ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
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
    </div>
  );
}
