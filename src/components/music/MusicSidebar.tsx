'use client';

import Image from 'next/image';
import { Cast } from '@/types';
import { usePlayer } from '@/providers/audio';
import { useMusicQueue } from '@/hooks/useMusicQueue';
import { MusicQueueTrackCard } from './MusicQueueTrackCard';
import { Scrubber } from './Scrubber';

interface MusicSidebarProps {
  messages: Cast[];
  activeChannel: string;
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
}

export function MusicSidebar({
  messages,
  activeChannel,
  isOpen,
  isMobile,
  onClose,
}: MusicSidebarProps) {
  const player = usePlayer();
  const queue = useMusicQueue(messages);

  if (!isOpen) return null;

  const handlePlayPause = () => {
    if (player.isPlaying) player.pause();
    else player.resume();
  };

  // ─── Mobile: bottom sheet ──────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/40 z-30"
          onClick={onClose}
        />

        {/* Bottom sheet */}
        <div className="fixed inset-x-0 bottom-0 z-40 bg-[#0d1b2a] border-t border-gray-800 rounded-t-2xl animate-slide-up max-h-[65vh] flex flex-col">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-700" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2">
            <h3 className="text-sm font-semibold text-white">
              Music Queue
              {queue.length > 0 && (
                <span className="ml-2 text-xs text-gray-500">
                  {queue.length} track{queue.length !== 1 ? 's' : ''}
                </span>
              )}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Queue list */}
          <div className="flex-1 overflow-y-auto pb-4">
            <QueueContent queue={queue} onPlay={onClose} />
          </div>
        </div>
      </>
    );
  }

  // ─── Desktop: right panel ──────────────────────────────────────────────────
  return (
    <div className="hidden md:flex flex-col w-[300px] flex-shrink-0 border-l border-gray-800 bg-[#0d1b2a] animate-slide-in-left overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-[#0a1628] flex-shrink-0">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#f5a623]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
          <h3 className="text-sm font-semibold text-gray-300">
            #{activeChannel} music
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white p-1"
          aria-label="Close music sidebar"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Mini player — shown when something is playing */}
      {player.metadata && (
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-800 bg-[#0a1628]">
          <div className="flex items-center gap-3 mb-3">
            {/* Artwork */}
            <div className="relative w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-gray-800">
              {player.metadata.artworkUrl ? (
                <Image
                  src={player.metadata.artworkUrl}
                  alt={player.metadata.trackName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Track info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {player.metadata.trackName}
              </p>
              {player.metadata.artistName && (
                <p className="text-xs text-gray-400 truncate">
                  {player.metadata.artistName}
                </p>
              )}
            </div>

            {/* Play/pause */}
            <button
              onClick={handlePlayPause}
              disabled={player.isLoading}
              className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-[#f5a623] text-[#0d1b2a] hover:bg-[#f5b84a] disabled:opacity-50 transition-colors"
            >
              {player.isLoading ? (
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="3" className="opacity-25" />
                  <path d="M12 2a10 10 0 0110 10" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                </svg>
              ) : player.isPlaying ? (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </div>

          {/* Scrubber */}
          <Scrubber
            position={player.position}
            duration={player.duration}
            feedId={player.metadata.feedId}
            onSeek={player.seek}
          />
        </div>
      )}

      {/* Queue */}
      <div className="flex-1 overflow-y-auto">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <svg className="w-10 h-10 text-gray-700 mb-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
            <p className="text-sm text-gray-500">No music in #{activeChannel} yet</p>
            <p className="text-xs text-gray-600 mt-1">
              Post a SoundCloud, Spotify, Audius, or YouTube link
            </p>
          </div>
        ) : (
          <div className="py-2">
            <p className="px-4 pb-2 text-xs text-gray-500 font-medium uppercase tracking-wider">
              Up next — {queue.length} track{queue.length !== 1 ? 's' : ''}
            </p>
            <QueueContent queue={queue} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared queue list ────────────────────────────────────────────────────────

function QueueContent({
  queue,
  onPlay,
}: {
  queue: ReturnType<typeof useMusicQueue>;
  onPlay?: () => void;
}) {
  if (queue.length === 0) {
    return (
      <p className="px-4 py-6 text-center text-sm text-gray-500">
        No tracks in this channel yet
      </p>
    );
  }

  return (
    <>
      {queue.map((entry, i) => (
        <MusicQueueTrackCard
          key={entry.url}
          url={entry.url}
          type={entry.type}
          castHash={entry.castHash}
          index={i}
          onPlay={onPlay}
        />
      ))}
    </>
  );
}
