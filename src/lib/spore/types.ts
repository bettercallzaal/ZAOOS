/**
 * Spore interop - ZAO <-> DreamNet content-addressed compatibility.
 *
 * Brandon's @dreamnet/spore-sdk defines a cross-organism contract for the same
 * primitives ZAO's organism uses (Observation, Vacuum Spike, Bloodstream). The
 * thing that makes two organisms able to RECONCILE what they each saw is a
 * shared content hash: the same observed content must produce the same hash in
 * ZAO and in DreamNet, regardless of language. Brandon's current scheme is
 * `sha256:dreamnet-sorted-json:v0` - recursive key-sorted JSON + sha256, the
 * same family as ZAO's own `canonicalize`.
 *
 * This module produces Spore-compatible hashes + envelopes from ZAO
 * Observations so a ZAO observation and a DreamNet spore of the same content
 * are the same hash - the concrete substrate of the DreamNet trust layer
 * (Identity -> Receipt -> Reputation -> Trust; ZOL as a DreamNet node).
 *
 * Boundary: pure. No network, no decision, no action. It only re-expresses an
 * Observation in the shared Spore shape.
 */

/** The hash algorithm tag both sides stamp, so a consumer knows how to verify. */
export const SPORE_HASH_ALG = 'sha256:dreamnet-sorted-json:v0' as const;

export type SporeHashAlg = typeof SPORE_HASH_ALG;

/**
 * The minimal cross-organism envelope. A Spore is a hashed, sourced observation
 * that any DreamNet node can dedup + reconcile. Kept deliberately small - only
 * the fields both organisms agree on go into the hash.
 */
export interface Spore {
  schemaVersion: 'dreamnet.spore.v0';
  /** Stable subject/event key (matches the ZAO Observation subjectKey). */
  subjectKey: string;
  /** Observation kind, e.g. 'market.price'. */
  kind: string;
  /** The observed content. This + kind + subjectKey is what the hash covers. */
  payload: unknown;
  /** `<alg>:<hex>` - the portable content hash. */
  contentHash: string;
  /** Hash algorithm tag (redundant with the prefix, explicit for consumers). */
  hashAlg: SporeHashAlg;
  /** Who produced it (a ZAO sensor/spike id). Provenance, not part of the hash. */
  source: string;
  /** When the source captured it (ISO). Provenance, not part of the hash. */
  capturedAt: string;
}

/** The canonical fields the Spore hash is computed over. Field selection is the contract. */
export interface SporeHashInput {
  kind: string;
  subjectKey: string;
  payload: unknown;
}
