'use client';

import { useCallback } from 'react';
import Image from 'next/image';
import { useQueue } from '@/contexts/QueueContext';
import { usePlayer } from '@/providers/audio';
import type { QueueTrack } from '@/hooks/usePlayerQueue';

interface QueuePanelProps {
  onClose?: () => void;
}

export function QueuePanel({ onClose }: QueuePanelProps) {
  const player = usePlayer();
  const { queue, currentIndex, removeFromQueue, moveTrack, clearQueue, skipTo } = useQueue();

  const handlePlay = useCallback(
    (index: number) => {
      const metadata = skipTo(index);
      if (metadata) player.play(metadata);
    },
    [skipTo, player],
  );

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index > 0) moveTrack(index, index - 1);
    },
    [moveTrack],
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index < queue.length - 1) moveTrack(index, index + 1);
    },
    [moveTrack, queue.length],
  );

  return (
    <div className="bg-white/5 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
          </svg>
          <span className="text-sm font-semibold text-white">Up Next</span>
          {queue.length > 0 && (
            <span className="text-xs text-gray-500">
              {queue.length} track{queue.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <button
              onClick={clearQueue}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
            >
              Clear all
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white transition-colors"
              aria-label="Close queue"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Now Playing */}
      {player.metadata && (
        <div className="px-4 py-2.5 bg-[#f5a623]/5 border-b border-gray-700/30">
          <p className="text-[10px] text-[#f5a623] uppercase tracking-wider font-semibold mb-1.5">
            Now Playing
          </p>
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800">
              {player.metadata.artworkUrl ? (
                <Image
                  src={player.metadata.artworkUrl}
                  alt={player.metadata.trackName}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a2a3a] to-[#0a1628]">
                  <MusicNoteIcon className="w-4 h-4 text-[#f5a623]/40" />
                </div>
              )}
              {player.isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <PlayingBars />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#f5a623] truncate">
                {player.metadata.trackName}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {player.metadata.artistName || 'Unknown artist'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Queue list */}
      {queue.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
          <svg className="w-8 h-8 text-gray-600 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
          </svg>
          <p className="text-sm text-gray-400 font-medium">Queue empty</p>
          <p className="text-xs text-gray-500 mt-1">
            Add tracks from Discover or tap + on any track
          </p>
        </div>
      ) : (
        <div className="max-h-[40vh] overflow-y-auto scrollbar-hide">
          {queue.map((entry, i) => (
            <QueueItem
              key={entry.id}
              entry={entry}
              index={i}
              isCurrent={i === currentIndex}
              isPlaying={i === currentIndex && player.isPlaying}
              isFirst={i === 0}
              isLast={i === queue.length - 1}
              onPlay={() => handlePlay(i)}
              onRemove={() => removeFromQueue(entry.id)}
              onMoveUp={() => handleMoveUp(i)}
              onMoveDown={() => handleMoveDown(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Queue Item ──────────────────────────────────────────────────────────────

function QueueItem({
  entry,
  index,
  isCurrent,
  isPlaying,
  isFirst,
  isLast,
  onPlay,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  entry: QueueTrack;
  index: number;
  isCurrent: boolean;
  isPlaying: boolean;
  isFirst: boolean;
  isLast: boolean;
  onPlay: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 px-4 py-2 transition-colors hover:bg-white/5 ${
        isCurrent ? 'bg-[#f5a623]/10' : ''
      }`}
    >
      {/* Play button / index */}
      <button
        onClick={onPlay}
        className="w-6 flex-shrink-0 flex items-center justify-center"
        aria-label={`Play track ${index + 1}`}
      >
        {isPlaying ? (
          <PlayingBars />
        ) : isCurrent ? (
          <svg className="w-3.5 h-3.5 text-[#f5a623]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        ) : (
          <span className="text-xs text-gray-500 tabular-nums">{index + 1}</span>
        )}
      </button>

      {/* Artwork */}
      <div className="relative w-9 h-9 flex-shrink-0 rounded-md overflow-hidden bg-gray-800">
        {entry.metadata.artworkUrl ? (
          <Image
            src={entry.metadata.artworkUrl}
            alt={entry.metadata.trackName}
            fill
            className="object-cover"
            sizes="36px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a2a3a] to-[#0a1628]">
            <MusicNoteIcon className="w-3.5 h-3.5 text-[#f5a623]/40" />
          </div>
        )}
      </div>

      {/* Track info */}
      <button onClick={onPlay} className="flex-1 min-w-0 text-left">
        <p className={`text-xs font-medium truncate ${isCurrent ? 'text-[#f5a623]' : 'text-white'}`}>
          {entry.metadata.trackName}
        </p>
        <p className="text-[11px] text-gray-500 truncate">
          {entry.metadata.artistName || 'Unknown artist'}
        </p>
      </button>

      {/* Reorder buttons */}
      <div className="flex flex-col gap-0.5 flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
          disabled={isFirst}
          className="p-0.5 text-gray-500 hover:text-white disabled:opacity-20 transition-colors"
          aria-label="Move up"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
          disabled={isLast}
          className="p-0.5 text-gray-500 hover:text-white disabled:opacity-20 transition-colors"
          aria-label="Move down"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>

      {/* Remove button */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="p-1 text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
        aria-label="Remove from queue"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ─── Shared Icons ────────────────────────────────────────────────────────────

function MusicNoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
  );
}

function PlayingBars() {
  return (
    <div className="flex items-end gap-[2px] h-3">
      <div className="w-[2px] bg-[#f5a623] rounded-full animate-[bounce_0.6s_ease-in-out_infinite]" style={{ height: '50%' }} />
      <div className="w-[2px] bg-[#f5a623] rounded-full animate-[bounce_0.6s_ease-in-out_infinite_0.15s]" style={{ height: '100%' }} />
      <div className="w-[2px] bg-[#f5a623] rounded-full animate-[bounce_0.6s_ease-in-out_infinite_0.3s]" style={{ height: '40%' }} />
    </div>
  );
}
