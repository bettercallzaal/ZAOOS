'use client';

import { useEffect, useState, useRef } from 'react';

interface Props {
  position: number; // ms from server
  duration: number; // ms
}

/**
 * Animated progress bar that interpolates between polls.
 * Gold (#f5a623) fill on dark track.
 */
export function ProgressBar({ position, duration }: Props) {
  const [displayPos, setDisplayPos] = useState(position);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef(Date.now());
  const posRef = useRef(position);

  // Reset when server sends new position
  useEffect(() => {
    posRef.current = position;
    setDisplayPos(position);
    lastTimeRef.current = Date.now();
  }, [position]);

  // Interpolate between polls
  useEffect(() => {
    if (duration <= 0) return;

    const tick = () => {
      const now = Date.now();
      const elapsed = now - lastTimeRef.current;
      lastTimeRef.current = now;
      posRef.current = Math.min(posRef.current + elapsed, duration);
      setDisplayPos(posRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [duration]);

  const pct = duration > 0 ? Math.min((displayPos / duration) * 100, 100) : 0;

  return (
    <div
      style={{
        width: '100%',
        height: 4,
        background: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          background: 'linear-gradient(90deg, #f5a623, #f7c56e)',
          borderRadius: 2,
          transition: 'width 0.1s linear',
        }}
      />
    </div>
  );
}
