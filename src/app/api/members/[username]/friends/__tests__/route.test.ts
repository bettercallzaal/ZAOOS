import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chainMock, makeGetRequest } from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

const { mockGetBestFriends } = vi.hoisted(() => ({
  mockGetBestFriends: vi.fn(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/farcaster/neynar', () => ({
  getBestFriends: mockGetBestFriends,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { GET } from '../route';

// ── Test fixtures ────────────────────────────────────────────────────────────

const SAMPLE_USER = {
  fid: 123,
  username: 'testuser',
  displayName: 'Test User',
};

const SAMPLE_FRIENDS = {
  bestFriends: [
    {
      fid: 200,
      username: 'friend1',
      displayName: 'Friend One',
      pfpUrl: 'https://example.com/pfp1.jpg',
    },
    {
      fid: 201,
      username: 'friend2',
      displayName: 'Friend Two',
      pfpUrl: 'https://example.com/pfp2.jpg',
    },
  ],
};

describe('GET /api/members/[username]/friends', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('returns 400 when username is empty string', async () => {
      const res = await GET(makeGetRequest('/api/members//friends'), {
        params: Promise.resolve({ username: '' }),
      });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid username');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when username exceeds 100 characters', async () => {
      const longUsername = 'a'.repeat(101);
      const res = await GET(makeGetRequest('/api/members/[username]/friends'), {
        params: Promise.resolve({ username: longUsername }),
      });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid username');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('accepts valid username at minimum length (1 char)', async () => {
      const mock = chainMock({ data: SAMPLE_USER });
      mockFrom.mockImplementation(mock.handler);
      mockGetBestFriends.mockResolvedValue(SAMPLE_FRIENDS);

      const res = await GET(makeGetRequest('/api/members/a/friends'), {
        params: Promise.resolve({ username: 'a' }),
      });

      expect(res.status).toBe(200);
      expect(mockFrom).toHaveBeenCalledWith('users');
    });

    it('accepts valid username at maximum length (100 chars)', async () => {
      const validUsername = 'a'.repeat(100);
      const mock = chainMock({ data: SAMPLE_USER });
      mockFrom.mockImplementation(mock.handler);
      mockGetBestFriends.mockResolvedValue(SAMPLE_FRIENDS);

      const res = await GET(makeGetRequest('/api/members/[username]/friends'), {
        params: Promise.resolve({ username: validUsername }),
      });

      expect(res.status).toBe(200);
      expect(mockFrom).toHaveBeenCalledWith('users');
    });
  });

  describe('username lookup', () => {
    it('queries supabase with ilike for username lookup', async () => {
      const mock = chainMock({ data: SAMPLE_USER });
      mockFrom.mockImplementation(mock.handler);
      mockGetBestFriends.mockResolvedValue(SAMPLE_FRIENDS);

      await GET(makeGetRequest('/api/members/testuser/friends'), {
        params: Promise.resolve({ username: 'testuser' }),
      });

      expect(mockFrom).toHaveBeenCalledWith('users');
      const ilikeCalls = mock.chain.ilike.mock.calls;
      expect(ilikeCalls.length).toBeGreaterThan(0);
      expect(ilikeCalls[0][0]).toBe('username');
    });

    it('decodes URI component in username', async () => {
      const mock = chainMock({ data: SAMPLE_USER });
      mockFrom.mockImplementation(mock.handler);
      mockGetBestFriends.mockResolvedValue(SAMPLE_FRIENDS);

      await GET(makeGetRequest('/api/members/test%20user/friends'), {
        params: Promise.resolve({ username: 'test%20user' }),
      });

      const ilikeCalls = mock.chain.ilike.mock.calls;
      // Verify that decodeURIComponent was applied and lowercased
      expect(ilikeCalls[0][1]).toBe('test user');
    });

    it('lowercases username for case-insensitive search', async () => {
      const mock = chainMock({ data: SAMPLE_USER });
      mockFrom.mockImplementation(mock.handler);
      mockGetBestFriends.mockResolvedValue(SAMPLE_FRIENDS);

      await GET(makeGetRequest('/api/members/TestUser/friends'), {
        params: Promise.resolve({ username: 'TestUser' }),
      });

      const ilikeCalls = mock.chain.ilike.mock.calls;
      expect(ilikeCalls[0][1]).toBe('testuser');
    });

    it('filters by is_active = true', async () => {
      const mock = chainMock({ data: SAMPLE_USER });
      mockFrom.mockImplementation(mock.handler);
      mockGetBestFriends.mockResolvedValue(SAMPLE_FRIENDS);

      await GET(makeGetRequest('/api/members/testuser/friends'), {
        params: Promise.resolve({ username: 'testuser' }),
      });

      const eqCalls = mock.chain.eq.mock.calls;
      expect(eqCalls).toContainEqual(['is_active', true]);
    });

    it('calls maybeSingle to ensure single row result', async () => {
      const mock = chainMock({ data: SAMPLE_USER });
      mockFrom.mockImplementation(mock.handler);
      mockGetBestFriends.mockResolvedValue(SAMPLE_FRIENDS);

      await GET(makeGetRequest('/api/members/testuser/friends'), {
        params: Promise.resolve({ username: 'testuser' }),
      });

      const maybeSingleCalls = mock.chain.maybeSingle.mock.calls;
      expect(maybeSingleCalls.length).toBeGreaterThan(0);
    });
  });

  describe('user not found', () => {
    it('returns 404 when user does not exist', async () => {
      const mock = chainMock({ data: null });
      mockFrom.mockImplementation(mock.handler);

      const res = await GET(makeGetRequest('/api/members/nonexistent/friends'), {
        params: Promise.resolve({ username: 'nonexistent' }),
      });
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toBe('User not found');
      expect(mockGetBestFriends).not.toHaveBeenCalled();
    });

    it('returns 404 when user exists but has no fid', async () => {
      const mock = chainMock({ data: { username: 'testuser', fid: null } });
      mockFrom.mockImplementation(mock.handler);

      const res = await GET(makeGetRequest('/api/members/testuser/friends'), {
        params: Promise.resolve({ username: 'testuser' }),
      });
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toBe('User not found');
      expect(mockGetBestFriends).not.toHaveBeenCalled();
    });

    it('returns 404 when user object is undefined', async () => {
      const mock = chainMock({ data: undefined });
      mockFrom.mockImplementation(mock.handler);

      const res = await GET(makeGetRequest('/api/members/testuser/friends'), {
        params: Promise.resolve({ username: 'testuser' }),
      });
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toBe('User not found');
      expect(mockGetBestFriends).not.toHaveBeenCalled();
    });
  });

  describe('limit parameter', () => {
    it('uses default limit of 10 when not provided', async () => {
      const mock = chainMock({ data: SAMPLE_USER });
      mockFrom.mockImplementation(mock.handler);
      mockGetBestFriends.mockResolvedValue(SAMPLE_FRIENDS);

      await GET(makeGetRequest('/api/members/testuser/friends'), {
        params: Promise.resolve({ username: 'testuser' }),
      });

      expect(mockGetBestFriends).toHaveBeenCalledWith(SAMPLE_USER.fid, 10);
    });

    it('accepts custom limit parameter', async () => {
      const mock = chainMock({ data: SAMPLE_USER });
      mockFrom.mockImplementation(mock.handler);
      mockGetBestFriends.mockResolvedValue(SAMPLE_FRIENDS);

      await GET(makeGetRequest('/api/members/testuser/friends', { limit: '15' }), {
        params: Promise.resolve({ username: 'testuser' }),
      });

      expect(mockGetBestFriends).toHaveBeenCalledWith(SAMPLE_USER.fid, 15);
    });

    it('clamps limit to maximum of 25', async () => {
      const mock = chainMock({ data: SAMPLE_USER });
      mockFrom.mockImplementation(mock.handler);
      mockGetBestFriends.mockResolvedValue(SAMPLE_FRIENDS);

      await GET(makeGetRequest('/api/members/testuser/friends', { limit: '100' }), {
        params: Promise.resolve({ username: 'testuser' }),
      });

      expect(mockGetBestFriends).toHaveBeenCalledWith(SAMPLE_USER.fid, 25);
    });

    it('treats non-numeric limit as default (parseInt returns NaN)', async () => {
      const mock = chainMock({ data: SAMPLE_USER });
      mockFrom.mockImplementation(mock.handler);
      mockGetBestFriends.mockResolvedValue(SAMPLE_FRIENDS);

      await GET(makeGetRequest('/api/members/testuser/friends', { limit: 'abc' }), {
        params: Promise.resolve({ username: 'testuser' }),
      });

      // parseInt('abc', 10) returns NaN, should use default 10
      expect(mockGetBestFriends).toHaveBeenCalledWith(SAMPLE_USER.fid, 10);
    });

    it('handles negative limit by using default', async () => {
      const mock = chainMock({ data: SAMPLE_USER });
      mockFrom.mockImplementation(mock.handler);
      mockGetBestFriends.mockResolvedValue(SAMPLE_FRIENDS);

      await GET(makeGetRequest('/api/members/testuser/friends', { limit: '-5' }), {
        params: Promise.resolve({ username: 'testuser' }),
      });

      expect(mockGetBestFriends).toHaveBeenCalledWith(SAMPLE_USER.fid, 10);
    });

    it('accepts limit at boundary (25)', async () => {
      const mock = chainMock({ data: SAMPLE_USER });
      mockFrom.mockImplementation(mock.handler);
      mockGetBestFriends.mockResolvedValue(SAMPLE_FRIENDS);

      await GET(makeGetRequest('/api/members/testuser/friends', { limit: '25' }), {
        params: Promise.resolve({ username: 'testuser' }),
      });

      expect(mockGetBestFriends).toHaveBeenCalledWith(SAMPLE_USER.fid, 25);
    });

    it('accepts limit at boundary (1)', async () => {
      const mock = chainMock({ data: SAMPLE_USER });
      mockFrom.mockImplementation(mock.handler);
      mockGetBestFriends.mockResolvedValue(SAMPLE_FRIENDS);

      await GET(makeGetRequest('/api/members/testuser/friends', { limit: '1' }), {
        params: Promise.resolve({ username: 'testuser' }),
      });

      expect(mockGetBestFriends).toHaveBeenCalledWith(SAMPLE_USER.fid, 1);
    });
  });

  describe('success paths', () => {
    it('returns 200 with friends data', async () => {
      const mock = chainMock({ data: SAMPLE_USER });
      mockFrom.mockImplementation(mock.handler);
      mockGetBestFriends.mockResolvedValue(SAMPLE_FRIENDS);

      const res = await GET(makeGetRequest('/api/members/testuser/friends'), {
        params: Promise.resolve({ username: 'testuser' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.bestFriends).toBeDefined();
      expect(body.bestFriends).toHaveLength(2);
      expect(body.bestFriends[0].fid).toBe(200);
    });

    it('returns complete friends data structure', async () => {
      const mock = chainMock({ data: SAMPLE_USER });
      mockFrom.mockImplementation(mock.handler);
      mockGetBestFriends.mockResolvedValue(SAMPLE_FRIENDS);

      const res = await GET(makeGetRequest('/api/members/testuser/friends'), {
        params: Promise.resolve({ username: 'testuser' }),
      });
      const body = await res.json();

      expect(body.bestFriends[0]).toMatchObject({
        fid: 200,
        username: 'friend1',
        displayName: 'Friend One',
        pfpUrl: 'https://example.com/pfp1.jpg',
      });
    });

    it('returns empty friends array when user has no friends', async () => {
      const mock = chainMock({ data: SAMPLE_USER });
      mockFrom.mockImplementation(mock.handler);
      mockGetBestFriends.mockResolvedValue({ bestFriends: [] });

      const res = await GET(makeGetRequest('/api/members/testuser/friends'), {
        params: Promise.resolve({ username: 'testuser' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.bestFriends).toEqual([]);
    });

    it('calls getBestFriends with correct user fid and limit', async () => {
      const mock = chainMock({ data: { fid: 456, username: 'anotheruser' } });
      mockFrom.mockImplementation(mock.handler);
      mockGetBestFriends.mockResolvedValue(SAMPLE_FRIENDS);

      await GET(makeGetRequest('/api/members/anotheruser/friends', { limit: '20' }), {
        params: Promise.resolve({ username: 'anotheruser' }),
      });

      expect(mockGetBestFriends).toHaveBeenCalledWith(456, 20);
    });
  });

  describe('error handling', () => {
    it('returns 500 when supabase query throws during execution', async () => {
      // Make the chainMock throw when awaited
      mockFrom.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const res = await GET(makeGetRequest('/api/members/testuser/friends'), {
        params: Promise.resolve({ username: 'testuser' }),
      });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch best friends');
    });

    it('returns 500 when getBestFriends throws error', async () => {
      const mock = chainMock({ data: SAMPLE_USER });
      mockFrom.mockImplementation(mock.handler);
      mockGetBestFriends.mockRejectedValue(new Error('Neynar API error'));

      const res = await GET(makeGetRequest('/api/members/testuser/friends'), {
        params: Promise.resolve({ username: 'testuser' }),
      });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch best friends');
    });

    it('logs error when exception occurs', async () => {
      const { logger } = await import('@/lib/logger');
      const mock = chainMock({ data: SAMPLE_USER });
      mockFrom.mockImplementation(mock.handler);
      mockGetBestFriends.mockRejectedValue(new Error('API failure'));

      await GET(makeGetRequest('/api/members/testuser/friends'), {
        params: Promise.resolve({ username: 'testuser' }),
      });

      expect(logger.error).toHaveBeenCalledWith('[members/friends] GET error:', expect.any(Error));
    });

    it('handles malformed getBestFriends response gracefully', async () => {
      const mock = chainMock({ data: SAMPLE_USER });
      mockFrom.mockImplementation(mock.handler);
      mockGetBestFriends.mockResolvedValue(null);

      const res = await GET(makeGetRequest('/api/members/testuser/friends'), {
        params: Promise.resolve({ username: 'testuser' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual(null);
    });
  });

  describe('dynamic params Promise handling', () => {
    it('correctly awaits params Promise', async () => {
      const mock = chainMock({ data: SAMPLE_USER });
      mockFrom.mockImplementation(mock.handler);
      mockGetBestFriends.mockResolvedValue(SAMPLE_FRIENDS);

      const paramsPromise = Promise.resolve({ username: 'testuser' });
      const res = await GET(makeGetRequest('/api/members/testuser/friends'), {
        params: paramsPromise,
      });

      expect(res.status).toBe(200);
      expect(mockFrom).toHaveBeenCalled();
    });
  });
});
