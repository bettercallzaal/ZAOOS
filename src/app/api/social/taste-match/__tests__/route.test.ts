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

import { GET } from '../route';

/**
 * Build a chain that resolves to result when awaited (via .then).
 * All chainable methods return the chain itself for further chaining.
 */
function makeChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'eq', 'limit', 'in']) {
    chain[m] = vi.fn(() => chain);
  }
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('GET /api/social/taste-match', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Auth guard
  // ─────────────────────────────────────────────────────────────────────────

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET(makeGetRequest('/api/social/taste-match', { targetFid: '456' }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Input validation (targetFid)
  // ─────────────────────────────────────────────────────────────────────────

  it('returns 400 when targetFid is missing', async () => {
    const res = await GET(makeGetRequest('/api/social/taste-match'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid params');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when targetFid is not a number', async () => {
    const res = await GET(makeGetRequest('/api/social/taste-match', { targetFid: 'abc' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid params');
  });

  it('returns 400 when targetFid is not positive', async () => {
    const res = await GET(makeGetRequest('/api/social/taste-match', { targetFid: '0' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid params');
  });

  it('returns 400 when targetFid is negative', async () => {
    const res = await GET(makeGetRequest('/api/social/taste-match', { targetFid: '-123' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid params');
  });

  it('returns 400 when targetFid is a float', async () => {
    const res = await GET(makeGetRequest('/api/social/taste-match', { targetFid: '123.5' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid params');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Same-user case (targetFid === session.fid)
  // ─────────────────────────────────────────────────────────────────────────

  it('returns 100% match when comparing user to themselves', async () => {
    // Session fid is 123 (from mockAuthenticatedSession default)
    const res = await GET(makeGetRequest('/api/social/taste-match', { targetFid: '123' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.matchPercent).toBe(100);
    expect(body.sharedTracks).toEqual([]);
    expect(body.totalYours).toBe(0);
    expect(body.totalTheirs).toBe(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Happy path: both users have likes, compute overlap
  // ─────────────────────────────────────────────────────────────────────────

  it('computes Jaccard similarity (shared / union) with both users having likes', async () => {
    // Session user (fid 123): likes songs s1, s2, s3
    // Target user (fid 456): likes songs s2, s3, s4
    // Union: s1, s2, s3, s4 (size 4)
    // Shared: s2, s3 (size 2)
    // Match: 2/4 = 50%
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      const chain = makeChain({
        data:
          callCount === 0
            ? [{ song_id: 's1' }, { song_id: 's2' }, { song_id: 's3' }]
            : callCount === 1
              ? [{ song_id: 's2' }, { song_id: 's3' }, { song_id: 's4' }]
              : [],
        error: null,
      });
      callCount++;
      return chain;
    });
    const res = await GET(makeGetRequest('/api/social/taste-match', { targetFid: '456' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.matchPercent).toBe(50);
    expect(body.totalYours).toBe(3);
    expect(body.totalTheirs).toBe(3);
    expect(body.sharedCount).toBe(2);
  });

  it('fetches shared track details (up to 10)', async () => {
    // My likes: s1, s2
    // Their likes: s1, s2, s3
    // Shared: s1, s2
    const songs = [
      {
        id: 's1',
        title: 'Song 1',
        artist: 'Artist A',
        url: 'https://example.com/s1',
        artwork_url: 'https://example.com/s1.jpg',
      },
      {
        id: 's2',
        title: 'Song 2',
        artist: 'Artist B',
        url: 'https://example.com/s2',
        artwork_url: 'https://example.com/s2.jpg',
      },
    ];

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      const chain = makeChain({
        data:
          callCount === 0
            ? [{ song_id: 's1' }, { song_id: 's2' }]
            : callCount === 1
              ? [{ song_id: 's1' }, { song_id: 's2' }, { song_id: 's3' }]
              : songs,
        error: null,
      });
      callCount++;
      return chain;
    });

    const res = await GET(makeGetRequest('/api/social/taste-match', { targetFid: '456' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sharedTracks).toHaveLength(2);
    expect(body.sharedTracks[0]).toEqual({
      id: 's1',
      title: 'Song 1',
      artist: 'Artist A',
      url: 'https://example.com/s1',
      artworkUrl: 'https://example.com/s1.jpg',
    });
    expect(body.sharedTracks[1]).toEqual({
      id: 's2',
      title: 'Song 2',
      artist: 'Artist B',
      url: 'https://example.com/s2',
      artworkUrl: 'https://example.com/s2.jpg',
    });
  });

  it('limits shared track details to 10 songs', async () => {
    // Create 15 shared song IDs
    const myLikes = Array.from({ length: 15 }, (_, i) => `s${i + 1}`);
    const theirLikes = Array.from({ length: 15 }, (_, i) => `s${i + 1}`);

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      const chain = makeChain({
        data:
          callCount === 0
            ? myLikes.map((id) => ({ song_id: id }))
            : callCount === 1
              ? theirLikes.map((id) => ({ song_id: id }))
              : Array.from({ length: 10 }, (_, i) => ({
                  id: `s${i + 1}`,
                  title: `Song ${i + 1}`,
                  artist: null,
                  url: `https://example.com/s${i + 1}`,
                  artwork_url: null,
                })),
        error: null,
      });
      callCount++;
      return chain;
    });

    const res = await GET(makeGetRequest('/api/social/taste-match', { targetFid: '456' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sharedTracks).toHaveLength(10);
    expect(body.sharedCount).toBe(15); // But we count all 15 shared
  });

  it('handles missing song title and artwork_url gracefully', async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      const chain = makeChain({
        data:
          callCount === 0
            ? [{ song_id: 's1' }]
            : callCount === 1
              ? [{ song_id: 's1' }]
              : [
                  {
                    id: 's1',
                    title: null,
                    artist: 'Artist A',
                    url: 'https://example.com/s1',
                    artwork_url: null,
                  },
                ],
        error: null,
      });
      callCount++;
      return chain;
    });

    const res = await GET(makeGetRequest('/api/social/taste-match', { targetFid: '456' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sharedTracks[0]).toEqual({
      id: 's1',
      title: 'Untitled',
      artist: 'Artist A',
      url: 'https://example.com/s1',
      artworkUrl: null,
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // No overlap cases
  // ─────────────────────────────────────────────────────────────────────────

  it('returns 0% match when users have no shared likes', async () => {
    // Session user: s1, s2
    // Target user: s3, s4
    // Union: 4, Shared: 0, Match: 0%
    mockFrom.mockReturnValue(
      makeChain({ data: [{ song_id: 's1' }, { song_id: 's2' }], error: null }),
    );

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      const chain = makeChain({
        data:
          callCount === 0
            ? [{ song_id: 's1' }, { song_id: 's2' }]
            : [{ song_id: 's3' }, { song_id: 's4' }],
        error: null,
      });
      callCount++;
      return chain;
    });

    const res = await GET(makeGetRequest('/api/social/taste-match', { targetFid: '456' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.matchPercent).toBe(0);
    expect(body.sharedCount).toBe(0);
    expect(body.sharedTracks).toEqual([]);
    expect(body.totalYours).toBe(2);
    expect(body.totalTheirs).toBe(2);
  });

  it('returns 0% match when target user has no likes', async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      const chain = makeChain({
        data: callCount === 0 ? [{ song_id: 's1' }, { song_id: 's2' }] : [],
        error: null,
      });
      callCount++;
      return chain;
    });

    const res = await GET(makeGetRequest('/api/social/taste-match', { targetFid: '456' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.matchPercent).toBe(0);
    expect(body.sharedCount).toBe(0);
    expect(body.totalYours).toBe(2);
    expect(body.totalTheirs).toBe(0);
  });

  it('returns 0% match when current user has no likes', async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      const chain = makeChain({
        data: callCount === 0 ? [] : [{ song_id: 's1' }, { song_id: 's2' }],
        error: null,
      });
      callCount++;
      return chain;
    });

    const res = await GET(makeGetRequest('/api/social/taste-match', { targetFid: '456' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.matchPercent).toBe(0);
    expect(body.sharedCount).toBe(0);
    expect(body.totalYours).toBe(0);
    expect(body.totalTheirs).toBe(2);
  });

  it('returns 0% when both users have no likes (empty union)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }));

    const res = await GET(makeGetRequest('/api/social/taste-match', { targetFid: '456' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.matchPercent).toBe(0);
    expect(body.sharedCount).toBe(0);
    expect(body.totalYours).toBe(0);
    expect(body.totalTheirs).toBe(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Promise.allSettled failure cases
  // ─────────────────────────────────────────────────────────────────────────

  it('continues with empty likes if current user query fails', async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      const chain: Record<string, ReturnType<typeof vi.fn>> = {};
      for (const m of ['select', 'eq', 'limit', 'in']) {
        chain[m] = vi.fn(() => chain);
      }

      if (callCount === 0) {
        // First call (myLikes) throws
        // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
        (chain as unknown as { then: unknown }).then = () => {
          throw new Error('Query failed');
        };
      } else if (callCount === 1) {
        // Second call (theirLikes) succeeds
        // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
        (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) =>
          resolve({ data: [{ song_id: 's1' }, { song_id: 's2' }], error: null });
      } else {
        // songs query
        // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
        (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) =>
          resolve({ data: [], error: null });
      }
      callCount++;
      return chain;
    });

    const res = await GET(makeGetRequest('/api/social/taste-match', { targetFid: '456' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.matchPercent).toBe(0);
    expect(body.totalYours).toBe(0);
    expect(body.totalTheirs).toBe(2);
  });

  it('continues with empty likes if target user query fails', async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      const chain: Record<string, ReturnType<typeof vi.fn>> = {};
      for (const m of ['select', 'eq', 'limit', 'in']) {
        chain[m] = vi.fn(() => chain);
      }

      if (callCount === 0) {
        // First call (myLikes) succeeds
        // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
        (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) =>
          resolve({ data: [{ song_id: 's1' }, { song_id: 's2' }], error: null });
      } else if (callCount === 1) {
        // Second call (theirLikes) throws
        // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
        (chain as unknown as { then: unknown }).then = () => {
          throw new Error('Query failed');
        };
      } else {
        // songs query
        // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
        (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) =>
          resolve({ data: [], error: null });
      }
      callCount++;
      return chain;
    });

    const res = await GET(makeGetRequest('/api/social/taste-match', { targetFid: '456' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.matchPercent).toBe(0);
    expect(body.totalYours).toBe(2);
    expect(body.totalTheirs).toBe(0);
  });

  it('both likes queries fail, treated as no likes', async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      const chain: Record<string, ReturnType<typeof vi.fn>> = {};
      for (const m of ['select', 'eq', 'limit', 'in']) {
        chain[m] = vi.fn(() => chain);
      }

      if (callCount < 2) {
        // Both throw
        // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
        (chain as unknown as { then: unknown }).then = () => {
          throw new Error('Query failed');
        };
      }
      callCount++;
      return chain;
    });

    const res = await GET(makeGetRequest('/api/social/taste-match', { targetFid: '456' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.matchPercent).toBe(0);
    expect(body.totalYours).toBe(0);
    expect(body.totalTheirs).toBe(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Query error during songs fetch (third query)
  // ─────────────────────────────────────────────────────────────────────────

  it('returns 500 when songs detail query fails', async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      const chain: Record<string, ReturnType<typeof vi.fn>> = {};
      for (const m of ['select', 'eq', 'limit', 'in']) {
        chain[m] = vi.fn(() => chain);
      }

      if (callCount === 0) {
        // myLikes
        // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
        (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) =>
          resolve({ data: [{ song_id: 's1' }, { song_id: 's2' }], error: null });
      } else if (callCount === 1) {
        // theirLikes
        // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
        (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) =>
          resolve({ data: [{ song_id: 's1' }], error: null });
      } else {
        // songs — throws
        // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
        (chain as unknown as { then: unknown }).then = () => {
          throw new Error('Songs query failed');
        };
      }
      callCount++;
      return chain;
    });

    const res = await GET(makeGetRequest('/api/social/taste-match', { targetFid: '456' }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to compute taste match');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Rounding and edge cases for Jaccard similarity
  // ─────────────────────────────────────────────────────────────────────────

  it('rounds Jaccard percentage to nearest integer', async () => {
    // 1 shared out of 3 union = 33.33% → rounds to 33
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      const chain = makeChain({
        data:
          callCount === 0
            ? [{ song_id: 's1' }, { song_id: 's2' }]
            : callCount === 1
              ? [{ song_id: 's1' }, { song_id: 's3' }]
              : [],
        error: null,
      });
      callCount++;
      return chain;
    });

    const res = await GET(makeGetRequest('/api/social/taste-match', { targetFid: '456' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.matchPercent).toBe(33); // 1/3 = 0.333... → 33
  });

  it('rounds Jaccard percentage up on .5 boundary', async () => {
    // 1 shared out of 2 union = 50%
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      const chain = makeChain({
        data:
          callCount === 0
            ? [{ song_id: 's1' }]
            : callCount === 1
              ? [{ song_id: 's1' }, { song_id: 's2' }]
              : [],
        error: null,
      });
      callCount++;
      return chain;
    });

    const res = await GET(makeGetRequest('/api/social/taste-match', { targetFid: '456' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.matchPercent).toBe(50);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Unexpected thrown error (not from Supabase)
  // ─────────────────────────────────────────────────────────────────────────

  it('returns 500 when an unexpected error is thrown', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('Unexpected error outside of Promise.allSettled');
    });

    const res = await GET(makeGetRequest('/api/social/taste-match', { targetFid: '456' }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to compute taste match');
  });
});
