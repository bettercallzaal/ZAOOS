import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetSessionData = vi.hoisted(() => vi.fn());
const mockGetRandomStat = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/wavewarz/random-stats', () => ({
  getRandomStat: () => mockGetRandomStat(),
}));

import { GET } from '@/app/api/wavewarz/random-stat/route';

describe('GET /api/wavewarz/random-stat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns 404 when no stats available', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });
    mockGetRandomStat.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('No stats available yet');
  });

  it('returns stat when available', async () => {
    const stat = { label: 'Total Battles', value: 647 };
    mockGetSessionData.mockResolvedValue({ fid: 123 });
    mockGetRandomStat.mockResolvedValue(stat);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(stat);
  });
});
