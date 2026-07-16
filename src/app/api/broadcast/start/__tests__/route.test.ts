import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
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

vi.stubGlobal(
  'fetch',
  vi.fn().mockResolvedValue({
    json: async () => ({ rtmpUrl: '', streamKey: '' }),
  }),
);

import { POST } from '../route';

/**
 * FIFO queue chain for mocking Supabase queries.
 * Chainable methods (.select, .eq, etc.) return the chain.
 * Terminal methods (.single) and awaited thenable draw from the queue.
 */
function queuedChain(results: Array<{ data?: unknown; error?: unknown; count?: number }>) {
  const q = [...results];
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'insert', 'update', 'delete', 'eq', 'order', 'limit']) {
    chain[m] = vi.fn(() => chain);
  }
  chain.single = vi.fn(() => Promise.resolve(q.shift()));
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) =>
    resolve(q.shift());
  return chain;
}

describe('POST /api/broadcast/start', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));
    vi.stubGlobal('fetch', vi.fn());
  });

  describe('Authentication', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
      const res = await POST(
        makePostRequest('/api/broadcast/start', {
          platforms: ['twitch'],
          roomTitle: 'Test Stream',
        }),
      );
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  describe('Input Validation', () => {
    it('returns 400 when platforms is missing', async () => {
      const res = await POST(
        makePostRequest('/api/broadcast/start', {
          roomTitle: 'Test Stream',
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when platforms is an empty array', async () => {
      const res = await POST(
        makePostRequest('/api/broadcast/start', {
          platforms: [],
          roomTitle: 'Test Stream',
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when platforms contains non-strings', async () => {
      const res = await POST(
        makePostRequest('/api/broadcast/start', {
          platforms: [123, 'twitch'],
          roomTitle: 'Test Stream',
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when roomTitle is missing', async () => {
      const res = await POST(
        makePostRequest('/api/broadcast/start', {
          platforms: ['twitch'],
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when roomTitle is an empty string', async () => {
      const res = await POST(
        makePostRequest('/api/broadcast/start', {
          platforms: ['twitch'],
          roomTitle: '',
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('accepts valid input with single platform', async () => {
      mockFrom.mockReturnValue(
        queuedChain([
          { data: null, error: null }, // platform lookup: no connection
        ]),
      );
      const res = await POST(
        makePostRequest('/api/broadcast/start', {
          platforms: ['twitch'],
          roomTitle: 'My Stream',
        }),
      );
      expect(res.status).toBe(200);
    });

    it('accepts valid input with multiple platforms', async () => {
      mockFrom.mockReturnValue(
        queuedChain([
          { data: null, error: null }, // twitch lookup
          { data: null, error: null }, // kick lookup
        ]),
      );
      const res = await POST(
        makePostRequest('/api/broadcast/start', {
          platforms: ['twitch', 'kick'],
          roomTitle: 'My Stream',
        }),
      );
      expect(res.status).toBe(200);
    });
  });

  describe('Platform connection queries', () => {
    it('queries for each platform with correct session fid', async () => {
      const chain = queuedChain([
        { data: null, error: null }, // twitch
        { data: null, error: null }, // kick
      ]);
      mockFrom.mockReturnValue(chain);

      await POST(
        makePostRequest('/api/broadcast/start', {
          platforms: ['twitch', 'kick'],
          roomTitle: 'Test',
        }),
      );

      expect(mockFrom).toHaveBeenCalledWith('connected_platforms');
      expect(chain.eq).toHaveBeenCalledWith('user_fid', 456);
      expect(chain.eq).toHaveBeenCalledWith('platform', 'twitch');
      expect(chain.eq).toHaveBeenCalledWith('platform', 'kick');
    });

    it('skips platforms with no connection', async () => {
      mockFrom.mockReturnValue(
        queuedChain([
          { data: null, error: null }, // no twitch connection
        ]),
      );
      const res = await POST(
        makePostRequest('/api/broadcast/start', {
          platforms: ['twitch'],
          roomTitle: 'Test Stream',
        }),
      );
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.destinations).toEqual([]);
    });
  });

  describe('Twitch/Kick (stored RTMP)', () => {
    it('returns stored rtmp_url and stream_key for twitch', async () => {
      mockFrom.mockReturnValue(
        queuedChain([
          {
            data: {
              id: 'conn1',
              platform: 'twitch',
              platform_display_name: 'MyTwitch',
              platform_username: 'mytwitch_user',
              rtmp_url: 'rtmps://live-ams.twitch.tv/app/',
              stream_key: 'secret-key-123',
            },
            error: null,
          },
        ]),
      );
      const res = await POST(
        makePostRequest('/api/broadcast/start', {
          platforms: ['twitch'],
          roomTitle: 'Gaming Session',
        }),
      );
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.destinations).toHaveLength(1);
      expect(body.destinations[0]).toMatchObject({
        platform: 'twitch',
        name: 'MyTwitch',
        rtmpUrl: 'rtmps://live-ams.twitch.tv/app/',
        streamKey: 'secret-key-123',
      });
    });

    it('returns stored rtmp_url and stream_key for kick', async () => {
      mockFrom.mockReturnValue(
        queuedChain([
          {
            data: {
              id: 'conn2',
              platform: 'kick',
              platform_display_name: 'KickChannel',
              rtmp_url: 'rtmps://kick.com/app/',
              stream_key: 'kick-secret-456',
            },
            error: null,
          },
        ]),
      );
      const res = await POST(
        makePostRequest('/api/broadcast/start', {
          platforms: ['kick'],
          roomTitle: 'Music Stream',
        }),
      );
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.destinations[0]).toMatchObject({
        platform: 'kick',
        name: 'KickChannel',
        rtmpUrl: 'rtmps://kick.com/app/',
        streamKey: 'kick-secret-456',
      });
    });

    it('skips twitch when rtmp_url is missing', async () => {
      mockFrom.mockReturnValue(
        queuedChain([
          {
            data: {
              id: 'conn1',
              platform: 'twitch',
              platform_display_name: 'MyTwitch',
              stream_key: 'key',
              // rtmp_url missing
            },
            error: null,
          },
        ]),
      );
      const res = await POST(
        makePostRequest('/api/broadcast/start', {
          platforms: ['twitch'],
          roomTitle: 'Test',
        }),
      );
      const body = await res.json();
      expect(body.destinations).toEqual([]);
    });

    it('skips twitch when stream_key is missing', async () => {
      mockFrom.mockReturnValue(
        queuedChain([
          {
            data: {
              id: 'conn1',
              platform: 'twitch',
              rtmp_url: 'rtmps://live.twitch.tv/app/',
              // stream_key missing
            },
            error: null,
          },
        ]),
      );
      const res = await POST(
        makePostRequest('/api/broadcast/start', {
          platforms: ['twitch'],
          roomTitle: 'Test',
        }),
      );
      const body = await res.json();
      expect(body.destinations).toEqual([]);
    });

    it('falls back to platform name when display_name is missing', async () => {
      mockFrom.mockReturnValue(
        queuedChain([
          {
            data: {
              id: 'conn1',
              platform: 'twitch',
              platform_username: 'myuser',
              rtmp_url: 'rtmps://live.twitch.tv/app/',
              stream_key: 'key123',
              // platform_display_name missing
            },
            error: null,
          },
        ]),
      );
      const res = await POST(
        makePostRequest('/api/broadcast/start', {
          platforms: ['twitch'],
          roomTitle: 'Test',
        }),
      );
      const body = await res.json();
      expect(body.destinations[0].name).toBe('myuser');
    });

    it('falls back to platform string when all names are missing', async () => {
      mockFrom.mockReturnValue(
        queuedChain([
          {
            data: {
              id: 'conn1',
              platform: 'kick',
              rtmp_url: 'rtmps://kick.com/app/',
              stream_key: 'key456',
            },
            error: null,
          },
        ]),
      );
      const res = await POST(
        makePostRequest('/api/broadcast/start', {
          platforms: ['kick'],
          roomTitle: 'Test',
        }),
      );
      const body = await res.json();
      expect(body.destinations[0].name).toBe('kick');
    });
  });

  describe('YouTube (via dedicated route)', () => {
    it('fetches from /api/platforms/youtube/broadcast', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({
          rtmpUrl: 'rtmps://a.rtmp.youtube.com/live2/',
          streamKey: 'yt-key-789',
          watchUrl: 'https://youtube.com/watch?v=abc123',
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      mockFrom.mockReturnValue(
        queuedChain([
          {
            data: {
              id: 'conn_yt',
              platform: 'youtube',
              platform_display_name: 'My Channel',
            },
            error: null,
          },
        ]),
      );

      const req = makePostRequest('/api/broadcast/start', {
        platforms: ['youtube'],
        roomTitle: 'Live Gaming',
      });

      const res = await POST(req);
      const body = await res.json();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/platforms/youtube/broadcast'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: expect.any(String),
          },
          body: JSON.stringify({ title: 'Live Gaming' }),
        },
      );

      expect(res.status).toBe(200);
      expect(body.destinations).toHaveLength(1);
      expect(body.destinations[0]).toMatchObject({
        platform: 'youtube',
        name: 'My Channel',
        rtmpUrl: 'rtmps://a.rtmp.youtube.com/live2/',
        streamKey: 'yt-key-789',
        watchUrl: 'https://youtube.com/watch?v=abc123',
      });
    });

    it('passes roomTitle in request body to youtube route', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({
          rtmpUrl: 'rtmp',
          streamKey: 'key',
          watchUrl: 'url',
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      mockFrom.mockReturnValue(
        queuedChain([
          {
            data: {
              id: 'conn_yt',
              platform: 'youtube',
              platform_display_name: 'Channel',
            },
            error: null,
          },
        ]),
      );

      await POST(
        makePostRequest('/api/broadcast/start', {
          platforms: ['youtube'],
          roomTitle: 'Special Event',
        }),
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ title: 'Special Event' }),
        }),
      );
    });

    it('skips youtube when rtmpUrl is missing from response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({
          streamKey: 'key',
          watchUrl: 'url',
          // rtmpUrl missing
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      mockFrom.mockReturnValue(
        queuedChain([
          {
            data: {
              id: 'conn_yt',
              platform: 'youtube',
              platform_display_name: 'Channel',
            },
            error: null,
          },
        ]),
      );

      const res = await POST(
        makePostRequest('/api/broadcast/start', {
          platforms: ['youtube'],
          roomTitle: 'Event',
        }),
      );
      const body = await res.json();
      expect(body.destinations).toEqual([]);
    });

    it('skips youtube when streamKey is missing from response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({
          rtmpUrl: 'rtmps://a.rtmp.youtube.com/live2/',
          watchUrl: 'url',
          // streamKey missing
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      mockFrom.mockReturnValue(
        queuedChain([
          {
            data: {
              id: 'conn_yt',
              platform: 'youtube',
              platform_display_name: 'Channel',
            },
            error: null,
          },
        ]),
      );

      const res = await POST(
        makePostRequest('/api/broadcast/start', {
          platforms: ['youtube'],
          roomTitle: 'Event',
        }),
      );
      const body = await res.json();
      expect(body.destinations).toEqual([]);
    });

    it('handles youtube fetch errors gracefully', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      vi.stubGlobal('fetch', mockFetch);

      mockFrom.mockReturnValue(
        queuedChain([
          {
            data: {
              id: 'conn_yt',
              platform: 'youtube',
              platform_display_name: 'Channel',
            },
            error: null,
          },
        ]),
      );

      const res = await POST(
        makePostRequest('/api/broadcast/start', {
          platforms: ['youtube'],
          roomTitle: 'Event',
        }),
      );
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.destinations).toEqual([]);
    });
  });

  describe('Facebook (via dedicated route)', () => {
    it('fetches from /api/platforms/facebook/broadcast', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({
          rtmpUrl: 'rtmps://live-api-s.facebook.com:443/rtmp/',
          streamKey: 'fb-key-456',
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      mockFrom.mockReturnValue(
        queuedChain([
          {
            data: {
              id: 'conn_fb',
              platform: 'facebook',
              platform_display_name: 'My Page',
            },
            error: null,
          },
        ]),
      );

      const res = await POST(
        makePostRequest('/api/broadcast/start', {
          platforms: ['facebook'],
          roomTitle: 'Community Talk',
        }),
      );
      const body = await res.json();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/platforms/facebook/broadcast'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ title: 'Community Talk' }),
        }),
      );

      expect(res.status).toBe(200);
      expect(body.destinations).toHaveLength(1);
      expect(body.destinations[0]).toMatchObject({
        platform: 'facebook',
        name: 'My Page',
        rtmpUrl: 'rtmps://live-api-s.facebook.com:443/rtmp/',
        streamKey: 'fb-key-456',
      });
    });

    it('does not include watchUrl for facebook', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({
          rtmpUrl: 'rtmps://live-api-s.facebook.com:443/rtmp/',
          streamKey: 'key',
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      mockFrom.mockReturnValue(
        queuedChain([
          {
            data: {
              id: 'conn_fb',
              platform: 'facebook',
              platform_display_name: 'Page',
            },
            error: null,
          },
        ]),
      );

      const res = await POST(
        makePostRequest('/api/broadcast/start', {
          platforms: ['facebook'],
          roomTitle: 'Event',
        }),
      );
      const body = await res.json();
      expect(body.destinations[0]).not.toHaveProperty('watchUrl');
    });

    it('skips facebook when rtmpUrl is missing', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({
          streamKey: 'key',
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      mockFrom.mockReturnValue(
        queuedChain([
          {
            data: {
              id: 'conn_fb',
              platform: 'facebook',
              platform_display_name: 'Page',
            },
            error: null,
          },
        ]),
      );

      const res = await POST(
        makePostRequest('/api/broadcast/start', {
          platforms: ['facebook'],
          roomTitle: 'Event',
        }),
      );
      const body = await res.json();
      expect(body.destinations).toEqual([]);
    });

    it('handles facebook fetch errors gracefully', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Facebook API error'));
      vi.stubGlobal('fetch', mockFetch);

      mockFrom.mockReturnValue(
        queuedChain([
          {
            data: {
              id: 'conn_fb',
              platform: 'facebook',
              platform_display_name: 'Page',
            },
            error: null,
          },
        ]),
      );

      const res = await POST(
        makePostRequest('/api/broadcast/start', {
          platforms: ['facebook'],
          roomTitle: 'Event',
        }),
      );
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.destinations).toEqual([]);
    });
  });

  describe('Multiple platforms', () => {
    it('handles mixed platform types', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({
          rtmpUrl: 'rtmp',
          streamKey: 'key',
          watchUrl: 'url',
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      mockFrom.mockReturnValue(
        queuedChain([
          // twitch
          {
            data: {
              id: 'conn1',
              platform: 'twitch',
              platform_display_name: 'MyTwitch',
              rtmp_url: 'rtmps://live.twitch.tv/app/',
              stream_key: 'twitch-key',
            },
            error: null,
          },
          // youtube
          {
            data: {
              id: 'conn2',
              platform: 'youtube',
              platform_display_name: 'MyChannel',
            },
            error: null,
          },
          // facebook
          {
            data: {
              id: 'conn3',
              platform: 'facebook',
              platform_display_name: 'MyPage',
            },
            error: null,
          },
        ]),
      );

      const res = await POST(
        makePostRequest('/api/broadcast/start', {
          platforms: ['twitch', 'youtube', 'facebook'],
          roomTitle: 'Multi-Platform Stream',
        }),
      );
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.destinations).toHaveLength(3);
      expect(body.destinations.map((d: { platform: string }) => d.platform)).toEqual([
        'twitch',
        'youtube',
        'facebook',
      ]);
    });

    it('includes platforms that succeed and excludes those that fail', async () => {
      const mockFetch = vi.fn();
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          rtmpUrl: 'rtmp',
          streamKey: 'key',
        }),
      });
      mockFetch.mockRejectedValueOnce(new Error('Failed'));
      vi.stubGlobal('fetch', mockFetch);

      mockFrom.mockReturnValue(
        queuedChain([
          // youtube succeeds
          {
            data: {
              id: 'conn_yt',
              platform: 'youtube',
              platform_display_name: 'Channel',
            },
            error: null,
          },
          // facebook fails to fetch
          {
            data: {
              id: 'conn_fb',
              platform: 'facebook',
              platform_display_name: 'Page',
            },
            error: null,
          },
        ]),
      );

      const res = await POST(
        makePostRequest('/api/broadcast/start', {
          platforms: ['youtube', 'facebook'],
          roomTitle: 'Event',
        }),
      );
      const body = await res.json();
      expect(body.destinations).toHaveLength(1);
      expect(body.destinations[0].platform).toBe('youtube');
    });
  });

  describe('Error handling', () => {
    it('returns 500 on uncaught exception', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Supabase is down');
      });

      const res = await POST(
        makePostRequest('/api/broadcast/start', {
          platforms: ['twitch'],
          roomTitle: 'Test',
        }),
      );
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to start broadcast');
    });

    it('returns 500 when JSON parsing fails', async () => {
      const req = new Request(new URL('/api/broadcast/start', 'http://localhost:3000'), {
        method: 'POST',
        body: 'not valid json',
      });

      const res = await POST(req);
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to start broadcast');
    });

    it('returns 200 with empty destinations when all platforms fail', async () => {
      mockFrom.mockReturnValue(
        queuedChain([
          { data: null, error: null }, // twitch: no connection
          { data: null, error: null }, // kick: no connection
        ]),
      );

      const res = await POST(
        makePostRequest('/api/broadcast/start', {
          platforms: ['twitch', 'kick'],
          roomTitle: 'Test',
        }),
      );
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.destinations).toEqual([]);
    });
  });
});
