// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Control fetch globally
const mockFetch = vi.fn();

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  delete process.env.FARCASTER_READ_API_BASE;
  delete process.env.FARCASTER_READ_FALLBACK_BASE;
  delete process.env.NEYNAR_API_KEY;
  delete process.env.FARCASTER_READ_TIMEOUT_MS;
});

function stubFetch(json: unknown, ok = true) {
  const res = { ok, status: ok ? 200 : 500, statusText: ok ? 'OK' : 'Internal Server Error', json: vi.fn().mockResolvedValue(json) };
  mockFetch.mockResolvedValue(res);
  vi.stubGlobal('fetch', mockFetch);
}

import { castsByFid, nodeInfo, readV2 } from '../read-node';

// ── readV2 ────────────────────────────────────────────────────────────────────

describe('readV2', () => {
  it('calls the primary URL when FARCASTER_READ_API_BASE is set', async () => {
    process.env.FARCASTER_READ_API_BASE = 'http://primary.local:3381';
    stubFetch({ casts: [] });
    const r = await readV2('/v2/farcaster/feed?fid=1');
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch.mock.calls[0][0]).toContain('primary.local:3381');
  });

  it('falls back to the fallback URL when primary is not set', async () => {
    // No FARCASTER_READ_API_BASE → skip primary, go straight to fallback
    process.env.FARCASTER_READ_FALLBACK_BASE = 'https://fallback.example.com';
    stubFetch({ casts: [] });
    await readV2('/v2/farcaster/feed?fid=1');
    expect(mockFetch.mock.calls[0][0]).toContain('fallback.example.com');
  });

  it('falls back to the default haatz URL when no fallback env var is set', async () => {
    stubFetch({ casts: [] });
    await readV2('/v2/some/path');
    expect(mockFetch.mock.calls[0][0]).toContain('haatz.quilibrium.com');
  });

  it('falls back when the primary request throws', async () => {
    process.env.FARCASTER_READ_API_BASE = 'http://primary.local:3381';
    process.env.FARCASTER_READ_FALLBACK_BASE = 'https://fallback.example.com';
    mockFetch
      .mockRejectedValueOnce(new Error('connection refused')) // primary fails
      .mockResolvedValueOnce({ ok: true, status: 200, json: vi.fn().mockResolvedValue({ casts: ['ok'] }) }); // fallback ok
    vi.stubGlobal('fetch', mockFetch);
    const r = await readV2('/v2/path');
    expect(r).toEqual({ casts: ['ok'] });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('falls back when primary returns non-ok status', async () => {
    process.env.FARCASTER_READ_API_BASE = 'http://primary.local:3381';
    process.env.FARCASTER_READ_FALLBACK_BASE = 'https://fallback.example.com';
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 503, statusText: 'Service Unavailable' }) // primary non-ok
      .mockResolvedValueOnce({ ok: true, status: 200, json: vi.fn().mockResolvedValue({ data: 1 }) }); // fallback ok
    vi.stubGlobal('fetch', mockFetch);
    const r = await readV2('/v2/path');
    expect(r).toEqual({ data: 1 });
  });

  it('attaches Neynar api-key header when base includes "neynar" and key is set', async () => {
    process.env.FARCASTER_READ_API_BASE = 'https://api.neynar.com';
    process.env.NEYNAR_API_KEY = 'neynar-test-key';
    stubFetch({ data: [] });
    await readV2('/v2/path');
    const init = mockFetch.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('neynar-test-key');
  });

  it('does NOT attach api-key header for non-neynar endpoints', async () => {
    process.env.FARCASTER_READ_API_BASE = 'http://primary.local:3381';
    process.env.NEYNAR_API_KEY = 'neynar-test-key';
    stubFetch({ data: [] });
    await readV2('/v2/path');
    const init = mockFetch.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers['x-api-key']).toBeUndefined();
  });
});

// ── nodeInfo ──────────────────────────────────────────────────────────────────

describe('nodeInfo', () => {
  it('throws when FARCASTER_READ_API_BASE is not set', async () => {
    await expect(nodeInfo()).rejects.toThrow('FARCASTER_READ_API_BASE not set');
  });

  it('returns parsed info from the primary node', async () => {
    process.env.FARCASTER_READ_API_BASE = 'http://primary.local:3381';
    stubFetch({ maxHeight: 100, blockDelay: 5 });
    const r = await nodeInfo();
    expect(r.maxHeight).toBe(100);
    expect(r.blockDelay).toBe(5);
  });
});

// ── castsByFid ────────────────────────────────────────────────────────────────

describe('castsByFid', () => {
  it('calls readV2 with fid and pageSize in the URL', async () => {
    process.env.FARCASTER_READ_API_BASE = 'http://primary.local:3381';
    stubFetch({ casts: [] });
    await castsByFid(1325, 5);
    expect(mockFetch.mock.calls[0][0]).toContain('fid=1325');
    expect(mockFetch.mock.calls[0][0]).toContain('pageSize=5');
  });

  it('uses default pageSize of 10', async () => {
    process.env.FARCASTER_READ_API_BASE = 'http://primary.local:3381';
    stubFetch({ casts: [] });
    await castsByFid(42);
    expect(mockFetch.mock.calls[0][0]).toContain('pageSize=10');
  });
});
