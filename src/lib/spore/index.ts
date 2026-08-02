/**
 * Spore interop - ZAO <-> DreamNet content-addressed compatibility. Public surface.
 *
 * Makes a ZAO Observation reconcilable with a DreamNet spore via a shared
 * content hash, so ZAO can act as a Spore-compatible node in the DreamNet trust
 * layer. Pairs with Brandon's @dreamnet/spore-sdk (which ships the reciprocal
 * ZAO ProofDrop adapter from the DreamNet side).
 *
 * Trust layer (Phase 3+) is FLAG-GATED behind process.env.SPORE_TRUST_ENABLED=true.
 * When OFF (default), the hash-only path is used. When ON, trust-layer verifiers
 * are available but not automatically wired into any live route.
 */

export { SPORE_HASH_ALG } from './types';
export type { Spore, SporeHashAlg, SporeHashInput } from './types';
export { sporeContentHash, verifySpore, observationToSpore } from './spore';
export * from './receipt';
export * from './interop';
export {
  canonicalizeRfc8785,
  SPORE_ENVELOPE_VERSION,
  createSignedEnvelope,
  verifyEnvelopeWithTrust,
  assessLegacyEnvelope,
  isTrustEnabled,
  InMemoryKeyResolver,
  InMemoryReplayStore,
  InMemoryRevocationResolver,
  InMemorySchemaRegistry,
} from './trust';
export type {
  SporeEnvelopeVersion,
  UnsignedSporeEnvelope,
  SignedSporeEnvelope,
  AssessmentStatus,
  EnvelopeAssessment,
  IssuerKey,
  IssuerKeyResolver,
  ReplayStoreEntry,
  ReplayStore,
  RevocationResolver,
  SchemaRegistry,
  VerifyEnvelopeWithTrustOpts,
} from './trust';
