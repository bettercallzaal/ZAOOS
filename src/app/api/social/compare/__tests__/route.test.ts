import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeGetRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/env', () => ({
  ENV: { NEYNAR_API_KEY: 'test-key' },
}));

import { GET } from '../route';

describe('GET /api/social/compare', () => {
  let testCounter = 0;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    vi.stubGlobal('fetch', vi.fn());
    testCounter++;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ---------- Auth Guard ----------
  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET(makeGetRequest('/api/social/compare', { targetFid: '999' }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('returns 401 when session exists but fid is missing', async () => {
    mockGetSessionData.mockResolvedValue({ username: 'testuser' });
    const res = await GET(makeGetRequest('/api/social/compare', { targetFid: '999' }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  // ---------- Input Validation ----------
  it('returns 400 when targetFid is missing', async () => {
    const res = await GET(makeGetRequest('/api/social/compare'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid targetFid');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when targetFid is not a number', async () => {
    const res = await GET(makeGetRequest('/api/social/compare', { targetFid: 'not-a-number' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid targetFid');
  });

  it('returns 400 when targetFid is not an integer', async () => {
    const res = await GET(makeGetRequest('/api/social/compare', { targetFid: '123.45' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid targetFid');
  });

  it('returns 400 when targetFid is not positive', async () => {
    const res = await GET(makeGetRequest('/api/social/compare', { targetFid: '0' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid targetFid');
  });

  it('returns 400 when targetFid is negative', async () => {
    const res = await GET(makeGetRequest('/api/social/compare', { targetFid: '-5' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid targetFid');
  });

  // ---------- Self-Comparison Check ----------
  it('returns 400 when comparing with yourself', async () => {
    const res = await GET(makeGetRequest('/api/social/compare', { targetFid: '123' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Cannot compare with yourself');
  });

  // ---------- Cache Tests ----------
  it('returns cached result on second call within TTL', async () => {
    const mockFetch = fetch as ReturnType<typeof vi.fn>;
    let callCount = 0;
    mockFetch.mockImplementation(async (url: string) => {
      callCount++;
      if (url.includes('/following?fid=999')) {
        return {
          ok: true,
          json: async () => ({ users: [{ fid: 1 }, { fid: 2 }], next: undefined }),
        };
      }
      if (url.includes('/followers?fid=999')) {
        return {
          ok: true,
          json: async () => ({ users: [{ fid: 10 }, { fid: 20 }], next: undefined }),
        };
      }
      if (url.includes('/following?fid=123')) {
        return {
          ok: true,
          json: async () => ({ users: [{ fid: 1 }, { fid: 3 }], next: undefined }),
        };
      }
      if (url.includes('/followers?fid=123')) {
        return {
          ok: true,
          json: async () => ({ users: [{ fid: 10 }, { fid: 30 }], next: undefined }),
        };
      }
      if (url.includes('/user/bulk?')) {
        return { ok: true, json: async () => ({ users: [] }) };
      }
      return { ok: false };
    });

    // First call
    const res1 = await GET(makeGetRequest('/api/social/compare', { targetFid: '999' }));
    expect(res1.status).toBe(200);
    const body1 = await res1.json();
    const callsAfterFirst = callCount;

    // Second call should be cached (no additional fetch calls)
    const res2 = await GET(makeGetRequest('/api/social/compare', { targetFid: '999' }));
    expect(res2.status).toBe(200);
    const body2 = await res2.json();

    expect(body1).toEqual(body2);
    expect(callCount).toBe(callsAfterFirst); // No new calls
  });

  // ---------- Comparison Logic ----------
  it('computes shared following and shared followers', async () => {
    // My following: [1, 2, 3], Their following: [2, 3, 4]
    // Shared following: [2, 3]
    const targetFid = 1000 + testCounter;
    const mockFetch = fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/following?fid=123')) {
        return {
          ok: true,
          json: async () => ({ users: [{ fid: 1 }, { fid: 2 }, { fid: 3 }], next: undefined }),
        };
      }
      if (url.includes(`/following?fid=${targetFid}`)) {
        return {
          ok: true,
          json: async () => ({ users: [{ fid: 2 }, { fid: 3 }, { fid: 4 }], next: undefined }),
        };
      }
      if (url.includes('/followers?fid=123')) {
        return {
          ok: true,
          json: async () => ({ users: [{ fid: 10 }, { fid: 20 }, { fid: 30 }], next: undefined }),
        };
      }
      if (url.includes(`/followers?fid=${targetFid}`)) {
        return {
          ok: true,
          json: async () => ({ users: [{ fid: 20 }, { fid: 30 }, { fid: 40 }], next: undefined }),
        };
      }
      if (url.includes('/user/bulk?fids=2,3')) {
        return {
          ok: true,
          json: async () => ({
            users: [
              { fid: 2, username: 'user2', pfp_url: 'https://example.com/2.png' },
              { fid: 3, username: 'user3', pfp_url: null },
            ],
          }),
        };
      }
      return { ok: false };
    });

    const res = await GET(makeGetRequest('/api/social/compare', { targetFid: String(targetFid) }));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.sharedFollowers).toBe(2);
    expect(body.sharedFollowing).toBe(2);
    expect(body.totalYours).toBe(3); // my followers
    expect(body.totalTheirs).toBe(3); // their followers
    expect(body.totalYourFollowing).toBe(3);
    expect(body.totalTheirFollowing).toBe(3);
    expect(body.topShared).toHaveLength(2);
    expect(body.topShared[0]).toEqual({
      fid: 2,
      username: 'user2',
      pfpUrl: 'https://example.com/2.png',
    });
  });

  it('returns empty lists when there are no shared connections', async () => {
    const targetFid = 2000 + testCounter;
    const mockFetch = fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/following?fid=123')) {
        return {
          ok: true,
          json: async () => ({ users: [{ fid: 1 }], next: undefined }),
        };
      }
      if (url.includes(`/following?fid=${targetFid}`)) {
        return {
          ok: true,
          json: async () => ({ users: [{ fid: 2 }], next: undefined }),
        };
      }
      if (url.includes('/followers?fid=123')) {
        return {
          ok: true,
          json: async () => ({ users: [{ fid: 10 }], next: undefined }),
        };
      }
      if (url.includes(`/followers?fid=${targetFid}`)) {
        return {
          ok: true,
          json: async () => ({ users: [{ fid: 20 }], next: undefined }),
        };
      }
      return { ok: false };
    });

    const res = await GET(makeGetRequest('/api/social/compare', { targetFid: String(targetFid) }));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.sharedFollowers).toBe(0);
    expect(body.sharedFollowing).toBe(0);
    expect(body.topShared).toEqual([]);
  });

  it('limits top shared to 10 fids and 5 profiles in response', async () => {
    const targetFid = 3000 + testCounter;
    const mockFetch = fetch as ReturnType<typeof vi.fn>;
    const myFollowing = Array.from({ length: 15 }, (_, i) => ({ fid: i + 1 }));
    const theirFollowing = Array.from({ length: 15 }, (_, i) => ({ fid: i + 1 }));

    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/following?fid=123')) {
        return {
          ok: true,
          json: async () => ({ users: myFollowing, next: undefined }),
        };
      }
      if (url.includes(`/following?fid=${targetFid}`)) {
        return {
          ok: true,
          json: async () => ({ users: theirFollowing, next: undefined }),
        };
      }
      if (url.includes('/followers?')) {
        return {
          ok: true,
          json: async () => ({ users: [], next: undefined }),
        };
      }
      if (url.includes('/user/bulk?')) {
        const profiles = Array.from({ length: 5 }, (_, i) => ({
          fid: i + 1,
          username: `user${i + 1}`,
          pfp_url: null,
        }));
        return { ok: true, json: async () => ({ users: profiles }) };
      }
      return { ok: false };
    });

    const res = await GET(makeGetRequest('/api/social/compare', { targetFid: String(targetFid) }));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.sharedFollowing).toBe(15);
    expect(body.topShared).toHaveLength(5);
  });

  // ---------- Pagination (Following) ----------
  it('paginates through multiple batches when fetching following', async () => {
    const targetFid = 4000 + testCounter;
    const mockFetch = fetch as ReturnType<typeof vi.fn>;
    const page1 = Array.from({ length: 100 }, (_, i) => ({ fid: i + 1 }));
    const page2 = Array.from({ length: 100 }, (_, i) => ({ fid: i + 101 }));

    let myFollowingCallCount = 0;

    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/following?fid=123')) {
        myFollowingCallCount++;
        if (myFollowingCallCount === 1) {
          return {
            ok: true,
            json: async () => ({
              users: page1,
              next: { cursor: 'cursor2' },
            }),
          };
        }
        if (myFollowingCallCount === 2) {
          return {
            ok: true,
            json: async () => ({
              users: page2,
              next: undefined,
            }),
          };
        }
      }
      if (url.includes(`/following?fid=${targetFid}`)) {
        return {
          ok: true,
          json: async () => ({ users: [], next: undefined }),
        };
      }
      if (url.includes('/followers?')) {
        return {
          ok: true,
          json: async () => ({ users: [], next: undefined }),
        };
      }
      if (url.includes('/user/bulk?')) {
        return { ok: true, json: async () => ({ users: [] }) };
      }
      return { ok: false };
    });

    const res = await GET(makeGetRequest('/api/social/compare', { targetFid: String(targetFid) }));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.totalYourFollowing).toBe(200);
    expect(body.totalTheirFollowing).toBe(0);
  });

  it('stops pagination when reaching maxCount (400)', async () => {
    // Return 5 pages of 100 each, but stop at 400
    const pages = Array.from({ length: 5 }, (_, pageIdx) =>
      Array.from({ length: 100 }, (_, i) => ({
        fid: pageIdx * 100 + i + 1,
      })),
    );

    let callIndex = 0;
    (fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
      if (url.includes('/following?')) {
        const result = {
          ok: true,
          json: async () => ({
            users: pages[callIndex],
            next: callIndex < 4 ? { cursor: `cursor${callIndex + 1}` } : undefined,
          }),
        };
        callIndex++;
        return result;
      }
      if (url.includes('/followers?')) {
        return {
          ok: true,
          json: async () => ({ users: [], next: undefined }),
        };
      }
      if (url.includes('/user/bulk?')) {
        return { ok: true, json: async () => ({ users: [] }) };
      }
    });

    const res = await GET(makeGetRequest('/api/social/compare', { targetFid: '999' }));
    expect(res.status).toBe(200);
    const body = await res.json();

    // Should stop at 400 (4 pages × 100)
    expect(body.totalYourFollowing).toBeLessThanOrEqual(400);
  });

  it('stops pagination on network error', async () => {
    const targetFid = 5000 + testCounter;
    const mockFetch = fetch as ReturnType<typeof vi.fn>;
    const successPage = Array.from({ length: 100 }, (_, i) => ({ fid: i + 1 }));

    let myFollowingCallCount = 0;

    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/following?fid=123')) {
        myFollowingCallCount++;
        if (myFollowingCallCount === 1) {
          return {
            ok: true,
            json: async () => ({
              users: successPage,
              next: { cursor: 'cursor2' },
            }),
          };
        }
        // Second call fails
        return { ok: false, status: 500 };
      }
      if (url.includes(`/following?fid=${targetFid}`)) {
        return {
          ok: true,
          json: async () => ({ users: [], next: undefined }),
        };
      }
      if (url.includes('/followers?')) {
        return {
          ok: true,
          json: async () => ({ users: [], next: undefined }),
        };
      }
      if (url.includes('/user/bulk?')) {
        return { ok: true, json: async () => ({ users: [] }) };
      }
      return { ok: false };
    });

    const res = await GET(makeGetRequest('/api/social/compare', { targetFid: String(targetFid) }));
    expect(res.status).toBe(200);
    const body = await res.json();

    // Should return only the first page (100)
    expect(body.totalYourFollowing).toBe(100);
  });

  // ---------- Followers Pagination ----------
  it('parses followers response with nested user structure', async () => {
    const targetFid = 6000 + testCounter;
    const mockFetch = fetch as ReturnType<typeof vi.fn>;
    const followerBatch = [
      { user: { fid: 10 } },
      { fid: 20 }, // direct format
      { user: { fid: 30 } },
    ];

    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/following?')) {
        return {
          ok: true,
          json: async () => ({ users: [], next: undefined }),
        };
      }
      if (url.includes('/followers?fid=123')) {
        return {
          ok: true,
          json: async () => ({
            users: followerBatch,
            next: undefined,
          }),
        };
      }
      if (url.includes(`/followers?fid=${targetFid}`)) {
        return {
          ok: true,
          json: async () => ({ users: [], next: undefined }),
        };
      }
      if (url.includes('/user/bulk?')) {
        return { ok: true, json: async () => ({ users: [] }) };
      }
      return { ok: false };
    });

    const res = await GET(makeGetRequest('/api/social/compare', { targetFid: String(targetFid) }));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.totalYours).toBe(3);
  });

  // ---------- Bulk User Fetch ----------
  it('skips bulk fetch when topSharedFids is empty', async () => {
    const mockFetch = fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/following?fid=123')) {
        return { ok: true, json: async () => ({ users: [{ fid: 1 }], next: undefined }) };
      }
      if (url.includes('/following?fid=999')) {
        return { ok: true, json: async () => ({ users: [{ fid: 2 }], next: undefined }) };
      }
      if (url.includes('/followers?')) {
        return { ok: true, json: async () => ({ users: [], next: undefined }) };
      }
      return { ok: false };
    });

    const res = await GET(makeGetRequest('/api/social/compare', { targetFid: '999' }));
    expect(res.status).toBe(200);

    const bulkCalls = mockFetch.mock.calls.filter((call: unknown[]) => {
      const url = call[0] as string;
      return url.includes('/user/bulk?');
    });
    expect(bulkCalls).toHaveLength(0);
  });

  it('maps profile data from bulk fetch response', async () => {
    const targetFid = 7000 + testCounter;
    const mockFetch = fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/following?fid=123')) {
        return {
          ok: true,
          json: async () => ({ users: [{ fid: 5 }, { fid: 6 }], next: undefined }),
        };
      }
      if (url.includes(`/following?fid=${targetFid}`)) {
        return {
          ok: true,
          json: async () => ({ users: [{ fid: 5 }, { fid: 6 }], next: undefined }),
        };
      }
      if (url.includes('/followers?')) {
        return { ok: true, json: async () => ({ users: [], next: undefined }) };
      }
      if (url.includes('/user/bulk?')) {
        return {
          ok: true,
          json: async () => ({
            users: [
              { fid: 5, username: 'alice', pfp_url: 'https://example.com/alice.png' },
              { fid: 6, username: 'bob', pfp_url: null },
            ],
          }),
        };
      }
      return { ok: false };
    });

    const res = await GET(makeGetRequest('/api/social/compare', { targetFid: String(targetFid) }));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.topShared).toEqual([
      { fid: 5, username: 'alice', pfpUrl: 'https://example.com/alice.png' },
      { fid: 6, username: 'bob', pfpUrl: null },
    ]);
  });

  it('handles bulk fetch failure gracefully', async () => {
    const targetFid = 8000 + testCounter;
    const mockFetch = fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/following?fid=123')) {
        return { ok: true, json: async () => ({ users: [{ fid: 1 }], next: undefined }) };
      }
      if (url.includes(`/following?fid=${targetFid}`)) {
        return { ok: true, json: async () => ({ users: [{ fid: 1 }], next: undefined }) };
      }
      if (url.includes('/followers?')) {
        return { ok: true, json: async () => ({ users: [], next: undefined }) };
      }
      if (url.includes('/user/bulk?')) {
        return { ok: false, status: 500 };
      }
      return { ok: false };
    });

    const res = await GET(makeGetRequest('/api/social/compare', { targetFid: String(targetFid) }));
    expect(res.status).toBe(200);
    const body = await res.json();

    // Should succeed with empty topShared on bulk fetch failure
    expect(body.topShared).toEqual([]);
  });

  it('returns empty users array on bulk fetch with no data', async () => {
    const targetFid = 8500 + testCounter;
    const mockFetch = fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/following?fid=123')) {
        return { ok: true, json: async () => ({ users: [{ fid: 1 }], next: undefined }) };
      }
      if (url.includes(`/following?fid=${targetFid}`)) {
        return { ok: true, json: async () => ({ users: [{ fid: 1 }], next: undefined }) };
      }
      if (url.includes('/followers?')) {
        return { ok: true, json: async () => ({ users: [], next: undefined }) };
      }
      if (url.includes('/user/bulk?')) {
        return { ok: true, json: async () => ({}) }; // missing users field
      }
      return { ok: false };
    });

    const res = await GET(makeGetRequest('/api/social/compare', { targetFid: String(targetFid) }));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.topShared).toEqual([]);
  });

  // ---------- Error Handling ----------
  it('returns 500 when following fetch fails completely', async () => {
    const targetFid = 9000 + testCounter;
    const mockFetch = fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockRejectedValue(new Error('Network error'));

    const res = await GET(makeGetRequest('/api/social/compare', { targetFid: String(targetFid) }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to compare networks');
  });

  it('returns 500 when followers fetch fails', async () => {
    const targetFid = 9500 + testCounter;
    const mockFetch = fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/following?')) {
        return {
          ok: true,
          json: async () => ({ users: [{ fid: 1 }], next: undefined }),
        };
      }
      if (url.includes('/followers?')) {
        throw new Error('Connection timeout');
      }
      return { ok: false };
    });

    const res = await GET(makeGetRequest('/api/social/compare', { targetFid: String(targetFid) }));
    expect(res.status).toBe(500);
  });

  // ---------- Response Shape ----------
  it('returns correct response structure on success', async () => {
    const mockFetch = fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/following?fid=123')) {
        return {
          ok: true,
          json: async () => ({ users: [{ fid: 1 }, { fid: 2 }], next: undefined }),
        };
      }
      if (url.includes('/following?fid=999')) {
        return { ok: true, json: async () => ({ users: [{ fid: 1 }], next: undefined }) };
      }
      if (url.includes('/followers?fid=123')) {
        return { ok: true, json: async () => ({ users: [{ fid: 10 }], next: undefined }) };
      }
      if (url.includes('/followers?fid=999')) {
        return {
          ok: true,
          json: async () => ({ users: [{ fid: 10 }, { fid: 20 }], next: undefined }),
        };
      }
      if (url.includes('/user/bulk?')) {
        return { ok: true, json: async () => ({ users: [] }) };
      }
      return { ok: false };
    });

    const res = await GET(makeGetRequest('/api/social/compare', { targetFid: '999' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('sharedFollowers');
    expect(body).toHaveProperty('sharedFollowing');
    expect(body).toHaveProperty('totalYours');
    expect(body).toHaveProperty('totalTheirs');
    expect(body).toHaveProperty('totalYourFollowing');
    expect(body).toHaveProperty('totalTheirFollowing');
    expect(body).toHaveProperty('topShared');

    expect(typeof body.sharedFollowers).toBe('number');
    expect(typeof body.sharedFollowing).toBe('number');
    expect(Array.isArray(body.topShared)).toBe(true);
  });

  // ---------- Coercion ----------
  it('coerces string targetFid to number', async () => {
    const targetFid = 10000 + testCounter;
    const mockFetch = fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/following?') || url.includes('/followers?')) {
        return { ok: true, json: async () => ({ users: [], next: undefined }) };
      }
      return { ok: false };
    });

    const res = await GET(makeGetRequest('/api/social/compare', { targetFid: String(targetFid) }));
    expect(res.status).toBe(200);
    expect((await res.json()).sharedFollowers).toBe(0);
  });

  it('handles large targetFid values', async () => {
    const targetFid = 9999999;
    const mockFetch = fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/following?') || url.includes('/followers?')) {
        return { ok: true, json: async () => ({ users: [], next: undefined }) };
      }
      return { ok: false };
    });

    const res = await GET(makeGetRequest('/api/social/compare', { targetFid: String(targetFid) }));
    expect(res.status).toBe(200);
  });
});
