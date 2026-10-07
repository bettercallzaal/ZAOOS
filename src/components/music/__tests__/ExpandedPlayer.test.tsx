import { fireEvent, render, screen } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueueProvider } from '@/contexts/QueueContext';
import { PlayerProvider } from '@/providers/audio';
import type { TrackMetadata } from '@/types/music';
import { ExpandedPlayer } from '../ExpandedPlayer';

const testTrack: TrackMetadata = {
  id: 'exp-track-1',
  type: 'audius',
  trackName: 'Midnight Groove',
  artistName: 'Zaal Panthaki',
  artworkUrl: 'https://example.com/art.jpg',
  url: 'https://audius.co/track/1',
  feedId: 'feed-exp-1',
};

vi.mock('@/lib/music/colorExtractor', () => ({
  extractDominantColor: vi.fn().mockResolvedValue({ r: 245, g: 166, b: 35 }),
}));

vi.mock('@/components/music/ArtworkImage', () => ({
  ArtworkImage: () => <div data-testid="artwork">Artwork</div>,
}));

vi.mock('@/components/music/AddToPlaylistButton', () => ({
  AddToPlaylistButton: () => (
    <button type="button" aria-label="Add to playlist">
      Add
    </button>
  ),
}));

vi.mock('@/components/music/LikeButton', () => ({
  LikeButton: () => (
    <button type="button" aria-label="Like">
      Like
    </button>
  ),
}));

vi.mock('@/components/music/Scrubber', () => ({
  Scrubber: () => <div data-testid="scrubber">Scrubber</div>,
}));

vi.mock('@/components/music/WaveformComments', () => ({
  WaveformComments: () => <div data-testid="waveform-comments">Comments</div>,
}));

vi.mock('@/components/music/SleepTimer', () => ({
  SleepTimer: () => <div data-testid="sleep-timer">SleepTimer</div>,
}));

vi.mock('next/dynamic', () => ({
  default: () => {
    return function MockDynamic(props: Record<string, unknown>) {
      if (props.trackName) {
        return <div data-testid="lyrics-panel">Lyrics Panel Component</div>;
      }
      if (props.fullHeight !== undefined) {
        return <div data-testid="queue-panel">Queue Panel Component</div>;
      }
      return null;
    };
  },
}));

vi.mock('@/components/music/LyricsPanel', () => ({
  LyricsPanel: () => <div data-testid="lyrics-panel">Lyrics Panel Component</div>,
}));

vi.mock('@/components/music/QueuePanel', () => ({
  QueuePanel: () => <div data-testid="queue-panel">Queue Panel Component</div>,
}));

function renderExpandedPlayer(props: Partial<React.ComponentProps<typeof ExpandedPlayer>> = {}) {
  const onClose = props.onClose || vi.fn();
  const onPrev = props.onPrev || vi.fn();
  const onNext = props.onNext || vi.fn();

  return render(
    <PlayerProvider>
      <QueueProvider>
        <ExpandedPlayer
          metadata={testTrack}
          onClose={onClose}
          onPrev={onPrev}
          onNext={onNext}
          {...props}
        />
      </QueueProvider>
    </PlayerProvider>,
  );
}

describe('ExpandedPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders track name and artist correctly', () => {
    renderExpandedPlayer();
    expect(screen.getByText('Midnight Groove')).toBeInTheDocument();
    expect(screen.getByText('Zaal Panthaki')).toBeInTheDocument();
  });

  it('renders transport controls and view tabs', () => {
    renderExpandedPlayer();
    expect(screen.getByTestId('tab-playing')).toBeInTheDocument();
    expect(screen.getByTestId('tab-lyrics')).toBeInTheDocument();
    expect(screen.getByTestId('tab-queue')).toBeInTheDocument();
    expect(screen.getByLabelText('Play')).toBeInTheDocument();
    expect(screen.getByLabelText('Previous')).toBeInTheDocument();
    expect(screen.getByLabelText('Next')).toBeInTheDocument();
  });

  it('switches between Now Playing, Lyrics, and Queue tabs', () => {
    renderExpandedPlayer();

    // Default: Now playing has artwork
    expect(screen.getByTestId('artwork')).toBeInTheDocument();

    // Switch to Lyrics
    fireEvent.click(screen.getByTestId('tab-lyrics'));
    expect(screen.getByTestId('lyrics-panel')).toBeInTheDocument();

    // Switch to Queue
    fireEvent.click(screen.getByTestId('tab-queue'));
    expect(screen.getByTestId('queue-panel')).toBeInTheDocument();

    // Switch back to Now Playing
    fireEvent.click(screen.getByTestId('tab-playing'));
    expect(screen.getByTestId('artwork')).toBeInTheDocument();
  });

  it('triggers onClose when close button or Escape key is pressed', () => {
    const onClose = vi.fn();
    renderExpandedPlayer({ onClose });

    fireEvent.click(screen.getByLabelText('Close expanded player'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
