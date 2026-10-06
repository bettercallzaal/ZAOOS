'use client';

import Image from 'next/image';
import { memo, useCallback } from 'react';
import { useQueue } from '@/contexts/QueueContext';
import type { QueueTrack } from '@/hooks/usePlayerQueue';
import { usePlayer } from '@/providers/audio';

interface QueuePanelProps {
  onClose?: () => void;
  fullHeight?: boolean;
}

export function QueuePanel({ onClose, fullHeight = false }: QueuePanelProps) {
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

  const handleMoveToTop = useCallback(
    (index: number) => {
      if (index > 0) moveTrack(index, 0);
    },
    [moveTrack],
  );

  return (
    <div
      className={`bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden flex flex-col border border-white/[0.08] ${
        fullHeight ? 'h-full' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] flex-shrink-0">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-[#f5a623]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
            />
          </svg>
          <span className="text-sm font-semibold text-white tracking-wide">Up Next</span>
          {queue.length > 0 && (
            <span className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
              {queue.length} {queue.length === 1 ? 'track' : 'tracks'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <button
              type="button"
              onClick={clearQueue}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors px-2.5 py-1 rounded-lg hover:bg-white/5"
            >
              Clear all
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Close queue"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Now Playing card */}
      {player.metadata && (
        <div className="px-4 py-3 bg-[#f5a623]/10 border-b border-white/[0.08] flex-shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-[#f5a623] uppercase tracking-wider font-semibold">
              Now Playing
            </span>
            <span className="text-[10px] text-[#f5a623]/70 font-mono">
              {player.isPlaying ? 'Live' : 'Paused'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800 ring-1 ring-[#f5a623]/30">
              {player.metadata.artworkUrl ? (
                <Image
                  src={player.metadata.artworkUrl}
                  alt={player.metadata.trackName}
                  fill
                  className="object-cover"
                  sizes="44px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a2a3a] to-[#0a1628]">
                  <MusicNoteIcon className="w-4 h-4 text-[#f5a623]/60" />
                </div>
              )}
              {player.isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <PlayingBars />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {player.metadata.trackName}
              </p>
              <p className="text-xs text-[#f5a623]/80 truncate">
                {player.metadata.artistName || 'Unknown artist'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Queue track list */}
      {queue.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
            <svg
              className="w-6 h-6 text-gray-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-300 font-medium">Your queue is empty</p>
          <p className="text-xs text-gray-500 mt-1 max-w-[220px]">
            Add tracks from Discover or tap + on any track in ZAO to queue them next.
          </p>
        </div>
      ) : (
        <div
          className={`overflow-y-auto divide-y divide-white/[0.04] scrollbar-thin scrollbar-thumb-white/10 ${
            fullHeight ? 'flex-1 min-h-0' : 'max-h-[45vh]'
          }`}
        >
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
              onMoveToTop={() => handleMoveToTop(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Queue Item ──────────────────────────────────────────────────────────────

const QueueItem = memo(function QueueItem({
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
  onMoveToTop,
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
  onMoveToTop: () => void;
}) {
  return (
    <div
      className={`group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/[0.06] ${
        isCurrent ? 'bg-[#f5a623]/10 hover:bg-[#f5a623]/15' : ''
      }`}
    >
      {/* Play button / index */}
      <button
        type="button"
        onClick={onPlay}
        className="w-6 flex-shrink-0 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors"
        aria-label={`Play track ${index + 1}`}
      >
        {isPlaying ? (
          <PlayingBars />
        ) : isCurrent ? (
          <svg
            className="w-4 h-4 text-[#f5a623]"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        ) : (
          <>
            <span className="text-xs text-gray-500 tabular-nums group-hover:hidden">
              {index + 1}
            </span>
            <svg
              className="w-3.5 h-3.5 text-white hidden group-hover:block"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </>
        )}
      </button>

      {/* Artwork */}
      <div className="relative w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800">
        {entry.metadata.artworkUrl ? (
          <Image
            src={entry.metadata.artworkUrl}
            alt={entry.metadata.trackName}
            fill
            className="object-cover"
            sizes="40px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a2a3a] to-[#0a1628]">
            <MusicNoteIcon className="w-4 h-4 text-[#f5a623]/40" />
          </div>
        )}
      </div>

      {/* Track info */}
      <button type="button" onClick={onPlay} className="flex-1 min-w-0 text-left">
        <p
          className={`text-xs font-semibold truncate ${
            isCurrent ? 'text-[#f5a623]' : 'text-white group-hover:text-white'
          }`}
        >
          {entry.metadata.trackName}
        </p>
        <p className="text-[11px] text-gray-400 truncate">
          {entry.metadata.artistName || 'Unknown artist'}
        </p>
      </button>

      {/* Action controls */}
      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
        {/* Play next / Move to top button */}
        {!isFirst && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveToTop();
            }}
            className="p-1 text-gray-400 hover:text-[#f5a623] hover:bg-white/5 rounded transition-colors hidden sm:inline-flex"
            title="Move to top / Play next"
            aria-label="Move to top"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"
              />
            </svg>
          </button>
        )}

        {/* Reorder up/down buttons */}
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            disabled={isFirst}
            className="p-0.5 text-gray-500 hover:text-white disabled:opacity-20 transition-colors"
            aria-label="Move up"
          >
            <svg
              className="w-3 h-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            disabled={isLast}
            className="p-0.5 text-gray-500 hover:text-white disabled:opacity-20 transition-colors"
            aria-label="Move down"
          >
            <svg
              className="w-3 h-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>

        {/* Remove button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded transition-colors ml-1"
          aria-label="Remove from queue"
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
});

// ─── Shared Icons ────────────────────────────────────────────────────────────

function MusicNoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
  );
}

function PlayingBars() {
  return (
    <div className="flex items-end gap-[2px] h-3">
      <div
        className="w-[2px] bg-[#f5a623] rounded-full animate-[bounce_0.6s_ease-in-out_infinite]"
        style={{ height: '50%' }}
      />
      <div
        className="w-[2px] bg-[#f5a623] rounded-full animate-[bounce_0.6s_ease-in-out_infinite_0.15s]"
        style={{ height: '100%' }}
      />
      <div
        className="w-[2px] bg-[#f5a623] rounded-full animate-[bounce_0.6s_ease-in-out_infinite_0.3s]"
        style={{ height: '40%' }}
      />
    </div>
  );
}
