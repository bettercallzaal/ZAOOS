// @vitest-environment node
import { describe, expect, it } from 'vitest';
import hindsight, { getHindsightClient } from '../hindsight';

// getHindsightClient lazy-imports @vectorize-io/hindsight-client which is an
// optional dependency not installed in this repo. The module gracefully returns
// null so callers can skip Hindsight features when the package is absent.

describe('getHindsightClient', () => {
  it('is a function', () => {
    expect(typeof getHindsightClient).toBe('function');
  });

  it('returns null when the optional package is not installed', async () => {
    const client = await getHindsightClient();
    expect(client).toBeNull();
  });

  it('returns null on repeated calls (no spurious retry)', async () => {
    const a = await getHindsightClient();
    const b = await getHindsightClient();
    expect(a).toBeNull();
    expect(b).toBeNull();
  });
});

describe('hindsight default export', () => {
  it('has a getClient method', () => {
    expect(typeof hindsight.getClient).toBe('function');
  });

  it('getClient is the same function as the named export', () => {
    expect(hindsight.getClient).toBe(getHindsightClient);
  });
});
