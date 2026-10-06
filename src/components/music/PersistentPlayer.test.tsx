import { act, render, renderHook, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueueProvider } from '@/contexts/QueueContext';
import { PlayerProvider, usePlayer } from '@/providers/audio';
import type { TrackMetadata } from '@/types/music';
import { PersistentPlayer } from './PersistentPlayer';

const testTrack: TrackMetadata = {
  id: 'pp-track-1',
  type: 'spotify',
  trackName: 'Midnight Vibes',
  artistName: 'Zaal',
  artworkUrl: 'https://example.com/midnight.jpg',
  url: 'https://open.spotify.com/track/xyz',
  feedId: 'feed-pp-1',
};

// Mock community config
vi.mock('@/../community.config', () => ({
  communityConfig: {
    music: {
      radioName: 'ZAO Radio',
    },
  },
}));

class MockMediaMetadata {
  title: string;
  artist: string;
  album: string;
  artwork: unknown[];
  constructor(init: { title?: string; artist?: string; album?: string; artwork?: unknown[] }) {
    this.title = init.title ?? '';
    this.artist = init.artist ?? '';
    this.album = init.album ?? '';
    this.artwork = init.artwork ?? [];
  }
}
// @ts-ignore
globalThis.MediaMetadata = MockMediaMetadata;
// @ts-ignore
global.MediaMetadata = MockMediaMetadata;

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

vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) }));

vi.mock('./ArtworkImage', () => ({
  ArtworkImage: () => <img data-testid="artwork" alt="artwork" />,
}));
vi.mock('./AddToPlaylistButton', () => ({
  AddToPlaylistButton: () => <button aria-label="Add to playlist">Add</button>,
}));
vi.mock('./LikeButton', () => ({
  LikeButton: () => <button aria-label="Like">Like</button>,
}));
vi.mock('./QueuePanel', () => ({
  QueuePanel: () => <div data-testid="queue-panel">Queue Panel Content</div>,
}));
vi.mock('./LyricsPanel', () => ({
  LyricsPanel: () => <div data-testid="lyrics-panel">Lyrics Content</div>,
}));
vi.mock('./ExpandedPlayer', () => ({
  ExpandedPlayer: () => <div data-testid="expanded-player">Expanded Player</div>,
}));

function PlayerWithTrack({ track, children }: { track: TrackMetadata; children: React.ReactNode }) {
  const player = usePlayer();
  React.useEffect(() => {
    player.play(track);
  }, []);
  return <>{children}</>;
}

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <PlayerProvider>
      <QueueProvider>{ui}</QueueProvider>
    </PlayerProvider>,
  );
}

describe('PersistentPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders idle radio prompt when no track is loaded', () => {
    renderWithProviders(<PersistentPlayer />);
    expect(screen.getByText('ZAO Radio')).toBeDefined();
    expect(screen.getByText('Tap to start live radio')).toBeDefined();
  });

  it('renders track name and artist when playing', () => {
    render(
      <PlayerProvider>
        <QueueProvider>
          <PlayerWithTrack track={testTrack}>
            <PersistentPlayer />
          </PlayerWithTrack>
        </QueueProvider>
      </PlayerProvider>,
    );

    expect(screen.getAllByText('Midnight Vibes').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Zaal').length).toBeGreaterThan(0);
  });

  it('renders desktop transport controls: shuffle, repeat, prev, next', () => {
    render(
      <PlayerProvider>
        <QueueProvider>
          <PlayerWithTrack track={testTrack}>
            <PersistentPlayer />
          </PlayerWithTrack>
        </QueueProvider>
      </PlayerProvider>,
    );

    expect(screen.getByTitle('Shuffle (S)')).toBeDefined();
    expect(screen.getByTitle(/Repeat \(R\)/)).toBeDefined();
    expect(screen.getByTitle('Queue (Q)')).toBeDefined();
    expect(screen.getByTitle('Lyrics')).toBeDefined();
  });
});
