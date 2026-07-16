import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeGetRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/env', () => ({
  ENV: {
    NEYNAR_API_KEY: 'test-neynar-key',
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_NEYNAR_CLIENT_ID: 'test-client-id',
    SUPABASE_SERVICE_ROLE_KEY: 'test-role-key',
    SESSION_SECRET: 'test-secret',
    APP_FID: '1',
    APP_SIGNER_PRIVATE_KEY: '0x0000000000000000000000000000000000000000000000000000000000000001',
  },
}));

import { GET } from '../route';

/**
 * A Supabase query chain that supports select → eq → maybeSingle pattern,
 * or select with count → eq pattern. Resolves when awaited.
 */
function profileChain(result: { data?: unknown; error?: unknown; count?: number }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'eq', 'order', 'limit', 'in', 'not']) {
    chain[m] = vi.fn(() => chain);
  }
  chain.maybeSingle = vi.fn().mockResolvedValue(result);
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('GET /api/members/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    global.fetch = vi.fn();
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET(makeGetRequest('/api/members/profile?fid=456'));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('returns 400 when fid is missing', async () => {
    const res = await GET(makeGetRequest('/api/members/profile'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid FID');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when fid is not a positive integer', async () => {
    const res = await GET(makeGetRequest('/api/members/profile?fid=abc'));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid FID');
  });

  it('returns 400 when fid is zero', async () => {
    const res = await GET(makeGetRequest('/api/members/profile?fid=0'));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid FID');
  });

  it('returns 400 when fid is negative', async () => {
    const res = await GET(makeGetRequest('/api/members/profile?fid=-123'));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid FID');
  });

  it('coerces fid string to number', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ users: [{ fid: 456, username: 'alice', display_name: 'Alice' }] }),
    });

    // All DB queries succeed but empty
    mockFrom.mockReturnValue(profileChain({ data: null, error: null, count: 0 }));

    const res = await GET(makeGetRequest('/api/members/profile?fid=456'));
    expect(res.status).toBe(200);
    expect((await res.json()).fid).toBe(456);
  });

  it('returns 404 when Neynar user is not found', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ users: [] }),
    });

    const res = await GET(makeGetRequest('/api/members/profile?fid=999'));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe('User not found on Farcaster');
  });

  it('returns 404 when Neynar fetch fails', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Not found' }),
    });

    const res = await GET(makeGetRequest('/api/members/profile?fid=999'));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe('User not found on Farcaster');
  });

  it('returns 404 when Neynar fetch throws (Promise.allSettled catches it)', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    const res = await GET(makeGetRequest('/api/members/profile?fid=456'));
    // Promise.allSettled catches the rejection, so neynarRes.status === 'rejected'
    // and neynarUser is null → 404
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe('User not found on Farcaster');
  });

  it('enriches profile with Neynar data on success', async () => {
    const neynarUser = {
      fid: 456,
      username: 'alice',
      display_name: 'Alice Chen',
      pfp_url: 'https://pfp.example.com/alice.jpg',
      follower_count: 100,
      following_count: 50,
      power_badge: true,
      profile: {
        header_img: 'https://banner.example.com/alice.jpg',
        bio: { text: 'crypto dev' },
      },
      verified_addresses: {
        eth_addresses: ['0x1111111111111111111111111111111111111111'],
        sol_addresses: ['soladdress123'],
      },
      viewer_context: { following: true },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ users: [neynarUser] }),
    });

    // Channels fetch
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: [neynarUser] }),
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        channels: [
          {
            channel: {
              id: 'dev',
              name: 'Development',
              image_url: 'https://channel.example.com/dev.jpg',
            },
          },
        ],
      }),
    });

    // All DB queries return empty (no ZAO data)
    mockFrom.mockReturnValue(profileChain({ data: null, error: null, count: 0 }));

    const res = await GET(makeGetRequest('/api/members/profile?fid=456'));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body).toEqual({
      fid: 456,
      username: 'alice',
      displayName: 'Alice Chen',
      pfpUrl: 'https://pfp.example.com/alice.jpg',
      bannerUrl: 'https://banner.example.com/alice.jpg',
      bio: 'crypto dev',
      followerCount: 100,
      followingCount: 50,
      powerBadge: true,
      verifiedAddresses: ['0x1111111111111111111111111111111111111111'],
      solAddresses: ['soladdress123'],
      viewerContext: { following: true },
      isZaoMember: false,
      zaoName: null,
      zid: null,
      blueskyHandle: null,
      activeChannels: [
        { id: 'dev', name: 'Development', imageUrl: 'https://channel.example.com/dev.jpg' },
      ],
      communityStats: { songsSubmitted: 0, proposalsCreated: 0, votesCast: 0 },
    });
  });

  it('includes ZAO-specific data when user is in allowlist', async () => {
    const neynarUser = {
      fid: 456,
      username: 'alice',
      display_name: 'Alice Chen',
      pfp_url: 'https://pfp.example.com/alice.jpg',
      follower_count: 100,
      following_count: 50,
      power_badge: false,
      profile: { bio: { text: 'gm' } },
      verified_addresses: { eth_addresses: [], sol_addresses: [] },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ users: [neynarUser] }),
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: [neynarUser] }),
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ channels: [] }),
    });

    const zaoUser = {
      zid: 'zid_alice',
      primary_wallet: '0xaaaa',
      respect_wallet: '0xbbbb',
      bio: 'ZAO bio',
      display_name: 'Alice',
      username: 'alice_zao',
      pfp_url: 'https://pfp.zao.com/alice.jpg',
      bluesky_handle: 'alice.bsky.social',
    };

    const allowlistRow = {
      fid: 456,
      real_name: 'Alice Chen (ZAO)',
      ign: 'alice_ign',
      wallet_address: '0xcccc',
    };

    // Mock returns in order: users, allowlist, channels, submissions, proposals, votes
    const chains = [
      profileChain({ data: zaoUser, error: null, count: 0 }),
      profileChain({ data: allowlistRow, error: null, count: 0 }),
      profileChain({ data: null, error: null, count: 0 }),
      profileChain({ data: null, error: null, count: 0 }),
      profileChain({ data: null, error: null, count: 0 }),
      profileChain({ data: null, error: null, count: 0 }),
    ];

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      const result = chains[callIndex];
      callIndex = (callIndex + 1) % chains.length;
      return result;
    });

    const res = await GET(makeGetRequest('/api/members/profile?fid=456'));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.isZaoMember).toBe(true);
    expect(body.zaoName).toBe('Alice Chen (ZAO)');
    expect(body.zid).toBe('zid_alice');
    expect(body.blueskyHandle).toBe('alice.bsky.social');
  });

  it('includes community stats with submission, proposal, and vote counts', async () => {
    const neynarUser = {
      fid: 456,
      username: 'alice',
      display_name: 'Alice',
      pfp_url: 'https://pfp.example.com/alice.jpg',
      follower_count: 100,
      following_count: 50,
      power_badge: false,
      profile: { bio: { text: 'dev' } },
      verified_addresses: { eth_addresses: [], sol_addresses: [] },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ users: [neynarUser] }),
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: [neynarUser] }),
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ channels: [] }),
    });

    // Mock return values in order of Supabase queries in the route:
    // 1. users table
    // 2. allowlist table
    // 3. song_submissions (count)
    // 4. proposals (count)
    // 5. proposal_votes (count)
    mockFrom
      .mockReturnValueOnce(profileChain({ data: null, error: null, count: 0 })) // users
      .mockReturnValueOnce(profileChain({ data: null, error: null, count: 0 })) // allowlist
      .mockReturnValueOnce(profileChain({ data: null, error: null, count: 5 })) // submissions
      .mockReturnValueOnce(profileChain({ data: null, error: null, count: 3 })) // proposals
      .mockReturnValueOnce(profileChain({ data: null, error: null, count: 12 })); // votes

    const res = await GET(makeGetRequest('/api/members/profile?fid=456'));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.communityStats).toEqual({
      songsSubmitted: 5,
      proposalsCreated: 3,
      votesCast: 12,
    });
  });

  it('gracefully handles missing Neynar profile data', async () => {
    const neynarUser = {
      fid: 456,
      username: 'alice',
      display_name: 'Alice',
      pfp_url: null,
      follower_count: 0,
      following_count: 0,
      power_badge: false,
      // No profile object
      verified_addresses: undefined,
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ users: [neynarUser] }),
    });

    mockFrom.mockReturnValue(profileChain({ data: null, error: null, count: 0 }));

    const res = await GET(makeGetRequest('/api/members/profile?fid=456'));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.bannerUrl).toBeNull();
    expect(body.bio).toBeNull();
    expect(body.verifiedAddresses).toEqual([]);
    expect(body.solAddresses).toEqual([]);
  });

  it('handles empty channels list from Neynar', async () => {
    const neynarUser = {
      fid: 456,
      username: 'alice',
      display_name: 'Alice',
      pfp_url: 'https://pfp.example.com/alice.jpg',
      follower_count: 100,
      following_count: 50,
      power_badge: false,
      profile: { bio: { text: 'dev' } },
      verified_addresses: { eth_addresses: [], sol_addresses: [] },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ users: [neynarUser] }),
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: [neynarUser] }),
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ channels: [] }),
    });

    mockFrom.mockReturnValue(profileChain({ data: null, error: null, count: 0 }));

    const res = await GET(makeGetRequest('/api/members/profile?fid=456'));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.activeChannels).toEqual([]);
  });

  it('handles channels API failure gracefully', async () => {
    const neynarUser = {
      fid: 456,
      username: 'alice',
      display_name: 'Alice',
      pfp_url: 'https://pfp.example.com/alice.jpg',
      follower_count: 100,
      following_count: 50,
      power_badge: false,
      profile: { bio: { text: 'dev' } },
      verified_addresses: { eth_addresses: [], sol_addresses: [] },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ users: [neynarUser] }),
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: [neynarUser] }),
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Not found' }),
    });

    mockFrom.mockReturnValue(profileChain({ data: null, error: null, count: 0 }));

    const res = await GET(makeGetRequest('/api/members/profile?fid=456'));
    expect(res.status).toBe(200);
    const body = await res.json();

    // Should still succeed with empty channels
    expect(body.activeChannels).toEqual([]);
  });

  it('handles Supabase query errors gracefully', async () => {
    const neynarUser = {
      fid: 456,
      username: 'alice',
      display_name: 'Alice',
      pfp_url: 'https://pfp.example.com/alice.jpg',
      follower_count: 100,
      following_count: 50,
      power_badge: false,
      profile: { bio: { text: 'dev' } },
      verified_addresses: { eth_addresses: [], sol_addresses: [] },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ users: [neynarUser] }),
    });

    // User query fails, but others are mocked to return null/0
    mockFrom.mockReturnValue(profileChain({ data: null, error: new Error('db error'), count: 0 }));

    const res = await GET(makeGetRequest('/api/members/profile?fid=456'));
    expect(res.status).toBe(200);
    const body = await res.json();

    // Should degrade gracefully: no user data, but profile still returns
    expect(body.fid).toBe(456);
    expect(body.zid).toBeNull();
    expect(body.isZaoMember).toBe(false);
    expect(body.communityStats.songsSubmitted).toBe(0);
  });

  it('returns 500 on unexpected error in try/catch', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    const res = await GET(makeGetRequest('/api/members/profile?fid=456'));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to fetch enriched profile');
  });

  it('passes correct Neynar headers with NEYNAR_API_KEY', async () => {
    const neynarUser = {
      fid: 456,
      username: 'alice',
      display_name: 'Alice',
      pfp_url: 'https://pfp.example.com/alice.jpg',
      follower_count: 100,
      following_count: 50,
      power_badge: false,
      profile: { bio: { text: 'dev' } },
      verified_addresses: { eth_addresses: [], sol_addresses: [] },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ users: [neynarUser] }),
    });

    mockFrom.mockReturnValue(profileChain({ data: null, error: null, count: 0 }));

    await GET(makeGetRequest('/api/members/profile?fid=456'));

    expect(global.fetch).toHaveBeenCalled();
    const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    const userBulkCall = calls[0];
    expect(userBulkCall[0]).toContain('api.neynar.com');
    expect(userBulkCall[1]?.headers?.['x-api-key']).toBeDefined();
  });

  it('uses session.fid as viewer_fid in Neynar request', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 789 }));

    const neynarUser = {
      fid: 456,
      username: 'alice',
      display_name: 'Alice',
      pfp_url: 'https://pfp.example.com/alice.jpg',
      follower_count: 100,
      following_count: 50,
      power_badge: false,
      profile: { bio: { text: 'dev' } },
      verified_addresses: { eth_addresses: [], sol_addresses: [] },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ users: [neynarUser] }),
    });

    mockFrom.mockReturnValue(profileChain({ data: null, error: null, count: 0 }));

    await GET(makeGetRequest('/api/members/profile?fid=456'));

    const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    const userBulkCall = calls[0][0];
    expect(userBulkCall).toContain('viewer_fid=789');
  });

  it('passes AbortSignal.timeout to Neynar requests', async () => {
    const neynarUser = {
      fid: 456,
      username: 'alice',
      display_name: 'Alice',
      pfp_url: 'https://pfp.example.com/alice.jpg',
      follower_count: 0,
      following_count: 0,
      power_badge: false,
      profile: { bio: { text: 'dev' } },
      verified_addresses: { eth_addresses: [], sol_addresses: [] },
    };

    let capturedSignal: AbortSignal | undefined;
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (_url: string, opts: RequestInit) => {
        if (opts.signal instanceof AbortSignal) {
          capturedSignal = opts.signal;
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ users: [neynarUser] }),
        });
      },
    );

    mockFrom.mockReturnValue(profileChain({ data: null, error: null, count: 0 }));

    const res = await GET(makeGetRequest('/api/members/profile?fid=456'));
    expect(res.status).toBe(200);
    // Verify that a signal was passed (timeout is an AbortSignal property)
    expect(capturedSignal).toBeDefined();
  });

  it('uses Promise.allSettled to handle parallel failures', async () => {
    const neynarUser = {
      fid: 456,
      username: 'alice',
      display_name: 'Alice',
      pfp_url: 'https://pfp.example.com/alice.jpg',
      follower_count: 100,
      following_count: 50,
      power_badge: false,
      profile: { bio: { text: 'dev' } },
      verified_addresses: { eth_addresses: [], sol_addresses: [] },
    };

    // First call for user bulk, second for channels (simulate one failure)
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: [neynarUser] }),
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Channels API down'),
    );

    mockFrom.mockReturnValue(profileChain({ data: null, error: null, count: 0 }));

    const res = await GET(makeGetRequest('/api/members/profile?fid=456'));

    // Should still succeed (channels failure is non-fatal)
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.activeChannels).toEqual([]);
  });
});
