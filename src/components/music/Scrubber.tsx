'use client';

import { useMemo, useState, useCallback, useRef } from 'react';
import { formatDuration } from '@/lib/music/formatDuration';

interface ScrubberProps {
  position: number; // ms
  duration: number; // ms
  feedId: string;
  onSeek: (ms: number) => void;
}

function seededRandom(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return () => {
    hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
    hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
    hash ^= hash >>> 16;
    return (hash >>> 0) / 0xffffffff;
  };
}

const BAR_COUNT = 60;

export function Scrubber({ position, duration, feedId, onSeek }: ScrubberProps) {
  const [scrubbing, setScrubbing] = useState(false);
  const [previewMs, setPreviewMs] = useState(0);
  const [previewX, setPreviewX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const bars = useMemo(() => {
    const rand = seededRandom(feedId || 'default');
    return Array.from({ length: BAR_COUNT }, () => 30 + Math.floor(rand() * 70));
  }, [feedId]);

  const filledCount =
    duration > 0 ? Math.round((position / duration) * BAR_COUNT) : 0;

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!containerRef.current || duration <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setPreviewMs(fraction * duration);
    setPreviewX(e.clientX - rect.left);
    setScrubbing(true);
  }, [duration]);

  return (
    <div className="flex items-center gap-2 w-full min-w-0">
      <span className="text-xs text-gray-400 tabular-nums w-8 flex-shrink-0 text-right">
        {formatDuration(position)}
      </span>

      <div
        ref={containerRef}
        className="relative flex-1 flex items-end gap-px h-8"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setScrubbing(false)}
      >
        {/* Preview time bubble */}
        {scrubbing && (
          <div
            className="absolute -top-8 px-2 py-0.5 rounded bg-[#f5a623] text-[#0a1628] text-[10px] font-bold tabular-nums pointer-events-none z-10 -translate-x-1/2"
            style={{ left: `${previewX}px` }}
          >
            {formatDuration(previewMs)}
          </div>
        )}

        {/* Waveform bars */}
        {bars.map((heightPct, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm transition-colors"
            style={{
              height: `${heightPct}%`,
              backgroundColor: i < filledCount ? '#f5a623' : '#374151',
            }}
          />
        ))}

        {/* Transparent range input overlay for seeking */}
        <input
          type="range"
          min={0}
          max={duration || 1}
          value={position}
          step={500}
          onChange={(e) => {
            onSeek(Number(e.target.value));
            navigator.vibrate?.(5);
          }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
          style={{ height: '100%' }}
          aria-label="Seek"
        />
      </div>

      <span className="text-xs text-gray-400 tabular-nums w-8 flex-shrink-0">
        {formatDuration(duration)}
      </span>
    </div>
  );
}
