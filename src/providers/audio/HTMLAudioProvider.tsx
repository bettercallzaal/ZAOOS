'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { usePlayerContext } from './PlayerProvider';

// Module-level audio element — survives component re-mounts and React strict mode
let globalAudio: HTMLAudioElement | null = null;

export function HTMLAudioProvider({ children }: { children: ReactNode }) {
  const { state, dispatch, registerController, onEndedRef } = usePlayerContext();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeUrlRef = useRef<string | null>(null);

  // Create audio element once (module-level singleton)
  useEffect(() => {
    if (!globalAudio) {
      globalAudio = new Audio();
    }
    const audio = globalAudio;
    audioRef.current = audio;

    const onTimeUpdate = () =>
      dispatch({ type: 'PROGRESS', payload: audio.currentTime * 1000 });

    const onDurationChange = () => {
      if (isFinite(audio.duration)) {
        dispatch({ type: 'SET_DURATION', payload: audio.duration * 1000 });
      }
    };

    const onCanPlay = () => {
      audio.play().catch((err: unknown) => {
        console.error('[Audio] play blocked:', err);
        dispatch({ type: 'ERROR', payload: 'Tap play again — browser blocked autoplay' });
      });
      dispatch({ type: 'LOADED' });
    };

    const onEnded = () => {
      if (onEndedRef.current) {
        onEndedRef.current();
      } else {
        dispatch({ type: 'STOP' });
      }
    };

    const onError = () => {
      const code = audio.error?.code;
      const messages: Record<number, string> = {
        1: 'Playback aborted',
        2: 'Network error — check your connection',
        3: 'Audio decode failed',
        4: 'Audio format not supported',
      };
      dispatch({ type: 'ERROR', payload: messages[code ?? 0] || 'Audio failed to load' });
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

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
        // Also call play() directly — on mobile background, the canplay event
        // may not fire for a new source, preventing auto-advance.
        // Calling play() here lets the browser buffer + play in one step.
        // If canplay fires later, its play() call is a no-op on an already-playing element.
        audio.play().catch(() => {
          // Silently catch — onCanPlay will retry, or user will see error there
        });
      },
      setVolume: (v: number) => {
        audio.volume = v;
      },
    };

    registerController('audio', controller);
    registerController('soundxyz', controller);
    registerController('audius', controller);

    return () => {
      // Don't destroy the audio element — just remove listeners
      // The module-level singleton persists across re-mounts
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audioRef.current = null;
    };
  }, [dispatch, registerController]); // eslint-disable-line react-hooks/exhaustive-deps

  // React to new audio/soundxyz tracks
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const { metadata, status } = state;

    const htmlAudioTypes = ['audio', 'soundxyz', 'audius'];
    if (!metadata || !htmlAudioTypes.includes(metadata.type)) {
      // Different type — stop our audio
      if (!audio.paused) {
        audio.pause();
        activeUrlRef.current = null;
      }
      return;
    }

    // Keep volume in sync
    audio.volume = state.volume;

    if (status === 'loading') {
      const playUrl = metadata.streamUrl ?? metadata.url;
      if (activeUrlRef.current !== playUrl) {
        activeUrlRef.current = playUrl;
        audio.src = playUrl;
        audio.load();
        // onCanPlay will fire and trigger play + LOADED dispatch
      }
    }
  }, [state.metadata?.url, state.status, state.metadata?.type, state.volume]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
