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

import { DELETE, GET } from '../route';

/**
 * Supabase query chain for Kick route tests.
 * Supports .select().eq().single() for GET queries
 * and .delete().eq() for DELETE queries (awaitable directly).
 */
function kickChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'delete', 'eq']) {
    chain[m] = vi.fn(() => chain);
  }
  chain.single = vi.fn().mockResolvedValue(result);
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('GET /api/platforms/kick', () => {
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

  it('returns connected: false when no Kick platform record exists', async () => {
    mockFrom.mockReturnValue(kickChain({ data: null, error: null }));
    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()).connected).toBe(false);
  });

  it('returns connected platform details on success', async () => {
    const platformData = {
      platform_username: 'kickuser123',
      platform_display_name: 'Kick User',
      platform_user_id: 'usr_kick_001',
      stream_key: 'sk_test_abc123',
      rtmp_url: 'rtmp://live.kick.com/stream',
    };
    mockFrom.mockReturnValue(kickChain({ data: platformData, error: null }));
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.connected).toBe(true);
    expect(body.username).toBe('kickuser123');
    expect(body.displayName).toBe('Kick User');
    expect(body.streamKey).toBe('sk_test_abc123');
    expect(body.rtmpUrl).toBe('rtmp://live.kick.com/stream');
  });

  it('queries the correct platform and user_fid', async () => {
    const chain = kickChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    await GET();
    expect(chain.eq).toHaveBeenCalledWith('user_fid', 123);
    expect(chain.eq).toHaveBeenCalledWith('platform', 'kick');
  });

  it('selects the correct fields', async () => {
    const chain = kickChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    await GET();
    expect(chain.select).toHaveBeenCalledWith(
      'platform_username, platform_display_name, platform_user_id, stream_key, rtmp_url',
    );
  });

  it('returns connected: false when the query errors', async () => {
    mockFrom.mockReturnValue(kickChain({ data: null, error: new Error('db connection lost') }));
    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()).connected).toBe(false);
  });

  it('returns connected: false when an error is returned even with data present', async () => {
    // The route checks `if (error || !data)`, so error alone is enough to treat as not connected
    mockFrom.mockReturnValue(
      kickChain({
        data: { platform_username: 'test' },
        error: new Error('partial error'),
      }),
    );
    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()).connected).toBe(false);
  });
});

describe('DELETE /api/platforms/kick', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await DELETE();
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('disconnects the platform on success', async () => {
    mockFrom.mockReturnValue(kickChain({ error: null }));
    const res = await DELETE();
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  it('queries the correct platform and user_fid for deletion', async () => {
    const chain = kickChain({ error: null });
    mockFrom.mockReturnValue(chain);
    await DELETE();
    expect(chain.eq).toHaveBeenCalledWith('user_fid', 123);
    expect(chain.eq).toHaveBeenCalledWith('platform', 'kick');
  });

  it('uses the delete method', async () => {
    const chain = kickChain({ error: null });
    mockFrom.mockReturnValue(chain);
    await DELETE();
    expect(chain.delete).toHaveBeenCalled();
  });

  it('queries the connected_platforms table', async () => {
    mockFrom.mockReturnValue(kickChain({ error: null }));
    await DELETE();
    expect(mockFrom).toHaveBeenCalledWith('connected_platforms');
  });

  it('returns 500 when the delete query errors', async () => {
    mockFrom.mockReturnValue(kickChain({ error: new Error('db constraint violation') }));
    const res = await DELETE();
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to disconnect');
  });
});

describe('Kick route error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  it('GET catches exceptions and returns 500', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('unexpected crash');
    });
    const res = await GET();
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to get Kick info');
  });

  it('DELETE catches exceptions and returns 500', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('unexpected crash');
    });
    const res = await DELETE();
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to disconnect');
  });
});
