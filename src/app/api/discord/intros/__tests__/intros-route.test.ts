import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFrom, mockGetSessionData } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGetSessionData: vi.fn(),
}));

vi.mock('@/lib/db/supabase', () => ({
  getSupabaseAdmin: () => ({ from: mockFrom }),
}));

// The bulk (?all=true) branch now requires a session - it is a member-directory
// export, and it used to be readable by anyone. Default the mock to signed-out
// so any test that does NOT explicitly sign in is exercising the guard.
vi.mock('@/lib/auth/session', () => ({
  getSessionData: mockGetSessionData,
}));
const signedIn = () =>
  mockGetSessionData.mockResolvedValue({ fid: 1, isAdmin: false, username: 'zaal' });

import { GET } from '@/app/api/discord/intros/route';

function singleChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'order', 'limit']) chain[m] = vi.fn().mockReturnValue(chain);
  chain.maybeSingle = vi.fn().mockResolvedValue(result);
  return chain;
}
function listChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.then = vi.fn((resolve: (v: unknown) => void) => resolve(result));
  return chain;
}
const req = (q = '') => new NextRequest(`http://localhost:3000/api/discord/intros${q}`);
const intro = {
  discord_id: '123',
  discord_username: 'bob',
  intro_text: 'hi',
  posted_at: '2026-01-01',
};

describe('GET /api/discord/intros', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(null); // signed out unless a test says otherwise
  });

  it('400 on a non-numeric discord_id', async () => {
    const res = await GET(req('?discord_id=not-a-snowflake'));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid query parameters');
  });

  it('400 when neither discord_id nor all is provided', async () => {
    const res = await GET(req());
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Provide discord_id or all=true');
  });

  it('returns a single intro by discord_id', async () => {
    mockFrom.mockReturnValue(singleChain({ data: intro, error: null }));
    const res = await GET(req('?discord_id=123'));
    expect(res.status).toBe(200);
    expect((await res.json()).intro.discordId).toBe('123');
  });

  it('returns null intro when none found', async () => {
    mockFrom.mockReturnValue(singleChain({ data: null, error: null }));
    const res = await GET(req('?discord_id=999'));
    expect(res.status).toBe(200);
    expect((await res.json()).intro).toBeNull();
  });

  it('returns all intros with all=true when signed in', async () => {
    signedIn();
    mockFrom.mockReturnValue(listChain({ data: [intro], error: null }));
    const res = await GET(req('?all=true'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.intros[0].discordUsername).toBe('bob');
  });

  // The surface-map audit (doc 2245, PR #2950) flagged this route as public +
  // service-role. ?all=true returned every member's Discord id, username and
  // intro to any anonymous caller, unpaginated - the same shape as the August
  // anonymous-board leak (#2829). The bulk branch now needs a session.
  it('401s on all=true when signed out, and never touches the database', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await GET(req('?all=true'));
    expect(res.status).toBe(401);
    // the guard runs BEFORE any query - a leak prevented at serialization time
    // would still have pulled every row out of the database.
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('still serves a single intro by id without a session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    mockFrom.mockReturnValue(singleChain({ data: intro, error: null }));
    const res = await GET(req('?discord_id=123'));
    expect(res.status).toBe(200);
    expect((await res.json()).intro.discordUsername).toBe('bob');
  });
});
