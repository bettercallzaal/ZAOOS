'use client';

import { useEffect, useRef } from 'react';

/**
 * Runs `callback` every `delayMs` while the tab is visible.
 *
 * Ticks are skipped while `document.hidden` is true, so a backgrounded tab
 * stops hitting our API routes (each poll is server CPU on Vercel). When the
 * tab becomes visible again the callback runs once immediately, so data is
 * fresh the moment the user looks. Pass `null` to pause polling entirely.
 *
 * Does not run on mount - callers keep their own initial fetch.
 */
export function useVisibleInterval(callback: () => void, delayMs: number | null): void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delayMs === null) return;

    const tick = () => {
      if (!document.hidden) callbackRef.current();
    };
    const interval = setInterval(tick, delayMs);
    document.addEventListener('visibilitychange', tick);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [delayMs]);
}
