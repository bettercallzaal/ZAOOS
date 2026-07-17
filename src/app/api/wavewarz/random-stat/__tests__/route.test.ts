// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockGetSessionData = vi.hoisted(() => vi.fn());
const mockGetRandomStat = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/session', () => ({
  getSessionData: mockGetSessionData,
}));

vi.mock('@/lib/wavewarz/random-stats', () => ({
  getRandomStat: mockGetRandomStat,
}));

import { GET } from '../route';

afterEach(() => {
  vi.clearAllMocks();
});

const MOCK_SESSION = { fid: 123, username: 'zabal' };
const MOCK_STAT = {
  title: 'ZAO Artist -- 10 WaveWarZ Wins',
  publish_text: 'ZAO Artist has won 10 battles.',
  stat_type: 'artist_win_record',
};

describe('GET /api/wavewarz/random-stat', () => {
  it('returns 401 when there is no session', async () => {
    mockGetSessionData.mockResolvedValue(null);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBeDefined();
  });

  it('returns 404 when there are no stats available', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockGetRandomStat.mockResolvedValue(null);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBeDefined();
  });

  it('returns 200 with the stat when authenticated', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockGetRandomStat.mockResolvedValue(MOCK_STAT);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.title).toBe(MOCK_STAT.title);
    expect(body.stat_type).toBe('artist_win_record');
  });
});
