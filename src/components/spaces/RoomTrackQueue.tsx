'use client';

import { useQueue } from '@/contexts/QueueContext';

interface RoomTrackQueueProps {
  isHost: boolean;
}

export function RoomTrackQueue({ isHost }: RoomTrackQueueProps) {
  const { queue, currentIndex, removeFromQueue, moveTrack } = useQueue();

  if (queue.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-gray-500 text-xs">
        No tracks in queue
      </div>
    );
  }

  const handleMoveUp = (idx: number) => {
    if (idx > 0) moveTrack(idx, idx - 1);
  };

  const handleMoveDown = (idx: number) => {
    if (idx < queue.length - 1) moveTrack(idx, idx + 1);
  };

  return (
    <div className="flex flex-col gap-1 px-3 py-2 max-h-[300px] overflow-y-auto">
      {queue.map((track, idx) => {
        const isCurrent = idx === currentIndex;
        return (
          <div
            key={track.id}
            className={`flex items-center gap-2.5 p-2 rounded-lg transition-colors ${
              isCurrent
                ? 'bg-[#f5a623]/10 border border-[#f5a623]/40'
                : 'bg-white/5 border border-transparent hover:bg-white/10'
            }`}
          >
            {/* Artwork */}
            {track.metadata.artworkUrl ? (
              <img
                src={track.metadata.artworkUrl}
                alt={track.metadata.trackName}
                className="w-8 h-8 rounded object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded bg-[#f5a623]/10 flex items-center justify-center flex-shrink-0">
                <NoteIcon />
              </div>
            )}

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-medium truncate ${isCurrent ? 'text-[#f5a623]' : 'text-white'}`}>
                {track.metadata.trackName}
              </p>
              <p className="text-[10px] text-gray-400 truncate">
                {track.metadata.artistName}
              </p>
            </div>

            {/* Position label */}
            {isCurrent && (
              <span className="text-[9px] text-[#f5a623] font-semibold uppercase flex-shrink-0">
                Now
              </span>
            )}

            {/* Host controls */}
            {isHost && !isCurrent && (
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  onClick={() => handleMoveUp(idx)}
                  className="p-1 text-gray-500 hover:text-white transition-colors"
                  title="Move up"
                >
                  <ChevronUpIcon />
                </button>
                <button
                  onClick={() => handleMoveDown(idx)}
                  className="p-1 text-gray-500 hover:text-white transition-colors"
                  title="Move down"
                >
                  <ChevronDownIcon />
                </button>
                <button
                  onClick={() => removeFromQueue(track.id)}
                  className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                  title="Remove"
                >
                  <XIcon />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function NoteIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f5a623" strokeWidth="2">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 15l-6-6-6 6" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
