'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePlayer } from '@/providers/audio';
import { useRadioContext as useRadio } from '@/providers/audio/RadioProvider';
import { communityConfig } from '@/../community.config';
import { MusicIcon, PlayingBars } from './MusicPageUtils';

export function RadioHero({
  player,
  radio,
  onPlayPause,
}: {
  player: ReturnType<typeof usePlayer>;
  radio: ReturnType<typeof useRadio>;
  onPlayPause: () => void;
}) {
  const isPlaying = radio.isRadioMode && player.metadata;

  return (
    <div className="rounded-xl overflow-hidden bg-gradient-to-br from-[#1a2a3a] via-[#0d1b2a] to-[#0a1628] border border-gray-800">
      {isPlaying ? (
        /* ── Now Playing State ──────────────────────────────────── */
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#f5a623] animate-pulse" />
            <p className="text-xs font-semibold text-[#f5a623] uppercase tracking-wider">
              Now Playing
            </p>
            {radio.radioPlaylist && (
              <span className="text-xs text-gray-500 ml-1">
                &middot; {radio.radioPlaylist.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Album art */}
            <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800 shadow-lg ring-1 ring-[#f5a623]/20">
              {player.metadata?.artworkUrl ? (
                <Image
                  src={player.metadata.artworkUrl}
                  alt={player.metadata.trackName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a2a3a] to-[#0a1628]">
                  <MusicIcon className="w-8 h-8 text-[#f5a623]/40" />
                </div>
              )}
              {player.isPlaying && (
                <div className="absolute inset-0 flex items-end justify-center pb-2 bg-gradient-to-t from-black/50 to-transparent">
                  <PlayingBars />
                </div>
              )}
            </div>

            {/* Track info */}
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-white truncate">
                {player.metadata?.trackName || 'Unknown Track'}
              </p>
              {player.metadata?.artistName && (
                <p className="text-sm text-gray-400 truncate mt-0.5">
                  {player.metadata.artistName}
                </p>
              )}
              {radio.radioPlaylist && (
                <p className="text-xs text-gray-500 mt-1">
                  {communityConfig.music.radioName}
                </p>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mt-5">
            <button
              onClick={radio.prevRadioTrack}
              className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Previous track"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            <button
              onClick={onPlayPause}
              disabled={player.isLoading}
              className="w-14 h-14 flex items-center justify-center rounded-full bg-[#f5a623] text-[#0a1628] hover:bg-[#ffd700] disabled:opacity-50 transition-colors shadow-lg shadow-[#f5a623]/25"
              aria-label={player.isPlaying ? 'Pause' : 'Play'}
            >
              {player.isLoading ? (
                <div className="w-5 h-5 border-2 border-[#0a1628] border-t-transparent rounded-full animate-spin" />
              ) : player.isPlaying ? (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              onClick={radio.nextRadioTrack}
              className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Next track"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          </div>

          {/* Listen Together */}
          <div className="flex justify-center mt-4">
            <Link
              href="/calls"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-full transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
              <svg className="w-3.5 h-3.5 -ml-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              Listen Together
            </Link>
          </div>

          {/* Station pills */}
          {radio.availableStations.length > 1 && (
            <div className="flex gap-2 mt-5 overflow-x-auto scrollbar-hide justify-center">
              {radio.availableStations.map((name, i) => (
                <button
                  key={name}
                  onClick={() => radio.switchStation(i)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    i === radio.currentStationIndex
                      ? 'bg-[#f5a623]/20 text-[#f5a623] ring-1 ring-[#f5a623]/30'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── Idle State ─────────────────────────────────────────── */
        <div className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f5a623]/20 to-[#f5a623]/5 flex items-center justify-center">
              <div className="animate-pulse">
                <MusicIcon className="w-8 h-8 text-[#f5a623]" />
              </div>
            </div>
          </div>

          <h2 className="text-xl font-bold text-white mb-1">
            {communityConfig.music.radioName}
          </h2>
          <p className="text-sm text-gray-400 mb-5">
            Community radio powered by Audius
          </p>

          {/* Station picker pills */}
          {communityConfig.music.radioPlaylists.length > 0 && (
            <div className="flex gap-2 justify-center flex-wrap mb-5">
              {communityConfig.music.radioPlaylists.map((pl) => (
                <span
                  key={pl.name}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-gray-400"
                >
                  {pl.name}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={() => radio.startRadio()}
            disabled={radio.radioLoading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#f5a623] text-[#0a1628] font-semibold text-sm hover:bg-[#ffd700] disabled:opacity-50 transition-colors shadow-lg shadow-[#f5a623]/25"
          >
            {radio.radioLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-[#0a1628] border-t-transparent rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Start Listening
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
