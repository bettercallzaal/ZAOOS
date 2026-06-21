// Auth + input validation for the loopback /hermes-dispatch HTTP listener
// (bot/src/devz/index.ts). Extracted as pure functions so they're unit-testable
// without booting the devz process. doc 869 follow-up (P3 defense-in-depth).

import { timingSafeEqual } from 'node:crypto';

/**
 * Constant-time string comparison for the dispatch secret. A plain `!==`
 * short-circuits on the first differing byte, leaking timing about how much of
 * the secret was correct. Loopback-only + low severity, but cheap to do right.
 * The length check leaks length only, which is acceptable here.
 */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Validate a research-doc path supplied to /hermes-dispatch: must be a
 * relative `.md` path, no traversal. Guards the doc the Hermes pipeline is
 * pointed at.
 */
export function isValidDocPath(doc: string): boolean {
  if (!doc) return false;
  if (doc.includes('..')) return false;
  return /^[a-z0-9][a-z0-9/_.-]*\.md$/i.test(doc);
}
