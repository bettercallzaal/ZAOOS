import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chainMock, makeRequest, mockAuthenticatedSession } from '@/test-utils/api-helpers';

const { mockGetSessionData, mockFrom, mockGetUserByFid } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
  mockGetUserByFid: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/farcaster/neynar', () => ({
  getUserByFid: (fid: number, viewerFid?: number) => mockGetUserByFid(fid, viewerFid),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from '../route';

describe('GET /api/users/[fid]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('returns 401 when no session exists', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await GET(makeRequest('/api/users/123'), {
        params: Promise.resolve({ fid: '123' }),
      });
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockGetUserByFid).not.toHaveBeenCalled();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('proceeds when session exists', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));
      mockGetUserByFid.mockResolvedValue({
        fid: 123,
        username: 'testuser',
        display_name: 'Test User',
        pfp_url: 'https://example.com/pfp.jpg',
        follower_count: 100,
        following_count: 50,
        power_badge: false,
        custody_address: '0xabc123',
        verified_addresses: { eth_addresses: ['0xabc123'] },
        viewer_context: null,
        profile: { bio: { text: 'Test bio' } },
      });

      const allowlistChain = chainMock({ data: null });
      const usersChain = chainMock({
        data: {
          zid: 'zid123',
          primary_wallet: '0xdef456',
          respect_wallet: '0xghi789',
          bio: 'Test bio',
          display_name: 'Test User',
          username: 'testuser',
          pfp_url: 'https://example.com/pfp.jpg',
          hidden_wallets: [],
        },
      });
      const activityChain = chainMock({ data: [] });

      mockFrom
        .mockReturnValueOnce(allowlistChain.chain)
        .mockReturnValueOnce(usersChain.chain)
        .mockReturnValueOnce(activityChain.chain);

      const res = await GET(makeRequest('/api/users/123'), {
        params: Promise.resolve({ fid: '123' }),
      });

      expect(res.status).toBe(200);
      expect(mockGetUserByFid).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
    });
  });

  describe('FID validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));
    });

    it('returns 400 when fid is not a valid integer', async () => {
      const res = await GET(makeRequest('/api/users/abc'), {
        params: Promise.resolve({ fid: 'abc' }),
      });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid FID');
      expect(mockGetUserByFid).not.toHaveBeenCalled();
    });

    it('coerces a float string to integer and proceeds', async () => {
      // parseInt('123.45', 10) = 123, so it passes validation
      mockGetUserByFid.mockResolvedValue({
        fid: 123,
        username: 'float_test',
        display_name: 'Float Test',
        pfp_url: null,
        follower_count: 0,
        following_count: 0,
        power_badge: false,
        custody_address: null,
        verified_addresses: { eth_addresses: [] },
        viewer_context: null,
        profile: { bio: { text: null } },
      });

      const allowlistChain = chainMock({ data: null });
      const usersChain = chainMock({ data: null });
      const activityChain = chainMock({ data: [] });

      mockFrom
        .mockReturnValueOnce(allowlistChain.chain)
        .mockReturnValueOnce(usersChain.chain)
        .mockReturnValueOnce(activityChain.chain);

      const res = await GET(makeRequest('/api/users/123.45'), {
        params: Promise.resolve({ fid: '123.45' }),
      });

      expect(res.status).toBe(200);
      expect(mockGetUserByFid).toHaveBeenCalledWith(123, 456);
    });

    it('coerces a numeric string fid to integer', async () => {
      mockGetUserByFid.mockResolvedValue({
        fid: 789,
        username: 'user789',
        display_name: 'User 789',
        pfp_url: 'https://example.com/pfp.jpg',
        follower_count: 50,
        following_count: 25,
        power_badge: false,
        custody_address: null,
        verified_addresses: { eth_addresses: [] },
        viewer_context: null,
        profile: { bio: { text: 'Bio' } },
      });

      const allowlistChain = chainMock({ data: null });
      const usersChain = chainMock({
        data: {
          zid: null,
          primary_wallet: null,
          respect_wallet: null,
          bio: 'Bio',
          display_name: 'User 789',
          username: 'user789',
          pfp_url: 'https://example.com/pfp.jpg',
          hidden_wallets: [],
        },
      });
      const activityChain = chainMock({ data: [] });

      mockFrom
        .mockReturnValueOnce(allowlistChain.chain)
        .mockReturnValueOnce(usersChain.chain)
        .mockReturnValueOnce(activityChain.chain);

      const res = await GET(makeRequest('/api/users/789'), {
        params: Promise.resolve({ fid: '789' }),
      });

      expect(res.status).toBe(200);
      expect(mockGetUserByFid).toHaveBeenCalledWith(789, 456);
    });
  });

  describe('neynar lookup', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));
    });

    it('returns 404 when user is not found on neynar', async () => {
      mockGetUserByFid.mockResolvedValue(null);

      // The Promise.all is still called, but the check for !user happens before
      // supabase queries complete. However, mockGetUserByFid is part of Promise.all,
      // so we need to ensure supabase doesn't error. Actually wait - looking at the route,
      // Promise.all happens first, THEN we check !user. So we do need to mock the chains.
      const allowlistChain = chainMock({ data: null });
      const usersChain = chainMock({ data: null });
      const activityChain = chainMock({ data: [] });

      mockFrom
        .mockReturnValueOnce(allowlistChain.chain)
        .mockReturnValueOnce(usersChain.chain)
        .mockReturnValueOnce(activityChain.chain);

      const res = await GET(makeRequest('/api/users/999'), {
        params: Promise.resolve({ fid: '999' }),
      });
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toBe('User not found');
    });

    it('calls neynar with viewerFid from session', async () => {
      const sessionFid = 999;
      const targetFid = 123;

      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: sessionFid }));
      mockGetUserByFid.mockResolvedValue({
        fid: targetFid,
        username: 'target',
        display_name: 'Target',
        pfp_url: null,
        follower_count: 0,
        following_count: 0,
        power_badge: false,
        custody_address: null,
        verified_addresses: { eth_addresses: [] },
        viewer_context: null,
        profile: { bio: { text: null } },
      });

      const allowlistChain = chainMock({ data: null });
      const usersChain = chainMock({ data: null });
      const activityChain = chainMock({ data: [] });

      mockFrom
        .mockReturnValueOnce(allowlistChain.chain)
        .mockReturnValueOnce(usersChain.chain)
        .mockReturnValueOnce(activityChain.chain);

      await GET(makeRequest(`/api/users/${targetFid}`), {
        params: Promise.resolve({ fid: String(targetFid) }),
      });

      expect(mockGetUserByFid).toHaveBeenCalledWith(targetFid, sessionFid);
    });
  });

  describe('successful response', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns complete user profile with all fields', async () => {
      mockGetUserByFid.mockResolvedValue({
        fid: 456,
        username: 'johndoe',
        display_name: 'John Doe',
        pfp_url: 'https://example.com/john.jpg',
        follower_count: 500,
        following_count: 200,
        power_badge: true,
        custody_address: '0xaaaa',
        verified_addresses: { eth_addresses: ['0xaaaa', '0xbbbb'] },
        viewer_context: { following: true },
        profile: { bio: { text: 'I am John' } },
      });

      const allowlistChain = chainMock({
        data: { fid: 456, real_name: 'John D', ign: 'johndoe' },
      });
      const usersChain = chainMock({
        data: {
          zid: 'zid456',
          primary_wallet: '0xcccc',
          respect_wallet: '0xdddd',
          bio: 'I am John',
          display_name: 'John Doe',
          username: 'johndoe',
          pfp_url: 'https://example.com/john.jpg',
          hidden_wallets: ['custody_address'],
        },
      });
      const activityChain = chainMock({ data: [] });

      mockFrom
        .mockReturnValueOnce(allowlistChain.chain)
        .mockReturnValueOnce(usersChain.chain)
        .mockReturnValueOnce(activityChain.chain);

      const res = await GET(makeRequest('/api/users/456'), {
        params: Promise.resolve({ fid: '456' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.fid).toBe(456);
      expect(body.username).toBe('johndoe');
      expect(body.display_name).toBe('John Doe');
      expect(body.displayName).toBe('John Doe');
      expect(body.followerCount).toBe(500);
      expect(body.followingCount).toBe(200);
      expect(body.powerBadge).toBe(true);
      expect(body.zid).toBe('zid456');
      expect(body.isZaoMember).toBe(true);
      expect(body.zaoName).toBe('John D');
      expect(body.activity.casts).toBe(0);
      expect(body.activity.likes).toBe(0);
      expect(body.activity.recasts).toBe(0);
      expect(body.activity.replies).toBe(0);
    });

    it('hides wallet addresses when user has them in hidden_wallets', async () => {
      mockGetUserByFid.mockResolvedValue({
        fid: 789,
        username: 'private',
        display_name: 'Private User',
        pfp_url: null,
        follower_count: 10,
        following_count: 5,
        power_badge: false,
        custody_address: '0xhidden',
        verified_addresses: { eth_addresses: ['0xhidden'] },
        viewer_context: null,
        profile: { bio: { text: null } },
      });

      const allowlistChain = chainMock({ data: null });
      const usersChain = chainMock({
        data: {
          zid: null,
          primary_wallet: null,
          respect_wallet: null,
          bio: null,
          display_name: 'Private User',
          username: 'private',
          pfp_url: null,
          hidden_wallets: ['custody_address', 'verified_addresses'],
        },
      });
      const activityChain = chainMock({ data: [] });

      mockFrom
        .mockReturnValueOnce(allowlistChain.chain)
        .mockReturnValueOnce(usersChain.chain)
        .mockReturnValueOnce(activityChain.chain);

      const res = await GET(makeRequest('/api/users/789'), {
        params: Promise.resolve({ fid: '789' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.custody_address).toBeNull();
      expect(body.verified_addresses.eth_addresses).toEqual([]);
      expect(body.verifiedAddresses).toEqual([]);
    });

    it('shows wallet addresses to profile owner even if hidden', async () => {
      const ownerFid = 111;
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: ownerFid }));
      mockGetUserByFid.mockResolvedValue({
        fid: ownerFid,
        username: 'owner',
        display_name: 'Owner',
        pfp_url: null,
        follower_count: 1,
        following_count: 0,
        power_badge: false,
        custody_address: '0xowner',
        verified_addresses: { eth_addresses: ['0xowner'] },
        viewer_context: null,
        profile: { bio: { text: null } },
      });

      const allowlistChain = chainMock({ data: null });
      const usersChain = chainMock({
        data: {
          zid: null,
          primary_wallet: null,
          respect_wallet: null,
          bio: null,
          display_name: 'Owner',
          username: 'owner',
          pfp_url: null,
          hidden_wallets: ['custody_address', 'verified_addresses'],
        },
      });
      const activityChain = chainMock({ data: [] });

      mockFrom
        .mockReturnValueOnce(allowlistChain.chain)
        .mockReturnValueOnce(usersChain.chain)
        .mockReturnValueOnce(activityChain.chain);

      const res = await GET(makeRequest(`/api/users/${ownerFid}`), {
        params: Promise.resolve({ fid: String(ownerFid) }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.custody_address).toBe('0xowner');
      expect(body.verified_addresses.eth_addresses).toEqual(['0xowner']);
    });
  });

  describe('activity tallying', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('tallies engagement metrics from channel_casts', async () => {
      mockGetUserByFid.mockResolvedValue({
        fid: 222,
        username: 'active',
        display_name: 'Active User',
        pfp_url: null,
        follower_count: 0,
        following_count: 0,
        power_badge: false,
        custody_address: null,
        verified_addresses: { eth_addresses: [] },
        viewer_context: null,
        profile: { bio: { text: null } },
      });

      const allowlistChain = chainMock({ data: null });
      const usersChain = chainMock({ data: null });
      const activityChain = chainMock({
        data: [
          {
            reactions: { likes_count: 10, recasts_count: 5 },
            replies_count: 2,
          },
          {
            reactions: { likes_count: 8, recasts_count: 3 },
            replies_count: 1,
          },
          {
            reactions: null,
            replies_count: 0,
          },
        ],
      });

      mockFrom
        .mockReturnValueOnce(allowlistChain.chain)
        .mockReturnValueOnce(usersChain.chain)
        .mockReturnValueOnce(activityChain.chain);

      const res = await GET(makeRequest('/api/users/222'), {
        params: Promise.resolve({ fid: '222' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.activity.casts).toBe(3);
      expect(body.activity.likes).toBe(18);
      expect(body.activity.recasts).toBe(8);
      expect(body.activity.replies).toBe(3);
    });

    it('handles missing reaction data', async () => {
      mockGetUserByFid.mockResolvedValue({
        fid: 333,
        username: 'quiet',
        display_name: 'Quiet User',
        pfp_url: null,
        follower_count: 0,
        following_count: 0,
        power_badge: false,
        custody_address: null,
        verified_addresses: { eth_addresses: [] },
        viewer_context: null,
        profile: { bio: { text: null } },
      });

      const allowlistChain = chainMock({ data: null });
      const usersChain = chainMock({ data: null });
      const activityChain = chainMock({
        data: [
          { reactions: undefined, replies_count: 0 },
          { reactions: {}, replies_count: 1 },
        ],
      });

      mockFrom
        .mockReturnValueOnce(allowlistChain.chain)
        .mockReturnValueOnce(usersChain.chain)
        .mockReturnValueOnce(activityChain.chain);

      const res = await GET(makeRequest('/api/users/333'), {
        params: Promise.resolve({ fid: '333' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.activity.casts).toBe(2);
      expect(body.activity.likes).toBe(0);
      expect(body.activity.recasts).toBe(0);
      expect(body.activity.replies).toBe(1);
    });

    it('returns zero activity when no casts found', async () => {
      mockGetUserByFid.mockResolvedValue({
        fid: 444,
        username: 'silent',
        display_name: 'Silent User',
        pfp_url: null,
        follower_count: 0,
        following_count: 0,
        power_badge: false,
        custody_address: null,
        verified_addresses: { eth_addresses: [] },
        viewer_context: null,
        profile: { bio: { text: null } },
      });

      const allowlistChain = chainMock({ data: null });
      const usersChain = chainMock({ data: null });
      const activityChain = chainMock({ data: [] });

      mockFrom
        .mockReturnValueOnce(allowlistChain.chain)
        .mockReturnValueOnce(usersChain.chain)
        .mockReturnValueOnce(activityChain.chain);

      const res = await GET(makeRequest('/api/users/444'), {
        params: Promise.resolve({ fid: '444' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.activity).toEqual({
        casts: 0,
        likes: 0,
        recasts: 0,
        replies: 0,
      });
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 500 when neynar lookup throws', async () => {
      mockGetUserByFid.mockRejectedValue(new Error('Neynar API error'));

      const res = await GET(makeRequest('/api/users/555'), {
        params: Promise.resolve({ fid: '555' }),
      });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch user');
    });

    it('returns 500 when supabase lookup throws', async () => {
      mockGetUserByFid.mockResolvedValue({
        fid: 666,
        username: 'test',
        display_name: 'Test',
        pfp_url: null,
        follower_count: 0,
        following_count: 0,
        power_badge: false,
        custody_address: null,
        verified_addresses: { eth_addresses: [] },
        viewer_context: null,
        profile: { bio: { text: null } },
      });

      mockFrom.mockImplementationOnce(() => {
        throw new Error('Database connection error');
      });

      const res = await GET(makeRequest('/api/users/666'), {
        params: Promise.resolve({ fid: '666' }),
      });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch user');
    });

    it('returns 500 when activity query throws', async () => {
      mockGetUserByFid.mockResolvedValue({
        fid: 777,
        username: 'test',
        display_name: 'Test',
        pfp_url: null,
        follower_count: 0,
        following_count: 0,
        power_badge: false,
        custody_address: null,
        verified_addresses: { eth_addresses: [] },
        viewer_context: null,
        profile: { bio: { text: null } },
      });

      const allowlistChain = chainMock({ data: null });
      const usersChain = chainMock({ data: null });

      mockFrom
        .mockReturnValueOnce(allowlistChain.chain)
        .mockReturnValueOnce(usersChain.chain)
        .mockImplementationOnce(() => {
          throw new Error('Query timeout');
        });

      const res = await GET(makeRequest('/api/users/777'), {
        params: Promise.resolve({ fid: '777' }),
      });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch user');
    });
  });

  describe('dynamic route parameters', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('reads fid from params promise', async () => {
      const targetFid = 888;
      mockGetUserByFid.mockResolvedValue({
        fid: targetFid,
        username: 'testuser',
        display_name: 'Test User',
        pfp_url: null,
        follower_count: 0,
        following_count: 0,
        power_badge: false,
        custody_address: null,
        verified_addresses: { eth_addresses: [] },
        viewer_context: null,
        profile: { bio: { text: null } },
      });

      const allowlistChain = chainMock({ data: null });
      const usersChain = chainMock({ data: null });
      const activityChain = chainMock({ data: [] });

      mockFrom
        .mockReturnValueOnce(allowlistChain.chain)
        .mockReturnValueOnce(usersChain.chain)
        .mockReturnValueOnce(activityChain.chain);

      const res = await GET(makeRequest(`/api/users/${targetFid}`), {
        params: Promise.resolve({ fid: String(targetFid) }),
      });

      expect(res.status).toBe(200);
      expect(mockGetUserByFid).toHaveBeenCalledWith(targetFid, 123);
    });
  });

  describe('supabase query chain', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
      mockGetUserByFid.mockResolvedValue({
        fid: 999,
        username: 'chaintest',
        display_name: 'Chain Test',
        pfp_url: null,
        follower_count: 0,
        following_count: 0,
        power_badge: false,
        custody_address: null,
        verified_addresses: { eth_addresses: [] },
        viewer_context: null,
        profile: { bio: { text: null } },
      });
    });

    it('queries allowlist with correct filters', async () => {
      const allowlistChain = chainMock({ data: null });
      const usersChain = chainMock({ data: null });
      const activityChain = chainMock({ data: [] });

      mockFrom
        .mockReturnValueOnce(allowlistChain.chain)
        .mockReturnValueOnce(usersChain.chain)
        .mockReturnValueOnce(activityChain.chain);

      await GET(makeRequest('/api/users/999'), {
        params: Promise.resolve({ fid: '999' }),
      });

      expect(allowlistChain.chain.select).toHaveBeenCalledWith('fid, real_name, ign');
      expect(allowlistChain.chain.eq).toHaveBeenNthCalledWith(1, 'fid', 999);
      expect(allowlistChain.chain.eq).toHaveBeenNthCalledWith(2, 'is_active', true);
      expect(allowlistChain.chain.maybeSingle).toHaveBeenCalled();
    });

    it('queries users table with correct columns and filters', async () => {
      const allowlistChain = chainMock({ data: null });
      const usersChain = chainMock({ data: null });
      const activityChain = chainMock({ data: [] });

      mockFrom
        .mockReturnValueOnce(allowlistChain.chain)
        .mockReturnValueOnce(usersChain.chain)
        .mockReturnValueOnce(activityChain.chain);

      await GET(makeRequest('/api/users/999'), {
        params: Promise.resolve({ fid: '999' }),
      });

      expect(usersChain.chain.select).toHaveBeenCalledWith(
        'zid, primary_wallet, respect_wallet, bio, display_name, username, pfp_url, hidden_wallets',
      );
      expect(usersChain.chain.eq).toHaveBeenNthCalledWith(1, 'fid', 999);
      expect(usersChain.chain.eq).toHaveBeenNthCalledWith(2, 'is_active', true);
      expect(usersChain.chain.maybeSingle).toHaveBeenCalled();
    });

    it('queries channel_casts with correct filters and order', async () => {
      const allowlistChain = chainMock({ data: null });
      const usersChain = chainMock({ data: null });
      const activityChain = chainMock({ data: [] });

      mockFrom
        .mockReturnValueOnce(allowlistChain.chain)
        .mockReturnValueOnce(usersChain.chain)
        .mockReturnValueOnce(activityChain.chain);

      await GET(makeRequest('/api/users/999'), {
        params: Promise.resolve({ fid: '999' }),
      });

      expect(activityChain.chain.select).toHaveBeenCalledWith('reactions, replies_count');
      expect(activityChain.chain.eq).toHaveBeenCalledWith('fid', 999);
      expect(activityChain.chain.order).toHaveBeenCalledWith('timestamp', { ascending: false });
      expect(activityChain.chain.limit).toHaveBeenCalledWith(200);
    });
  });

  describe('response field mapping', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('includes both camelCase and snake_case versions of fields', async () => {
      mockGetUserByFid.mockResolvedValue({
        fid: 555,
        username: 'alias',
        display_name: 'User Alias',
        pfp_url: 'https://example.com/pic.jpg',
        follower_count: 100,
        following_count: 50,
        power_badge: true,
        custody_address: '0xaddr',
        verified_addresses: { eth_addresses: ['0xaddr'] },
        viewer_context: null,
        profile: { bio: { text: 'Bio text' } },
      });

      const allowlistChain = chainMock({ data: null });
      const usersChain = chainMock({
        data: {
          zid: 'test-zid',
          primary_wallet: null,
          respect_wallet: null,
          bio: 'Bio text',
          display_name: 'User Alias',
          username: 'alias',
          pfp_url: 'https://example.com/pic.jpg',
          hidden_wallets: [],
        },
      });
      const activityChain = chainMock({ data: [] });

      mockFrom
        .mockReturnValueOnce(allowlistChain.chain)
        .mockReturnValueOnce(usersChain.chain)
        .mockReturnValueOnce(activityChain.chain);

      const res = await GET(makeRequest('/api/users/555'), {
        params: Promise.resolve({ fid: '555' }),
      });
      const body = await res.json();

      expect(body.display_name).toBe('User Alias');
      expect(body.displayName).toBe('User Alias');
      expect(body.pfp_url).toBe('https://example.com/pic.jpg');
      expect(body.pfpUrl).toBe('https://example.com/pic.jpg');
      expect(body.verified_addresses).toBeDefined();
      expect(body.verifiedAddresses).toBeDefined();
    });

    it('omits hidden_wallets from user object in response', async () => {
      mockGetUserByFid.mockResolvedValue({
        fid: 666,
        username: 'user',
        display_name: 'User',
        pfp_url: null,
        follower_count: 0,
        following_count: 0,
        power_badge: false,
        custody_address: null,
        verified_addresses: { eth_addresses: [] },
        viewer_context: null,
        profile: { bio: { text: null } },
      });

      const allowlistChain = chainMock({ data: null });
      const usersChain = chainMock({
        data: {
          zid: null,
          primary_wallet: null,
          respect_wallet: null,
          bio: null,
          display_name: 'User',
          username: 'user',
          pfp_url: null,
          hidden_wallets: ['verified_addresses', 'custody_address'],
        },
      });
      const activityChain = chainMock({ data: [] });

      mockFrom
        .mockReturnValueOnce(allowlistChain.chain)
        .mockReturnValueOnce(usersChain.chain)
        .mockReturnValueOnce(activityChain.chain);

      const res = await GET(makeRequest('/api/users/666'), {
        params: Promise.resolve({ fid: '666' }),
      });
      const body = await res.json();

      expect(body.user).toBeDefined();
      expect(body.user.hidden_wallets).toBeUndefined();
    });
  });
});
