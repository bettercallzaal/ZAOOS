'use client';

import { useCallStateHooks } from '@stream-io/video-react-sdk';

/**
 * Stream SDK ConnectionQuality enum values:
 * UNSPECIFIED = 0, POOR = 1, GOOD = 2, EXCELLENT = 3
 */
const qualityConfig: Record<number, { bars: number; color: string; label: string }> = {
  3: { bars: 3, color: '#22c55e', label: 'Excellent' },
  2: { bars: 3, color: '#22c55e', label: 'Good' },
  1: { bars: 1, color: '#ef4444', label: 'Poor' },
  0: { bars: 0, color: '#6b7280', label: 'Checking...' },
};

export function ConnectionQuality() {
  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();

  const raw = localParticipant?.connectionQuality;
  const qualityValue = typeof raw === 'number' ? raw : 0;
  const { bars, color, label } = qualityConfig[qualityValue] ?? qualityConfig[0];

  return (
    <div className="relative group" aria-label={`Connection quality: ${label}`}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block"
      >
        {/* Bar 1 (shortest, left) */}
        <rect
          x="1"
          y="10"
          width="3"
          height="5"
          rx="0.5"
          fill={bars >= 1 ? color : '#374151'}
        />
        {/* Bar 2 (medium, center) */}
        <rect
          x="6"
          y="6"
          width="3"
          height="9"
          rx="0.5"
          fill={bars >= 2 ? color : '#374151'}
        />
        {/* Bar 3 (tallest, right) */}
        <rect
          x="11"
          y="2"
          width="3"
          height="13"
          rx="0.5"
          fill={bars >= 3 ? color : '#374151'}
        />
      </svg>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-gray-900 text-gray-200 text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
        {label}
      </div>
    </div>
  );
}
