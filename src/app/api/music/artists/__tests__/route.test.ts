// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockFrom = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));

import { GET } from '../route';

afterEach(() => vi.clearAllMocks());

// Build a chain that resolves via .then (awaitable) to a result
function makeChain(result: { data?: unknown; error?: unknown; count?: number | null }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['select', 'ilike', 'order', 'limit', 'in']) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.then = vi.fn((resolve: (v: unknown) => void) => resolve(result));
  return chain;
}

describe('GET /api/music/artists', () => {
  it('returns 400 when artist param is missing', async () => {
    const req = makeGetRequest('/api/music/artists');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns empty stats when no songs are found', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }));
    const req = makeGetRequest('/api/music/artists', { artist: 'ZAO Artist' });
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.trackCount).toBe(0);
    expect(body.tracks).toEqual([]);
  });

  it('returns 500 when Supabase throws an error', async () => {
    const errorChain = makeChain({ data: null, error: new Error('DB failure') });
    mockFrom.mockReturnValue(errorChain);
    const req = makeGetRequest('/api/music/artists', { artist: 'ArtistX' });
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});
