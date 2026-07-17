// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
const mockGetEngagementScores = vi.hoisted(() => vi.fn());
const mockGetPersonalizedScores = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));
vi.mock('@/lib/openrank/client', () => ({
  getEngagementScores: mockGetEngagementScores,
  getPersonalizedScores: mockGetPersonalizedScores,
}));

import { GET } from '../route';

afterEach(() => vi.clearAllMocks());

const MOCK_SESSION = { fid: 1 };

describe('GET /api/social/engagement', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const req = makeGetRequest('/api/social/engagement', { fids: '123' });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when fids param is missing', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    const req = makeGetRequest('/api/social/engagement');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for an invalid (non-integer) fid', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    const req = makeGetRequest('/api/social/engagement', { fids: '123,bad,456' });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns merged scores keyed by FID string', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockGetEngagementScores.mockResolvedValue(new Map([[123, 0.85], [456, 0.60]]));
    mockGetPersonalizedScores.mockResolvedValue(new Map([[123, 0.9], [456, 0.5]]));
    const req = makeGetRequest('/api/social/engagement', { fids: '123,456' });
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.scores['123'].global).toBe(0.85);
    expect(body.scores['123'].personalized).toBe(0.9);
    expect(body.scores['456'].global).toBe(0.60);
  });

  it('returns zeros when openrank calls both fail', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockGetEngagementScores.mockRejectedValue(new Error('OpenRank down'));
    mockGetPersonalizedScores.mockRejectedValue(new Error('OpenRank down'));
    const req = makeGetRequest('/api/social/engagement', { fids: '789' });
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.scores['789'].global).toBe(0);
    expect(body.scores['789'].personalized).toBe(0);
  });
});
