'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { usePlayerContext } from './PlayerProvider';
import { getEqualizer } from '@/lib/music/equalizer';

// Module-level audio elements — survive component re-mounts and React strict mode
let audioA: HTMLAudioElement | null = null;
let audioB: HTMLAudioElement | null = null;

export function HTMLAudioProvider({ children }: { children: ReactNode }) {
  const { state, dispatch, registerController, onEndedRef } = usePlayerContext();
  const activeAudioRef = useRef<'A' | 'B'>('A');
  const activeUrlRef = useRef<string | null>(null);
  const crossfadeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Refs to avoid stale closures in the main useEffect
  const crossfadeRef = useRef(state.crossfade);
  const volumeRef = useRef(state.volume);
  crossfadeRef.current = state.crossfade;
  volumeRef.current = state.volume;

  const getActive = () => (activeAudioRef.current === 'A' ? audioA : audioB)!;
  const getInactive = () => (activeAudioRef.current === 'A' ? audioB : audioA)!;

  // Create audio elements once (module-level singletons)
  useEffect(() => {
    if (!audioA) audioA = new Audio();
    if (!audioB) audioB = new Audio();

    // Expose active audio element globally for AudioFiltersPanel (Web Audio API)
    (globalThis as Record<string, unknown>).__zao_audio_a = audioA;
    (globalThis as Record<string, unknown>).__zao_audio_b = audioB;
    const audio = getActive();

    // Only process events from the ACTIVE audio element to prevent
    // inactive element's canplay/ended/error from corrupting state
    const isActive = (e: Event) => e.target === getActive();

    const onTimeUpdate = (e: Event) => {
      if (!isActive(e)) return;
      const a = getActive();
      dispatch({ type: 'PROGRESS', payload: a.currentTime * 1000 });

      // Crossfade trigger: start fading when nearing end of track
      const crossfadeSec = crossfadeRef.current;
      if (crossfadeSec > 0 && a.duration > 0 && !crossfadeTimerRef.current) {
        const timeLeft = a.duration - a.currentTime;
        if (timeLeft <= crossfadeSec && timeLeft > 0 && onEndedRef.current) {
          // Start crossfade — trigger next track early
          startCrossfade(crossfadeSec);
        }
      }
    };

    const onDurationChange = (e: Event) => {
      if (!isActive(e)) return;
      const a = getActive();
      if (isFinite(a.duration)) {
        dispatch({ type: 'SET_DURATION', payload: a.duration * 1000 });
      }
    };

    const onCanPlay = (e: Event) => {
      if (!isActive(e)) return;
      const a = getActive();
      a.play().catch((err: unknown) => {
        console.error('[Audio] play blocked:', err);
        dispatch({ type: 'ERROR', payload: 'Tap play again — browser blocked autoplay' });
      });
      dispatch({ type: 'LOADED' });
    };

    const onEnded = (e: Event) => {
      if (!isActive(e)) return;
      // If crossfade already handled the transition, skip
      if (crossfadeTimerRef.current) return;
      if (onEndedRef.current) {
        onEndedRef.current();
      } else {
        dispatch({ type: 'STOP' });
      }
    };

    const onError = (e: Event) => {
      if (!isActive(e)) return;
      const a = getActive();
      const code = a.error?.code;
      const messages: Record<number, string> = {
        1: 'Playback aborted',
        2: 'Network error — check your connection',
        3: 'Audio decode failed',
        4: 'Audio format not supported',
      };
      dispatch({ type: 'ERROR', payload: messages[code ?? 0] || 'Audio failed to load' });
    };

    // Attach listeners to both audio elements
    for (const a of [audioA!, audioB!]) {
      a.addEventListener('timeupdate', onTimeUpdate);
      a.addEventListener('durationchange', onDurationChange);
      a.addEventListener('canplay', onCanPlay);
      a.addEventListener('ended', onEnded);
      a.addEventListener('error', onError);
    }

    const controller = {
      play: () => getActive().play().catch(console.error),
      pause: () => {
        getActive().pause();
        // Also pause inactive if it was mid-crossfade
        const inactive = getInactive();
        if (!inactive.paused) inactive.pause();
        clearCrossfade();
      },
      seek: (ms: number) => {
        getActive().currentTime = ms / 1000;
      },
      load: (url: string) => {
        const crossfadeSec = crossfadeRef.current;

        // If crossfade is active and we're loading a new track, use the inactive element
        if (crossfadeSec > 0 && !getActive().paused && activeUrlRef.current) {
          // Crossfade load: put new track on inactive element
          const inactive = getInactive();
          inactive.src = url;
          inactive.volume = 0;
          inactive.load();
          inactive.play().catch(() => {});

          // Swap active
          activeAudioRef.current = activeAudioRef.current === 'A' ? 'B' : 'A';
          activeUrlRef.current = url;

          // Connect EQ to the new active element
          try { getEqualizer().connect(inactive); } catch {}

          // Fade: ramp new up, old down
          performCrossfade(crossfadeSec);
          return;
        }

        // Normal load (no crossfade)
        clearCrossfade();
        const active = getActive();
        activeUrlRef.current = url;
        active.src = url;
        active.load();
        // Connect EQ to the active element
        try { getEqualizer().connect(active); } catch {}
        active.play().catch(() => {});
      },
      setVolume: (v: number) => {
        getActive().volume = v;
      },
    };

    registerController('audio', controller);
    registerController('soundxyz', controller);
    registerController('audius', controller);

    return () => {
      for (const a of [audioA!, audioB!]) {
        a.removeEventListener('timeupdate', onTimeUpdate);
        a.removeEventListener('durationchange', onDurationChange);
        a.removeEventListener('canplay', onCanPlay);
        a.removeEventListener('ended', onEnded);
        a.removeEventListener('error', onError);
      }
      clearCrossfade();
    };
  }, [dispatch, registerController]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Crossfade helpers ──────────────────────────────────────────────

  function startCrossfade(durationSec: number) {
    if (crossfadeTimerRef.current) return; // already crossfading
    // Trigger next track via onEnded callback — the load() will handle the crossfade
    if (onEndedRef.current) {
      onEndedRef.current();
    }
  }

  function performCrossfade(durationSec: number) {
    clearCrossfade();
    const active = getActive(); // new track (just loaded)
    const old = getInactive(); // previous track (fading out)
    const targetVolume = volumeRef.current;
    const steps = Math.max(1, durationSec * 20); // 20 steps per second
    const interval = (durationSec * 1000) / steps;
    let step = 0;

    crossfadeTimerRef.current = setInterval(() => {
      step++;
      const progress = step / steps;

      // Fade in new track
      active.volume = Math.min(targetVolume, targetVolume * progress);
      // Fade out old track
      old.volume = Math.max(0, targetVolume * (1 - progress));

      if (step >= steps) {
        clearCrossfade();
        old.pause();
        old.removeAttribute('src');
        old.load();
        active.volume = targetVolume;
      }
    }, interval);
  }

  function clearCrossfade() {
    if (crossfadeTimerRef.current) {
      clearInterval(crossfadeTimerRef.current);
      crossfadeTimerRef.current = null;
    }
  }

  // React to new audio/soundxyz tracks
  useEffect(() => {
    const audio = getActive();
    if (!audio) return;
    const { metadata, status } = state;

    const htmlAudioTypes = ['audio', 'soundxyz', 'audius'];
    if (!metadata || !htmlAudioTypes.includes(metadata.type)) {
      // Different type — stop our audio
      if (!audio.paused) {
        audio.pause();
        activeUrlRef.current = null;
      }
      const inactive = getInactive();
      if (inactive && !inactive.paused) inactive.pause();
      clearCrossfade();
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
      }
    }
  }, [state.metadata?.url, state.status, state.metadata?.type, state.volume]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
