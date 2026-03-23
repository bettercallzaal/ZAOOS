'use client';

import { usePlayer } from '@/providers/audio';
import { formatDuration } from '@/lib/music/formatDuration';
import { ArtworkImage } from '@/components/music/ArtworkImage';
import { communityConfig } from '@/../community.config';

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

  const hasTrack = !!player.metadata;

  // ─── Idle state: "ZAO Radio — tap to play" ────────────────────────
  if (!hasTrack) {
    return (
      <div className="fixed bottom-14 md:bottom-0 left-0 right-0 z-30 bg-[#0d1b2a]/95 backdrop-blur-xl border-t border-gray-800/80">
        <div className="flex items-center gap-3 px-3 py-2.5">
          {/* Radio icon */}
          <div className="w-9 h-9 rounded-lg bg-[#f5a623]/15 flex items-center justify-center flex-shrink-0">
            <svg className="w-4.5 h-4.5 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.5l16.5-4.125M12 6.75c-2.708 0-5.363.224-7.948.655C2.999 7.58 2.25 8.507 2.25 9.574v9.176A2.25 2.25 0 004.5 21h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169A48.329 48.329 0 0012 6.75z" />
            </svg>
          </div>

          {/* Label */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#f5a623]">{communityConfig.music.radioName}</p>
            <p className="text-xs text-gray-500">Tap to play</p>
          </div>

          {/* Play button — starts radio */}
          <button
            onClick={isRadioMode ? onRadioStop : onRadioStart}
            disabled={radioLoading}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#f5a623] text-[#0d1b2a] active:scale-95 transition-transform disabled:opacity-60 flex-shrink-0"
            aria-label={isRadioMode ? 'Stop radio' : 'Start radio'}
          >
            {radioLoading ? (
              <div className="w-4 h-4 border-2 border-[#0d1b2a] border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
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
    );
  }

  // ─── Active state: track playing ──────────────────────────────────
  const metadata = player.metadata!;
  const { isPlaying, isLoading, position, duration } = player;

  const handlePlayPause = () => {
    if (isPlaying) player.pause();
    else player.resume();
  };

  return (
    <div className="fixed bottom-14 md:bottom-0 left-0 right-0 z-30 bg-[#0d1b2a]/95 backdrop-blur-xl border-t border-gray-800/80">
      {/* Seekable progress bar */}
      <div
        className="h-1.5 bg-gray-800 w-full cursor-pointer group hover:h-2.5 transition-all"
        onClick={(e) => {
          if (duration <= 0) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const fraction = (e.clientX - rect.left) / rect.width;
          player.seek(fraction * duration);
        }}
      >
        <div
          className="h-full bg-[#f5a623] transition-[width] duration-300 pointer-events-none"
          style={{ width: duration > 0 ? `${(position / duration) * 100}%` : '0%' }}
        />
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5">
        {/* Artwork */}
        <div className={`relative w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800 ${isPlaying ? 'ring-1 ring-[#f5a623]/30' : ''}`}>
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
        </div>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{metadata.trackName}</p>
          <div className="flex items-center gap-2">
            {metadata.artistName && (
              <p className="text-xs text-gray-400 truncate">{metadata.artistName}</p>
            )}
            <span className="text-[9px] text-gray-500 tabular-nums flex-shrink-0">
              {formatDuration(position)} / {formatDuration(duration)}
            </span>
          </div>
        </div>

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

        {/* Stop */}
        <button
          onClick={() => player.stop()}
          className="text-gray-500 hover:text-gray-300 transition-colors p-1 flex-shrink-0"
          aria-label="Stop"
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
  );
}
