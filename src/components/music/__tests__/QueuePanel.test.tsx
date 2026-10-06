import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueueProvider, useQueue } from '@/contexts/QueueContext';
import { PlayerProvider } from '@/providers/audio';
import type { TrackMetadata } from '@/types/music';
import { QueuePanel } from '../QueuePanel';

const trackA: TrackMetadata = {
  id: 'track-a',
  type: 'audius',
  trackName: 'First Track',
  artistName: 'Artist One',
  artworkUrl: 'https://example.com/a.jpg',
  url: 'https://example.com/a.mp3',
};

const trackB: TrackMetadata = {
  id: 'track-b',
  type: 'audius',
  trackName: 'Second Track',
  artistName: 'Artist Two',
  artworkUrl: 'https://example.com/b.jpg',
  url: 'https://example.com/b.mp3',
};

function QueueTestHelper({ children }: { children: React.ReactNode }) {
  const { addToQueue } = useQueue();
  React.useEffect(() => {
    addToQueue(trackA);
    addToQueue(trackB);
  }, [addToQueue]);
  return <>{children}</>;
}

describe('QueuePanel', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders empty queue message when no tracks exist', () => {
    render(
      <PlayerProvider>
        <QueueProvider>
          <QueuePanel />
        </QueueProvider>
      </PlayerProvider>,
    );

    expect(screen.getByText('Your queue is empty')).toBeInTheDocument();
  });

  it('renders queued tracks and allows reordering and clearing', () => {
    render(
      <PlayerProvider>
        <QueueProvider>
          <QueueTestHelper>
            <QueuePanel />
          </QueueTestHelper>
        </QueueProvider>
      </PlayerProvider>,
    );

    expect(screen.getByText('First Track')).toBeInTheDocument();
    expect(screen.getByText('Second Track')).toBeInTheDocument();
    expect(screen.getByText('2 tracks')).toBeInTheDocument();

    // Clear all
    const clearBtn = screen.getByRole('button', { name: 'Clear all' });
    fireEvent.click(clearBtn);

    expect(screen.getByText('Your queue is empty')).toBeInTheDocument();
  });
});
