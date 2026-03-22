'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePlayer } from '@/providers/audio';
import { getSupabaseBrowser } from '@/lib/db/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { TrackMetadata } from '@/types/music';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ListenerInfo = {
  fid: number;
  displayName: string;
  pfpUrl?: string;
};

export type DJCommand =
  | { type: 'play'; track: TrackMetadata; timestamp: number }
  | { type: 'pause'; timestamp: number }
  | { type: 'resume'; timestamp: number }
  | { type: 'seek'; position: number; timestamp: number }
  | { type: 'skip'; track: TrackMetadata; timestamp: number };

export type RoomState = {
  roomId: string | null;
  isDJ: boolean;
  djInfo: ListenerInfo | null;
  listeners: ListenerInfo[];
  currentTrack: TrackMetadata | null;
  isPlaying: boolean;
  isConnected: boolean;
};

const BROADCAST_EVENT = 'dj-command';
const SYNC_REQUEST_EVENT = 'sync-request';
const SYNC_RESPONSE_EVENT = 'sync-response';

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useListeningRoom(userInfo: ListenerInfo | null) {
  const player = usePlayer();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isDJ, setIsDJ] = useState(false);
  const [djInfo, setDjInfo] = useState<ListenerInfo | null>(null);
  const [listeners, setListeners] = useState<ListenerInfo[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<TrackMetadata | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Track whether we're the DJ to avoid reacting to our own commands
  const isDJRef = useRef(false);
  useEffect(() => { isDJRef.current = isDJ; }, [isDJ]);

  // ── Presence sync ──────────────────────────────────────────────────────────

  const syncPresence = useCallback((channel: RealtimeChannel) => {
    const state = channel.presenceState<{ user: ListenerInfo; isDJ: boolean }>();
    const all: ListenerInfo[] = [];
    let foundDJ: ListenerInfo | null = null;

    for (const key of Object.keys(state)) {
      for (const presence of state[key]) {
        all.push(presence.user);
        if (presence.isDJ) {
          foundDJ = presence.user;
        }
      }
    }

    setListeners(all);
    setDjInfo(foundDJ);

    // If the DJ left and we're the first remaining listener, become DJ
    if (!foundDJ && all.length > 0 && userInfo) {
      const sorted = [...all].sort((a, b) => a.fid - b.fid);
      if (sorted[0].fid === userInfo.fid) {
        setIsDJ(true);
        // Re-track presence with DJ flag
        channel.track({ user: userInfo, isDJ: true });
      }
    }
  }, [userInfo]);

  // ── Handle incoming DJ commands (listeners only) ───────────────────────────

  const handleDJCommand = useCallback((command: DJCommand) => {
    if (isDJRef.current) return; // DJ ignores own broadcasts

    switch (command.type) {
      case 'play':
      case 'skip':
        setCurrentTrack(command.track);
        setIsPlaying(true);
        player.play(command.track);
        break;
      case 'pause':
        setIsPlaying(false);
        player.pause();
        break;
      case 'resume':
        setIsPlaying(true);
        player.resume();
        break;
      case 'seek':
        player.seek(command.position);
        break;
    }
  }, [player]);

  // ── Join room ──────────────────────────────────────────────────────────────

  const joinRoom = useCallback((id: string) => {
    if (!userInfo) return;
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    const supabase = getSupabaseBrowser();
    const channel = supabase.channel(`listening-room:${id}`, {
      config: { presence: { key: String(userInfo.fid) } },
    });

    // Listen for DJ commands
    channel.on('broadcast', { event: BROADCAST_EVENT }, ({ payload }) => {
      handleDJCommand(payload as DJCommand);
    });

    // Listen for sync requests (when new listeners join)
    channel.on('broadcast', { event: SYNC_REQUEST_EVENT }, () => {
      if (!isDJRef.current) return;
      // DJ responds with current state
      const meta = player.metadata;
      if (meta) {
        channel.send({
          type: 'broadcast',
          event: SYNC_RESPONSE_EVENT,
          payload: {
            track: meta,
            isPlaying: player.isPlaying,
            position: player.position,
          },
        });
      }
    });

    // Listen for sync responses (for new listeners)
    channel.on('broadcast', { event: SYNC_RESPONSE_EVENT }, ({ payload }) => {
      if (isDJRef.current) return;
      const { track, isPlaying: playing, position } = payload as {
        track: TrackMetadata;
        isPlaying: boolean;
        position: number;
      };
      setCurrentTrack(track);
      setIsPlaying(playing);
      player.play(track);
      // Seek to approximate position after a brief delay for loading
      setTimeout(() => {
        player.seek(position);
        if (!playing) player.pause();
      }, 500);
    });

    // Presence tracking
    channel.on('presence', { event: 'sync' }, () => {
      syncPresence(channel);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);

        // Check if anyone else is in the room
        const existing = channel.presenceState();
        const hasOthers = Object.keys(existing).length > 0;

        // First person becomes DJ
        const willBeDJ = !hasOthers;
        setIsDJ(willBeDJ);

        await channel.track({ user: userInfo, isDJ: willBeDJ });

        // If not DJ, request sync from current DJ
        if (!willBeDJ) {
          setTimeout(() => {
            channel.send({
              type: 'broadcast',
              event: SYNC_REQUEST_EVENT,
              payload: {},
            });
          }, 300);
        }
      }
    });

    channelRef.current = channel;
    setRoomId(id);
  }, [userInfo, handleDJCommand, syncPresence, player]);

  // ── Leave room ─────────────────────────────────────────────────────────────

  const leaveRoom = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    setRoomId(null);
    setIsDJ(false);
    setDjInfo(null);
    setListeners([]);
    setIsConnected(false);
    setCurrentTrack(null);
    setIsPlaying(false);
    player.stop();
  }, [player]);

  // ── Become DJ (request) ────────────────────────────────────────────────────

  const becomeDJ = useCallback(() => {
    if (!channelRef.current || !userInfo) return;
    setIsDJ(true);
    channelRef.current.track({ user: userInfo, isDJ: true });
  }, [userInfo]);

  // ── DJ broadcast helpers ───────────────────────────────────────────────────

  const broadcastPlay = useCallback((track: TrackMetadata) => {
    if (!channelRef.current || !isDJRef.current) return;
    setCurrentTrack(track);
    setIsPlaying(true);
    player.play(track);
    channelRef.current.send({
      type: 'broadcast',
      event: BROADCAST_EVENT,
      payload: { type: 'play', track, timestamp: Date.now() } satisfies DJCommand,
    });
  }, [player]);

  const broadcastPause = useCallback(() => {
    if (!channelRef.current || !isDJRef.current) return;
    setIsPlaying(false);
    player.pause();
    channelRef.current.send({
      type: 'broadcast',
      event: BROADCAST_EVENT,
      payload: { type: 'pause', timestamp: Date.now() } satisfies DJCommand,
    });
  }, [player]);

  const broadcastResume = useCallback(() => {
    if (!channelRef.current || !isDJRef.current) return;
    setIsPlaying(true);
    player.resume();
    channelRef.current.send({
      type: 'broadcast',
      event: BROADCAST_EVENT,
      payload: { type: 'resume', timestamp: Date.now() } satisfies DJCommand,
    });
  }, [player]);

  const broadcastSeek = useCallback((position: number) => {
    if (!channelRef.current || !isDJRef.current) return;
    player.seek(position);
    channelRef.current.send({
      type: 'broadcast',
      event: BROADCAST_EVENT,
      payload: { type: 'seek', position, timestamp: Date.now() } satisfies DJCommand,
    });
  }, [player]);

  const broadcastSkip = useCallback((track: TrackMetadata) => {
    if (!channelRef.current || !isDJRef.current) return;
    setCurrentTrack(track);
    setIsPlaying(true);
    player.play(track);
    channelRef.current.send({
      type: 'broadcast',
      event: BROADCAST_EVENT,
      payload: { type: 'skip', track, timestamp: Date.now() } satisfies DJCommand,
    });
  }, [player]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, []);

  return {
    // State
    roomId,
    isDJ,
    djInfo,
    listeners,
    currentTrack,
    isPlaying,
    isConnected,

    // Actions
    joinRoom,
    leaveRoom,
    becomeDJ,

    // DJ broadcast actions
    broadcastPlay,
    broadcastPause,
    broadcastResume,
    broadcastSeek,
    broadcastSkip,
  };
}
