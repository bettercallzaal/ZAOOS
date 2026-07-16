import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  makePostRequest,
  makeRequest,
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
  getSupabaseAdmin: () => ({
    from: mockFrom,
  }),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { DELETE, POST } from '../route';

const VALID_SUBSCRIPTION = {
  subscription: {
    endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
    keys: {
      p256dh: 'base64encodedkey==',
      auth: 'base64encodedauth==',
    },
  },
};

const VALID_ENDPOINT = 'https://fcm.googleapis.com/fcm/send/def456';

describe('POST /api/notifications/push/subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('returns 401 when no session is present', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await POST(
        makePostRequest('/api/notifications/push/subscribe', VALID_SUBSCRIPTION),
      );
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('allows an authenticated user to subscribe', async () => {
      const session = mockAuthenticatedSession({ fid: 456 });
      mockGetSessionData.mockResolvedValue(session);

      const { chain } = chainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/notifications/push/subscribe', VALID_SUBSCRIPTION),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });
  });

  describe('request validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 500 when the body is not valid JSON', async () => {
      const res = await POST(
        makeRequest('/api/notifications/push/subscribe', { method: 'POST', body: '{not json' }),
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Internal server error');
    });

    it('returns 400 when subscription object is missing', async () => {
      const res = await POST(makePostRequest('/api/notifications/push/subscribe', {}));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid subscription');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when endpoint is missing', async () => {
      const res = await POST(
        makePostRequest('/api/notifications/push/subscribe', {
          subscription: {
            keys: {
              p256dh: 'base64encodedkey==',
              auth: 'base64encodedauth==',
            },
          },
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid subscription');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when endpoint is not a valid URL', async () => {
      const res = await POST(
        makePostRequest('/api/notifications/push/subscribe', {
          subscription: {
            endpoint: 'not-a-url',
            keys: {
              p256dh: 'base64encodedkey==',
              auth: 'base64encodedauth==',
            },
          },
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid subscription');
    });

    it('returns 400 when keys object is missing', async () => {
      const res = await POST(
        makePostRequest('/api/notifications/push/subscribe', {
          subscription: {
            endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
          },
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid subscription');
    });

    it('returns 400 when p256dh is missing', async () => {
      const res = await POST(
        makePostRequest('/api/notifications/push/subscribe', {
          subscription: {
            endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
            keys: {
              auth: 'base64encodedauth==',
            },
          },
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid subscription');
    });

    it('returns 400 when p256dh is empty', async () => {
      const res = await POST(
        makePostRequest('/api/notifications/push/subscribe', {
          subscription: {
            endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
            keys: {
              p256dh: '',
              auth: 'base64encodedauth==',
            },
          },
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid subscription');
    });

    it('returns 400 when auth is missing', async () => {
      const res = await POST(
        makePostRequest('/api/notifications/push/subscribe', {
          subscription: {
            endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
            keys: {
              p256dh: 'base64encodedkey==',
            },
          },
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid subscription');
    });

    it('returns 400 when auth is empty', async () => {
      const res = await POST(
        makePostRequest('/api/notifications/push/subscribe', {
          subscription: {
            endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
            keys: {
              p256dh: 'base64encodedkey==',
              auth: '',
            },
          },
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid subscription');
    });
  });

  describe('subscription storage', () => {
    beforeEach(() => {
      const session = mockAuthenticatedSession({ fid: 789 });
      mockGetSessionData.mockResolvedValue(session);
    });

    it('upserts the subscription to the database on success', async () => {
      const { chain } = chainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/notifications/push/subscribe', VALID_SUBSCRIPTION),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('user_push_subscriptions');
      expect(chain.upsert).toHaveBeenCalled();
    });

    it('passes fid, endpoint, and keys to the upsert call', async () => {
      const { chain } = chainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      const session = mockAuthenticatedSession({ fid: 999 });
      mockGetSessionData.mockResolvedValue(session);

      await POST(makePostRequest('/api/notifications/push/subscribe', VALID_SUBSCRIPTION));

      const upsertCall = chain.upsert.mock.calls[0];
      const [data, options] = upsertCall;

      expect(data.fid).toBe(999);
      expect(data.endpoint).toBe('https://fcm.googleapis.com/fcm/send/abc123');
      expect(data.p256dh).toBe('base64encodedkey==');
      expect(data.auth).toBe('base64encodedauth==');
      expect(data.updated_at).toBeDefined();
      expect(options.onConflict).toBe('endpoint');
    });

    it('sets updated_at to current ISO timestamp', async () => {
      const { chain } = chainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      const beforeCall = Date.now();
      await POST(makePostRequest('/api/notifications/push/subscribe', VALID_SUBSCRIPTION));
      const afterCall = Date.now();

      const upsertCall = chain.upsert.mock.calls[0];
      const [data] = upsertCall;

      expect(data.updated_at).toBeDefined();
      expect(typeof data.updated_at).toBe('string');
      const timestamp = new Date(data.updated_at).getTime();
      expect(timestamp).toBeGreaterThanOrEqual(beforeCall);
      expect(timestamp).toBeLessThanOrEqual(afterCall);
    });

    it('returns 500 when Supabase upsert returns an error', async () => {
      const { chain } = chainMock({ data: null, error: 'Database connection failed' });
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/notifications/push/subscribe', VALID_SUBSCRIPTION),
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to save subscription');
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 500 on unexpected exception', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const res = await POST(
        makePostRequest('/api/notifications/push/subscribe', VALID_SUBSCRIPTION),
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Internal server error');
    });

    it('catches and logs errors from request.json()', async () => {
      const req = makeRequest('/api/notifications/push/subscribe', { method: 'POST' });
      req.json = vi.fn().mockRejectedValue(new Error('JSON parse failed'));

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Internal server error');
    });
  });
});

describe('DELETE /api/notifications/push/subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('returns 401 when no session is present', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await DELETE(
        makeRequest('/api/notifications/push/subscribe', {
          method: 'DELETE',
          body: JSON.stringify({ endpoint: VALID_ENDPOINT }),
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('allows an authenticated user to unsubscribe', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 111 }));

      const { chain } = chainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await DELETE(
        makeRequest('/api/notifications/push/subscribe', {
          method: 'DELETE',
          body: JSON.stringify({ endpoint: VALID_ENDPOINT }),
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });
  });

  describe('request validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 500 when the body is not valid JSON', async () => {
      const res = await DELETE(
        makeRequest('/api/notifications/push/subscribe', { method: 'DELETE', body: '{not json' }),
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Internal server error');
    });

    it('returns 400 when endpoint is missing', async () => {
      const res = await DELETE(
        makeRequest('/api/notifications/push/subscribe', {
          method: 'DELETE',
          body: JSON.stringify({}),
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid endpoint');
    });

    it('returns 400 when endpoint is not a valid URL', async () => {
      const res = await DELETE(
        makeRequest('/api/notifications/push/subscribe', {
          method: 'DELETE',
          body: JSON.stringify({ endpoint: 'not-a-url' }),
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid endpoint');
    });

    it('returns 400 when endpoint is null', async () => {
      const res = await DELETE(
        makeRequest('/api/notifications/push/subscribe', {
          method: 'DELETE',
          body: JSON.stringify({ endpoint: null }),
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid endpoint');
    });
  });

  describe('subscription deletion', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 222 }));
    });

    it('deletes the subscription from the database by fid and endpoint', async () => {
      const { chain } = chainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await DELETE(
        makeRequest('/api/notifications/push/subscribe', {
          method: 'DELETE',
          body: JSON.stringify({ endpoint: VALID_ENDPOINT }),
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('user_push_subscriptions');
      expect(chain.delete).toHaveBeenCalled();
    });

    it('chains eq calls for fid and endpoint filtering', async () => {
      const { chain } = chainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      const session = mockAuthenticatedSession({ fid: 333 });
      mockGetSessionData.mockResolvedValue(session);

      await DELETE(
        makeRequest('/api/notifications/push/subscribe', {
          method: 'DELETE',
          body: JSON.stringify({ endpoint: VALID_ENDPOINT }),
        }),
      );

      expect(chain.delete).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith('fid', 333);
      expect(chain.eq).toHaveBeenCalledWith('endpoint', VALID_ENDPOINT);
    });

    it('returns 200 success even if no rows matched', async () => {
      const { chain } = chainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await DELETE(
        makeRequest('/api/notifications/push/subscribe', {
          method: 'DELETE',
          body: JSON.stringify({ endpoint: 'https://example.com/nonexistent' }),
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 500 on unexpected exception during deletion', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Unexpected database error');
      });

      const res = await DELETE(
        makeRequest('/api/notifications/push/subscribe', {
          method: 'DELETE',
          body: JSON.stringify({ endpoint: VALID_ENDPOINT }),
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Internal server error');
    });

    it('catches and logs errors from request.json()', async () => {
      const req = makeRequest('/api/notifications/push/subscribe', { method: 'DELETE' });
      req.json = vi.fn().mockRejectedValue(new Error('JSON parse failed'));

      const res = await DELETE(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Internal server error');
    });
  });
});
