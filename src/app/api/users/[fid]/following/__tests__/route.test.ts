import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chainMock, makeGetRequest, mockAuthenticatedSession } from '@/test-utils/api-helpers';

const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

const { mockGetFollowing } = vi.hoisted(() => ({
  mockGetFollowing: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/farcaster/neynar', () => ({
  getFollowing: (
    fid: number,
    viewerFid?: number,
    sortType?: string,
    cursor?: string,
    limit?: number,
  ) => mockGetFollowing(fid, viewerFid, sortType, cursor, limit),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from '../route';

describe('GET /api/users/[fid]/following', () => {
  const testFid = '456';
  const mockUser1 = {
    fid: 100,
    username: 'user1',
    display_name: 'User One',
    follower_count: 50,
    active_status: 'active',
    viewer_context: {
      following: true,
      followed_by: false,
    },
  };

  const mockUser2 = {
    fid: 101,
    username: 'user2',
    display_name: 'User Two',
    follower_count: 200,
    active_status: 'active',
    viewer_context: {
      following: false,
      followed_by: true,
    },
  };

  const mockUser3 = {
    fid: 102,
    username: 'user3',
    display_name: 'User Three',
    follower_count: 10,
    active_status: 'inactive',
    viewer_context: {
      following: true,
      followed_by: true,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    mockGetFollowing.mockResolvedValue({
      users: [{ user: mockUser1 }, { user: mockUser2 }, { user: mockUser3 }],
      next: 'cursor123',
    });
  });

  describe('authentication', () => {
    it('returns 401 when no session exists', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await GET(makeGetRequest(`/api/users/${testFid}/following`), {
        params: Promise.resolve({ fid: testFid }),
      });
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockGetFollowing).not.toHaveBeenCalled();
    });

    it('proceeds when session exists', async () => {
      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest(`/api/users/${testFid}/following`), {
        params: Promise.resolve({ fid: testFid }),
      });

      expect(res.status).toBe(200);
      expect(mockGetFollowing).toHaveBeenCalled();
    });
  });

  describe('fid validation', () => {
    it('returns 400 when fid is not a valid integer', async () => {
      const res = await GET(makeGetRequest(`/api/users/invalid/following`), {
        params: Promise.resolve({ fid: 'invalid' }),
      });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid FID');
      expect(mockGetFollowing).not.toHaveBeenCalled();
    });

    it('allows negative fid to parse (route does not validate negative values)', async () => {
      // The route's parseInt check only validates NaN, not negative numbers.
      // Negative FIDs will parse successfully but neynar will likely reject them.
      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest(`/api/users/-1/following`), {
        params: Promise.resolve({ fid: '-1' }),
      });

      expect(res.status).toBe(200);
      expect(mockGetFollowing).toHaveBeenCalledWith(-1, 123, 'desc_chron', undefined, 100);
    });

    it('coerces a numeric-string fid and proceeds', async () => {
      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest(`/api/users/456/following`), {
        params: Promise.resolve({ fid: '456' }),
      });

      expect(res.status).toBe(200);
      expect(mockGetFollowing).toHaveBeenCalledWith(456, 123, 'desc_chron', undefined, 100);
    });
  });

  describe('sort parameter handling', () => {
    beforeEach(() => {
      mockFrom.mockReturnValue(chainMock({ data: [] }).chain);
    });

    it('defaults to desc_chron sort when sort param is absent', async () => {
      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest(`/api/users/${testFid}/following`), {
        params: Promise.resolve({ fid: testFid }),
      });

      expect(res.status).toBe(200);
      expect(mockGetFollowing).toHaveBeenCalledWith(456, 123, 'desc_chron', undefined, 100);
    });

    it('converts sort=relevant to algorithmic for neynar', async () => {
      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest(`/api/users/${testFid}/following?sort=relevant`), {
        params: Promise.resolve({ fid: testFid }),
      });

      expect(res.status).toBe(200);
      expect(mockGetFollowing).toHaveBeenCalledWith(456, 123, 'algorithmic', undefined, 100);
    });

    it('defaults to desc_chron for sort=recent', async () => {
      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest(`/api/users/${testFid}/following?sort=recent`), {
        params: Promise.resolve({ fid: testFid }),
      });

      expect(res.status).toBe(200);
      expect(mockGetFollowing).toHaveBeenCalledWith(456, 123, 'desc_chron', undefined, 100);
    });

    it('applies popular sorting to users (desc by follower_count)', async () => {
      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest(`/api/users/${testFid}/following?sort=popular`), {
        params: Promise.resolve({ fid: testFid }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      // popular sort should order by follower_count descending: user2 (200), user1 (50), user3 (10)
      expect(body.users[0].fid).toBe(101);
      expect(body.users[1].fid).toBe(100);
      expect(body.users[2].fid).toBe(102);
    });

    it('applies mutual filtering (following && followed_by)', async () => {
      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest(`/api/users/${testFid}/following?sort=mutual`), {
        params: Promise.resolve({ fid: testFid }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      // only user3 has both following=true and followed_by=true
      expect(body.users.length).toBe(1);
      expect(body.users[0].fid).toBe(102);
    });

    it('applies inactive sorting (inactive first, then by follower_count)', async () => {
      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest(`/api/users/${testFid}/following?sort=inactive`), {
        params: Promise.resolve({ fid: testFid }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      // user3 (inactive) should come first, then user2 (50 followers), then user1 (200 followers)
      expect(body.users[0].fid).toBe(102); // inactive
      expect(body.users[1].fid).toBe(100); // active, 50 followers
      expect(body.users[2].fid).toBe(101); // active, 200 followers
    });

    it('applies zao filtering (isZaoMember=true)', async () => {
      const allowlistChain = chainMock({
        data: [{ fid: 100 }, { fid: 101 }], // user1 and user2 are allowlisted
      });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest(`/api/users/${testFid}/following?sort=zao`), {
        params: Promise.resolve({ fid: testFid }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      // only user1 (100) and user2 (101) pass the ZAO filter
      expect(body.users.length).toBe(2);
      expect(body.users.map((u: { fid: number }) => u.fid)).toContain(100);
      expect(body.users.map((u: { fid: number }) => u.fid)).toContain(101);
    });
  });

  describe('cursor pagination', () => {
    it('passes cursor to getFollowing when provided', async () => {
      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest(`/api/users/${testFid}/following?cursor=abc123`), {
        params: Promise.resolve({ fid: testFid }),
      });

      expect(res.status).toBe(200);
      expect(mockGetFollowing).toHaveBeenCalledWith(456, 123, 'desc_chron', 'abc123', 100);
    });

    it('includes next cursor in response when available', async () => {
      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest(`/api/users/${testFid}/following`), {
        params: Promise.resolve({ fid: testFid }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.next).toBe('cursor123');
    });

    it('returns null for next when not available', async () => {
      mockGetFollowing.mockResolvedValueOnce({
        users: [{ user: mockUser1 }],
        next: undefined,
      });

      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest(`/api/users/${testFid}/following`), {
        params: Promise.resolve({ fid: testFid }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.next).toBeNull();
    });
  });

  describe('allowlist enrichment', () => {
    it('enriches users with isZaoMember flag from allowlist', async () => {
      const allowlistChain = chainMock({
        data: [{ fid: 100 }], // only user1 is allowlisted
      });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest(`/api/users/${testFid}/following`), {
        params: Promise.resolve({ fid: testFid }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      const user1 = body.users.find((u: { fid: number }) => u.fid === 100);
      const user2 = body.users.find((u: { fid: number }) => u.fid === 101);
      expect(user1?.isZaoMember).toBe(true);
      expect(user2?.isZaoMember).toBe(false);
    });

    it('returns empty allowlist check when no users are returned', async () => {
      mockGetFollowing.mockResolvedValueOnce({
        users: [],
        next: null,
      });

      const res = await GET(makeGetRequest(`/api/users/${testFid}/following`), {
        params: Promise.resolve({ fid: testFid }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.users).toEqual([]);
      // allowlist query should not be called if no users
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('zid enrichment', () => {
    it('enriches users with zid from users table', async () => {
      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({
        data: [
          { fid: 100, zid: 1 },
          { fid: 102, zid: 3 },
        ],
      });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest(`/api/users/${testFid}/following`), {
        params: Promise.resolve({ fid: testFid }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      const user1 = body.users.find((u: { fid: number }) => u.fid === 100);
      const user2 = body.users.find((u: { fid: number }) => u.fid === 101);
      const user3 = body.users.find((u: { fid: number }) => u.fid === 102);
      expect(user1?.zid).toBe(1);
      expect(user2?.zid).toBeNull();
      expect(user3?.zid).toBe(3);
    });
  });

  describe('user unwrapping', () => {
    it('unwraps users that are nested under a user property', async () => {
      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest(`/api/users/${testFid}/following`), {
        params: Promise.resolve({ fid: testFid }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      // all users should be unwrapped at top level
      expect(body.users.every((u: { fid: number }) => 'fid' in u)).toBe(true);
      expect(body.users.length).toBe(3);
    });

    it('falls back to raw user object when user property is missing', async () => {
      mockGetFollowing.mockResolvedValueOnce({
        users: [mockUser1, { user: mockUser2 }, mockUser3], // mixed wrapped/unwrapped
        next: null,
      });

      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest(`/api/users/${testFid}/following`), {
        params: Promise.resolve({ fid: testFid }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.users.length).toBe(3);
      expect(body.users.map((u: { fid: number }) => u.fid)).toEqual([100, 101, 102]);
    });
  });

  describe('error handling', () => {
    it('returns 500 when getFollowing throws an error', async () => {
      mockGetFollowing.mockRejectedValueOnce(new Error('neynar api failure'));

      const res = await GET(makeGetRequest(`/api/users/${testFid}/following`), {
        params: Promise.resolve({ fid: testFid }),
      });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch following');
    });

    it('returns 500 when allowlist query throws an error', async () => {
      mockGetFollowing.mockResolvedValueOnce({
        users: [{ user: mockUser1 }],
        next: null,
      });

      mockFrom.mockImplementationOnce(() => {
        throw new Error('supabase connection error');
      });

      const res = await GET(makeGetRequest(`/api/users/${testFid}/following`), {
        params: Promise.resolve({ fid: testFid }),
      });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch following');
    });

    it('returns 500 when zid query throws an error', async () => {
      mockGetFollowing.mockResolvedValueOnce({
        users: [{ user: mockUser1 }],
        next: null,
      });

      const allowlistChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockImplementationOnce(() => {
        throw new Error('zid query failed');
      });

      const res = await GET(makeGetRequest(`/api/users/${testFid}/following`), {
        params: Promise.resolve({ fid: testFid }),
      });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch following');
    });
  });

  describe('successful response shape', () => {
    it('returns users array with enriched properties', async () => {
      const allowlistChain = chainMock({ data: [{ fid: 100 }] });
      const zidChain = chainMock({ data: [{ fid: 100, zid: 1 }] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest(`/api/users/${testFid}/following`), {
        params: Promise.resolve({ fid: testFid }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toHaveProperty('users');
      expect(body).toHaveProperty('next');
      expect(Array.isArray(body.users)).toBe(true);
      expect(body.users[0]).toHaveProperty('isZaoMember');
      expect(body.users[0]).toHaveProperty('zid');
    });

    it('includes all original user properties in enriched response', async () => {
      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest(`/api/users/${testFid}/following`), {
        params: Promise.resolve({ fid: testFid }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      const user = body.users[0];
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('display_name');
      expect(user).toHaveProperty('follower_count');
      expect(user).toHaveProperty('viewer_context');
    });
  });

  describe('edge cases', () => {
    it('handles empty following list', async () => {
      mockGetFollowing.mockResolvedValueOnce({
        users: [],
        next: null,
      });

      const res = await GET(makeGetRequest(`/api/users/${testFid}/following`), {
        params: Promise.resolve({ fid: testFid }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.users).toEqual([]);
      expect(body.next).toBeNull();
    });

    it('handles undefined viewer_context gracefully', async () => {
      mockGetFollowing.mockResolvedValueOnce({
        users: [{ user: { fid: 999, username: 'nocontext' } }],
        next: null,
      });

      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest(`/api/users/${testFid}/following`), {
        params: Promise.resolve({ fid: testFid }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.users[0]).toHaveProperty('fid', 999);
    });

    it('handles FID 0 as valid', async () => {
      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest(`/api/users/0/following`), {
        params: Promise.resolve({ fid: '0' }),
      });

      expect(res.status).toBe(200);
      // FID 0 parses to valid int 0
      expect(mockGetFollowing).toHaveBeenCalledWith(0, 123, 'desc_chron', undefined, 100);
    });

    it('passes session fid to getFollowing as viewerFid', async () => {
      const sessionWithDifferentFid = mockAuthenticatedSession({ fid: 999 });
      mockGetSessionData.mockResolvedValueOnce(sessionWithDifferentFid);

      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest(`/api/users/${testFid}/following`), {
        params: Promise.resolve({ fid: testFid }),
      });

      expect(res.status).toBe(200);
      // Session fid (999) is passed as viewerFid
      expect(mockGetFollowing).toHaveBeenCalledWith(456, 999, 'desc_chron', undefined, 100);
    });
  });
});
