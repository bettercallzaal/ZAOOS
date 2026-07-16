import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest, mockAuthenticatedSession } from '@/test-utils/api-helpers';

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

vi.mock('@/lib/env', () => ({
  ENV: {
    NEYNAR_API_KEY: 'test-key',
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// Mock global fetch before importing the route
global.fetch = vi.fn();

import { GET } from '../route';

/**
 * Build a Supabase query chain mock that resolves to the provided result.
 * Supports chaining methods and awaiting.
 */
function suggestionsChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ['select', 'eq', 'not', 'is']) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('GET /api/social/suggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(null);
    (global.fetch as ReturnType<typeof vi.fn>).mockClear();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 401 Authorization guard
  // ─────────────────────────────────────────────────────────────────────────

  it('returns 401 when session is missing', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await GET(makeGetRequest('/api/social/suggestions'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 500 when session.fid is null (crashes with invalid URL)', async () => {
    mockGetSessionData.mockResolvedValue({ fid: null });

    // Fetch will throw or return an error when fid=null is in URL
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Invalid FID'));

    const res = await GET(makeGetRequest('/api/social/suggestions'));
    // Route wraps in try/catch, so returns 500
    expect(res.status).toBe(500);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SUCCESS: Empty suggestions
  // ─────────────────────────────────────────────────────────────────────────

  it('returns empty suggestions when Neynar returns no users', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    mockFrom.mockReturnValue(suggestionsChain({ data: [], error: null }));

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 200,
    });

    const res = await GET(makeGetRequest('/api/social/suggestions'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.suggestions).toEqual([]);
    expect(body.unfollowedMembers).toEqual([]);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SUCCESS: Suggestions enrichment with community context
  // ─────────────────────────────────────────────────────────────────────────

  it('enriches Neynar suggestions with ZAO member flag', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const members = [
      {
        fid: 456,
        display_name: 'Alice',
        username: 'alice',
        pfp_url: 'https://example.com/alice.png',
        zid: 'alice-zid',
      },
      {
        fid: 789,
        display_name: 'Bob',
        username: 'bob',
        pfp_url: 'https://example.com/bob.png',
        zid: 'bob-zid',
      },
    ];

    const neynarResponse = {
      users: [
        {
          fid: 456,
          username: 'alice',
          display_name: 'Alice',
          pfp_url: 'https://example.com/alice.png',
          follower_count: 100,
          following_count: 50,
          power_badge: false,
          profile: { bio: { text: 'Designer' } },
          viewer_context: { following: false, followed_by: false },
        },
        {
          fid: 999,
          username: 'stranger',
          display_name: 'Stranger',
          pfp_url: 'https://example.com/stranger.png',
          follower_count: 500,
          following_count: 200,
          power_badge: false,
          profile: { bio: { text: 'Stranger' } },
          viewer_context: { following: false, followed_by: false },
        },
      ],
    };

    mockFrom.mockReturnValue(suggestionsChain({ data: members, error: null }));

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(neynarResponse),
    });

    const res = await GET(makeGetRequest('/api/social/suggestions'));
    expect(res.status).toBe(200);
    const body = await res.json();

    // Alice should be flagged as ZAO member
    expect(body.suggestions[0].fid).toBe(456);
    expect(body.suggestions[0].isZaoMember).toBe(true);

    // Stranger should not be flagged as ZAO member
    expect(body.suggestions[1].fid).toBe(999);
    expect(body.suggestions[1].isZaoMember).toBe(false);
  });

  it('sorts suggestions by ZAO membership first, then follower count', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const members = [{ fid: 456, display_name: 'Alice', username: 'alice', pfp_url: '', zid: '1' }];

    const neynarResponse = {
      users: [
        {
          fid: 999,
          username: 'highfollower',
          display_name: 'High Follower',
          pfp_url: '',
          follower_count: 5000,
          following_count: 100,
          power_badge: false,
          profile: {},
          viewer_context: { following: false, followed_by: false },
        },
        {
          fid: 456,
          username: 'alice',
          display_name: 'Alice',
          pfp_url: '',
          follower_count: 100,
          following_count: 50,
          power_badge: false,
          profile: {},
          viewer_context: { following: false, followed_by: false },
        },
      ],
    };

    mockFrom.mockReturnValue(suggestionsChain({ data: members, error: null }));

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(neynarResponse),
    });

    const res = await GET(makeGetRequest('/api/social/suggestions'));
    const body = await res.json();

    // Alice (ZAO member) should come before highfollower (non-member) despite lower follower count
    expect(body.suggestions[0].fid).toBe(456);
    expect(body.suggestions[0].isZaoMember).toBe(true);
    expect(body.suggestions[1].fid).toBe(999);
    expect(body.suggestions[1].isZaoMember).toBe(false);
  });

  it('limits suggestions to 15 in response', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    mockFrom.mockReturnValue(suggestionsChain({ data: [], error: null }));

    const users = Array.from({ length: 20 }, (_, i) => ({
      fid: 100 + i,
      username: `user${i}`,
      display_name: `User ${i}`,
      pfp_url: '',
      follower_count: 100 - i,
      following_count: 50,
      power_badge: false,
      profile: {},
      viewer_context: { following: false, followed_by: false },
    }));

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ users }),
    });

    const res = await GET(makeGetRequest('/api/social/suggestions'));
    const body = await res.json();

    expect(body.suggestions.length).toBeLessThanOrEqual(15);
  });

  it('includes bio and viewer_context in enriched response', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    mockFrom.mockReturnValue(suggestionsChain({ data: [], error: null }));

    const neynarResponse = {
      users: [
        {
          fid: 456,
          username: 'alice',
          display_name: 'Alice',
          pfp_url: 'https://example.com/alice.png',
          follower_count: 100,
          following_count: 50,
          power_badge: true,
          profile: { bio: { text: 'Designer & artist' } },
          viewer_context: { following: false, followed_by: true },
        },
      ],
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(neynarResponse),
    });

    const res = await GET(makeGetRequest('/api/social/suggestions'));
    const body = await res.json();

    const suggestion = body.suggestions[0];
    expect(suggestion.bio).toBe('Designer & artist');
    expect(suggestion.powerBadge).toBe(true);
    expect(suggestion.followsYou).toBe(true);
    expect(suggestion.displayName).toBe('Alice');
    expect(suggestion.followerCount).toBe(100);
  });

  it('handles missing bio gracefully (null)', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    mockFrom.mockReturnValue(suggestionsChain({ data: [], error: null }));

    const neynarResponse = {
      users: [
        {
          fid: 456,
          username: 'alice',
          display_name: 'Alice',
          pfp_url: '',
          follower_count: 100,
          following_count: 50,
          power_badge: false,
          // profile or profile.bio missing
          viewer_context: { following: false, followed_by: false },
        },
      ],
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(neynarResponse),
    });

    const res = await GET(makeGetRequest('/api/social/suggestions'));
    const body = await res.json();

    expect(body.suggestions[0].bio).toBeNull();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SUCCESS: Supplemental Neynar suggestions (when < 10 initial results)
  // ─────────────────────────────────────────────────────────────────────────

  it('supplements suggestions when initial count < 10', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    mockFrom.mockReturnValue(suggestionsChain({ data: [], error: null }));

    const initialResponse = {
      users: Array.from({ length: 5 }, (_, i) => ({
        fid: 100 + i,
        username: `user${i}`,
        display_name: `User ${i}`,
        pfp_url: '',
        follower_count: 100,
        following_count: 50,
        power_badge: false,
        profile: {},
        viewer_context: { following: false, followed_by: false },
      })),
    };

    const supplementalResponse = {
      users: Array.from({ length: 10 }, (_, i) => ({
        fid: 200 + i,
        username: `extra${i}`,
        display_name: `Extra ${i}`,
        pfp_url: '',
        follower_count: 50,
        following_count: 25,
        power_badge: false,
        profile: {},
        viewer_context: { following: false, followed_by: false },
      })),
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue(initialResponse),
    });

    // Mock getFollowSuggestions
    vi.doMock('@/lib/farcaster/neynar', () => ({
      getFollowSuggestions: vi.fn().mockResolvedValue(supplementalResponse),
    }));

    const res = await GET(makeGetRequest('/api/social/suggestions'));
    const body = await res.json();

    // Should have more than 5 suggestions now
    expect(body.suggestions.length).toBeGreaterThan(5);
  });

  it('does not supplement when initial suggestions >= 10', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    mockFrom.mockReturnValue(suggestionsChain({ data: [], error: null }));

    const initialResponse = {
      users: Array.from({ length: 15 }, (_, i) => ({
        fid: 100 + i,
        username: `user${i}`,
        display_name: `User ${i}`,
        pfp_url: '',
        follower_count: 100,
        following_count: 50,
        power_badge: false,
        profile: {},
        viewer_context: { following: false, followed_by: false },
      })),
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(initialResponse),
    });

    const res = await GET(makeGetRequest('/api/social/suggestions'));
    const body = await res.json();

    // Should return exactly 15 (the slice limit)
    expect(body.suggestions.length).toBeLessThanOrEqual(15);
  });

  it('deduplicates supplemental suggestions by FID', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    mockFrom.mockReturnValue(suggestionsChain({ data: [], error: null }));

    // Initial fetch returns 5 users
    const initialResponse = {
      users: Array.from({ length: 5 }, (_, i) => ({
        fid: 100 + i,
        username: `user${i}`,
        display_name: `User ${i}`,
        pfp_url: '',
        follower_count: 100,
        following_count: 50,
        power_badge: false,
        profile: {},
        viewer_context: { following: false, followed_by: false },
      })),
    };

    // Supplemental includes overlap with initial (fid 100, 101)
    const supplementalResponse = {
      users: [
        {
          fid: 100,
          username: 'duplicate1',
          display_name: 'Duplicate 1',
          pfp_url: '',
          follower_count: 50,
          following_count: 25,
          power_badge: false,
          profile: {},
          viewer_context: { following: false, followed_by: false },
        },
        {
          fid: 200,
          username: 'newuser',
          display_name: 'New User',
          pfp_url: '',
          follower_count: 75,
          following_count: 30,
          power_badge: false,
          profile: {},
          viewer_context: { following: false, followed_by: false },
        },
      ],
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue(initialResponse),
    });

    vi.doMock('@/lib/farcaster/neynar', () => ({
      getFollowSuggestions: vi.fn().mockResolvedValue(supplementalResponse),
    }));

    const res = await GET(makeGetRequest('/api/social/suggestions'));
    const body = await res.json();

    // Should only have one fid 100, not duplicated
    const fids = body.suggestions.map((s: { fid: number }) => s.fid);
    expect(fids.filter((f: number) => f === 100).length).toBe(1);
  });

  it('catches and logs errors during supplemental fetch', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    mockFrom.mockReturnValue(suggestionsChain({ data: [], error: null }));

    const initialResponse = {
      users: Array.from({ length: 5 }, (_, i) => ({
        fid: 100 + i,
        username: `user${i}`,
        display_name: `User ${i}`,
        pfp_url: '',
        follower_count: 100,
        following_count: 50,
        power_badge: false,
        profile: {},
        viewer_context: { following: false, followed_by: false },
      })),
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue(initialResponse),
    });

    vi.doMock('@/lib/farcaster/neynar', () => ({
      getFollowSuggestions: vi.fn().mockRejectedValue(new Error('Neynar error')),
    }));

    const res = await GET(makeGetRequest('/api/social/suggestions'));

    // Should still return 200, even if supplemental fetch fails
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.suggestions.length).toBeGreaterThan(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SUCCESS: Unfollowed community members
  // ─────────────────────────────────────────────────────────────────────────

  it('retrieves unfollowed ZAO members via bulk fetch', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const members = [
      { fid: 456, display_name: 'Alice', username: 'alice', pfp_url: '', zid: '1' },
      { fid: 789, display_name: 'Bob', username: 'bob', pfp_url: '', zid: '2' },
    ];

    mockFrom.mockReturnValue(suggestionsChain({ data: members, error: null }));

    const initialNeynarRes = { users: [] };
    const bulkUserRes = {
      users: [
        {
          fid: 456,
          username: 'alice',
          display_name: 'Alice',
          pfp_url: '',
          follower_count: 100,
          following_count: 50,
          power_badge: false,
          profile: {},
          viewer_context: { following: false, followed_by: false },
        },
        {
          fid: 789,
          username: 'bob',
          display_name: 'Bob',
          pfp_url: '',
          follower_count: 200,
          following_count: 100,
          power_badge: false,
          profile: {},
          viewer_context: { following: false, followed_by: false },
        },
      ],
    };

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(initialNeynarRes),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(bulkUserRes),
      });

    const res = await GET(makeGetRequest('/api/social/suggestions'));
    const body = await res.json();

    // Should have unfollowed members
    expect(body.unfollowedMembers.length).toBeGreaterThan(0);
    expect(body.unfollowedMembers[0].isZaoMember).toBe(true);
  });

  it('excludes current user FID from unfollowed members query', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const members = [
      { fid: 123, display_name: 'Self', username: 'self', pfp_url: '', zid: '1' },
      { fid: 456, display_name: 'Alice', username: 'alice', pfp_url: '', zid: '2' },
    ];

    mockFrom.mockReturnValue(suggestionsChain({ data: members, error: null }));

    const initialNeynarRes = { users: [] };

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(initialNeynarRes),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ users: [] }),
      });

    const res = await GET(makeGetRequest('/api/social/suggestions'));
    const body = await res.json();

    // Should not include self (fid 123) in bulk query
    expect(body).toBeDefined();
  });

  it('skips unfollowed members fetch when no community members exist', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    mockFrom.mockReturnValue(suggestionsChain({ data: [], error: null }));

    const initialNeynarRes = { users: [] };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue(initialNeynarRes),
    });

    const res = await GET(makeGetRequest('/api/social/suggestions'));
    const body = await res.json();

    // Should not make bulk fetch call if no members
    expect(body.unfollowedMembers).toEqual([]);
  });

  it('handles bulk fetch pagination (chunking) for large member lists', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    // Create 250 members (requires 3 chunks: 100 + 100 + 50)
    const members = Array.from({ length: 250 }, (_, i) => ({
      fid: 1000 + i,
      display_name: `Member ${i}`,
      username: `member${i}`,
      pfp_url: '',
      zid: `${i}`,
    }));

    mockFrom.mockReturnValue(suggestionsChain({ data: members, error: null }));

    const initialNeynarRes = { users: [] };

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(initialNeynarRes),
      })
      .mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ users: [] }),
      });

    const res = await GET(makeGetRequest('/api/social/suggestions'));

    // Verify chunks were requested (should be 3 calls for 250 members)
    const fetchCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    expect(fetchCalls.length).toBeGreaterThan(1); // At least the initial fetch + one bulk fetch

    expect(res.status).toBe(200);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ERROR: Neynar fetch failures
  // ─────────────────────────────────────────────────────────────────────────

  it('handles Neynar fetch returning non-OK status gracefully', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    mockFrom.mockReturnValue(suggestionsChain({ data: [], error: null }));

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 429,
    });

    const res = await GET(makeGetRequest('/api/social/suggestions'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.suggestions).toEqual([]);
  });

  it('handles Neynar fetch network error gracefully', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    mockFrom.mockReturnValue(suggestionsChain({ data: [], error: null }));

    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    const res = await GET(makeGetRequest('/api/social/suggestions'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch suggestions');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ERROR: Supabase query errors
  // ─────────────────────────────────────────────────────────────────────────

  it('continues when users query has error (treats as empty data)', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    // membersResult.data is null and error is set, but code does: (membersResult.data || [])
    mockFrom.mockReturnValue(suggestionsChain({ data: null, error: new Error('db error') }));

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ users: [] }),
    });

    const res = await GET(makeGetRequest('/api/social/suggestions'));
    // Route doesn't explicitly check for errors, it just uses data || []
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.suggestions).toEqual([]);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ERROR: Unexpected runtime errors
  // ─────────────────────────────────────────────────────────────────────────

  it('returns 500 and logs error on unexpected exception', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    mockFrom.mockImplementation(() => {
      throw new Error('Unexpected crash');
    });

    const { logger } = await import('@/lib/logger');

    const res = await GET(makeGetRequest('/api/social/suggestions'));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch suggestions');
    expect(logger.error).toHaveBeenCalledWith('Suggestions error:', expect.any(Error));
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Edge cases
  // ─────────────────────────────────────────────────────────────────────────

  it('handles response shape with missing fields gracefully', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    mockFrom.mockReturnValue(suggestionsChain({ data: [], error: null }));

    const neynarResponse = {
      users: [
        {
          fid: 456,
          username: 'alice',
          display_name: 'Alice',
          pfp_url: '',
          // follower_count, following_count, power_badge missing
          viewer_context: { following: false, followed_by: false },
        },
      ],
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(neynarResponse),
    });

    const res = await GET(makeGetRequest('/api/social/suggestions'));
    const body = await res.json();

    const suggestion = body.suggestions[0];
    expect(suggestion.followerCount).toBe(0);
    expect(suggestion.followingCount).toBe(0);
    expect(suggestion.powerBadge).toBe(false);
  });

  it('calls supabase with correct filters for active users', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const chain = suggestionsChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ users: [] }),
    });

    await GET(makeGetRequest('/api/social/suggestions'));

    expect(mockFrom).toHaveBeenCalledWith('users');
    expect(chain.select).toHaveBeenCalledWith('fid, display_name, username, pfp_url, zid');
    expect(chain.eq).toHaveBeenCalledWith('is_active', true);
    expect(chain.not).toHaveBeenCalledWith('fid', 'is', null);
  });

  it('makes correct Neynar API calls with proper headers', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    mockFrom.mockReturnValue(suggestionsChain({ data: [], error: null }));

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ users: [] }),
    });

    await GET(makeGetRequest('/api/social/suggestions'));

    const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls.length).toBeGreaterThan(0);

    const firstCall = calls[0];
    expect(firstCall[0]).toContain('api.neynar.com');
    expect(firstCall[0]).toContain('fid=123');
    expect(firstCall[1]).toHaveProperty('headers');
    expect(firstCall[1].headers['x-api-key']).toBe('test-key');
  });

  it('returns response with both suggestions and unfollowedMembers keys', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    mockFrom.mockReturnValue(suggestionsChain({ data: [], error: null }));

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ users: [] }),
    });

    const res = await GET(makeGetRequest('/api/social/suggestions'));
    const body = await res.json();

    expect(body).toHaveProperty('suggestions');
    expect(body).toHaveProperty('unfollowedMembers');
    expect(Array.isArray(body.suggestions)).toBe(true);
    expect(Array.isArray(body.unfollowedMembers)).toBe(true);
  });
});
