'use client';

import {
  createContext,
  useContext,
  useReducer,
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
  Dispatch,
  ReactNode,
  MutableRefObject,
} from 'react';
import { AudioController, TrackMetadata, TrackType } from '@/types/music';

// ─── State ────────────────────────────────────────────────────────────────────

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';
export type RepeatMode = 'off' | 'all' | 'one';

export type PlayerState = {
  status: PlayerStatus;
  metadata: TrackMetadata | null;
  position: number; // ms
  duration: number; // ms
  volume: number; // 0–1
  shuffle: boolean;
  repeat: RepeatMode;
  crossfade: number; // seconds (0 = off, 1-12)
  error: string | null;
};

// ─── Actions ──────────────────────────────────────────────────────────────────

export type PlayerAction =
  | { type: 'PLAY'; payload: TrackMetadata }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'SEEK'; payload: number }
  | { type: 'PROGRESS'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'LOADED' }
  | { type: 'STOP' }
  | { type: 'ERROR'; payload?: string }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'TOGGLE_SHUFFLE' }
  | { type: 'CYCLE_REPEAT' }
  | { type: 'SET_CROSSFADE'; payload: number };

const initial: PlayerState = {
  status: 'idle',
  metadata: null,
  position: 0,
  duration: 0,
  volume: 1,
  shuffle: false,
  repeat: 'off',
  crossfade: 0,
  error: null,
};

function reducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'PLAY':
      return { ...initial, status: 'loading', metadata: action.payload, volume: state.volume, error: null };
    case 'ERROR':
      return { ...state, status: 'error', error: action.payload || 'Playback failed' };
    case 'PAUSE':
      return state.status === 'playing' ? { ...state, status: 'paused' } : state;
    case 'RESUME':
      return state.status === 'paused' ? { ...state, status: 'playing' } : state;
    case 'LOADED':
      return state.status === 'loading' ? { ...state, status: 'playing' } : state;
    case 'SEEK':
      return { ...state, position: action.payload };
    case 'PROGRESS':
      return { ...state, position: action.payload };
    case 'SET_DURATION':
      return { ...state, duration: action.payload };
    case 'STOP':
      return { ...initial, shuffle: state.shuffle, repeat: state.repeat, volume: state.volume, error: null };
    case 'SET_VOLUME':
      return { ...state, volume: Math.max(0, Math.min(1, action.payload)) };
    case 'TOGGLE_SHUFFLE':
      return { ...state, shuffle: !state.shuffle };
    case 'CYCLE_REPEAT': {
      const next: RepeatMode = state.repeat === 'off' ? 'all' : state.repeat === 'all' ? 'one' : 'off';
      return { ...state, repeat: next };
    }
    case 'SET_CROSSFADE':
      return { ...state, crossfade: Math.max(0, Math.min(12, action.payload)) };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

type RestoredTrack = { metadata: TrackMetadata; position: number; duration: number } | null;

type PlayerContextValue = {
  state: PlayerState;
  dispatch: Dispatch<PlayerAction>;
  controllers: MutableRefObject<Partial<Record<TrackType, AudioController>>>;
  registerController: (type: TrackType, controller: AudioController) => void;
  onEndedRef: MutableRefObject<(() => void) | null>;
  pendingSeekRef: MutableRefObject<number | null>;
  restoredTrack: RestoredTrack;
  clearRestoredTrack: () => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'zao-player-state';

function loadPersistedState(): Partial<PlayerState> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const saved = JSON.parse(raw);
    // Only restore metadata + position — don't restore playing status
    return {
      metadata: saved.metadata ?? null,
      position: saved.position ?? 0,
      duration: saved.duration ?? 0,
      volume: saved.volume ?? 1,
      shuffle: saved.shuffle ?? false,
      repeat: saved.repeat ?? 'off',
      crossfade: saved.crossfade ?? 0,
    };
  } catch { return {}; }
}

// Load persisted state once at module level — avoids ref access during render
const _persisted = loadPersistedState();

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    ...initial,
    volume: _persisted.volume ?? 1,
    shuffle: _persisted.shuffle ?? false,
    repeat: (_persisted.repeat as RepeatMode) ?? 'off',
    crossfade: _persisted.crossfade ?? 0,
  });
  const controllers = useRef<Partial<Record<TrackType, AudioController>>>({});
  const onEndedRef = useRef<(() => void) | null>(null);
  const pendingSeekRef = useRef<number | null>(null);

  // Restored track info — shown in UI but not loaded into audio until user taps play
  const [restoredTrack, setRestoredTrack] = useState<{
    metadata: TrackMetadata;
    position: number;
    duration: number;
  } | null>(() => {
    return _persisted.metadata ? { metadata: _persisted.metadata, position: _persisted.position ?? 0, duration: _persisted.duration ?? 0 } : null;
  });

  // Persist player state to localStorage
  useEffect(() => {
    if (!state.metadata) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        metadata: state.metadata,
        position: state.position,
        duration: state.duration,
        volume: state.volume,
        shuffle: state.shuffle,
        crossfade: state.crossfade,
        repeat: state.repeat,
      }));
    } catch { /* quota exceeded — ignore */ }
  }, [state.metadata, state.position, state.duration, state.volume, state.shuffle, state.repeat]);

  // Ref to current state — for use in stable callbacks that shouldn't re-register on every state change
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; });

  // Media Session API — lock screen controls + background audio keepalive
  useEffect(() => {
    if (!('mediaSession' in navigator) || !state.metadata) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: state.metadata.trackName,
      artist: state.metadata.artistName || 'ZAO Radio',
      album: 'ZAO OS',
      artwork: state.metadata.artworkUrl
        ? [{ src: state.metadata.artworkUrl, sizes: '512x512', type: 'image/jpeg' }]
        : [],
    });

    navigator.mediaSession.playbackState = state.status === 'playing' ? 'playing' : 'paused';

    // Position state — enables lock screen progress bar + scrubber
    if ('setPositionState' in navigator.mediaSession && state.duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: state.duration / 1000,
          playbackRate: 1,
          position: Math.min(Math.max(0, state.position / 1000), state.duration / 1000),
        });
      } catch { /* ignore invalid state */ }
    }
  }, [state.metadata, state.status, state.position, state.duration]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const getCtrl = () => {
      const t = stateRef.current.metadata?.type;
      return t ? controllers.current[t] ?? null : null;
    };

    navigator.mediaSession.setActionHandler('play', () => {
      getCtrl()?.play();
      dispatch({ type: 'RESUME' });
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      getCtrl()?.pause();
      dispatch({ type: 'PAUSE' });
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      if (onEndedRef.current) onEndedRef.current();
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      // Restart current track if > 3s in, otherwise let onPrev handle it
      const pos = stateRef.current.position;
      if (pos > 3000) {
        const ctrl = getCtrl();
        if (ctrl) ctrl.seek(0);
        dispatch({ type: 'SEEK', payload: 0 });
      }
    });

    // Seek backward (lock screen rewind — 10s default)
    try {
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const skip = (details.seekOffset || 10) * 1000;
        const newPos = Math.max(0, stateRef.current.position - skip);
        const ctrl = getCtrl();
        if (ctrl) ctrl.seek(newPos);
        dispatch({ type: 'SEEK', payload: newPos });
      });
    } catch { /* unsupported */ }

    // Seek forward (lock screen fast-forward — 10s default)
    try {
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const skip = (details.seekOffset || 10) * 1000;
        const newPos = Math.min(stateRef.current.duration, stateRef.current.position + skip);
        const ctrl = getCtrl();
        if (ctrl) ctrl.seek(newPos);
        dispatch({ type: 'SEEK', payload: newPos });
      });
    } catch { /* unsupported */ }

    // Seek to specific position (lock screen scrubber drag)
    try {
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime != null) {
          const ms = details.seekTime * 1000;
          const ctrl = getCtrl();
          if (ctrl) ctrl.seek(ms);
          dispatch({ type: 'SEEK', payload: ms });
        }
      });
    } catch { /* unsupported */ }

    // Stop
    try {
      navigator.mediaSession.setActionHandler('stop', () => {
        getCtrl()?.pause();
        dispatch({ type: 'STOP' });
      });
    } catch { /* unsupported */ }

    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      try { navigator.mediaSession.setActionHandler('seekbackward', null); } catch {}
      try { navigator.mediaSession.setActionHandler('seekforward', null); } catch {}
      try { navigator.mediaSession.setActionHandler('seekto', null); } catch {}
      try { navigator.mediaSession.setActionHandler('stop', null); } catch {}
    };
  }, [dispatch]);

  // Wake Lock — keep screen on during playback
  useEffect(() => {
    if (state.status !== 'playing' || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    navigator.wakeLock.request('screen')
      .then((l) => { lock = l; })
      .catch(() => {}); // Not critical — silently fail
    return () => { lock?.release(); };
  }, [state.status]);

  const registerController = useCallback(
    (type: TrackType, controller: AudioController) => {
      controllers.current[type] = controller;
    },
    [],
  );

  const clearRestoredTrack = useCallback(() => setRestoredTrack(null), []);

  // Seek to pending position when track becomes playing
  useEffect(() => {
    if (state.status === 'playing' && pendingSeekRef.current !== null && state.metadata) {
      const seekTo = pendingSeekRef.current;
      pendingSeekRef.current = null;
      const controller = controllers.current[state.metadata.type];
      if (controller?.seek) {
        // Small delay to ensure audio is ready for seeking
        setTimeout(() => controller.seek(seekTo), 200);
      }
    }
  }, [state.status, state.metadata]);

  const value = useMemo(
    () => ({ state, dispatch, controllers, registerController, onEndedRef, pendingSeekRef, restoredTrack, clearRestoredTrack }),
    [state, registerController, restoredTrack, clearRestoredTrack],
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function usePlayerContext() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayerContext: must be inside PlayerProvider');
  return ctx;
}

export function usePlayer() {
  const { state, dispatch, controllers, onEndedRef, pendingSeekRef, restoredTrack, clearRestoredTrack } = usePlayerContext();

  const getController = () =>
    state.metadata ? (controllers.current[state.metadata.type] ?? null) : null;

  return {
    metadata: state.metadata,
    status: state.status,
    position: state.position,
    duration: state.duration,
    isPlaying: state.status === 'playing',
    isLoading: state.status === 'loading',
    isError: state.status === 'error',
    error: state.error,

    play: (metadata: TrackMetadata) => {
      navigator.vibrate?.(10);
      dispatch({ type: 'PLAY', payload: metadata });
      clearRestoredTrack();
      // Trigger controller load within user-gesture context so autoplay isn't blocked
      const controller = controllers.current[metadata.type];
      if (controller?.load) {
        const url = metadata.streamUrl ?? metadata.url;
        controller.load(url);
      }
    },

    pause: () => {
      navigator.vibrate?.(10);
      getController()?.pause();
      dispatch({ type: 'PAUSE' });
    },

    resume: () => {
      navigator.vibrate?.(10);
      getController()?.play();
      dispatch({ type: 'RESUME' });
    },

    seek: (ms: number) => {
      getController()?.seek(ms);
      dispatch({ type: 'SEEK', payload: ms });
    },

    stop: () => {
      navigator.vibrate?.(10);
      getController()?.pause();
      dispatch({ type: 'STOP' });
    },

    volume: state.volume,
    shuffle: state.shuffle,
    repeat: state.repeat,
    setVolume: (v: number) => {
      const clamped = Math.max(0, Math.min(1, v));
      getController()?.setVolume?.(clamped);
      dispatch({ type: 'SET_VOLUME', payload: clamped });
    },
    toggleShuffle: () => dispatch({ type: 'TOGGLE_SHUFFLE' }),
    cycleRepeat: () => dispatch({ type: 'CYCLE_REPEAT' }),
    crossfade: state.crossfade,
    setCrossfade: (seconds: number) => dispatch({ type: 'SET_CROSSFADE', payload: seconds }),

    /** Register a callback for when the current track ends naturally */
    setOnEnded: (callback: (() => void) | null) => {
      onEndedRef.current = callback;
    },

    /** Track info restored from localStorage (shown in UI before user taps play) */
    restoredTrack,
    clearRestoredTrack,

    /** Resume the restored track — loads audio and seeks to saved position */
    resumeRestored: () => {
      if (!restoredTrack) return;
      // Set pending seek so when track reaches 'playing' state it seeks to saved position
      if (restoredTrack.position > 0) {
        pendingSeekRef.current = restoredTrack.position;
      }
      dispatch({ type: 'PLAY', payload: restoredTrack.metadata });
      const controller = controllers.current[restoredTrack.metadata.type];
      if (controller?.load) {
        const url = restoredTrack.metadata.streamUrl ?? restoredTrack.metadata.url;
        controller.load(url);
      }
      clearRestoredTrack();
    },
  };
}
