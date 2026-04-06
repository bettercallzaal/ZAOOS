'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePlayer } from '@/providers/audio';

interface SleepTimerButtonProps {
  compact?: boolean;
  className?: string;
}

type TimerOption = '15' | '30' | '60' | 'endOfTrack' | 'off';

const TIMER_OPTIONS: { label: string; value: TimerOption }[] = [
  { label: '15 min', value: '15' },
  { label: '30 min', value: '30' },
  { label: '1 hour', value: '60' },
  { label: 'End of track', value: 'endOfTrack' },
  { label: 'Off', value: 'off' },
];

export function SleepTimerButton({ compact = false, className = '' }: SleepTimerButtonProps) {
  const [open, setOpen] = useState(false);
  const [activeTimer, setActiveTimer] = useState<TimerOption | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const player = usePlayer();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (endCheckRef.current) {
      clearInterval(endCheckRef.current);
      endCheckRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  const handleSelect = useCallback((option: TimerOption) => {
    clearAllTimers();

    if (option === 'off') {
      setActiveTimer(null);
      setRemainingMs(0);
      setOpen(false);
      return;
    }

    setActiveTimer(option);
    setOpen(false);

    if (option === 'endOfTrack') {
      // Poll for track end: check every second if position >= duration
      setRemainingMs(0); // No countdown for end-of-track
      endCheckRef.current = setInterval(() => {
        // Access player state indirectly — check if playing ended
        // The player will naturally call onEnded. We just need to pause when the
        // current track finishes. We check position vs duration.
      }, 1000);

      // Use the onEnded callback from player
      player.setOnEnded(() => {
        player.pause();
        setActiveTimer(null);
        clearAllTimers();
      });

      return;
    }

    // Timed options (15, 30, 60 minutes)
    const durationMs = parseInt(option) * 60 * 1000;
    const endTime = Date.now() + durationMs;
    setRemainingMs(durationMs);

    // Countdown display update every second
    intervalRef.current = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());
      setRemainingMs(remaining);
      if (remaining <= 0) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
      }
    }, 1000);

    // The actual timer that fires the pause
    timerRef.current = setTimeout(() => {
      player.pause();
      setActiveTimer(null);
      setRemainingMs(0);
      clearAllTimers();
    }, durationMs);
  }, [player, clearAllTimers]);

  const isActive = activeTimer !== null;

  // Format remaining time as badge text
  const badgeText = (() => {
    if (!isActive) return '';
    if (activeTimer === 'endOfTrack') return 'EoT';
    const totalSec = Math.ceil(remainingMs / 1000);
    const mins = Math.floor(totalSec / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h${mins % 60 > 0 ? `${mins % 60}m` : ''}`;
    return `${mins}m`;
  })();

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className={`relative flex items-center justify-center transition-colors ${
          compact
            ? 'p-1.5 rounded'
            : 'p-1.5 rounded-lg hover:bg-white/5'
        } ${
          isActive
            ? 'text-[#f5a623]'
            : 'text-gray-400 hover:text-white'
        }`}
        aria-label={isActive ? `Sleep timer: ${badgeText} remaining` : 'Sleep timer'}
        title="Sleep timer"
      >
        {/* Moon/clock icon */}
        <svg className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>

        {/* Active badge with remaining time */}
        {isActive && badgeText && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[14px] rounded-full bg-[#f5a623] text-[7px] font-bold text-[#0a1628] flex items-center justify-center px-1">
            {badgeText}
          </span>
        )}
      </button>

      {/* Popover */}
      {open && (
        <div
          className="absolute bottom-full right-0 mb-2 w-44 bg-[#111827] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/60 z-50 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-white/[0.08]">
            <p className="text-xs font-semibold text-gray-300">Sleep Timer</p>
          </div>

          <div className="py-1">
            {TIMER_OPTIONS.map((opt) => {
              const isSelected = activeTimer === opt.value || (opt.value === 'off' && !isActive);

              return (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                    isSelected
                      ? 'text-[#f5a623] bg-[#f5a623]/10'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && (
                    <svg className="w-3.5 h-3.5 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {isActive && activeTimer !== 'endOfTrack' && remainingMs > 0 && (
            <div className="px-3 py-2 border-t border-white/[0.08]">
              <p className="text-[10px] text-gray-500 text-center">
                Pausing in {badgeText}
              </p>
            </div>
          )}
          {isActive && activeTimer === 'endOfTrack' && (
            <div className="px-3 py-2 border-t border-white/[0.08]">
              <p className="text-[10px] text-gray-500 text-center">
                Pausing after current track
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
