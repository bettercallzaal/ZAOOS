'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { usePlayerContext } from './PlayerProvider';

export function HTMLAudioProvider({ children }: { children: ReactNode }) {
  const { state, dispatch, registerController } = usePlayerContext();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeUrlRef = useRef<string | null>(null);

  // Create audio element and register controllers on mount
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const onTimeUpdate = () =>
      dispatch({ type: 'PROGRESS', payload: audio.currentTime * 1000 });

    const onDurationChange = () => {
      if (isFinite(audio.duration)) {
        dispatch({ type: 'SET_DURATION', payload: audio.duration * 1000 });
      }
    };

    const onCanPlay = () => {
      audio.play().catch(console.error);
      dispatch({ type: 'LOADED' });
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('canplay', onCanPlay);

    const controller = {
      play: () => audio.play().catch(console.error),
      pause: () => audio.pause(),
      seek: (ms: number) => {
        audio.currentTime = ms / 1000;
      },
      load: (url: string) => {
        activeUrlRef.current = url;
        audio.src = url;
        audio.load();
      },
    };

    registerController('audio', controller);
    registerController('soundxyz', controller);
    registerController('audius', controller);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('canplay', onCanPlay);
      audioRef.current = null;
    };
  }, [dispatch, registerController]);

  // React to new audio/soundxyz tracks
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const { metadata, status } = state;

    if (!metadata || (metadata.type !== 'audio' && metadata.type !== 'soundxyz' && metadata.type !== 'audius')) {
      // Different type — stop our audio
      if (!audio.paused) {
        audio.pause();
        activeUrlRef.current = null;
      }
      return;
    }

    if (status === 'loading') {
      const playUrl = metadata.streamUrl ?? metadata.url;
      if (activeUrlRef.current !== playUrl) {
        activeUrlRef.current = playUrl;
        audio.src = playUrl;
        audio.load();
        // onCanPlay will fire and trigger play + LOADED dispatch
      }
    }
  }, [state.metadata?.url, state.status, state.metadata?.type]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
