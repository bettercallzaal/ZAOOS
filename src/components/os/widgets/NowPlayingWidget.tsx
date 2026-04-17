'use client';

import { usePlayerContext } from '@/providers/audio/PlayerProvider';
import type { WidgetProps } from '@/lib/os/types';

export default function NowPlayingWidget({ size, onExpand }: WidgetProps) {
  const { state } = usePlayerContext();
  const { status, metadata } = state;
  const isPlaying = status === 'playing';
  const hasTrack = !!metadata?.trackName;

  return (
    <button
      type="button"
      onClick={onExpand}
      aria-label={hasTrack ? `Now playing: ${metadata.trackName}` : 'Open music'}
      className="flex w-full items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-left transition-colors hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-[#f5a623]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f5a623]/10 text-xl">
        {isPlaying ? '🎵' : '⏸'}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-white">
          {hasTrack ? metadata.trackName : 'Now Playing'}
        </div>
        <div className="truncate text-xs text-white/50">
          {hasTrack ? (metadata.artistName || 'Unknown artist') : 'Open music to start listening'}
        </div>
      </div>
    </button>
  );
}
