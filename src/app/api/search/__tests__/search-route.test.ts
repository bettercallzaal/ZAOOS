import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { mockGetSession, mockFrom } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockFrom: vi.fn(),
}));
vi.mock('@/lib/auth/session', () => ({ getSessionData: () => mockGetSession() }));
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));

import { GET } from '@/app/api/search/route';

/** profiles search chain: terminal .limit() resolves { data }. */
function profilesChain(data: unknown[]) {
  const chain: Record<string, unknown> = {};
  for (const m of ['select', 'textSearch', 'order']) chain[m] = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockResolvedValue({ data });
  return chain;
}

const req = (qs: string) => new NextRequest(`http://localhost:3000/api/search?${qs}`);

describe('GET /api/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ fid: 1 });
  });

  it('401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await GET(req('q=alpha1'));
    expect(res.status).toBe(401);
  });

  it('400 when the query is shorter than 2 chars', async () => {
    const res = await GET(req('q=a'));
    expect(res.status).toBe(400);
  });

  it('400 on an invalid search type', async () => {
    const res = await GET(req('q=alpha2&type=bogus'));
    expect(res.status).toBe(400);
  });

  it('returns member results for type=members', async () => {
    mockFrom.mockReturnValue(
      profilesChain([
        { id: 7, name: 'Alice', biography: 'singer', category: 'artist', username: 'alice', created_at: '2026-01-01' },
      ]),
    );
    const res = await GET(req('q=uniquequery3&type=members'));
    expect(res.status).toBe(200);
    const body = await res.json();
    const member = (body.results as Array<{ type: string; title: string }>).find((r) => r.type === 'member');
    expect(member?.title).toBe('Alice');
    expect(mockFrom).toHaveBeenCalledWith('community_profiles');
  });

  it('returns empty results gracefully when a search source has no data', async () => {
    mockFrom.mockReturnValue(profilesChain([]));
    const res = await GET(req('q=emptyquery4&type=members'));
    expect(res.status).toBe(200);
    expect(Array.isArray((await res.json()).results)).toBe(true);
  });
});
