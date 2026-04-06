'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { BroadcastState } from '@/lib/spaces/rtmpManager';

interface BroadcastPanelProps {
  state: BroadcastState;
  onStopTarget: (platform: string) => void;
  onRetryTarget: (platform: string) => void;
  onStopAll: () => void;
  roomId: string;
}

const PLATFORM_ICONS: Record<string, string> = {
  twitch: '\u{1F7E3}',
  youtube: '\u{1F4FA}',
  kick: '\u{1F7E2}',
  facebook: '\u{1F535}',
  custom: '\u{1F4E1}',
};

const STATUS_STYLES: Record<string, { dot: string; label: string }> = {
  connecting: { dot: 'bg-yellow-400', label: 'Connecting' },
  connected: { dot: 'bg-green-400', label: 'Live' },
  error: { dot: 'bg-red-400', label: 'Error' },
  stopped: { dot: 'bg-gray-500', label: 'Stopped' },
};

function formatUptime(startedAt: string): string {
  const elapsed = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function BroadcastPanel({
  state,
  onStopTarget,
  onRetryTarget,
  onStopAll,
  roomId,
}: BroadcastPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [uptime, setUptime] = useState('00:00');
  const [viewerCounts, setViewerCounts] = useState<Record<string, number>>({});
  const uptimeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const viewerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Uptime timer — tick every second
  useEffect(() => {
    if (!state.startedAt) return;
    const tick = () => setUptime(formatUptime(state.startedAt!));
    tick();
    uptimeRef.current = setInterval(tick, 1000);
    return () => {
      if (uptimeRef.current) clearInterval(uptimeRef.current);
    };
  }, [state.startedAt]);

  // Viewer count polling — every 10 seconds
  const fetchViewers = useCallback(async () => {
    try {
      const res = await fetch(`/api/broadcast/status?roomId=${encodeURIComponent(roomId)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.viewers && typeof data.viewers === 'object') {
        setViewerCounts(data.viewers);
      }
    } catch {
      // Silently fail — viewer counts are non-critical
    }
  }, [roomId]);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      if (!cancelled) await fetchViewers();
    };
    void poll();
    viewerRef.current = setInterval(fetchViewers, 10_000);
    return () => {
      cancelled = true;
      if (viewerRef.current) clearInterval(viewerRef.current);
    };
  }, [fetchViewers]);

  const targets = state.targets || [];
  const activeCount = targets.filter(
    (t) => t.status === 'connected' || t.status === 'connecting'
  ).length;
  const isRelay = state.mode === 'relay';

  // --- Collapsed state ---
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/15 border border-red-500/30 text-sm text-red-300 hover:bg-red-500/25 transition-colors"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        <span className="font-medium">
          LIVE
        </span>
        <span className="text-red-400/70">&middot;</span>
        <span className="text-red-400/70">
          {activeCount} platform{activeCount !== 1 ? 's' : ''}
        </span>
        <span className="text-red-400/70">&middot;</span>
        <span className="tabular-nums text-red-400/70">{uptime}</span>
        <svg
          className="w-3.5 h-3.5 text-red-400/50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  }

  // --- Expanded state ---
  return (
    <div className="bg-[#0d1b2a] border border-white/[0.08] rounded-xl overflow-hidden w-full max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-white text-sm font-bold tracking-wide">BROADCASTING</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-800 text-gray-400">
            {isRelay ? '\u{1F504} Relay' : '\u{26A1} Direct'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="tabular-nums text-xs text-gray-500">{uptime}</span>
          <button
            onClick={() => setExpanded(false)}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Per-platform rows */}
      <div className="divide-y divide-gray-800/50">
        {targets.map((target) => {
          const icon = PLATFORM_ICONS[target.platform] || PLATFORM_ICONS.custom;
          const statusStyle = STATUS_STYLES[target.status] || STATUS_STYLES.stopped;
          const viewers = viewerCounts[target.platform];
          const isError = target.status === 'error';
          const isStopped = target.status === 'stopped';

          return (
            <div
              key={target.platform}
              className="flex items-center justify-between px-4 py-2.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base flex-shrink-0">{icon}</span>
                <div className="min-w-0">
                  <span className="text-sm text-white font-medium block truncate">
                    {target.name || target.platform}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                    <span className="text-xs text-gray-500">{statusStyle.label}</span>
                    {typeof viewers === 'number' && (
                      <span className="text-xs text-gray-600 ml-1">
                        &middot; {viewers.toLocaleString()} viewer{viewers !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 ml-2">
                {isError && (
                  <button
                    onClick={() => onRetryTarget(target.platform)}
                    disabled={isRelay}
                    className="px-2 py-1 text-xs rounded bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title={isRelay ? 'Stop all to retry in relay mode' : 'Retry connection'}
                  >
                    Retry
                  </button>
                )}
                {!isError && !isStopped && (
                  <button
                    onClick={() => onStopTarget(target.platform)}
                    disabled={isRelay}
                    className="px-2 py-1 text-xs rounded bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title={isRelay ? 'Stop all to manage in relay mode' : 'Stop this stream'}
                  >
                    Stop
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/[0.08]">
        <button
          onClick={onStopAll}
          className="w-full px-3 py-2 rounded-lg bg-red-600/15 text-red-400 text-sm font-semibold hover:bg-red-600/25 transition-colors"
        >
          Stop All
        </button>
      </div>
    </div>
  );
}
