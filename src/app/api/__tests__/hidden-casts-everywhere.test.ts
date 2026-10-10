/**
 * Route-level proof that the three surfaces named in #3852 honor
 * hidden_messages when HIDDEN_CASTS_EVERYWHERE=1, and are unchanged when not.
 */
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetSession, mockFrom, mockGetUserByFid } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockFrom: vi.fn(),
  mockGetUserByFid: vi.fn(),
}));
vi.mock('@/lib/auth/session', () => ({ getSessionData: () => mockGetSession() }));
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));
vi.mock('@/lib/farcaster/neynar', () => ({ getUserByFid: mockGetUserByFid }));

import { GET as feedGET } from '@/app/api/activity/feed/route';
import { GET as searchGET } from '@/app/api/search/route';
import { GET as userGET } from '@/app/api/users/[fid]/route';

const FLAG = 'HIDDEN_CASTS_EVERYWHERE';
const VISIBLE = `0x${'a'.repeat(40)}`;
const HIDDEN = `0x${'b'.repeat(40)}`;

/** A chain where every builder method returns itself and awaiting it yields `result`. */
function chain(result: { data: unknown; error?: unknown }) {
  const c: Record<string, unknown> = {};
  for (const m of [
    'select',
    'textSearch',
    'order',
    'limit',
    'eq',
    'in',
    'not',
    'gte',
    'or',
    'ilike',
    'neq',
    'is',
  ]) {
    c[m] = vi.fn().mockReturnValue(c);
  }
  c.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  c.single = vi.fn().mockResolvedValue({ data: null, error: null });
  // biome-ignore lint/suspicious/noThenProperty: a Supabase query builder is awaitable
  c.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve({ error: null, ...result }).then(resolve);
  return c;
}

const cast = (hash: string, text: string) => ({
  hash,
  text,
  channel_id: 'zao',
  author_fid: 5,
  author_display: 'A',
  author_username: 'a',
  author_display_name: 'A',
  author_pfp: null,
  author_pfp_url: null,
  timestamp: '2026-10-10T00:00:00Z',
  reactions: { likes_count: 3, recasts_count: 1 },
  replies_count: 2,
});

function wireTables() {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'channel_casts') {
      return chain({ data: [cast(VISIBLE, 'visible cast'), cast(HIDDEN, 'withdrawn cast')] });
    }
    if (table === 'hidden_messages') return chain({ data: [{ cast_hash: HIDDEN }] });
    return chain({ data: [] });
  });
}

describe('hidden casts on search, activity feed and user profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env[FLAG];
    mockGetSession.mockResolvedValue({ fid: 1 });
    mockGetUserByFid.mockResolvedValue({ fid: 5, verified_addresses: { eth_addresses: [] } });
    wireTables();
  });
  afterEach(() => {
    delete process.env[FLAG];
  });

  const searchIds = async (q: string) => {
    const res = await searchGET(
      new NextRequest(`http://localhost:3000/api/search?q=${q}&type=casts`),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { results: Array<{ id: string }> };
    return body.results.map((r) => r.id);
  };
  const feedIds = async () => {
    const res = await feedGET(
      new NextRequest('http://localhost:3000/api/activity/feed?filter=social'),
    );
    expect(res.status).toBe(200);
    return JSON.stringify(await res.json());
  };
  const userBody = async () => {
    const res = await userGET(new NextRequest('http://localhost:3000/api/users/5'), {
      params: Promise.resolve({ fid: '5' }),
    });
    expect(res.status).toBe(200);
    return JSON.stringify(await res.json());
  };

  it('flag off: all three still include the hidden cast and never read hidden_messages', async () => {
    expect(await searchIds('flagoffquery')).toEqual([VISIBLE, HIDDEN]);
    const feed = await feedIds();
    expect(feed).toContain(`cast-${HIDDEN}`);
    await userBody();
    expect(mockFrom).not.toHaveBeenCalledWith('hidden_messages');
  });

  it('flag on: /api/search drops the hidden cast', async () => {
    process.env[FLAG] = '1';
    expect(await searchIds('flagonquery')).toEqual([VISIBLE]);
  });

  it('flag on: /api/activity/feed drops the hidden cast', async () => {
    process.env[FLAG] = '1';
    const feed = await feedIds();
    expect(feed).toContain(`cast-${VISIBLE}`);
    expect(feed).not.toContain(`cast-${HIDDEN}`);
  });

  it('flag on: /api/users/[fid] counts only the visible cast', async () => {
    const off = await userBody();
    process.env[FLAG] = '1';
    const on = await userBody();
    expect(off).toContain('"casts":2');
    expect(on).toContain('"casts":1');
    expect(on).toContain('"likes":3');
    expect(mockFrom).toHaveBeenCalledWith('hidden_messages');
  });
});
