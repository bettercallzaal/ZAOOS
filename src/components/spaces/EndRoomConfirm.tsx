'use client';

import { useEffect, useRef } from 'react';

interface EndRoomConfirmProps {
  /** Title of the room — surfaces in the dialog so the host can sanity-check. */
  roomTitle: string;
  /** Closes the dialog without ending the room. */
  onCancel: () => void;
  /** End the room for everyone. The caller leaves Stream + PATCH /api/stream/rooms/{id} action=end. */
  onConfirm: () => Promise<void> | void;
  /**
   * When the actor is also allowed to *just leave* (admin viewing someone
   * else's room, for instance), surface a third option so they don't have to
   * cancel and re-click. Defaults to undefined = hidden.
   */
  onLeaveOnly?: () => Promise<void> | void;
}

/**
 * Confirmation dialog that fires before an `End` action in a Spaces room.
 * Surfaced for hosts + admins because a fat-thumb End kills the room for
 * every listener at once. Plain `Leave` actions skip this entirely.
 *
 * Esc closes the dialog. Focus is sent to Cancel so a stray Enter does not
 * end the room.
 */
export function EndRoomConfirm({
  roomTitle,
  onCancel,
  onConfirm,
  onLeaveOnly,
}: EndRoomConfirmProps) {
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="end-room-title"
    >
      <div className="bg-[#0d1b2a] border border-white/[0.08] rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md">
        <div className="mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" aria-hidden="true" />
          <span className="text-red-400 text-[10px] font-bold tracking-wider uppercase">
            Ends room for everyone
          </span>
        </div>
        <h2 id="end-room-title" className="text-white text-lg font-bold mb-1">
          End this room?
        </h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-5">
          <span className="text-white font-semibold">{roomTitle || 'This room'}</span> will close
          for everyone listening. The recording (if on) stops here.
        </p>

        <div className={`grid gap-2 ${onLeaveOnly ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-white/[0.08] bg-[#1a2a3a] text-gray-300 text-sm font-semibold hover:bg-[#22364a] transition-colors"
          >
            Cancel
          </button>
          {onLeaveOnly && (
            <button
              type="button"
              onClick={onLeaveOnly}
              className="px-4 py-2.5 rounded-xl border border-white/[0.08] bg-[#1a2a3a] text-gray-300 text-sm font-semibold hover:bg-[#22364a] transition-colors"
            >
              Leave only
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2.5 rounded-xl bg-red-500/90 hover:bg-red-500 text-white text-sm font-bold transition-colors"
          >
            End room
          </button>
        </div>
      </div>
    </div>
  );
}
