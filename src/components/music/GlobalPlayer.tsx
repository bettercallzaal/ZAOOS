'use client';

import { useEffect, useState, useRef } from 'react';

import { usePlayer } from '@/providers/audio';
import type { RepeatMode } from '@/providers/audio/PlayerProvider';
import { Scrubber } from './Scrubber';
import { formatDuration } from '@/lib/music/formatDuration';
import { ArtworkImage } from '@/components/music/ArtworkImage';
import { AddToPlaylistButton } from '@/components/music/AddToPlaylistButton';
import { LikeButton } from '@/components/music/LikeButton';
import { SleepTimerButton } from '@/components/music/SleepTimerButton';

interface GlobalPlayerProps {
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  queueLength?: number;
  onToggleQueue?: () => void;
  queueOpen?: boolean;
  isRadioMode?: boolean;
}

export function GlobalPlayer({
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
  queueLength = 0,
  onToggleQueue,
  queueOpen = false,
  isRadioMode = false,
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

  const { metadata, isPlaying, isLoading, isError, error: playerError, position, duration } = player;

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

      {/* Error banner */}
      {isError && playerError && (
        <div className="px-4 py-1.5 bg-red-900/40 border-b border-red-800/30 flex items-center justify-between relative z-10">
          <p className="text-xs text-red-300">{playerError}</p>
          <button onClick={() => player.pause()} className="text-red-400 hover:text-white text-xs ml-3 flex-shrink-0">Dismiss</button>
        </div>
      )}

      {/* ─── Desktop: full bar ─────────────────────────────────────── */}
      <div className="hidden sm:flex items-center gap-4 px-4 py-2.5 relative z-10">
        {/* Left: Artwork + Track info */}
        <div className="flex items-center gap-3 w-56 flex-shrink-0">
          <div className={`relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800 shadow-lg ${isPlaying ? 'ring-1 ring-[#f5a623]/30' : ''}`}>
            <ArtworkImage
              src={metadata.artworkUrl}
              alt={metadata.trackName}
              fill
              className="object-cover"
            />
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

        {/* Right: Volume + Sleep Timer + Queue + playlist + platform badge */}
        <div className="flex items-center gap-3 w-56 flex-shrink-0 justify-end">
          {/* Like */}
          <LikeButton songUrl={metadata.url} compact />

          {/* Add to playlist */}
          <AddToPlaylistButton songUrl={metadata.url} compact />

          {/* Volume */}
          <div className="flex items-center gap-1.5 group">
            <button
              onClick={() => player.setVolume(player.volume > 0 ? 0 : 1)}
              className="text-gray-400 hover:text-white transition-colors p-0.5"
              aria-label={player.volume === 0 ? 'Unmute' : 'Mute'}
            >
              {player.volume === 0 ? (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : player.volume < 0.5 ? (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
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
              className="w-16 h-1 accent-[#f5a623] cursor-pointer opacity-70 group-hover:opacity-100 transition-opacity"
              aria-label="Volume"
            />
          </div>

          {/* Sleep Timer */}
          <SleepTimerButton compact />

          {isRadioMode && (
            <span className="text-[10px] font-semibold text-[#f5a623] bg-[#f5a623]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.5l16.5-4.125M12 6.75c-2.708 0-5.363.224-7.948.655C2.999 7.58 2.25 8.507 2.25 9.574v9.176A2.25 2.25 0 004.5 21h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169A48.329 48.329 0 0012 6.75z" />
              </svg>
              RADIO
            </span>
          )}
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
            onClick={(e) => { e.stopPropagation(); player.pause(); }}
            className="text-gray-500 hover:text-gray-300 transition-colors p-1"
            aria-label="Dismiss player"
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
        <div
          role="progressbar"
          aria-label="Playback progress"
          aria-valuemin={0}
          aria-valuemax={duration > 0 ? Math.round(duration) : 100}
          aria-valuenow={Math.round(position)}
          aria-valuetext={`${formatDuration(position)} of ${formatDuration(duration)}`}
          className="h-1 bg-gray-800 w-full"
        >
          <div
            className="h-full bg-[#f5a623] transition-[width] duration-300"
            style={{ width: duration > 0 ? `${(position / duration) * 100}%` : '0%' }}
          />
        </div>

        <div className="flex items-center gap-3 px-3 py-2">
          {/* Artwork */}
          <div className={`relative w-11 h-11 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800 ${isPlaying ? 'ring-1 ring-[#f5a623]/30' : ''}`}>
            <ArtworkImage
              src={metadata.artworkUrl}
              alt={metadata.trackName}
              fill
              className="object-cover"
            />
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

          {/* Volume (mobile) */}
          <VolumeButton player={player} />

          {/* Like (mobile) */}
          <LikeButton songUrl={metadata.url} compact className="flex-shrink-0" />

          {/* Add to playlist (mobile) */}
          <AddToPlaylistButton songUrl={metadata.url} compact className="flex-shrink-0" />

          {/* Controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onPrev}
              disabled={!hasPrev}
              className="text-gray-400 p-2.5 disabled:opacity-30"
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
              disabled={!hasNext && player.repeat === 'off'}
              className="text-gray-400 p-2.5 disabled:opacity-30"
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
      className={`relative p-1 rounded transition-colors ${active ? 'text-[#f5a623]' : 'text-gray-500 hover:text-gray-300'}`}
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

function VolumeButton({ player }: { player: ReturnType<typeof usePlayer> }) {
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
        className="p-1.5 text-gray-400 hover:text-white transition-colors"
        aria-label={player.volume === 0 ? 'Unmute' : 'Volume'}
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
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-[#111827] border border-gray-700 rounded-xl shadow-2xl shadow-black/60 p-3 z-50 w-12 flex flex-col items-center gap-2">
          <span className="text-[10px] text-gray-400 tabular-nums">
            {Math.round(player.volume * 100)}
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={player.volume}
            onChange={(e) => player.setVolume(parseFloat(e.target.value))}
            className="w-24 h-1 accent-[#f5a623] cursor-pointer -rotate-90 origin-center"
            style={{ width: '80px' }}
            aria-label="Volume"
          />
          <button
            onClick={() => player.setVolume(player.volume > 0 ? 0 : 1)}
            className="text-[10px] text-gray-500 hover:text-white transition-colors"
            aria-label={player.volume === 0 ? 'Unmute' : 'Mute'}
          >
            {player.volume === 0 ? 'Unmute' : 'Mute'}
          </button>
        </div>
      )}
    </div>
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
