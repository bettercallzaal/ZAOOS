/**
 * Spore interop - ZAO <-> DreamNet content-addressed compatibility. Public surface.
 *
 * Makes a ZAO Observation reconcilable with a DreamNet spore via a shared
 * content hash, so ZAO can act as a Spore-compatible node in the DreamNet trust
 * layer. Pairs with Brandon's @dreamnet/spore-sdk (which ships the reciprocal
 * ZAO ProofDrop adapter from the DreamNet side).
 */

export { SPORE_HASH_ALG } from './types';
export type { Spore, SporeHashAlg, SporeHashInput } from './types';
export { sporeContentHash, verifySpore, observationToSpore } from './spore';
