// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { get100msPeerCount, mintManagementToken } from '../hms100ms';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  delete process.env.NEXT_PUBLIC_100MS_ACCESS_KEY;
  delete process.env.HMS_APP_SECRET;
});

// ---------------------------------------------------------------------------
// mintManagementToken
// ---------------------------------------------------------------------------

describe('mintManagementToken', () => {
  it('returns null when NEXT_PUBLIC_100MS_ACCESS_KEY is absent', () => {
    delete process.env.NEXT_PUBLIC_100MS_ACCESS_KEY;
    process.env.HMS_APP_SECRET = 'secret';
    expect(mintManagementToken()).toBeNull();
  });

  it('returns null when HMS_APP_SECRET is absent', () => {
    process.env.NEXT_PUBLIC_100MS_ACCESS_KEY = 'key';
    delete process.env.HMS_APP_SECRET;
    expect(mintManagementToken()).toBeNull();
  });

  it('returns null when both credentials are absent', () => {
    delete process.env.NEXT_PUBLIC_100MS_ACCESS_KEY;
    delete process.env.HMS_APP_SECRET;
    expect(mintManagementToken()).toBeNull();
  });

  it('returns a JWT string when both credentials are present', () => {
    process.env.NEXT_PUBLIC_100MS_ACCESS_KEY = 'test-access-key';
    process.env.HMS_APP_SECRET = 'a-test-secret-of-at-least-32-chars--';
    const token = mintManagementToken();
    // JWT format: three base64url segments separated by dots
    expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  });
});

// ---------------------------------------------------------------------------
// get100msPeerCount
// ---------------------------------------------------------------------------

describe('get100msPeerCount', () => {
  it('returns null when no management token can be minted (no credentials)', async () => {
    delete process.env.NEXT_PUBLIC_100MS_ACCESS_KEY;
    delete process.env.HMS_APP_SECRET;
    const result = await get100msPeerCount('room-1');
    expect(result).toBeNull();
  });

  it('returns null when an explicit null token is passed', async () => {
    const result = await get100msPeerCount('room-1', null);
    expect(result).toBeNull();
  });

  it('returns 0 when 100ms returns 404 (no active session = empty room)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404 }),
    );
    const result = await get100msPeerCount('room-1', 'mgmt-token');
    expect(result).toBe(0);
  });

  it('returns null for other non-OK responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );
    const result = await get100msPeerCount('room-1', 'mgmt-token');
    expect(result).toBeNull();
  });

  it('returns peer count from data.peers object key count', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ peers: { peer1: {}, peer2: {}, peer3: {} } }),
      }),
    );
    const result = await get100msPeerCount('room-1', 'mgmt-token');
    expect(result).toBe(3);
  });

  it('returns data.peer_count when peers is not an object', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ peer_count: 7 }),
      }),
    );
    const result = await get100msPeerCount('room-1', 'mgmt-token');
    expect(result).toBe(7);
  });

  it('returns null when fetch throws (network error)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network down')));
    const result = await get100msPeerCount('room-1', 'mgmt-token');
    expect(result).toBeNull();
  });
});
