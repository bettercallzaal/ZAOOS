import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeGetRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSessionData, mockGetChannelRankings } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockGetChannelRankings: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/openrank/client', () => ({
  getChannelRankings: mockGetChannelRankings,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

import { GET } from '../route';

describe('GET /api/social/trending', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockGetChannelRankings.mockResolvedValue([]);
  });

  // ── Authentication tests ──────────────────────────────────────────────────

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET(makeGetRequest('/api/social/trending'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('logs no error on 401', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const { logger } = await import('@/lib/logger');
    await GET(makeGetRequest('/api/social/trending'));
    expect(logger.error).not.toHaveBeenCalled();
  });

  // ── Channel parameter tests ──────────────────────────────────────────────

  it('defaults to "thezao" channel when no channel param provided', async () => {
    const res = await GET(makeGetRequest('/api/social/trending'));
    expect(res.status).toBe(200);
    expect(mockGetChannelRankings).toHaveBeenCalledWith('thezao', 25);
  });

  it('uses provided channel when valid', async () => {
    const res = await GET(makeGetRequest('/api/social/trending', { channel: 'mychannel' }));
    expect(res.status).toBe(200);
    expect(mockGetChannelRankings).toHaveBeenCalledWith('mychannel', 25);
  });

  it('trims whitespace from channel param', async () => {
    const res = await GET(makeGetRequest('/api/social/trending', { channel: '  mychannel  ' }));
    expect(res.status).toBe(200);
    expect(mockGetChannelRankings).toHaveBeenCalledWith('mychannel', 25);
  });

  it('accepts channel with hyphens', async () => {
    const res = await GET(makeGetRequest('/api/social/trending', { channel: 'my-channel' }));
    expect(res.status).toBe(200);
    expect(mockGetChannelRankings).toHaveBeenCalledWith('my-channel', 25);
  });

  it('accepts channel with underscores', async () => {
    const res = await GET(makeGetRequest('/api/social/trending', { channel: 'my_channel' }));
    expect(res.status).toBe(200);
    expect(mockGetChannelRankings).toHaveBeenCalledWith('my_channel', 25);
  });

  it('accepts alphanumeric channel names', async () => {
    const res = await GET(makeGetRequest('/api/social/trending', { channel: 'channel123' }));
    expect(res.status).toBe(200);
    expect(mockGetChannelRankings).toHaveBeenCalledWith('channel123', 25);
  });

  it('returns 400 when channel contains spaces', async () => {
    const res = await GET(makeGetRequest('/api/social/trending', { channel: 'my channel' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid channel name');
  });

  it('returns 400 when channel contains special characters', async () => {
    const res = await GET(makeGetRequest('/api/social/trending', { channel: 'my@channel' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid channel name');
  });

  it('returns 400 when channel contains periods', async () => {
    const res = await GET(makeGetRequest('/api/social/trending', { channel: 'my.channel' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid channel name');
  });

  it('returns 400 when channel contains slashes', async () => {
    const res = await GET(makeGetRequest('/api/social/trending', { channel: 'my/channel' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid channel name');
  });

  it('defaults to "thezao" when channel param is empty string after trim', async () => {
    const res = await GET(makeGetRequest('/api/social/trending', { channel: '   ' }));
    expect(res.status).toBe(200);
    expect(mockGetChannelRankings).toHaveBeenCalledWith('thezao', 25);
  });

  // ── Limit parameter tests ────────────────────────────────────────────────

  it('defaults to 25 limit when no limit param provided', async () => {
    const res = await GET(makeGetRequest('/api/social/trending'));
    expect(res.status).toBe(200);
    expect(mockGetChannelRankings).toHaveBeenCalledWith('thezao', 25);
  });

  it('uses provided limit when valid', async () => {
    const res = await GET(makeGetRequest('/api/social/trending', { limit: '50' }));
    expect(res.status).toBe(200);
    expect(mockGetChannelRankings).toHaveBeenCalledWith('thezao', 50);
  });

  it('accepts limit of 1', async () => {
    const res = await GET(makeGetRequest('/api/social/trending', { limit: '1' }));
    expect(res.status).toBe(200);
    expect(mockGetChannelRankings).toHaveBeenCalledWith('thezao', 1);
  });

  it('accepts limit at max boundary (100)', async () => {
    const res = await GET(makeGetRequest('/api/social/trending', { limit: '100' }));
    expect(res.status).toBe(200);
    expect(mockGetChannelRankings).toHaveBeenCalledWith('thezao', 100);
  });

  it('returns 400 when limit exceeds max (101)', async () => {
    const res = await GET(makeGetRequest('/api/social/trending', { limit: '101' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('limit must be an integer between 1 and 100');
  });

  it('returns 400 when limit is zero', async () => {
    const res = await GET(makeGetRequest('/api/social/trending', { limit: '0' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('limit must be an integer between 1 and 100');
  });

  it('returns 400 when limit is negative', async () => {
    const res = await GET(makeGetRequest('/api/social/trending', { limit: '-10' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('limit must be an integer between 1 and 100');
  });

  it('returns 400 when limit is a float', async () => {
    const res = await GET(makeGetRequest('/api/social/trending', { limit: '25.5' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('limit must be an integer between 1 and 100');
  });

  it('returns 400 when limit is non-numeric', async () => {
    const res = await GET(makeGetRequest('/api/social/trending', { limit: 'abc' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('limit must be an integer between 1 and 100');
  });

  it('returns 400 when limit is NaN (empty spaces)', async () => {
    const res = await GET(makeGetRequest('/api/social/trending', { limit: '   ' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('limit must be an integer between 1 and 100');
  });

  it('returns 400 when limit param is not a valid integer string', async () => {
    const res = await GET(makeGetRequest('/api/social/trending', { limit: '1e3' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('limit must be an integer between 1 and 100');
  });

  it('uses provided limit with provided channel', async () => {
    const res = await GET(
      makeGetRequest('/api/social/trending', { channel: 'mychannel', limit: '75' }),
    );
    expect(res.status).toBe(200);
    expect(mockGetChannelRankings).toHaveBeenCalledWith('mychannel', 75);
  });

  // ── Response structure tests ─────────────────────────────────────────────

  it('returns 200 with rankings and channel in response', async () => {
    const mockRankings = [
      { fid: 1, fname: 'user1', username: 'user1', rank: 1, score: 100, percentile: 99 },
      { fid: 2, fname: 'user2', username: 'user2', rank: 2, score: 95, percentile: 98 },
    ];
    mockGetChannelRankings.mockResolvedValue(mockRankings);

    const res = await GET(makeGetRequest('/api/social/trending'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.rankings).toEqual(mockRankings);
    expect(body.channel).toBe('thezao');
  });

  it('includes channel in response when custom channel provided', async () => {
    mockGetChannelRankings.mockResolvedValue([]);
    const res = await GET(makeGetRequest('/api/social/trending', { channel: 'custom' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.channel).toBe('custom');
  });

  it('returns empty rankings array when getChannelRankings returns empty', async () => {
    mockGetChannelRankings.mockResolvedValue([]);
    const res = await GET(makeGetRequest('/api/social/trending'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.rankings).toEqual([]);
  });

  it('returns proper OpenRankScore objects in rankings array', async () => {
    const mockRankings = [
      {
        fid: 123,
        fname: 'testuser',
        username: 'testuser',
        rank: 1,
        score: 100.5,
        percentile: 99.9,
      },
    ];
    mockGetChannelRankings.mockResolvedValue(mockRankings);

    const res = await GET(makeGetRequest('/api/social/trending'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.rankings[0]).toEqual({
      fid: 123,
      fname: 'testuser',
      username: 'testuser',
      rank: 1,
      score: 100.5,
      percentile: 99.9,
    });
  });

  it('response does not include error field on success', async () => {
    const res = await GET(makeGetRequest('/api/social/trending'));
    const body = await res.json();
    expect(body).not.toHaveProperty('error');
  });

  // ── Cache header tests ───────────────────────────────────────────────────

  it('sets Cache-Control header on success', async () => {
    const res = await GET(makeGetRequest('/api/social/trending'));
    const cacheControl = res.headers.get('Cache-Control');
    expect(cacheControl).toBe('public, s-maxage=3600, stale-while-revalidate=300');
  });

  it('sets correct cache values for 1-hour CDN + 5-minute revalidation', async () => {
    const res = await GET(makeGetRequest('/api/social/trending'));
    const cacheControl = res.headers.get('Cache-Control');
    expect(cacheControl).toContain('s-maxage=3600');
    expect(cacheControl).toContain('stale-while-revalidate=300');
    expect(cacheControl).toContain('public');
  });

  // ── Error handling tests ─────────────────────────────────────────────────

  it('returns 500 when getChannelRankings throws an error', async () => {
    const testError = new Error('OpenRank API failed');
    mockGetChannelRankings.mockRejectedValue(testError);

    const res = await GET(makeGetRequest('/api/social/trending'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch trending rankings');
  });

  it('logs error when getChannelRankings throws', async () => {
    const { logger } = await import('@/lib/logger');
    const testError = new Error('OpenRank API failed');
    mockGetChannelRankings.mockRejectedValue(testError);

    await GET(makeGetRequest('/api/social/trending'));
    expect(logger.error).toHaveBeenCalledWith('Trending rankings error:', testError);
  });

  it('returns safe error message on unexpected exception', async () => {
    mockGetChannelRankings.mockImplementation(() => {
      throw new Error('Internal error details should not leak');
    });

    const res = await GET(makeGetRequest('/api/social/trending'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch trending rankings');
    expect(body.error).not.toContain('Internal error details');
  });

  // ── Combined parameter tests ─────────────────────────────────────────────

  it('accepts both channel and limit parameters together', async () => {
    const res = await GET(
      makeGetRequest('/api/social/trending', { channel: 'music', limit: '50' }),
    );
    expect(res.status).toBe(200);
    expect(mockGetChannelRankings).toHaveBeenCalledWith('music', 50);
  });

  it('validates channel before validating limit', async () => {
    const res = await GET(
      makeGetRequest('/api/social/trending', { channel: 'invalid@char', limit: '999' }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid channel name');
    expect(mockGetChannelRankings).not.toHaveBeenCalled();
  });

  it('validates limit even when channel is valid', async () => {
    const res = await GET(
      makeGetRequest('/api/social/trending', { channel: 'mychannel', limit: '999' }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('limit must be an integer between 1 and 100');
  });

  // ── Edge cases and boundary tests ──────────────────────────────────────

  it('handles very large channel names (long alphanumeric string)', async () => {
    const longChannel = 'a'.repeat(100);
    const res = await GET(makeGetRequest('/api/social/trending', { channel: longChannel }));
    expect(res.status).toBe(200);
    expect(mockGetChannelRankings).toHaveBeenCalledWith(longChannel, 25);
  });

  it('handles single character channel name', async () => {
    const res = await GET(makeGetRequest('/api/social/trending', { channel: 'a' }));
    expect(res.status).toBe(200);
    expect(mockGetChannelRankings).toHaveBeenCalledWith('a', 25);
  });

  it('handles limit at various valid boundaries', async () => {
    const validLimits = [1, 5, 25, 50, 99, 100];

    for (const limit of validLimits) {
      mockGetChannelRankings.mockClear();
      const res = await GET(makeGetRequest('/api/social/trending', { limit: String(limit) }));
      expect(res.status).toBe(200);
      expect(mockGetChannelRankings).toHaveBeenCalledWith('thezao', limit);
    }
  });

  it('returns proper JSON response content-type header', async () => {
    const res = await GET(makeGetRequest('/api/social/trending'));
    const contentType = res.headers.get('Content-Type');
    expect(contentType).toBe('application/json');
  });

  it('does not call getChannelRankings when channel validation fails', async () => {
    await GET(makeGetRequest('/api/social/trending', { channel: 'bad@name' }));
    expect(mockGetChannelRankings).not.toHaveBeenCalled();
  });

  it('does not call getChannelRankings when limit validation fails', async () => {
    await GET(makeGetRequest('/api/social/trending', { limit: '999' }));
    expect(mockGetChannelRankings).not.toHaveBeenCalled();
  });
});
