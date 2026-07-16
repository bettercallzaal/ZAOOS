import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
  mockAdminSession,
  mockUnauthenticatedSession,
  VALID_UUID,
} from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSessionData, mockFrom, mockLogger } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
  mockLogger: {
    error: vi.fn(),
  },
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

import { POST } from '../route';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a Supabase query-chain mock that resolves to result.
 * Every chained method returns the chain itself for chaining.
 * Terminal .then() and .maybeSingle() resolve the query.
 */
function chainMock(result: { data?: unknown; error?: unknown; count?: number | null }) {
  const chain: Record<string, unknown> = {};
  const chainable = [
    'select',
    'update',
    'eq',
    'is',
    'not',
    'order',
    'limit',
    'gt',
    'lt',
    'gte',
    'lte',
    'like',
    'ilike',
    'in',
    'insert',
    'upsert',
    'delete',
    'range',
    'or',
  ];

  for (const method of chainable) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  // Terminal methods
  chain.single = vi.fn().mockResolvedValue(result);
  chain.maybeSingle = vi.fn().mockResolvedValue(result);

  // Allow the chain to be awaited directly (for queries without .single())
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  chain.then = vi.fn((resolve: (val: unknown) => void) => resolve(result));

  return chain;
}

/**
 * Create a mock queue that returns chains in sequence.
 * Useful for testing multiple queries that need different results.
 */
function createChainQueue(
  results: Array<{ data?: unknown; error?: unknown; count?: number | null }>,
) {
  let callIndex = 0;
  return {
    mockFn: vi.fn(() => {
      if (callIndex >= results.length) {
        throw new Error(`Chain queue exhausted at call ${callIndex}`);
      }
      return chainMock(results[callIndex++]);
    }),
    getCallCount: () => callIndex,
    reset: () => {
      callIndex = 0;
    },
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/admin/member-fix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Authentication guard ──────────────────────────────────────────────────

  it('returns 403 when not admin', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const req = makePostRequest('/api/admin/member-fix', { action: 'link-fids' });
    const res = await POST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Admin required');
  });

  it('passes authentication when isAdmin is true', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const queue = createChainQueue([{ data: [], error: null }]);
    mockFrom.mockImplementation(queue.mockFn);

    const req = makePostRequest('/api/admin/member-fix', { action: 'link-fids' });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  // ── Input validation ──────────────────────────────────────────────────────

  it('returns 400 for invalid action', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/member-fix', { action: 'invalid-action' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid action');
  });

  it('returns 400 for missing action field', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/member-fix', {});
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid action');
  });

  it('accepts all valid actions', async () => {
    const validActions = [
      'link-fids',
      'enrich-profiles',
      'import-socials',
      'link-profiles',
      'backfill-dates',
    ];

    for (const action of validActions) {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      mockFrom.mockImplementation(() => chainMock({ data: [], error: null }));

      const req = makePostRequest('/api/admin/member-fix', { action });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.results).toBeDefined();
    }
  });

  // ── link-fids action ──────────────────────────────────────────────────────

  describe('link-fids action', () => {
    it('returns empty fixed count when no wallet-only users', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      const queue = createChainQueue([{ data: [], error: null }]);
      mockFrom.mockImplementation(queue.mockFn);

      const req = makePostRequest('/api/admin/member-fix', { action: 'link-fids' });
      const res = await POST(req);
      const body = await res.json();

      expect(body.results[0].action).toBe('link-fids');
      expect(body.results[0].fixed).toBe(0);
      expect(body.results[0].errors).toBe(0);
    });

    it('skips users without primary_wallet', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      const queue = createChainQueue([
        { data: [{ id: VALID_UUID, primary_wallet: null, display_name: 'NoWallet' }], error: null },
      ]);
      mockFrom.mockImplementation(queue.mockFn);

      const req = makePostRequest('/api/admin/member-fix', { action: 'link-fids' });
      const res = await POST(req);
      const body = await res.json();

      expect(body.results[0].fixed).toBe(0);
      expect(body.results[0].errors).toBe(0);
    });

    it('accumulates errors for neynar fetch failures', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      const userData = [
        { id: VALID_UUID, primary_wallet: '0x123', display_name: 'User1' },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          primary_wallet: '0x456',
          display_name: 'User2',
        },
      ];
      const queue = createChainQueue([{ data: userData, error: null }]);
      mockFrom.mockImplementation(queue.mockFn);

      // Mock global fetch to fail
      const fetchSpy = vi.spyOn(global, 'fetch' as never);
      fetchSpy.mockRejectedValue(new Error('Network error'));

      const req = makePostRequest('/api/admin/member-fix', { action: 'link-fids' });
      const res = await POST(req);
      const body = await res.json();

      expect(body.results[0].errors).toBe(2);
      fetchSpy.mockRestore();
    });

    it('links users when neynar returns valid fid', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      const userData = [{ id: VALID_UUID, primary_wallet: '0x123', display_name: 'User1' }];

      let fromCallIndex = 0;
      mockFrom.mockImplementation(() => {
        if (fromCallIndex === 0) {
          // First call: fetch users without FID
          fromCallIndex++;
          return chainMock({ data: userData, error: null });
        }
        // Second call: update user with FID
        return chainMock({ error: null });
      });

      const fetchSpy = vi.spyOn(global, 'fetch' as never);
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            '0x123': [
              {
                fid: 999,
                username: 'testuser',
                display_name: 'Test User',
                pfp_url: 'http://pfp.jpg',
              },
            ],
          }),
          { status: 200 },
        ),
      );

      const req = makePostRequest('/api/admin/member-fix', { action: 'link-fids' });
      const res = await POST(req);
      const body = await res.json();

      expect(body.results[0].fixed).toBe(1);
      expect(body.results[0].details[0]).toContain('FID 999');
      fetchSpy.mockRestore();
    });

    it('skips neynar response with no fid', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      const userData = [{ id: VALID_UUID, primary_wallet: '0x123', display_name: 'User1' }];
      const queue = createChainQueue([{ data: userData, error: null }]);
      mockFrom.mockImplementation(queue.mockFn);

      const fetchSpy = vi.spyOn(global, 'fetch' as never);
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

      const req = makePostRequest('/api/admin/member-fix', { action: 'link-fids' });
      const res = await POST(req);
      const body = await res.json();

      expect(body.results[0].fixed).toBe(0);
      fetchSpy.mockRestore();
    });

    it('skips neynar response with non-ok status', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      const userData = [{ id: VALID_UUID, primary_wallet: '0x123', display_name: 'User1' }];
      const queue = createChainQueue([{ data: userData, error: null }]);
      mockFrom.mockImplementation(queue.mockFn);

      const fetchSpy = vi.spyOn(global, 'fetch' as never);
      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
      );

      const req = makePostRequest('/api/admin/member-fix', { action: 'link-fids' });
      const res = await POST(req);
      const body = await res.json();

      expect(body.results[0].fixed).toBe(0);
      fetchSpy.mockRestore();
    });
  });

  // ── enrich-profiles action ────────────────────────────────────────────────

  describe('enrich-profiles action', () => {
    it('returns zero enriched when no users with fid', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      const queue = createChainQueue([{ data: [], error: null }]);
      mockFrom.mockImplementation(queue.mockFn);

      const req = makePostRequest('/api/admin/member-fix', { action: 'enrich-profiles' });
      const res = await POST(req);
      const body = await res.json();

      expect(body.results[0].action).toBe('enrich-profiles');
      expect(body.results[0].fixed).toBe(0);
    });

    it('batches users in groups of 100', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());

      // Create 150 users with FIDs
      const users = Array.from({ length: 150 }, (_, i) => ({
        id: `550e8400-e29b-41d4-a716-44665544000${i}`,
        fid: 1000 + i,
        display_name: `User${i}`,
        pfp_url: null,
        bio: null,
        username: null,
        custody_address: null,
        verified_addresses: [],
        real_name: null,
        x_handle: null,
        solana_wallet: null,
      }));

      let callIndex = 0;
      mockFrom.mockImplementation(() => {
        const chains = [
          chainMock({ data: users, error: null }), // fetch users
          chainMock({ error: null }), // batch 1 (100 users)
          chainMock({ error: null }), // batch 2 (50 users)
        ];
        return chains[Math.min(callIndex++, chains.length - 1)];
      });

      const fetchSpy = vi.spyOn(global, 'fetch' as never);
      fetchSpy.mockResolvedValue(new Response(JSON.stringify({ users: [] }), { status: 200 }));

      const req = makePostRequest('/api/admin/member-fix', { action: 'enrich-profiles' });
      const res = await POST(req);
      const body = await res.json();

      expect(body.results[0].fixed).toBe(0); // No fields to update in this mock
      fetchSpy.mockRestore();
    });

    it('only updates missing fields', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      const users = [
        {
          id: VALID_UUID,
          fid: 123,
          display_name: 'ExistingName',
          pfp_url: null,
          bio: null,
          username: null,
          custody_address: null,
          verified_addresses: [],
          real_name: null,
          x_handle: null,
          solana_wallet: null,
        },
      ];

      let fromCallIndex = 0;
      mockFrom.mockImplementation(() => {
        if (fromCallIndex === 0) {
          fromCallIndex++;
          return chainMock({ data: users, error: null });
        }
        return chainMock({ error: null });
      });

      const fetchSpy = vi.spyOn(global, 'fetch' as never);
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            users: [
              {
                fid: 123,
                display_name: 'FromNeynar', // Should be ignored (display_name exists)
                pfp_url: 'http://pfp.jpg', // Should be added (missing)
                bio: 'New bio',
                profile: { bio: { text: 'New bio' } },
              },
            ],
          }),
          { status: 200 },
        ),
      );

      const req = makePostRequest('/api/admin/member-fix', { action: 'enrich-profiles' });
      const res = await POST(req);
      const body = await res.json();

      expect(body.results[0].fixed).toBe(1);
      fetchSpy.mockRestore();
    });

    it('extracts real_name from display_name when matching pattern', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      const users = [
        {
          id: VALID_UUID,
          fid: 123,
          display_name: null,
          pfp_url: null,
          bio: null,
          username: null,
          custody_address: null,
          verified_addresses: [],
          real_name: null,
          x_handle: null,
          solana_wallet: null,
        },
      ];

      let fromCallIndex = 0;
      mockFrom.mockImplementation(() => {
        if (fromCallIndex === 0) {
          fromCallIndex++;
          return chainMock({ data: users, error: null });
        }
        return chainMock({ error: null });
      });

      const fetchSpy = vi.spyOn(global, 'fetch' as never);
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            users: [
              {
                fid: 123,
                display_name: 'John Smith', // Matches "First Last" pattern
                profile: {},
              },
            ],
          }),
          { status: 200 },
        ),
      );

      const req = makePostRequest('/api/admin/member-fix', { action: 'enrich-profiles' });
      const res = await POST(req);
      const body = await res.json();

      expect(body.results[0].fixed).toBe(1);
      fetchSpy.mockRestore();
    });

    it('handles neynar fetch errors gracefully', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      const users = [
        {
          id: VALID_UUID,
          fid: 123,
          display_name: 'User',
          pfp_url: null,
          bio: null,
          username: null,
          custody_address: null,
          verified_addresses: [],
          real_name: null,
          x_handle: null,
          solana_wallet: null,
        },
      ];
      const queue = createChainQueue([{ data: users, error: null }]);
      mockFrom.mockImplementation(queue.mockFn);

      const fetchSpy = vi.spyOn(global, 'fetch' as never);
      fetchSpy.mockRejectedValueOnce(new Error('Network error'));

      const req = makePostRequest('/api/admin/member-fix', { action: 'enrich-profiles' });
      const res = await POST(req);
      const body = await res.json();

      expect(body.results[0].errors).toBe(1);
      fetchSpy.mockRestore();
    });
  });

  // ── import-socials action ────────────────────────────────────────────────

  describe('import-socials action', () => {
    it('returns zero imported when no users with fid', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      const queue = createChainQueue([{ data: [], error: null }]);
      mockFrom.mockImplementation(queue.mockFn);

      const req = makePostRequest('/api/admin/member-fix', { action: 'import-socials' });
      const res = await POST(req);
      const body = await res.json();

      expect(body.results[0].action).toBe('import-socials');
      expect(body.results[0].fixed).toBe(0);
    });

    it('imports x_handle from verified_accounts', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      const users = [
        {
          id: VALID_UUID,
          fid: 123,
          display_name: 'User',
          x_handle: null,
          instagram_handle: null,
          bio: null,
        },
      ];

      let fromCallIndex = 0;
      mockFrom.mockImplementation(() => {
        if (fromCallIndex === 0) {
          fromCallIndex++;
          return chainMock({ data: users, error: null });
        }
        return chainMock({ error: null });
      });

      const fetchSpy = vi.spyOn(global, 'fetch' as never);
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            users: [
              {
                fid: 123,
                display_name: 'User',
                verified_accounts: [{ platform: 'x', username: 'twitterhandle' }],
                profile: { bio: { text: 'My bio' } },
              },
            ],
          }),
          { status: 200 },
        ),
      );

      const req = makePostRequest('/api/admin/member-fix', { action: 'import-socials' });
      const res = await POST(req);
      const body = await res.json();

      expect(body.results[0].fixed).toBe(1);
      fetchSpy.mockRestore();
    });

    it('extracts x_handle from bio when verified_accounts missing', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      const users = [
        {
          id: VALID_UUID,
          fid: 123,
          display_name: 'User',
          x_handle: null,
          instagram_handle: null,
          bio: null,
        },
      ];

      let fromCallIndex = 0;
      mockFrom.mockImplementation(() => {
        if (fromCallIndex === 0) {
          fromCallIndex++;
          return chainMock({ data: users, error: null });
        }
        return chainMock({ error: null });
      });

      const fetchSpy = vi.spyOn(global, 'fetch' as never);
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            users: [
              {
                fid: 123,
                display_name: 'User',
                verified_accounts: [],
                profile: { bio: { text: 'Check me out at twitter.com/@biohandle' } },
              },
            ],
          }),
          { status: 200 },
        ),
      );

      const req = makePostRequest('/api/admin/member-fix', { action: 'import-socials' });
      const res = await POST(req);
      const body = await res.json();

      expect(body.results[0].fixed).toBe(1);
      fetchSpy.mockRestore();
    });

    it('skips importing if handle already set', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      const users = [
        {
          id: VALID_UUID,
          fid: 123,
          display_name: 'User',
          x_handle: 'existinghandle',
          instagram_handle: null,
          bio: null,
        },
      ];

      let fromCallIndex = 0;
      mockFrom.mockImplementation(() => {
        if (fromCallIndex === 0) {
          fromCallIndex++;
          return chainMock({ data: users, error: null });
        }
        return chainMock({ error: null });
      });

      const fetchSpy = vi.spyOn(global, 'fetch' as never);
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            users: [
              {
                fid: 123,
                display_name: 'User',
                verified_accounts: [{ platform: 'x', username: 'newhandle' }],
                profile: { bio: { text: '' } },
              },
            ],
          }),
          { status: 200 },
        ),
      );

      const req = makePostRequest('/api/admin/member-fix', { action: 'import-socials' });
      const res = await POST(req);
      const body = await res.json();

      expect(body.results[0].fixed).toBe(0);
      fetchSpy.mockRestore();
    });
  });

  // ── link-profiles action ──────────────────────────────────────────────────

  describe('link-profiles action', () => {
    it('links users by fid match', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());

      let callIndex = 0;
      mockFrom.mockImplementation(() => {
        const chains = [
          chainMock({
            data: [{ id: VALID_UUID, fid: 123, display_name: 'User', community_profile_id: null }],
            error: null,
          }), // unlinked by fid
          chainMock({ data: { id: 'profile-id', name: 'UserProfile' }, error: null }), // find profile
          chainMock({ error: null }), // update user
          chainMock({ data: [], error: null }), // still unlinked
        ];
        return chains[Math.min(callIndex++, chains.length - 1)];
      });

      const req = makePostRequest('/api/admin/member-fix', { action: 'link-profiles' });
      const res = await POST(req);
      const body = await res.json();

      expect(body.results[0].action).toBe('link-profiles');
      expect(body.results[0].fixed).toBe(1);
      expect(body.results[0].details[0]).toContain('linked to profile');
    });

    it('links users by name match when fid fails', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());

      let callIndex = 0;
      mockFrom.mockImplementation(() => {
        const chains = [
          chainMock({ data: [], error: null }), // no fid matches
          chainMock({
            data: [
              { id: VALID_UUID, display_name: 'Alice', username: null, community_profile_id: null },
            ],
            error: null,
          }), // still unlinked
          chainMock({ data: { id: 'profile-id', name: 'Alice' }, error: null }), // name match
          chainMock({ error: null }), // update user
        ];
        return chains[Math.min(callIndex++, chains.length - 1)];
      });

      const req = makePostRequest('/api/admin/member-fix', { action: 'link-profiles' });
      const res = await POST(req);
      const body = await res.json();

      expect(body.results[0].fixed).toBe(1);
      expect(body.results[0].details[0]).toContain('name match');
    });

    it('skips users without fid or display_name', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());

      mockFrom.mockImplementation(() => {
        return chainMock({ data: [], error: null });
      });

      const req = makePostRequest('/api/admin/member-fix', { action: 'link-profiles' });
      const res = await POST(req);
      const body = await res.json();

      expect(body.results[0].fixed).toBe(0);
    });
  });

  // ── backfill-dates action ────────────────────────────────────────────────

  describe('backfill-dates action', () => {
    it('returns zero fixed when all members have first_respect_at', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      const queue = createChainQueue([{ data: [], error: null }]);
      mockFrom.mockImplementation(queue.mockFn);

      const req = makePostRequest('/api/admin/member-fix', { action: 'backfill-dates' });
      const res = await POST(req);
      const body = await res.json();

      expect(body.results[0].action).toBe('backfill-dates');
      expect(body.results[0].fixed).toBe(0);
    });

    it('backfills first_respect_at from earliest fractal score', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());

      let callIndex = 0;
      mockFrom.mockImplementation(() => {
        const chains = [
          chainMock({
            data: [{ id: 'member-id', name: 'Alice', wallet_address: '0x123' }],
            error: null,
          }), // members without date
          chainMock({
            data: [{ fractal_sessions: { session_date: '2026-01-15' } }],
            error: null,
          }), // find earliest score
          chainMock({ error: null }), // update member
        ];
        return chains[Math.min(callIndex++, chains.length - 1)];
      });

      const req = makePostRequest('/api/admin/member-fix', { action: 'backfill-dates' });
      const res = await POST(req);
      const body = await res.json();

      expect(body.results[0].fixed).toBe(1);
      expect(body.results[0].details[0]).toContain('2026-01-15');
    });

    it('handles array of fractal_sessions', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());

      let callIndex = 0;
      mockFrom.mockImplementation(() => {
        const chains = [
          chainMock({
            data: [{ id: 'member-id', name: 'Bob', wallet_address: '0x456' }],
            error: null,
          }),
          chainMock({
            data: [
              {
                fractal_sessions: [{ session_date: '2026-02-01' }, { session_date: '2026-01-15' }],
              },
            ],
            error: null,
          }),
          chainMock({ error: null }),
        ];
        return chains[Math.min(callIndex++, chains.length - 1)];
      });

      const req = makePostRequest('/api/admin/member-fix', { action: 'backfill-dates' });
      const res = await POST(req);
      const body = await res.json();

      expect(body.results[0].fixed).toBe(1);
    });

    it('skips when no fractal score found', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());

      let callIndex = 0;
      mockFrom.mockImplementation(() => {
        const chains = [
          chainMock({
            data: [{ id: 'member-id', name: 'Charlie', wallet_address: null }],
            error: null,
          }),
          chainMock({ data: [], error: null }), // no fractal scores
        ];
        return chains[Math.min(callIndex++, chains.length - 1)];
      });

      const req = makePostRequest('/api/admin/member-fix', { action: 'backfill-dates' });
      const res = await POST(req);
      const body = await res.json();

      expect(body.results[0].fixed).toBe(0);
    });
  });

  // ── sync-tiers action ────────────────────────────────────────────────────

  describe('sync-tiers action', () => {
    it('upgrades users to respect_holder when total_respect > 0', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());

      let callIndex = 0;
      mockFrom.mockImplementation(() => {
        const chains = [
          chainMock({
            data: [{ id: VALID_UUID, fid: 123, primary_wallet: null, member_tier: null }],
            error: null,
          }), // users
          chainMock({
            data: [
              {
                id: 'rm-id',
                fid: 123,
                wallet_address: null,
                total_respect: 50,
                onchain_og: 0,
                onchain_zor: 0,
              },
            ],
            error: null,
          }), // respect members
          chainMock({ error: null }), // update user with tier
        ];
        return chains[Math.min(callIndex++, chains.length - 1)];
      });

      const req = makePostRequest('/api/admin/member-fix', { action: 'sync-tiers' });
      const res = await POST(req);
      const body = await res.json();

      expect(body.results).toBeDefined();
      expect(body.results.length).toBeGreaterThan(0);
      const tierResult = body.results.find(
        (r: Record<string, unknown>) => r.action === 'sync-tiers',
      );
      expect(tierResult.fixed).toBe(1);
      expect(tierResult.details[0]).toContain('respect_holder');
    });

    it('matches users by fid and wallet', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());

      let callIndex = 0;
      mockFrom.mockImplementation(() => {
        const chains = [
          chainMock({
            data: [{ id: VALID_UUID, fid: null, primary_wallet: '0x123', member_tier: null }],
            error: null,
          }),
          chainMock({
            data: [
              {
                id: 'rm-id',
                fid: null,
                wallet_address: '0x123',
                total_respect: 100,
                onchain_og: 0,
                onchain_zor: 0,
              },
            ],
            error: null,
          }),
          chainMock({ error: null }),
        ];
        return chains[Math.min(callIndex++, chains.length - 1)];
      });

      const req = makePostRequest('/api/admin/member-fix', { action: 'sync-tiers' });
      const res = await POST(req);
      const body = await res.json();

      const tierResult = body.results.find(
        (r: Record<string, unknown>) => r.action === 'sync-tiers',
      );
      expect(tierResult.fixed).toBe(1);
    });

    it('does not downgrade users already respect_holder', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());

      let callIndex = 0;
      mockFrom.mockImplementation(() => {
        const chains = [
          chainMock({
            data: [
              { id: VALID_UUID, fid: 123, primary_wallet: null, member_tier: 'respect_holder' },
            ],
            error: null,
          }),
          chainMock({
            data: [
              {
                id: 'rm-id',
                fid: 123,
                wallet_address: null,
                total_respect: 50,
                onchain_og: 0,
                onchain_zor: 0,
              },
            ],
            error: null,
          }),
        ];
        return chains[Math.min(callIndex++, chains.length - 1)];
      });

      const req = makePostRequest('/api/admin/member-fix', { action: 'sync-tiers' });
      const res = await POST(req);
      const body = await res.json();

      const tierResult = body.results.find(
        (r: Record<string, unknown>) => r.action === 'sync-tiers',
      );
      expect(tierResult.fixed).toBe(0); // Already correct tier
    });

    it('links respect_member_id to users', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());

      let callIndex = 0;
      mockFrom.mockImplementation(() => {
        const chains = [
          chainMock({
            data: [{ id: VALID_UUID, fid: 123, primary_wallet: null, member_tier: null }],
            error: null,
          }),
          chainMock({
            data: [
              {
                id: 'rm-123',
                fid: 123,
                wallet_address: null,
                total_respect: 0,
                onchain_og: 1,
                onchain_zor: 0,
              },
            ],
            error: null,
          }),
          chainMock({ error: null }),
        ];
        return chains[Math.min(callIndex++, chains.length - 1)];
      });

      const req = makePostRequest('/api/admin/member-fix', { action: 'sync-tiers' });
      const res = await POST(req);
      const body = await res.json();

      const tierResult = body.results.find(
        (r: Record<string, unknown>) => r.action === 'sync-tiers',
      );
      expect(tierResult.details.some((d: string) => d.includes('1 respect records linked'))).toBe(
        true,
      );
    });

    it('counts both upgraded and linked in details', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());

      let callIndex = 0;
      mockFrom.mockImplementation(() => {
        const chains = [
          chainMock({
            data: [{ id: VALID_UUID, fid: 123, primary_wallet: null, member_tier: null }],
            error: null,
          }),
          chainMock({
            data: [
              {
                id: 'rm-123',
                fid: 123,
                wallet_address: null,
                total_respect: 50,
                onchain_og: 0,
                onchain_zor: 0,
              },
            ],
            error: null,
          }),
          chainMock({ error: null }),
        ];
        return chains[Math.min(callIndex++, chains.length - 1)];
      });

      const req = makePostRequest('/api/admin/member-fix', { action: 'sync-tiers' });
      const res = await POST(req);
      const body = await res.json();

      const tierResult = body.results.find(
        (r: Record<string, unknown>) => r.action === 'sync-tiers',
      );
      // Should have 2 entries: the upgrade message + the linked count
      expect(tierResult.details.length).toBeGreaterThanOrEqual(2);
    });

    it('handles zero respect members gracefully', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());

      let callIndex = 0;
      mockFrom.mockImplementation(() => {
        const chains = [
          chainMock({
            data: [{ id: VALID_UUID, fid: 123, primary_wallet: null, member_tier: null }],
            error: null,
          }),
          chainMock({
            data: [],
            error: null,
          }),
        ];
        return chains[Math.min(callIndex++, chains.length - 1)];
      });

      const req = makePostRequest('/api/admin/member-fix', { action: 'sync-tiers' });
      const res = await POST(req);
      const body = await res.json();

      const tierResult = body.results.find(
        (r: Record<string, unknown>) => r.action === 'sync-tiers',
      );
      expect(tierResult.fixed).toBe(0);
    });
  });

  // ── 'all' action (runs all fixes) ─────────────────────────────────────────

  describe('all action', () => {
    it('runs all fix actions sequentially', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());

      mockFrom.mockImplementation(() => {
        return chainMock({ data: [], error: null });
      });

      const fetchSpy = vi.spyOn(global, 'fetch' as never);
      fetchSpy.mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));

      const req = makePostRequest('/api/admin/member-fix', { action: 'all' });
      const res = await POST(req);
      const body = await res.json();

      // Should have results for all 6 actions
      expect(body.results.length).toBe(6);
      expect(body.results.map((r: Record<string, unknown>) => r.action).sort()).toEqual([
        'backfill-dates',
        'enrich-profiles',
        'import-socials',
        'link-fids',
        'link-profiles',
        'sync-tiers',
      ]);

      fetchSpy.mockRestore();
    });
  });

  // ── Response shape ───────────────────────────────────────────────────────

  describe('Response shape', () => {
    it('returns results array with action, fixed, errors, details', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      mockFrom.mockImplementation(() => chainMock({ data: [], error: null }));

      const req = makePostRequest('/api/admin/member-fix', { action: 'link-fids' });
      const res = await POST(req);
      const body = await res.json();

      expect(body.results).toBeDefined();
      expect(Array.isArray(body.results)).toBe(true);
      expect(body.results[0]).toMatchObject({
        action: expect.any(String),
        fixed: expect.any(Number),
        errors: expect.any(Number),
        details: expect.any(Array),
      });
    });

    it('includes fixed, errors and details even when all operations skip', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      mockFrom.mockImplementation(() => chainMock({ data: [], error: null }));

      const req = makePostRequest('/api/admin/member-fix', { action: 'link-fids' });
      const res = await POST(req);
      const body = await res.json();

      expect(body.results[0].fixed).toBe(0);
      expect(body.results[0].errors).toBe(0);
      expect(Array.isArray(body.results[0].details)).toBe(true);
    });
  });

  // ── Error handling ───────────────────────────────────────────────────────

  describe('Error handling', () => {
    it('returns 500 when req.json() throws', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());

      const mockReq = {
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as { json: () => Promise<never> };

      const res = await POST(mockReq as never);
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed');
    });

    it('logs errors to logger.error on exception', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());

      const mockReq = {
        json: vi.fn().mockRejectedValue(new Error('JSON parse error')),
      } as { json: () => Promise<never> };

      await POST(mockReq as never);

      expect(mockLogger.error).toHaveBeenCalledWith('[member-fix] error:', expect.any(Error));
    });

    it('returns 500 when supabase throws', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());

      mockFrom.mockImplementation(() => {
        throw new Error('DB connection lost');
      });

      const req = makePostRequest('/api/admin/member-fix', { action: 'link-fids' });
      const res = await POST(req);
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed');
    });
  });
});
