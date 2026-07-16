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
  getSupabaseAdmin: () => ({
    from: mockFrom,
  }),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { POST } from '../route';

/**
 * Chain mock for upsert queries. The `upsert` method chains and resolves
 * to { data, error } when awaited via `.then`.
 */
function upsertChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  chain.upsert = vi.fn().mockImplementation(() => {
    // Return a thenable that resolves to the result
    return {
      // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
      then: (resolve: (v: unknown) => void) => resolve(result),
    };
  });

  return chain;
}

describe('POST /api/overlay/now-playing/update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  });

  // ---------- Authentication ----------

  it('returns 401 when unauthenticated (no session)', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 'Song',
        artistName: 'Artist',
        platform: 'spotify',
        isPlaying: true,
      }),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when session exists but fid is missing', async () => {
    mockGetSessionData.mockResolvedValue({ username: 'testuser' }); // No fid
    const res = await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 'Song',
        artistName: 'Artist',
        platform: 'spotify',
        isPlaying: true,
      }),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  // ---------- Input Validation: Required Fields ----------

  it('returns 400 when trackName is missing', async () => {
    const res = await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        artistName: 'Artist',
        platform: 'spotify',
        isPlaying: true,
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when artistName is missing', async () => {
    const res = await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 'Song',
        platform: 'spotify',
        isPlaying: true,
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when platform is missing', async () => {
    const res = await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 'Song',
        artistName: 'Artist',
        isPlaying: true,
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when isPlaying is missing', async () => {
    const res = await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 'Song',
        artistName: 'Artist',
        platform: 'spotify',
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  // ---------- Input Validation: Field Types ----------

  it('returns 400 when trackName is not a string', async () => {
    const res = await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 123,
        artistName: 'Artist',
        platform: 'spotify',
        isPlaying: true,
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when isPlaying is not a boolean', async () => {
    const res = await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 'Song',
        artistName: 'Artist',
        platform: 'spotify',
        isPlaying: 'true',
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  // ---------- Input Validation: String Length Constraints ----------

  it('returns 400 when trackName is empty string', async () => {
    const res = await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: '',
        artistName: 'Artist',
        platform: 'spotify',
        isPlaying: true,
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when trackName exceeds 300 characters', async () => {
    const longName = 'a'.repeat(301);
    const res = await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: longName,
        artistName: 'Artist',
        platform: 'spotify',
        isPlaying: true,
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('accepts trackName at exactly 300 characters', async () => {
    const chain = upsertChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const exactName = 'a'.repeat(300);
    const res = await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: exactName,
        artistName: 'Artist',
        platform: 'spotify',
        isPlaying: true,
      }),
    );
    expect(res.status).toBe(200);
  });

  it('returns 400 when artistName is empty string', async () => {
    const res = await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 'Song',
        artistName: '',
        platform: 'spotify',
        isPlaying: true,
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when artistName exceeds 300 characters', async () => {
    const longName = 'a'.repeat(301);
    const res = await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 'Song',
        artistName: longName,
        platform: 'spotify',
        isPlaying: true,
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when platform is empty string', async () => {
    const res = await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 'Song',
        artistName: 'Artist',
        platform: '',
        isPlaying: true,
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when platform exceeds 50 characters', async () => {
    const longPlatform = 'a'.repeat(51);
    const res = await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 'Song',
        artistName: 'Artist',
        platform: longPlatform,
        isPlaying: true,
      }),
    );
    expect(res.status).toBe(400);
  });

  // ---------- Input Validation: Optional Fields ----------

  it('returns 400 when artworkUrl is not a valid URL', async () => {
    const res = await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 'Song',
        artistName: 'Artist',
        artworkUrl: 'not-a-url',
        platform: 'spotify',
        isPlaying: true,
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('accepts artworkUrl as valid URL', async () => {
    const chain = upsertChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 'Song',
        artistName: 'Artist',
        artworkUrl: 'https://example.com/art.jpg',
        platform: 'spotify',
        isPlaying: true,
      }),
    );
    expect(res.status).toBe(200);
  });

  it('accepts omitted artworkUrl', async () => {
    const chain = upsertChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 'Song',
        artistName: 'Artist',
        platform: 'spotify',
        isPlaying: true,
      }),
    );
    expect(res.status).toBe(200);
  });

  it('returns 400 when position is negative', async () => {
    const res = await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 'Song',
        artistName: 'Artist',
        platform: 'spotify',
        position: -1,
        isPlaying: true,
      }),
    );
    expect(res.status).toBe(400);
  });

  it('accepts position as 0', async () => {
    const chain = upsertChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 'Song',
        artistName: 'Artist',
        platform: 'spotify',
        position: 0,
        isPlaying: true,
      }),
    );
    expect(res.status).toBe(200);
  });

  it('accepts position as positive number', async () => {
    const chain = upsertChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 'Song',
        artistName: 'Artist',
        platform: 'spotify',
        position: 45000,
        isPlaying: true,
      }),
    );
    expect(res.status).toBe(200);
  });

  it('returns 400 when duration is negative', async () => {
    const res = await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 'Song',
        artistName: 'Artist',
        platform: 'spotify',
        duration: -1,
        isPlaying: true,
      }),
    );
    expect(res.status).toBe(400);
  });

  it('accepts omitted url', async () => {
    const chain = upsertChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 'Song',
        artistName: 'Artist',
        platform: 'spotify',
        isPlaying: true,
      }),
    );
    expect(res.status).toBe(200);
  });

  it('returns 400 when url exceeds 1000 characters', async () => {
    const longUrl = `https://example.com/${'a'.repeat(981)}`;
    const res = await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 'Song',
        artistName: 'Artist',
        platform: 'spotify',
        url: longUrl,
        isPlaying: true,
      }),
    );
    expect(res.status).toBe(400);
  });

  // ---------- Upsert Success ----------

  it('upserts record with all required fields', async () => {
    const chain = upsertChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 'Midnight Dream',
        artistName: 'Cosmic Echo',
        platform: 'spotify',
        isPlaying: true,
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    // Verify upsert was called with correct payload structure
    expect(chain.upsert).toHaveBeenCalled();
    const [upsertPayload, upsertOptions] = vi.mocked(chain.upsert).mock.calls[0];

    expect(upsertPayload.fid).toBe(123); // From session
    expect(upsertPayload.track_name).toBe('Midnight Dream');
    expect(upsertPayload.artist_name).toBe('Cosmic Echo');
    expect(upsertPayload.platform).toBe('spotify');
    expect(upsertPayload.is_playing).toBe(true);
    expect(upsertPayload.position).toBe(0);
    expect(upsertPayload.duration).toBe(0);
    expect(upsertPayload.artwork_url).toBeNull();
    expect(upsertPayload.track_url).toBeNull();
    expect(upsertPayload.updated_at).toBeDefined();
    expect(typeof upsertPayload.updated_at).toBe('string');

    // Verify onConflict strategy
    expect(upsertOptions.onConflict).toBe('fid');
  });

  it('upserts with all optional fields populated', async () => {
    const chain = upsertChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 'Song',
        artistName: 'Artist',
        artworkUrl: 'https://example.com/art.jpg',
        platform: 'apple_music',
        position: 45000,
        duration: 240000,
        url: 'https://apple.com/track/123',
        isPlaying: false,
      }),
    );

    expect(res.status).toBe(200);

    const [upsertPayload] = vi.mocked(chain.upsert).mock.calls[0];
    expect(upsertPayload.artwork_url).toBe('https://example.com/art.jpg');
    expect(upsertPayload.position).toBe(45000);
    expect(upsertPayload.duration).toBe(240000);
    expect(upsertPayload.track_url).toBe('https://apple.com/track/123');
    expect(upsertPayload.is_playing).toBe(false);
  });

  it('treats optional fields as null when omitted', async () => {
    const chain = upsertChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 'Song',
        artistName: 'Artist',
        platform: 'spotify',
        isPlaying: true,
      }),
    );

    const [upsertPayload] = vi.mocked(chain.upsert).mock.calls[0];
    expect(upsertPayload.artwork_url).toBeNull();
    expect(upsertPayload.track_url).toBeNull();
  });

  it('defaults position to 0 when not provided', async () => {
    const chain = upsertChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 'Song',
        artistName: 'Artist',
        platform: 'spotify',
        isPlaying: true,
      }),
    );

    const [upsertPayload] = vi.mocked(chain.upsert).mock.calls[0];
    expect(upsertPayload.position).toBe(0);
  });

  it('defaults duration to 0 when not provided', async () => {
    const chain = upsertChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 'Song',
        artistName: 'Artist',
        platform: 'spotify',
        isPlaying: true,
      }),
    );

    const [upsertPayload] = vi.mocked(chain.upsert).mock.calls[0];
    expect(upsertPayload.duration).toBe(0);
  });

  it('includes updated_at timestamp in ISO format', async () => {
    const chain = upsertChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const beforeTime = new Date();
    await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 'Song',
        artistName: 'Artist',
        platform: 'spotify',
        isPlaying: true,
      }),
    );
    const afterTime = new Date();

    const [upsertPayload] = vi.mocked(chain.upsert).mock.calls[0];
    const updatedAt = new Date(upsertPayload.updated_at);

    expect(updatedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(updatedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
  });

  // ---------- Error Handling ----------

  it('returns 500 when supabase upsert error occurs', async () => {
    const chain = upsertChain({ data: null, error: new Error('db connection failed') });
    mockFrom.mockReturnValue(chain);

    const res = await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 'Song',
        artistName: 'Artist',
        platform: 'spotify',
        isPlaying: true,
      }),
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to update now playing');
  });

  it('returns 500 when upsert throws exception', async () => {
    mockFrom.mockReturnValue({
      upsert: vi.fn().mockImplementation(() => {
        throw new Error('unexpected error');
      }),
    });

    const res = await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 'Song',
        artistName: 'Artist',
        platform: 'spotify',
        isPlaying: true,
      }),
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to update now playing');
  });

  it('returns 500 when getSupabaseAdmin throws', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('supabase initialization failed');
    });

    const res = await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 'Song',
        artistName: 'Artist',
        platform: 'spotify',
        isPlaying: true,
      }),
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to update now playing');
  });

  it('logs error when supabase operation fails', async () => {
    const { logger } = await import('@/lib/logger');
    const chain = upsertChain({ data: null, error: new Error('db error') });
    mockFrom.mockReturnValue(chain);

    await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 'Song',
        artistName: 'Artist',
        platform: 'spotify',
        isPlaying: true,
      }),
    );

    expect(logger.error).toHaveBeenCalled();
  });

  // ---------- Response Format ----------

  it('returns success: true on successful upsert', async () => {
    const chain = upsertChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 'Song',
        artistName: 'Artist',
        platform: 'spotify',
        isPlaying: true,
      }),
    );

    const body = await res.json();
    expect(body).toEqual({ success: true });
  });

  // ---------- Multiple Users (FID Isolation) ----------

  it('scopes upsert to the authenticated user fid', async () => {
    const chain = upsertChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 999 }));

    await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 'Song',
        artistName: 'Artist',
        platform: 'spotify',
        isPlaying: true,
      }),
    );

    const [upsertPayload] = vi.mocked(chain.upsert).mock.calls[0];
    expect(upsertPayload.fid).toBe(999);
  });

  it('correctly updates an existing user record via upsert', async () => {
    const chain = upsertChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    // First update
    await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 'Song A',
        artistName: 'Artist A',
        platform: 'spotify',
        isPlaying: true,
      }),
    );

    // Second update (same FID, different track)
    await POST(
      makePostRequest('/api/overlay/now-playing/update', {
        trackName: 'Song B',
        artistName: 'Artist B',
        platform: 'spotify',
        isPlaying: false,
      }),
    );

    // Both calls should have used the same FID and onConflict strategy
    expect(chain.upsert).toHaveBeenCalledTimes(2);
    const [firstPayload, firstOptions] = vi.mocked(chain.upsert).mock.calls[0];
    const [secondPayload, secondOptions] = vi.mocked(chain.upsert).mock.calls[1];

    expect(firstPayload.fid).toBe(123);
    expect(secondPayload.fid).toBe(123);
    expect(firstOptions.onConflict).toBe('fid');
    expect(secondOptions.onConflict).toBe('fid');
  });
});
