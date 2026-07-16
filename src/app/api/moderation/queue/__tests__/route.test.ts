import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
  mockAdminSession,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  VALID_UUID,
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

import { GET, PATCH } from '../route';

/**
 * Build a Supabase query chain with chainable methods (select, eq, is, order, limit)
 * that resolves to the given result. For PATCH, also includes update and upsert methods.
 */
function queueChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'eq', 'is', 'order', 'limit', 'update', 'upsert', 'single']) {
    chain[m] = vi.fn(() => chain);
  }
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  chain.single = vi.fn().mockResolvedValue(result);
  return chain;
}

describe('GET /api/moderation/queue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAdminSession());
  });

  // ---- Authentication / Authorization ----

  it('returns 401 when no session exists', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET();
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('returns 403 when user is not admin', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ isAdmin: false }));
    const res = await GET();
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('Admin access required');
  });

  // ---- Moderation Queue Query Logic ----

  it('queries moderation_log table with correct filters', async () => {
    const chain = queueChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET();
    expect(mockFrom).toHaveBeenCalledWith('moderation_log');
    expect(chain.select).toHaveBeenCalledWith('*');
    expect(chain.eq).toHaveBeenCalledWith('action', 'flag');
    expect(chain.is).toHaveBeenCalledWith('reviewed_at', null);
  });

  it('orders results by created_at descending', async () => {
    const chain = queueChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET();
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('limits results to 100', async () => {
    const chain = queueChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET();
    expect(chain.limit).toHaveBeenCalledWith(100);
  });

  it('returns empty items list when data is empty', async () => {
    mockFrom.mockReturnValue(queueChain({ data: [], error: null }));
    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()).items).toEqual([]);
  });

  it('returns populated items list on success', async () => {
    const items = [
      { id: '1', action: 'flag', reviewed_at: null, created_at: '2026-07-16T10:00:00Z' },
      { id: '2', action: 'flag', reviewed_at: null, created_at: '2026-07-16T09:00:00Z' },
    ];
    mockFrom.mockReturnValue(queueChain({ data: items, error: null }));
    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()).items).toEqual(items);
  });

  it('returns empty items when data is null', async () => {
    mockFrom.mockReturnValue(queueChain({ data: null, error: null }));
    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()).items).toEqual([]);
  });

  // ---- Error Handling ----

  it('returns 500 when Supabase query errors', async () => {
    mockFrom.mockReturnValue(
      queueChain({ data: null, error: new Error('database connection failed') }),
    );
    const res = await GET();
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to fetch moderation queue');
  });

  it('catches and logs uncaught errors, returns 500', async () => {
    mockGetSessionData.mockRejectedValue(new Error('session system down'));
    const res = await GET();
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to fetch moderation queue');
  });
});

describe('PATCH /api/moderation/queue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 789 }));
  });

  // ---- Authentication / Authorization ----

  it('returns 401 when no session exists', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const req = makePostRequest('/api/moderation/queue', { id: VALID_UUID, action: 'allow' });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('returns 403 when user is not admin', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ isAdmin: false }));
    const req = makePostRequest('/api/moderation/queue', { id: VALID_UUID, action: 'allow' });
    const res = await PATCH(req);
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('Admin access required');
  });

  // ---- Input Validation ----

  it('returns 400 when body is invalid JSON', async () => {
    const req = new NextRequest('http://localhost:3000/api/moderation/queue', {
      method: 'PATCH',
      body: '{invalid json',
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid JSON body');
  });

  it('returns 400 when id is missing', async () => {
    const req = makePostRequest('/api/moderation/queue', { action: 'allow' });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when action is missing', async () => {
    const req = makePostRequest('/api/moderation/queue', { id: VALID_UUID });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when id is not a valid UUID', async () => {
    const req = makePostRequest('/api/moderation/queue', { id: 'not-a-uuid', action: 'allow' });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when action is not allow or hide', async () => {
    const req = makePostRequest('/api/moderation/queue', { id: VALID_UUID, action: 'delete' });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  // ---- Success: action=allow (override) ----

  it('updates action to override and reviewed_at on allow action', async () => {
    const chain = queueChain({
      data: { cast_hash: 'hash123', fid: 456 },
      error: null,
    });
    mockFrom.mockReturnValue(chain);
    const req = makePostRequest('/api/moderation/queue', { id: VALID_UUID, action: 'allow' });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.action).toBe('override');
    // Verify update was called with the right data
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'override',
        reviewed_by_fid: 789,
        reviewed_at: expect.any(String),
      }),
    );
  });

  // ---- Success: action=hide ----

  it('updates action to hide and inserts into hidden_messages on hide action', async () => {
    const updateChain = queueChain({
      data: { cast_hash: 'hash123', fid: 456 },
      error: null,
    });
    const upsertChain = queueChain({ data: null, error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'moderation_log') {
        return updateChain;
      }
      if (table === 'hidden_messages') {
        return upsertChain;
      }
      return queueChain({ data: null, error: null });
    });
    const req = makePostRequest('/api/moderation/queue', { id: VALID_UUID, action: 'hide' });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.action).toBe('hide');
    expect(mockFrom).toHaveBeenCalledWith('moderation_log');
    expect(mockFrom).toHaveBeenCalledWith('hidden_messages');
  });

  it('returns 200 even if hidden_messages upsert fails (non-fatal)', async () => {
    const updateChain = queueChain({
      data: { cast_hash: 'hash123', fid: 456 },
      error: null,
    });
    const upsertChain = queueChain({
      data: null,
      error: new Error('upsert failed'),
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'moderation_log') {
        return updateChain;
      }
      if (table === 'hidden_messages') {
        return upsertChain;
      }
      return queueChain({ data: null, error: null });
    });
    const req = makePostRequest('/api/moderation/queue', { id: VALID_UUID, action: 'hide' });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });

  // ---- Error Handling ----

  it('returns 500 when moderation_log update fails', async () => {
    mockFrom.mockReturnValue(queueChain({ data: null, error: new Error('update failed') }));
    const req = makePostRequest('/api/moderation/queue', { id: VALID_UUID, action: 'allow' });
    const res = await PATCH(req);
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to update moderation log');
  });

  it('returns 500 when moderation_log update returns no data', async () => {
    mockFrom.mockReturnValue(queueChain({ data: null, error: null }));
    const req = makePostRequest('/api/moderation/queue', { id: VALID_UUID, action: 'allow' });
    const res = await PATCH(req);
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to update moderation log');
  });

  it('catches and logs uncaught errors, returns 500', async () => {
    mockGetSessionData.mockRejectedValue(new Error('session system down'));
    const req = makePostRequest('/api/moderation/queue', { id: VALID_UUID, action: 'allow' });
    const res = await PATCH(req);
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to process review');
  });
});
