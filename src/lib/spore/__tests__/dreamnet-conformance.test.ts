import { describe, it, expect } from 'vitest';
import { canonicalize, sha256Hex } from '@/lib/eyes';

/**
 * DreamNet Spore federation - Phase 1: Canonical Hash Conformance.
 *
 * Permanent golden vector from Brandon (DreamNet) - proves ZAO's `canonicalize`
 * is byte-identical to DreamNet's `canonicalJsonStringify` / `computeCanonicalHash`
 * reference. If this ever drifts, ZAO stops being a valid Spore node. Do not edit
 * the expected values - they are the cross-org contract.
 */
describe('DreamNet Spore Phase 1 - canonical hash conformance (golden vector)', () => {
  const payload = { z: 100, a: 'dreamnet-spore', m: { b: true, a: null } };

  it('produces byte-identical canonical serialization to the DreamNet reference', () => {
    expect(canonicalize(payload)).toBe('{"a":"dreamnet-spore","m":{"a":null,"b":true},"z":100}');
  });

  it('produces the identical SHA-256 to the DreamNet reference', () => {
    expect(sha256Hex(canonicalize(payload))).toBe(
      '6b560a8869530ac60f9d3795e55d04240d237010140502f8f7a768d190de013a',
    );
  });

  it('is deterministic regardless of input key order', () => {
    const reordered = { m: { a: null, b: true }, a: 'dreamnet-spore', z: 100 };
    expect(canonicalize(reordered)).toBe(canonicalize(payload));
  });
});
