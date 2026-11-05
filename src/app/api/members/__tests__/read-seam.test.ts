// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chainMock } from '@/test-utils/api-helpers';

// Members enrichment routed through neynarRead (doc 2418 D6 PR 3), with a read base set.
const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/env', () => ({
  ENV: { NEYNAR_API_KEY: 'test-key', FARCASTER_READ_API_BASE: 'https://read.example' },
}));

import { GET } from '@/app/api/members/route';

// A member missing pfp, username and addresses, so the route enriches it.
const bareMember = { id: 'm1', fid: 3, display_name: 'Dan' };

// Verbatim shape of a haatz /user/bulk user (fields this route reads), 2026-10-22.
const haatzUser = {
  object: 'user',
  fid: 3,
  username: 'dwr',
  display_name: 'Dan',
  pfp_url: 'https://example.com/3.png',
  custody_address: '0xcustody',
  verified_addresses: { eth_addresses: ['0xverified'], sol_addresses: [] },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSessionData.mockResolvedValue({ fid: 3, isAdmin: false });
  let call = 0;
  mockFrom.mockImplementation(() => {
    call++;
    return call === 1
      ? chainMock({ data: [bareMember], error: null }).chain
      : chainMock({ data: [] }).chain;
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('GET /api/members through the read seam', () => {
  it('enriches from the read base, without a key and without calling Neynar', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ users: [haatzUser] }),
      text: async () => '',
    }));
    vi.stubGlobal('fetch', fetchMock);

    const res = await GET();
    expect(res.status).toBe(200);
    const { members } = await res.json();
    expect(members[0].username).toBe('dwr');
    expect(members[0].pfpUrl).toBe('https://example.com/3.png');

    const urls = fetchMock.mock.calls.map((c) => String((c as unknown[])[0]));
    expect(urls).toEqual(['https://read.example/v2/farcaster/user/bulk?fids=3']);
    const init = (fetchMock.mock.calls[0] as unknown[])[1] as RequestInit;
    expect(init.headers).not.toHaveProperty('x-api-key');
  });

  it('fails over to Neynar with the key when the read base is down', async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.startsWith('https://read.example')
        ? { ok: false, status: 503, json: async () => ({}), text: async () => 'down' }
        : {
            ok: true,
            status: 200,
            json: async () => ({ users: [haatzUser] }),
            text: async () => '',
          },
    );
    vi.stubGlobal('fetch', fetchMock);

    const res = await GET();
    const { members } = await res.json();
    expect(members[0].username).toBe('dwr');
    const neynar = fetchMock.mock.calls.find((c) =>
      String(c[0]).startsWith('https://api.neynar.com'),
    );
    expect(neynar).toBeDefined();
    const [url, init] = neynar as unknown as [string, { headers: Record<string, string> }];
    expect(url).toBe('https://api.neynar.com/v2/farcaster/user/bulk?fids=3');
    expect(init.headers['x-api-key']).toBe('test-key');
  });
});
