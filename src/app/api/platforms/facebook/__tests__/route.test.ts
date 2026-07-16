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
 * Build a Supabase query chain mock for the Facebook route.
 * Supports .select().eq().single() (GET), .delete().eq() (DELETE), and awaited chains.
 */
function facebookChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'delete', 'eq']) {
    chain[m] = vi.fn(() => chain);
  }
  chain.single = vi.fn().mockResolvedValue(result);
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('GET /api/platforms/facebook', () => {
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

  it('returns connected: false when no Facebook connection exists', async () => {
    mockFrom.mockReturnValue(facebookChain({ data: null, error: null }));
    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()).connected).toBe(false);
  });

  it('returns connected: false when Supabase returns an error', async () => {
    mockFrom.mockReturnValue(facebookChain({ data: null, error: new Error('query error') }));
    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()).connected).toBe(false);
  });

  it('returns full Facebook connection details on success', async () => {
    const facebookData = {
      platform_username: 'john_doe_fb',
      platform_display_name: 'John Doe',
      platform_user_id: 'fb_12345',
      metadata: {
        primary_page_id: 'page_001',
        primary_page_name: 'My Page',
        pages: [
          { id: 'page_001', name: 'My Page' },
          { id: 'page_002', name: 'Another Page' },
        ],
      },
    };
    mockFrom.mockReturnValue(facebookChain({ data: facebookData, error: null }));
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      connected: true,
      userId: 'fb_12345',
      username: 'john_doe_fb',
      displayName: 'John Doe',
      primaryPageId: 'page_001',
      primaryPageName: 'My Page',
      pages: [
        { id: 'page_001', name: 'My Page' },
        { id: 'page_002', name: 'Another Page' },
      ],
    });
  });

  it('handles missing metadata gracefully', async () => {
    const facebookData = {
      platform_username: 'user_fb',
      platform_display_name: 'User Name',
      platform_user_id: 'fb_999',
      metadata: null,
    };
    mockFrom.mockReturnValue(facebookChain({ data: facebookData, error: null }));
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.primaryPageId).toBe(null);
    expect(body.primaryPageName).toBe(null);
    expect(body.pages).toEqual([]);
  });

  it('handles empty metadata object gracefully', async () => {
    const facebookData = {
      platform_username: 'user_fb',
      platform_display_name: 'User Name',
      platform_user_id: 'fb_999',
      metadata: {},
    };
    mockFrom.mockReturnValue(facebookChain({ data: facebookData, error: null }));
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.primaryPageId).toBe(null);
    expect(body.primaryPageName).toBe(null);
    expect(body.pages).toEqual([]);
  });

  it('queries connected_platforms with correct filters', async () => {
    const chain = facebookChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    await GET();
    expect(mockFrom).toHaveBeenCalledWith('connected_platforms');
    expect(chain.select).toHaveBeenCalledWith(
      'platform_username, platform_display_name, platform_user_id, metadata',
    );
    expect(chain.eq).toHaveBeenCalledWith('user_fid', 123);
    expect(chain.eq).toHaveBeenCalledWith('platform', 'facebook');
  });

  it('returns 500 when a try/catch error occurs', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('Unexpected error');
    });
    const res = await GET();
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to get Facebook info');
  });
});

describe('DELETE /api/platforms/facebook', () => {
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

  it('returns success: true when disconnection succeeds', async () => {
    mockFrom.mockReturnValue(facebookChain({ error: null }));
    const res = await DELETE();
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  it('deletes from connected_platforms with correct filters', async () => {
    const chain = facebookChain({ error: null });
    mockFrom.mockReturnValue(chain);
    await DELETE();
    expect(mockFrom).toHaveBeenCalledWith('connected_platforms');
    expect(chain.delete).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith('user_fid', 123);
    expect(chain.eq).toHaveBeenCalledWith('platform', 'facebook');
  });

  it('returns 500 when Supabase delete returns an error', async () => {
    mockFrom.mockReturnValue(facebookChain({ error: new Error('delete failed') }));
    const res = await DELETE();
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to disconnect');
  });

  it('returns 500 when a try/catch error occurs', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('Unexpected error during delete');
    });
    const res = await DELETE();
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to disconnect');
  });

  it('logs errors to logger.error on Supabase failure', async () => {
    const { logger } = await import('@/lib/logger');
    mockFrom.mockReturnValue(facebookChain({ error: new Error('query error') }));
    await DELETE();
    expect(logger.error).toHaveBeenCalledWith('Facebook disconnect error:', expect.any(Error));
  });

  it('logs errors to logger.error on try/catch failure', async () => {
    const { logger } = await import('@/lib/logger');
    mockFrom.mockImplementation(() => {
      throw new Error('unexpected error');
    });
    await DELETE();
    expect(logger.error).toHaveBeenCalledWith('Facebook platform DELETE error:', expect.any(Error));
  });
});

describe('GET /api/platforms/facebook - Error logging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  it('logs errors to logger.error on try/catch failure', async () => {
    const { logger } = await import('@/lib/logger');
    mockFrom.mockImplementation(() => {
      throw new Error('unexpected error');
    });
    await GET();
    expect(logger.error).toHaveBeenCalledWith('Facebook platform GET error:', expect.any(Error));
  });
});
