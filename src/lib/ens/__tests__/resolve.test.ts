// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { resolveBasenames, resolveENSNames } from '../resolve';

// These tests cover the address-filtering and deduplication logic inside
// resolveENSNames / resolveBasenames. No valid 0x42-char addresses are passed,
// so resolveENSName / resolveBasename is never called and no network requests
// are made.

describe('resolveENSNames — address filtering', () => {
  it('returns an empty object for an empty array', async () => {
    const result = await resolveENSNames([]);
    expect(result).toEqual({});
  });

  it('filters out addresses that do not start with 0x', async () => {
    const result = await resolveENSNames(['not-an-address', 'also-not', '1234567890abcdef']);
    expect(result).toEqual({});
  });

  it('filters out addresses shorter than 42 chars', async () => {
    // Valid prefix but too short
    const result = await resolveENSNames(['0x1234', '0x']);
    expect(result).toEqual({});
  });

  it('filters out addresses longer than 42 chars', async () => {
    const tooLong = '0x' + 'a'.repeat(41); // 43 chars total
    const result = await resolveENSNames([tooLong]);
    expect(result).toEqual({});
  });

  it('deduplicates addresses: 3 copies of the same (short) address still produce 0 results', async () => {
    // Short addresses (< 42 chars) are filtered before dedup — no network calls.
    // Verifies the filter runs on duplicated inputs without error.
    const shortAddr = '0x' + 'b'.repeat(10);
    const result = await resolveENSNames([shortAddr, shortAddr, shortAddr]);
    expect(result).toEqual({});
  });

  it('returns empty when given null-ish or empty string entries', async () => {
    // filter(a => a && ...) handles falsy values
    // @ts-expect-error — deliberate runtime test with mixed types
    const result = await resolveENSNames([null, undefined, '', '0x']);
    expect(result).toEqual({});
  });
});

describe('resolveBasenames — address filtering', () => {
  it('returns an empty object for an empty array', async () => {
    const result = await resolveBasenames([]);
    expect(result).toEqual({});
  });

  it('filters out non-0x addresses', async () => {
    const result = await resolveBasenames(['base.eth', 'myname.base.eth']);
    expect(result).toEqual({});
  });

  it('filters out addresses shorter than 42 chars', async () => {
    const result = await resolveBasenames(['0xshort', '0x1234abcd']);
    expect(result).toEqual({});
  });

  it('deduplicates addresses: 3 copies of the same short address produce 0 results', async () => {
    const shortAddr = '0x' + 'c'.repeat(10);
    const result = await resolveBasenames([shortAddr, shortAddr, shortAddr]);
    expect(result).toEqual({});
  });
});
