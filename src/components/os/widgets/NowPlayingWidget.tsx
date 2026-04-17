'use client';

import type { WidgetProps } from '@/lib/os/types';

export default function NowPlayingWidget({ size, onExpand }: WidgetProps) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className="flex w-full items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-left transition-colors hover:bg-white/[0.06]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f5a623]/10 text-xl">
        🎵
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-white">Now Playing</div>
        <div className="truncate text-xs text-white/50">Open music to start listening</div>
      </div>
      {size !== 'small' && (
        <div className="flex gap-2">
          <div className="h-8 w-8 rounded-full bg-white/5 text-center leading-8 text-xs">⏮</div>
          <div className="h-8 w-8 rounded-full bg-[#f5a623]/20 text-center leading-8 text-xs">▶</div>
          <div className="h-8 w-8 rounded-full bg-white/5 text-center leading-8 text-xs">⏭</div>
        </div>
      )}
    </button>
  );
}
