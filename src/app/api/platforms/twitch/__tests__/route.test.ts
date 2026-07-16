import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeGetRequest,
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

import { DELETE, GET } from '../route';

/**
 * Build a Supabase query-chain mock that resolves to the given result.
 * Supports both .single() terminal and direct await.
 */
function makeChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ['select', 'eq', 'delete', 'order', 'limit']) {
    chain[method] = vi.fn(() => chain);
  }
  chain.single = vi.fn(() => Promise.resolve(result));
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('GET /api/platforms/twitch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  describe('authentication guard', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
      const res = await GET(makeGetRequest('/api/platforms/twitch'));
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  describe('public lookup by fid', () => {
    it('queries connected_platforms with the provided fid', async () => {
      const chain = makeChain({
        data: {
          platform_username: 'teststreamer',
          platform_display_name: 'Test Streamer',
        },
      });
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/platforms/twitch', { fid: '999' }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.connected).toBe(true);
      expect(body.username).toBe('teststreamer');
      expect(body.displayName).toBe('Test Streamer');

      expect(chain.select).toHaveBeenCalledWith('platform_username, platform_display_name');
      expect(chain.eq).toHaveBeenCalledWith('user_fid', 999);
      expect(chain.eq).toHaveBeenCalledWith('platform', 'twitch');
      expect(chain.single).toHaveBeenCalled();
    });

    it('returns connected: false when public lookup finds no data', async () => {
      mockFrom.mockReturnValue(makeChain({ data: null, error: null }));

      const res = await GET(makeGetRequest('/api/platforms/twitch', { fid: '999' }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.connected).toBe(false);
    });
  });

  describe('authenticated user own connection', () => {
    it('returns connected: false when user has no Twitch connection', async () => {
      const chain = makeChain({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/platforms/twitch'));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.connected).toBe(false);

      expect(chain.select).toHaveBeenCalledWith(
        'platform_username, platform_display_name, platform_user_id, stream_key, rtmp_url',
      );
      expect(chain.eq).toHaveBeenCalledWith('user_fid', 123);
      expect(chain.eq).toHaveBeenCalledWith('platform', 'twitch');
      expect(chain.single).toHaveBeenCalled();
    });

    it('returns full Twitch connection data on success', async () => {
      const twitchData = {
        platform_username: 'streamerlive',
        platform_display_name: 'StreamerLive',
        platform_user_id: 'twitch-123',
        stream_key: 'live_secret_key_123',
        rtmp_url: 'rtmp://live-fra.twitch.tv/app/',
      };
      mockFrom.mockReturnValue(makeChain({ data: twitchData, error: null }));

      const res = await GET(makeGetRequest('/api/platforms/twitch'));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        connected: true,
        username: 'streamerlive',
        displayName: 'StreamerLive',
        streamKey: 'live_secret_key_123',
        rtmpUrl: 'rtmp://live-fra.twitch.tv/app/',
      });
    });

    it('handles database error gracefully', async () => {
      mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('db connection failed') }));

      const res = await GET(makeGetRequest('/api/platforms/twitch'));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.connected).toBe(false);
    });
  });

  describe('error handling', () => {
    it('returns 500 on unexpected exception', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('unexpected exception');
      });

      const res = await GET(makeGetRequest('/api/platforms/twitch'));
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to get Twitch info');
    });
  });
});

describe('DELETE /api/platforms/twitch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  describe('authentication guard', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
      const res = await DELETE();
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  describe('disconnect', () => {
    it('deletes the Twitch connection for the session user', async () => {
      const chain = makeChain({ error: null });
      mockFrom.mockReturnValue(chain);

      const res = await DELETE();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);

      expect(chain.delete).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith('user_fid', 123);
      expect(chain.eq).toHaveBeenCalledWith('platform', 'twitch');
    });

    it('returns error message when delete fails', async () => {
      mockFrom.mockReturnValue(makeChain({ error: new Error('permission denied') }));

      const res = await DELETE();
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to disconnect');
    });
  });

  describe('error handling', () => {
    it('returns 500 on unexpected exception', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('connection timeout');
      });

      const res = await DELETE();
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to disconnect');
    });
  });
});
