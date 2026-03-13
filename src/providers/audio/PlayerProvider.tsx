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

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused';

export type PlayerState = {
  status: PlayerStatus;
  metadata: TrackMetadata | null;
  position: number; // ms
  duration: number; // ms
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
  | { type: 'STOP' };

const initial: PlayerState = {
  status: 'idle',
  metadata: null,
  position: 0,
  duration: 0,
};

function reducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'PLAY':
      return { ...initial, status: 'loading', metadata: action.payload };
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
      return initial;
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
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const controllers = useRef<Partial<Record<TrackType, AudioController>>>({});

  const registerController = useCallback(
    (type: TrackType, controller: AudioController) => {
      controllers.current[type] = controller;
    },
    [],
  );

  return (
    <PlayerContext.Provider value={{ state, dispatch, controllers, registerController }}>
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
  const { state, dispatch, controllers } = usePlayerContext();

  const getController = () =>
    state.metadata ? (controllers.current[state.metadata.type] ?? null) : null;

  return {
    metadata: state.metadata,
    status: state.status,
    position: state.position,
    duration: state.duration,
    isPlaying: state.status === 'playing',
    isLoading: state.status === 'loading',

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
  };
}
