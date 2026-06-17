import { describe, it, expect } from 'vitest';
import { hasValidKey, findKeyHolder } from '../lock';

// These cover the input-guard paths only - they short-circuit before any RPC
// call, so they are deterministic and never touch the network.
describe('unlock/lock guards', () => {
  it('hasValidKey returns false for an invalid lock address', async () => {
    expect(await hasValidKey('not-an-address', '0x'.padEnd(42, '1'))).toBe(false);
  });

  it('hasValidKey returns false for an invalid wallet address', async () => {
    const lock = '0x'.padEnd(42, 'a');
    expect(await hasValidKey(lock, 'nope')).toBe(false);
  });

  it('findKeyHolder returns null when no candidate is a valid address', async () => {
    const lock = '0x'.padEnd(42, 'a');
    expect(await findKeyHolder(lock, ['bad', 'also-bad'])).toBeNull();
  });

  it('findKeyHolder returns null for an invalid lock address', async () => {
    expect(await findKeyHolder('bad', ['0x'.padEnd(42, '1')])).toBeNull();
  });

  it('findKeyHolder returns null for an empty candidate list', async () => {
    const lock = '0x'.padEnd(42, 'a');
    expect(await findKeyHolder(lock, [])).toBeNull();
  });
});
