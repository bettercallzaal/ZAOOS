// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest, mockAuthenticatedSession } from '@/test-utils/api-helpers';

// Social reads routed through neynarRead (doc 2418 D6 PR 3), with a read base set.
const { mockGetSessionData } = vi.hoisted(() => ({ mockGetSessionData: vi.fn() }));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/env', () => ({
  ENV: { NEYNAR_API_KEY: 'test-key', FARCASTER_READ_API_BASE: 'https://read.example' },
}));

import { GET as compareGET } from '../compare/route';
import { GET as heatmapGET } from '../engagement-heatmap/route';

type Reply = { status: number; body: unknown };
const ok = (body: unknown): Reply => ({ status: 200, body });
const DOWN: Reply = { status: 503, body: 'down' };

/** Answer by host + path prefix; records every URL and header set it was asked for. */
function router(readBase: (path: string) => Reply, neynar: (path: string) => Reply) {
  const fetchMock = vi.fn(async (url: string) => {
    const reply = url.startsWith('https://read.example/v2/farcaster')
      ? readBase(url.slice('https://read.example/v2/farcaster'.length))
      : neynar(url.slice('https://api.neynar.com/v2/farcaster'.length));
    return {
      ok: reply.status === 200,
      status: reply.status,
      json: async () => reply.body,
      text: async () => JSON.stringify(reply.body),
    };
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const neynarCalls = (m: ReturnType<typeof router>) =>
  m.mock.calls.filter(([url]) => String(url).startsWith('https://api.neynar.com'));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('engagement-heatmap through the read seam', () => {
  it('builds the heatmap from flat Hypersnap followers without calling Neynar', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 7001 });
    const fetchMock = router(
      (path) =>
        path.startsWith('/followers')
          ? ok({
              users: [
                { object: 'user', fid: 11 },
                { object: 'user', fid: 12 },
              ],
              next: {},
            })
          : ok({ casts: [{ timestamp: '2026-07-15T10:30:00Z' }] }),
      () => ok({}),
    );

    const res = await heatmapGET();
    expect(res.status).toBe(200);
    const { heatmap } = await res.json();
    const total = (heatmap as number[][]).flat().reduce((a, b) => a + b, 0);
    expect(total).toBe(2); // one cast for each of the two followers
    expect(neynarCalls(fetchMock)).toHaveLength(0);
    for (const [, init] of fetchMock.mock.calls) {
      expect((init as RequestInit).headers).not.toHaveProperty('x-api-key');
    }
  });

  it('still reads Neynar-shaped { user } followers after failover', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 7002 });
    const fetchMock = router(
      () => DOWN,
      (path) =>
        path.startsWith('/followers')
          ? ok({ users: [{ object: 'follower', user: { fid: 21 } }], next: {} })
          : ok({ casts: [{ timestamp: '2026-07-14T09:15:00Z' }] }),
    );

    const res = await heatmapGET();
    const { heatmap } = await res.json();
    expect((heatmap as number[][]).flat().reduce((a, b) => a + b, 0)).toBe(1);
    expect(neynarCalls(fetchMock).length).toBeGreaterThan(0);
  });
});

describe('compare through the read seam', () => {
  const lists: Record<string, number[]> = {
    '/following?fid=123': [1, 2, 3],
    '/following?fid=8001': [2, 3, 4],
    '/followers?fid=123': [10, 20],
    '/followers?fid=8001': [20, 40],
  };
  const listFor = (path: string) => Object.entries(lists).find(([k]) => path.startsWith(k))?.[1];

  it('counts shared following from Neynar-shaped { user } items after failover', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    router(
      () => DOWN,
      (path) => {
        const fids = listFor(path);
        if (fids) return ok({ users: fids.map((fid) => ({ object: 'follower', user: { fid } })) });
        return ok({ users: [{ fid: 2, username: 'two', pfp_url: null }] });
      },
    );

    const res = await compareGET(makeGetRequest('/api/social/compare', { targetFid: '8001' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sharedFollowing).toBe(2);
    expect(body.sharedFollowers).toBe(1);
  });

  it('serves flat Hypersnap lists without calling Neynar', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    lists['/following?fid=8002'] = [3, 5];
    lists['/followers?fid=8002'] = [10];
    const fetchMock = router(
      (path) => {
        const fids = listFor(path);
        if (fids) return ok({ users: fids.map((fid) => ({ object: 'user', fid })) });
        return ok({ users: [{ fid: 3, username: 'three', pfp_url: null }] });
      },
      () => DOWN,
    );

    const res = await compareGET(makeGetRequest('/api/social/compare', { targetFid: '8002' }));
    const body = await res.json();
    expect(body.sharedFollowing).toBe(1);
    expect(body.sharedFollowers).toBe(1);
    expect(neynarCalls(fetchMock)).toHaveLength(0);
  });
});
