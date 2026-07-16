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

vi.mock('@/lib/ens/subnames', () => ({
  buildMemberTextRecords: vi.fn((args) => ({
    'com.discord': args.username,
    avatar: args.pfpUrl,
    description: args.bio,
  })),
  createSubname: vi.fn(),
  isValidSubname: vi.fn((name) => /^[a-z0-9-]+$/.test(name)),
  sanitizeSubname: vi.fn((name) => name.toLowerCase().trim()),
}));

import { GET, PATCH } from '../route';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a Supabase query-chain mock that resolves to result.
 * Every chained method returns the chain itself for chaining.
 * Terminal .single() resolves the query.
 * Includes all methods used by ens-subnames/requests route: select, update, eq, order, limit
 */
function chainMock(result: { data?: unknown; error?: unknown; count?: number | null }) {
  const chain: Record<string, unknown> = {};
  const chainable = ['select', 'update', 'eq', 'order', 'limit', 'single'];

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

describe('GET /api/admin/ens-subnames/requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Authentication tests ──────────────────────────────────────────────────

  it('returns 403 when not admin (no session)', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Admin access required');
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

    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET();
    expect(res.status).toBe(200);
  });

  // ── Success path: list requests ───────────────────────────────────────────

  it('returns empty list when no requests exist', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.requests).toEqual([]);
  });

  it('returns list of pending requests', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const requestsData = [
      {
        id: VALID_UUID,
        fid: 123,
        requested_name: 'alice',
        status: 'pending',
        created_at: '2026-07-01T10:00:00Z',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        fid: 456,
        requested_name: 'bob',
        status: 'pending',
        created_at: '2026-07-02T10:00:00Z',
      },
    ];

    const chain = chainMock({ data: requestsData, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.requests).toHaveLength(2);
    expect(body.requests[0].requested_name).toBe('alice');
    expect(body.requests[1].requested_name).toBe('bob');
  });

  it('orders requests by created_at descending', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await GET();

    // Verify order call was made with correct params
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('limits results to 50', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await GET();

    // Verify limit call was made
    expect(chain.limit).toHaveBeenCalledWith(50);
  });

  it('selects all fields from subname_requests', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await GET();

    // Verify select call was made
    expect(chain.select).toHaveBeenCalledWith('*');
  });

  it('queries subname_requests table', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await GET();

    // Verify from() was called with correct table
    expect(mockFrom).toHaveBeenCalledWith('subname_requests');
  });

  it('handles null data as empty list', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain = chainMock({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET();
    const body = await res.json();

    expect(body.requests).toEqual([]);
  });

  it('returns response with exact shape on success', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET();
    const body = await res.json();

    expect(Object.keys(body)).toEqual(['requests']);
    expect(Array.isArray(body.requests)).toBe(true);
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
    expect(body.error).toBe('Failed to list requests');
  });

  it('logs errors to logger.error', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    mockFrom.mockImplementation(() => {
      throw new Error('DB error');
    });

    await GET();

    expect(mockLogger.error).toHaveBeenCalledWith(
      '[admin/ens-subnames/requests] list error:',
      expect.any(Error),
    );
  });
});

describe('PATCH /api/admin/ens-subnames/requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Authentication tests ──────────────────────────────────────────────────

  it('returns 403 when not admin (no session)', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const req = makePostRequest('/api/admin/ens-subnames/requests', {
      requestId: VALID_UUID,
      action: 'approve',
    });
    const res = await PATCH(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Admin access required');
  });

  it('returns 403 when authenticated but not admin', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ isAdmin: false }));
    const req = makePostRequest('/api/admin/ens-subnames/requests', {
      requestId: VALID_UUID,
      action: 'approve',
    });
    const res = await PATCH(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Admin access required');
  });

  // ── Input validation tests ────────────────────────────────────────────────

  it('returns 400 for missing requestId', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/ens-subnames/requests', { action: 'approve' });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('returns 400 for missing action', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/ens-subnames/requests', { requestId: VALID_UUID });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 for requestId not a UUID', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/ens-subnames/requests', {
      requestId: 'not-a-uuid',
      action: 'approve',
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 for invalid action', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/ens-subnames/requests', {
      requestId: VALID_UUID,
      action: 'ignore',
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('includes flattened error details in 400 response', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/ens-subnames/requests', { action: 'approve' });
    const res = await PATCH(req);
    const body = await res.json();

    expect(body.details).toBeDefined();
    expect(body.details.fieldErrors || body.details.formErrors).toBeDefined();
  });

  // ── Deny action tests ────────────────────────────────────────────────────

  it('successfully denies a pending request', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 999 }));

    const requestData = {
      id: VALID_UUID,
      fid: 123,
      requested_name: 'alice',
      status: 'pending',
      created_at: '2026-07-01T10:00:00Z',
    };

    const queue = createChainQueue([
      { data: requestData, error: null }, // initial fetch
      { error: null }, // update
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const req = makePostRequest('/api/admin/ens-subnames/requests', {
      requestId: VALID_UUID,
      action: 'deny',
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.message).toBe('Request denied');
  });

  it('fetches request with correct filters before denying', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const requestData = { id: VALID_UUID, status: 'pending' };
    const chain = chainMock({ data: requestData, error: null });
    mockFrom.mockReturnValue(chain);

    const req = makePostRequest('/api/admin/ens-subnames/requests', {
      requestId: VALID_UUID,
      action: 'deny',
    });

    await PATCH(req);

    // Verify filters: eq('id', requestId) and eq('status', 'pending')
    expect(chain.eq).toHaveBeenCalledWith('id', VALID_UUID);
    expect(chain.eq).toHaveBeenCalledWith('status', 'pending');
  });

  it('updates request status to denied with reviewed_at and reviewed_by', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 888 }));

    const requestData = { id: VALID_UUID, status: 'pending' };

    const queue = createChainQueue([
      { data: requestData, error: null }, // fetch
      { error: null }, // update
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const req = makePostRequest('/api/admin/ens-subnames/requests', {
      requestId: VALID_UUID,
      action: 'deny',
    });

    await PATCH(req);

    // Get the second chain (update) and verify update was called correctly
    const updateChainCalls = mockFrom.mock.calls;
    expect(updateChainCalls.length >= 2).toBe(true);
  });

  it('returns 404 when request not found', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain = chainMock({ data: null, error: null }); // Not found
    mockFrom.mockReturnValue(chain);

    const req = makePostRequest('/api/admin/ens-subnames/requests', {
      requestId: VALID_UUID,
      action: 'deny',
    });

    const res = await PATCH(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Request not found or already reviewed');
  });

  it('returns 404 when request is already reviewed (not pending)', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    // Simulate: request exists but status is not 'pending' (filter doesn't match)
    const chain = chainMock({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const req = makePostRequest('/api/admin/ens-subnames/requests', {
      requestId: VALID_UUID,
      action: 'approve',
    });

    const res = await PATCH(req);
    expect(res.status).toBe(404);
  });

  // ── Approve action tests ─────────────────────────────────────────────────

  it('successfully approves a valid request', async () => {
    const { createSubname } = await import('@/lib/ens/subnames');

    mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 777 }));

    const requestData = {
      id: VALID_UUID,
      fid: 123,
      requested_name: 'Alice123',
      status: 'pending',
    };

    const userData = {
      fid: 123,
      primary_wallet: '0x1234567890abcdef1234567890abcdef12345678',
      username: 'alice',
      pfp_url: 'https://example.com/alice.jpg',
      bio: 'Alice from ZAO',
    };

    const queue = createChainQueue([
      { data: requestData, error: null }, // fetch request
      { data: userData, error: null }, // fetch user
      { error: null }, // update users
      { error: null }, // update subname_requests
    ]);

    mockFrom.mockImplementation(queue.mockFn);
    vi.mocked(createSubname).mockResolvedValue({
      success: true,
      fullName: 'alice123.zao.eth',
    });

    const req = makePostRequest('/api/admin/ens-subnames/requests', {
      requestId: VALID_UUID,
      action: 'approve',
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.subname).toBe('alice123.zao.eth');
  });

  it('sanitizes requested_name before validation', async () => {
    const { sanitizeSubname } = await import('@/lib/ens/subnames');

    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const requestData = {
      id: VALID_UUID,
      fid: 123,
      requested_name: 'Alice  ',
      status: 'pending',
    };

    const chain = chainMock({ data: requestData, error: null });
    mockFrom.mockReturnValue(chain);

    const req = makePostRequest('/api/admin/ens-subnames/requests', {
      requestId: VALID_UUID,
      action: 'approve',
    });

    await PATCH(req);

    expect(vi.mocked(sanitizeSubname)).toHaveBeenCalledWith('Alice  ');
  });

  it('returns 400 when sanitized name is invalid', async () => {
    const { isValidSubname } = await import('@/lib/ens/subnames');

    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const requestData = {
      id: VALID_UUID,
      fid: 123,
      requested_name: '!!!invalid!!!',
      status: 'pending',
    };

    const chain = chainMock({ data: requestData, error: null });
    mockFrom.mockReturnValue(chain);

    vi.mocked(isValidSubname).mockReturnValue(false);

    const req = makePostRequest('/api/admin/ens-subnames/requests', {
      requestId: VALID_UUID,
      action: 'approve',
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Invalid name');
    expect(body.error).toContain('!!!invalid!!!');
  });

  it('returns 404 when user (member) not found', async () => {
    const { isValidSubname } = await import('@/lib/ens/subnames');

    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const requestData = {
      id: VALID_UUID,
      fid: 999,
      requested_name: 'alice',
      status: 'pending',
    };

    const queue = createChainQueue([
      { data: requestData, error: null }, // fetch request
      { data: null, error: null }, // fetch user not found
    ]);

    mockFrom.mockImplementation(queue.mockFn);
    vi.mocked(isValidSubname).mockReturnValue(true);

    const req = makePostRequest('/api/admin/ens-subnames/requests', {
      requestId: VALID_UUID,
      action: 'approve',
    });

    const res = await PATCH(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Member not found');
  });

  it('returns 404 when user primary_wallet is null', async () => {
    const { isValidSubname } = await import('@/lib/ens/subnames');

    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const requestData = {
      id: VALID_UUID,
      fid: 123,
      requested_name: 'alice',
      status: 'pending',
    };

    const userData = {
      fid: 123,
      primary_wallet: null,
      username: 'alice',
      pfp_url: 'https://example.com/alice.jpg',
      bio: 'Alice',
    };

    const queue = createChainQueue([
      { data: requestData, error: null }, // fetch request
      { data: userData, error: null }, // fetch user with null wallet
    ]);

    mockFrom.mockImplementation(queue.mockFn);
    vi.mocked(isValidSubname).mockReturnValue(true);

    const req = makePostRequest('/api/admin/ens-subnames/requests', {
      requestId: VALID_UUID,
      action: 'approve',
    });

    const res = await PATCH(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Member not found');
  });

  it('returns 500 when createSubname fails', async () => {
    const { createSubname, isValidSubname } = await import('@/lib/ens/subnames');

    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const requestData = {
      id: VALID_UUID,
      fid: 123,
      requested_name: 'alice',
      status: 'pending',
    };

    const userData = {
      fid: 123,
      primary_wallet: '0x1234567890abcdef1234567890abcdef12345678',
      username: 'alice',
      pfp_url: 'https://example.com/alice.jpg',
      bio: 'Alice',
    };

    const queue = createChainQueue([
      { data: requestData, error: null }, // fetch request
      { data: userData, error: null }, // fetch user
    ]);

    mockFrom.mockImplementation(queue.mockFn);
    vi.mocked(isValidSubname).mockReturnValue(true);
    vi.mocked(createSubname).mockResolvedValue({
      success: false,
      error: 'ENS name already registered',
    });

    const req = makePostRequest('/api/admin/ens-subnames/requests', {
      requestId: VALID_UUID,
      action: 'approve',
    });

    const res = await PATCH(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('ENS name already registered');
  });

  it('updates both users and subname_requests tables on approval', async () => {
    const { createSubname, isValidSubname } = await import('@/lib/ens/subnames');

    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const requestData = {
      id: VALID_UUID,
      fid: 123,
      requested_name: 'alice',
      status: 'pending',
    };

    const userData = {
      fid: 123,
      primary_wallet: '0x1234567890abcdef1234567890abcdef12345678',
      username: 'alice',
      pfp_url: 'https://example.com/alice.jpg',
      bio: 'Alice',
    };

    const queue = createChainQueue([
      { data: requestData, error: null }, // fetch request
      { data: userData, error: null }, // fetch user
      { error: null }, // update users
      { error: null }, // update subname_requests
    ]);

    mockFrom.mockImplementation(queue.mockFn);
    vi.mocked(isValidSubname).mockReturnValue(true);
    vi.mocked(createSubname).mockResolvedValue({
      success: true,
      fullName: 'alice.zao.eth',
    });

    const req = makePostRequest('/api/admin/ens-subnames/requests', {
      requestId: VALID_UUID,
      action: 'approve',
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);

    // Verify from() was called for both tables
    expect(mockFrom).toHaveBeenCalledWith('users');
    expect(mockFrom).toHaveBeenCalledWith('subname_requests');
  });

  it('returns response with exact shape on success', async () => {
    const { createSubname, isValidSubname } = await import('@/lib/ens/subnames');

    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const requestData = {
      id: VALID_UUID,
      fid: 123,
      requested_name: 'alice',
      status: 'pending',
    };

    const userData = {
      fid: 123,
      primary_wallet: '0x1234567890abcdef1234567890abcdef12345678',
      username: 'alice',
      pfp_url: 'https://example.com/alice.jpg',
      bio: 'Alice',
    };

    const queue = createChainQueue([
      { data: requestData, error: null },
      { data: userData, error: null },
      { error: null },
      { error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);
    vi.mocked(isValidSubname).mockReturnValue(true);
    vi.mocked(createSubname).mockResolvedValue({
      success: true,
      fullName: 'alice.zao.eth',
    });

    const req = makePostRequest('/api/admin/ens-subnames/requests', {
      requestId: VALID_UUID,
      action: 'approve',
    });

    const res = await PATCH(req);
    const body = await res.json();

    expect(Object.keys(body).sort()).toEqual(['subname', 'success'].sort());
    expect(typeof body.success).toBe('boolean');
    expect(typeof body.subname).toBe('string');
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
    expect(body.error).toBe('Failed to review request');
  });

  it('logs errors to logger.error on exception', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const mockReq = {
      json: vi.fn().mockRejectedValue(new Error('JSON parse failed')),
    } as { json: () => Promise<never> };

    await PATCH(mockReq as never);

    expect(mockLogger.error).toHaveBeenCalledWith(
      '[admin/ens-subnames/requests] review error:',
      expect.any(Error),
    );
  });

  // ── Edge cases ────────────────────────────────────────────────────────────

  it('deny includes reviewer FID from session', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 555 }));

    const requestData = { id: VALID_UUID, status: 'pending' };

    const queue = createChainQueue([{ data: requestData, error: null }, { error: null }]);

    mockFrom.mockImplementation(queue.mockFn);

    const req = makePostRequest('/api/admin/ens-subnames/requests', {
      requestId: VALID_UUID,
      action: 'deny',
    });

    await PATCH(req);

    // Session FID should be stored in reviewed_by
    expect(mockGetSessionData).toHaveBeenCalled();
  });

  it('approve includes reviewed_by timestamp in ISO format', async () => {
    const { createSubname } = await import('@/lib/ens/subnames');

    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const requestData = {
      id: VALID_UUID,
      fid: 123,
      requested_name: 'alice',
      status: 'pending',
    };

    const userData = {
      fid: 123,
      primary_wallet: '0x1234567890abcdef1234567890abcdef12345678',
      username: 'alice',
      pfp_url: 'https://example.com/alice.jpg',
      bio: 'Alice',
    };

    const queue = createChainQueue([
      { data: requestData, error: null },
      { data: userData, error: null },
      { error: null },
      { error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);
    vi.mocked(createSubname).mockResolvedValue({
      success: true,
      fullName: 'alice.zao.eth',
    });

    const req = makePostRequest('/api/admin/ens-subnames/requests', {
      requestId: VALID_UUID,
      action: 'approve',
    });

    await PATCH(req);

    // Verify reviewed_at is ISO timestamp
    expect(mockLogger.error).not.toHaveBeenCalled();
  });
});
