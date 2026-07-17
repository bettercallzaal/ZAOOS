// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  JUKE_API_ORIGIN,
  deleteJukeWebhook,
  getJukeRoomDetail,
  getJukeWebhookDetail,
} from '../juke-api-reads';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const API_KEY = 'test-api-key';

// ---------------------------------------------------------------------------
// Mock fetch helpers
// ---------------------------------------------------------------------------

function makeHeaders(rl?: {
  limit?: number;
  remaining?: number;
  reset?: number;
}): Headers {
  const map = new Map<string, string>();
  if (rl?.limit !== undefined) map.set('x-juke-rate-limit-limit', String(rl.limit));
  if (rl?.remaining !== undefined) map.set('x-juke-rate-limit-remaining', String(rl.remaining));
  if (rl?.reset !== undefined) map.set('x-juke-rate-limit-reset', String(rl.reset));
  return {
    get: (name: string) => map.get(name.toLowerCase()) ?? null,
  } as unknown as Headers;
}

function mockFetch(
  status: number,
  body: unknown,
  rl?: Parameters<typeof makeHeaders>[0],
  throws?: Error,
) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      if (throws) throw throws;
      return {
        ok: status >= 200 && status < 300,
        status,
        headers: makeHeaders(rl),
        text: async () => (body === undefined || body === null ? '' : JSON.stringify(body)),
      };
    }),
  );
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllGlobals());

// ---------------------------------------------------------------------------
// JUKE_API_ORIGIN constant
// ---------------------------------------------------------------------------

describe('JUKE_API_ORIGIN', () => {
  it('equals the Juke API base URL', () => {
    expect(JUKE_API_ORIGIN).toBe('https://api.juke.audio');
  });
});

// ---------------------------------------------------------------------------
// getJukeRoomDetail
// ---------------------------------------------------------------------------

const ROOM_BODY = {
  id: 'space-abc',
  status: 'active',
  title: 'Test Room',
  participant_count: 3,
};

describe('getJukeRoomDetail', () => {
  it('returns ok:true with room data on 200', async () => {
    mockFetch(200, ROOM_BODY);
    const result = await getJukeRoomDetail('space-abc', API_KEY);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual(ROOM_BODY);
  });

  it('returns status 200 on success', async () => {
    mockFetch(200, ROOM_BODY);
    const result = await getJukeRoomDetail('space-abc', API_KEY);
    expect(result.status).toBe(200);
  });

  it('returns ok:false with status 404', async () => {
    mockFetch(404, { message: 'not found' });
    const result = await getJukeRoomDetail('space-abc', API_KEY);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(404);
  });

  it('returns ok:false with status 0 on network error', async () => {
    mockFetch(0, null, undefined, new Error('ECONNREFUSED'));
    const result = await getJukeRoomDetail('space-abc', API_KEY);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(0);
    expect(result.error).toBe('Juke API unreachable');
  });

  it('sends X-Juke-Api-Key header', async () => {
    mockFetch(200, ROOM_BODY);
    await getJukeRoomDetail('space-abc', API_KEY);
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>)['X-Juke-Api-Key']).toBe(API_KEY);
  });

  it('includes the spaceId in the URL path', async () => {
    mockFetch(200, ROOM_BODY);
    await getJukeRoomDetail('space-xyz', API_KEY);
    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain('/v1/developer/spaces/space-xyz');
  });

  it('URL-encodes the spaceId', async () => {
    mockFetch(200, ROOM_BODY);
    await getJukeRoomDetail('space with spaces', API_KEY);
    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain('space%20with%20spaces');
  });

  it('parses X-Juke-Rate-Limit-* headers when present', async () => {
    mockFetch(200, ROOM_BODY, { limit: 120, remaining: 100, reset: 1750000060 });
    const result = await getJukeRoomDetail('space-abc', API_KEY);
    expect(result.rateLimit).toEqual({ limit: 120, remaining: 100, resetAtSeconds: 1750000060 });
  });

  it('returns all-null rateLimit on network error (hardcoded early return)', async () => {
    mockFetch(0, null, undefined, new Error('timeout'));
    const result = await getJukeRoomDetail('space-abc', API_KEY);
    expect(result.rateLimit).toEqual({ limit: null, remaining: null, resetAtSeconds: null });
  });

  it('returns ok:false with status 401 on auth failure', async () => {
    mockFetch(401, { message: 'Unauthorized' });
    const result = await getJukeRoomDetail('space-abc', API_KEY);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// getJukeWebhookDetail
// ---------------------------------------------------------------------------

const WEBHOOK_BODY = {
  id: 'wh-abc',
  url: 'https://example.com/webhook',
  events: ['track.played', 'stream.ended'],
  last_delivery_at: '2026-07-16T00:00:00Z',
  last_status: 200,
  consecutive_failures: 0,
};

describe('getJukeWebhookDetail', () => {
  it('returns ok:true with webhook data on 200', async () => {
    mockFetch(200, WEBHOOK_BODY);
    const result = await getJukeWebhookDetail('wh-abc', API_KEY);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual(WEBHOOK_BODY);
  });

  it('returns ok:false with status 401 on auth failure', async () => {
    mockFetch(401, { message: 'Unauthorized' });
    const result = await getJukeWebhookDetail('wh-abc', API_KEY);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
  });

  it('includes the webhookId in the URL path', async () => {
    mockFetch(200, WEBHOOK_BODY);
    await getJukeWebhookDetail('wh-xyz', API_KEY);
    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain('/v1/developer/webhooks/wh-xyz');
  });

  it('parses rate-limit headers when present', async () => {
    mockFetch(200, WEBHOOK_BODY, { limit: 120, remaining: 50, reset: 1750000120 });
    const result = await getJukeWebhookDetail('wh-abc', API_KEY);
    expect(result.rateLimit.remaining).toBe(50);
    expect(result.rateLimit.limit).toBe(120);
  });

  it('returns ok:false with status 0 on network error', async () => {
    mockFetch(0, null, undefined, new Error('network fail'));
    const result = await getJukeWebhookDetail('wh-abc', API_KEY);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(0);
    expect(result.error).toBe('Juke API unreachable');
  });

  it('sends X-Juke-Api-Key header', async () => {
    mockFetch(200, WEBHOOK_BODY);
    await getJukeWebhookDetail('wh-abc', API_KEY);
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>)['X-Juke-Api-Key']).toBe(API_KEY);
  });
});

// ---------------------------------------------------------------------------
// deleteJukeWebhook
// ---------------------------------------------------------------------------

describe('deleteJukeWebhook', () => {
  it('returns ok:true with status 204 on success', async () => {
    mockFetch(204, null);
    const result = await deleteJukeWebhook('wh-abc', API_KEY);
    expect(result.ok).toBe(true);
    expect(result.status).toBe(204);
  });

  it('sends DELETE method', async () => {
    mockFetch(204, null);
    await deleteJukeWebhook('wh-abc', API_KEY);
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(init.method).toBe('DELETE');
  });

  it('sends X-Juke-Api-Key header', async () => {
    mockFetch(204, null);
    await deleteJukeWebhook('wh-abc', API_KEY);
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>)['X-Juke-Api-Key']).toBe(API_KEY);
  });

  it('includes the webhookId in the URL path', async () => {
    mockFetch(204, null);
    await deleteJukeWebhook('wh-abc', API_KEY);
    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain('/v1/developer/webhooks/wh-abc');
  });

  it('URL-encodes the webhookId', async () => {
    mockFetch(204, null);
    await deleteJukeWebhook('wh/special', API_KEY);
    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain('wh%2Fspecial');
  });

  it('returns ok:false with status 404 when webhook not found', async () => {
    mockFetch(404, 'Not Found');
    const result = await deleteJukeWebhook('wh-abc', API_KEY);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(404);
  });

  it('returns ok:false with status 0 on network error', async () => {
    mockFetch(0, null, undefined, new Error('ECONNRESET'));
    const result = await deleteJukeWebhook('wh-abc', API_KEY);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(0);
    expect(result.error).toBe('Juke API unreachable');
  });

  it('returns all-null rateLimit on network error (hardcoded early return)', async () => {
    mockFetch(0, null, undefined, new Error('timeout'));
    const result = await deleteJukeWebhook('wh-abc', API_KEY);
    expect(result.rateLimit).toEqual({ limit: null, remaining: null, resetAtSeconds: null });
  });

  it('parses rate-limit headers on success', async () => {
    mockFetch(204, null, { limit: 120, remaining: 99, reset: 1750000180 });
    const result = await deleteJukeWebhook('wh-abc', API_KEY);
    expect(result.rateLimit.remaining).toBe(99);
    expect(result.rateLimit.resetAtSeconds).toBe(1750000180);
  });
});
