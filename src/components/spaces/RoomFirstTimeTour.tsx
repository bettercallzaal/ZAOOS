'use client';

import { useEffect, useState } from 'react';

interface RoomFirstTimeTourProps {
  /** Distinguishes the copy + the localStorage key so a returning user gets
   * the right tour for the room mode they actually walked into. */
  roomMode: 'stage' | 'voice_channel';
}

const STORAGE_KEY = 'zao-room-tour-shown-v1';

interface ShownMap {
  stage?: boolean;
  voice_channel?: boolean;
}

function hasSeen(mode: 'stage' | 'voice_channel'): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const map = JSON.parse(raw) as ShownMap;
    return !!map[mode];
  } catch {
    return false;
  }
}

function markSeen(mode: 'stage' | 'voice_channel'): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const map: ShownMap = raw ? (JSON.parse(raw) as ShownMap) : {};
    map[mode] = true;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* localStorage disabled - tour shows once per session instead */
  }
}

const STAGE_TOUR = [
  { icon: 'MIC', title: 'Listen first', body: 'Audio plays automatically. Reactions are silent.' },
  {
    icon: 'HAND',
    title: 'Raise hand to speak',
    body: 'The host sees your queue position. They tap Invite to bring you up.',
  },
  {
    icon: 'LEAVE',
    title: 'Leave anytime',
    body: 'Tapping Leave drops you out. The room keeps going.',
  },
];

const VIDEO_TOUR = [
  {
    icon: 'CAM',
    title: 'Mic, camera, screen',
    body: 'All three are open to everyone. The lobby let you choose defaults.',
  },
  {
    icon: 'SHARE',
    title: 'Share the link',
    body: 'When you are alone, an invite card appears - copy, cast, or QR.',
  },
  {
    icon: 'LEAVE',
    title: 'Host ends the room',
    body: 'A confirm dialog protects against fat-thumb End. Leaving alone is safe.',
  },
];

/**
 * One-time orientation overlay shown the first time a user enters a Stage or
 * Video Room. Different copy per mode. Persists "seen" in localStorage so the
 * second visit is friction-free. Closes on Escape, click-outside, or the
 * "Got it" button.
 *
 * Renders nothing on SSR or when already seen.
 */
export function RoomFirstTimeTour({ roomMode }: RoomFirstTimeTourProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hasSeen(roomMode)) setOpen(true);
  }, [roomMode]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleDismiss();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleDismiss() {
    markSeen(roomMode);
    setOpen(false);
  }

  if (!open) return null;

  const tour = roomMode === 'voice_channel' ? VIDEO_TOUR : STAGE_TOUR;
  const title = roomMode === 'voice_channel' ? "You're in a Video Room" : "You're in a Stage";

  return (
    <div
      className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
      onClick={handleDismiss}
    >
      <div
        className="bg-[#0d1b2a] border border-white/[0.08] rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5a623]/10 border border-[#f5a623]/30 text-[#f5a623] text-[10px] font-bold tracking-wider uppercase">
          First time
        </div>
        <h2 id="tour-title" className="text-white text-lg font-bold mt-2 mb-4">
          {title}
        </h2>

        <ul className="space-y-3 mb-5">
          {tour.map((item) => (
            <li key={item.icon} className="flex items-start gap-3">
              <span className="flex-shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#1a2a3a] text-[#f5a623] text-[10px] font-bold tracking-wider">
                {item.icon}
              </span>
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold">{item.title}</p>
                <p className="text-gray-500 text-xs leading-relaxed">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={handleDismiss}
          className="w-full px-4 py-2.5 bg-[#f5a623] hover:bg-[#ffd700] text-[#0a1628] font-bold rounded-xl text-sm transition-colors shadow-lg shadow-[#f5a623]/20"
        >
          Got it
        </button>

        <p className="text-gray-600 text-xs text-center mt-3">
          Shown once per device. Tap outside or press Esc to dismiss.
        </p>
      </div>
    </div>
  );
}
