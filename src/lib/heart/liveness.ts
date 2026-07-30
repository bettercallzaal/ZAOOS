/**
 * Heart V2: Instance Liveness
 *
 * The recovery suite (doc 2027) proved the Heart recovers REACTIVELY - it waits
 * for each run's lease_expires_at to pass, then reclaims. That is correct but
 * slow: a crashed worker's runs stay stuck until their individual TTLs expire.
 *
 * This layer adds PROACTIVE recovery. Each worker registers an agent_instances
 * row and heartbeats. When an instance's heartbeat goes stale (older than the
 * liveness TTL), it is declared dead and ALL of its leased/running runs are
 * reclaimed at once - no waiting for per-run TTLs. This is Brandon's prescribed
 * next milestone after the recovery suite (project_brandon_organism_directives).
 *
 * Pure helpers (isInstanceExpired / deadInstanceIds / runsLeasedToDeadInstances)
 * are fully unit-tested. DB functions mirror lease-manager's conditional-update
 * discipline so a heartbeat that arrives mid-reclaim cannot lose a live run.
 */

import type {
  RunStatus,
  AgentRunRow,
  AgentInstanceRow,
  InstanceStatus,
  DeadInstanceReclaimSummary,
} from './types';
import {
  LivenessReclaimer,
  type LivenessStore,
  type AgentInstanceRow as PkgInstanceRow,
} from '../../../packages/heart-fleet/src/index';

// Lazy admin client, same pattern as lease-manager (tests never touch the DB).
let _getSupabaseAdmin: (() => any) | null = null;
try {
  _getSupabaseAdmin = require('@/lib/db/supabase').getSupabaseAdmin;
} catch {
  // Test context; DB functions are not called.
}
function getSupabaseAdmin() {
  if (!_getSupabaseAdmin) {
    throw new Error('Supabase admin client not initialized. Test-context only.');
  }
  return _getSupabaseAdmin();
}

/**
 * SupabaseLivenessStore - adapts getSupabaseAdmin() to the shared package's
 * LivenessStore, so reclaimDeadInstanceRuns delegates to the ONE ported
 * LivenessReclaimer (doc 2149). The query shapes are identical to what this
 * module did by hand; injectable for tests.
 */
class SupabaseLivenessStore implements LivenessStore {
  now(): Date {
    return new Date();
  }
  async liveInstances(): Promise<PkgInstanceRow[]> {
    const { data, error } = await getSupabaseAdmin().from('agent_instances').select('*').neq('status', 'dead');
    if (error) throw new Error(error.message);
    return (data ?? []) as PkgInstanceRow[];
  }
  async markInstancesDead(ids: string[]): Promise<void> {
    await getSupabaseAdmin().from('agent_instances').update({ status: 'dead' as InstanceStatus }).in('instance_id', ids);
  }
  async runsOwnedBy(ownerIds: string[], limit: number): Promise<AgentRunRow[]> {
    const { data, error } = await getSupabaseAdmin()
      .from('agent_runs')
      .select('*')
      .in('status', ['leased', 'running'] as RunStatus[])
      .in('lease_owner', ownerIds)
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []) as AgentRunRow[];
  }
  async reclaimRun(runId: string, expectedOwner: string, retries: number): Promise<boolean> {
    const { data, error } = await getSupabaseAdmin()
      .from('agent_runs')
      .update({
        status: 'ready' as RunStatus,
        lease_owner: null,
        lease_expires_at: null,
        retries,
        updated_at: new Date().toISOString(),
      })
      .eq('id', runId)
      .eq('lease_owner', expectedOwner) // still owned by the dead instance
      .select('id')
      .single();
    if (error || !data) return false;
    return true;
  }
}

/** Default liveness TTL: an instance silent this long is presumed dead. */
export const DEFAULT_LIVENESS_TTL_MS = 90_000; // 90s (3 missed 30s heartbeats)

function toMs(value: Date | string): number {
  return (value instanceof Date ? value : new Date(value)).getTime();
}

// ---------------------------------------------------------------------------
// Pure helpers (no I/O) - the testable core.
// ---------------------------------------------------------------------------

/**
 * True if an instance's last heartbeat is older than the TTL as of `now`.
 * A 'dead' instance is always expired; a 'draining' instance is treated as
 * live for its runs until it goes fully stale (graceful shutdown window).
 */
export function isInstanceExpired(
  instance: Pick<AgentInstanceRow, 'last_heartbeat' | 'status'>,
  now: Date | string,
  ttlMs: number = DEFAULT_LIVENESS_TTL_MS,
): boolean {
  if (instance.status === 'dead') return true;
  return toMs(now) - toMs(instance.last_heartbeat) > ttlMs;
}

/** Ids of every instance considered dead as of `now`. */
export function deadInstanceIds(
  instances: AgentInstanceRow[],
  now: Date | string,
  ttlMs: number = DEFAULT_LIVENESS_TTL_MS,
): string[] {
  return instances
    .filter((i) => isInstanceExpired(i, now, ttlMs))
    .map((i) => i.instance_id);
}

const RECLAIMABLE_STATUSES: readonly RunStatus[] = ['leased', 'running'];

/**
 * Runs that should be reclaimed because their lease_owner is a dead instance.
 * Only leased/running runs with a non-null owner in the dead set qualify.
 */
export function runsLeasedToDeadInstances(
  runs: AgentRunRow[],
  deadIds: string[],
): AgentRunRow[] {
  const dead = new Set(deadIds);
  return runs.filter(
    (r) =>
      r.lease_owner !== null &&
      dead.has(r.lease_owner) &&
      RECLAIMABLE_STATUSES.includes(r.status),
  );
}

// ---------------------------------------------------------------------------
// DB functions (I/O) - mirror lease-manager's conditional-update discipline.
// ---------------------------------------------------------------------------

/** Register (or refresh) this worker's instance row. Idempotent by instance_id. */
export async function registerInstance(input: {
  instanceId: string;
  hostname?: string | null;
  pid?: number | null;
  metadata?: Record<string, unknown> | null;
}): Promise<AgentInstanceRow | null> {
  const db = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data, error } = await db
    .from('agent_instances')
    .upsert(
      {
        instance_id: input.instanceId,
        hostname: input.hostname ?? null,
        pid: input.pid ?? null,
        status: 'alive' as InstanceStatus,
        started_at: now,
        last_heartbeat: now,
        metadata: input.metadata ?? null,
      },
      { onConflict: 'instance_id' },
    )
    .select('*')
    .single();
  if (error) return null;
  return data as AgentInstanceRow;
}

/** Bump last_heartbeat for a live instance. Returns false if the row is gone. */
export async function heartbeat(instanceId: string): Promise<boolean> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('agent_instances')
    .update({ last_heartbeat: new Date().toISOString(), status: 'alive' as InstanceStatus })
    .eq('instance_id', instanceId)
    .neq('status', 'dead') // a dead instance must re-register, not silently revive
    .select('instance_id');
  if (error) return false;
  return (data?.length ?? 0) > 0;
}

/** Mark an instance draining (graceful shutdown) so no new leases target it. */
export async function drainInstance(instanceId: string): Promise<void> {
  const db = getSupabaseAdmin();
  await db
    .from('agent_instances')
    .update({ status: 'draining' as InstanceStatus })
    .eq('instance_id', instanceId);
}

/**
 * The proactive reclaim: find dead instances (stale heartbeat), mark them dead,
 * and reset every leased/running run they own back to 'ready' (clearing the
 * lease, incrementing retries). Uses a conditional UPDATE keyed on the run still
 * being owned by the dead instance, so a run re-leased by a live worker between
 * the read and the write is NOT clobbered.
 */
export async function reclaimDeadInstanceRuns(options?: {
  ttlMs?: number;
  maxReclaimsPerCycle?: number;
  store?: LivenessStore;
}): Promise<DeadInstanceReclaimSummary> {
  const ttlMs = options?.ttlMs ?? DEFAULT_LIVENESS_TTL_MS;
  const maxReclaims = options?.maxReclaimsPerCycle ?? 200;

  try {
    // Delegate to the shared LivenessReclaimer (packages/heart-fleet) - the ONE
    // dead-instance reclaim implementation. Same query shapes, same
    // conditional-update guard (a run re-leased mid-reclaim is not clobbered).
    const reclaimer = new LivenessReclaimer({ store: options?.store ?? new SupabaseLivenessStore(), ttlMs });
    return await reclaimer.reclaimDeadInstanceRuns({ maxReclaimsPerCycle: maxReclaims });
  } catch (err: unknown) {
    return {
      deadInstanceIds: [],
      reclaimedCount: 0,
      reclaimedIds: [],
      errors: [{ id: 'exception', error: err instanceof Error ? err.message : String(err) }],
    };
  }
}
