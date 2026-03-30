'use client';

import { useEffect, useRef } from 'react';
import { usePlayer } from '@/providers/audio';

const DEBOUNCE_MS = 30_000; // max 1 marker per 30 seconds

/**
 * Auto-creates a Twitch stream marker when the current track changes.
 * Only fires when the user is a host in a room and has Twitch connected.
 *
 * @param isHost - whether the current user is the room host
 * @param twitchConnected - whether the host has Twitch connected
 */
export function useAutoStreamMarker(isHost: boolean, twitchConnected: boolean) {
  const { metadata } = usePlayer();
  const lastMarkerRef = useRef(0);
  const lastTrackIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isHost || !twitchConnected || !metadata) return;

    // Only fire when the track actually changes
    const trackKey = `${metadata.trackName}-${metadata.artistName}`;
    if (trackKey === lastTrackIdRef.current) return;
    lastTrackIdRef.current = trackKey;

    // Debounce: skip if we fired within the last 30s
    const now = Date.now();
    if (now - lastMarkerRef.current < DEBOUNCE_MS) return;
    lastMarkerRef.current = now;

    const description = `Now playing: ${metadata.trackName}${metadata.artistName ? ` by ${metadata.artistName}` : ''}`.slice(0, 140);

    fetch('/api/twitch/marker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    }).catch(() => {
      // Silently fail — markers are non-critical
    });
  }, [isHost, twitchConnected, metadata]);
}
