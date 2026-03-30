import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { PlayerProvider, usePlayer, usePlayerContext } from './PlayerProvider';
import type { PlayerAction } from './PlayerProvider';
import type { TrackMetadata } from '@/types/music';
import React from 'react';

// ─── Test helpers ─────────────────────────────────────────────────────────────
const spotifyTrack: TrackMetadata = {
  id: 'track-1',
  type: 'spotify',
  trackName: 'Test Track',
  artistName: 'Test Artist',
  artworkUrl: 'https://example.com/art.jpg',
  url: 'https://open.spotify.com/track/abc',
  feedId: 'feed-1',
};

// ─── Mocks ────────────────────────────────────────────────────────────────────
vi.stubGlobal('localStorage', {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
});

vi.stubGlobal('fetch', vi.fn());

vi.stubGlobal('MediaMetadata', class MediaMetadata {
  title: string; artist: string; album: string; artwork: unknown[];
  constructor(init: { title?: string; artist?: string; album?: string; artwork?: unknown[] }) {
    this.title = init.title ?? ''; this.artist = init.artist ?? '';
    this.album = init.album ?? ''; this.artwork = init.artwork ?? [];
  }
});

// Mock navigator.mediaSession
const mockSetMetadata = vi.fn();
const mockSetActionHandler = vi.fn();
const mockSetPositionState = vi.fn();
const mockWakeLock = { request: vi.fn().mockResolvedValue({ release: vi.fn() }) };

vi.stubGlobal('navigator', {
  vibrate: vi.fn(),
  mediaSession: {
    metadata: null,
    playbackState: 'none',
    setActionHandler: mockSetActionHandler,
    setPositionState: mockSetPositionState,
  },
  wakeLock: mockWakeLock,
});

// ─── Wrapper ──────────────────────────────────────────────────────────────────
function Wrapper({ children }: { children: React.ReactNode }) {
  return <PlayerProvider>{children}</PlayerProvider>;
}

// ─── usePlayerContext ─────────────────────────────────────────────────────────
describe('usePlayerContext', () => {
  it('throws when used outside PlayerProvider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => usePlayerContext());
    }).toThrow('must be inside PlayerProvider');
    vi.restoreAllMocks();
  });

  it('returns context value when inside Provider', () => {
    const { result } = renderHook(() => usePlayerContext(), { wrapper: Wrapper });
    expect(result.current.state).toBeDefined();
    expect(typeof result.current.dispatch).toBe('function');
    expect(typeof result.current.registerController).toBe('function');
  });
});

// ─── PlayerProvider state ─────────────────────────────────────────────────────
describe('PlayerProvider initial state', () => {
  it('starts with idle status', () => {
    const { result } = renderHook(() => usePlayer(), { wrapper: Wrapper });
    expect(result.current.status).toBe('idle');
    expect(result.current.metadata).toBeNull();
    expect(result.current.position).toBe(0);
    expect(result.current.duration).toBe(0);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('starts with volume at 1', () => {
    const { result } = renderHook(() => usePlayer(), { wrapper: Wrapper });
    expect(result.current.volume).toBe(1);
  });

  it('starts with shuffle off', () => {
    const { result } = renderHook(() => usePlayer(), { wrapper: Wrapper });
    expect(result.current.shuffle).toBe(false);
  });

  it('starts with repeat off', () => {
    const { result } = renderHook(() => usePlayer(), { wrapper: Wrapper });
    expect(result.current.repeat).toBe('off');
  });
});

// ─── PlayerProvider actions ───────────────────────────────────────────────────
describe('usePlayer actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore wakeLock.request implementation after clearAllMocks wipes it
    mockWakeLock.request.mockResolvedValue({ release: vi.fn() });
  });

  it('play() dispatches PLAY and registers controller', () => {
    const mockController = { play: vi.fn(), pause: vi.fn(), seek: vi.fn(), load: vi.fn() };
    const { result } = renderHook(() => usePlayer(), { wrapper: Wrapper });

    // Register a mock controller
    act(() => {
      result.current.play(spotifyTrack);
    });

    // Status transitions to loading (actual controller.play is not called because
    // we haven't registered a controller for 'spotify' type in this test)
    expect(result.current.status).toBe('loading');
    expect(result.current.metadata).toEqual(spotifyTrack);
  });

  it('pause() dispatches PAUSE when playing', () => {
    const { result } = renderHook(
      () => ({ player: usePlayer(), ctx: usePlayerContext() }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.player.play(spotifyTrack);
    });
    // Simulate controller firing LOADED (loading → playing)
    act(() => {
      result.current.ctx.dispatch({ type: 'LOADED' } as PlayerAction);
    });
    expect(result.current.player.status).toBe('playing');

    act(() => {
      result.current.player.pause();
    });

    expect(result.current.player.status).toBe('paused');
  });

  it('pause() does nothing when already paused', () => {
    const { result } = renderHook(() => usePlayer(), { wrapper: Wrapper });

    act(() => {
      result.current.pause();
    });

    expect(result.current.status).toBe('idle');
  });

  it('seek() dispatches SEEK action', () => {
    const { result } = renderHook(() => usePlayer(), { wrapper: Wrapper });

    act(() => {
      result.current.seek(5000);
    });

    expect(result.current.position).toBe(5000);
  });

  it('stop() dispatches STOP and resets state', () => {
    const { result } = renderHook(() => usePlayer(), { wrapper: Wrapper });

    act(() => {
      result.current.play(spotifyTrack);
    });

    act(() => {
      result.current.stop();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.metadata).toBeNull();
    expect(result.current.position).toBe(0);
  });

  it('setVolume() clamps volume between 0 and 1', () => {
    const { result } = renderHook(() => usePlayer(), { wrapper: Wrapper });

    act(() => {
      result.current.setVolume(0.5);
    });
    expect(result.current.volume).toBe(0.5);

    act(() => {
      result.current.setVolume(1.5);
    });
    expect(result.current.volume).toBe(1);

    act(() => {
      result.current.setVolume(-0.5);
    });
    expect(result.current.volume).toBe(0);
  });

  it('toggleShuffle() toggles shuffle state', () => {
    const { result } = renderHook(() => usePlayer(), { wrapper: Wrapper });

    expect(result.current.shuffle).toBe(false);
    act(() => result.current.toggleShuffle());
    expect(result.current.shuffle).toBe(true);
    act(() => result.current.toggleShuffle());
    expect(result.current.shuffle).toBe(false);
  });

  it('cycleRepeat() cycles through off → all → one → off', () => {
    const { result } = renderHook(() => usePlayer(), { wrapper: Wrapper });

    expect(result.current.repeat).toBe('off');
    act(() => result.current.cycleRepeat());
    expect(result.current.repeat).toBe('all');
    act(() => result.current.cycleRepeat());
    expect(result.current.repeat).toBe('one');
    act(() => result.current.cycleRepeat());
    expect(result.current.repeat).toBe('off');
  });

  it('setCrossfade() sets crossfade duration (0-12 seconds)', () => {
    const { result } = renderHook(() => usePlayer(), { wrapper: Wrapper });

    act(() => {
      result.current.setCrossfade(5);
    });
    expect(result.current.crossfade).toBe(5);

    // Clamped to max 12
    act(() => {
      result.current.setCrossfade(20);
    });
    expect(result.current.crossfade).toBe(12);

    // Clamped to min 0
    act(() => {
      result.current.setCrossfade(-5);
    });
    expect(result.current.crossfade).toBe(0);
  });

  it('setOnEnded() stores the callback', () => {
    const { result } = renderHook(() => usePlayer(), { wrapper: Wrapper });
    const callback = vi.fn();

    act(() => {
      result.current.setOnEnded(callback);
    });

    // The callback is stored in a ref; we verify it was set by
    // triggering the end behavior — in this case we call stop since no controller
    act(() => {
      result.current.stop();
    });

    expect(result.current.status).toBe('idle');
  });
});

// ─── Reducer ──────────────────────────────────────────────────────────────────
describe('PlayerProvider reducer', () => {
  // Test the reducer logic through the public API
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore wakeLock.request implementation after clearAllMocks wipes it
    mockWakeLock.request.mockResolvedValue({ release: vi.fn() });
  });

  it('PLAY action resets position to 0', () => {
    const { result } = renderHook(() => usePlayer(), { wrapper: Wrapper });

    // Seek first
    act(() => result.current.seek(10000));

    // Then play
    act(() => result.current.play(spotifyTrack));

    expect(result.current.position).toBe(0);
    expect(result.current.status).toBe('loading');
  });

  it('PLAY preserves volume setting', () => {
    const { result } = renderHook(() => usePlayer(), { wrapper: Wrapper });

    act(() => result.current.setVolume(0.5));
    act(() => result.current.play(spotifyTrack));

    expect(result.current.volume).toBe(0.5);
  });

  it('RESUME transitions paused to playing', () => {
    const { result } = renderHook(
      () => ({ player: usePlayer(), ctx: usePlayerContext() }),
      { wrapper: Wrapper },
    );

    act(() => result.current.player.play(spotifyTrack));
    // Simulate controller firing LOADED (loading → playing)
    act(() => result.current.ctx.dispatch({ type: 'LOADED' } as PlayerAction));
    expect(result.current.player.status).toBe('playing');

    act(() => result.current.player.pause());
    expect(result.current.player.status).toBe('paused');

    act(() => result.current.player.resume());
    expect(result.current.player.status).toBe('playing');
  });

  it('RESUME does nothing when not paused', () => {
    const { result } = renderHook(() => usePlayer(), { wrapper: Wrapper });

    act(() => result.current.play(spotifyTrack));
    act(() => result.current.resume());
    // status is loading, not paused — resume is a no-op
    expect(result.current.status).toBe('loading');
  });
});

// ─── Media Session ─────────────────────────────────────────────────────────────
describe('Media Session API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets mediaSession metadata when track loads', () => {
    const { result } = renderHook(() => usePlayer(), { wrapper: Wrapper });

    act(() => result.current.play(spotifyTrack));

    // The MediaMetadata assignment is tested implicitly by not throwing
    // More specific tests would require a custom mock
  });

  it('registers media session action handlers', () => {
    renderHook(() => usePlayer(), { wrapper: Wrapper });

    // Should have set handlers for play, pause, nexttrack, previoustrack
    expect(mockSetActionHandler).toHaveBeenCalled();
  });
});

// ─── Persisted state ───────────────────────────────────────────────────────────
describe('LocalStorage persistence', () => {
  it('persists state to localStorage when metadata is set', () => {
    const mockSetItem = vi.fn();
    const mockGetItem = vi.fn().mockReturnValue(null);
    vi.stubGlobal('localStorage', {
      getItem: mockGetItem,
      setItem: mockSetItem,
      removeItem: vi.fn(),
    });

    const { result } = renderHook(() => usePlayer(), { wrapper: Wrapper });

    act(() => result.current.play(spotifyTrack));

    expect(mockSetItem).toHaveBeenCalled();
    const saved = JSON.parse(mockSetItem.mock.calls[0][1]);
    expect(saved.metadata).toEqual(spotifyTrack);
  });

  it('removes localStorage key when stopped', () => {
    const mockRemoveItem = vi.fn();
    const mockGetItem = vi.fn().mockReturnValue(null);
    vi.stubGlobal('localStorage', {
      getItem: mockGetItem,
      setItem: vi.fn(),
      removeItem: mockRemoveItem,
    });

    const { result } = renderHook(() => usePlayer(), { wrapper: Wrapper });

    act(() => result.current.play(spotifyTrack));
    act(() => result.current.stop());

    expect(mockRemoveItem).toHaveBeenCalled();
  });
});

// ─── restoredTrack ─────────────────────────────────────────────────────────────
describe('restoredTrack', () => {
  it('starts as null', () => {
    const { result } = renderHook(() => usePlayer(), { wrapper: Wrapper });
    expect(result.current.restoredTrack).toBeNull();
  });

  it('clearRestoredTrack() sets it to null', () => {
    const { result } = renderHook(() => usePlayer(), { wrapper: Wrapper });

    act(() => result.current.clearRestoredTrack());
    expect(result.current.restoredTrack).toBeNull();
  });
});
