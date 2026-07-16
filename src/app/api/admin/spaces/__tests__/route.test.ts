import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
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
 * A Supabase query chain that mocks the rooms table SELECT,
 * with chainable methods (select, order, limit) and resolves to `result`.
 */
function spacesChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'order', 'limit']) {
    chain[m] = vi.fn(() => chain);
  }
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('GET /api/admin/spaces', () => {
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

  it('returns 403 when session exists but user is not admin', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ isAdmin: false }));
    const res = await GET();
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('Admin access required');
  });

  // ---- Spaces List Logic ----

  it('queries the rooms table with select(*)', async () => {
    const chain = spacesChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET();
    expect(mockFrom).toHaveBeenCalledWith('rooms');
    expect(chain.select).toHaveBeenCalledWith('*');
  });

  it('orders results by created_at descending', async () => {
    const chain = spacesChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET();
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('limits results to 100', async () => {
    const chain = spacesChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);
    await GET();
    expect(chain.limit).toHaveBeenCalledWith(100);
  });

  it('returns empty list when data is null', async () => {
    mockFrom.mockReturnValue(spacesChain({ data: null, error: null }));
    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()).rooms).toEqual([]);
  });

  it('returns populated list of rooms on success', async () => {
    const rooms = [
      { id: '1', name: 'Room A', created_at: '2026-07-16T00:00:00Z' },
      { id: '2', name: 'Room B', created_at: '2026-07-15T00:00:00Z' },
    ];
    mockFrom.mockReturnValue(spacesChain({ data: rooms, error: null }));
    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()).rooms).toEqual(rooms);
  });

  it('returns 500 when Supabase query errors', async () => {
    mockFrom.mockReturnValue(
      spacesChain({ data: null, error: new Error('database connection failed') }),
    );
    const res = await GET();
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to fetch spaces');
  });

  // ---- Exception Handling ----

  it('catches and logs uncaught errors, returns 500', async () => {
    // Simulate getSessionData throwing unexpectedly
    mockGetSessionData.mockRejectedValue(new Error('session system down'));
    const res = await GET();
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Internal server error');
  });

  it('returns 500 when the chain throws during query', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('from() failed');
    });
    const res = await GET();
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Internal server error');
  });
});
