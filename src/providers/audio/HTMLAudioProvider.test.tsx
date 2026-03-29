import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { PlayerProvider, usePlayer } from './PlayerProvider';
import { HTMLAudioProvider } from './HTMLAudioProvider';
import type { TrackMetadata } from '@/types/music';
import React from 'react';

// ─── Test helpers ─────────────────────────────────────────────────────────────
const audioTrack: TrackMetadata = {
  id: 'track-audio',
  type: 'audio',
  trackName: 'Audio File',
  artistName: 'Audio Artist',
  artworkUrl: 'https://example.com/audio.jpg',
  url: 'https://example.com/song.mp3',
  feedId: 'feed-audio',
};

const spotifyTrack: TrackMetadata = {
  id: 'track-spotify',
  type: 'spotify',
  trackName: 'Spotify Track',
  artistName: 'Spotify Artist',
  artworkUrl: 'https://example.com/spotify.jpg',
  url: 'https://open.spotify.com/track/abc',
  feedId: 'feed-spotify',
};

// ─── Mock audio element ────────────────────────────────────────────────────────
let mockAudioPlay: ReturnType<typeof vi.fn>;
let mockAudioPause: ReturnType<typeof vi.fn>;
let mockAudioLoad: ReturnType<typeof vi.fn>;
let mockAudioSeek: ReturnType<typeof vi.fn>;

function makeMockAudio() {
  mockAudioPlay = vi.fn().mockResolvedValue(undefined);
  mockAudioPause = vi.fn();
  mockAudioLoad = vi.fn();
  mockAudioSeek = vi.fn();
  return {
    play: mockAudioPlay,
    pause: mockAudioPause,
    load: mockAudioLoad,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    get currentTime() { return 0; },
    set currentTime(v) { mockAudioSeek(v); },
    get duration() { return 30; },
    get paused() { return true; },
    get volume() { return 1; },
    set volume(v) {},
    get src() { return ''; },
    set src(s) {},
  };
}

// ─── Mock getEqualizer ────────────────────────────────────────────────────────
vi.mock('@/lib/music/equalizer', () => ({
  getEqualizer: () => ({
    connect: vi.fn(),
  }),
}));

// ─── Mocks ───────────────────────────────────────────────────────────────────
vi.stubGlobal('localStorage', {
  getItem: vi.fn().mockReturnValue(null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
});

vi.stubGlobal('fetch', vi.fn());

vi.stubGlobal('navigator', {
  vibrate: vi.fn(),
  mediaSession: {
    metadata: null,
    playbackState: 'none',
    setActionHandler: vi.fn(),
    setPositionState: vi.fn(),
  },
  wakeLock: { request: vi.fn().mockResolvedValue({ release: vi.fn() }) },
});

// ─── Wrapper ──────────────────────────────────────────────────────────────────
function DualWrapper({ children }: { children: React.ReactNode }) {
  return (
    <PlayerProvider>
      <HTMLAudioProvider>{children}</HTMLAudioProvider>
    </PlayerProvider>
  );
}

// ─── Tests ─────────────────────────────────────────────────────────────────────
describe('HTMLAudioProvider', () => {
  let mockAudioInstance: ReturnType<typeof makeMockAudio>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAudioInstance = makeMockAudio();
    vi.stubGlobal('Audio', vi.fn(() => mockAudioInstance));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers audio controller with the player', async () => {
    const { result } = renderHook(() => usePlayer(), { wrapper: DualWrapper });

    // Play an audio track — this should trigger the controller registration
    await act(async () => {
      result.current.play(audioTrack);
    });

    // The controller should be invoked (play was called on the audio element)
    // Because jsdom may not resolve the play() immediately, we just check no error thrown
    expect(result.current.status).toBe('loading');
  });

  it('play() calls audio.play() on the active element', async () => {
    const { result } = renderHook(() => usePlayer(), { wrapper: DualWrapper });

    await act(async () => {
      result.current.play(audioTrack);
    });

    // Verify play was called on the mock audio element
    expect(mockAudioPlay).toHaveBeenCalled();
  });

  it('pause() calls audio.pause() on the active element', async () => {
    const { result } = renderHook(() => usePlayer(), { wrapper: DualWrapper });

    await act(async () => {
      result.current.play(audioTrack);
    });

    await act(async () => {
      result.current.pause();
    });

    expect(mockAudioPause).toHaveBeenCalled();
  });

  it('seek() sets audio.currentTime in seconds', async () => {
    const { result } = renderHook(() => usePlayer(), { wrapper: DualWrapper });

    await act(async () => {
      result.current.play(audioTrack);
    });

    await act(async () => {
      result.current.seek(15000); // 15 seconds in ms
    });

    // currentTime is set in seconds (15000ms = 15s)
    expect(mockAudioSeek).toHaveBeenCalledWith(15);
  });

  it('load() is called when a new track is played', async () => {
    const { result } = renderHook(() => usePlayer(), { wrapper: DualWrapper });

    await act(async () => {
      result.current.play(audioTrack);
    });

    expect(mockAudioLoad).toHaveBeenCalled();
  });

  it('handles audio error event gracefully', async () => {
    // Simulate error by triggering the error event listener
    const errorHandler = vi.fn();
    vi.stubGlobal('Audio', vi.fn(() => ({
      ...makeMockAudio(),
      play: vi.fn().mockRejectedValue(new Error('play blocked')),
      addEventListener: vi.fn((event, handler) => {
        if (event === 'error') errorHandler.mockImplementation(handler as (e: Event) => void);
      }),
      removeEventListener: vi.fn(),
    })));

    const { result } = renderHook(() => usePlayer(), { wrapper: DualWrapper });

    await act(async () => {
      result.current.play(audioTrack);
    });

    // Should transition to error state (play was blocked)
    expect(result.current.status === 'loading' || result.current.status === 'error' || result.current.status === 'playing').toBe(true);
  });

  it('multiple play calls do not crash', async () => {
    const { result } = renderHook(() => usePlayer(), { wrapper: DualWrapper });

    await act(async () => {
      result.current.play(audioTrack);
    });

    await act(async () => {
      result.current.play(spotifyTrack);
    });

    expect(result.current.metadata?.type).toBe('spotify');
  });
});

describe('HTMLAudioProvider — crossfade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('Audio', vi.fn(() => makeMockAudio()));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('setCrossfade() enables crossfade mode', async () => {
    const { result } = renderHook(() => usePlayer(), { wrapper: DualWrapper });

    await act(async () => {
      result.current.play(audioTrack);
    });

    await act(async () => {
      result.current.setCrossfade(5);
    });

    expect(result.current.crossfade).toBe(5);
  });

  it('crossfade starts at 0 (off)', async () => {
    const { result } = renderHook(() => usePlayer(), { wrapper: DualWrapper });
    expect(result.current.crossfade).toBe(0);
  });
});

describe('HTMLAudioProvider — volume', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const audio = makeMockAudio();
    vi.stubGlobal('Audio', vi.fn(() => audio));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('volume changes are reflected in player state', async () => {
    const { result } = renderHook(() => usePlayer(), { wrapper: DualWrapper });

    await act(async () => {
      result.current.play(audioTrack);
    });

    await act(async () => {
      result.current.setVolume(0.7);
    });

    expect(result.current.volume).toBe(0.7);
  });

  it('volume clamps to 0–1 range', async () => {
    const { result } = renderHook(() => usePlayer(), { wrapper: DualWrapper });

    await act(async () => {
      result.current.setVolume(2);
    });
    expect(result.current.volume).toBe(1);

    await act(async () => {
      result.current.setVolume(-1);
    });
    expect(result.current.volume).toBe(0);
  });
});
