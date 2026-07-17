// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetLeaderboard = vi.hoisted(() => vi.fn());
const mockGetUsersByFids = vi.hoisted(() => vi.fn());

vi.mock('@/lib/spaces/sessionsDb', () => ({ getLeaderboard: mockGetLeaderboard }));
vi.mock('@/lib/farcaster/neynar', () => ({ getUsersByFids: mockGetUsersByFids }));

import { GET } from '../route';

afterEach(() => vi.clearAllMocks());

const MOCK_ENTRY = { fid: 123, totalMinutes: 60, sessionCount: 3 };

describe('GET /api/spaces/leaderboard', () => {
  it('returns 400 for an invalid period', async () => {
    const req = makeGetRequest('/api/spaces/leaderboard', { period: 'decade' });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns empty leaderboard when no sessions exist', async () => {
    mockGetLeaderboard.mockResolvedValue([]);
    mockGetUsersByFids.mockResolvedValue([]);
    const req = makeGetRequest('/api/spaces/leaderboard');
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.leaderboard).toHaveLength(0);
    expect(body.totalCommunityMinutes).toBe(0);
  });

  it('enriches entries with Neynar profile data', async () => {
    mockGetLeaderboard.mockResolvedValue([MOCK_ENTRY]);
    mockGetUsersByFids.mockResolvedValue([
      { fid: 123, username: 'zabal', display_name: 'ZAO AL', pfp_url: 'https://pfp.url' },
    ]);
    const req = makeGetRequest('/api/spaces/leaderboard', { period: 'month' });
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.leaderboard[0].username).toBe('zabal');
    expect(body.leaderboard[0].totalMinutes).toBe(60);
    expect(body.period).toBe('month');
  });

  it('falls back to null profile data when Neynar throws', async () => {
    mockGetLeaderboard.mockResolvedValue([MOCK_ENTRY]);
    mockGetUsersByFids.mockRejectedValue(new Error('Neynar down'));
    const req = makeGetRequest('/api/spaces/leaderboard');
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.leaderboard[0].username).toBeNull();
    expect(body.totalCommunityMinutes).toBe(60);
  });
});
