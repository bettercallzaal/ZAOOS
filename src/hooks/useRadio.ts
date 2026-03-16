'use client';

import { useState, useCallback, useRef } from 'react';
import { usePlayer } from '@/providers/audio';
import type { RadioTrack, RadioPlaylist } from '@/app/api/music/radio/route';
import type { TrackMetadata } from '@/types/music';

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function radioTrackToMetadata(track: RadioTrack, feedId: string): TrackMetadata {
  return {
    id: track.id,
    type: 'audius',
    trackName: track.title,
    artistName: track.artist,
    artworkUrl: track.artworkUrl,
    url: track.url,
    streamUrl: track.streamUrl,
    feedId,
  };
}

export function useRadio() {
  const player = usePlayer();
  const [isRadioMode, setIsRadioMode] = useState(false);
  const [radioLoading, setRadioLoading] = useState(false);
  const [radioPlaylist, setRadioPlaylist] = useState<RadioPlaylist | null>(null);
  const radioQueueRef = useRef<RadioTrack[]>([]);
  const radioIndexRef = useRef(0);

  const startRadio = useCallback(async () => {
    setRadioLoading(true);
    try {
      const res = await fetch('/api/music/radio');
      if (!res.ok) throw new Error('Failed to fetch radio');
      const data = await res.json();
      const playlist: RadioPlaylist | undefined = data.playlists?.[0];
      if (!playlist || playlist.tracks.length === 0) throw new Error('No tracks');

      setRadioPlaylist(playlist);
      const shuffled = shuffleArray(playlist.tracks);
      radioQueueRef.current = shuffled;
      radioIndexRef.current = 0;

      // Play first track
      const first = shuffled[0];
      const metadata = radioTrackToMetadata(first, `radio-${first.id}`);
      player.play(metadata);
      setIsRadioMode(true);

      // Enable shuffle mode in player
      if (!player.shuffle) player.toggleShuffle();
    } catch (err) {
      console.error('Radio start failed:', err);
    } finally {
      setRadioLoading(false);
    }
  }, [player]);

  const stopRadio = useCallback(() => {
    setIsRadioMode(false);
    radioQueueRef.current = [];
    radioIndexRef.current = 0;
    player.stop();
  }, [player]);

  const nextRadioTrack = useCallback(() => {
    const queue = radioQueueRef.current;
    if (queue.length === 0) return;

    radioIndexRef.current = (radioIndexRef.current + 1) % queue.length;
    // Reshuffle when we wrap around
    if (radioIndexRef.current === 0) {
      radioQueueRef.current = shuffleArray(queue);
    }
    const track = radioQueueRef.current[radioIndexRef.current];
    const metadata = radioTrackToMetadata(track, `radio-${track.id}`);
    player.play(metadata);
  }, [player]);

  const prevRadioTrack = useCallback(() => {
    const queue = radioQueueRef.current;
    if (queue.length === 0) return;

    radioIndexRef.current = radioIndexRef.current > 0
      ? radioIndexRef.current - 1
      : queue.length - 1;
    const track = radioQueueRef.current[radioIndexRef.current];
    const metadata = radioTrackToMetadata(track, `radio-${track.id}`);
    player.play(metadata);
  }, [player]);

  return {
    isRadioMode,
    radioLoading,
    radioPlaylist,
    radioQueue: radioQueueRef.current,
    radioIndex: radioIndexRef.current,
    startRadio,
    stopRadio,
    nextRadioTrack,
    prevRadioTrack,
  };
}
