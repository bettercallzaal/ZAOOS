'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePlayer } from '@/providers/audio';

/**
 * Pushes now-playing state to /api/overlay/now-playing/update every 5s.
 * This feeds the OBS overlay page at /overlay/now-playing?fid=xxx.
 * Only active when the user has an fid (authenticated).
 */
export function useOverlaySync(fid: number | undefined) {
  const player = usePlayer();
  const lastKeyRef = useRef('');
  const playerRef = useRef(player);
  playerRef.current = player;

  const push = useCallback(async () => {
    if (!fid) return;
    const p = playerRef.current;
    const meta = p.metadata;

    if (!meta && !p.isPlaying) {
      // Nothing to report — skip unless we previously reported playing
      if (lastKeyRef.current === '') return;
    }

    const payload = {
      trackName: meta?.trackName ?? '',
      artistName: meta?.artistName ?? '',
      artworkUrl: meta?.artworkUrl ?? '',
      platform: meta?.type ?? 'audio',
      position: p.position,
      duration: p.duration,
      url: meta?.url ?? '',
      isPlaying: p.isPlaying,
    };

    const key = `${payload.trackName}|${payload.isPlaying}`;
    // Always push position updates when playing, dedupe when idle
    if (!p.isPlaying && key === lastKeyRef.current) return;
    lastKeyRef.current = key;

    try {
      await fetch('/api/overlay/now-playing/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      // Silently fail — overlay sync is non-critical
    }
  }, [fid]);

  useEffect(() => {
    if (!fid) return;
    push();
    const interval = setInterval(push, 5000);
    return () => clearInterval(interval);
  }, [fid, push]);
}
