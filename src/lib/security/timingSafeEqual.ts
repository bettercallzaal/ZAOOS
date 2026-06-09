/**
 * Constant-time string comparison for secrets / signatures.
 *
 * A plain `a === b` short-circuits on the first differing byte, leaking how much
 * of a secret a caller guessed via response timing. This compares every byte
 * regardless. Length is not treated as secret (our secrets/signatures are
 * fixed-length), so an early length check is fine. Runtime-agnostic (no Node
 * `crypto`/`Buffer`) so it works in both the Node and Edge route runtimes.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
