// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mintPartnerToken } from '../juke-partner-token';

const API_KEY = 'juke-api-key-test';

const GOOD_RESPONSE = {
  token: 'eyJhbGciOiJIUzI1NiJ9.test',
  fid: 42,
  expires_at: '2026-07-17T00:00:00Z',
  partner_app_id: 'zao-os',
};

function mockFetch(status: number, body: unknown, throws?: Error) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      if (throws) throw throws;
      return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => body,
        text: async () => JSON.stringify(body),
      };
    }),
  );
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllGlobals());

// ---------------------------------------------------------------------------
// fid validation
// ---------------------------------------------------------------------------

describe('fid validation', () => {
  it('returns error when fid is 0', async () => {
    const result = await mintPartnerToken(API_KEY, { fid: 0 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.error).toMatch(/positive integer/i);
    }
  });

  it('returns error when fid is negative', async () => {
    const result = await mintPartnerToken(API_KEY, { fid: -1 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it('returns error when fid is Infinity', async () => {
    const result = await mintPartnerToken(API_KEY, { fid: Infinity });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// TTL clamping
// ---------------------------------------------------------------------------

describe('TTL clamping', () => {
  it('clamps ttlSeconds below 60 to 60', async () => {
    mockFetch(200, GOOD_RESPONSE);
    await mintPartnerToken(API_KEY, { fid: 42, ttlSeconds: 30 });
    const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string);
    expect(body.ttl_seconds).toBe(60);
  });

  it('clamps ttlSeconds above 600 to 600', async () => {
    mockFetch(200, GOOD_RESPONSE);
    await mintPartnerToken(API_KEY, { fid: 42, ttlSeconds: 900 });
    const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string);
    expect(body.ttl_seconds).toBe(600);
  });

  it('defaults ttlSeconds to 300 when not provided', async () => {
    mockFetch(200, GOOD_RESPONSE);
    await mintPartnerToken(API_KEY, { fid: 42 });
    const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string);
    expect(body.ttl_seconds).toBe(300);
  });

  it('passes ttlSeconds through when within [60, 600]', async () => {
    mockFetch(200, GOOD_RESPONSE);
    await mintPartnerToken(API_KEY, { fid: 42, ttlSeconds: 120 });
    const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string);
    expect(body.ttl_seconds).toBe(120);
  });
});

// ---------------------------------------------------------------------------
// Success path
// ---------------------------------------------------------------------------

describe('success path', () => {
  it('returns ok:true with data on 200', async () => {
    mockFetch(200, GOOD_RESPONSE);
    const result = await mintPartnerToken(API_KEY, { fid: 42 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual(GOOD_RESPONSE);
  });

  it('sends fid in request body', async () => {
    mockFetch(200, GOOD_RESPONSE);
    await mintPartnerToken(API_KEY, { fid: 7 });
    const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string);
    expect(body.fid).toBe(7);
  });

  it('sends X-Juke-Api-Key header', async () => {
    mockFetch(200, GOOD_RESPONSE);
    await mintPartnerToken(API_KEY, { fid: 42 });
    const headers = (vi.mocked(fetch).mock.calls[0][1] as RequestInit).headers as Record<
      string,
      string
    >;
    expect(headers['X-Juke-Api-Key']).toBe(API_KEY);
  });
});

// ---------------------------------------------------------------------------
// Error paths
// ---------------------------------------------------------------------------

describe('error paths', () => {
  it('returns ok:false on HTTP 401', async () => {
    mockFetch(401, { message: 'Unauthorized' });
    const result = await mintPartnerToken(API_KEY, { fid: 42 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(401);
  });

  it('returns ok:false with status 502 on network error', async () => {
    mockFetch(0, null, new Error('network timeout'));
    const result = await mintPartnerToken(API_KEY, { fid: 42 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(502);
      expect(result.error).toContain('network timeout');
    }
  });

  it('returns ok:false when response body has no token', async () => {
    mockFetch(200, { expires_at: '2026-07-17T00:00:00Z' }); // missing token
    const result = await mintPartnerToken(API_KEY, { fid: 42 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(502);
  });

  it('returns ok:false when expires_at is missing', async () => {
    mockFetch(200, { token: 'abc' }); // missing expires_at
    const result = await mintPartnerToken(API_KEY, { fid: 42 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(502);
  });
});
