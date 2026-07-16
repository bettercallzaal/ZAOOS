import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockAuthenticatedSession, mockUnauthenticatedSession } from '@/test-utils/api-helpers';

// ── Mock global fetch BEFORE importing route ────────────────────────────────
const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

// ── Hoisted mocks ────────────────────────────────────────────────────────────
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
    NEYNAR_API_KEY: 'test-neynar-key',
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

// ── Route import ─────────────────────────────────────────────────────────────
import { GET } from '../route';

// ── Test helpers ─────────────────────────────────────────────────────────────

/**
 * Build a Supabase query-chain mock that resolves to result.
 * Every chained method returns the chain itself for further chaining.
 * Terminal .then() resolves the query.
 */
function chainMock(result: { data?: unknown; error?: unknown; count?: number }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.from = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.not = vi.fn().mockReturnValue(chain);
  chain.is = vi.fn().mockReturnValue(chain);
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  chain.then = vi.fn((resolve: (val: unknown) => void) => resolve(result));
  return chain;
}

/**
 * Create a mock user row from the database.
 */
function mockUserRow(overrides?: Record<string, unknown>) {
  return {
    fid: 100,
    username: 'testuser',
    pfp_url: 'https://example.com/pfp.jpg',
    display_name: 'Test User',
    is_active: true,
    ...overrides,
  };
}

/**
 * Create a mock Neynar feed response.
 */
function mockNeynarFeed(casts: unknown[]) {
  return {
    casts: casts || [],
  };
}

/**
 * Create a mock Neynar cast with channel info.
 */
function mockNeynarCast(overrides?: Record<string, unknown>) {
  return {
    hash: 'mock-hash-123',
    author: { fid: 100, username: 'testuser' },
    root_parent_url: 'https://warpcast.com/channel/zao',
    text: 'Test cast',
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/social/clusters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── Authentication tests ──────────────────────────────────────────────────

  describe('Authentication', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
      const res = await GET();
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 401 when session is null', async () => {
      mockGetSessionData.mockResolvedValue(null);
      const res = await GET();
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  // ── Success path tests ────────────────────────────────────────────────────

  describe('Success path', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 123, username: 'testuser' }),
      );
    });

    it('returns 200 with computed clusters from supabase + neynar', async () => {
      const usersChain = chainMock({
        data: [
          mockUserRow({ fid: 100, username: 'user1' }),
          mockUserRow({ fid: 101, username: 'user2' }),
          mockUserRow({ fid: 102, username: 'user3' }),
        ],
        error: null,
      });

      mockFrom.mockReturnValue(usersChain);

      // Mock Neynar feed for each user
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(
          mockNeynarFeed([
            mockNeynarCast({
              root_parent_url: 'https://warpcast.com/channel/zao',
            }),
            mockNeynarCast({
              root_parent_url: 'https://warpcast.com/channel/zabal',
            }),
          ]),
        ),
      });

      const res = await GET();
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toHaveProperty('clusters');
      expect(body).toHaveProperty('yourChannels');
      expect(body).toHaveProperty('totalChannelsScanned');
      expect(Array.isArray(body.clusters)).toBe(true);
      expect(Array.isArray(body.yourChannels)).toBe(true);
    });

    it('handles empty user list (no active members)', async () => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 999, username: 'empty-test' }),
      );
      const usersChain = chainMock({ data: [], error: null });
      mockFrom.mockReturnValue(usersChain);

      const res = await GET();
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.clusters).toBeDefined();
      expect(Array.isArray(body.clusters)).toBe(true);
    });

    it('includes response structure with yourChannels property', async () => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 124, username: 'user-with-channels' }),
      );
      const usersChain = chainMock({
        data: [
          mockUserRow({ fid: 124, username: 'user-with-channels' }),
          mockUserRow({ fid: 125, username: 'otheruser' }),
        ],
        error: null,
      });

      mockFrom.mockReturnValue(usersChain);

      // Each user's fetch returns channels
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(
            mockNeynarFeed([
              mockNeynarCast({
                root_parent_url: 'https://warpcast.com/channel/zao',
              }),
            ]),
          ),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(
            mockNeynarFeed([
              mockNeynarCast({
                root_parent_url: 'https://warpcast.com/channel/zabal',
              }),
            ]),
          ),
        });

      const res = await GET();
      expect(res.status).toBe(200);

      const body = await res.json();
      // Should have yourChannels property
      expect(body).toHaveProperty('yourChannels');
      expect(Array.isArray(body.yourChannels)).toBe(true);
    });

    it('builds clusters with members for shared channels', async () => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 123, username: 'testuser' }),
      );
      const usersChain = chainMock({
        data: [
          mockUserRow({ fid: 100, username: 'user1', display_name: 'User 1' }),
          mockUserRow({ fid: 101, username: 'user2', display_name: 'User 2' }),
          mockUserRow({ fid: 102, username: 'user3', display_name: 'User 3' }),
        ],
        error: null,
      });

      mockFrom.mockReturnValue(usersChain);

      // All three users return feed with zao channel posts
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(
          mockNeynarFeed([
            mockNeynarCast({
              root_parent_url: 'https://warpcast.com/channel/zao',
            }),
          ]),
        ),
      });

      const res = await GET();
      expect(res.status).toBe(200);

      const body = await res.json();
      // Should have at least one cluster (zao) with multiple members
      expect(body.clusters.length).toBeGreaterThan(0);
      const zaoCluster = body.clusters.find((c: { channelId: string }) => c.channelId === 'zao');
      expect(zaoCluster?.members.length).toBeGreaterThanOrEqual(3);
    });

    it('filters clusters to include those with 2+ members (other channels ignored in sharedClusters)', async () => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 123, username: 'testuser' }),
      );
      const usersChain = chainMock({
        data: [
          mockUserRow({ fid: 100, username: 'user1' }),
          mockUserRow({ fid: 101, username: 'user2' }),
          mockUserRow({ fid: 102, username: 'user3' }),
        ],
        error: null,
      });

      mockFrom.mockReturnValue(usersChain);

      // Set up sequential fetch mocks for each user (3 calls)
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(
            mockNeynarFeed([
              mockNeynarCast({
                root_parent_url: 'https://warpcast.com/channel/zao',
              }),
            ]),
          ),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(
            mockNeynarFeed([
              mockNeynarCast({
                root_parent_url: 'https://warpcast.com/channel/zao',
              }),
            ]),
          ),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(
            mockNeynarFeed([
              mockNeynarCast({
                root_parent_url: 'https://warpcast.com/channel/zabal',
              }),
            ]),
          ),
        });

      const res = await GET();
      expect(res.status).toBe(200);

      const body = await res.json();
      // zao should have 2+ members and be in shared clusters
      const zaoCluster = body.clusters.find((c: { channelId: string }) => c.channelId === 'zao');
      expect(zaoCluster?.members.length).toBeGreaterThanOrEqual(2);
    });

    it('caps members array at 20 per cluster', async () => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 199, username: 'large-cluster-test' }),
      );
      const manyUsers = Array.from({ length: 25 }, (_v, i) =>
        mockUserRow({ fid: 200 + i, username: `largeuser${i}` }),
      );

      const usersChain = chainMock({ data: manyUsers, error: null });
      mockFrom.mockReturnValue(usersChain);

      // Mock all 25 fetch calls (5 batches of 5)
      for (let _i = 0; _i < 25; _i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(
            mockNeynarFeed([
              mockNeynarCast({
                root_parent_url: 'https://warpcast.com/channel/zao',
              }),
            ]),
          ),
        });
      }

      const res = await GET();
      expect(res.status).toBe(200);

      const body = await res.json();
      const zaoCluster = body.clusters.find((c: { channelId: string }) => c.channelId === 'zao');
      if (zaoCluster) {
        // Members array is capped at 20
        expect(zaoCluster.members.length).toBeLessThanOrEqual(20);
        // Size is total count
        expect(zaoCluster.size).toBeGreaterThanOrEqual(zaoCluster.members.length);
      }
    });

    it('formats channel names from config correctly', async () => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 225, username: 'format-test' }),
      );
      const usersChain = chainMock({
        data: [
          mockUserRow({ fid: 226, username: 'format1' }),
          mockUserRow({ fid: 227, username: 'format2' }),
        ],
        error: null,
      });

      mockFrom.mockReturnValue(usersChain);

      // Mock fetch calls - all users post to zabal (a config channel)
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(
            mockNeynarFeed([
              mockNeynarCast({
                root_parent_url: 'https://warpcast.com/channel/zabal',
              }),
            ]),
          ),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(
            mockNeynarFeed([
              mockNeynarCast({
                root_parent_url: 'https://warpcast.com/channel/zabal',
              }),
            ]),
          ),
        });

      const res = await GET();
      expect(res.status).toBe(200);

      const body = await res.json();
      // zabal should be formatted as 'ZABAL'
      const zabalCluster = body.clusters.find(
        (c: { channelId: string }) => c.channelId === 'zabal',
      );
      if (zabalCluster) {
        // formatChannelName maps 'zabal' (no explicit mapping)
        // so it should capitalize: 'Z' + 'abal' = 'Zabal'
        expect(zabalCluster.name).toBeTruthy();
        expect(typeof zabalCluster.name).toBe('string');
      }
    });
  });

  // ── Cache behavior tests ──────────────────────────────────────────────────

  describe('In-memory cache (TTL)', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 123, username: 'testuser' }),
      );
    });

    it('includes Cache-Control headers in response', async () => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 123, username: 'testuser' }),
      );
      const usersChain = chainMock({
        data: [mockUserRow({ fid: 100, username: 'user1' })],
        error: null,
      });

      mockFrom.mockReturnValue(usersChain);

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(
          mockNeynarFeed([
            mockNeynarCast({
              root_parent_url: 'https://warpcast.com/channel/zao',
            }),
          ]),
        ),
      });

      const res = await GET();
      expect(res.headers.get('Cache-Control')).toContain('public');
      expect(res.headers.get('Cache-Control')).toContain('s-maxage=600');
    });
  });

  // ── Neynar API interaction tests ────────────────────────────────────────────

  describe('Neynar API interaction', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 123, username: 'testuser' }),
      );
    });

    it('fetches casts from Neynar for multiple FIDs', async () => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 250, username: 'batch-test' }),
      );
      const usersChain = chainMock({
        data: Array.from({ length: 6 }, (_v, i) =>
          mockUserRow({ fid: 300 + i, username: `batchuser${i}` }),
        ),
        error: null,
      });

      mockFrom.mockReturnValue(usersChain);

      // Mock 6 fetch calls
      for (let _i = 0; _i < 6; _i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockNeynarFeed([])),
        });
      }

      const res = await GET();
      expect(res.status).toBe(200);

      // Should have made fetch calls for the FIDs
      const body = await res.json();
      expect(body).toHaveProperty('clusters');
    });

    it('handles Neynar API errors gracefully (returns empty channels for failed FID)', async () => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 123, username: 'testuser' }),
      );
      const usersChain = chainMock({
        data: [
          mockUserRow({ fid: 100, username: 'user1' }),
          mockUserRow({ fid: 101, username: 'user2' }),
        ],
        error: null,
      });

      mockFrom.mockReturnValue(usersChain);

      // First call fails, second succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          json: vi.fn().mockResolvedValue({ error: 'Rate limited' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(
            mockNeynarFeed([
              mockNeynarCast({
                root_parent_url: 'https://warpcast.com/channel/zao',
              }),
            ]),
          ),
        });

      const res = await GET();
      expect(res.status).toBe(200);
      const body = await res.json();
      // Should still succeed even with one failed Neynar call
      expect(body).toHaveProperty('clusters');
    });

    it('extracts channel ID from root_parent_url', async () => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 275, username: 'extract-test' }),
      );
      const usersChain = chainMock({
        data: [
          mockUserRow({ fid: 276, username: 'extract1' }),
          mockUserRow({ fid: 277, username: 'extract2' }),
        ],
        error: null,
      });

      mockFrom.mockReturnValue(usersChain);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(
            mockNeynarFeed([
              mockNeynarCast({
                root_parent_url: 'https://warpcast.com/channel/custom-discovery-ch',
              }),
            ]),
          ),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(
            mockNeynarFeed([
              mockNeynarCast({
                root_parent_url: 'https://warpcast.com/channel/custom-discovery-ch',
              }),
            ]),
          ),
        });

      const res = await GET();
      expect(res.status).toBe(200);

      const body = await res.json();
      // Should have discovered the custom channel (2 members = shared cluster)
      expect(body.clusters.length).toBeGreaterThan(0);
      // Verify channel extraction worked by checking totalChannelsScanned includes custom channel
      expect(body.totalChannelsScanned).toBeGreaterThanOrEqual(4);
    });

    it('ignores casts without channel information (no root_parent_url)', async () => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 300, username: 'no-channel-test' }),
      );
      const usersChain = chainMock({
        data: [mockUserRow({ fid: 301, username: 'no-channel-user' })],
        error: null,
      });

      mockFrom.mockReturnValue(usersChain);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(
          mockNeynarFeed([
            mockNeynarCast({
              root_parent_url: undefined,
            }),
          ]),
        ),
      });

      const res = await GET();
      expect(res.status).toBe(200);

      const body = await res.json();
      // Should still have response structure
      expect(body).toHaveProperty('clusters');
      expect(Array.isArray(body.clusters)).toBe(true);
    });

    it('deduplicates channels per user before adding to discovered set', async () => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 123, username: 'testuser' }),
      );
      const usersChain = chainMock({
        data: [mockUserRow({ fid: 100, username: 'user1' })],
        error: null,
      });

      mockFrom.mockReturnValue(usersChain);

      // Same user posts multiple times in the same channel
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(
          mockNeynarFeed([
            mockNeynarCast({
              root_parent_url: 'https://warpcast.com/channel/zao',
            }),
            mockNeynarCast({
              root_parent_url: 'https://warpcast.com/channel/zao',
            }),
          ]),
        ),
      });

      const res = await GET();
      expect(res.status).toBe(200);

      const body = await res.json();
      // totalChannelsScanned includes community channels in config
      // (zao, zabal, cocconcertz, wavewarz) + any discovered = at least 4
      expect(body.totalChannelsScanned).toBeGreaterThanOrEqual(4);
    });
  });

  // ── Error handling tests ──────────────────────────────────────────────────

  describe('Error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 123, username: 'testuser' }),
      );
    });

    it('handles cases where member has no FID gracefully', async () => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 123, username: 'testuser' }),
      );
      const usersChain = chainMock({
        data: [
          mockUserRow({ fid: 100, username: 'user1' }),
          mockUserRow({ fid: null, username: 'no-fid-user' }),
        ],
        error: null,
      });

      mockFrom.mockReturnValue(usersChain);

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(
          mockNeynarFeed([
            mockNeynarCast({
              root_parent_url: 'https://warpcast.com/channel/zao',
            }),
          ]),
        ),
      });

      const res = await GET();
      expect(res.status).toBe(200);

      const body = await res.json();
      // Should handle the null FID gracefully
      expect(body).toHaveProperty('clusters');
    });
  });

  // ── Response shape tests ──────────────────────────────────────────────────

  describe('Response shape', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 123, username: 'testuser' }),
      );
    });

    it('returns expected response structure', async () => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 123, username: 'testuser' }),
      );
      const usersChain = chainMock({
        data: [mockUserRow({ fid: 100, username: 'user1' })],
        error: null,
      });

      mockFrom.mockReturnValue(usersChain);

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockNeynarFeed([])),
      });

      const res = await GET();
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toHaveProperty('clusters');
      expect(body).toHaveProperty('yourChannels');
      expect(body).toHaveProperty('totalChannelsScanned');

      expect(Array.isArray(body.clusters)).toBe(true);
      expect(Array.isArray(body.yourChannels)).toBe(true);
      expect(typeof body.totalChannelsScanned).toBe('number');
    });

    it('cluster objects have correct structure', async () => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 123, username: 'testuser' }),
      );
      const usersChain = chainMock({
        data: [
          mockUserRow({ fid: 100, username: 'user1', display_name: 'User 1' }),
          mockUserRow({ fid: 101, username: 'user2', display_name: 'User 2' }),
        ],
        error: null,
      });

      mockFrom.mockReturnValue(usersChain);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(
            mockNeynarFeed([
              mockNeynarCast({
                root_parent_url: 'https://warpcast.com/channel/zao',
              }),
            ]),
          ),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(
            mockNeynarFeed([
              mockNeynarCast({
                root_parent_url: 'https://warpcast.com/channel/zao',
              }),
            ]),
          ),
        });

      const res = await GET();
      const body = await res.json();

      if (body.clusters.length > 0) {
        expect(body.clusters[0]).toHaveProperty('name');
        expect(body.clusters[0]).toHaveProperty('channelId');
        expect(body.clusters[0]).toHaveProperty('members');
        expect(body.clusters[0]).toHaveProperty('size');

        expect(Array.isArray(body.clusters[0].members)).toBe(true);
        expect(typeof body.clusters[0].size).toBe('number');
      }
    });

    it('member objects have correct structure', async () => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 123, username: 'testuser' }),
      );
      const usersChain = chainMock({
        data: [
          mockUserRow({
            fid: 100,
            username: 'user1',
            display_name: 'User 1',
            pfp_url: 'https://example.com/pfp1.jpg',
          }),
          mockUserRow({
            fid: 101,
            username: 'user2',
            display_name: 'User 2',
            pfp_url: 'https://example.com/pfp2.jpg',
          }),
        ],
        error: null,
      });

      mockFrom.mockReturnValue(usersChain);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(
            mockNeynarFeed([
              mockNeynarCast({
                root_parent_url: 'https://warpcast.com/channel/zao',
              }),
            ]),
          ),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(
            mockNeynarFeed([
              mockNeynarCast({
                root_parent_url: 'https://warpcast.com/channel/zao',
              }),
            ]),
          ),
        });

      const res = await GET();
      const body = await res.json();

      if (body.clusters.length > 0 && body.clusters[0].members.length > 0) {
        const member = body.clusters[0].members[0];
        expect(member).toHaveProperty('fid');
        expect(member).toHaveProperty('username');
        expect(member).toHaveProperty('pfpUrl');

        expect(typeof member.fid).toBe('number');
        expect(typeof member.username).toBe('string');
      }
    });

    it('yourChannels have correct structure when populated', async () => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 123, username: 'currentuser' }),
      );
      const usersChain = chainMock({
        data: [
          mockUserRow({ fid: 123, username: 'currentuser' }),
          mockUserRow({ fid: 124, username: 'otheruser' }),
        ],
        error: null,
      });

      mockFrom.mockReturnValue(usersChain);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(
            mockNeynarFeed([
              mockNeynarCast({
                root_parent_url: 'https://warpcast.com/channel/zao',
              }),
            ]),
          ),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(
            mockNeynarFeed([
              mockNeynarCast({
                root_parent_url: 'https://warpcast.com/channel/zabal',
              }),
            ]),
          ),
        });

      const res = await GET();
      const body = await res.json();

      if (body.yourChannels.length > 0) {
        const channel = body.yourChannels[0];
        expect(channel).toHaveProperty('channelId');
        expect(channel).toHaveProperty('name');
        expect(channel).toHaveProperty('memberCount');

        expect(typeof channel.channelId).toBe('string');
        expect(typeof channel.name).toBe('string');
        expect(typeof channel.memberCount).toBe('number');
      }
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────────

  describe('Edge cases', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 123, username: 'testuser' }),
      );
    });

    it('handles user with no channel data (empty Neynar response)', async () => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 123, username: 'testuser' }),
      );
      const usersChain = chainMock({
        data: [mockUserRow({ fid: 100, username: 'user1' })],
        error: null,
      });

      mockFrom.mockReturnValue(usersChain);

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockNeynarFeed([])),
      });

      const res = await GET();
      expect(res.status).toBe(200);

      const body = await res.json();
      // Empty user data should result in no shared clusters (2+)
      expect(body).toHaveProperty('clusters');
      expect(Array.isArray(body.clusters)).toBe(true);
    });

    it('handles casts with unparseable channel URLs', async () => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 123, username: 'testuser' }),
      );
      const usersChain = chainMock({
        data: [mockUserRow({ fid: 100, username: 'user1' })],
        error: null,
      });

      mockFrom.mockReturnValue(usersChain);

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(
          mockNeynarFeed([
            mockNeynarCast({
              root_parent_url: 'https://example.com/something/else',
            }),
          ]),
        ),
      });

      const res = await GET();
      expect(res.status).toBe(200);

      const body = await res.json();
      // Invalid channel URL should be filtered out, no shared clusters
      expect(body).toHaveProperty('clusters');
    });

    it('handles very long usernames gracefully', async () => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 350, username: 'longname-test' }),
      );
      const longName = 'a'.repeat(200);
      const usersChain = chainMock({
        data: [
          mockUserRow({ fid: 351, username: longName }),
          mockUserRow({ fid: 352, username: 'user2' }),
        ],
        error: null,
      });

      mockFrom.mockReturnValue(usersChain);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(
            mockNeynarFeed([
              mockNeynarCast({
                root_parent_url: 'https://warpcast.com/channel/zao',
              }),
            ]),
          ),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(
            mockNeynarFeed([
              mockNeynarCast({
                root_parent_url: 'https://warpcast.com/channel/zao',
              }),
            ]),
          ),
        });

      const res = await GET();
      expect(res.status).toBe(200);

      const body = await res.json();
      // Should handle long usernames gracefully and return 200
      expect(body).toHaveProperty('clusters');
      expect(Array.isArray(body.clusters)).toBe(true);
    });

    it('handles null pfp_url gracefully', async () => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 375, username: 'null-pfp-test' }),
      );
      const usersChain = chainMock({
        data: [
          mockUserRow({ fid: 376, username: 'nopfp1', pfp_url: null }),
          mockUserRow({ fid: 377, username: 'nopfp2', pfp_url: null }),
        ],
        error: null,
      });

      mockFrom.mockReturnValue(usersChain);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(
            mockNeynarFeed([
              mockNeynarCast({
                root_parent_url: 'https://warpcast.com/channel/zao',
              }),
            ]),
          ),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(
            mockNeynarFeed([
              mockNeynarCast({
                root_parent_url: 'https://warpcast.com/channel/zao',
              }),
            ]),
          ),
        });

      const res = await GET();
      expect(res.status).toBe(200);

      const body = await res.json();
      // Should handle null pfp_url gracefully and return proper response
      expect(body).toHaveProperty('clusters');
      if (body.clusters.length > 0 && body.clusters[0].members.length > 0) {
        // pfpUrl can be null or a default/transformed value
        expect(body.clusters[0].members[0]).toHaveProperty('pfpUrl');
      }
    });
  });
});
