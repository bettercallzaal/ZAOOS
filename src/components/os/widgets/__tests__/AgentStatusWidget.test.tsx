import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AgentStatusWidget from '../AgentStatusWidget';

describe('AgentStatusWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Agent Fleet title and ZOE badge', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            agents: [
              { name: 'zoe', label: 'ZOE', status: 'active' },
              { name: 'zoey', label: 'ZOEY', status: 'idle' },
            ],
          }),
      }),
    );

    render(<AgentStatusWidget size="small" onExpand={vi.fn()} />);

    expect(screen.getByText('Agent Fleet')).toBeInTheDocument();
    expect(screen.getAllByText('ZOE').length).toBeGreaterThan(0);
  });

  it('triggers onExpand when clicked', () => {
    const onExpand = vi.fn();
    render(<AgentStatusWidget size="small" onExpand={onExpand} />);

    const widgetBtn = screen.getByRole('button', { name: 'Open agent fleet dashboard' });
    fireEvent.click(widgetBtn);

    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  it('updates agent statuses when fetched successfully', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            agents: [
              { name: 'zoe', label: 'ZOE', status: 'active' },
              { name: 'scout', label: 'SCOUT', status: 'active' },
            ],
          }),
      }),
    );

    render(<AgentStatusWidget size="small" onExpand={vi.fn()} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText(/online|idle/)).toBeInTheDocument();
  });
});
