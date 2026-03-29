import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { GlobalPlayer } from './GlobalPlayer';
import { PlayerProvider, usePlayer } from '@/providers/audio';
import type { TrackMetadata } from '@/types/music';
import React from 'react';

// ─── Test data ────────────────────────────────────────────────────────────────
const spotifyTrack: TrackMetadata = {
  id: 'gp-track-1',
  type: 'spotify',
  trackName: 'Golden Hour',
  artistName: 'JVK',
  artworkUrl: 'https://example.com/golden.jpg',
  url: 'https://open.spotify.com/track/abc',
  feedId: 'feed-gp-1',
};

// ─── Mock @farcaster/miniapp-sdk ─────────────────────────────────────────────
vi.mock('@farcaster/miniapp-sdk', () => ({
  sdk: {
    context: Promise.resolve({
      client: { safeAreaInsets: { bottom: 0 } },
    }),
  },
}));

// ─── Mock global dependencies ─────────────────────────────────────────────────
vi.stubGlobal('localStorage', {
  getItem: vi.fn().mockReturnValue(null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
});

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

vi.stubGlobal('fetch', vi.fn());

// ─── Mock child components ─────────────────────────────────────────────────────
vi.mock('./Scrubber', () => ({ Scrubber: () => <div data-testid="scrubber" /> }));
vi.mock('./ArtworkImage', () => ({ ArtworkImage: () => <img data-testid="artwork" /> }));
vi.mock('./AddToPlaylistButton', () => ({ AddToPlaylistButton: () => <button>Add</button> }));
vi.mock('./LikeButton', () => ({ LikeButton: () => <button>Like</button> }));
vi.mock('./SleepTimerButton', () => ({ SleepTimerButton: () => <button>Timer</button> }));

// ─── Inner component that plays a track ──────────────────────────────────────
function PlayerWithTrack({ track, children }: { track: TrackMetadata; children: React.ReactNode }) {
  const player = usePlayer();
  React.useEffect(() => {
    player.play(track);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <>{children}</>;
}

// ─── Tests ─────────────────────────────────────────────────────────────────────
describe('GlobalPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when no metadata is playing', () => {
    const { container } = render(
      <PlayerProvider>
        <GlobalPlayer />
      </PlayerProvider>,
    );
    // GlobalPlayer returns null when no metadata
    expect(container.firstChild).toBeNull();
  });

  it('renders track name when a track is playing', () => {
    render(
      <PlayerProvider>
        <PlayerWithTrack track={spotifyTrack}>
          <GlobalPlayer />
        </PlayerWithTrack>
      </PlayerProvider>,
    );
    expect(screen.getByText('Golden Hour')).toBeInTheDocument();
  });

  it('renders artist name', () => {
    render(
      <PlayerProvider>
        <PlayerWithTrack track={spotifyTrack}>
          <GlobalPlayer />
        </PlayerWithTrack>
      </PlayerProvider>,
    );
    expect(screen.getByText('JVK')).toBeInTheDocument();
  });

  it('renders platform badge with track type', () => {
    render(
      <PlayerProvider>
        <PlayerWithTrack track={spotifyTrack}>
          <GlobalPlayer />
        </PlayerWithTrack>
      </PlayerProvider>,
    );
    expect(screen.getByText('spotify')).toBeInTheDocument();
  });

  it('renders the scrubber component', () => {
    render(
      <PlayerProvider>
        <PlayerWithTrack track={spotifyTrack}>
          <GlobalPlayer />
        </PlayerWithTrack>
      </PlayerProvider>,
    );
    expect(screen.getByTestId('scrubber')).toBeInTheDocument();
  });

  it('renders the artwork image', () => {
    render(
      <PlayerProvider>
        <PlayerWithTrack track={spotifyTrack}>
          <GlobalPlayer />
        </PlayerWithTrack>
      </PlayerProvider>,
    );
    expect(screen.getByTestId('artwork')).toBeInTheDocument();
  });

  it('renders volume slider', () => {
    render(
      <PlayerProvider>
        <PlayerWithTrack track={spotifyTrack}>
          <GlobalPlayer />
        </PlayerWithTrack>
      </PlayerProvider>,
    );
    const sliders = document.querySelectorAll('input[type="range"]');
    expect(sliders.length).toBeGreaterThan(0);
  });

  it('renders close/pause button', () => {
    render(
      <PlayerProvider>
        <PlayerWithTrack track={spotifyTrack}>
          <GlobalPlayer />
        </PlayerWithTrack>
      </PlayerProvider>,
    );
    // The close button has aria-label "Pause"
    const closeBtn = screen.getByRole('button', { name: /pause/i });
    expect(closeBtn).toBeInTheDocument();
  });

  it('renders prev button disabled when hasPrev is false', () => {
    render(
      <PlayerProvider>
        <PlayerWithTrack track={spotifyTrack}>
          <GlobalPlayer hasPrev={false} hasNext={true} />
        </PlayerWithTrack>
      </PlayerProvider>,
    );
    const prevBtn = screen.getByRole('button', { name: /previous/i });
    expect(prevBtn).toBeDisabled();
  });

  it('renders next button enabled when hasNext is true', () => {
    render(
      <PlayerProvider>
        <PlayerWithTrack track={spotifyTrack}>
          <GlobalPlayer hasPrev={false} hasNext={true} />
        </PlayerWithTrack>
      </PlayerProvider>,
    );
    const nextBtn = screen.getByRole('button', { name: /next/i });
    expect(nextBtn).not.toBeDisabled();
  });

  it('renders shuffle button', () => {
    render(
      <PlayerProvider>
        <PlayerWithTrack track={spotifyTrack}>
          <GlobalPlayer />
        </PlayerWithTrack>
      </PlayerProvider>,
    );
    const shuffleBtn = screen.getByRole('button', { name: /shuffle/i });
    expect(shuffleBtn).toBeInTheDocument();
  });

  it('renders repeat button', () => {
    render(
      <PlayerProvider>
        <PlayerWithTrack track={spotifyTrack}>
          <GlobalPlayer />
        </PlayerWithTrack>
      </PlayerProvider>,
    );
    const repeatBtn = screen.getByRole('button', { name: /repeat/i });
    expect(repeatBtn).toBeInTheDocument();
  });

  it('renders RADIO badge when isRadioMode is true', () => {
    render(
      <PlayerProvider>
        <PlayerWithTrack track={spotifyTrack}>
          <GlobalPlayer isRadioMode={true} />
        </PlayerWithTrack>
      </PlayerProvider>,
    );
    expect(screen.getByText('RADIO')).toBeInTheDocument();
  });

  it('does not render RADIO badge when isRadioMode is false', () => {
    render(
      <PlayerProvider>
        <PlayerWithTrack track={spotifyTrack}>
          <GlobalPlayer isRadioMode={false} />
        </PlayerWithTrack>
      </PlayerProvider>,
    );
    expect(screen.queryByText('RADIO')).not.toBeInTheDocument();
  });
});

describe('GlobalPlayer — usePlayer integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pause() transitions status to paused', async () => {
    const { result } = renderHook(() => usePlayer(), {
      wrapper: ({ children }) => <PlayerProvider>{children}</PlayerProvider>,
    });

    await act(async () => {
      result.current.play(spotifyTrack);
    });

    await act(async () => {
      result.current.pause();
    });

    expect(result.current.status).toBe('paused');
  });

  it('seek() updates position', async () => {
    const { result } = renderHook(() => usePlayer(), {
      wrapper: ({ children }) => <PlayerProvider>{children}</PlayerProvider>,
    });

    await act(async () => {
      result.current.play(spotifyTrack);
    });

    await act(async () => {
      result.current.seek(12345);
    });

    expect(result.current.position).toBe(12345);
  });

  it('volume returns a value between 0 and 1', async () => {
    const { result } = renderHook(() => usePlayer(), {
      wrapper: ({ children }) => <PlayerProvider>{children}</PlayerProvider>,
    });

    expect(result.current.volume).toBeGreaterThanOrEqual(0);
    expect(result.current.volume).toBeLessThanOrEqual(1);
  });

  it('shuffle toggle flips shuffle state', async () => {
    const { result } = renderHook(() => usePlayer(), {
      wrapper: ({ children }) => <PlayerProvider>{children}</PlayerProvider>,
    });

    expect(result.current.shuffle).toBe(false);

    await act(async () => {
      result.current.toggleShuffle();
    });

    expect(result.current.shuffle).toBe(true);
  });

  it('repeat cycles through modes', async () => {
    const { result } = renderHook(() => usePlayer(), {
      wrapper: ({ children }) => <PlayerProvider>{children}</PlayerProvider>,
    });

    expect(result.current.repeat).toBe('off');

    await act(async () => {
      result.current.cycleRepeat();
    });
    expect(result.current.repeat).toBe('all');

    await act(async () => {
      result.current.cycleRepeat();
    });
    expect(result.current.repeat).toBe('one');

    await act(async () => {
      result.current.cycleRepeat();
    });
    expect(result.current.repeat).toBe('off');
  });

  it('isLoading is false after play (before canplay event)', async () => {
    const { result } = renderHook(() => usePlayer(), {
      wrapper: ({ children }) => <PlayerProvider>{children}</PlayerProvider>,
    });

    await act(async () => {
      result.current.play(spotifyTrack);
    });

    // Immediately after play(), status is 'loading'
    expect(result.current.status).toBe('loading');
  });

  it('isPlaying is false initially', () => {
    const { result } = renderHook(() => usePlayer(), {
      wrapper: ({ children }) => <PlayerProvider>{children}</PlayerProvider>,
    });
    expect(result.current.isPlaying).toBe(false);
  });
});
