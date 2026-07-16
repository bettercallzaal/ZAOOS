import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  makeGetRequest,
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

vi.stubGlobal('fetch', vi.fn());

// Mock environment variables
process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID = 'test-twitch-client-id-12345';

import { GET, POST } from '../route';

describe('GET /api/twitch/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  describe('authentication guard', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
      const res = await GET(makeGetRequest('/api/twitch/chat'));
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  describe('missing channel parameter', () => {
    it('returns 400 when channel parameter is missing', async () => {
      const res = await GET(makeGetRequest('/api/twitch/chat'));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Missing channel parameter');
    });
  });

  describe('Twitch connection lookup', () => {
    it('returns connection info with chat scopes', async () => {
      const platformData = {
        platform_user_id: 'twitch-user-123',
        platform_username: 'teststreamer',
        scopes: 'chat:read chat:edit',
        access_token: 'valid-access-token',
      };
      const { chain } = chainMock({ data: platformData });
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/twitch/chat', { channel: 'testchannel' }));
      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.channel).toBe('testchannel');
      expect(body.connected).toBe(true);
      expect(body.canRead).toBe(true);
      expect(body.canSend).toBe(true);
      expect(body.platformUserId).toBe('twitch-user-123');
      expect(body.popoutUrl).toBe('https://www.twitch.tv/popout/testchannel/chat');

      // Verify Supabase query chain
      expect(chain.select).toHaveBeenCalledWith(
        'platform_user_id, platform_username, scopes, access_token',
      );
      expect(chain.eq).toHaveBeenCalledWith('user_fid', 123);
      expect(chain.eq).toHaveBeenCalledWith('platform', 'twitch');
      expect(chain.single).toHaveBeenCalled();
    });

    it('returns connected: false when user has no Twitch connection', async () => {
      const { chain } = chainMock({ data: null });
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/twitch/chat', { channel: 'testchannel' }));
      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.channel).toBe('testchannel');
      expect(body.connected).toBe(false);
      expect(body.canRead).toBe(false);
      expect(body.canSend).toBe(false);
      expect(body.platformUserId).toBe(null);
    });

    it('returns correct scope flags when user has only chat:read', async () => {
      const platformData = {
        platform_user_id: 'twitch-user-123',
        platform_username: 'teststreamer',
        scopes: 'chat:read',
        access_token: 'valid-access-token',
      };
      const { chain } = chainMock({ data: platformData });
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/twitch/chat', { channel: 'testchannel' }));
      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.connected).toBe(true);
      expect(body.canRead).toBe(true);
      expect(body.canSend).toBe(false);
    });

    it('URL-encodes channel name in popoutUrl', async () => {
      const platformData = {
        platform_user_id: 'twitch-user-123',
        platform_username: 'teststreamer',
        scopes: 'chat:read chat:edit',
        access_token: 'valid-access-token',
      };
      const { chain } = chainMock({ data: platformData });
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/twitch/chat', { channel: 'test channel' }));
      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.popoutUrl).toContain(encodeURIComponent('test channel'));
    });
  });

  describe('error handling', () => {
    it('returns 500 on unexpected exception', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('database connection failed');
      });

      const res = await GET(makeGetRequest('/api/twitch/chat', { channel: 'test' }));
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to check Twitch chat');
    });
  });
});

describe('POST /api/twitch/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        data: [{ id: 'broadcaster-123' }],
      }),
    });
  });

  describe('authentication guard', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
      const res = await POST(
        makePostRequest('/api/twitch/chat', { message: 'Hello', channel: 'testchannel' }),
      );
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  describe('Zod validation', () => {
    it('returns 400 when message is empty', async () => {
      const res = await POST(
        makePostRequest('/api/twitch/chat', { message: '', channel: 'testchannel' }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when message exceeds 500 characters', async () => {
      const longMessage = 'a'.repeat(501);
      const res = await POST(
        makePostRequest('/api/twitch/chat', { message: longMessage, channel: 'testchannel' }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when channel is empty', async () => {
      const res = await POST(
        makePostRequest('/api/twitch/chat', { message: 'Hello', channel: '' }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when channel exceeds 100 characters', async () => {
      const longChannel = 'a'.repeat(101);
      const res = await POST(
        makePostRequest('/api/twitch/chat', { message: 'Hello', channel: longChannel }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when required fields are missing', async () => {
      const res = await POST(makePostRequest('/api/twitch/chat', { message: 'Hello' }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });
  });

  describe('Twitch connection check', () => {
    it('returns 400 when user has no Twitch connection', async () => {
      const { chain } = chainMock({ data: null });
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/twitch/chat', { message: 'Hello', channel: 'testchannel' }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Twitch account not connected');
    });

    it('returns 400 when Twitch connection has no access_token', async () => {
      const platformData = {
        platform_user_id: 'twitch-user-123',
        scopes: 'chat:read chat:edit',
        access_token: null,
      };
      const { chain } = chainMock({ data: platformData });
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/twitch/chat', { message: 'Hello', channel: 'testchannel' }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Twitch account not connected');
    });
  });

  describe('scope validation', () => {
    it('returns 400 with needsReauth flag when chat:edit scope is missing', async () => {
      const platformData = {
        platform_user_id: 'twitch-user-123',
        scopes: 'chat:read',
        access_token: 'valid-access-token',
      };
      const { chain } = chainMock({ data: platformData });
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/twitch/chat', { message: 'Hello', channel: 'testchannel' }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('Missing chat:edit scope');
      expect(body.needsReauth).toBe(true);
    });
  });

  describe('Twitch API integration', () => {
    it('resolves broadcaster ID from channel username', async () => {
      const platformData = {
        platform_user_id: 'twitch-user-123',
        scopes: 'chat:read chat:edit',
        access_token: 'valid-access-token',
      };
      const { chain } = chainMock({ data: platformData });
      mockFrom.mockReturnValue(chain);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: [{ id: 'broadcaster-456' }],
        }),
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      });

      const res = await POST(
        makePostRequest('/api/twitch/chat', { message: 'Hello', channel: 'testchannel' }),
      );
      expect(res.status).toBe(200);

      // Verify fetch was called to get broadcaster ID
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/users?login=testchannel',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer valid-access-token',
            'Client-Id': 'test-twitch-client-id-12345',
          }),
        }),
      );
    });

    it('returns 404 when channel username is not found', async () => {
      const platformData = {
        platform_user_id: 'twitch-user-123',
        scopes: 'chat:read chat:edit',
        access_token: 'valid-access-token',
      };
      const { chain } = chainMock({ data: platformData });
      mockFrom.mockReturnValue(chain);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: [],
        }),
      });

      const res = await POST(
        makePostRequest('/api/twitch/chat', { message: 'Hello', channel: 'nonexistentchannel' }),
      );
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe('Channel not found');
    });

    it('sends message to Twitch chat via Helix API', async () => {
      const platformData = {
        platform_user_id: 'twitch-user-123',
        scopes: 'chat:read chat:edit',
        access_token: 'valid-access-token',
      };
      const { chain } = chainMock({ data: platformData });
      mockFrom.mockReturnValue(chain);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: [{ id: 'broadcaster-456' }],
        }),
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      });

      const res = await POST(
        makePostRequest('/api/twitch/chat', { message: 'Hello Twitch!', channel: 'testchannel' }),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.sent).toBe(true);

      // Verify second fetch call sends the chat message
      const secondFetchCall = vi.mocked(global.fetch).mock.calls[1];
      expect(secondFetchCall[0]).toBe('https://api.twitch.tv/helix/chat/messages');
      expect(secondFetchCall[1]).toEqual({
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-access-token',
          'Client-Id': 'test-twitch-client-id-12345',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          broadcaster_id: 'broadcaster-456',
          sender_id: 'twitch-user-123',
          message: 'Hello Twitch!',
        }),
      });
    });

    it('returns error status from Twitch API when send fails', async () => {
      const platformData = {
        platform_user_id: 'twitch-user-123',
        scopes: 'chat:read chat:edit',
        access_token: 'valid-access-token',
      };
      const { chain } = chainMock({ data: platformData });
      mockFrom.mockReturnValue(chain);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: [{ id: 'broadcaster-456' }],
        }),
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: vi.fn().mockResolvedValue({
          error: 'Forbidden',
          message: 'User does not have permission to send messages',
        }),
      });

      const res = await POST(
        makePostRequest('/api/twitch/chat', { message: 'Hello', channel: 'testchannel' }),
      );
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe('Failed to send message to Twitch');
    });

    it('handles Twitch API error response gracefully', async () => {
      const platformData = {
        platform_user_id: 'twitch-user-123',
        scopes: 'chat:read chat:edit',
        access_token: 'valid-access-token',
      };
      const { chain } = chainMock({ data: platformData });
      mockFrom.mockReturnValue(chain);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: [{ id: 'broadcaster-456' }],
        }),
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: vi.fn().mockRejectedValue(new SyntaxError('Invalid JSON')),
      });

      const res = await POST(
        makePostRequest('/api/twitch/chat', { message: 'Hello', channel: 'testchannel' }),
      );
      expect(res.status).toBe(429);
      const body = await res.json();
      expect(body.error).toBe('Failed to send message to Twitch');
    });
  });

  describe('environment configuration', () => {
    it('returns 500 when NEXT_PUBLIC_TWITCH_CLIENT_ID is not set', async () => {
      const originalClientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
      delete process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;

      const platformData = {
        platform_user_id: 'twitch-user-123',
        scopes: 'chat:read chat:edit',
        access_token: 'valid-access-token',
      };
      const { chain } = chainMock({ data: platformData });
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/twitch/chat', { message: 'Hello', channel: 'testchannel' }),
      );
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Twitch not configured');

      process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID = originalClientId;
    });
  });

  describe('error handling', () => {
    it('returns 500 on unexpected exception during Supabase query', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('database connection failed');
      });

      const res = await POST(
        makePostRequest('/api/twitch/chat', { message: 'Hello', channel: 'testchannel' }),
      );
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to send chat message');
    });

    it('returns 500 when fetch throws during broadcaster lookup', async () => {
      const platformData = {
        platform_user_id: 'twitch-user-123',
        scopes: 'chat:read chat:edit',
        access_token: 'valid-access-token',
      };
      const { chain } = chainMock({ data: platformData });
      mockFrom.mockReturnValue(chain);

      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

      const res = await POST(
        makePostRequest('/api/twitch/chat', { message: 'Hello', channel: 'testchannel' }),
      );
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to send chat message');
    });

    it('returns 500 when req.json() throws', async () => {
      const req = makePostRequest('/api/twitch/chat', { message: 'Hello', channel: 'test' });
      vi.spyOn(req, 'json').mockRejectedValue(new SyntaxError('Unexpected token'));

      const res = await POST(req);
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to send chat message');
    });
  });
});
