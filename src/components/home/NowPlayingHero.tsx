'use client';

import Image from 'next/image';
import { usePlayer } from '@/providers/audio';
import { useRadio } from '@/hooks/useRadio';
import { communityConfig } from '@/../community.config';

export function NowPlayingHero() {
  const player = usePlayer();
  const radio = useRadio();

  const isActive = player.metadata !== null;
  const trackName = player.metadata?.trackName ?? '';
  const artistName = player.metadata?.artistName ?? '';
  const artworkUrl = player.metadata?.artworkUrl ?? '';

  const handlePlayPause = () => {
    if (player.isPlaying) {
      player.pause();
    } else if (player.metadata) {
      player.resume();
    } else {
      radio.startRadio();
    }
  };

  // Progress bar percentage
  const progress = player.duration > 0 ? (player.position / player.duration) * 100 : 0;

  if (!isActive) {
    // Idle state: show radio CTA
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d1b2a] to-[#1a2a3a] border border-gray-800 p-6">
        {/* Decorative background circles */}
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-[#f5a623]/5" />
        <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-[#f5a623]/3" />

        <div className="relative flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#f5a623]/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{communityConfig.music.radioName}</h3>
            <p className="text-xs text-gray-500 mt-1">Tap to start listening</p>
          </div>
          <button
            onClick={handlePlayPause}
            disabled={radio.radioLoading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#f5a623] text-black font-semibold text-sm hover:bg-[#ffd700] transition-colors disabled:opacity-50"
          >
            {radio.radioLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5.14v14l11-7-11-7z" />
                </svg>
                Start Radio
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Active state: show current track
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d1b2a] to-[#1a2a3a] border border-gray-800">
      {/* Blurred background art */}
      {artworkUrl && (
        <div className="absolute inset-0 opacity-20 blur-2xl scale-110">
          <Image
            src={artworkUrl}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      <div className="relative flex items-center gap-4 p-4">
        {/* Album art */}
        <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-800">
          {artworkUrl ? (
            <Image
              src={artworkUrl}
              alt={`${trackName} artwork`}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
              </svg>
            </div>
          )}
        </div>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{trackName}</p>
          <p className="text-xs text-gray-400 truncate mt-0.5">{artistName}</p>

          {/* Progress bar */}
          <div className="mt-3 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#f5a623] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Radio station label */}
          {radio.isRadioMode && radio.radioPlaylist && (
            <p className="text-[10px] text-[#f5a623]/60 mt-1.5">
              {communityConfig.music.radioName} &middot; {radio.radioPlaylist.name}
            </p>
          )}
        </div>

        {/* Play/pause button */}
        <button
          onClick={handlePlayPause}
          className="w-10 h-10 flex-shrink-0 rounded-full bg-[#f5a623] flex items-center justify-center text-black hover:bg-[#ffd700] transition-colors"
          aria-label={player.isPlaying ? 'Pause' : 'Play'}
        >
          {player.isPlaying ? (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5.14v14l11-7-11-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
