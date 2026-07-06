import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

import { GET } from '@/app/api/music/artists/route';

/** Thenable chain for the songs query (select -> ilike -> order -> limit). */
function songsChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.ilike = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.then = vi.fn((resolve: (val: unknown) => void) => resolve(result));
  return chain;
}

/** Thenable chain for the likes count query (select -> in). */
function likesChain(result: { count?: number }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockReturnValue(chain);
  chain.then = vi.fn((resolve: (val: unknown) => void) => resolve(result));
  return chain;
}

function makeReq(query = '') {
  return new NextRequest(`http://localhost:3000/api/music/artists${query}`);
}

const song = {
  id: 's1',
  url: 'https://x.com/song',
  title: 'Track One',
  artist: 'Alice',
  artwork_url: null,
  stream_url: null,
  platform: 'soundcloud',
  duration: 180,
  play_count: 42,
  created_at: '2026-01-01T00:00:00Z',
};

describe('GET /api/music/artists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when the artist param is missing', async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Missing or invalid artist parameter');
  });

  it('returns 400 when the artist param is over 120 chars', async () => {
    const res = await GET(makeReq(`?artist=${'a'.repeat(121)}`));
    expect(res.status).toBe(400);
  });

  it('returns aggregated stats for a valid artist', async () => {
    mockFrom
      .mockReturnValueOnce(songsChain({ data: [song], error: null }))
      .mockReturnValueOnce(likesChain({ count: 5 }));

    const res = await GET(makeReq('?artist=Alice'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.artist).toBe('Alice');
    expect(body.trackCount).toBe(1);
    expect(body.totalPlays).toBe(42);
    expect(body.totalLikes).toBe(5);
    expect(body.tracks).toHaveLength(1);
  });

  it('returns an empty aggregate when the artist has no songs', async () => {
    mockFrom.mockReturnValueOnce(songsChain({ data: [], error: null }));
    const res = await GET(makeReq('?artist=Nobody'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.trackCount).toBe(0);
    expect(body.tracks).toEqual([]);
  });

  it('returns 500 when the songs query errors', async () => {
    mockFrom.mockReturnValueOnce(songsChain({ data: null, error: { message: 'db down' } }));
    const res = await GET(makeReq('?artist=Alice'));
    expect(res.status).toBe(500);
  });
});
