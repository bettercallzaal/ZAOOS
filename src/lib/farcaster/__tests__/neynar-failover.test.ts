// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

// neynar.ts reads ENV at import time, so the read-base case needs its own file.
vi.mock('@/lib/env', () => ({
  ENV: {
    NEYNAR_API_KEY: 'test-neynar-key',
    FARCASTER_READ_API_BASE: 'https://read.example',
  },
}));

const { warn } = vi.hoisted(() => ({ warn: vi.fn() }));
vi.mock('@/lib/logger', () => ({
  logger: { warn, error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { getUsersByFids } from '../neynar';

function res(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

const READ_URL = 'https://read.example/v2/farcaster/user/bulk?fids=1';
const NEYNAR_URL = 'https://api.neynar.com/v2/farcaster/user/bulk?fids=1';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('fetchWithFailover with a read base set', () => {
  it('serves from the read base on 200, without Neynar and without a log line', async () => {
    const fetchMock = vi.fn().mockResolvedValue(res(200, { users: [{ fid: 1 }] }));
    vi.stubGlobal('fetch', fetchMock);

    expect(await getUsersByFids([1])).toEqual([{ fid: 1 }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(READ_URL);
    expect(warn).not.toHaveBeenCalled();
  });

  it.each([
    404, 503,
  ])('falls back to Neynar with the API key on read-base %i and logs it', async (status) => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(res(status, 'nope'))
      .mockResolvedValueOnce(res(200, { users: [{ fid: 1 }] }));
    vi.stubGlobal('fetch', fetchMock);

    expect(await getUsersByFids([1])).toEqual([{ fid: 1 }]);
    expect(fetchMock.mock.calls[1][0]).toBe(NEYNAR_URL);
    expect(fetchMock.mock.calls[1][1].headers['x-api-key']).toBe('test-neynar-key');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toBe(
      `[neynar/failover] /user/bulk read base returned ${status}, falling back to Neynar`,
    );
  });

  it('falls back to Neynar when the read base throws and logs the error', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValueOnce(res(200, { users: [{ fid: 1 }] }));
    vi.stubGlobal('fetch', fetchMock);

    expect(await getUsersByFids([1])).toEqual([{ fid: 1 }]);
    expect(fetchMock.mock.calls[1][0]).toBe(NEYNAR_URL);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toBe(
      '[neynar/failover] /user/bulk read base threw (ECONNREFUSED), falling back to Neynar',
    );
  });

  it('throws when both are down, after one failover log line', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(res(503, 'down'))
      .mockResolvedValueOnce(res(500, 'also down'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getUsersByFids([1])).rejects.toThrow('Neynar bulk user error 500');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
