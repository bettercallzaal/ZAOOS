/**
 * DreamNet Spore federation, Phase 3 - Cross-Runtime Verification.
 *
 * Maps between ZAO's receipt shape (`dreamnet.receipt.v1`, ./receipt.ts) and
 * the DreamNet SDK's `receipt.v1` / `proof-artifact.v1` contracts
 * (dreamnet-spore-sdk `src/contracts/index.ts`, pinned commit 4072102), and
 * verifies each side's artifacts using ONLY the deterministic protocol - the
 * shared canonical serialization + sha256. No shared runtime, no shared DB,
 * no shared secrets ("trust only protocol, never runtime").
 *
 * Digest contract (v0, honest scope): the SDK at the pinned commit defines the
 * `receipt.v1` SHAPE but no reference digest formula. The interop digest is
 * therefore defined HERE and proven recomputable by the DreamNet runtime using
 * its own primitives (`canonicalJsonStringify` + sha256) - see the pinned
 * values in `__tests__/fixtures/cross-runtime-vectors.json`:
 *  - `receipt.v1` digest      = sha256hex(canonical({ issuer, subjectHash }))
 *  - ZAO receipt digest input = { contentHash, issuer, kind, subjectKey }
 *    (./receipt.ts computeReceiptDigest - already recomputed byte-identically
 *    by the SDK, fixture `zaoDirection.digestInputHashByDreamnet`).
 *
 * Every verifier here FAILS CLOSED: unknown schema, missing field, or any
 * recompute mismatch -> rejected.
 */

import { canonicalize, sha256Hex } from '@/lib/eyes';
import { SPORE_HASH_ALG } from './types';
import type { PortableReceipt } from './receipt';

/** DreamNet SDK `receipt.v1` (contracts/index.ts:87-95 at pinned 4072102). */
export interface DreamNetReceipt {
  readonly schemaVersion: 'receipt.v1';
  readonly receiptId: string;
  readonly issuerId: string;
  /** Bare sha256 hex over the canonical subject (SDK `computeCanonicalHash`). */
  readonly subjectHash: string;
  readonly proofArtifactId?: string;
  readonly timestamp: string;
  /** Bare sha256 hex - interop digest, see module doc. */
  readonly digest: string;
}

/** DreamNet SDK `proof-artifact.v1` (contracts/index.ts:73-82). */
export interface DreamNetProofArtifact {
  readonly schemaVersion: 'proof-artifact.v1';
  readonly artifactId: string;
  readonly creatorId: string;
  readonly artifactType: string;
  readonly evidenceData: Record<string, unknown>;
  /** Bare sha256 hex over the canonical evidenceData. */
  readonly contentHash: string;
  readonly signature?: string;
  readonly createdIso: string;
}

/** Mirror of the SDK's `VerificationCheck` so results are portable back. */
export interface InteropCheck {
  type: 'CONTENT_INTEGRITY' | 'SIGNATURE' | 'IDENTITY' | 'AUTHORIZATION' | 'FRESHNESS';
  status: 'VALID' | 'INVALID' | 'NOT_CHECKED';
  reason: string;
}

export interface InteropVerification {
  isValid: boolean;
  subjectHash: string;
  checks: InteropCheck[];
}

/** The `receipt.v1` interop digest: sha256 over canonical({issuer, subjectHash}). */
export function computeDreamNetReceiptDigest(issuerId: string, subjectHash: string): string {
  return sha256Hex(canonicalize({ issuer: issuerId, subjectHash }));
}

/** Strip ZAO's `<alg>:<hex>` stamp down to the bare hex DreamNet carries. */
export function bareHash(stamped: string): string {
  return stamped.startsWith(`${SPORE_HASH_ALG}:`) ? stamped.slice(SPORE_HASH_ALG.length + 1) : stamped;
}

/**
 * Re-express a ZAO PortableReceipt as a DreamNet SDK `receipt.v1`.
 * subjectHash carries the spore's content hash (bare hex); the interop digest
 * is recomputed so a DreamNet node can verify with its own primitives alone.
 */
export function toDreamNetReceipt(receipt: PortableReceipt): DreamNetReceipt {
  const subjectHash = bareHash(receipt.spore.contentHash);
  return {
    schemaVersion: 'receipt.v1',
    receiptId: receipt.receiptId,
    issuerId: receipt.issuer,
    subjectHash,
    timestamp: receipt.issuedAt,
    digest: computeDreamNetReceiptDigest(receipt.issuer, subjectHash),
  };
}

/**
 * Verify a DreamNet-issued `receipt.v1` with ZAO's runtime. Fails closed on
 * unsupported schema. If the subject content is supplied, the subjectHash is
 * recomputed from it (content integrity); otherwise only the digest binding
 * (issuer <-> subjectHash) is checked and content is marked NOT_CHECKED.
 */
export function verifyDreamNetReceipt(
  receipt: DreamNetReceipt,
  subject?: unknown,
): InteropVerification {
  const checks: InteropCheck[] = [];

  if (receipt.schemaVersion !== 'receipt.v1') {
    return {
      isValid: false,
      subjectHash: receipt.subjectHash ?? '',
      checks: [
        {
          type: 'CONTENT_INTEGRITY',
          status: 'INVALID',
          reason: `Unsupported schema version: ${String((receipt as { schemaVersion?: unknown }).schemaVersion)} (fail closed)`,
        },
      ],
    };
  }
  if (!receipt.receiptId || !receipt.issuerId || !receipt.subjectHash || !receipt.digest) {
    return {
      isValid: false,
      subjectHash: receipt.subjectHash ?? '',
      checks: [
        { type: 'CONTENT_INTEGRITY', status: 'INVALID', reason: 'Missing required receipt field (fail closed)' },
      ],
    };
  }

  const expectedDigest = computeDreamNetReceiptDigest(receipt.issuerId, receipt.subjectHash);
  const digestOk = receipt.digest === expectedDigest;
  checks.push({
    type: 'IDENTITY',
    status: digestOk ? 'VALID' : 'INVALID',
    reason: digestOk
      ? 'Digest binds issuer to subjectHash (recomputed with ZAO primitives)'
      : 'Digest mismatch - issuer/subjectHash binding broken',
  });

  let contentOk = true;
  if (subject !== undefined) {
    const recomputed = sha256Hex(canonicalize(subject));
    contentOk = recomputed === receipt.subjectHash;
    checks.push({
      type: 'CONTENT_INTEGRITY',
      status: contentOk ? 'VALID' : 'INVALID',
      reason: contentOk
        ? 'Subject content recomputes to subjectHash byte-identically'
        : 'Subject content does NOT match subjectHash (tamper)',
    });
  } else {
    checks.push({
      type: 'CONTENT_INTEGRITY',
      status: 'NOT_CHECKED',
      reason: 'Subject content not supplied',
    });
  }

  return { isValid: digestOk && contentOk, subjectHash: receipt.subjectHash, checks };
}

/**
 * Verify a DreamNet-issued `proof-artifact.v1` with ZAO's runtime: recompute
 * the canonical content hash of `evidenceData` and compare. Fails closed on
 * unsupported schema.
 */
export function verifyDreamNetArtifact(artifact: DreamNetProofArtifact): InteropVerification {
  if (artifact.schemaVersion !== 'proof-artifact.v1') {
    return {
      isValid: false,
      subjectHash: artifact.contentHash ?? '',
      checks: [
        {
          type: 'CONTENT_INTEGRITY',
          status: 'INVALID',
          reason: `Unsupported schema version: ${String((artifact as { schemaVersion?: unknown }).schemaVersion)} (fail closed)`,
        },
      ],
    };
  }
  const recomputed = sha256Hex(canonicalize(artifact.evidenceData));
  const ok = recomputed === artifact.contentHash;
  return {
    isValid: ok,
    subjectHash: artifact.contentHash,
    checks: [
      {
        type: 'CONTENT_INTEGRITY',
        status: ok ? 'VALID' : 'INVALID',
        reason: ok
          ? 'evidenceData recomputes to contentHash byte-identically (ZAO primitives)'
          : 'evidenceData does NOT match contentHash (tamper)',
      },
      {
        type: 'SIGNATURE',
        status: artifact.signature ? 'VALID' : 'NOT_CHECKED',
        reason: artifact.signature ? 'Signature present (attestation scope: presence only)' : 'Unsigned artifact',
      },
    ],
  };
}
