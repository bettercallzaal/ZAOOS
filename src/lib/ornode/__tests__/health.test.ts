import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkOrnodeHealth, resetOrnodeHealthCache } from '../health';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('checkOrnodeHealth', () => {
  beforeEach(() => {
    resetOrnodeHealthCache();
    mockFetch.mockReset();
  });

  afterEach(() => {
    resetOrnodeHealthCache();
  });

  it('returns true when ornode responds with any HTTP status', async () => {
    mockFetch.mockResolvedValueOnce({ status: 200 });
    expect(await checkOrnodeHealth()).toBe(true);
  });

  it('returns true for non-200 HTTP responses (server is up, content may vary)', async () => {
    mockFetch.mockResolvedValueOnce({ status: 503 });
    expect(await checkOrnodeHealth()).toBe(true);
  });

  it('returns false when fetch throws (network error / timeout)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    expect(await checkOrnodeHealth()).toBe(false);
  });

  it('returns false when fetch times out (AbortError)', async () => {
    mockFetch.mockRejectedValueOnce(new DOMException('Timeout', 'AbortError'));
    expect(await checkOrnodeHealth()).toBe(false);
  });

  it('caches the result — only calls fetch once within TTL', async () => {
    mockFetch.mockResolvedValue({ status: 200 });
    await checkOrnodeHealth();
    await checkOrnodeHealth();
    await checkOrnodeHealth();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('re-checks after cache is reset', async () => {
    mockFetch.mockResolvedValue({ status: 200 });
    await checkOrnodeHealth();
    resetOrnodeHealthCache();
    await checkOrnodeHealth();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('queries the correct ornode endpoint', async () => {
    mockFetch.mockResolvedValueOnce({ status: 200 });
    await checkOrnodeHealth();
    expect(mockFetch).toHaveBeenCalledWith(
      'https://ornode2.frapps.xyz/proposals?limit=1',
      expect.objectContaining({ method: 'GET' }),
    );
  });
});
