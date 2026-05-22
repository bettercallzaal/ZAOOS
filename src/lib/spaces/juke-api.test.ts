import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createJukeSpace,
  extractSpaceId,
  JUKE_API_ORIGIN,
  type JukeCredentials,
} from './juke-api';

/** A complete credentials pair for tests that do not assert on the values. */
const CREDS: JukeCredentials = { apiKey: 'jk_sec_live_test', userToken: 'jwt_test' };

describe('extractSpaceId', () => {
  it('reads a top-level id', () => {
    expect(extractSpaceId({ id: 'abc123' })).toBe('abc123');
  });

  it('reads alternate top-level id keys', () => {
    expect(extractSpaceId({ space_id: 'sp-1' })).toBe('sp-1');
    expect(extractSpaceId({ spaceId: 'sp-2' })).toBe('sp-2');
    expect(extractSpaceId({ room_id: 'rm-1' })).toBe('rm-1');
    expect(extractSpaceId({ roomId: 'rm-2' })).toBe('rm-2');
  });

  it('reads an id nested one level deep', () => {
    expect(extractSpaceId({ space: { id: 'nested-1' } })).toBe('nested-1');
    expect(extractSpaceId({ room: { id: 'nested-2' } })).toBe('nested-2');
    expect(extractSpaceId({ data: { space_id: 'nested-3' } })).toBe('nested-3');
  });

  it('prefers a top-level id over a nested one', () => {
    expect(extractSpaceId({ id: 'top', space: { id: 'deep' } })).toBe('top');
  });

  it('rejects a structurally invalid id', () => {
    expect(extractSpaceId({ id: 'abc/def' })).toBeNull();
    expect(extractSpaceId({ id: '../evil' })).toBeNull();
    expect(extractSpaceId({ id: '' })).toBeNull();
    expect(extractSpaceId({ id: 'a'.repeat(129) })).toBeNull();
  });

  it('rejects a non-string id', () => {
    expect(extractSpaceId({ id: 42 })).toBeNull();
    expect(extractSpaceId({ id: null })).toBeNull();
  });

  it('returns null when no id field is present', () => {
    expect(extractSpaceId({ title: 'no id here' })).toBeNull();
  });

  it('returns null for non-object input', () => {
    expect(extractSpaceId(null)).toBeNull();
    expect(extractSpaceId(undefined)).toBeNull();
    expect(extractSpaceId('abc123')).toBeNull();
    expect(extractSpaceId(42)).toBeNull();
  });
});

describe('createJukeSpace', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function mockFetchOnce(init: { ok: boolean; status: number; json: () => unknown }) {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: init.ok,
      status: init.status,
      json: async () => init.json(),
    } as Response);
  }

  it('posts to the developer endpoint with both auth headers', async () => {
    mockFetchOnce({ ok: true, status: 201, json: () => ({ id: 'abc123' }) });

    await createJukeSpace(
      { title: 'ZAO Standup' },
      { apiKey: 'jk_sec_live_test', userToken: 'jwt_abc' },
    );

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe(`${JUKE_API_ORIGIN}/v1/developer/spaces`);
    expect(options.method).toBe('POST');
    expect(options.headers['X-Juke-Api-Key']).toBe('jk_sec_live_test');
    expect(options.headers.Authorization).toBe('Bearer jwt_abc');
    expect(options.headers['Content-Type']).toBe('application/json');
  });

  it('maps the camelCase input to the snake_case Juke body', async () => {
    mockFetchOnce({ ok: true, status: 201, json: () => ({ id: 'abc123' }) });

    await createJukeSpace(
      {
        title: 'Fractal Call',
        scheduledAt: '2026-06-01T18:00:00.000Z',
        announceCast: true,
        allowAgents: true,
      },
      CREDS,
    );

    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({
      title: 'Fractal Call',
      scheduled_at: '2026-06-01T18:00:00.000Z',
      announce_cast: true,
      allow_agents: true,
    });
  });

  it('defaults optional fields when omitted', async () => {
    mockFetchOnce({ ok: true, status: 201, json: () => ({ id: 'abc123' }) });

    await createJukeSpace({ title: 'Quick Room' }, CREDS);

    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({
      title: 'Quick Room',
      scheduled_at: null,
      announce_cast: false,
      allow_agents: false,
    });
  });

  it('returns the space with an embed URL on success', async () => {
    mockFetchOnce({ ok: true, status: 201, json: () => ({ id: 'zao-live-1' }) });

    const result = await createJukeSpace({ title: 'ZAO Live' }, CREDS);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.space.id).toBe('zao-live-1');
      expect(result.space.embedUrl).toBe('https://juke.audio/embed/zao-live-1');
      expect(result.space.raw).toEqual({ id: 'zao-live-1' });
    }
  });

  it('fails when the Juke response carries no usable id', async () => {
    mockFetchOnce({ ok: true, status: 201, json: () => ({ title: 'orphan' }) });

    const result = await createJukeSpace({ title: 'ZAO Live' }, CREDS);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(502);
      expect(result.error).toMatch(/space id/i);
    }
  });

  it('surfaces a non-2xx Juke response with its status', async () => {
    mockFetchOnce({ ok: false, status: 401, json: () => ({}) });

    const result = await createJukeSpace(
      { title: 'ZAO Live' },
      { apiKey: 'bad-key', userToken: 'bad-jwt' },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(401);
      expect(result.error).toMatch(/401/);
    }
  });

  it('returns a 502 when the Juke API is unreachable', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const result = await createJukeSpace({ title: 'ZAO Live' }, CREDS);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(502);
      expect(result.error).toMatch(/reach/i);
    }
  });

  it('reports a timeout distinctly', async () => {
    const timeout = new Error('aborted');
    timeout.name = 'TimeoutError';
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(timeout);

    const result = await createJukeSpace({ title: 'ZAO Live' }, CREDS);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(502);
      expect(result.error).toMatch(/timed out/i);
    }
  });

  it('returns a 502 when the Juke API returns invalid JSON', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('Unexpected token');
      },
    } as Response);

    const result = await createJukeSpace({ title: 'ZAO Live' }, CREDS);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(502);
      expect(result.error).toMatch(/invalid json/i);
    }
  });
});
