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

import { POST } from '../route';

/**
 * Build a chain that supports update→eq→await for the disconnect operation.
 * Chainable methods return the chain for further chaining.
 * The chain supports direct await (via .then) for awaited operations.
 */
function makeChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const chainable = ['update', 'eq'];
  for (const m of chainable) {
    chain[m] = vi.fn(() => chain);
  }
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('POST /api/auth/lastfm/disconnect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await POST();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('clears lastfm_session_key on success', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);

    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    expect(chain.update).toHaveBeenCalledWith({ lastfm_session_key: null });
    expect(chain.eq).toHaveBeenCalledWith('fid', 123);
  });

  it('scopes the update to the session fid', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);

    await POST();
    expect(chain.eq).toHaveBeenCalledWith('fid', 123);
  });

  it('queries the user_settings table', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);

    await POST();
    expect(mockFrom).toHaveBeenCalledWith('user_settings');
  });

  it('returns 500 when supabase query throws', async () => {
    const testError = new Error('db connection failed');
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockRejectedValue(testError),
      }),
    });

    const res = await POST();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to disconnect');
  });

  it('logs errors server-side on disconnect failure', async () => {
    const { logger } = await import('@/lib/logger');
    const testError = new Error('unexpected db error');
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockRejectedValue(testError),
      }),
    });

    await POST();
    expect(logger.error).toHaveBeenCalledWith('[lastfm/disconnect] Error:', testError);
  });

  it('disconnects only the authenticated user via fid', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);

    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 999 }));

    await POST();
    expect(chain.eq).toHaveBeenCalledWith('fid', 999);
    expect(chain.update).toHaveBeenCalledWith({ lastfm_session_key: null });
  });

  it('returns 401 when session has no fid', async () => {
    mockGetSessionData.mockResolvedValue({ username: 'user' });

    const res = await POST();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });
});
