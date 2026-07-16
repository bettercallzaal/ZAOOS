import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chainMock, makeGetRequest } from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

const { mockGetPopularCasts } = vi.hoisted(() => ({
  mockGetPopularCasts: vi.fn(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/farcaster/neynar', () => ({
  getPopularCasts: mockGetPopularCasts,
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

const SAMPLE_POPULAR_CASTS = {
  casts: [
    {
      hash: 'cast_hash_1',
      text: 'This is a popular cast',
      author: {
        fid: 123,
        username: 'testuser',
        displayName: 'Test User',
      },
      reactions: {
        likes_count: 50,
        recasts_count: 10,
      },
      timestamp: '2024-01-15T10:00:00Z',
    },
    {
      hash: 'cast_hash_2',
      text: 'Another popular cast',
      author: {
        fid: 123,
        username: 'testuser',
        displayName: 'Test User',
      },
      reactions: {
        likes_count: 30,
        recasts_count: 5,
      },
      timestamp: '2024-01-14T15:00:00Z',
    },
  ],
};

describe('GET /api/members/[username]/popular', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('returns 400 when username is empty string', async () => {
      const res = await GET(makeGetRequest('/api/members//popular'), {
        params: Promise.resolve({ username: '' }),
      });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid username');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when username exceeds 100 characters', async () => {
      const longUsername = 'a'.repeat(101);
      const res = await GET(makeGetRequest('/api/members/[username]/popular'), {
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
      mockGetPopularCasts.mockResolvedValue(SAMPLE_POPULAR_CASTS);

      const res = await GET(makeGetRequest('/api/members/a/popular'), {
        params: Promise.resolve({ username: 'a' }),
      });

      expect(res.status).toBe(200);
      expect(mockFrom).toHaveBeenCalledWith('users');
    });

    it('accepts valid username at maximum length (100 chars)', async () => {
      const validUsername = 'a'.repeat(100);
      const mock = chainMock({ data: SAMPLE_USER });
      mockFrom.mockImplementation(mock.handler);
      mockGetPopularCasts.mockResolvedValue(SAMPLE_POPULAR_CASTS);

      const res = await GET(makeGetRequest('/api/members/[username]/popular'), {
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
      mockGetPopularCasts.mockResolvedValue(SAMPLE_POPULAR_CASTS);

      await GET(makeGetRequest('/api/members/testuser/popular'), {
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
      mockGetPopularCasts.mockResolvedValue(SAMPLE_POPULAR_CASTS);

      await GET(makeGetRequest('/api/members/test%20user/popular'), {
        params: Promise.resolve({ username: 'test%20user' }),
      });

      const ilikeCalls = mock.chain.ilike.mock.calls;
      // Verify that decodeURIComponent was applied and lowercased
      expect(ilikeCalls[0][1]).toBe('test user');
    });

    it('lowercases username for case-insensitive search', async () => {
      const mock = chainMock({ data: SAMPLE_USER });
      mockFrom.mockImplementation(mock.handler);
      mockGetPopularCasts.mockResolvedValue(SAMPLE_POPULAR_CASTS);

      await GET(makeGetRequest('/api/members/TestUser/popular'), {
        params: Promise.resolve({ username: 'TestUser' }),
      });

      const ilikeCalls = mock.chain.ilike.mock.calls;
      expect(ilikeCalls[0][1]).toBe('testuser');
    });

    it('filters by is_active = true', async () => {
      const mock = chainMock({ data: SAMPLE_USER });
      mockFrom.mockImplementation(mock.handler);
      mockGetPopularCasts.mockResolvedValue(SAMPLE_POPULAR_CASTS);

      await GET(makeGetRequest('/api/members/testuser/popular'), {
        params: Promise.resolve({ username: 'testuser' }),
      });

      const eqCalls = mock.chain.eq.mock.calls;
      expect(eqCalls).toContainEqual(['is_active', true]);
    });

    it('calls maybeSingle to ensure single row result', async () => {
      const mock = chainMock({ data: SAMPLE_USER });
      mockFrom.mockImplementation(mock.handler);
      mockGetPopularCasts.mockResolvedValue(SAMPLE_POPULAR_CASTS);

      await GET(makeGetRequest('/api/members/testuser/popular'), {
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

      const res = await GET(makeGetRequest('/api/members/nonexistent/popular'), {
        params: Promise.resolve({ username: 'nonexistent' }),
      });
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toBe('User not found');
      expect(mockGetPopularCasts).not.toHaveBeenCalled();
    });

    it('returns 404 when user exists but has no fid', async () => {
      const mock = chainMock({ data: { username: 'testuser', fid: null } });
      mockFrom.mockImplementation(mock.handler);

      const res = await GET(makeGetRequest('/api/members/testuser/popular'), {
        params: Promise.resolve({ username: 'testuser' }),
      });
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toBe('User not found');
      expect(mockGetPopularCasts).not.toHaveBeenCalled();
    });

    it('returns 404 when user object is undefined', async () => {
      const mock = chainMock({ data: undefined });
      mockFrom.mockImplementation(mock.handler);

      const res = await GET(makeGetRequest('/api/members/testuser/popular'), {
        params: Promise.resolve({ username: 'testuser' }),
      });
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toBe('User not found');
      expect(mockGetPopularCasts).not.toHaveBeenCalled();
    });
  });

  describe('success paths', () => {
    it('returns 200 with popular casts data', async () => {
      const mock = chainMock({ data: SAMPLE_USER });
      mockFrom.mockImplementation(mock.handler);
      mockGetPopularCasts.mockResolvedValue(SAMPLE_POPULAR_CASTS);

      const res = await GET(makeGetRequest('/api/members/testuser/popular'), {
        params: Promise.resolve({ username: 'testuser' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.casts).toBeDefined();
      expect(body.casts).toHaveLength(2);
      expect(body.casts[0].hash).toBe('cast_hash_1');
    });

    it('returns complete popular casts data structure', async () => {
      const mock = chainMock({ data: SAMPLE_USER });
      mockFrom.mockImplementation(mock.handler);
      mockGetPopularCasts.mockResolvedValue(SAMPLE_POPULAR_CASTS);

      const res = await GET(makeGetRequest('/api/members/testuser/popular'), {
        params: Promise.resolve({ username: 'testuser' }),
      });
      const body = await res.json();

      expect(body.casts[0]).toMatchObject({
        hash: 'cast_hash_1',
        text: 'This is a popular cast',
        author: {
          fid: 123,
          username: 'testuser',
        },
        reactions: {
          likes_count: 50,
          recasts_count: 10,
        },
      });
    });

    it('returns empty casts array when user has no popular casts', async () => {
      const mock = chainMock({ data: SAMPLE_USER });
      mockFrom.mockImplementation(mock.handler);
      mockGetPopularCasts.mockResolvedValue({ casts: [] });

      const res = await GET(makeGetRequest('/api/members/testuser/popular'), {
        params: Promise.resolve({ username: 'testuser' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.casts).toEqual([]);
    });

    it('calls getPopularCasts with correct user fid', async () => {
      const mock = chainMock({ data: { fid: 456, username: 'anotheruser' } });
      mockFrom.mockImplementation(mock.handler);
      mockGetPopularCasts.mockResolvedValue(SAMPLE_POPULAR_CASTS);

      await GET(makeGetRequest('/api/members/anotheruser/popular'), {
        params: Promise.resolve({ username: 'anotheruser' }),
      });

      expect(mockGetPopularCasts).toHaveBeenCalledWith(456);
    });

    it('passes response from getPopularCasts directly to client', async () => {
      const customResponse = {
        casts: [
          {
            hash: 'custom_hash',
            text: 'Custom cast',
            reactions: { likes_count: 100 },
          },
        ],
      };
      const mock = chainMock({ data: SAMPLE_USER });
      mockFrom.mockImplementation(mock.handler);
      mockGetPopularCasts.mockResolvedValue(customResponse);

      const res = await GET(makeGetRequest('/api/members/testuser/popular'), {
        params: Promise.resolve({ username: 'testuser' }),
      });
      const body = await res.json();

      expect(body).toEqual(customResponse);
    });
  });

  describe('error handling', () => {
    it('returns 500 when supabase query throws during execution', async () => {
      // Make mockFrom throw when called
      mockFrom.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const res = await GET(makeGetRequest('/api/members/testuser/popular'), {
        params: Promise.resolve({ username: 'testuser' }),
      });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch popular casts');
    });

    it('returns 500 when getPopularCasts throws error', async () => {
      const mock = chainMock({ data: SAMPLE_USER });
      mockFrom.mockImplementation(mock.handler);
      mockGetPopularCasts.mockRejectedValue(new Error('Neynar API error'));

      const res = await GET(makeGetRequest('/api/members/testuser/popular'), {
        params: Promise.resolve({ username: 'testuser' }),
      });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch popular casts');
    });

    it('logs error when exception occurs', async () => {
      const { logger } = await import('@/lib/logger');
      const mock = chainMock({ data: SAMPLE_USER });
      mockFrom.mockImplementation(mock.handler);
      mockGetPopularCasts.mockRejectedValue(new Error('API failure'));

      await GET(makeGetRequest('/api/members/testuser/popular'), {
        params: Promise.resolve({ username: 'testuser' }),
      });

      expect(logger.error).toHaveBeenCalledWith('[members/popular] GET error:', expect.any(Error));
    });

    it('handles malformed getPopularCasts response gracefully', async () => {
      const mock = chainMock({ data: SAMPLE_USER });
      mockFrom.mockImplementation(mock.handler);
      mockGetPopularCasts.mockResolvedValue(null);

      const res = await GET(makeGetRequest('/api/members/testuser/popular'), {
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
      mockGetPopularCasts.mockResolvedValue(SAMPLE_POPULAR_CASTS);

      const paramsPromise = Promise.resolve({ username: 'testuser' });
      const res = await GET(makeGetRequest('/api/members/testuser/popular'), {
        params: paramsPromise,
      });

      expect(res.status).toBe(200);
      expect(mockFrom).toHaveBeenCalled();
    });
  });
});
