// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createJukeSpace, extractSpaceId } from '../juke-api';

function stubFetch(ok: boolean, body: unknown | null = null) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status: ok ? 201 : 422,
      json: body === null
        ? async () => { throw new Error('Not valid JSON'); }
        : async () => body,
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const CREDS = { apiKey: 'juke-api-key-test' };
const BASE_INPUT = {
  title: 'ZAO Community Space',
  eventId: 'evt-001',
  scheduledAt: null,
};

// ---------------------------------------------------------------------------
// extractSpaceId — pure function
// ---------------------------------------------------------------------------

describe('extractSpaceId', () => {
  it('returns null for null input', () => {
    expect(extractSpaceId(null)).toBeNull();
  });

  it('returns null for a non-object string', () => {
    expect(extractSpaceId('abc123')).toBeNull();
  });

  it('returns the id from a top-level "id" key', () => {
    expect(extractSpaceId({ id: 'space-abc' })).toBe('space-abc');
  });

  it('returns the id from a top-level "space_id" key', () => {
    expect(extractSpaceId({ space_id: 'room-xyz' })).toBe('room-xyz');
  });

  it('returns the id from a nested "space.id" key', () => {
    expect(extractSpaceId({ space: { id: 'nested-id' } })).toBe('nested-id');
  });

  it('returns the id from a nested "data.spaceId" key', () => {
    expect(extractSpaceId({ data: { spaceId: 'data-space-01' } })).toBe('data-space-01');
  });

  it('returns null when the id contains invalid characters (fails isValidJukeSpaceId)', () => {
    expect(extractSpaceId({ id: 'bad/id?q=evil' })).toBeNull();
  });

  it('returns null when no matching key exists in the payload', () => {
    expect(extractSpaceId({ unknown_key: 'abc', other: 'xyz' })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// createJukeSpace — fetch-based
// ---------------------------------------------------------------------------

describe('createJukeSpace', () => {
  it('returns ok=false when fetch throws a generic network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));
    const result = await createJukeSpace(BASE_INPUT, CREDS);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('Could not reach the Juke API');
    }
  });

  it('returns ok=false with "timed out" message for TimeoutError', async () => {
    const timeoutErr = Object.assign(new Error('Timeout'), { name: 'TimeoutError' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(timeoutErr));
    const result = await createJukeSpace(BASE_INPUT, CREDS);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('timed out');
  });

  it('returns ok=false with status when API responds non-OK', async () => {
    stubFetch(false);
    const result = await createJukeSpace(BASE_INPUT, CREDS);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(422);
      expect(result.error).toContain('422');
    }
  });

  it('returns ok=false when the response body is not valid JSON', async () => {
    stubFetch(true, null); // null triggers the JSON parse error stub
    const result = await createJukeSpace(BASE_INPUT, CREDS);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('invalid JSON');
  });

  it('returns ok=false when the payload contains no usable space id', async () => {
    stubFetch(true, { message: 'created', unknown_field: 'abc' });
    const result = await createJukeSpace(BASE_INPUT, CREDS);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('usable space id');
  });

  it('returns ok=true with spaceId and embedUrl when the response is valid', async () => {
    stubFetch(true, { id: 'space-live-01', title: 'ZAO Community Space' });
    const result = await createJukeSpace(BASE_INPUT, CREDS);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.space.id).toBe('space-live-01');
      expect(result.space.embedUrl).toContain('juke.audio/embed/space-live-01');
    }
  });
});
