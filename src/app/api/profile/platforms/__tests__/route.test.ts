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
 * Chain for profile/platforms route tests.
 * Supports .select().eq().single() for user platform queries.
 */
function platformsChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'eq']) {
    chain[m] = vi.fn(() => chain);
  }
  chain.single = vi.fn().mockResolvedValue(result);
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('GET /api/profile/platforms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET();
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('returns all platforms as null when user has no connected platforms', async () => {
    mockFrom.mockReturnValue(
      platformsChain({
        data: {
          bluesky_handle: null,
          lens_profile_id: null,
          hive_username: null,
          x_handle: null,
        },
        error: null,
      }),
    );
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      bluesky_handle: null,
      lens_profile_id: null,
      hive_username: null,
      x_handle: null,
    });
  });

  it('returns connected platform details on success', async () => {
    const userData = {
      bluesky_handle: 'user.bsky.social',
      lens_profile_id: 'lens/0x1234',
      hive_username: 'hiveuser',
      x_handle: 'x_user',
    };
    mockFrom.mockReturnValue(platformsChain({ data: userData, error: null }));
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(userData);
  });

  it('returns a mix of null and connected platforms', async () => {
    const userData = {
      bluesky_handle: null,
      lens_profile_id: 'lens/0xabcd',
      hive_username: null,
      x_handle: 'twitter_handle',
    };
    mockFrom.mockReturnValue(platformsChain({ data: userData, error: null }));
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(userData);
  });

  it('queries the users table', async () => {
    const chain = platformsChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    await GET();
    expect(mockFrom).toHaveBeenCalledWith('users');
  });

  it('selects the correct platform fields', async () => {
    const chain = platformsChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    await GET();
    expect(chain.select).toHaveBeenCalledWith(
      'bluesky_handle, lens_profile_id, hive_username, x_handle',
    );
  });

  it('filters by session fid', async () => {
    const chain = platformsChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    await GET();
    expect(chain.eq).toHaveBeenCalledWith('fid', 123);
  });

  it('calls single() to retrieve a single row', async () => {
    const chain = platformsChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    await GET();
    expect(chain.single).toHaveBeenCalled();
  });

  it('returns 500 when the query returns an error', async () => {
    mockFrom.mockReturnValue(
      platformsChain({ data: null, error: new Error('database connection lost') }),
    );
    const res = await GET();
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to fetch platform status');
  });

  it('returns 500 when an exception is thrown', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('unexpected crash in supabase client');
    });
    const res = await GET();
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Internal server error');
  });

  it('returns user data even when some fields are missing from the row', async () => {
    // Simulates a row where only bluesky and x are set
    const userData = {
      bluesky_handle: 'user.bsky.social',
      lens_profile_id: null,
      hive_username: null,
      x_handle: 'x_user',
    };
    mockFrom.mockReturnValue(platformsChain({ data: userData, error: null }));
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.bluesky_handle).toBe('user.bsky.social');
    expect(body.x_handle).toBe('x_user');
    expect(body.lens_profile_id).toBeNull();
    expect(body.hive_username).toBeNull();
  });

  it('uses session fid from authenticated session', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 999 }));
    const chain = platformsChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    await GET();
    expect(chain.eq).toHaveBeenCalledWith('fid', 999);
  });

  it('returns status 200 even when the user record returns null', async () => {
    mockFrom.mockReturnValue(platformsChain({ data: null, error: null }));
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    // Nullish coalescing converts undefined to null
    expect(body.bluesky_handle).toBeNull();
    expect(body.lens_profile_id).toBeNull();
    expect(body.hive_username).toBeNull();
    expect(body.x_handle).toBeNull();
  });
});
