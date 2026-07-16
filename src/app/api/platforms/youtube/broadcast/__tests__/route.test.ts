import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
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

import { POST } from '../route';

describe('POST /api/platforms/youtube/broadcast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    (global.fetch as ReturnType<typeof vi.fn>).mockClear();
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await POST(makePostRequest('/api/platforms/youtube/broadcast', { title: 'Test' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 when title is missing', async () => {
    const res = await POST(
      makePostRequest('/api/platforms/youtube/broadcast', { description: 'test' }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when title exceeds 100 characters', async () => {
    const longTitle = 'x'.repeat(101);
    const res = await POST(
      makePostRequest('/api/platforms/youtube/broadcast', { title: longTitle }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when YouTube is not connected', async () => {
    const { chain } = chainMock({ data: null, error: new Error('not found') });
    mockFrom.mockReturnValue(chain);
    const res = await POST(makePostRequest('/api/platforms/youtube/broadcast', { title: 'Test' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('YouTube not connected');
  });

  it('returns 401 when YouTube token is expired and no refresh token exists', async () => {
    const platform = {
      access_token: 'old_token',
      refresh_token: null,
      expires_at: new Date(Date.now() - 1000).toISOString(),
    };
    const { chain } = chainMock({ data: platform, error: null });
    mockFrom.mockReturnValue(chain);
    const res = await POST(makePostRequest('/api/platforms/youtube/broadcast', { title: 'Test' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('YouTube token expired — please reconnect');
  });

  it('returns 401 when token refresh fails', async () => {
    const platform = {
      access_token: 'old_token',
      refresh_token: 'refresh_token',
      expires_at: new Date(Date.now() - 1000).toISOString(),
    };
    const { chain } = chainMock({ data: platform, error: null });
    mockFrom.mockReturnValue(chain);

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () => Promise.resolve({ error: 'invalid_grant' }),
    });

    const res = await POST(makePostRequest('/api/platforms/youtube/broadcast', { title: 'Test' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('YouTube token refresh failed — please reconnect');
  });

  it('returns 500 when broadcast creation fails', async () => {
    const platform = {
      access_token: 'valid_token',
      refresh_token: null,
      expires_at: new Date(Date.now() + 3600000).toISOString(),
    };
    const { chain } = chainMock({ data: platform, error: null });
    mockFrom.mockReturnValue(chain);

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () => Promise.resolve({ error: 'invalid_broadcast' }),
    });

    const res = await POST(makePostRequest('/api/platforms/youtube/broadcast', { title: 'Test' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to create YouTube broadcast');
  });

  it('returns 500 when stream creation fails', async () => {
    const platform = {
      access_token: 'valid_token',
      refresh_token: null,
      expires_at: new Date(Date.now() + 3600000).toISOString(),
    };
    const { chain } = chainMock({ data: platform, error: null });
    mockFrom.mockReturnValue(chain);

    const broadcast = { id: 'broadcast_123' };

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () => Promise.resolve(broadcast),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ error: 'invalid_stream' }),
      });

    const res = await POST(makePostRequest('/api/platforms/youtube/broadcast', { title: 'Test' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to create YouTube stream');
  });

  it('returns 500 when bind stream fails', async () => {
    const platform = {
      access_token: 'valid_token',
      refresh_token: null,
      expires_at: new Date(Date.now() + 3600000).toISOString(),
    };
    const { chain } = chainMock({ data: platform, error: null });
    mockFrom.mockReturnValue(chain);

    const broadcast = { id: 'broadcast_123' };
    const stream = {
      id: 'stream_456',
      cdn: { ingestionInfo: { ingestionAddress: 'rtmp://...', streamName: 'key' } },
    };

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () => Promise.resolve(broadcast),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve(stream),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ error: 'bind_failed' }),
      });

    const res = await POST(makePostRequest('/api/platforms/youtube/broadcast', { title: 'Test' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to bind YouTube stream to broadcast');
  });

  it('returns 500 on uncaught exception', async () => {
    mockGetSessionData.mockRejectedValueOnce(new Error('session error'));
    const res = await POST(makePostRequest('/api/platforms/youtube/broadcast', { title: 'Test' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to create broadcast');
  });

  it('succeeds when all YouTube API calls succeed', async () => {
    const platform = {
      access_token: 'valid_token',
      refresh_token: null,
      expires_at: new Date(Date.now() + 3600000).toISOString(),
    };
    const { chain } = chainMock({ data: platform, error: null });
    mockFrom.mockReturnValue(chain);

    const broadcast = { id: 'broadcast_123' };
    const stream = {
      id: 'stream_456',
      cdn: {
        ingestionInfo: {
          ingestionAddress: 'rtmp://example.com/live',
          streamName: 'stream_key_789',
        },
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () => Promise.resolve(broadcast),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve(stream),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ id: 'broadcast_123' }),
      });

    const res = await POST(
      makePostRequest('/api/platforms/youtube/broadcast', {
        title: 'Live Stream Test',
        description: 'Test description',
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.broadcastId).toBe('broadcast_123');
    expect(body.streamId).toBe('stream_456');
    expect(body.rtmpUrl).toBe('rtmp://example.com/live');
    expect(body.streamKey).toBe('stream_key_789');
    expect(body.watchUrl).toBe('https://youtube.com/watch?v=broadcast_123');
  });

  it('refreshes token when expired and includes new token in subsequent API calls', async () => {
    const platform = {
      access_token: 'old_token',
      refresh_token: 'refresh_token_123',
      expires_at: new Date(Date.now() - 1000).toISOString(),
    };
    const { chain } = chainMock({ data: platform, error: null });
    mockFrom.mockReturnValue(chain);

    const refreshResponse = { access_token: 'new_token', expires_in: 3600 };
    const broadcast = { id: 'broadcast_123' };
    const stream = {
      id: 'stream_456',
      cdn: {
        ingestionInfo: { ingestionAddress: 'rtmp://example.com/live', streamName: 'stream_key' },
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () => Promise.resolve(refreshResponse),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve(broadcast),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve(stream),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ id: 'broadcast_123' }),
      });

    const res = await POST(makePostRequest('/api/platforms/youtube/broadcast', { title: 'Test' }));
    expect(res.status).toBe(200);

    // Verify token refresh was called
    expect(global.fetch).toHaveBeenCalledWith(
      'https://oauth2.googleapis.com/token',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
    );

    // Verify the broadcast creation used the new token
    const broadcastCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1];
    expect(broadcastCall[0]).toContain('liveBroadcasts');
    expect(broadcastCall[1].headers.Authorization).toBe('Bearer new_token');
  });

  it('allows optional description field', async () => {
    const platform = {
      access_token: 'valid_token',
      refresh_token: null,
      expires_at: new Date(Date.now() + 3600000).toISOString(),
    };
    const { chain } = chainMock({ data: platform, error: null });
    mockFrom.mockReturnValue(chain);

    const broadcast = { id: 'broadcast_123' };
    const stream = {
      id: 'stream_456',
      cdn: { ingestionInfo: { ingestionAddress: 'rtmp://example.com/live', streamName: 'key' } },
    };

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () => Promise.resolve(broadcast),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve(stream),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ id: 'broadcast_123' }),
      });

    const res = await POST(
      makePostRequest('/api/platforms/youtube/broadcast', { title: 'Test Only' }),
    );
    expect(res.status).toBe(200);

    // Verify broadcast was created with empty description default
    const broadcastCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const bodyStr = broadcastCall[1].body;
    const bodyObj = JSON.parse(bodyStr);
    expect(bodyObj.snippet.description).toBe('');
  });

  it('scopes platform lookup to session fid', async () => {
    const platform = {
      access_token: 'valid_token',
      refresh_token: null,
      expires_at: new Date(Date.now() + 3600000).toISOString(),
    };
    const { chain } = chainMock({ data: platform, error: null });
    mockFrom.mockReturnValue(chain);

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ id: 'broadcast_123' }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ id: 'stream_456', cdn: { ingestionInfo: {} } }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ id: 'broadcast_123' }),
      });

    await POST(makePostRequest('/api/platforms/youtube/broadcast', { title: 'Test' }));

    // Verify the query scoped to user's fid
    expect(chain.eq).toHaveBeenCalledWith('user_fid', 123);
    expect(chain.eq).toHaveBeenCalledWith('platform', 'youtube');
  });
});
