/**
 * Route-level proof that the five surfaces reading channel_casts drop a cast
 * whose signer was removed when FARCASTER_SIGNER_AUTHORITY_FILTER=1, keep a
 * cast of unknown standing, and are unchanged when the flag is off.
 */
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetSession, mockFrom, mockGetUserByFid, mockGetChannelFeed } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockFrom: vi.fn(),
  mockGetUserByFid: vi.fn(),
  mockGetChannelFeed: vi.fn(),
}));
vi.mock('@/lib/auth/session', () => ({ getSessionData: () => mockGetSession() }));
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));
vi.mock('@/lib/farcaster/neynar', () => ({
  getUserByFid: mockGetUserByFid,
  getChannelFeed: mockGetChannelFeed,
}));
vi.mock('@/lib/env', () => ({ ENV: { NEYNAR_API_KEY: 'test-neynar-key' } }));
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import { GET as feedGET } from '@/app/api/activity/feed/route';
import { GET as chatMessagesGET } from '@/app/api/chat/messages/route';
import { GET as chatSearchGET } from '@/app/api/chat/search/route';
import { GET as searchGET } from '@/app/api/search/route';
import { GET as userGET } from '@/app/api/users/[fid]/route';

const FLAG = 'FARCASTER_SIGNER_AUTHORITY_FILTER';
const ACTIVE = `0x${'a'.repeat(40)}`;
const REMOVED = `0x${'b'.repeat(40)}`;
const UNKNOWN = `0x${'c'.repeat(40)}`;
const KEY_A = `0x${'aa'.repeat(32)}`;
const KEY_B = `0x${'bb'.repeat(32)}`;

/** A chain where every builder method returns itself and awaiting it yields `result`. */
function chain(result: { data: unknown; error?: unknown; count?: number }) {
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
    'lt',
    'or',
    'ilike',
    'neq',
    'is',
    'upsert',
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
  fid: 5,
  author_fid: 5,
  author_display: 'A',
  author_username: 'a',
  author_display_name: 'A',
  author_pfp: null,
  author_pfp_url: null,
  timestamp: '2026-10-10T00:00:00Z',
  embeds: [],
  reactions: { likes_count: 3, recasts_count: 1 },
  replies_count: 2,
});

function wireTables() {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'channel_casts') {
      return chain({
        data: [
          cast(ACTIVE, 'signed by an active key'),
          cast(REMOVED, 'signed by a removed key'),
          cast(UNKNOWN, 'no provenance recorded'),
        ],
      });
    }
    if (table === 'cast_signer_provenance') {
      return chain({
        data: [
          { cast_hash: ACTIVE, fid: 5, signer: KEY_A },
          { cast_hash: REMOVED, fid: 5, signer: KEY_B },
        ],
      });
    }
    if (table === 'farcaster_signer_authority') {
      return chain({
        data: [
          { fid: 5, signer: KEY_A, status: 'active' },
          { fid: 5, signer: KEY_B, status: 'removed' },
        ],
      });
    }
    return chain({ data: [] });
  });
}

describe('signer authority on the five surfaces that read channel_casts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env[FLAG];
    mockGetSession.mockResolvedValue({ fid: 1 });
    mockGetUserByFid.mockResolvedValue({ fid: 5, verified_addresses: { eth_addresses: [] } });
    // Neynar is down in every case, so each chat route answers from the database.
    mockGetChannelFeed.mockRejectedValue(new Error('neynar down'));
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('neynar down')));
    wireTables();
  });
  afterEach(() => {
    delete process.env[FLAG];
    vi.unstubAllGlobals();
  });

  const surfaces: Array<[string, () => Promise<string>]> = [
    [
      '/api/search',
      async () => {
        const res = await searchGET(
          new NextRequest(`http://localhost:3000/api/search?q=signerquery${Date.now()}&type=casts`),
        );
        expect(res.status).toBe(200);
        return JSON.stringify(await res.json());
      },
    ],
    [
      '/api/activity/feed',
      async () => {
        const res = await feedGET(
          new NextRequest('http://localhost:3000/api/activity/feed?filter=social'),
        );
        expect(res.status).toBe(200);
        return JSON.stringify(await res.json());
      },
    ],
    [
      '/api/chat/messages',
      async () => {
        const res = await chatMessagesGET(
          new NextRequest('http://localhost:3000/api/chat/messages?channel=zao'),
        );
        expect(res.status).toBe(200);
        return JSON.stringify(await res.json());
      },
    ],
    [
      '/api/chat/search',
      async () => {
        const res = await chatSearchGET(
          new NextRequest('http://localhost:3000/api/chat/search?q=signed&channel=zao'),
        );
        expect(res.status).toBe(200);
        return JSON.stringify(await res.json());
      },
    ],
  ];

  describe.each(surfaces)('%s', (_name, call) => {
    it('flag off: returns all three casts and never reads the signer tables', async () => {
      const body = await call();
      expect(body).toContain(ACTIVE);
      expect(body).toContain(REMOVED);
      expect(body).toContain(UNKNOWN);
      expect(mockFrom).not.toHaveBeenCalledWith('cast_signer_provenance');
      expect(mockFrom).not.toHaveBeenCalledWith('farcaster_signer_authority');
    });

    it('flag on: drops the removed-signer cast, keeps the active and the unknown one', async () => {
      process.env[FLAG] = '1';
      const body = await call();
      expect(body).toContain(ACTIVE);
      expect(body).not.toContain(REMOVED);
      expect(body).toContain(UNKNOWN);
      expect(mockFrom).toHaveBeenCalledWith('cast_signer_provenance');
    });
  });

  describe('/api/users/[fid]', () => {
    const userBody = async () => {
      const res = await userGET(new NextRequest('http://localhost:3000/api/users/5'), {
        params: Promise.resolve({ fid: '5' }),
      });
      expect(res.status).toBe(200);
      return JSON.stringify(await res.json());
    };

    it('flag off: counts all three casts and never reads the signer tables', async () => {
      expect(await userBody()).toContain('"casts":3');
      expect(mockFrom).not.toHaveBeenCalledWith('cast_signer_provenance');
    });

    it('flag on: counts the active and the unknown cast, not the removed one', async () => {
      process.env[FLAG] = '1';
      const body = await userBody();
      expect(body).toContain('"casts":2');
      expect(body).toContain('"likes":6');
    });
  });
});
