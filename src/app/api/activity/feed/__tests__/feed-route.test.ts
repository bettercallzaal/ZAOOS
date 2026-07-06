import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetSession, mockFrom } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockFrom: vi.fn(),
}));
vi.mock('@/lib/auth/session', () => ({ getSessionData: () => mockGetSession() }));
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));

import { GET } from '@/app/api/activity/feed/route';

/** song_submissions chain: select/order return chain; limit resolves { data }. */
function songsChain(data: unknown[]) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockResolvedValue({ data });
  return chain;
}

const req = (qs = '') => new NextRequest(`http://localhost:3000/api/activity/feed?${qs}`);
const song = (id: string, created_at: string, title: string) => ({
  id,
  title,
  artist: 'A',
  submitted_by_fid: 1,
  created_at,
  users: null,
});

describe('GET /api/activity/feed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ fid: 1 });
  });

  it('401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    expect((await GET(req('filter=music'))).status).toBe(401);
  });

  it('400 on an invalid filter', async () => {
    const res = await GET(req('filter=bogus'));
    expect(res.status).toBe(400);
  });

  it('sorts merged activities newest-first', async () => {
    mockFrom.mockReturnValue(
      songsChain([
        song('old', '2026-01-01T00:00:00Z', 'Old'),
        song('new', '2026-06-01T00:00:00Z', 'New'),
      ]),
    );
    const res = await GET(req('filter=music'));
    expect(res.status).toBe(200);
    const { activities } = await res.json();
    expect(activities[0].id).toBe('song-new');
    expect(activities[1].id).toBe('song-old');
  });

  it('caps the response at the requested limit', async () => {
    mockFrom.mockReturnValue(
      songsChain([
        song('a', '2026-06-03T00:00:00Z', 'A'),
        song('b', '2026-06-02T00:00:00Z', 'B'),
        song('c', '2026-06-01T00:00:00Z', 'C'),
      ]),
    );
    const res = await GET(req('filter=music&limit=2'));
    const { activities } = await res.json();
    expect(activities).toHaveLength(2);
    expect(activities[0].id).toBe('song-a'); // newest kept
  });
});
