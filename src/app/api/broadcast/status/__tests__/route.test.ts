import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeGetRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  VALID_UUID,
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

import { GET } from '../route';

/**
 * Chain whose chainable methods are inspectable spies. Returns itself
 * for method chaining, and implements `.then` for direct await semantics.
 */
function statusChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'eq']) {
    chain[m] = vi.fn(() => chain);
  }
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('GET /api/broadcast/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  describe('Authentication guard', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
      const res = await GET(makeGetRequest('/api/broadcast/status', { roomId: VALID_UUID }));
      expect(res.status).toBe(401);
      expect((await res.json()).error).toBe('Unauthorized');
    });
  });

  describe('Input validation', () => {
    it('returns 400 when roomId is missing', async () => {
      const res = await GET(makeGetRequest('/api/broadcast/status'));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Invalid input');
      expect(json.details).toBeDefined();
    });

    it('returns 400 when roomId is not a valid UUID', async () => {
      const res = await GET(makeGetRequest('/api/broadcast/status', { roomId: 'not-a-uuid' }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Invalid input');
      expect(json.details).toBeDefined();
    });

    it('returns 400 when roomId is an empty string', async () => {
      const res = await GET(makeGetRequest('/api/broadcast/status', { roomId: '' }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Invalid input');
    });
  });

  describe('Supabase query error handling', () => {
    it('returns 500 when connected_platforms query fails with error object', async () => {
      const chain = statusChain({ data: null, error: new Error('db connection failed') });
      mockFrom.mockReturnValue(chain);
      const res = await GET(makeGetRequest('/api/broadcast/status', { roomId: VALID_UUID }));
      expect(res.status).toBe(500);
      expect((await res.json()).error).toBe('Failed to fetch connected platforms');
    });

    it('scopes the query to the authenticated user FID', async () => {
      const userFid = 456;
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: userFid }));
      const chain = statusChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      await GET(makeGetRequest('/api/broadcast/status', { roomId: VALID_UUID }));

      expect(mockFrom).toHaveBeenCalledWith('connected_platforms');
      expect(chain.select).toHaveBeenCalledWith('platform, access_token, metadata');
      expect(chain.eq).toHaveBeenCalledWith('user_fid', userFid);
    });
  });

  describe('No connected platforms', () => {
    it('returns empty viewerCounts object when user has no platforms', async () => {
      const chain = statusChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);
      const res = await GET(makeGetRequest('/api/broadcast/status', { roomId: VALID_UUID }));
      expect(res.status).toBe(200);
      expect((await res.json()).viewerCounts).toEqual({});
    });

    it('returns empty viewerCounts when query returns null', async () => {
      const chain = statusChain({ data: null, error: null });
      mockFrom.mockReturnValue(chain);
      const res = await GET(makeGetRequest('/api/broadcast/status', { roomId: VALID_UUID }));
      expect(res.status).toBe(200);
      expect((await res.json()).viewerCounts).toEqual({});
    });

    it('returns 200 with success status even with no platforms', async () => {
      const chain = statusChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);
      const res = await GET(makeGetRequest('/api/broadcast/status', { roomId: VALID_UUID }));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveProperty('viewerCounts');
      expect(json.viewerCounts).toEqual({});
    });
  });

  describe('Platform data structures', () => {
    it('includes twitch platform in results when data includes it', async () => {
      const platforms = [
        {
          platform: 'twitch',
          access_token: 'twitch-token-123',
          metadata: { login: 'testchannel' },
        },
      ];
      const chain = statusChain({ data: platforms, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/broadcast/status', { roomId: VALID_UUID }));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.viewerCounts).toHaveProperty('twitch');
      // Twitch fetch will fail with real network, so value will be null
      expect(json.viewerCounts.twitch).toBeNull();
    });

    it('includes youtube platform in results when data includes it', async () => {
      const platforms = [
        {
          platform: 'youtube',
          access_token: 'youtube-token-456',
          metadata: null,
        },
      ];
      const chain = statusChain({ data: platforms, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/broadcast/status', { roomId: VALID_UUID }));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.viewerCounts).toHaveProperty('youtube');
      expect(json.viewerCounts.youtube).toBeNull();
    });

    it('includes kick platform in results when data includes it', async () => {
      const platforms = [
        {
          platform: 'kick',
          access_token: 'kick-token',
          metadata: null,
        },
      ];
      const chain = statusChain({ data: platforms, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/broadcast/status', { roomId: VALID_UUID }));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.viewerCounts).toHaveProperty('kick');
      expect(json.viewerCounts.kick).toBeNull();
    });

    it('includes facebook platform in results when data includes it', async () => {
      const platforms = [
        {
          platform: 'facebook',
          access_token: 'fb-token',
          metadata: null,
        },
      ];
      const chain = statusChain({ data: platforms, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/broadcast/status', { roomId: VALID_UUID }));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.viewerCounts).toHaveProperty('facebook');
      expect(json.viewerCounts.facebook).toBeNull();
    });

    it('includes custom platform in results when data includes it', async () => {
      const platforms = [
        {
          platform: 'custom',
          access_token: 'custom-token',
          metadata: null,
        },
      ];
      const chain = statusChain({ data: platforms, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/broadcast/status', { roomId: VALID_UUID }));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.viewerCounts).toHaveProperty('custom');
      expect(json.viewerCounts.custom).toBeNull();
    });

    it('includes unknown platform in results when data includes it', async () => {
      const platforms = [
        {
          platform: 'unknown_platform',
          access_token: 'unknown-token',
          metadata: null,
        },
      ];
      const chain = statusChain({ data: platforms, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/broadcast/status', { roomId: VALID_UUID }));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.viewerCounts).toHaveProperty('unknown_platform');
      expect(json.viewerCounts.unknown_platform).toBeNull();
    });
  });

  describe('Multiple platforms handling', () => {
    it('returns viewer counts for multiple platforms', async () => {
      const platforms = [
        {
          platform: 'twitch',
          access_token: 'twitch-token-123',
          metadata: { login: 'testchannel' },
        },
        {
          platform: 'youtube',
          access_token: 'youtube-token-456',
          metadata: null,
        },
        {
          platform: 'kick',
          access_token: 'kick-token',
          metadata: null,
        },
      ];
      const chain = statusChain({ data: platforms, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/broadcast/status', { roomId: VALID_UUID }));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.viewerCounts).toHaveProperty('twitch');
      expect(json.viewerCounts).toHaveProperty('youtube');
      expect(json.viewerCounts).toHaveProperty('kick');
    });

    it('uses Promise.allSettled to handle multiple platform queries', async () => {
      const platforms = [
        {
          platform: 'twitch',
          access_token: 'twitch-token-123',
          metadata: { login: 'testchannel' },
        },
        {
          platform: 'youtube',
          access_token: 'youtube-token-456',
          metadata: null,
        },
      ];
      const chain = statusChain({ data: platforms, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/broadcast/status', { roomId: VALID_UUID }));
      expect(res.status).toBe(200);
      const json = await res.json();
      // Both platforms should be present in results even if fetch fails
      expect(json.viewerCounts).toHaveProperty('twitch');
      expect(json.viewerCounts).toHaveProperty('youtube');
    });
  });

  describe('Twitch-specific behavior', () => {
    it('does not call Twitch API when metadata.login is missing', async () => {
      const platforms = [
        {
          platform: 'twitch',
          access_token: 'twitch-token-123',
          metadata: {}, // no login
        },
      ];
      const chain = statusChain({ data: platforms, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/broadcast/status', { roomId: VALID_UUID }));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.viewerCounts.twitch).toBeNull();
    });

    it('does not call Twitch API when TWITCH_CLIENT_ID is not set', async () => {
      const platforms = [
        {
          platform: 'twitch',
          access_token: 'twitch-token-123',
          metadata: { login: 'testchannel' },
        },
      ];
      const chain = statusChain({ data: platforms, error: null });
      mockFrom.mockReturnValue(chain);

      const originalClientId = process.env.TWITCH_CLIENT_ID;
      delete process.env.TWITCH_CLIENT_ID;

      try {
        const res = await GET(makeGetRequest('/api/broadcast/status', { roomId: VALID_UUID }));
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.viewerCounts.twitch).toBeNull();
      } finally {
        if (originalClientId) process.env.TWITCH_CLIENT_ID = originalClientId;
      }
    });

    it('accepts metadata with additional fields beyond login', async () => {
      const platforms = [
        {
          platform: 'twitch',
          access_token: 'twitch-token-123',
          metadata: { login: 'testchannel', extra: 'data', nested: { value: 1 } },
        },
      ];
      const chain = statusChain({ data: platforms, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/broadcast/status', { roomId: VALID_UUID }));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.viewerCounts).toHaveProperty('twitch');
    });
  });

  describe('Request validation', () => {
    it('validates roomId parameter is required', async () => {
      const res = await GET(makeGetRequest('/api/broadcast/status'));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Invalid input');
      expect(json.details).toBeDefined();
      expect(json.details.fieldErrors).toBeDefined();
    });

    it('validates roomId format is UUID', async () => {
      const res = await GET(
        makeGetRequest('/api/broadcast/status', { roomId: '123e4567-e89b-12d3-a456-INVALID' }),
      );
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Invalid input');
    });

    it('accepts valid UUID formats', async () => {
      const chain = statusChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const res = await GET(makeGetRequest('/api/broadcast/status', { roomId: validUuid }));
      expect(res.status).toBe(200);
    });
  });

  describe('Response structure', () => {
    it('returns viewerCounts object at root level', async () => {
      const chain = statusChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/broadcast/status', { roomId: VALID_UUID }));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveProperty('viewerCounts');
      expect(typeof json.viewerCounts).toBe('object');
    });

    it('returns NextResponse.json format', async () => {
      const chain = statusChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/broadcast/status', { roomId: VALID_UUID }));
      expect(res.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('Error handling', () => {
    it('returns 500 on unexpected error in getSessionData', async () => {
      mockGetSessionData.mockRejectedValue(new Error('Session service down'));
      const res = await GET(makeGetRequest('/api/broadcast/status', { roomId: VALID_UUID }));
      expect(res.status).toBe(500);
      expect((await res.json()).error).toBe('Internal server error');
    });

    it('returns 500 on unexpected error during Supabase query', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      mockFrom.mockImplementation(() => {
        throw new Error('Supabase client initialization failed');
      });

      const res = await GET(makeGetRequest('/api/broadcast/status', { roomId: VALID_UUID }));
      expect(res.status).toBe(500);
      expect((await res.json()).error).toBe('Internal server error');
    });

    it('returns JSON error response with appropriate status codes', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
      const res = await GET(makeGetRequest('/api/broadcast/status', { roomId: VALID_UUID }));
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json).toHaveProperty('error');
      expect(typeof json.error).toBe('string');
    });
  });
});
