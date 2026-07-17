// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
const mockGetTrendingTopics = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));
vi.mock('@/lib/farcaster/neynar', () => ({ getTrendingTopics: mockGetTrendingTopics }));

import { GET } from '../route';

afterEach(() => vi.clearAllMocks());

describe('GET /api/social/trending-topics', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const req = makeGetRequest('/api/social/trending-topics');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns trending topics with explicit valid limit', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 1 });
    const mockData = { topics: [{ topic: 'ZAO', rank: 1 }] };
    mockGetTrendingTopics.mockResolvedValue(mockData);
    const req = makeGetRequest('/api/social/trending-topics', { limit: '5' });
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(mockGetTrendingTopics).toHaveBeenCalledWith(5);
    expect(body.topics).toHaveLength(1);
  });

  it('clamps NaN limit to default 10', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 1 });
    mockGetTrendingTopics.mockResolvedValue({ topics: [] });
    const req = makeGetRequest('/api/social/trending-topics', { limit: 'abc' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(mockGetTrendingTopics).toHaveBeenCalledWith(10);
  });

  it('clamps limit above 25 to 25', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 1 });
    mockGetTrendingTopics.mockResolvedValue({ topics: [] });
    const req = makeGetRequest('/api/social/trending-topics', { limit: '100' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(mockGetTrendingTopics).toHaveBeenCalledWith(25);
  });

  it('returns 500 when getTrendingTopics throws', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 1 });
    mockGetTrendingTopics.mockRejectedValue(new Error('Neynar down'));
    const req = makeGetRequest('/api/social/trending-topics');
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});
