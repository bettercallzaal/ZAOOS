/**
 * Portable Receipts - DreamNet Spore federation, Phase 2 (Portable Receipt Interchange).
 *
 * A `receipt.v1` is the immutable, portable evidence envelope that wraps a ZAO
 * Spore (which wraps an Observation). It is what travels across the federation
 * boundary: another organism can verify it with ONLY the deterministic protocol
 * (canonical hash + digest), no shared runtime.
 *
 * Contracts (from Brandon's v0.2 Phase 2):
 *  - UUID receipt ids (replay-safe: same content, new receipt -> new id)
 *  - deterministic digest (same content + issuer -> same digest, regardless of id/time)
 *  - immutable (frozen at creation)
 *  - complete provenance
 *
 * The digest reuses ZAO's `canonicalize` + `sha256Hex`, which are proven
 * byte-identical to DreamNet's reference (see dreamnet-conformance.test.ts).
 */
import { randomUUID } from 'crypto';
import { canonicalize, sha256Hex } from '@/lib/eyes';
import type { Observation } from '@/lib/eyes';
import { SPORE_HASH_ALG, type Spore } from './types';
import { observationToSpore } from './spore';

export const RECEIPT_SCHEMA = 'dreamnet.receipt.v1' as const;

export type ReceiptVerification = 'unverified' | 'verified' | 'rejected';

export interface PortableReceipt {
  readonly schemaVersion: typeof RECEIPT_SCHEMA;
  /** UUID unique to THIS receipt. Replay-safe: re-issuing the same content mints a new id. */
  readonly receiptId: string;
  /** The subject this receipt attests to (content + portable content hash). */
  readonly spore: Spore;
  /** Who issued the receipt (the ZAO organism/instance id). */
  readonly issuer: string;
  /** When the receipt was issued (ISO). Provenance, NOT part of the digest. */
  readonly issuedAt: string;
  /** How the underlying content was obtained. */
  readonly provenance: { method: string; endpoint?: string; query?: string };
  /** `<alg>:<hex>` - deterministic over content + issuer (id/time excluded). */
  readonly digest: string;
  readonly verificationStatus: ReceiptVerification;
}

/** The stable fields the digest covers - deterministic across id/time/status. */
function digestInput(spore: Spore, issuer: string) {
  return { subjectKey: spore.subjectKey, kind: spore.kind, contentHash: spore.contentHash, issuer };
}

/** Compute the deterministic receipt digest. Same content + issuer -> same digest. */
export function computeReceiptDigest(spore: Spore, issuer: string): string {
  return `${SPORE_HASH_ALG}:${sha256Hex(canonicalize(digestInput(spore, issuer)))}`;
}

/** Build an immutable portable receipt from a ZAO Spore. */
export function sporeToReceipt(
  spore: Spore,
  issuer: string,
  opts?: { now?: string; provenance?: PortableReceipt['provenance'] },
): PortableReceipt {
  const receipt: PortableReceipt = {
    schemaVersion: RECEIPT_SCHEMA,
    receiptId: randomUUID(),
    spore,
    issuer,
    issuedAt: opts?.now ?? new Date().toISOString(),
    provenance: opts?.provenance ?? { method: 'observation' },
    digest: computeReceiptDigest(spore, issuer),
    verificationStatus: 'unverified',
  };
  return Object.freeze(receipt);
}

/** Build a portable receipt straight from a ZAO Observation (every observation -> portable evidence). */
export function observationToReceipt(obs: Observation, issuer: string, opts?: { now?: string }): PortableReceipt {
  return sporeToReceipt(observationToSpore(obs), issuer, {
    now: opts?.now,
    provenance: { method: obs.provenance.method, endpoint: obs.provenance.endpoint, query: obs.provenance.query },
  });
}

/**
 * Verify a receipt with deterministic protocol only (no shared runtime):
 *  - the spore's contentHash actually covers its content
 *  - the receipt digest is correct for (content, issuer)
 * Returns false on any tamper. This is the primitive Phase 3 cross-runtime
 * verification builds on.
 */
export function verifyReceipt(receipt: PortableReceipt): boolean {
  if (receipt.schemaVersion !== RECEIPT_SCHEMA) return false;
  const expectedContentHash = `${SPORE_HASH_ALG}:${sha256Hex(
    canonicalize({ kind: receipt.spore.kind, subjectKey: receipt.spore.subjectKey, payload: receipt.spore.payload }),
  )}`;
  if (receipt.spore.contentHash !== expectedContentHash) return false;
  if (receipt.digest !== computeReceiptDigest(receipt.spore, receipt.issuer)) return false;
  return true;
}
