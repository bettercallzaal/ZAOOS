// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest, mockAuthenticatedSession } from '@/test-utils/api-helpers';

// Music channel feed routed through neynarRead (doc 2418 D6 PR 3), with a read base set.
const { mockGetSessionData, mockIsMusicUrl } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockIsMusicUrl: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/env', () => ({
  ENV: { NEYNAR_API_KEY: 'test-key', FARCASTER_READ_API_BASE: 'https://read.example' },
}));

vi.mock('@/lib/music/isMusicUrl', () => ({
  isMusicUrl: mockIsMusicUrl,
}));

import { GET } from '../route';

const cast = {
  hash: '0xc1',
  author: { fid: 3, username: 'dwr', pfp_url: 'https://example.com/3.png' },
  text: 'new track',
  timestamp: '2026-10-22T10:00:00Z',
  embeds: [{ url: 'https://soundcloud.com/artist/track' }],
};

function stub(handler: (url: string) => { status: number; body: unknown }) {
  const fetchMock = vi.fn(async (url: string) => {
    const { status, body } = handler(url);
    return {
      ok: status === 200,
      status,
      json: async () => body,
      text: async () => JSON.stringify(body),
    };
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const urls = (m: ReturnType<typeof stub>) => m.mock.calls.map((c) => String(c[0]));

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
  mockIsMusicUrl.mockImplementation((u: string) =>
    u.includes('soundcloud') ? 'soundcloud' : null,
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('/api/music/feed through the read seam', () => {
  it('reads a channel feed from the read base without a key and without Neynar', async () => {
    const fetchMock = stub(() => ({ status: 200, body: { casts: [cast], next: {} } }));

    const res = await GET(makeGetRequest('/api/music/feed', { channel: 'zao' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { tracks: Array<{ musicUrl: string }> };
    expect(body.tracks[0].musicUrl).toBe('https://soundcloud.com/artist/track');

    expect(urls(fetchMock).every((u) => u.startsWith('https://read.example/'))).toBe(true);
    for (const [, init] of fetchMock.mock.calls) {
      expect((init as RequestInit).headers).not.toHaveProperty('x-api-key');
    }
  });

  it('orders a shard-ordered read-base page newest-first before picking tracks', async () => {
    // haatz joins shard pages unsorted (doc 2418, UPDATE 2026-10-23).
    const older = { ...cast, hash: '0xold', timestamp: '2026-09-30T14:28:29Z' };
    const newer = { ...cast, hash: '0xnew', timestamp: '2026-10-23T15:28:06Z' };
    stub(() => ({ status: 200, body: { casts: [older, newer], next: {} } }));

    const res = await GET(makeGetRequest('/api/music/feed', { channel: 'zao', limit: '1' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { tracks: Array<{ castHash: string }> };
    expect(body.tracks.map((t) => t.castHash)).toEqual(['0xnew']);
  });

  it('keeps the "all" search on Neynar', async () => {
    const fetchMock = stub(() => ({ status: 200, body: { result: { casts: [cast] } } }));

    const res = await GET(makeGetRequest('/api/music/feed'));
    expect(res.status).toBe(200);
    expect(urls(fetchMock).length).toBeGreaterThan(0);
    expect(urls(fetchMock).every((u) => u.startsWith('https://api.neynar.com/'))).toBe(true);
  });
});
