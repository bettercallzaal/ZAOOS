'use client';

import { usePathname } from 'next/navigation';
import { usePlayer } from '@/providers/audio';
import Image from 'next/image';
import { formatDuration } from '@/lib/music/formatDuration';
import { ShareToFarcaster, shareTemplates } from '@/components/social/ShareToFarcaster';
import { ArtworkImage } from '@/components/music/ArtworkImage';

/**
 * Persistent music player that renders on ALL authenticated pages.
 * Sits above the bottom nav, only visible when a track is loaded.
 * Shows minimal controls — play/pause, track info, progress.
 * Full queue/prev/next controls are in ChatRoom's GlobalPlayer.
 */
export function PersistentPlayer() {
  const player = usePlayer();
  const pathname = usePathname();

  // Don't render on chat page (ChatRoom has its own full-featured GlobalPlayer)
  // Don't render if nothing is loaded
  if (pathname.startsWith('/chat') || !player.metadata) return null;

  const { metadata, isPlaying, isLoading, position, duration } = player;

  const handlePlayPause = () => {
    if (isPlaying) player.pause();
    else player.resume();
  };

  return (
    <div className="fixed bottom-14 md:bottom-0 left-0 right-0 z-30 bg-[#0d1b2a]/95 backdrop-blur-xl border-t border-gray-800/80">
      {/* Thin progress bar */}
      <div className="h-0.5 bg-gray-800 w-full">
        <div
          className="h-full bg-[#f5a623] transition-[width] duration-300"
          style={{ width: duration > 0 ? `${(position / duration) * 100}%` : '0%' }}
        />
      </div>

      <div className="flex items-center gap-3 px-3 py-2">
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

        {/* Share + Platform badge */}
        <ShareToFarcaster
          template={shareTemplates.song(metadata.trackName, metadata.artistName || 'Unknown', metadata.url)}
          variant="icon"
        />
        <span className="text-[9px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded capitalize flex-shrink-0">
          {metadata.type === 'applemusic' ? 'Apple' : metadata.type === 'soundxyz' ? 'Sound' : metadata.type}
        </span>

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

        {/* Close */}
        <button
          onClick={() => player.stop()}
          className="text-gray-500 hover:text-gray-300 transition-colors p-1 flex-shrink-0"
          aria-label="Close player"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
