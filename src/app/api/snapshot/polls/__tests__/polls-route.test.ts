import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetchActivePolls = vi.hoisted(() => vi.fn());
const mockFetchRecentPolls = vi.hoisted(() => vi.fn());

vi.mock('@/lib/snapshot/client', () => ({
  fetchActivePolls: () => mockFetchActivePolls(),
  fetchRecentPolls: () => mockFetchRecentPolls(),
}));

import { GET } from '@/app/api/snapshot/polls/route';

describe('GET /api/snapshot/polls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns both active and recent polls when both succeed', async () => {
    const activePolls = [{ id: '1', title: 'Active Poll' }];
    const recentPolls = [{ id: '2', title: 'Recent Poll' }];

    mockFetchActivePolls.mockResolvedValue(activePolls);
    mockFetchRecentPolls.mockResolvedValue(recentPolls);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.active).toEqual(activePolls);
    expect(body.recent).toEqual(recentPolls);
  });

  it('returns empty active array when fetchActivePolls fails', async () => {
    mockFetchActivePolls.mockRejectedValue(new Error('Snapshot API down'));
    mockFetchRecentPolls.mockResolvedValue([{ id: '2', title: 'Recent Poll' }]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.active).toEqual([]);
    expect(body.recent).toEqual([{ id: '2', title: 'Recent Poll' }]);
  });

  it('returns empty recent array when fetchRecentPolls fails', async () => {
    mockFetchActivePolls.mockResolvedValue([{ id: '1', title: 'Active Poll' }]);
    mockFetchRecentPolls.mockRejectedValue(new Error('Snapshot API down'));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.active).toEqual([{ id: '1', title: 'Active Poll' }]);
    expect(body.recent).toEqual([]);
  });

  it('returns both arrays empty when both fetches fail', async () => {
    mockFetchActivePolls.mockRejectedValue(new Error('Network error'));
    mockFetchRecentPolls.mockRejectedValue(new Error('Network error'));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.active).toEqual([]);
    expect(body.recent).toEqual([]);
  });
});
