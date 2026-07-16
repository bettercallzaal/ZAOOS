import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockAuthenticatedSession, mockUnauthenticatedSession } from '@/test-utils/api-helpers';

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
 * Build a mock Supabase query chain that resolves to the given result.
 * Chainable methods (.select, .eq) return the chain for further chaining.
 * Terminal method (.single) resolves to the result.
 * The chain also implements .then so it resolves when awaited directly.
 */
function makeChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'eq', 'order', 'limit']) {
    chain[m] = vi.fn(() => chain);
  }
  chain.single = vi.fn(() => Promise.resolve(result));
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('GET /api/auth/listenbrainz/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  it('returns 401 when no session exists', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when session has no fid', async () => {
    mockGetSessionData.mockResolvedValue({ username: 'testuser' });
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns connected:true when listenbrainz_token exists', async () => {
    const chain = makeChain({ data: { listenbrainz_token: 'test-token-123' }, error: null });
    mockFrom.mockReturnValue(chain);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.connected).toBe(true);
    expect(chain.select).toHaveBeenCalledWith('listenbrainz_token');
    expect(chain.eq).toHaveBeenCalledWith('fid', 123);
    expect(chain.single).toHaveBeenCalled();
  });

  it('returns connected:false when listenbrainz_token is null', async () => {
    const chain = makeChain({ data: { listenbrainz_token: null }, error: null });
    mockFrom.mockReturnValue(chain);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.connected).toBe(false);
  });

  it('returns connected:false when data is null (no user row)', async () => {
    const chain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.connected).toBe(false);
  });

  it('queries the correct table and columns', async () => {
    const chain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    await GET();
    expect(mockFrom).toHaveBeenCalledWith('user_settings');
    expect(chain.select).toHaveBeenCalledWith('listenbrainz_token');
    expect(chain.eq).toHaveBeenCalledWith('fid', 123);
  });

  it('returns connected:false on database error', async () => {
    const chain = makeChain({ data: null, error: new Error('database connection lost') });
    mockFrom.mockReturnValue(chain);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.connected).toBe(false);
  });

  it('returns connected:false on unexpected exception', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('unexpected error');
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.connected).toBe(false);
  });

  it('works with different authenticated session fids', async () => {
    const chain = makeChain({ data: { listenbrainz_token: 'token-456' }, error: null });
    mockFrom.mockReturnValue(chain);
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));
    await GET();
    expect(chain.eq).toHaveBeenCalledWith('fid', 456);
  });

  it('returns connected:false when listenbrainz_token is empty string', async () => {
    const chain = makeChain({ data: { listenbrainz_token: '' }, error: null });
    mockFrom.mockReturnValue(chain);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.connected).toBe(false);
  });
});
