/**
 * Proof Drops - the first layer of the DreamNet knowledge ecology above the Spore
 * substrate (Brandon's stack: graphs -> PROOF DROPS anchor evidence -> Claim
 * Factories -> verification -> Knowledge Crystals -> Living Papers -> Spore).
 *
 * A Proof Drop anchors a CLAIM to its EVIDENCE, content-addressed and (optionally)
 * signed as a Spore envelope for cross-organism federation. The invariant that
 * makes it more than a note: **evidence is mandatory and quotable.** A claim with
 * no quotable evidence is NOT a proof drop - it fails verification. This is the
 * anti-fabrication rule (a claim is not a fact until checked) made into a data
 * structure, and it matches Anthropic Hermes's "grounded-citations" pattern.
 *
 * Reuses the Spore trust layer (hash + signed envelope) and the tenant namespace
 * (`proofdrops.<tenant>.*` from the boundary matrix). Flag-gated OFF.
 */

import { z } from 'zod';
import { generateKeyPairSync, type KeyObject } from 'node:crypto';
import { sporeContentHash, createSignedEnvelope, type UnsignedSporeEnvelope, type SignedSporeEnvelope } from '@/lib/spore';

/** Master switch. Default OFF - nothing is wired into a live route. */
export function isProofDropsEnabled(): boolean {
  return process.env.DREAMNET_PROOF_DROPS_ENABLED === 'true';
}

/** One piece of evidence. Must carry a quotable span - a bare ref is not evidence. */
export const EvidenceItemSchema = z.object({
  kind: z.enum(['file', 'url', 'receipt', 'quote']),
  ref: z.string().min(1), // file:line, URL, receipt id
  quote: z.string().min(1), // the actual evidence text - REQUIRED, this is the point
});
export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;

export const ProofDropV1Schema = z.object({
  schemaVersion: z.literal('proof-drop.v1'),
  proofDropId: z.string().min(1),
  tenantId: z.string().min(1),
  claim: z.string().min(1),
  // Evidence is mandatory + non-empty. A claim with no evidence fails validation.
  evidence: z.array(EvidenceItemSchema).min(1),
  producer: z.string().min(1),
  createdAt: z.string().min(1),
  integrity: z.object({
    canonicalization: z.string().min(1),
    contentHash: z.string().min(1),
    hashAlgorithm: z.string().min(1),
  }),
  supersedes: z.array(z.string()).optional(),
});
export type ProofDropV1 = z.infer<typeof ProofDropV1Schema>;

export interface CreateProofDropInput {
  readonly proofDropId: string;
  readonly tenantId: string;
  readonly claim: string;
  readonly evidence: EvidenceItem[];
  readonly producer: string;
  readonly createdAt: string;
}

/** Compute the content hash over the load-bearing fields (claim + evidence + producer). */
export function proofDropContentHash(input: { proofDropId: string; claim: string; evidence: EvidenceItem[]; producer: string }): string {
  return sporeContentHash({
    kind: 'proof-drop.v1',
    subjectKey: input.proofDropId,
    payload: { claim: input.claim, evidence: input.evidence, producer: input.producer },
  });
}

/**
 * Create a Proof Drop. Throws if there is no evidence - a claim with no quotable
 * evidence is not a proof drop (fail-closed at creation, not just at verify).
 */
export function createProofDrop(input: CreateProofDropInput): ProofDropV1 {
  if (!input.evidence || input.evidence.length === 0) {
    throw new Error('a Proof Drop requires at least one piece of quotable evidence');
  }
  for (const e of input.evidence) {
    if (!e.quote?.trim()) throw new Error(`evidence for ref "${e.ref}" has no quote - a bare ref is not evidence`);
  }
  const contentHash = proofDropContentHash(input);
  return {
    schemaVersion: 'proof-drop.v1',
    proofDropId: input.proofDropId,
    tenantId: input.tenantId,
    claim: input.claim,
    evidence: input.evidence,
    producer: input.producer,
    createdAt: input.createdAt,
    integrity: { canonicalization: 'dreamnet-sorted-json:v0', contentHash, hashAlgorithm: 'sha256' },
  };
}

export interface VerifyResult {
  readonly valid: boolean;
  readonly reason: string;
}

/**
 * Verify a Proof Drop, fail-closed. Checks: schema, evidence present + quotable,
 * and the content hash recomputes (tamper). Returns a structured result rather
 * than throwing so callers can surface a rejection.
 */
export function verifyProofDrop(input: unknown): VerifyResult {
  const parsed = ProofDropV1Schema.safeParse(input);
  if (!parsed.success) {
    return { valid: false, reason: `schema invalid: ${parsed.error.issues.map((i) => i.path.join('.')).join(', ')}` };
  }
  const pd = parsed.data;
  if (pd.evidence.length === 0 || pd.evidence.some((e) => !e.quote.trim())) {
    return { valid: false, reason: 'claim not anchored: missing quotable evidence' };
  }
  const recomputed = proofDropContentHash(pd);
  if (recomputed !== pd.integrity.contentHash) {
    return { valid: false, reason: 'content hash mismatch (tamper)' };
  }
  return { valid: true, reason: 'proof drop verified: claim anchored to quotable evidence, hash intact' };
}

/**
 * Wrap a verified Proof Drop in a signed Spore envelope for federation across
 * sovereign organisms (the Spore layer at the top of Brandon's stack). Audience is
 * the tenant-scoped proofdrops namespace. Throws if the drop does not verify.
 */
export function proofDropToEnvelope(
  pd: ProofDropV1,
  identity: { issuerId: string; keyId: string; privateKey: KeyObject },
  opts: { nonce: string; nowIso: string; expiresAtIso: string },
): SignedSporeEnvelope {
  const v = verifyProofDrop(pd);
  if (!v.valid) throw new Error(`cannot federate an invalid proof drop: ${v.reason}`);
  const audience = `proofdrops.${pd.tenantId}`;
  const unsigned: UnsignedSporeEnvelope = {
    kind: 'proof-drop.v1',
    nonce: opts.nonce,
    audience: [audience],
    schema: 'proof-drop.v1',
    issuer: { id: identity.issuerId, keyId: identity.keyId },
    subject: pd,
    issuedAt: opts.nowIso,
    expiresAt: opts.expiresAtIso,
    privacyClass: 'PARTNER_SHARED',
  };
  return createSignedEnvelope(unsigned, identity.privateKey);
}

/** Mint a fresh Ed25519 identity for signing proof-drop envelopes (tests/canary). */
export function mintProofDropIdentity(issuerId: string, keyId: string): { issuerId: string; keyId: string; privateKey: KeyObject; publicKey: KeyObject } {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  return { issuerId, keyId, privateKey, publicKey };
}
