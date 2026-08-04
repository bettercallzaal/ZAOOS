/**
 * Proof Drops - public surface. The first knowledge-ecology layer above the Spore
 * substrate: anchor a claim to quotable evidence, content-addressed + federatable.
 * Flag-gated OFF (DREAMNET_PROOF_DROPS_ENABLED).
 */
export {
  isProofDropsEnabled,
  EvidenceItemSchema,
  ProofDropV1Schema,
  proofDropContentHash,
  createProofDrop,
  verifyProofDrop,
  proofDropToEnvelope,
  mintProofDropIdentity,
} from './proof-drop';
export type { EvidenceItem, ProofDropV1, CreateProofDropInput, VerifyResult } from './proof-drop';
