/**
 * DreamNet Receipt Envelope (dreamnet.receipt.v1)
 *
 * Portable, hash-verifiable proof of an agent action, matching Brandon's
 * DreamNet Public Core contract (@dreamnet/public-core, Apache-2.0):
 *   Goal -> Assignment -> Capsule -> Work -> Verification -> Receipt -> Claim
 *
 * This module is PURE (no I/O). It maps ZOE's internal ReceiptInput onto the
 * portable DreamNet envelope so any receipt our Spine writes can be validated
 * OUTSIDE our own database - the first rung of the DreamNet trust ladder
 * (Identity -> Receipt -> Reputation -> Trust). See research doc 2030.
 *
 * Two distinct hashes, two distinct jobs:
 *  - contentSha256: integrity hash over the canonical envelope (INCLUDING
 *    createdAt), excluding the contentSha256 field itself. Tamper-evidence.
 *  - actionDigest: dedup hash over the action IDENTITY (run + capability +
 *    tool + action + evidence), EXCLUDING timing. Two identical actions
 *    produce the same actionDigest -> replay detection (closes the doc-2027
 *    receipt-replay gap at the app level, no migration required).
 */

import { createHash } from 'node:crypto';

export type DreamnetRiskTier = 'low' | 'medium' | 'high' | 'critical';

export interface DreamnetExecutionRecord {
  startedAt: string;
  completedAt: string;
  status: 'succeeded' | 'failed' | 'abstained';
  summary: string;
  toolCalls: number;
  costUsd?: number;
}

export interface DreamnetEvidenceReference {
  id: string;
  kind: 'artifact' | 'command' | 'source' | 'test' | 'approval' | 'observation';
  uri: string;
  sha256?: string;
  mediaType?: string;
  description?: string;
}

/** dreamnet.receipt.v1 - mirrors DreamNet Public Core src/contracts.ts ReceiptEnvelope. */
export interface DreamnetReceiptEnvelope {
  schemaVersion: 'dreamnet.receipt.v1';
  receiptId: string;
  assignmentId: string;
  traceId: string;
  principalId: string;
  workloadId: string;
  capsuleId: string;
  capsuleVersion: string;
  policyVersion: string;
  execution: DreamnetExecutionRecord;
  evidence: DreamnetEvidenceReference[];
  claims?: string[];
  counterevidence?: DreamnetEvidenceReference[];
  redactions?: string[];
  createdAt: string;
  contentSha256: string;
}

/** Context the caller supplies alongside a ReceiptInput to build a full envelope. */
export interface ReceiptEnvelopeContext {
  receiptId: string;
  /** Maps to DreamNet assignmentId - our agent_runs.id (run_id). */
  runId: string;
  /** ISO-8601. When the underlying action started/completed + when the receipt was issued. */
  startedAt: string;
  completedAt: string;
  createdAt: string;
  /** Optional overrides; sensible ZAO defaults applied otherwise. */
  traceId?: string;
  capsuleVersion?: string;
  policyVersion?: string;
  costUsd?: number;
  toolCalls?: number;
}

/** The subset of ReceiptInput this module needs (kept local to avoid a hard import cycle). */
export interface ReceiptEnvelopeSource {
  agentIdentity: string;
  capability: string;
  tool: string;
  action: string;
  resultType: 'success' | 'error' | 'pending_approval' | 'rate_limited';
  approvalClass?: 'auto' | 'user_confirm' | 'external_spend' | 'on_chain';
  evidenceUrl?: string | null;
}

const RESULT_TO_EXEC_STATUS: Record<
  ReceiptEnvelopeSource['resultType'],
  DreamnetExecutionRecord['status']
> = {
  success: 'succeeded',
  error: 'failed',
  pending_approval: 'abstained',
  rate_limited: 'abstained',
};

const APPROVAL_TO_RISK: Record<
  NonNullable<ReceiptEnvelopeSource['approvalClass']>,
  DreamnetRiskTier
> = {
  auto: 'low',
  user_confirm: 'medium',
  external_spend: 'high',
  on_chain: 'critical',
};

/**
 * Deterministic canonical JSON: object keys sorted recursively, arrays in
 * order. Two structurally-equal objects always serialize identically, so a
 * hash over the output is stable regardless of key insertion order.
 */
export function canonicalize(value: unknown): string {
  return JSON.stringify(sortDeep(value));
}

function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = sortDeep((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * Stable dedup digest over the action IDENTITY, excluding all timing. Same
 * (run, agent, capability, tool, action, evidence) -> same digest. Used as the
 * receipts.input_digest fallback so replays are detectable on the existing
 * column with no migration.
 */
export function computeActionDigest(
  source: ReceiptEnvelopeSource,
  runId: string,
): string {
  return sha256Hex(
    canonicalize({
      runId,
      agentIdentity: source.agentIdentity,
      capability: source.capability,
      tool: source.tool,
      action: source.action,
      evidenceUrl: source.evidenceUrl ?? null,
    }),
  );
}

/**
 * Build a portable dreamnet.receipt.v1 envelope + its integrity hash from an
 * internal receipt. contentSha256 is computed over the canonical envelope with
 * the contentSha256 field removed (you cannot hash the field that holds the
 * hash), then written back in.
 */
export function buildReceiptEnvelope(
  source: ReceiptEnvelopeSource,
  ctx: ReceiptEnvelopeContext,
): DreamnetReceiptEnvelope {
  const approvalClass = source.approvalClass ?? 'auto';
  const evidence: DreamnetEvidenceReference[] = source.evidenceUrl
    ? [
        {
          id: `evidence:${ctx.receiptId}:0`,
          kind: 'artifact',
          uri: source.evidenceUrl,
          description: `${source.action} via ${source.tool}`,
        },
      ]
    : [];

  const base: Omit<DreamnetReceiptEnvelope, 'contentSha256'> = {
    schemaVersion: 'dreamnet.receipt.v1',
    receiptId: ctx.receiptId,
    assignmentId: ctx.runId,
    traceId: ctx.traceId ?? ctx.runId,
    principalId: source.agentIdentity,
    workloadId: source.capability,
    // ZOE workers are not yet formal Capsules; identify by capability until
    // a CapsuleManifest registry lands (research doc 2030, next action).
    capsuleId: `capsule:zoe:${source.capability}`,
    capsuleVersion: ctx.capsuleVersion ?? 'zoe.1.0.0',
    policyVersion: ctx.policyVersion ?? `policy:${approvalClass}`,
    execution: {
      startedAt: ctx.startedAt,
      completedAt: ctx.completedAt,
      status: RESULT_TO_EXEC_STATUS[source.resultType],
      summary: `${source.action} (${source.resultType}) via ${source.tool}`,
      toolCalls: ctx.toolCalls ?? 1,
      ...(ctx.costUsd !== undefined ? { costUsd: ctx.costUsd } : {}),
    },
    evidence,
    createdAt: ctx.createdAt,
  };

  const contentSha256 = sha256Hex(canonicalize(base));
  return { ...base, contentSha256 };
}

/** Risk tier implied by a receipt's approval class - for gating/audit. */
export function riskTierForApprovalClass(
  approvalClass: ReceiptEnvelopeSource['approvalClass'],
): DreamnetRiskTier {
  return APPROVAL_TO_RISK[approvalClass ?? 'auto'];
}

/**
 * Verify a received envelope's integrity: recompute contentSha256 over the
 * canonical body (minus the hash field) and compare. Lets a DreamNet node
 * validate a ZAO receipt without trusting our database.
 */
export function verifyEnvelopeIntegrity(envelope: DreamnetReceiptEnvelope): boolean {
  const { contentSha256, ...rest } = envelope;
  return sha256Hex(canonicalize(rest)) === contentSha256;
}
