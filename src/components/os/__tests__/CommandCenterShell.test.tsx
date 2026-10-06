import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommandCenterShell } from '../CommandCenterShell';

// Mock useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock usePlayerContext
const mockDispatch = vi.fn();
vi.mock('@/providers/audio/PlayerProvider', () => ({
  usePlayerContext: () => ({
    state: {
      status: 'idle',
      metadata: null,
      position: 0,
      duration: 0,
      volume: 1,
      shuffle: false,
      repeat: 'off',
      crossfade: 0,
      error: null,
    },
    dispatch: mockDispatch,
  }),
}));

// Mock Supabase
vi.mock('@/lib/db/supabase', () => ({
  getSupabaseBrowser: () => null,
}));

describe('CommandCenterShell', () => {
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
                agents: [
                  { name: 'zoe', label: 'ZOE', role: 'orchestrator', status: 'active', events_24h: 12 },
                  { name: 'builder', label: 'BUILDER', role: 'engineer', status: 'idle', events_24h: 4 },
                ],
              }),
          });
        }
        if (url.includes('view=feed')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                events: [
                  {
                    id: 'ev-1',
                    agent_name: 'zoe',
                    event_type: 'task_completed',
                    summary: 'Verified WaveWarZ pool health',
                    created_at: new Date().toISOString(),
                  },
                ],
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }),
    );
  });

  it('renders command center title, status beacon, and squad roster', async () => {
    render(
      <CommandCenterShell
        pinnedApps={['chat', 'music']}
        onPin={vi.fn()}
        onUnpin={vi.fn()}
        currentShell="dashboard"
        userName="zaal"
      />,
    );

    expect(screen.getByText('ESTATE ONLINE')).toBeInTheDocument();
    expect(screen.getByText('BASE MAINNET')).toBeInTheDocument();
    expect(screen.getByText('ZOE FLEET v2')).toBeInTheDocument();
    expect(screen.getByText('zaal')).toBeInTheDocument();

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('Squad Fleet Roster')).toBeInTheDocument();
  });

  it('triggers command palette open event when search button clicked', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    render(
      <CommandCenterShell
        pinnedApps={['chat', 'music']}
        onPin={vi.fn()}
        onUnpin={vi.fn()}
      />,
    );

    const searchBtn = screen.getByRole('button', { name: 'Open command palette' });
    fireEvent.click(searchBtn);

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'command-palette:open' }),
    );
  });

  it('allows entering and dispatching a directive to ZOE', async () => {
    render(
      <CommandCenterShell
        pinnedApps={['chat', 'music']}
        onPin={vi.fn()}
        onUnpin={vi.fn()}
      />,
    );

    const input = screen.getByPlaceholderText(/Send mission directive to ZOE/i);
    fireEvent.change(input, { target: { value: 'Inspect all open pull requests' } });

    const submitBtn = screen.getByRole('button', { name: 'Dispatch' });

    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(screen.getByText(/Directive received/i)).toBeInTheDocument();
  });

  it('handles shell switcher interaction', () => {
    const onSetShell = vi.fn();
    render(
      <CommandCenterShell
        pinnedApps={['chat', 'music']}
        onPin={vi.fn()}
        onUnpin={vi.fn()}
        onSetShell={onSetShell}
        currentShell="dashboard"
      />,
    );

    const mobileBtn = screen.getByRole('button', { name: 'Mobile' });
    fireEvent.click(mobileBtn);

    expect(onSetShell).toHaveBeenCalledWith('phone');
  });
});
