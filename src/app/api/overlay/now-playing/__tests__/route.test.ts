import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest } from '@/test-utils/api-helpers';

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/db/supabase', () => ({
  getSupabaseAdmin: () => ({
    from: mockFrom,
  }),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from '../route';

/**
 * Build a Supabase chain mock for overlay_now_playing queries.
 * Implements .select().eq().single() -> resolved result.
 */
function nowPlayingChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  // Chainable methods
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);

  // Terminal: .single() resolves the query
  chain.single = vi.fn().mockResolvedValue(result);

  return chain;
}

describe('GET /api/overlay/now-playing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------- Query Parameter Validation ----------

  it('returns 400 when fid parameter is missing', async () => {
    const res = await GET(makeGetRequest('/api/overlay/now-playing'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid fid parameter');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when fid is not a positive integer', async () => {
    const res = await GET(makeGetRequest('/api/overlay/now-playing', { fid: '0' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid fid parameter');
  });

  it('returns 400 when fid is a negative integer', async () => {
    const res = await GET(makeGetRequest('/api/overlay/now-playing', { fid: '-1' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid fid parameter');
  });

  it('returns 400 when fid is not numeric', async () => {
    const res = await GET(makeGetRequest('/api/overlay/now-playing', { fid: 'abc' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid fid parameter');
  });

  it('accepts fid as numeric string and coerces to number', async () => {
    const chain = nowPlayingChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/overlay/now-playing', { fid: '123' }));
    expect(res.status).toBe(200);
    expect(chain.eq).toHaveBeenCalledWith('fid', 123);
  });

  // ---------- Playing States ----------

  it('returns playing=true with track details when actively playing and recent', async () => {
    const now = Date.now();
    const recentUpdatedAt = new Date(now - 10_000).toISOString(); // 10 sec ago
    const nowPlayingRecord = {
      fid: 123,
      track_name: 'Midnight Dream',
      artist_name: 'Cosmic Echo',
      artwork_url: 'https://example.com/art.jpg',
      platform: 'spotify',
      position: 45_000,
      duration: 240_000,
      track_url: 'https://spotify.com/track/123',
      is_playing: true,
      updated_at: recentUpdatedAt,
    };

    const chain = nowPlayingChain({ data: nowPlayingRecord, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/overlay/now-playing', { fid: '123' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.playing).toBe(true);
    expect(body.trackName).toBe('Midnight Dream');
    expect(body.artistName).toBe('Cosmic Echo');
    expect(body.artworkUrl).toBe('https://example.com/art.jpg');
    expect(body.platform).toBe('spotify');
    expect(body.position).toBe(45_000);
    expect(body.duration).toBe(240_000);
    expect(body.url).toBe('https://spotify.com/track/123');
  });

  it('handles optional position/duration as 0 when null', async () => {
    const now = Date.now();
    const recentUpdatedAt = new Date(now - 10_000).toISOString();
    const nowPlayingRecord = {
      fid: 123,
      track_name: 'Song',
      artist_name: 'Artist',
      artwork_url: null,
      platform: 'apple_music',
      position: null, // nullable
      duration: null, // nullable
      track_url: null,
      is_playing: true,
      updated_at: recentUpdatedAt,
    };

    const chain = nowPlayingChain({ data: nowPlayingRecord, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/overlay/now-playing', { fid: '123' }));
    const body = await res.json();
    expect(body.position).toBe(0);
    expect(body.duration).toBe(0);
  });

  it('returns playing=false when record exists but is_playing is false', async () => {
    const now = Date.now();
    const recentUpdatedAt = new Date(now - 10_000).toISOString();
    const nowPlayingRecord = {
      fid: 123,
      track_name: 'Song',
      artist_name: 'Artist',
      artwork_url: null,
      platform: 'spotify',
      position: 0,
      duration: 180_000,
      track_url: null,
      is_playing: false, // Paused
      updated_at: recentUpdatedAt,
    };

    const chain = nowPlayingChain({ data: nowPlayingRecord, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/overlay/now-playing', { fid: '123' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.playing).toBe(false);
  });

  it('returns playing=false when record is stale (>30 seconds old)', async () => {
    const now = Date.now();
    const staleUpdatedAt = new Date(now - 31_000).toISOString(); // 31 sec ago
    const nowPlayingRecord = {
      fid: 123,
      track_name: 'Song',
      artist_name: 'Artist',
      artwork_url: null,
      platform: 'spotify',
      position: 0,
      duration: 180_000,
      track_url: null,
      is_playing: true,
      updated_at: staleUpdatedAt,
    };

    const chain = nowPlayingChain({ data: nowPlayingRecord, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/overlay/now-playing', { fid: '123' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.playing).toBe(false);
  });

  it('returns playing=false when exactly 30 seconds old (boundary)', async () => {
    const now = Date.now();
    const boundaryUpdatedAt = new Date(now - 30_000).toISOString(); // Exactly 30 sec
    const nowPlayingRecord = {
      fid: 123,
      track_name: 'Song',
      artist_name: 'Artist',
      artwork_url: null,
      platform: 'spotify',
      position: 0,
      duration: 180_000,
      track_url: null,
      is_playing: true,
      updated_at: boundaryUpdatedAt,
    };

    const chain = nowPlayingChain({ data: nowPlayingRecord, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/overlay/now-playing', { fid: '123' }));
    const body = await res.json();
    // 30_000ms is NOT < 30_000, so not live
    expect(body.playing).toBe(false);
  });

  it('returns playing=false when record has no track_name', async () => {
    const now = Date.now();
    const recentUpdatedAt = new Date(now - 10_000).toISOString();
    const nowPlayingRecord = {
      fid: 123,
      track_name: null, // No track
      artist_name: 'Artist',
      artwork_url: null,
      platform: 'spotify',
      position: 0,
      duration: 180_000,
      track_url: null,
      is_playing: true,
      updated_at: recentUpdatedAt,
    };

    const chain = nowPlayingChain({ data: nowPlayingRecord, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/overlay/now-playing', { fid: '123' }));
    const body = await res.json();
    expect(body.playing).toBe(false);
  });

  it('returns playing=false when no record exists (data is null)', async () => {
    const chain = nowPlayingChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/overlay/now-playing', { fid: '456' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.playing).toBe(false);
  });

  // ---------- Response Headers ----------

  it('includes Cache-Control header for playing response', async () => {
    const now = Date.now();
    const recentUpdatedAt = new Date(now - 5_000).toISOString();
    const nowPlayingRecord = {
      fid: 123,
      track_name: 'Song',
      artist_name: 'Artist',
      artwork_url: null,
      platform: 'spotify',
      position: 0,
      duration: 180_000,
      track_url: null,
      is_playing: true,
      updated_at: recentUpdatedAt,
    };

    const chain = nowPlayingChain({ data: nowPlayingRecord, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/overlay/now-playing', { fid: '123' }));
    expect(res.headers.get('Cache-Control')).toBe('public, s-maxage=5, stale-while-revalidate=2');
  });

  it('includes Cache-Control header for not-playing response', async () => {
    const chain = nowPlayingChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/overlay/now-playing', { fid: '123' }));
    expect(res.headers.get('Cache-Control')).toBe('public, s-maxage=5, stale-while-revalidate=2');
  });

  it('includes CORS header Access-Control-Allow-Origin: * for playing', async () => {
    const now = Date.now();
    const recentUpdatedAt = new Date(now - 5_000).toISOString();
    const nowPlayingRecord = {
      fid: 123,
      track_name: 'Song',
      artist_name: 'Artist',
      artwork_url: null,
      platform: 'spotify',
      position: 0,
      duration: 180_000,
      track_url: null,
      is_playing: true,
      updated_at: recentUpdatedAt,
    };

    const chain = nowPlayingChain({ data: nowPlayingRecord, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/overlay/now-playing', { fid: '123' }));
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('includes CORS header Access-Control-Allow-Origin: * for not-playing', async () => {
    const chain = nowPlayingChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest('/api/overlay/now-playing', { fid: '123' }));
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  // ---------- Error Handling ----------

  it('returns 500 when supabase query throws an exception', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockRejectedValue(new Error('db connection failed')),
        })),
      })),
    });

    const res = await GET(makeGetRequest('/api/overlay/now-playing', { fid: '123' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
  });

  it('returns 500 when getSupabaseAdmin throws', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('supabase initialization failed');
    });

    const res = await GET(makeGetRequest('/api/overlay/now-playing', { fid: '123' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
  });

  // ---------- No Auth Required (Public) ----------

  it('is publicly accessible without authentication', async () => {
    const chain = nowPlayingChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    // No session/auth header provided — should still work
    const res = await GET(makeGetRequest('/api/overlay/now-playing', { fid: '123' }));
    expect(res.status).toBe(200);
  });
});
