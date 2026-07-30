/**
 * LivenessReclaimer - PROACTIVE recovery for the shared fleet core.
 *
 * The lease reclaim (lease.ts) is REACTIVE: it waits for each run's TTL to
 * expire. This adds proactive recovery: workers heartbeat an agent_instances
 * row; when an instance goes stale (heartbeat older than the liveness TTL) it
 * is declared dead and ALL of its leased/running runs are reset at once - no
 * waiting per-run. Port of the app-side `src/lib/heart/liveness.ts` into the
 * package so the whole fleet shares one liveness implementation (doc 2149).
 *
 * The store is INJECTED (structural, no dependency) like every other adapter
 * here. Pure helpers are exported for reuse + unit tests.
 */
import type { AgentRunRow } from './types';

export type InstanceStatus = 'alive' | 'draining' | 'dead';

export interface AgentInstanceRow {
  instance_id: string;
  hostname: string | null;
  pid: number | null;
  status: InstanceStatus;
  started_at: string;
  last_heartbeat: string;
  metadata: Record<string, unknown> | null;
}

export interface DeadInstanceReclaimSummary {
  deadInstanceIds: string[];
  reclaimedCount: number;
  reclaimedIds: string[];
  errors: Array<{ id: string; error: string }>;
}

/** Default liveness TTL: an instance silent this long is presumed dead (3 missed 30s beats). */
export const DEFAULT_LIVENESS_TTL_MS = 90_000;

const RECLAIMABLE: readonly string[] = ['leased', 'running'];

function toMs(v: Date | string): number {
  return (v instanceof Date ? v : new Date(v)).getTime();
}

// --- pure helpers (no I/O) --------------------------------------------------

/** True if an instance's last heartbeat is older than the TTL as of `now`. */
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
  return instances.filter((i) => isInstanceExpired(i, now, ttlMs)).map((i) => i.instance_id);
}

/** Runs that should be reclaimed because their lease_owner is a dead instance. */
export function runsLeasedToDeadInstances(runs: AgentRunRow[], deadIds: string[]): AgentRunRow[] {
  const dead = new Set(deadIds);
  return runs.filter(
    (r) => r.lease_owner !== null && dead.has(r.lease_owner) && RECLAIMABLE.includes(r.status),
  );
}

// --- injected store ---------------------------------------------------------

/** Minimal store the reclaimer needs (agent_instances + agent_runs). */
export interface LivenessStore {
  now(): Date;
  /** All non-dead instances. */
  liveInstances(): Promise<AgentInstanceRow[]>;
  /** Mark the given instance ids dead (best-effort). */
  markInstancesDead(ids: string[]): Promise<void>;
  /** Leased/running runs owned by any of these instances. */
  runsOwnedBy(ownerIds: string[], limit: number): Promise<AgentRunRow[]>;
  /**
   * Reset a run to 'ready' ONLY if still owned by `expectedOwner` (conditional
   * update). Returns true iff it mutated (false = re-leased by a live worker).
   */
  reclaimRun(runId: string, expectedOwner: string, retries: number): Promise<boolean>;
}

export interface LivenessOptions {
  store: LivenessStore;
  ttlMs?: number;
}

export class LivenessReclaimer {
  private readonly store: LivenessStore;
  private readonly ttlMs: number;

  constructor(opts: LivenessOptions) {
    this.store = opts.store;
    this.ttlMs = opts.ttlMs ?? DEFAULT_LIVENESS_TTL_MS;
  }

  /**
   * Find dead instances, mark them dead, and reset every leased/running run
   * they own back to 'ready' (conditional on still-owned, so a run re-leased
   * mid-reclaim is never clobbered).
   */
  async reclaimDeadInstanceRuns(options?: { maxReclaimsPerCycle?: number }): Promise<DeadInstanceReclaimSummary> {
    const maxReclaims = options?.maxReclaimsPerCycle ?? 200;
    const now = this.store.now();
    const summary: DeadInstanceReclaimSummary = { deadInstanceIds: [], reclaimedCount: 0, reclaimedIds: [], errors: [] };

    let instances: AgentInstanceRow[];
    try {
      instances = await this.store.liveInstances();
    } catch (err: unknown) {
      summary.errors.push({ id: 'instances', error: err instanceof Error ? err.message : String(err) });
      return summary;
    }

    const dead = deadInstanceIds(instances, now, this.ttlMs);
    if (dead.length === 0) return summary;
    summary.deadInstanceIds = dead;

    try {
      await this.store.markInstancesDead(dead);
    } catch {
      // best-effort; reclaim proceeds regardless
    }

    let runs: AgentRunRow[];
    try {
      runs = await this.store.runsOwnedBy(dead, maxReclaims);
    } catch (err: unknown) {
      summary.errors.push({ id: 'runs', error: err instanceof Error ? err.message : String(err) });
      return summary;
    }

    for (const run of runs) {
      try {
        const ok = await this.store.reclaimRun(run.id, run.lease_owner as string, (run.retries ?? 0) + 1);
        if (ok) summary.reclaimedIds.push(run.id);
        else summary.errors.push({ id: run.id, error: 'no rows (re-leased)' });
      } catch (err: unknown) {
        summary.errors.push({ id: run.id, error: err instanceof Error ? err.message : String(err) });
      }
    }

    summary.reclaimedCount = summary.reclaimedIds.length;
    return summary;
  }
}
