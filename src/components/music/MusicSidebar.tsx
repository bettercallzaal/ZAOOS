'use client';

import Image from 'next/image';
import { Cast } from '@/types';
import { usePlayer } from '@/providers/audio';
import { useMusicQueue } from '@/hooks/useMusicQueue';
import { MusicQueueTrackCard } from './MusicQueueTrackCard';
import { RadioButton } from './RadioButton';
import { Scrubber } from './Scrubber';
import { formatDuration } from '@/lib/music/formatDuration';

interface MusicSidebarProps {
  messages: Cast[];
  activeChannel: string;
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
  isRadioMode?: boolean;
  radioLoading?: boolean;
  onRadioStart?: () => void;
  onRadioStop?: () => void;
  radioPlaylistName?: string;
}

export function MusicSidebar({
  messages,
  activeChannel,
  isOpen,
  isMobile,
  onClose,
  isRadioMode = false,
  radioLoading = false,
  onRadioStart,
  onRadioStop,
  radioPlaylistName,
}: MusicSidebarProps) {
  const player = usePlayer();
  const queue = useMusicQueue(messages);

  if (!isOpen) return null;

  const handlePlayPause = () => {
    if (player.isPlaying) player.pause();
    else player.resume();
  };

  const currentIndex = queue.findIndex((q) => q.castHash === player.metadata?.feedId);

  // ─── Mobile: bottom sheet ──────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />

        <div className="fixed inset-x-0 bottom-0 z-50 bg-[#0d1b2a] border-t border-gray-800 rounded-t-2xl animate-slide-up max-h-[75vh] flex flex-col pb-[env(safe-area-inset-bottom)]">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-700" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800/50">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#f5a623]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
              <h3 className="text-sm font-semibold text-white">
                #{activeChannel} Music
              </h3>
              <span className="text-xs text-gray-500">
                {queue.length} track{queue.length !== 1 ? 's' : ''}
              </span>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Radio button */}
          {onRadioStart && onRadioStop && (
            <RadioButton
              isRadioMode={isRadioMode}
              radioLoading={radioLoading}
              onStart={onRadioStart}
              onStop={onRadioStop}
              variant="full"
              playlistName={radioPlaylistName}
            />
          )}

          {/* Now Playing — prominent mobile card */}
          {player.metadata && <NowPlayingCard player={player} onPlayPause={handlePlayPause} />}

          {/* Queue list */}
          <div className="flex-1 overflow-y-auto pb-4">
            <QueueContent queue={queue} currentIndex={currentIndex} onPlay={onClose} />
          </div>
        </div>
      </>
    );
  }

  // ─── Desktop: right panel ──────────────────────────────────────────────────
  return (
    <div className="hidden md:flex flex-col w-[320px] flex-shrink-0 border-l border-gray-800 bg-[#0d1b2a] animate-slide-in-left overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-[#0a1628] flex-shrink-0">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#f5a623]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
          <h3 className="text-sm font-semibold text-white">
            #{activeChannel}
          </h3>
          <span className="text-xs text-gray-500">
            {queue.length} track{queue.length !== 1 ? 's' : ''}
          </span>
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

      {/* Radio button */}
      {onRadioStart && onRadioStop && (
        <RadioButton
          isRadioMode={isRadioMode}
          radioLoading={radioLoading}
          onStart={onRadioStart}
          onStop={onRadioStop}
          variant="full"
          playlistName={radioPlaylistName}
        />
      )}

      {/* Now Playing — prominent card */}
      {player.metadata && <NowPlayingCard player={player} onPlayPause={handlePlayPause} />}

      {/* Queue */}
      <div className="flex-1 overflow-y-auto">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f5a623]/10 to-[#f5a623]/5 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[#f5a623]/40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-400">No music yet</p>
            <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
              Share a Spotify, SoundCloud, YouTube, or Audius link in #{activeChannel} to build the queue
            </p>
          </div>
        ) : (
          <div className="py-2">
            <p className="px-4 pb-2 text-[10px] text-gray-500 font-medium uppercase tracking-wider">
              {currentIndex >= 0 ? `Up next · ${queue.length - currentIndex - 1} remaining` : `Queue · ${queue.length} tracks`}
            </p>
            <QueueContent queue={queue} currentIndex={currentIndex} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Now Playing Card ────────────────────────────────────────────────────────

function NowPlayingCard({
  player,
  onPlayPause,
}: {
  player: ReturnType<typeof usePlayer>;
  onPlayPause: () => void;
}) {
  if (!player.metadata) return null;

  return (
    <div className="flex-shrink-0 border-b border-gray-800 bg-gradient-to-b from-[#0a1628] to-[#0d1b2a]">
      <div className="px-4 pt-4 pb-3">
        <p className="text-[10px] text-[#f5a623] uppercase tracking-wider font-semibold mb-3">Now Playing</p>

        <div className="flex items-center gap-3 mb-3">
          {/* Large artwork */}
          <div className={`relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800 shadow-lg ${player.isPlaying ? 'ring-1 ring-[#f5a623]/30' : ''}`}>
            {player.metadata.artworkUrl ? (
              <Image
                src={player.metadata.artworkUrl}
                alt={player.metadata.trackName}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a2a3a] to-[#0a1628]">
                <svg className="w-7 h-7 text-[#f5a623]/40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
            )}
            {/* Playing animation */}
            {player.isPlaying && (
              <div className="absolute inset-0 flex items-end justify-center pb-1.5 bg-gradient-to-t from-black/40 to-transparent">
                <div className="flex items-end gap-px">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-[3px] bg-[#f5a623] rounded-full animate-bounce"
                      style={{
                        height: `${6 + i * 3}px`,
                        animationDelay: `${i * 0.15}s`,
                        animationDuration: '0.6s',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Track info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {player.metadata.trackName}
            </p>
            {player.metadata.artistName && (
              <p className="text-xs text-gray-400 truncate">
                {player.metadata.artistName}
              </p>
            )}
            <span className="inline-block text-[10px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded mt-1 capitalize">
              {player.metadata.type === 'applemusic' ? 'Apple Music' : player.metadata.type === 'soundxyz' ? 'Sound.xyz' : player.metadata.type}
            </span>
          </div>

          {/* Play/pause */}
          <button
            onClick={onPlayPause}
            disabled={player.isLoading}
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-[#f5a623] text-[#0d1b2a] hover:bg-[#ffd700] disabled:opacity-50 transition-colors shadow-md shadow-[#f5a623]/20"
          >
            {player.isLoading ? (
              <div className="w-4 h-4 border-2 border-[#0d1b2a] border-t-transparent rounded-full animate-spin" />
            ) : player.isPlaying ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>

        {/* Scrubber + time */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 tabular-nums w-8 text-right">
            {formatDuration(player.position)}
          </span>
          <div className="flex-1">
            <Scrubber
              position={player.position}
              duration={player.duration}
              feedId={player.metadata.feedId}
              onSeek={player.seek}
            />
          </div>
          <span className="text-[10px] text-gray-500 tabular-nums w-8">
            {formatDuration(player.duration)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Queue Content ───────────────────────────────────────────────────────────

function QueueContent({
  queue,
  currentIndex = -1,
  onPlay,
}: {
  queue: ReturnType<typeof useMusicQueue>;
  currentIndex?: number;
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
          isCurrentSection={i === currentIndex}
          onPlay={onPlay}
        />
      ))}
    </>
  );
}
