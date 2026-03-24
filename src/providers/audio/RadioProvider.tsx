'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { usePlayer, usePlayerContext } from '@/providers/audio';
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

interface RadioState {
  isRadioMode: boolean;
  radioLoading: boolean;
  radioPlaylist: RadioPlaylist | null;
  radioQueue: RadioTrack[];
  radioIndex: number;
  startRadio: (startIndex?: number) => Promise<void>;
  stopRadio: () => void;
  nextRadioTrack: () => void;
  prevRadioTrack: () => void;
  availableStations: string[];
  currentStationIndex: number;
  switchStation: (index: number) => void;
}

const RadioContext = createContext<RadioState | null>(null);

const RADIO_STORAGE_KEY = 'zao-radio-state';

export function RadioProvider({ children }: { children: ReactNode }) {
  const player = usePlayer();
  const { onEndedRef } = usePlayerContext();
  const [isRadioMode, setIsRadioMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return JSON.parse(localStorage.getItem(RADIO_STORAGE_KEY) || 'false');
    } catch { return false; }
  });
  const [radioLoading, setRadioLoading] = useState(false);
  const [allStations, setAllStations] = useState<RadioPlaylist[]>([]);
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const radioQueueRef = useRef<RadioTrack[]>([]);
  const radioIndexRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const cachedStationsRef = useRef<RadioPlaylist[] | null>(null);

  // Persist radio mode
  useEffect(() => {
    try { localStorage.setItem(RADIO_STORAGE_KEY, JSON.stringify(isRadioMode)); } catch {}
  }, [isRadioMode]);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  // Pre-fetch stations on mount so radio starts instantly
  useEffect(() => {
    if (cachedStationsRef.current) return;
    const controller = new AbortController();
    fetch('/api/music/radio', { signal: controller.signal })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.playlists?.length) {
          cachedStationsRef.current = data.playlists;
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const fetchStations = useCallback(async (signal: AbortSignal): Promise<RadioPlaylist[]> => {
    if (cachedStationsRef.current) return cachedStationsRef.current;
    const res = await fetch('/api/music/radio', { signal });
    if (!res.ok) throw new Error('Failed to fetch radio');
    const data = await res.json();
    const playlists = data.playlists ?? [];
    if (playlists.length > 0) cachedStationsRef.current = playlists;
    return playlists;
  }, []);

  const playStation = useCallback((playlist: RadioPlaylist) => {
    if (playlist.tracks.length === 0) return;
    const shuffled = shuffleArray(playlist.tracks);
    radioQueueRef.current = shuffled;
    radioIndexRef.current = 0;
    const first = shuffled[0];
    player.play(radioTrackToMetadata(first, `radio-${first.id}`));
    setIsRadioMode(true);
    if (!player.shuffle) player.toggleShuffle();
  }, [player]);

  const startRadio = useCallback(async (startIndex = 0) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setRadioLoading(true);
    try {
      const playlists = await fetchStations(controller.signal);
      if (playlists.length === 0) throw new Error('No stations');
      setAllStations(playlists);
      const idx = Math.min(startIndex, playlists.length - 1);
      setCurrentStationIndex(idx);
      playStation(playlists[idx]);
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
    if (radioIndexRef.current === 0) {
      radioQueueRef.current = shuffleArray(queue);
    }
    const track = radioQueueRef.current[radioIndexRef.current];
    player.play(radioTrackToMetadata(track, `radio-${track.id}`));
  }, [player]);

  const prevRadioTrack = useCallback(() => {
    const queue = radioQueueRef.current;
    if (queue.length === 0) return;
    radioIndexRef.current = radioIndexRef.current > 0
      ? radioIndexRef.current - 1
      : queue.length - 1;
    const track = radioQueueRef.current[radioIndexRef.current];
    player.play(radioTrackToMetadata(track, `radio-${track.id}`));
  }, [player]);

  // Auto-advance when track ends — use onEndedRef directly (stable ref)
  // instead of player.setOnEnded which has an unstable dependency on player
  const nextRef = useRef(nextRadioTrack);
  nextRef.current = nextRadioTrack;

  useEffect(() => {
    if (isRadioMode) {
      onEndedRef.current = () => nextRef.current();
      return () => { onEndedRef.current = null; };
    }
  }, [isRadioMode, onEndedRef]);

  const currentStation = allStations[currentStationIndex] ?? null;

  return (
    <RadioContext.Provider value={{
      isRadioMode,
      radioLoading,
      radioPlaylist: currentStation,
      radioQueue: radioQueueRef.current,
      radioIndex: radioIndexRef.current,
      startRadio,
      stopRadio,
      nextRadioTrack,
      prevRadioTrack,
      availableStations: allStations.map((s) => s.name),
      currentStationIndex,
      switchStation,
    }}>
      {children}
    </RadioContext.Provider>
  );
}

export function useRadioContext(): RadioState {
  const ctx = useContext(RadioContext);
  if (!ctx) throw new Error('useRadioContext must be used within RadioProvider');
  return ctx;
}
