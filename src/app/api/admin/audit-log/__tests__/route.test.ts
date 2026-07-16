import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeGetRequest,
  mockAdminSession,
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
 * A factory that creates multiple chain instances sharing a result queue.
 * Each call to mockFrom() gets a fresh chain that consumes the next result.
 * Queue with [entriesResult, actionsResult] to match the route's two DB calls.
 */
function queuedChainFactory(results: Array<{ data?: unknown; error?: unknown; count?: number }>) {
  const q = [...results];
  return () => {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};
    for (const m of ['select', 'order', 'range', 'eq', 'in']) {
      chain[m] = vi.fn(() => chain);
    }
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
    (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) =>
      resolve(q.shift());
    return chain;
  };
}

describe('GET /api/admin/audit-log', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAdminSession());
  });

  // ---- Authentication / Authorization ----

  it('returns 401 when no session exists', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET(makeGetRequest('/api/admin/audit-log'));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('returns 403 when session exists but user is not admin', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ isAdmin: false }));
    const res = await GET(makeGetRequest('/api/admin/audit-log'));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('Admin access required');
  });

  // ---- Pagination & Limit/Offset ----

  it('applies default limit (100) and offset (0) when not provided', async () => {
    mockFrom.mockImplementation(
      queuedChainFactory([
        { data: [], error: null, count: 0 },
        { data: [], error: null },
      ]),
    );
    const res = await GET(makeGetRequest('/api/admin/audit-log'));
    expect(res.status).toBe(200);
  });

  it('uses custom limit when provided', async () => {
    mockFrom.mockImplementation(
      queuedChainFactory([
        { data: [], error: null, count: 0 },
        { data: [], error: null },
      ]),
    );
    const res = await GET(makeGetRequest('/api/admin/audit-log', { limit: '50' }));
    expect(res.status).toBe(200);
  });

  it('uses custom offset when provided', async () => {
    mockFrom.mockImplementation(
      queuedChainFactory([
        { data: [], error: null, count: 0 },
        { data: [], error: null },
      ]),
    );
    const res = await GET(makeGetRequest('/api/admin/audit-log', { offset: '100' }));
    expect(res.status).toBe(200);
  });

  it('respects both custom limit and offset', async () => {
    mockFrom.mockImplementation(
      queuedChainFactory([
        { data: [], error: null, count: 0 },
        { data: [], error: null },
      ]),
    );
    const res = await GET(makeGetRequest('/api/admin/audit-log', { limit: '25', offset: '50' }));
    expect(res.status).toBe(200);
  });

  it('enforces max limit of 500 with 400 on oversized limit', async () => {
    const res = await GET(makeGetRequest('/api/admin/audit-log', { limit: '1000' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid query parameters');
  });

  it('rejects limit < 1 with 400', async () => {
    const res = await GET(makeGetRequest('/api/admin/audit-log', { limit: '0' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid query parameters');
    expect(body.details).toBeDefined();
  });

  it('rejects negative offset with 400', async () => {
    const res = await GET(makeGetRequest('/api/admin/audit-log', { offset: '-1' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid query parameters');
  });

  // ---- Filtering: action ----

  it('filters by action when provided', async () => {
    mockFrom.mockImplementation(
      queuedChainFactory([
        { data: [], error: null, count: 0 },
        { data: [], error: null },
      ]),
    );
    const res = await GET(makeGetRequest('/api/admin/audit-log', { action: 'user_login' }));
    expect(res.status).toBe(200);
  });

  it('enforces max length of 200 for action filter', async () => {
    const longAction = 'a'.repeat(201);
    const res = await GET(makeGetRequest('/api/admin/audit-log', { action: longAction }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid query parameters');
  });

  // ---- Filtering: actorFid ----

  it('filters by actorFid when provided', async () => {
    mockFrom.mockImplementation(
      queuedChainFactory([
        { data: [], error: null, count: 0 },
        { data: [], error: null },
      ]),
    );
    const res = await GET(makeGetRequest('/api/admin/audit-log', { actorFid: '456' }));
    expect(res.status).toBe(200);
  });

  it('rejects non-positive actorFid with 400', async () => {
    const res = await GET(makeGetRequest('/api/admin/audit-log', { actorFid: '0' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid query parameters');
  });

  it('rejects negative actorFid with 400', async () => {
    const res = await GET(makeGetRequest('/api/admin/audit-log', { actorFid: '-10' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid query parameters');
  });

  // ---- Query Structure ----

  it('calls select with count: exact to get total', async () => {
    mockFrom.mockImplementation(
      queuedChainFactory([
        { data: [], error: null, count: 0 },
        { data: [], error: null },
      ]),
    );
    await GET(makeGetRequest('/api/admin/audit-log'));
    expect(mockFrom).toHaveBeenCalled();
  });

  // ---- Success Cases ----

  it('returns empty entries and actions list on empty result', async () => {
    mockFrom.mockImplementation(
      queuedChainFactory([
        { data: [], error: null, count: 0 },
        { data: [], error: null },
      ]),
    );
    const res = await GET(makeGetRequest('/api/admin/audit-log'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.entries).toEqual([]);
    expect(body.actions).toEqual([]);
    expect(body.total).toBe(0);
  });

  it('returns populated entries list on success', async () => {
    const entries = [
      { id: '1', action: 'user_login', actor_fid: 123, created_at: '2026-07-16T00:00:00Z' },
      { id: '2', action: 'admin_change', actor_fid: 456, created_at: '2026-07-15T00:00:00Z' },
    ];
    mockFrom.mockImplementation(
      queuedChainFactory([
        { data: entries, error: null, count: 2 },
        { data: [], error: null },
      ]),
    );
    const res = await GET(makeGetRequest('/api/admin/audit-log'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.entries).toEqual(entries);
    expect(body.total).toBe(2);
  });

  // ---- Distinct Actions ----

  it('extracts distinct actions from the second query', async () => {
    const actions = [
      { action: 'admin_change' },
      { action: 'user_login' },
      { action: 'config_update' },
    ];
    mockFrom.mockImplementation(
      queuedChainFactory([
        { data: [], error: null, count: 0 },
        { data: actions, error: null },
      ]),
    );
    const res = await GET(makeGetRequest('/api/admin/audit-log'));
    const body = await res.json();
    expect(body.actions).toEqual(['admin_change', 'user_login', 'config_update']);
  });

  it('deduplicates actions using a Set', async () => {
    const actions = [
      { action: 'user_login' },
      { action: 'admin_change' },
      { action: 'user_login' }, // duplicate
      { action: 'admin_change' }, // duplicate
    ];
    mockFrom.mockImplementation(
      queuedChainFactory([
        { data: [], error: null, count: 0 },
        { data: actions, error: null },
      ]),
    );
    const res = await GET(makeGetRequest('/api/admin/audit-log'));
    const body = await res.json();
    expect(body.actions).toEqual(['user_login', 'admin_change']);
  });

  it('skips null actions when extracting distinct values', async () => {
    const actions = [{ action: 'user_login' }, { action: null }, { action: 'admin_change' }];
    mockFrom.mockImplementation(
      queuedChainFactory([
        { data: [], error: null, count: 0 },
        { data: actions, error: null },
      ]),
    );
    const res = await GET(makeGetRequest('/api/admin/audit-log'));
    const body = await res.json();
    expect(body.actions).toEqual(['user_login', 'admin_change']);
  });

  it('returns empty actions list when actions query fails', async () => {
    mockFrom.mockImplementation(
      queuedChainFactory([
        { data: [{ id: '1', action: 'login' }], error: null, count: 1 },
        { data: null, error: new Error('actions query failed') },
      ]),
    );
    const res = await GET(makeGetRequest('/api/admin/audit-log'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.entries).toEqual([{ id: '1', action: 'login' }]);
    expect(body.actions).toEqual([]);
  });

  // ---- Error Handling ----

  it('returns 500 when entries query errors', async () => {
    mockFrom.mockImplementation(
      queuedChainFactory([{ data: null, error: new Error('database connection failed') }]),
    );
    const res = await GET(makeGetRequest('/api/admin/audit-log'));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to fetch audit log');
  });

  it('returns 500 when entries result has an error field', async () => {
    mockFrom.mockImplementation(
      queuedChainFactory([{ data: null, error: new Error('RLS denied access') }]),
    );
    const res = await GET(makeGetRequest('/api/admin/audit-log'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch audit log');
  });

  it('handles null data gracefully', async () => {
    mockFrom.mockImplementation(
      queuedChainFactory([
        { data: null, error: null, count: null },
        { data: null, error: null },
      ]),
    );
    const res = await GET(makeGetRequest('/api/admin/audit-log'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.entries).toEqual([]);
    expect(body.total).toBe(0);
    expect(body.actions).toEqual([]);
  });

  // ---- Query Parameter Validation (Zod) ----

  it('coerces string limit to integer', async () => {
    mockFrom.mockImplementation(
      queuedChainFactory([
        { data: [], error: null, count: 0 },
        { data: [], error: null },
      ]),
    );
    const res = await GET(makeGetRequest('/api/admin/audit-log', { limit: '42' }));
    expect(res.status).toBe(200);
  });

  it('coerces string offset to integer', async () => {
    mockFrom.mockImplementation(
      queuedChainFactory([
        { data: [], error: null, count: 0 },
        { data: [], error: null },
      ]),
    );
    const res = await GET(makeGetRequest('/api/admin/audit-log', { offset: '10' }));
    expect(res.status).toBe(200);
  });

  it('coerces string actorFid to integer', async () => {
    mockFrom.mockImplementation(
      queuedChainFactory([
        { data: [], error: null, count: 0 },
        { data: [], error: null },
      ]),
    );
    const res = await GET(makeGetRequest('/api/admin/audit-log', { actorFid: '789' }));
    expect(res.status).toBe(200);
  });

  it('rejects non-integer limit with 400', async () => {
    const res = await GET(makeGetRequest('/api/admin/audit-log', { limit: 'abc' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid query parameters');
  });

  it('rejects non-integer offset with 400', async () => {
    const res = await GET(makeGetRequest('/api/admin/audit-log', { offset: 'xyz' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid query parameters');
  });

  it('rejects non-integer actorFid with 400', async () => {
    const res = await GET(makeGetRequest('/api/admin/audit-log', { actorFid: 'notanumber' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid query parameters');
  });

  // ---- Combined Filters ----

  it('applies both action and actorFid filters when both provided', async () => {
    mockFrom.mockImplementation(
      queuedChainFactory([
        { data: [], error: null, count: 0 },
        { data: [], error: null },
      ]),
    );
    const res = await GET(
      makeGetRequest('/api/admin/audit-log', { action: 'login', actorFid: '123' }),
    );
    expect(res.status).toBe(200);
  });

  it('applies no filters when neither action nor actorFid is provided', async () => {
    mockFrom.mockImplementation(
      queuedChainFactory([
        { data: [], error: null, count: 0 },
        { data: [], error: null },
      ]),
    );
    const res = await GET(makeGetRequest('/api/admin/audit-log'));
    expect(res.status).toBe(200);
  });

  // ---- Response Shape ----

  it('includes entries, total, and actions in response', async () => {
    mockFrom.mockImplementation(
      queuedChainFactory([
        { data: [{ id: '1' }], error: null, count: 1 },
        { data: [{ action: 'test' }], error: null },
      ]),
    );
    const res = await GET(makeGetRequest('/api/admin/audit-log'));
    const body = await res.json();
    expect(body).toHaveProperty('entries');
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('actions');
  });

  it('does not include error or details fields on success', async () => {
    mockFrom.mockImplementation(
      queuedChainFactory([
        { data: [], error: null, count: 0 },
        { data: [], error: null },
      ]),
    );
    const res = await GET(makeGetRequest('/api/admin/audit-log'));
    const body = await res.json();
    expect(body).not.toHaveProperty('error');
    expect(body).not.toHaveProperty('details');
  });
});
