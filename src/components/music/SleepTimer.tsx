'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePlayer } from '@/providers/audio';

// ─── Module-level state (persists across mount/unmount) ──────────────────────

let sharedTimerEnd: number | null = null; // Date.now() + ms when timer expires
let sharedTimerMode: 'minutes' | 'endOfTrack' | null = null;

export function getSleepTimerActive(): boolean {
  return sharedTimerEnd !== null || sharedTimerMode === 'endOfTrack';
}

// ─── Presets ─────────────────────────────────────────────────────────────────

const PRESETS = [
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '45 min', minutes: 45 },
  { label: '60 min', minutes: 60 },
  { label: '90 min', minutes: 90 },
] as const;

// ─── Format countdown ────────────────────────────────────────────────────────

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SleepTimer() {
  const player = usePlayer();
  const [open, setOpen] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [mode, setMode] = useState<'minutes' | 'endOfTrack' | null>(sharedTimerMode);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // ─── Restore module-level state on mount ─────────────────────────────
  useEffect(() => {
    if (sharedTimerEnd) {
      const diff = sharedTimerEnd - Date.now();
      if (diff > 0) {
        setRemaining(diff);
        setMode('minutes');
      } else {
        // Timer already expired while unmounted
        sharedTimerEnd = null;
        sharedTimerMode = null;
      }
    } else if (sharedTimerMode === 'endOfTrack') {
      setMode('endOfTrack');
    }
  }, []);

  // ─── Countdown interval for timed presets ────────────────────────────
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (mode !== 'minutes' || !sharedTimerEnd) return;

    intervalRef.current = setInterval(() => {
      const diff = sharedTimerEnd! - Date.now();
      if (diff <= 0) {
        // Timer expired — pause playback
        player.pause();
        sharedTimerEnd = null;
        sharedTimerMode = null;
        setRemaining(null);
        setMode(null);
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
      } else {
        setRemaining(diff);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [mode, player]);

  // ─── "End of track" mode — pause when track ends ────────────────────
  // We detect this by watching position approach duration
  const endOfTrackFiredRef = useRef(false);
  const endOfTrackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => clearTimeout(endOfTrackTimerRef.current);
  }, []);

  useEffect(() => {
    if (mode !== 'endOfTrack') {
      endOfTrackFiredRef.current = false;
      return;
    }

    // If track has a known duration and position is near the end (within 1.5s)
    if (
      player.duration > 0 &&
      player.position > 0 &&
      player.duration - player.position < 1500 &&
      !endOfTrackFiredRef.current
    ) {
      endOfTrackFiredRef.current = true;
      // Small delay so the track finishes naturally
      clearTimeout(endOfTrackTimerRef.current);
      endOfTrackTimerRef.current = setTimeout(() => {
        player.pause();
        sharedTimerEnd = null;
        sharedTimerMode = null;
        setMode(null);
        setRemaining(null);
      }, 1600);
    }
  }, [mode, player.position, player.duration, player]);

  // ─── Close popover on outside click ──────────────────────────────────
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // ─── Handlers ────────────────────────────────────────────────────────
  const setTimer = useCallback((minutes: number) => {
    const ms = minutes * 60 * 1000;
    sharedTimerEnd = Date.now() + ms;
    sharedTimerMode = 'minutes';
    setRemaining(ms);
    setMode('minutes');
    setOpen(false);
  }, []);

  const setEndOfTrack = useCallback(() => {
    sharedTimerEnd = null;
    sharedTimerMode = 'endOfTrack';
    endOfTrackFiredRef.current = false;
    setMode('endOfTrack');
    setRemaining(null);
    setOpen(false);
  }, []);

  const cancel = useCallback(() => {
    sharedTimerEnd = null;
    sharedTimerMode = null;
    setRemaining(null);
    setMode(null);
    setOpen(false);
  }, []);

  const isActive = mode !== null;

  return (
    <div className="relative" ref={popoverRef}>
      {/* ─── Timer button ──────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`p-1.5 rounded-lg transition-colors ${
          isActive
            ? 'text-[#f5a623] bg-[#f5a623]/10'
            : 'text-gray-400 hover:text-white'
        }`}
        aria-label={isActive ? 'Sleep timer active' : 'Set sleep timer'}
        title={
          mode === 'endOfTrack'
            ? 'Sleep: end of track'
            : remaining
              ? `Sleep: ${formatCountdown(remaining)}`
              : 'Sleep timer'
        }
      >
        {isActive && remaining ? (
          <span className="text-[11px] font-mono font-semibold tabular-nums leading-none">
            {formatCountdown(remaining)}
          </span>
        ) : isActive && mode === 'endOfTrack' ? (
          <span className="text-[11px] font-semibold leading-none">EoT</span>
        ) : (
          /* Moon icon */
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
            />
          </svg>
        )}
      </button>

      {/* ─── Popover menu ──────────────────────────────────────────── */}
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-44 bg-[#111d33] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-white/5">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
              Sleep Timer
            </p>
          </div>

          <div className="py-1">
            {PRESETS.map((preset) => (
              <button
                key={preset.minutes}
                onClick={() => setTimer(preset.minutes)}
                className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-white/5 hover:text-white transition-colors"
              >
                {preset.label}
              </button>
            ))}
            <button
              onClick={setEndOfTrack}
              className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-white/5 hover:text-white transition-colors"
            >
              End of track
            </button>
          </div>

          {isActive && (
            <div className="border-t border-white/5 py-1">
              <button
                onClick={cancel}
                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
              >
                Cancel timer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
