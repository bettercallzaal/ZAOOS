/**
 * Spore hashing + envelope construction. See ./types for the contract rationale.
 *
 * The hash reuses ZAO's own `canonicalize` (recursive key-sorted JSON) - which
 * is the same family as Brandon's `dreamnet-sorted-json:v0` - over the agreed
 * field set {kind, subjectKey, payload}. The tag is stamped as a prefix so a
 * consumer on either side knows exactly how to reproduce it.
 *
 * IMPORTANT (conformance): byte-identical cross-organism hashing requires that
 * BOTH sides serialize numbers + strings identically and hash the SAME fields.
 * ZAO and the Spore SDK both use sorted-json today, but the byte-exactness must
 * be proven against the SDK's own conformance vectors (see the __tests__ note).
 * Until that passes against Brandon's repo, treat cross-org matches as expected
 * but unverified.
 */

import { canonicalize, sha256Hex } from '@/lib/eyes';
import type { Observation } from '@/lib/eyes';
import { SPORE_HASH_ALG, type Spore, type SporeHashInput } from './types';

/** Compute the Spore-compatible content hash: `sha256:dreamnet-sorted-json:v0:<hex>`. */
export function sporeContentHash(input: SporeHashInput): string {
  const hex = sha256Hex(canonicalize({ kind: input.kind, subjectKey: input.subjectKey, payload: input.payload }));
  return `${SPORE_HASH_ALG}:${hex}`;
}

/** True if a Spore's stamped hash matches a fresh hash of its content. */
export function verifySpore(spore: Spore): boolean {
  if (spore.hashAlg !== SPORE_HASH_ALG) return false;
  return spore.contentHash === sporeContentHash(spore);
}

/** Re-express a ZAO Observation as a Spore-compatible envelope. Pure. */
export function observationToSpore(obs: Observation): Spore {
  return {
    schemaVersion: 'dreamnet.spore.v0',
    subjectKey: obs.subjectKey,
    kind: obs.kind,
    payload: obs.payload,
    contentHash: sporeContentHash(obs),
    hashAlg: SPORE_HASH_ALG,
    source: obs.sensor,
    capturedAt: obs.capturedAt,
  };
}
