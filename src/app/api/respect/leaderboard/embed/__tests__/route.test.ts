// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockFetchLeaderboard = vi.hoisted(() => vi.fn());
vi.mock('@/lib/respect/leaderboard', () => ({
  fetchLeaderboard: mockFetchLeaderboard,
}));

import { GET } from '../route';

afterEach(() => vi.clearAllMocks());

const MOCK_RESULT = {
  leaderboard: [
    { rank: 1, name: 'ZAO', ogRespect: 100, zorRespect: 50, totalRespect: 150 },
    { rank: 2, name: 'Test User', ogRespect: 80, zorRespect: 20, totalRespect: 100 },
  ],
  stats: { totalMembers: 42 },
};

describe('GET /api/respect/leaderboard/embed', () => {
  it('returns 400 for invalid format query param', async () => {
    const req = makeGetRequest('/api/respect/leaderboard/embed', { format: 'xml' });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 200 JSON with leaderboard and stats', async () => {
    mockFetchLeaderboard.mockResolvedValue(MOCK_RESULT);
    const req = makeGetRequest('/api/respect/leaderboard/embed');
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.leaderboard).toHaveLength(2);
    expect(body.leaderboard[0].name).toBe('ZAO');
    expect(body.stats.totalMembers).toBe(42);
  });

  it('returns 200 HTML with text/html content-type when format=html', async () => {
    mockFetchLeaderboard.mockResolvedValue(MOCK_RESULT);
    const req = makeGetRequest('/api/respect/leaderboard/embed', { format: 'html' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/html');
    const text = await res.text();
    expect(text).toContain('ZAO Respect Leaderboard');
    expect(text).toContain('ZAO');
  });

  it('returns 500 when fetchLeaderboard throws', async () => {
    mockFetchLeaderboard.mockRejectedValue(new Error('DB unavailable'));
    const req = makeGetRequest('/api/respect/leaderboard/embed');
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});
