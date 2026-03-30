'use client';

import { useState, useEffect, useCallback } from 'react';

interface TwitchStreamData {
  isLive: boolean;
  connected?: boolean;
  viewerCount?: number;
  title?: string;
  game?: string;
  startedAt?: string;
}

const POLL_INTERVAL = 30_000; // 30 seconds

export function TwitchStreamInfo() {
  const [stream, setStream] = useState<TwitchStreamData | null>(null);

  const fetchStreamInfo = useCallback(async () => {
    try {
      const res = await fetch('/api/twitch/stream-info');
      if (!res.ok) return;
      const data: TwitchStreamData = await res.json();
      setStream(data);
    } catch {
      // Silently fail — component hides when data unavailable
    }
  }, []);

  useEffect(() => {
    fetchStreamInfo();
    const interval = setInterval(fetchStreamInfo, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchStreamInfo]);

  // Hide entirely if not connected or not live
  if (!stream?.isLive) return null;

  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-purple-500/10 border border-purple-500/20">
      {/* LIVE badge */}
      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-red-400">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        Live
      </span>

      {/* Twitch icon */}
      <svg
        className="w-3.5 h-3.5 text-purple-400 flex-shrink-0"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
      </svg>

      {/* Viewer count */}
      <span className="flex items-center gap-1 text-xs text-gray-300">
        <svg
          className="w-3 h-3 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
        {formatViewerCount(stream.viewerCount ?? 0)}
      </span>
    </div>
  );
}

function formatViewerCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return count.toString();
}
