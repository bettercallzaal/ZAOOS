import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AgentDashboard from '../AgentDashboard';

// Mock Supabase browser client
const mockChannel = {
  on: vi.fn(() => mockChannel),
  subscribe: vi.fn((cb: (status: string) => void) => {
    cb('SUBSCRIBED');
    return mockChannel;
  }),
};

vi.mock('@/lib/db/supabase', () => ({
  getSupabaseBrowser: vi.fn(() => ({
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn(),
  })),
}));

vi.mock('../SquadCircle', () => ({
  default: () => <div data-testid="squad-circle">Squad Circle View</div>,
}));

vi.mock('../PipelineFlow', () => ({
  default: () => <div data-testid="pipeline-flow">Pipeline Flow View</div>,
}));

vi.mock('../WarRoomFeed', () => ({
  default: () => <div data-testid="war-room-feed">War Room Feed View</div>,
}));

describe('AgentDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('view=squad')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                agents: [{ name: 'zoe', label: 'ZOE', role: 'Orchestrator', status: 'active' }],
                isAdmin: true,
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              events: [],
              isAdmin: true,
            }),
        });
      }),
    );
  });

  it('renders view tabs and defaults to Squad Fleet', async () => {
    render(<AgentDashboard />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByRole('button', { name: 'Squad Fleet' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pipeline' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'War Room' })).toBeInTheDocument();
    expect(screen.getByTestId('squad-circle')).toBeInTheDocument();
  });

  it('switches views between Squad Fleet, Pipeline, and War Room', async () => {
    render(<AgentDashboard />);

    await act(async () => {
      await Promise.resolve();
    });

    // Switch to Pipeline
    fireEvent.click(screen.getByRole('button', { name: 'Pipeline' }));
    expect(screen.getByTestId('pipeline-flow')).toBeInTheDocument();

    // Switch to War Room
    fireEvent.click(screen.getByRole('button', { name: 'War Room' }));
    expect(screen.getByTestId('war-room-feed')).toBeInTheDocument();

    // Switch back to Squad Fleet
    fireEvent.click(screen.getByRole('button', { name: 'Squad Fleet' }));
    expect(screen.getByTestId('squad-circle')).toBeInTheDocument();
  });

  it('displays Live Realtime indicator when connected', async () => {
    render(<AgentDashboard />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('Live Realtime')).toBeInTheDocument();
  });
});
