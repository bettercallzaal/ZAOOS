/**
 * WaveWarZ event -> DreamNet outcome receipt (option C of research doc
 * agents/2357-brandon-receipts-dadfi-status).
 *
 * Maps one consequential WaveWarZ event (a leaderboard calculation, a battle
 * settlement, a payout) onto the `outcome-receipt.v1` shape from Brandon
 * Ducar's DreamNet federation schemas
 * (bettercallzaal/zorca federation/schemas/outcome-receipt.v1.schema.json).
 * Credit: the receipt contract is Brandon Ducar / DreamNet's.
 *
 * PURE: no I/O, no env, no network. Nothing in the app calls this yet - it is
 * the adapter, not the wiring. A caller supplies the event and the federation
 * context; this returns the receipt body with a deterministic hash.
 *
 * Two things this module is honest about:
 *  - SIGNATURE. The schema requires `observer_signature`. ZAO has no federation
 *    keypair yet (deferred), so without an injected `sign` function the result
 *    is an UNSIGNED draft that is NOT schema-valid, and says so.
 *  - HASH. The schema describes `receipt_hash` as a "Deterministic SHA-256
 *    Merkle hash of all receipt contents" without defining the construction.
 *    This uses ZAO's canonical key-sorted JSON + sha256 (the same primitive as
 *    the Spore receipts, byte-compatible with the DreamNet SDK for those). It
 *    is deterministic; whether it matches DreamNet's intended Merkle
 *    construction is an open question for Brandon.
 */
import { z } from 'zod';
import { canonicalize, sha256Hex } from '@/lib/eyes';

export const OUTCOME_RECEIPT_SCHEMA = 'outcome-receipt.v1' as const;

export const OBSERVATION_METHODS = [
  'INDEPENDENT_PROBE',
  'READBACK_DIFF',
  'EXTERNAL_API_CHECK',
  'INTEGRATION_TEST',
] as const;

export const TERMINAL_STATES = [
  'SUCCESS',
  'PARTIAL_SUCCESS',
  'SAFE_FAILURE',
  'BLOCKED',
  'NEEDS_HUMAN',
  'INVALID_TASK',
  'AUTHORITY_INSUFFICIENT',
] as const;

/** The three events the WaveWarZ audit flagged first (doc 2357). */
export const WAVEWARZ_EVENT_KINDS = ['leaderboard_calc', 'settlement', 'payout'] as const;

const evidenceSchema = z.object({
  artifactUri: z.string().min(1),
  /** SHA-256 digest of the verified artifact. */
  contentHash: z.string().min(1),
  observationMethod: z.enum(OBSERVATION_METHODS),
});

export const wavewarzEventSchema = z.object({
  kind: z.enum(WAVEWARZ_EVENT_KINDS),
  /** Battle id, or a period id for a leaderboard calculation. */
  subjectId: z.string().min(1),
  terminalState: z.enum(TERMINAL_STATES),
  /** ISO 8601 time the outcome was observed. */
  observedAt: z.string().datetime(),
  /** At least one piece of evidence - a receipt with none proves nothing. */
  evidence: z.array(evidenceSchema).min(1),
  sideEffectsVerified: z.array(z.string()).default([]),
  unresolvedClaims: z.array(z.string()).default([]),
});

export const federationContextSchema = z.object({
  missionId: z.string().min(1),
  contractId: z.string().min(1),
  leaseId: z.string().min(1),
  executorDid: z.string().min(1),
  observerDid: z.string().min(1),
});

export type WavewarzEvent = z.input<typeof wavewarzEventSchema>;
export type FederationContext = z.infer<typeof federationContextSchema>;

export interface ObserverSignature {
  observer_office: string;
  signature_digest: string;
}

/** Everything in the receipt except the signature. This is what gets hashed. */
export interface OutcomeReceiptBody {
  schema: typeof OUTCOME_RECEIPT_SCHEMA;
  receipt_id: string;
  mission_id: string;
  contract_id: string;
  lease_id: string;
  executor_did: string;
  observer_did: string;
  observed_terminal_state: (typeof TERMINAL_STATES)[number];
  evidence_manifest: Array<{
    artifact_uri: string;
    content_hash: string;
    observation_method: (typeof OBSERVATION_METHODS)[number];
  }>;
  side_effects_verified: string[];
  unresolved_claims: string[];
  observed_at: string;
}

export interface OutcomeReceipt extends OutcomeReceiptBody {
  receipt_hash: string;
  observer_signature: ObserverSignature;
}

export type BuildResult =
  | { ok: true; signed: true; receipt: OutcomeReceipt }
  | { ok: true; signed: false; draft: OutcomeReceiptBody & { receipt_hash: string } }
  | { ok: false; error: string };

/** Signs a receipt hash. Injected by the caller; this module holds no keys. */
export type ReceiptSigner = (receiptHash: string) => ObserverSignature;

/** `rcpt:outcome:<id>` where <id> matches the schema pattern [a-zA-Z0-9_-]+. */
export function outcomeReceiptId(kind: string, subjectId: string): string {
  const safe = `wavewarz-${kind}-${subjectId}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `rcpt:outcome:${safe}`;
}

/** Deterministic hash over the receipt body (signature and hash excluded). */
export function outcomeReceiptHash(body: OutcomeReceiptBody): string {
  return sha256Hex(canonicalize(body));
}

/**
 * Build an outcome receipt for one WaveWarZ event.
 *
 * Returns `signed: false` with a draft when no signer is supplied. A draft is
 * useful for review and for hashing, and is NOT a valid outcome-receipt.v1.
 */
export function buildWavewarzOutcomeReceipt(
  event: unknown,
  context: unknown,
  sign?: ReceiptSigner,
): BuildResult {
  const parsedEvent = wavewarzEventSchema.safeParse(event);
  if (!parsedEvent.success) {
    return {
      ok: false,
      error: `invalid event: ${parsedEvent.error.issues[0]?.message ?? 'unknown'}`,
    };
  }
  const parsedCtx = federationContextSchema.safeParse(context);
  if (!parsedCtx.success) {
    return {
      ok: false,
      error: `invalid context: ${parsedCtx.error.issues[0]?.message ?? 'unknown'}`,
    };
  }
  const e = parsedEvent.data;
  const c = parsedCtx.data;

  const body: OutcomeReceiptBody = {
    schema: OUTCOME_RECEIPT_SCHEMA,
    receipt_id: outcomeReceiptId(e.kind, e.subjectId),
    mission_id: c.missionId,
    contract_id: c.contractId,
    lease_id: c.leaseId,
    executor_did: c.executorDid,
    observer_did: c.observerDid,
    observed_terminal_state: e.terminalState,
    evidence_manifest: e.evidence.map((ev) => ({
      artifact_uri: ev.artifactUri,
      content_hash: ev.contentHash,
      observation_method: ev.observationMethod,
    })),
    side_effects_verified: e.sideEffectsVerified,
    unresolved_claims: e.unresolvedClaims,
    observed_at: e.observedAt,
  };
  const receipt_hash = outcomeReceiptHash(body);

  if (!sign) return { ok: true, signed: false, draft: { ...body, receipt_hash } };
  return {
    ok: true,
    signed: true,
    receipt: { ...body, receipt_hash, observer_signature: sign(receipt_hash) },
  };
}
