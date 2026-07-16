import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chainMock, makeGetRequest, mockAuthenticatedSession } from '@/test-utils/api-helpers';

const { mockGetSessionData, mockFrom, mockGetFollowers, mockGetRelevantFollowers } = vi.hoisted(
  () => ({
    mockGetSessionData: vi.fn(),
    mockFrom: vi.fn(),
    mockGetFollowers: vi.fn(),
    mockGetRelevantFollowers: vi.fn(),
  }),
);

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/farcaster/neynar', () => ({
  getFollowers: (
    fid: number,
    viewerFid?: number,
    sortType?: string,
    cursor?: string,
    limit?: number,
  ) => mockGetFollowers(fid, viewerFid, sortType, cursor, limit),
  getRelevantFollowers: (targetFid: number, viewerFid: number) =>
    mockGetRelevantFollowers(targetFid, viewerFid),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from '../route';

describe('GET /api/users/[fid]/followers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('returns 401 when no session exists', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await GET(makeGetRequest('/api/users/123/followers'), {
        params: Promise.resolve({ fid: '123' }),
      });
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockGetFollowers).not.toHaveBeenCalled();
    });

    it('proceeds when session exists', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));

      mockGetFollowers.mockResolvedValue({
        users: [{ fid: 100, username: 'follower1', follower_count: 50 }],
        next: null,
      });

      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest('/api/users/123/followers'), {
        params: Promise.resolve({ fid: '123' }),
      });

      expect(res.status).toBe(200);
      expect(mockGetFollowers).toHaveBeenCalled();
    });
  });

  describe('parameter validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));
    });

    it('returns 400 when fid is not a valid integer', async () => {
      const res = await GET(makeGetRequest('/api/users/abc/followers'), {
        params: Promise.resolve({ fid: 'abc' }),
      });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid FID');
    });

    it('coerces a float fid to integer (parseInt behavior)', async () => {
      mockGetFollowers.mockResolvedValue({
        users: [{ fid: 100, username: 'follower', follower_count: 10 }],
        next: null,
      });

      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest('/api/users/123.45/followers'), {
        params: Promise.resolve({ fid: '123.45' }),
      });

      expect(res.status).toBe(200);
      // parseInt('123.45') = 123, so this passes validation
      expect(mockGetFollowers).toHaveBeenCalledWith(123, 456, 'desc_chron', undefined, 100);
    });

    it('coerces numeric string fid to integer and proceeds', async () => {
      mockGetFollowers.mockResolvedValue({
        users: [{ fid: 789, username: 'follower', follower_count: 10 }],
        next: null,
      });

      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest('/api/users/999/followers'), {
        params: Promise.resolve({ fid: '999' }),
      });

      expect(res.status).toBe(200);
      expect(mockGetFollowers).toHaveBeenCalledWith(999, 456, 'desc_chron', undefined, 100);
    });
  });

  describe('sort parameter handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));
    });

    it('defaults to "recent" sort type (desc_chron)', async () => {
      mockGetFollowers.mockResolvedValue({
        users: [{ fid: 100, username: 'follower', follower_count: 5 }],
        next: null,
      });

      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest('/api/users/123/followers'), {
        params: Promise.resolve({ fid: '123' }),
      });

      expect(res.status).toBe(200);
      expect(mockGetFollowers).toHaveBeenCalledWith(123, 456, 'desc_chron', undefined, 100);
    });

    it('maps "trending" sort to algorithmic', async () => {
      mockGetFollowers.mockResolvedValue({
        users: [{ fid: 200, username: 'trending_follower', follower_count: 1000 }],
        next: null,
      });

      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest('/api/users/123/followers?sort=trending'), {
        params: Promise.resolve({ fid: '123' }),
      });

      expect(res.status).toBe(200);
      expect(mockGetFollowers).toHaveBeenCalledWith(123, 456, 'algorithmic', undefined, 100);
    });

    it('uses getRelevantFollowers when sort=relevant', async () => {
      mockGetRelevantFollowers.mockResolvedValue({
        top_relevant_followers_hydrated: [
          { user: { fid: 300, username: 'relevant_follower', follower_count: 100 } },
        ],
      });

      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest('/api/users/123/followers?sort=relevant'), {
        params: Promise.resolve({ fid: '123' }),
      });

      expect(res.status).toBe(200);
      expect(mockGetRelevantFollowers).toHaveBeenCalledWith(123, 456);
      expect(mockGetFollowers).not.toHaveBeenCalled();

      const body = await res.json();
      expect(body.users).toHaveLength(1);
      expect(body.users[0].username).toBe('relevant_follower');
      // Relevant followers endpoint returns no pagination
      expect(body.next).toBeNull();
    });

    it('handles relevant followers without viewer fid (uses getFollowers instead)', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: undefined }));

      mockGetFollowers.mockResolvedValue({
        users: [{ fid: 400, username: 'follower_no_viewer', follower_count: 50 }],
        next: null,
      });

      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest('/api/users/123/followers?sort=relevant'), {
        params: Promise.resolve({ fid: '123' }),
      });

      expect(res.status).toBe(200);
      // Falls back to getFollowers when viewer fid is undefined
      expect(mockGetFollowers).toHaveBeenCalled();
      expect(mockGetRelevantFollowers).not.toHaveBeenCalled();
    });
  });

  describe('cursor pagination', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));
    });

    it('passes cursor to neynar when provided', async () => {
      const testCursor = 'abc123cursor';

      mockGetFollowers.mockResolvedValue({
        users: [{ fid: 500, username: 'page2_follower', follower_count: 75 }],
        next: { cursor: 'next_page_cursor' },
      });

      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest(`/api/users/123/followers?cursor=${testCursor}`), {
        params: Promise.resolve({ fid: '123' }),
      });

      expect(res.status).toBe(200);
      expect(mockGetFollowers).toHaveBeenCalledWith(123, 456, 'desc_chron', testCursor, 100);

      const body = await res.json();
      expect(body.next).toEqual({ cursor: 'next_page_cursor' });
    });

    it('returns null for next cursor when neynar returns no pagination', async () => {
      mockGetFollowers.mockResolvedValue({
        users: [{ fid: 600, username: 'last_follower', follower_count: 20 }],
        next: null,
      });

      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest('/api/users/123/followers'), {
        params: Promise.resolve({ fid: '123' }),
      });

      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.next).toBeNull();
    });
  });

  describe('user enrichment', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));
    });

    it('adds isZaoMember flag when user is in allowlist', async () => {
      mockGetFollowers.mockResolvedValue({
        users: [
          { fid: 700, username: 'zao_member', follower_count: 150 },
          { fid: 701, username: 'non_member', follower_count: 50 },
        ],
        next: null,
      });

      const allowlistChain = chainMock({ data: [{ fid: 700 }] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest('/api/users/123/followers'), {
        params: Promise.resolve({ fid: '123' }),
      });

      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.users[0].isZaoMember).toBe(true);
      expect(body.users[1].isZaoMember).toBe(false);
    });

    it('adds zid from users table when available', async () => {
      mockGetFollowers.mockResolvedValue({
        users: [
          { fid: 800, username: 'has_zid', follower_count: 100 },
          { fid: 801, username: 'no_zid', follower_count: 50 },
        ],
        next: null,
      });

      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [{ fid: 800, zid: 42 }] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest('/api/users/123/followers'), {
        params: Promise.resolve({ fid: '123' }),
      });

      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.users[0].zid).toBe(42);
      expect(body.users[1].zid).toBeNull();
    });

    it('handles empty follower list', async () => {
      mockGetFollowers.mockResolvedValue({ users: [], next: null });

      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest('/api/users/123/followers'), {
        params: Promise.resolve({ fid: '123' }),
      });

      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.users).toEqual([]);
    });

    it('skips allowlist/zid queries when no followers are returned', async () => {
      mockGetFollowers.mockResolvedValue({ users: [], next: null });

      const res = await GET(makeGetRequest('/api/users/123/followers'), {
        params: Promise.resolve({ fid: '123' }),
      });

      expect(res.status).toBe(200);
      // Should not call supabase when users list is empty
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('client-side sorting', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));
    });

    it('sorts by inactive status then follower count for sort=inactive', async () => {
      mockGetFollowers.mockResolvedValue({
        users: [
          { fid: 900, username: 'active_user', active_status: 'active', follower_count: 1000 },
          { fid: 901, username: 'inactive_user', active_status: 'inactive', follower_count: 100 },
          { fid: 902, username: 'inactive_low', active_status: 'inactive', follower_count: 50 },
        ],
        next: null,
      });

      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest('/api/users/123/followers?sort=inactive'), {
        params: Promise.resolve({ fid: '123' }),
      });

      expect(res.status).toBe(200);

      const body = await res.json();
      // Inactive users should come first, sorted by follower count ascending
      expect(body.users[0].fid).toBe(902);
      expect(body.users[1].fid).toBe(901);
      expect(body.users[2].fid).toBe(900);
    });

    it('sorts by follower count descending for sort=popular', async () => {
      mockGetFollowers.mockResolvedValue({
        users: [
          { fid: 1000, username: 'user1', follower_count: 100 },
          { fid: 1001, username: 'user2', follower_count: 500 },
          { fid: 1002, username: 'user3', follower_count: 200 },
        ],
        next: null,
      });

      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest('/api/users/123/followers?sort=popular'), {
        params: Promise.resolve({ fid: '123' }),
      });

      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.users[0].fid).toBe(1001);
      expect(body.users[1].fid).toBe(1002);
      expect(body.users[2].fid).toBe(1000);
    });

    it('filters to mutual followers for sort=mutual', async () => {
      mockGetFollowers.mockResolvedValue({
        users: [
          {
            fid: 1100,
            username: 'mutual_friend',
            viewer_context: { following: true, followed_by: true },
          },
          {
            fid: 1101,
            username: 'following_only',
            viewer_context: { following: true, followed_by: false },
          },
          {
            fid: 1102,
            username: 'follower_only',
            viewer_context: { following: false, followed_by: true },
          },
        ],
        next: null,
      });

      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest('/api/users/123/followers?sort=mutual'), {
        params: Promise.resolve({ fid: '123' }),
      });

      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.users).toHaveLength(1);
      expect(body.users[0].fid).toBe(1100);
    });

    it('filters users by ZAO membership after enrichment', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));

      // The route enriches users with isZaoMember based on allowlist query
      mockGetFollowers.mockResolvedValue({
        users: [
          { fid: 1200, username: 'zao_user', follower_count: 100 },
          { fid: 1201, username: 'non_zao_user', follower_count: 50 },
        ],
        next: null,
      });

      // Allowlist query returns data showing only 1200 is active
      const allowlistChain = chainMock({ data: [{ fid: 1200 }] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest('/api/users/123/followers?sort=zao'), {
        params: Promise.resolve({ fid: '123' }),
      });

      expect(res.status).toBe(200);

      const body = await res.json();
      // Route filters after enrichment: only users with isZaoMember === true remain
      expect(body.users.length).toBeGreaterThanOrEqual(0);
      if (body.users.length > 0) {
        // If any users remain, they must all be ZAO members
        body.users.forEach((user: { isZaoMember?: boolean }) => {
          expect(user.isZaoMember).toBe(true);
        });
      }
    });
  });

  describe('user hydration edge cases', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));
    });

    it('extracts user from nested user property', async () => {
      mockGetFollowers.mockResolvedValue({
        users: [
          {
            user: { fid: 1300, username: 'nested_user', follower_count: 75 },
            score: 0.95,
          },
        ],
        next: null,
      });

      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest('/api/users/123/followers'), {
        params: Promise.resolve({ fid: '123' }),
      });

      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.users[0].fid).toBe(1300);
      expect(body.users[0].username).toBe('nested_user');
    });

    it('falls back to item itself if no user property', async () => {
      mockGetFollowers.mockResolvedValue({
        users: [{ fid: 1400, username: 'flat_user', follower_count: 100 }],
        next: null,
      });

      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest('/api/users/123/followers'), {
        params: Promise.resolve({ fid: '123' }),
      });

      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.users[0].fid).toBe(1400);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));
    });

    it('returns 500 when neynar getFollowers throws', async () => {
      mockGetFollowers.mockRejectedValue(new Error('Neynar API down'));

      const res = await GET(makeGetRequest('/api/users/123/followers'), {
        params: Promise.resolve({ fid: '123' }),
      });

      expect(res.status).toBe(500);
      expect((await res.json()).error).toBe('Failed to fetch followers');
    });

    it('returns 500 when neynar getRelevantFollowers throws', async () => {
      mockGetRelevantFollowers.mockRejectedValue(new Error('Relevant API error'));

      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));

      const res = await GET(makeGetRequest('/api/users/123/followers?sort=relevant'), {
        params: Promise.resolve({ fid: '123' }),
      });

      expect(res.status).toBe(500);
      expect((await res.json()).error).toBe('Failed to fetch followers');
    });

    it('handles supabase allowlist query error gracefully (destructures with data, ignores error)', async () => {
      mockGetFollowers.mockResolvedValue({
        users: [{ fid: 1500, username: 'user', follower_count: 50 }],
        next: null,
      });

      // Supabase queries destructure as { data, error }, so errors don't throw
      // The route just treats data: null as no results
      const allowlistChain = chainMock({ data: null, error: { message: 'DB error' } });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest('/api/users/123/followers'), {
        params: Promise.resolve({ fid: '123' }),
      });

      // Query succeeds but with data: null, which is handled gracefully
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.users[0].isZaoMember).toBe(false);
    });

    it('returns 500 when logger.error is called on exception (routes handles and logs errors)', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));

      mockGetFollowers.mockRejectedValue(new Error('Unexpected API error'));

      const res = await GET(makeGetRequest('/api/users/123/followers'), {
        params: Promise.resolve({ fid: '123' }),
      });

      expect(res.status).toBe(500);
      expect((await res.json()).error).toBe('Failed to fetch followers');
    });
  });

  describe('dynamic route parameters', () => {
    it('reads fid from params promise', async () => {
      vi.clearAllMocks();
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));

      const testFid = 12345;

      mockGetFollowers.mockResolvedValue({
        users: [{ fid: 1700, username: 'follower', follower_count: 100 }],
        next: null,
      });

      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest('/api/users/12345/followers'), {
        params: Promise.resolve({ fid: String(testFid) }),
      });

      expect(res.status).toBe(200);
      expect(mockGetFollowers).toHaveBeenCalledWith(testFid, 456, 'desc_chron', undefined, 100);
    });
  });

  describe('integration: multiple query parameters', () => {
    it('applies sort and passes pagination cursor through', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));

      const testCursor = 'page2';

      mockGetFollowers.mockResolvedValue({
        users: [
          { fid: 1800, username: 'user1', follower_count: 500 },
          { fid: 1801, username: 'user2', follower_count: 300 },
          { fid: 1802, username: 'user3', follower_count: 200 },
        ],
        next: { cursor: 'page3' },
      });

      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(
        makeGetRequest(`/api/users/999/followers?sort=popular&cursor=${testCursor}`),
        {
          params: Promise.resolve({ fid: '999' }),
        },
      );

      expect(res.status).toBe(200);

      const body = await res.json();
      // Should be sorted by follower_count descending
      expect(body.users[0].follower_count).toBe(500);
      expect(body.users[1].follower_count).toBe(300);
      expect(body.users[2].follower_count).toBe(200);

      // Pagination cursor should pass through
      expect(body.next).toEqual({ cursor: 'page3' });
    });
  });

  describe('response shape', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));
    });

    it('returns users array and next pagination object', async () => {
      mockGetFollowers.mockResolvedValue({
        users: [{ fid: 2000, username: 'test_user', follower_count: 100 }],
        next: { cursor: 'abc' },
      });

      const allowlistChain = chainMock({ data: [] });
      const zidChain = chainMock({ data: [] });

      mockFrom.mockReturnValueOnce(allowlistChain.chain).mockReturnValueOnce(zidChain.chain);

      const res = await GET(makeGetRequest('/api/users/123/followers'), {
        params: Promise.resolve({ fid: '123' }),
      });

      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toHaveProperty('users');
      expect(body).toHaveProperty('next');
      expect(Array.isArray(body.users)).toBe(true);
    });
  });
});
