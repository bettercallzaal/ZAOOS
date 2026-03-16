'use client';

import {
  createContext,
  useContext,
  useReducer,
  useRef,
  useCallback,
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
  | { type: 'CYCLE_REPEAT' };

const initial: PlayerState = {
  status: 'idle',
  metadata: null,
  position: 0,
  duration: 0,
  volume: 1,
  shuffle: false,
  repeat: 'off',
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
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

type PlayerContextValue = {
  state: PlayerState;
  dispatch: Dispatch<PlayerAction>;
  controllers: MutableRefObject<Partial<Record<TrackType, AudioController>>>;
  registerController: (type: TrackType, controller: AudioController) => void;
  onEndedRef: MutableRefObject<(() => void) | null>;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const controllers = useRef<Partial<Record<TrackType, AudioController>>>({});
  const onEndedRef = useRef<(() => void) | null>(null);

  const registerController = useCallback(
    (type: TrackType, controller: AudioController) => {
      controllers.current[type] = controller;
    },
    [],
  );

  return (
    <PlayerContext.Provider value={{ state, dispatch, controllers, registerController, onEndedRef }}>
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
  const { state, dispatch, controllers, onEndedRef } = usePlayerContext();

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

    play: (metadata: TrackMetadata) => dispatch({ type: 'PLAY', payload: metadata }),

    pause: () => {
      getController()?.pause();
      dispatch({ type: 'PAUSE' });
    },

    resume: () => {
      getController()?.play();
      dispatch({ type: 'RESUME' });
    },

    seek: (ms: number) => {
      getController()?.seek(ms);
      dispatch({ type: 'SEEK', payload: ms });
    },

    stop: () => {
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

    /** Register a callback for when the current track ends naturally */
    setOnEnded: (callback: (() => void) | null) => {
      onEndedRef.current = callback;
    },
  };
}
