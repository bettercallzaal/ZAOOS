'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
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
  const [allStations, setAllStations] = useState<RadioPlaylist[]>([]);
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const radioQueueRef = useRef<RadioTrack[]>([]);
  const radioIndexRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  // Abort in-flight radio fetch on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const fetchStations = useCallback(async (signal: AbortSignal): Promise<RadioPlaylist[]> => {
    const res = await fetch('/api/music/radio', { signal });
    if (!res.ok) throw new Error('Failed to fetch radio');
    const data = await res.json();
    return data.playlists ?? [];
  }, []);

  const playStation = useCallback((playlist: RadioPlaylist) => {
    if (playlist.tracks.length === 0) return;
    const shuffled = shuffleArray(playlist.tracks);
    radioQueueRef.current = shuffled;
    radioIndexRef.current = 0;

    const first = shuffled[0];
    const metadata = radioTrackToMetadata(first, `radio-${first.id}`);
    player.play(metadata);
    setIsRadioMode(true);

    if (!player.shuffle) player.toggleShuffle();
  }, [player]);

  const startRadio = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setRadioLoading(true);
    try {
      const playlists = await fetchStations(controller.signal);
      if (playlists.length === 0) throw new Error('No stations');

      setAllStations(playlists);
      setCurrentStationIndex(0);
      playStation(playlists[0]);
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error('Radio start failed:', err);
    } finally {
      setRadioLoading(false);
    }
  }, [fetchStations, playStation]);

  const stopRadio = useCallback(() => {
    setIsRadioMode(false);
    radioQueueRef.current = [];
    radioIndexRef.current = 0;
    player.stop();
  }, [player]);

  const switchStation = useCallback((index: number) => {
    if (index < 0 || index >= allStations.length) return;
    setCurrentStationIndex(index);
    playStation(allStations[index]);
  }, [allStations, playStation]);

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

  const currentStation = allStations[currentStationIndex] ?? null;
  const availableStations = allStations.map((s) => s.name);

  return {
    isRadioMode,
    radioLoading,
    radioPlaylist: currentStation,
    radioQueue: radioQueueRef.current,
    radioIndex: radioIndexRef.current,
    startRadio,
    stopRadio,
    nextRadioTrack,
    prevRadioTrack,
    // Multi-station
    availableStations,
    currentStationIndex,
    switchStation,
  };
}
