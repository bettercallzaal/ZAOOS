import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFrom, mockGetSessionData, mockGetBestFriends, mockGetPopularCasts } = vi.hoisted(
  () => ({
    mockFrom: vi.fn(),
    mockGetSessionData: vi.fn(),
    mockGetBestFriends: vi.fn(),
    mockGetPopularCasts: vi.fn(),
  }),
);

vi.mock('@/lib/auth/session', () => ({ getSessionData: () => mockGetSessionData() }));
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));
vi.mock('@/lib/ens/resolve', () => ({
  resolveENSNames: vi.fn().mockResolvedValue({}),
  resolveBasenames: vi.fn().mockResolvedValue({}),
  getENSTextRecords: vi.fn().mockResolvedValue({}),
  getENSAvatar: vi.fn().mockResolvedValue(null),
}));
vi.mock('@/lib/farcaster/neynar', () => ({
  getBestFriends: mockGetBestFriends,
  getPopularCasts: mockGetPopularCasts,
}));

import { GET as getFriends } from '../[username]/friends/route';
import { GET as getPopular } from '../[username]/popular/route';
import { GET as getProfile } from '../[username]/route';
import { GET as getDirectory } from '../directory/route';

const WALLET = '0xaaaa000000000000000000000000000000000001';
const MEMBER_ID = '550e8400-e29b-41d4-a716-446655440000';

const member = (overrides = {}) => ({
  id: MEMBER_ID,
  fid: 42,
  username: 'alice',
  display_name: 'Farcaster Alice',
  real_name: 'Alice Secret',
  bio: 'private bio',
  location: 'Lusaka',
  x_handle: 'alice_x',
  discord_id: 'discord-id',
  primary_wallet: WALLET,
  custody_address: '0xcccc',
  verified_addresses: [],
  hidden_wallets: [],
  public_name: null,
  public_fields: [],
  is_active: true,
  created_at: '2025-01-01',
  last_login_at: '2026-10-01',
  ...overrides,
});

/**
 * Query chain. `resolve` picks the row for a lookup, so a test can assert which
 * identifier found the member.
 */
function queryChain(resolve: (filters: Record<string, unknown>) => unknown, listResult?: unknown) {
  const filters: Record<string, unknown> = {};
  const chain: Record<string, unknown> = {};
  for (const m of ['select', 'order', 'limit', 'gte', 'not', 'in', 'or']) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.eq = vi.fn((column: string, value: unknown) => {
    filters[column] = value;
    return chain;
  });
  chain.ilike = vi.fn((column: string, value: unknown) => {
    filters[column] = value;
    return chain;
  });
  chain.maybeSingle = vi.fn(async () => ({ data: resolve(filters) }));
  chain.single = vi.fn(async () => ({ data: null }));
  chain.range = vi.fn(async () => listResult);
  // biome-ignore lint/suspicious/noThenProperty: a Supabase query builder is awaited directly
  chain.then = (done: (value: unknown) => void) => done({ data: [] });
  return chain;
}

/** Serve one member from `users` by any identifier, as the real ilike and eq filters would. */
function serveMember(row: ReturnType<typeof member>) {
  mockFrom.mockImplementation((table: string) => {
    if (table !== 'users') return queryChain(() => null);
    return queryChain((filters) => {
      if (filters.id !== undefined) return filters.id === row.id ? row : null;
      if (filters.username !== undefined) return row;
      if (filters.fid !== undefined) return filters.fid === row.fid ? row : null;
      if (filters.primary_wallet !== undefined) return row;
      return null;
    });
  });
}

const ctx = (username: string) => ({ params: Promise.resolve({ username }) });
const profile = (key: string) =>
  getProfile(new NextRequest(`http://localhost/api/members/${key}`), ctx(key));

describe('public view: GET /api/members/[username]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(null);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => null }));
  });

  it.each([
    'alice',
    '42',
    WALLET,
    MEMBER_ID,
  ])('404 for %s when the member has not opted in', async (key) => {
    serveMember(member());
    const res = await profile(key);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Member not found' });
  });

  it('toggles do not count without a name', async () => {
    serveMember(member({ public_fields: ['bio', 'username'] }));
    expect((await profile('alice')).status).toBe(404);
  });

  it('name only: returns the name and wallet, nothing else, on a cacheable response', async () => {
    serveMember(member({ public_name: 'Ally' }));
    const res = await profile(MEMBER_ID);
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toContain('public');
    expect(res.headers.get('Vary')).toBe('Cookie');

    const body = await res.json();
    expect(body.displayName).toBe('Ally');
    expect(body.primaryWallet).toBe(WALLET);

    const text = JSON.stringify(body);
    for (const secret of [
      'Farcaster Alice',
      'alice',
      'Secret',
      'private bio',
      'Lusaka',
      'discord-id',
      '0xcccc',
      '2026-10-01',
      '2025-01-01',
    ]) {
      expect(text).not.toContain(secret);
    }
    expect(body.fid).toBeNull();
    expect(body.lastLoginAt).toBeNull();
  });

  it('returns a field after opting in and nothing beside it', async () => {
    serveMember(member({ public_name: 'Ally', public_fields: ['bio', 'x'] }));
    const body = await (await profile(MEMBER_ID)).json();
    expect(body.bio).toBe('private bio');
    expect(body.platforms.x).toBe('alice_x');
    expect(body.location).toBeNull();
    expect(body.platforms.discord).toBeNull();
  });

  it('a query parameter cannot widen the view', async () => {
    serveMember(member({ public_name: 'Ally' }));
    const res = await getProfile(
      new NextRequest(`http://localhost/api/members/${MEMBER_ID}?scope=full&fields=bio`),
      ctx(MEMBER_ID),
    );
    expect((await res.json()).bio).toBeNull();
  });

  describe('a hidden identifier does not resolve', () => {
    it('username, unless turned on', async () => {
      serveMember(member({ public_name: 'Ally' }));
      expect((await profile('alice')).status).toBe(404);
      serveMember(member({ public_name: 'Ally', public_fields: ['username'] }));
      expect((await profile('alice')).status).toBe(200);
    });

    it('fid, unless farcaster is on', async () => {
      serveMember(member({ public_name: 'Ally', username: null }));
      expect((await profile('42')).status).toBe(404);
    });

    it('wallet the member hid', async () => {
      serveMember(
        member({ public_name: 'Ally', username: null, hidden_wallets: ['primary_wallet'] }),
      );
      expect((await profile(WALLET)).status).toBe(404);
    });

    it('ilike wildcards', async () => {
      serveMember(member({ public_name: 'Ally', public_fields: ['username'] }));
      expect((await profile('a%25')).status).toBe(404);
    });
  });

  it('before the migration the columns are absent and everyone is a 404', async () => {
    const { public_name, public_fields, ...legacy } = member();
    serveMember(legacy as ReturnType<typeof member>);
    expect((await profile('alice')).status).toBe(404);
  });
});

describe('signed-in views: GET /api/members/[username]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => null }));
  });

  it('a member sees the community view without opt-in, uncached, minus hidden wallets', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 9, isAdmin: false });
    serveMember(member({ hidden_wallets: ['primary_wallet'] }));
    const res = await profile('alice');
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
    const body = await res.json();
    expect(body.bio).toBe('private bio');
    expect(body.primaryWallet).toBeNull();
    expect(body.hiddenWallets).toEqual([]);
  });

  it('the owner sees everything, including their hidden list', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 42, isAdmin: false });
    serveMember(member({ hidden_wallets: ['primary_wallet'] }));
    const body = await (await profile('alice')).json();
    expect(body.primaryWallet).toBe(WALLET);
    expect(body.hiddenWallets).toEqual(['primary_wallet']);
  });
});

describe('public view: friends and popular', () => {
  const routes = [
    ['friends', getFriends, mockGetBestFriends],
    ['popular', getPopular, mockGetPopularCasts],
  ] as const;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(null);
  });

  describe.each(routes)('%s', (name, route, upstream) => {
    const call = () =>
      route(new NextRequest(`http://localhost/api/members/alice/${name}`), ctx('alice'));

    it.each([
      ['no name', { public_fields: ['farcaster', 'username'] }],
      ['name only', { public_name: 'Ally' }],
      ['farcaster off', { public_name: 'Ally', public_fields: ['username'] }],
      ['username off', { public_name: 'Ally', public_fields: ['farcaster'] }],
    ])('404 with %s, and Farcaster is never called', async (_label, overrides) => {
      serveMember(member(overrides));
      const res = await call();
      expect(res.status).toBe(404);
      expect(upstream).not.toHaveBeenCalled();
    });

    it('200 once both are on', async () => {
      upstream.mockResolvedValue({ ok: true });
      serveMember(member({ public_name: 'Ally', public_fields: ['farcaster', 'username'] }));
      const res = await call();
      expect(res.status).toBe(200);
      expect(upstream.mock.calls[0][0]).toBe(42);
    });

    it('a signed-in member needs no opt-in', async () => {
      mockGetSessionData.mockResolvedValue({ fid: 9 });
      upstream.mockResolvedValue({ ok: true });
      serveMember(member());
      expect((await call()).status).toBe(200);
    });
  });
});

describe('public view: GET /api/members/directory', () => {
  const directory = (query = '') =>
    getDirectory(new NextRequest(`http://localhost/api/members/directory${query}`));

  const serveList = (rows: unknown[], error: unknown = null) => {
    const usersQuery = queryChain(() => null, { data: rows, count: rows.length, error });
    mockFrom.mockImplementation((table: string) =>
      table === 'users' ? usersQuery : queryChain(() => null),
    );
    return usersQuery as Record<string, ReturnType<typeof vi.fn>>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(null);
  });

  it('asks only for opted-in members and sorts by public name', async () => {
    const query = serveList([]);
    await directory('?sort=active');
    expect(query.not).toHaveBeenCalledWith('public_name', 'is', null);
    expect(query.order).toHaveBeenCalledTimes(1);
    expect(query.order).toHaveBeenCalledWith('public_name', { ascending: true });
  });

  it('returns projected rows only', async () => {
    serveList([member({ public_name: 'Ally' })]);
    const body = await (await directory()).json();
    expect(body.members[0].displayName).toBe('Ally');
    const text = JSON.stringify(body.members[0]);
    for (const secret of [
      'Farcaster Alice',
      'alice',
      'Secret',
      'private bio',
      'Lusaka',
      '0xcccc',
    ]) {
      expect(text).not.toContain(secret);
    }
  });

  it('searches the public name only, with wildcards escaped', async () => {
    const query = serveList([]);
    await directory('?search=a%25_');
    expect(query.ilike).toHaveBeenCalledWith('public_name', '%a\\%\\_%');
    expect(query.or).not.toHaveBeenCalled();
  });

  it.each([
    ['location', '?location=Lusaka'],
    ['platform', '?platform=x'],
    ['ens', '?has_ens=true'],
    ['activity', '?active_since=7d'],
    ['tier', '?tier=community'],
  ])('a %s filter cannot probe a hidden value', async (_label, query) => {
    serveList([
      member({ public_name: 'Ally', member_tier: 'community', x_handle: 'x', ens_name: 'a.eth' }),
    ]);
    const body = await (await directory(query)).json();
    expect(body.members).toEqual([]);
  });

  it('a filter matches once the field is public', async () => {
    serveList([member({ public_name: 'Ally', public_fields: ['location'] })]);
    const body = await (await directory('?location=lusaka')).json();
    expect(body.members).toHaveLength(1);
  });

  it('before the migration the public list is empty rather than an error', async () => {
    serveList([], { code: '42703' });
    const res = await directory();
    expect(res.status).toBe(200);
    expect((await res.json()).members).toEqual([]);
  });

  it('a signed-in member gets the community list, uncached, minus hidden wallets', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 9 });
    const query = serveList([member({ hidden_wallets: ['primary_wallet'] })]);
    const res = await directory();
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
    const body = await res.json();
    expect(query.not).not.toHaveBeenCalledWith('public_name', 'is', null);
    expect(body.members[0].displayName).toBe('Farcaster Alice');
    expect(body.members[0].primaryWallet).toBeNull();
  });
});
