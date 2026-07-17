// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockFetchActivePolls = vi.hoisted(() => vi.fn());
const mockFetchRecentPolls = vi.hoisted(() => vi.fn());

vi.mock('@/lib/snapshot/client', () => ({
  fetchActivePolls: mockFetchActivePolls,
  fetchRecentPolls: mockFetchRecentPolls,
}));

import { GET } from '../route';

afterEach(() => {
  vi.clearAllMocks();
});

const MOCK_POLL = {
  id: 'QmAbc',
  title: 'Test Poll',
  choices: ['Yes', 'No'],
  start: 1700000000,
  end: 1700100000,
  state: 'active' as const,
  scores: [10, 5],
  scores_total: 15,
  votes: 12,
};

describe('GET /api/snapshot/polls', () => {
  it('returns active and recent polls when both succeed', async () => {
    mockFetchActivePolls.mockResolvedValue([MOCK_POLL]);
    mockFetchRecentPolls.mockResolvedValue([MOCK_POLL, MOCK_POLL]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.active).toHaveLength(1);
    expect(body.recent).toHaveLength(2);
  });

  it('returns empty active array when fetchActivePolls rejects', async () => {
    mockFetchActivePolls.mockRejectedValue(new Error('Snapshot down'));
    mockFetchRecentPolls.mockResolvedValue([MOCK_POLL]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.active).toEqual([]);
    expect(body.recent).toHaveLength(1);
  });

  it('returns both empty when both reject', async () => {
    mockFetchActivePolls.mockRejectedValue(new Error('err'));
    mockFetchRecentPolls.mockRejectedValue(new Error('err'));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.active).toEqual([]);
    expect(body.recent).toEqual([]);
  });
});
