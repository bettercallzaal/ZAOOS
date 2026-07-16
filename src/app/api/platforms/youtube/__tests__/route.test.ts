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
 * Chain whose chainable methods are inspectable spies. `.single()` awaits to
 * `result`, and `.delete()` chain awaits directly, so a single chain serves
 * both the GET (select→single) and DELETE (delete→eq→await) call shapes.
 */
function makeChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'delete', 'eq']) {
    chain[m] = vi.fn(() => chain);
  }
  chain.single = vi.fn(() => Promise.resolve(result));
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('GET /api/platforms/youtube', () => {
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

  it('returns connected: false when no row is found', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()).connected).toBe(false);
  });

  it('returns connected: false when the query errors', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('db down') }));
    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()).connected).toBe(false);
  });

  it('returns platform details on success', async () => {
    const platformData = {
      platform_username: 'testchannel',
      platform_display_name: 'Test Channel',
      platform_user_id: 'UCxxxxx123',
    };
    mockFrom.mockReturnValue(makeChain({ data: platformData, error: null }));
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.connected).toBe(true);
    expect(body.username).toBe('testchannel');
    expect(body.displayName).toBe('Test Channel');
    expect(body.channelId).toBe('UCxxxxx123');
  });

  it('filters by user_fid and platform', async () => {
    const chain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    await GET();
    expect(chain.eq).toHaveBeenCalledWith('user_fid', 123);
    expect(chain.eq).toHaveBeenCalledWith('platform', 'youtube');
  });

  it('selects the correct fields', async () => {
    const chain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    await GET();
    expect(chain.select).toHaveBeenCalledWith(
      'platform_username, platform_display_name, platform_user_id',
    );
  });

  it('returns 500 on exception', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('unexpected error');
    });
    const res = await GET();
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to get YouTube info');
  });
});

describe('DELETE /api/platforms/youtube', () => {
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

  it('returns success: true on successful disconnect', async () => {
    mockFrom.mockReturnValue(makeChain({ error: null }));
    const res = await DELETE();
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  it('returns 500 when the delete errors', async () => {
    mockFrom.mockReturnValue(makeChain({ error: new Error('db down') }));
    const res = await DELETE();
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to disconnect');
  });

  it('filters by user_fid and platform', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);
    await DELETE();
    expect(chain.delete).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith('user_fid', 123);
    expect(chain.eq).toHaveBeenCalledWith('platform', 'youtube');
  });

  it('deletes from the correct table', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);
    await DELETE();
    expect(mockFrom).toHaveBeenCalledWith('connected_platforms');
  });

  it('returns 500 on exception', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('unexpected error');
    });
    const res = await DELETE();
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to disconnect');
  });
});
