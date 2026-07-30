import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { canonicalize } from '../receipt-envelope';

/**
 * DreamNet Spore Phase 3 - bot-side canonicalization conformance.
 *
 * The bot build is isolated (no @/lib alias), so `canonicalize` is duplicated
 * in receipt-envelope.ts. This suite pins the BOT copy to the same
 * DreamNet-generated cross-runtime vectors the app copy is pinned to
 * (src/lib/spore/__tests__/fixtures/, SDK commit 4072102). If either copy
 * drifts, its suite fails - the fixtures are the shared contract.
 */

const here = dirname(fileURLToPath(import.meta.url));
const vectors: {
  canonicalization: Array<{ name: string; input: unknown; dreamnetCanonicalJson: string; dreamnetSha256: string }>;
} = JSON.parse(
  readFileSync(
    join(here, '..', '..', '..', '..', 'src', 'lib', 'spore', '__tests__', 'fixtures', 'cross-runtime-vectors.json'),
    'utf8',
  ),
);

const sha256Hex = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

describe('bot canonicalize - DreamNet cross-runtime vectors', () => {
  for (const v of vectors.canonicalization) {
    it(`byte-identical + hash-identical: ${v.name}`, () => {
      expect(canonicalize(v.input)).toBe(v.dreamnetCanonicalJson);
      expect(sha256Hex(canonicalize(v.input))).toBe(v.dreamnetSha256);
    });
  }

  it('rejects non-finite numbers (fail closed, matching DreamNet)', () => {
    expect(() => canonicalize({ a: NaN })).toThrow(/Non-finite/);
    expect(() => canonicalize({ a: Infinity })).toThrow(/Non-finite/);
  });

  it('sorts integer-like keys lexicographically (the JS-reorder trap)', () => {
    expect(canonicalize({ B: 1, a: 2, '10': 3, '2': 4, _z: 5 })).toBe(
      '{"10":3,"2":4,"B":1,"_z":5,"a":2}',
    );
  });

  it('ignores toJSON and omits function/symbol values (matching DreamNet)', () => {
    expect(canonicalize({ o: { toJSON: () => ({ replaced: true }), raw: 1 } })).toBe('{"o":{"raw":1}}');
    expect(canonicalize({ a: 1, fn: () => 1, s: Symbol('x') })).toBe('{"a":1}');
  });
});
