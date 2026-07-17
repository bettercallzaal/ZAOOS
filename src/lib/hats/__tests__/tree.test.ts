// @vitest-environment node
// Tests for clearTreeCache — the only pure (non-on-chain) export in tree.ts.
// fetchHatTree is not tested here because it requires the Hats SDK + live RPC.
import { describe, expect, it } from 'vitest';
import { clearTreeCache } from '../tree';

describe('clearTreeCache', () => {
  it('does not throw when called with no prior cache', () => {
    expect(() => clearTreeCache()).not.toThrow();
  });

  it('returns undefined', () => {
    expect(clearTreeCache()).toBeUndefined();
  });

  it('is idempotent — repeated calls do not throw', () => {
    clearTreeCache();
    clearTreeCache();
    expect(() => clearTreeCache()).not.toThrow();
  });
});
