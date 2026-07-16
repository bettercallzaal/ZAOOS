import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
  mockAdminSession,
  mockAuthenticatedSession,
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

import { GET, PATCH } from '../route';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a Supabase query-chain mock that resolves to result.
 * Every chained method returns the chain itself for chaining.
 * Terminal .then() resolves the query (for awaited direct chains).
 * Includes all methods used by member-fid route: select, update, eq, is, order, not
 */
function chainMock(result: { data?: unknown; error?: unknown; count?: number | null }) {
  const chain: Record<string, unknown> = {};
  const chainable = ['select', 'update', 'eq', 'is', 'order', 'not', 'gt', 'lt'];

  for (const method of chainable) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  // Terminal — resolves the query
  chain.single = vi.fn().mockResolvedValue(result);

  // Allow the chain to be awaited directly (for queries without .single())
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  chain.then = vi.fn((resolve: (val: unknown) => void) => resolve(result));

  return chain;
}

/**
 * Create a mock queue that returns chains in sequence for parallel queries.
 * Useful for testing multiple parallel queries that need different results.
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
  };
}

describe('GET /api/admin/member-fid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Authentication tests ──────────────────────────────────────────────────

  it('returns 401 when not authenticated (no session)', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 403 when authenticated but not admin', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ isAdmin: false }));
    const res = await GET();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Admin access required');
  });

  it('passes authentication when isAdmin is true', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { data: [], error: null }, // members without FID
      { count: 50, error: null }, // totalWithFid
      { count: 100, error: null }, // totalMembers
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    expect(res.status).toBe(200);
    expect(queue.getCallCount()).toBe(3);
  });

  // ── Success path: member groups by priority ───────────────────────────────

  it('returns members grouped by priority (active, onchainOnly, inactive)', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const membersData = [
      {
        id: VALID_UUID,
        name: 'Alice',
        wallet_address: '0x1',
        fid: null,
        total_respect: 100,
        fractal_count: 2,
        onchain_og: 1,
      },
      {
        id: VALID_UUID,
        name: 'Bob',
        wallet_address: '0x2',
        fid: null,
        total_respect: 80,
        fractal_count: 0,
        onchain_og: 1,
      },
      {
        id: VALID_UUID,
        name: 'Charlie',
        wallet_address: '0x3',
        fid: null,
        total_respect: 50,
        fractal_count: 0,
        onchain_og: 0,
      },
    ];

    const queue = createChainQueue([
      { data: membersData, error: null }, // members without FID
      { count: 80, error: null }, // totalWithFid
      { count: 100, error: null }, // totalMembers
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    // Alice has fractal_count > 0 → active
    expect(body.active).toHaveLength(1);
    expect(body.active[0].name).toBe('Alice');

    // Bob has fractal_count = 0 but onchain_og > 0 → onchainOnly
    expect(body.onchainOnly).toHaveLength(1);
    expect(body.onchainOnly[0].name).toBe('Bob');

    // Charlie has fractal_count = 0 and onchain_og = 0 → inactive
    expect(body.inactive).toHaveLength(1);
    expect(body.inactive[0].name).toBe('Charlie');
  });

  it('returns correct stats: totalMembers, withFid, missingFid', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const membersData = [
      {
        id: VALID_UUID,
        name: 'Alice',
        wallet_address: '0x1',
        fid: null,
        total_respect: 100,
        fractal_count: 2,
        onchain_og: 1,
      },
    ];

    const queue = createChainQueue([
      { data: membersData, error: null }, // members without FID
      { count: 75, error: null }, // totalWithFid
      { count: 100, error: null }, // totalMembers
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    expect(body.stats).toEqual({
      totalMembers: 100,
      withFid: 75,
      missingFid: 1, // length of membersData
    });
  });

  it('handles empty members list (all have FID)', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { data: [], error: null }, // no members without FID
      { count: 100, error: null }, // totalWithFid
      { count: 100, error: null }, // totalMembers
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    expect(body.active).toEqual([]);
    expect(body.onchainOnly).toEqual([]);
    expect(body.inactive).toEqual([]);
    expect(body.stats.missingFid).toBe(0);
  });

  it('calls supabase with correct filters (.is and .order)', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain1 = chainMock({ data: [], error: null });
    const chain2 = chainMock({ count: 50, error: null });
    const chain3 = chainMock({ count: 100, error: null });

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      const chains = [chain1, chain2, chain3];
      return chains[callIndex++];
    });

    await GET();

    // First call: from('respect_members').select(...).is('fid', null).order(...)
    expect(chain1.is).toHaveBeenCalledWith('fid', null);
    expect(chain1.order).toHaveBeenCalledWith('total_respect', { ascending: false });

    // Subsequent calls should be from() calls with select and count options
    expect(mockFrom).toHaveBeenNthCalledWith(1, 'respect_members');
    expect(mockFrom).toHaveBeenNthCalledWith(2, 'respect_members');
    expect(mockFrom).toHaveBeenNthCalledWith(3, 'respect_members');
  });

  it('handles null counts as 0 in stats', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { data: [], error: null },
      { count: null, error: null }, // totalWithFid null
      { count: null, error: null }, // totalMembers null
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    expect(body.stats.totalMembers).toBe(0);
    expect(body.stats.withFid).toBe(0);
  });

  it('returns response with exact shape on success', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { data: [], error: null },
      { count: 50, error: null },
      { count: 100, error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    expect(Object.keys(body).sort()).toEqual(['active', 'inactive', 'onchainOnly', 'stats'].sort());
    expect(Object.keys(body.stats).sort()).toEqual(
      ['missingFid', 'totalMembers', 'withFid'].sort(),
    );
  });

  // ── Error path: exception thrown ──────────────────────────────────────────

  it('returns 500 when DB query throws', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    mockFrom.mockImplementation(() => {
      throw new Error('DB connection lost');
    });

    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to load members');
  });

  it('logs errors to logger.error', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    mockFrom.mockImplementation(() => {
      throw new Error('DB error');
    });

    await GET();

    expect(mockLogger.error).toHaveBeenCalledWith('Member FID list error:', expect.any(Error));
  });

  it('handles data.error from Supabase', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { data: null, error: { message: 'permission denied' } }, // Supabase error
      { count: 50, error: null },
      { count: 100, error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    // Route doesn't explicitly check error field, but || fallback handles null data
    const res = await GET();
    expect(res.status).toBe(200); // Trusts the structure; relies on || [] fallback
    const body = await res.json();
    expect(body.active).toEqual([]);
  });

  // ── Grouping logic edge cases ────────────────────────────────────────────

  it('prioritizes fractal_count over onchain_og (active > onchainOnly)', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const membersData = [
      {
        id: VALID_UUID,
        name: 'OnchainAndFractal',
        wallet_address: '0x1',
        fid: null,
        total_respect: 100,
        fractal_count: 1,
        onchain_og: 5,
      },
    ];

    const queue = createChainQueue([
      { data: membersData, error: null },
      { count: 50, error: null },
      { count: 100, error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    // fractal_count > 0 means active, even if onchain_og is high
    expect(body.active).toHaveLength(1);
    expect(body.onchainOnly).toHaveLength(0);
  });

  it('filters onchainOnly members correctly (fractal_count=0 AND onchain_og>0)', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const membersData = [
      {
        id: VALID_UUID,
        name: 'OnchainOnly',
        wallet_address: '0x1',
        fid: null,
        total_respect: 100,
        fractal_count: 0,
        onchain_og: 1,
      },
      {
        id: VALID_UUID,
        name: 'Inactive',
        wallet_address: '0x2',
        fid: null,
        total_respect: 50,
        fractal_count: 0,
        onchain_og: 0,
      },
    ];

    const queue = createChainQueue([
      { data: membersData, error: null },
      { count: 50, error: null },
      { count: 100, error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    expect(body.onchainOnly).toHaveLength(1);
    expect(body.onchainOnly[0].name).toBe('OnchainOnly');
    expect(body.inactive).toHaveLength(1);
    expect(body.inactive[0].name).toBe('Inactive');
  });

  it('handles numeric coercion (string fractal_count from DB)', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    // Supabase may return numeric fields as strings in some contexts
    const membersData = [
      {
        id: VALID_UUID,
        name: 'Member',
        wallet_address: '0x1',
        fid: null,
        total_respect: 100,
        fractal_count: '5',
        onchain_og: '1',
      },
    ];

    const queue = createChainQueue([
      { data: membersData, error: null },
      { count: 50, error: null },
      { count: 100, error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    // Number('5') = 5 > 0 → active
    expect(body.active).toHaveLength(1);
  });
});

describe('PATCH /api/admin/member-fid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Authentication tests ──────────────────────────────────────────────────

  it('returns 401 when not authenticated (no session)', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const req = makePostRequest('/api/admin/member-fid', { updates: [] });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 403 when authenticated but not admin', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ isAdmin: false }));
    const req = makePostRequest('/api/admin/member-fid', { updates: [] });
    const res = await PATCH(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Admin access required');
  });

  // ── Input validation tests ────────────────────────────────────────────────

  it('returns 400 for missing updates field', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/member-fid', {});
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('returns 400 for updates not an array', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/member-fid', { updates: 'not-an-array' });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 for empty updates array', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/member-fid', { updates: [] });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 for updates array exceeding max length (100)', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const tooManyUpdates = Array.from({ length: 101 }, (_, i) => ({
      memberId: VALID_UUID,
      fid: 1000 + i,
    }));

    const req = makePostRequest('/api/admin/member-fid', { updates: tooManyUpdates });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 for missing memberId in update object', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/member-fid', {
      updates: [{ fid: 1234 }], // missing memberId
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 for memberId not a UUID', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/member-fid', {
      updates: [{ memberId: 'not-a-uuid', fid: 1234 }],
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 for missing fid in update object', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/member-fid', {
      updates: [{ memberId: VALID_UUID }], // missing fid
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 for fid not a number', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/member-fid', {
      updates: [{ memberId: VALID_UUID, fid: 'not-a-number' }],
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 for fid not an integer', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/member-fid', {
      updates: [{ memberId: VALID_UUID, fid: 1234.56 }],
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 for fid not positive', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/member-fid', {
      updates: [{ memberId: VALID_UUID, fid: 0 }],
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 for negative fid', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/member-fid', {
      updates: [{ memberId: VALID_UUID, fid: -123 }],
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('includes flattened error details in 400 response', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/member-fid', { updates: [] });
    const res = await PATCH(req);
    const body = await res.json();

    expect(body.details).toBeDefined();
    expect(body.details.fieldErrors || body.details.formErrors).toBeDefined();
  });

  // ── Success path: batch updates ───────────────────────────────────────────

  it('updates single member and returns success count', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain = chainMock({ error: null });
    mockFrom.mockReturnValue(chain);

    const req = makePostRequest('/api/admin/member-fid', {
      updates: [{ memberId: VALID_UUID, fid: 1234 }],
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.updated).toBe(1);
    expect(body.errors).toEqual([]);
  });

  it('updates multiple members in a batch', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain = chainMock({ error: null });
    mockFrom.mockReturnValue(chain);

    const uuid1 = VALID_UUID;
    const uuid2 = '550e8400-e29b-41d4-a716-446655440001';
    const uuid3 = '550e8400-e29b-41d4-a716-446655440002';

    const req = makePostRequest('/api/admin/member-fid', {
      updates: [
        { memberId: uuid1, fid: 1001 },
        { memberId: uuid2, fid: 1002 },
        { memberId: uuid3, fid: 1003 },
      ],
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.updated).toBe(3);
    expect(body.errors).toEqual([]);
  });

  it('calls update with fid and updated_at ISO string', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain = chainMock({ error: null });
    mockFrom.mockReturnValue(chain);

    const req = makePostRequest('/api/admin/member-fid', {
      updates: [{ memberId: VALID_UUID, fid: 5678 }],
    });

    await PATCH(req);

    // Verify update was called with fid and updated_at ISO string
    expect(chain.update).toHaveBeenCalledWith({
      fid: 5678,
      updated_at: expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
    });
  });

  it('calls eq with memberId to scope update', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain = chainMock({ error: null });
    mockFrom.mockReturnValue(chain);

    const testUuid = VALID_UUID;
    const req = makePostRequest('/api/admin/member-fid', {
      updates: [{ memberId: testUuid, fid: 9999 }],
    });

    await PATCH(req);

    expect(chain.eq).toHaveBeenCalledWith('id', testUuid);
  });

  // ── Partial failure: mixed successes and errors ──────────────────────────

  it('accumulates errors for members that fail and continues', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      const chains = [
        chainMock({ error: null }), // First update succeeds
        chainMock({ error: { message: 'member not found' } }), // Second fails
        chainMock({ error: null }), // Third succeeds
      ];
      return chains[callCount++];
    });

    const uuid1 = VALID_UUID;
    const uuid2 = '550e8400-e29b-41d4-a716-446655440001';
    const uuid3 = '550e8400-e29b-41d4-a716-446655440002';

    const req = makePostRequest('/api/admin/member-fid', {
      updates: [
        { memberId: uuid1, fid: 1001 },
        { memberId: uuid2, fid: 1002 },
        { memberId: uuid3, fid: 1003 },
      ],
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.updated).toBe(2);
    expect(body.errors).toHaveLength(1);
    expect(body.errors[0]).toContain(uuid2);
    expect(body.errors[0]).toContain('member not found');
  });

  it('includes full error message in errors array', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    mockFrom.mockImplementation(() => {
      return chainMock({ error: { message: 'unique constraint violation' } });
    });

    const req = makePostRequest('/api/admin/member-fid', {
      updates: [{ memberId: VALID_UUID, fid: 9999 }],
    });

    const res = await PATCH(req);
    const body = await res.json();

    expect(body.updated).toBe(0);
    expect(body.errors).toHaveLength(1);
    expect(body.errors[0]).toContain(VALID_UUID);
    expect(body.errors[0]).toContain('unique constraint violation');
  });

  it('handles all updates failing gracefully', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    mockFrom.mockImplementation(() => {
      return chainMock({ error: { message: 'db error' } });
    });

    const req = makePostRequest('/api/admin/member-fid', {
      updates: [{ memberId: VALID_UUID, fid: 1001 }],
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200); // Returns 200 even with partial failures
    const body = await res.json();

    expect(body.updated).toBe(0);
    expect(body.errors).toHaveLength(1);
  });

  // ── Error path: exception thrown ──────────────────────────────────────────

  it('returns 500 when req.json() throws', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const mockReq = {
      json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
    } as { json: () => Promise<never> };

    const res = await PATCH(mockReq as never);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to update FIDs');
  });

  it('logs errors to logger.error on exception', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const mockReq = {
      json: vi.fn().mockRejectedValue(new Error('JSON parse failed')),
    } as { json: () => Promise<never> };

    await PATCH(mockReq as never);

    expect(mockLogger.error).toHaveBeenCalledWith('Member FID update error:', expect.any(Error));
  });

  // ── Edge cases ────────────────────────────────────────────────────────────

  it('handles max batch size (100 updates)', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain = chainMock({ error: null });
    mockFrom.mockReturnValue(chain);

    const updates = Array.from({ length: 100 }, (_, i) => ({
      memberId: VALID_UUID,
      fid: 2000 + i,
    }));

    const req = makePostRequest('/api/admin/member-fid', { updates });
    const res = await PATCH(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(100);
  });

  it('returns response with exact shape on success', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain = chainMock({ error: null });
    mockFrom.mockReturnValue(chain);

    const req = makePostRequest('/api/admin/member-fid', {
      updates: [{ memberId: VALID_UUID, fid: 5555 }],
    });

    const res = await PATCH(req);
    const body = await res.json();

    expect(Object.keys(body).sort()).toEqual(['errors', 'updated'].sort());
    expect(Array.isArray(body.errors)).toBe(true);
    expect(typeof body.updated).toBe('number');
  });

  it('processes updates sequentially and tolerates errors in the middle', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chains = [
      chainMock({ error: null }),
      chainMock({ error: { message: 'fail' } }),
      chainMock({ error: null }),
    ];

    let chainIndex = 0;
    mockFrom.mockImplementation(() => chains[chainIndex++]);

    const req = makePostRequest('/api/admin/member-fid', {
      updates: [
        { memberId: VALID_UUID, fid: 1 },
        { memberId: VALID_UUID, fid: 2 },
        { memberId: VALID_UUID, fid: 3 },
      ],
    });

    const res = await PATCH(req);
    const body = await res.json();

    expect(body.updated).toBe(2);
    expect(body.errors).toHaveLength(1);
  });
});
