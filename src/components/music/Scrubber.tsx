'use client';

import { useMemo } from 'react';
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
  const bars = useMemo(() => {
    const rand = seededRandom(feedId || 'default');
    return Array.from({ length: BAR_COUNT }, () => 30 + Math.floor(rand() * 70));
  }, [feedId]);

  const filledCount =
    duration > 0 ? Math.round((position / duration) * BAR_COUNT) : 0;

  return (
    <div className="flex items-center gap-2 w-full min-w-0">
      <span className="text-xs text-gray-400 tabular-nums w-8 flex-shrink-0 text-right">
        {formatDuration(position)}
      </span>

      <div className="relative flex-1 flex items-end gap-px" style={{ height: 32 }}>
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
          onChange={(e) => onSeek(Number(e.target.value))}
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
