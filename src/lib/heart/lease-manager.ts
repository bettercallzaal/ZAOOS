/**
 * Heart V1: Lease Manager
 *
 * Race-safe lease operations for agent_runs table.
 * Core of Brandon's Heart: liveness, leases, fencing, recovery.
 *
 * All database mutations use conditional UPDATEs (WHERE status = ...) for atomicity.
 * No read-then-write: collision detection is via returned row count.
 */

import { z } from 'zod';
import type { RunStatus, AgentRunRow, LeaseAcquisitionResult, ExpiredLeaseRecoverySummary } from './types';
import {
  HeartFleet,
  SupabaseLeaseStore,
  type LeaseStore,
  type SupabaseLikeClient,
} from '../../../packages/heart-fleet/src/index';

/**
 * Build a HeartFleet over the shared lease core (packages/heart-fleet). This is
 * the ONE lease implementation; acquireLease + reclaimExpiredLeases delegate to
 * it. `maxRetries: Infinity` preserves this module's historical behavior of
 * re-readying an expired lease forever (the package would otherwise QUARANTINE
 * at a ceiling - that stricter behavior is the deliberate Option-B follow-up,
 * doc 2149, gated behind the canary; NOT changed here). A `store` may be
 * injected for tests; production wraps the Supabase admin client.
 */
function buildFleet(store?: LeaseStore): HeartFleet {
  const leaseStore = store ?? new SupabaseLeaseStore(getSupabaseAdmin() as unknown as SupabaseLikeClient);
  return new HeartFleet({ store: leaseStore, maxRetries: Number.POSITIVE_INFINITY });
}

// Import Supabase admin client for production use.
// Tests use FakeAgentRunsStore and don't call these async functions.
let _getSupabaseAdmin: ((

) => any) | null = null;

try {
  // This import may fail in test contexts, which is fine - the tests don't use it.
  _getSupabaseAdmin = require('@/lib/db/supabase').getSupabaseAdmin;
} catch {
  // Test context; async functions won't be called
}

function getSupabaseAdmin() {
  if (!_getSupabaseAdmin) {
    throw new Error(
      'Supabase admin client not initialized. This should only happen in test contexts.',
    );
  }
  return _getSupabaseAdmin();
}

/**
 * Input validation: acquire lease request
 */
const AcquireLeaseInputSchema = z.object({
  runId: z.string().uuid('runId must be a valid UUID'),
  owner: z.string().min(1, 'owner must not be empty'),
  ttlSeconds: z.number().int().positive('ttlSeconds must be a positive integer'),
});

/**
 * Input validation: renew lease request
 */
const RenewLeaseInputSchema = z.object({
  runId: z.string().uuid('runId must be a valid UUID'),
  owner: z.string().min(1, 'owner must not be empty'),
  ttlSeconds: z.number().int().positive('ttlSeconds must be a positive integer'),
});

/**
 * Input validation: release lease request
 */
const ReleaseLeaseInputSchema = z.object({
  runId: z.string().uuid('runId must be a valid UUID'),
  owner: z.string().min(1, 'owner must not be empty'),
  nextStatus: z.enum([
    'completed',
    'failed',
    'cancelled',
  ] as const),
});

/**
 * Pure helper: Check if a lease has expired (given current time).
 *
 * @param run - The agent run row
 * @param now - Current time (Date or ISO8601 string)
 * @returns True if the lease is expired or missing
 */
export function isLeaseExpired(run: AgentRunRow, now: Date | string): boolean {
  if (!run.lease_expires_at) {
    return true;
  }

  const nowTime = typeof now === 'string' ? new Date(now) : now;
  const expiresTime = new Date(run.lease_expires_at);

  return expiresTime <= nowTime;
}

/**
 * Pure helper: Check if a run can be acquired (ready or expired lease).
 *
 * @param run - The agent run row
 * @param now - Current time (Date or ISO8601 string)
 * @returns True if the run is ready OR has an expired lease
 */
export function canAcquire(run: AgentRunRow, now: Date | string): boolean {
  // Ready status means no lease holder
  if (run.status === 'ready') {
    return true;
  }

  // If leased/running, check if the lease is expired (recovery case)
  if ((run.status === 'leased' || run.status === 'running') && isLeaseExpired(run, now)) {
    return true;
  }

  return false;
}

/**
 * acquireLease: Atomically claim a ready run or an expired lease.
 *
 * Uses a conditional UPDATE to ensure race safety:
 * - Only succeeds if the run is 'ready' OR (status in ('leased','running') AND lease is expired)
 * - Sets lease_owner, lease_expires_at, and status to 'leased'
 *
 * @param input - { runId, owner, ttlSeconds }
 * @returns LeaseAcquisitionResult with acquired flag and the updated run
 */
export async function acquireLease(
  input: unknown,
  opts?: { store?: LeaseStore },
): Promise<LeaseAcquisitionResult> {
  const parsed = AcquireLeaseInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      acquired: false,
      run: null,
      reason: `Invalid input: ${parsed.error.message}`,
    };
  }

  const { runId, owner, ttlSeconds } = parsed.data;

  try {
    // Delegate to the shared lease core. Its acquire does the same
    // fetch-then-conditional-UPDATE (ready OR expired-takeover on exact
    // expiry) this module did by hand - one implementation now.
    const result = await buildFleet(opts?.store).acquire(runId, owner, ttlSeconds);
    return { acquired: result.acquired, run: result.run, reason: result.reason };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      acquired: false,
      run: null,
      reason: `Exception during acquire: ${errorMsg}`,
    };
  }
}

/**
 * renewLease: Extend an existing lease (only if this owner holds it).
 *
 * Uses fencing: only succeeds if lease_owner matches AND status is still leased/running.
 *
 * @param input - { runId, owner, ttlSeconds }
 * @returns Updated run, or null if renewal failed
 */
export async function renewLease(input: unknown): Promise<AgentRunRow | null> {
  const parsed = RenewLeaseInputSchema.safeParse(input);
  if (!parsed.success) {
    return null;
  }

  const { runId, owner, ttlSeconds } = parsed.data;
  const db = getSupabaseAdmin();
  const now = new Date();
  const leaseExpiresAt = new Date(now.getTime() + ttlSeconds * 1000).toISOString();

  try {
    const { data: updated, error } = await db
      .from('agent_runs')
      .update({
        lease_expires_at: leaseExpiresAt,
        updated_at: now.toISOString(),
      })
      .eq('id', runId)
      .eq('lease_owner', owner)
      .in('status', ['leased', 'running'] as RunStatus[])
      .select('*')
      .single();

    if (error) {
      return null;
    }

    return updated as AgentRunRow;
  } catch {
    return null;
  }
}

/**
 * releaseLease: Release the lease and transition to a terminal/safe status.
 *
 * Only succeeds if this owner holds the lease.
 * nextStatus must be one of: completed, failed, cancelled.
 *
 * @param input - { runId, owner, nextStatus }
 * @returns Updated run, or null if release failed
 */
export async function releaseLease(input: unknown): Promise<AgentRunRow | null> {
  const parsed = ReleaseLeaseInputSchema.safeParse(input);
  if (!parsed.success) {
    return null;
  }

  const { runId, owner, nextStatus } = parsed.data;
  const db = getSupabaseAdmin();
  const now = new Date();

  try {
    const { data: updated, error } = await db
      .from('agent_runs')
      .update({
        lease_owner: null,
        lease_expires_at: null,
        status: nextStatus,
        updated_at: now.toISOString(),
      })
      .eq('id', runId)
      .eq('lease_owner', owner)
      .select('*')
      .single();

    if (error) {
      return null;
    }

    return updated as AgentRunRow;
  } catch {
    return null;
  }
}

/**
 * reclaimExpiredLeases: Find and reset all expired leases back to 'ready'.
 *
 * Targets runs where:
 * - status in ('leased', 'running')
 * - lease_expires_at < now
 *
 * Resets them to 'ready' (clearing lease_owner) and increments retries.
 * This is the recovery mechanism: dead agents' work gets picked up by live ones.
 *
 * @param options - { maxReclaimsPerCycle?: number }
 * @returns Summary of reclaimed runs and any errors
 */
export async function reclaimExpiredLeases(
  options?: { maxReclaimsPerCycle?: number; store?: LeaseStore },
): Promise<ExpiredLeaseRecoverySummary> {
  const maxReclaims = options?.maxReclaimsPerCycle ?? 100;

  try {
    // Delegate to the shared lease core. It finds expired leases the same way
    // (status in leased/running, lease_expires_at < now) and resets each with a
    // conditional UPDATE on the exact expiry. maxRetries: Infinity (buildFleet)
    // means it NEVER quarantines - identical to this module's historical
    // re-ready-and-increment behavior. quarantinedIds is therefore always empty
    // and dropped to preserve the exact ExpiredLeaseRecoverySummary shape.
    const summary = await buildFleet(options?.store).reclaimExpired({ limit: maxReclaims });
    return {
      reclaimedCount: summary.reclaimedCount,
      reclaimedIds: summary.reclaimedIds,
      errors: summary.errors,
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      reclaimedCount: 0,
      reclaimedIds: [],
      errors: [{ runId: 'unknown', error: `Exception: ${errorMsg}` }],
    };
  }
}
