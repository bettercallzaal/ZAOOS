/**
 * CapabilityLeaseManifestV1 - a bounded, time-limited grant of a single
 * capability to a tenant (spec section 7). A tenant may REQUEST capabilities but
 * never receives broad or permanent authority, and never self-approves.
 *
 * Two invariants are enforced here and are non-negotiable:
 *  - No self-approval: the candidate agent may not approve its own lease.
 *  - No self-certification of competency: the agent that PRODUCED the competency
 *    evidence may not be the sole evaluator of it (spec sections 7 + 13).
 */

import { z } from 'zod';

/** Lease lifecycle states (spec section 7). */
export const LEASE_STATES = [
  'REQUESTED',
  'EVALUATED',
  'APPROVED',
  'ACTIVE',
  'EXPIRED',
  'REVOKED',
  'COMPLETED',
  'QUARANTINED',
] as const;
export type LeaseState = (typeof LEASE_STATES)[number];

/** Allowed forward transitions. Anything not listed fails closed. */
const LEASE_TRANSITIONS: Record<LeaseState, readonly LeaseState[]> = {
  REQUESTED: ['EVALUATED', 'REVOKED'],
  EVALUATED: ['APPROVED', 'REVOKED', 'QUARANTINED'],
  APPROVED: ['ACTIVE', 'REVOKED'],
  ACTIVE: ['EXPIRED', 'REVOKED', 'COMPLETED', 'QUARANTINED'],
  EXPIRED: [],
  REVOKED: [],
  COMPLETED: [],
  QUARANTINED: [],
};

export const CapabilityLeaseManifestV1Schema = z.object({
  schemaVersion: z.literal('capability-lease.v1'),
  leaseId: z.string().min(1),
  tenantId: z.string().min(1),
  organismId: z.string().min(1),
  candidateAgentId: z.string().min(1),
  capability: z.object({
    capabilityId: z.string().min(1),
    capabilityVersion: z.string().min(1),
    description: z.string().min(1),
    allowedActions: z.array(z.string()),
    blockedActions: z.array(z.string()),
  }),
  scope: z.object({
    resources: z.array(z.string()),
    namespaces: z.array(z.string()),
    audiences: z.array(z.string()),
    networkDestinations: z.array(z.string()),
  }),
  constraints: z.object({
    readOnly: z.boolean(),
    maxCalls: z.number().int().nonnegative(),
    maxConcurrency: z.number().int().positive(),
    maxDurationSeconds: z.number().int().positive(),
    maxPayloadBytes: z.number().int().positive(),
    economicLimitUsd: z.number().nonnegative(),
    publicActionAllowed: z.boolean(),
  }),
  approval: z.object({
    approvalClass: z.string().min(1),
    approvedBy: z.string(), // empty until approved
    approvalReceiptRef: z.string(),
  }),
  lifecycle: z.object({
    issuedAt: z.string(),
    activatesAt: z.string(),
    expiresAt: z.string(),
    revokedAt: z.string(),
    status: z.enum(LEASE_STATES),
  }),
  evidence: z.object({
    prerequisiteClaimRefs: z.array(z.string()),
    competencyRefs: z.array(z.string()),
    issuanceReceiptRef: z.string(),
    revocationReceiptRef: z.string(),
    // Who produced the competency evidence, and who evaluated it. Used to enforce
    // the independence invariant (producer may not be the sole evaluator).
    competencyProducerId: z.string(),
    competencyEvaluatorIds: z.array(z.string()),
  }),
});

export type CapabilityLeaseManifestV1 = z.infer<typeof CapabilityLeaseManifestV1Schema>;

export interface LeaseGuardResult {
  readonly ok: boolean;
  readonly reason: string;
}

/** Is a lifecycle transition allowed? Fails closed on any unlisted transition. */
export function canTransition(from: LeaseState, to: LeaseState): boolean {
  return (LEASE_TRANSITIONS[from] ?? []).includes(to);
}

/**
 * Approval guard (spec section 7). A lease may be APPROVED only if:
 *  - the approver is NOT the candidate agent (no self-approval), AND
 *  - the competency evidence was evaluated by at least one party OTHER than its
 *    producer (no self-certification of competency).
 * Fails closed - a missing or self-referential approver is rejected.
 */
export function guardApproval(lease: CapabilityLeaseManifestV1, approverId: string): LeaseGuardResult {
  if (!approverId) return { ok: false, reason: 'approver missing' };
  if (approverId === lease.candidateAgentId) {
    return { ok: false, reason: 'self-approval forbidden: approver is the candidate agent' };
  }
  const evaluators = lease.evidence.competencyEvaluatorIds ?? [];
  const producer = lease.evidence.competencyProducerId;
  const independentEvaluator = evaluators.some((e) => e && e !== producer);
  if (producer && !independentEvaluator) {
    return { ok: false, reason: 'self-certification forbidden: competency producer is the sole evaluator' };
  }
  return { ok: true, reason: 'approval invariants satisfied' };
}

/**
 * Stage 0 constraint ceiling. In the canary, a lease must be read-only, spend
 * nothing, and take no public action (spec sections 8, 9). Enforced independently
 * of what the manifest requests - fail closed on any violation.
 */
export function guardStage0Constraints(lease: CapabilityLeaseManifestV1): LeaseGuardResult {
  const c = lease.constraints;
  if (!c.readOnly) return { ok: false, reason: 'Stage 0 leases must be read-only' };
  if (c.economicLimitUsd !== 0) return { ok: false, reason: 'Stage 0 leases must have a $0 economic limit' };
  if (c.publicActionAllowed) return { ok: false, reason: 'Stage 0 leases must not permit public actions' };
  return { ok: true, reason: 'Stage 0 constraints satisfied' };
}
