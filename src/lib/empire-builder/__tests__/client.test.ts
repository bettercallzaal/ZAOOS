// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getEmpire, getTopEmpires } from '../client';

function stubFetch(ok: boolean, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status: ok ? 200 : 500,
      json: async () => body,
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

// empireSummarySchema requires empire_address; other fields are optional/passthrough
const MOCK_EMPIRE = {
  empire_address: '0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07',
  name: 'ZAO Empire',
  rank: 1,
};

// ---------------------------------------------------------------------------
// getTopEmpires
// ---------------------------------------------------------------------------

describe('getTopEmpires', () => {
  it('throws when the API returns a non-OK response', async () => {
    stubFetch(false, {});
    await expect(getTopEmpires()).rejects.toThrow('Empire Builder API 500');
  });

  it('returns empires from data.empires when present', async () => {
    stubFetch(true, { empires: [MOCK_EMPIRE] });
    const result = await getTopEmpires();
    expect(result).toHaveLength(1);
    expect(result[0].empire_address).toBe('0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07');
  });

  it('falls back to data.data when empires key is absent', async () => {
    stubFetch(true, { data: [MOCK_EMPIRE] });
    const result = await getTopEmpires();
    expect(result).toHaveLength(1);
  });

  it('returns an empty array when both empires and data are absent', async () => {
    stubFetch(true, { count: 0 });
    const result = await getTopEmpires({ limit: 5 });
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getEmpire
// ---------------------------------------------------------------------------

describe('getEmpire', () => {
  it('returns null when the API returns a non-OK response (error caught)', async () => {
    stubFetch(false, {});
    const result = await getEmpire('empire-abc');
    expect(result).toBeNull();
  });

  it('returns the empire from data.empire when present', async () => {
    stubFetch(true, { empire: MOCK_EMPIRE });
    const result = await getEmpire('empire-abc');
    expect(result?.empire_address).toBe('0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07');
  });

  it('returns null when data contains no recognizable empire shape', async () => {
    stubFetch(true, { success: true, unknown: 'field' });
    const result = await getEmpire('empire-abc');
    expect(result).toBeNull();
  });
});
