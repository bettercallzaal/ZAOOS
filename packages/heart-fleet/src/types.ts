/**
 * heart-fleet - shared fleet lease layer, types.
 *
 * Extraction of src/lib/heart's lease core into a package reachable from BOTH
 * the Next app and the isolated bot/ build (no @/lib alias there): the package
 * is dependency-free (no zod, no supabase import) - the store is injected via
 * the LeaseStore interface, validation is plain TypeScript.
 *
 * New over the app-side Heart v1: explicit fencing tokens, retry ceilings ->
 * quarantine, execution receipts on every lifecycle transition, contention +
 * recovery metrics, and an explicit irreversible-side-effect guard.
 */

export type RunStatus =
  | 'created'
  | 'ready'
  | 'leased'
  | 'running'
  | 'waiting_approval'
  | 'blocked'
  | 'verifying'
  | 'recovering'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'quarantined';

/** Mirrors the agent_runs row (Supabase) - the store contract's row shape. */
export interface AgentRunRow {
  id: string;
  task_id: string | null;
  assignment_id: string;
  objective: string;
  required_capabilities: string[];
  status: RunStatus;
  assigned_agent: string | null;
  lease_owner: string | null;
  lease_expires_at: string | null;
  retries: number;
  budget: Record<string, unknown> | null;
  approval_state: string;
  visibility: string;
  idempotency_key: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fencing token: proof of CURRENT ownership at a moment in time. The token is
 * the exact (runId, owner, leaseExpiresAt) triple minted at acquire/renew.
 * Any later renew/reclaim/re-acquire changes lease_expires_at, so a stale
 * holder's token no longer matches the row - conditional updates keyed on all
 * three fields atomically reject it.
 */
export interface FencingToken {
  readonly runId: string;
  readonly owner: string;
  readonly leaseExpiresAt: string;
}

export interface AcquireResult {
  acquired: boolean;
  run: AgentRunRow | null;
  /** Present iff acquired. */
  fence?: FencingToken;
  reason?: string;
}

export interface ReclaimSummary {
  reclaimedCount: number;
  reclaimedIds: string[];
  /** Runs pushed to 'quarantined' because they hit the retry ceiling. */
  quarantinedIds: string[];
  errors: Array<{ runId: string; error: string }>;
}

/** Lifecycle events that emit an execution receipt. */
export type HeartEvent =
  | 'acquired'
  | 'renewed'
  | 'released'
  | 'reclaimed'
  | 'quarantined'
  | 'fence_verified'
  | 'fence_rejected'
  | 'effect_committed'
  | 'effect_deduped';

/**
 * Execution receipt: portable evidence of a lease-layer transition. digest is
 * sha256 over the canonical stable fields (event identity, not time) - the
 * same `sha256:dreamnet-sorted-json:v0` family as the Spore layer, so fleet
 * receipts reconcile in the same trust substrate.
 */
export interface HeartReceipt {
  readonly schemaVersion: 'zao.heart.receipt.v1';
  readonly event: HeartEvent;
  readonly runId: string;
  readonly owner: string;
  readonly leaseExpiresAt: string | null;
  /** Effect key for effect_* events; null otherwise. */
  readonly effectKey: string | null;
  readonly at: string;
  readonly digest: string;
}

export type ReceiptSink = (receipt: HeartReceipt) => void;

/** Contention + recovery counters. Incremented synchronously, never throws. */
export interface HeartMetrics {
  acquireAttempts: number;
  acquireWins: number;
  acquireCollisions: number;
  renews: number;
  renewFailures: number;
  releases: number;
  releaseFailures: number;
  reclaims: number;
  quarantines: number;
  fenceVerifications: number;
  fenceRejections: number;
  effectCommits: number;
  effectDedupes: number;
}

export function newMetrics(): HeartMetrics {
  return {
    acquireAttempts: 0,
    acquireWins: 0,
    acquireCollisions: 0,
    renews: 0,
    renewFailures: 0,
    releases: 0,
    releaseFailures: 0,
    reclaims: 0,
    quarantines: 0,
    fenceVerifications: 0,
    fenceRejections: 0,
    effectCommits: 0,
    effectDedupes: 0,
  };
}

/**
 * The store contract: minimal conditional-update semantics the lease layer
 * needs. `conditionalUpdate` MUST be atomic - it applies `updates` only if
 * every eq/in/lt condition holds at apply time, returning the updated row or
 * null on any miss (collision). Both the Supabase adapter and the in-memory
 * store honor this; race safety of the whole layer reduces to this contract.
 */
export interface LeaseStore {
  getRun(runId: string): Promise<AgentRunRow | null>;
  conditionalUpdate(
    runId: string,
    updates: Partial<AgentRunRow>,
    conditions: {
      eq?: Partial<Record<keyof AgentRunRow, unknown>>;
      in?: Partial<Record<keyof AgentRunRow, unknown[]>>;
      lt?: Partial<Record<keyof AgentRunRow, string>>;
    },
  ): Promise<AgentRunRow | null>;
  findExpiredLeases(nowIso: string, limit: number): Promise<AgentRunRow[]>;
  /** Injectable clock - deterministic tests, monotonic prod. */
  now(): Date;
}
