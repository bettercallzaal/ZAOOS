'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePlayer } from '@/providers/audio';
import { getSupabaseBrowser } from '@/lib/db/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface NowPlayingEntry {
  fid: number;
  username: string;
  trackName: string;
  artistName: string;
  artworkUrl: string;
  url: string;
  type: string;
}

/**
 * Broadcasts the current user's playing track via Supabase Realtime presence
 * and returns an array of all online members and what they're listening to.
 */
export function useNowPlaying(user: { fid: number; username: string } | null) {
  const player = usePlayer();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [presenceState, setPresenceState] = useState<NowPlayingEntry[]>([]);
  const trackedRef = useRef(false);

  // Sync presence whenever it changes
  const syncPresence = useCallback(() => {
    const ch = channelRef.current;
    if (!ch) return;

    const state = ch.presenceState<NowPlayingEntry>();
    const entries: NowPlayingEntry[] = [];
    for (const key of Object.keys(state)) {
      const presences = state[key];
      if (presences) {
        for (const p of presences) {
          entries.push({
            fid: p.fid,
            username: p.username,
            trackName: p.trackName,
            artistName: p.artistName,
            artworkUrl: p.artworkUrl,
            url: p.url,
            type: p.type,
          });
        }
      }
    }
    setPresenceState(entries);
  }, []);

  // Subscribe to the channel on mount
  useEffect(() => {
    if (!user) return;

    const supabase = getSupabaseBrowser();
    const channel = supabase.channel('now-playing', {
      config: { presence: { key: String(user.fid) } },
    });

    channel
      .on('presence', { event: 'sync' }, syncPresence)
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [user, syncPresence]);

  // Track/untrack based on player state
  useEffect(() => {
    const ch = channelRef.current;
    if (!ch || !user) return;

    const meta = player.metadata;
    const isPlaying = player.isPlaying;

    if (isPlaying && meta) {
      const payload: NowPlayingEntry = {
        fid: user.fid,
        username: user.username,
        trackName: meta.trackName,
        artistName: meta.artistName,
        artworkUrl: meta.artworkUrl,
        url: meta.url,
        type: meta.type,
      };
      ch.track(payload);
      trackedRef.current = true;
    } else if (trackedRef.current) {
      ch.untrack();
      trackedRef.current = false;
    }
  }, [player.metadata, player.isPlaying, user]);

  return { presenceState };
}
