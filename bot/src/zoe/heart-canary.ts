/**
 * Heart fleet CANARY - first (and only, until proven) consumer of the shared
 * packages/heart-fleet lease layer outside its tests.
 *
 * Flag-gated: ZOE_HEART_FLEET_CANARY=true enables it; default OFF, so merging
 * this changes nothing in prod until Zaal flips the env. Rollback = unset.
 *
 * What the canary does per invocation (intended call site: one line in the
 * scheduler/orchestrator tick, added when the flag first goes live):
 *  1. ensures a single dedicated canary resource row exists in agent_runs
 *     (deterministic idempotency key - created once, ever),
 *  2. runs a NO-OP work unit through executeWithLease (acquire -> heartbeat
 *     -> release) against the real table,
 *  3. logs the outcome + cumulative metrics; on the inevitable second
 *     instance, logs the lease-held skip - which is the property we are
 *     canarying.
 * No side effects beyond the one agent_runs row and its lease columns.
 */
import { randomUUID } from 'node:crypto';
import {
  HeartFleet,
  SupabaseLeaseStore,
  executeWithLease,
  deterministicResourceId,
  type SupabaseLikeClient,
} from '../../../packages/heart-fleet/src/index';
import { db } from '../supabase';

const CANARY_KIND = 'zoe.heart.canary';
const CANARY_KEY = 'singleton';

export function heartCanaryEnabled(): boolean {
  return process.env.ZOE_HEART_FLEET_CANARY === 'true';
}

let _heart: HeartFleet | null = null;
function heart(): HeartFleet {
  if (_heart) return _heart;
  _heart = new HeartFleet({
    store: new SupabaseLeaseStore(db() as unknown as SupabaseLikeClient),
    onReceipt: (r) => {
      console.log(`[zoe/heart-canary] receipt ${r.event} run=${r.runId.slice(0, 8)} owner=${r.owner}`);
    },
  });
  return _heart;
}

/** Find-or-create the one canary run row. Returns its id. */
async function ensureCanaryRun(): Promise<string | null> {
  const idempotencyKey = deterministicResourceId(CANARY_KIND, CANARY_KEY);
  const client = db();
  const { data: existing } = await client
    .from('agent_runs')
    .select('id')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();
  if (existing?.id) return existing.id as string;

  const { data: created, error } = await client
    .from('agent_runs')
    .insert({
      id: randomUUID(),
      assignment_id: `heart-canary:${CANARY_KEY}`,
      objective: 'Heart fleet canary: lease-guarded no-op proving the shared lease layer on the live table',
      required_capabilities: [],
      status: 'ready',
      retries: 0,
      approval_state: 'auto',
      visibility: 'internal',
      idempotency_key: idempotencyKey,
      created_by: 'zoe:heart-canary',
    })
    .select('id')
    .single();
  if (error) {
    // Unique-violation on idempotency_key = a sibling created it between our
    // read and insert - re-read instead of failing.
    const { data: raced } = await client
      .from('agent_runs')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();
    if (raced?.id) return raced.id as string;
    console.error('[zoe/heart-canary] could not ensure canary run:', error.message);
    return null;
  }
  return created.id as string;
}

/**
 * One canary beat. Safe to call every tick; no-ops when the flag is off.
 * Returns what happened for the caller's log line.
 */
export async function runHeartFleetCanary(owner?: string): Promise<
  { skipped: 'disabled' | 'no-run' } | { ran: boolean; reason?: string; metrics: Record<string, number> }
> {
  if (!heartCanaryEnabled()) return { skipped: 'disabled' };

  const runId = await ensureCanaryRun();
  if (!runId) return { skipped: 'no-run' };

  const h = heart();
  const instance = owner ?? `zoe:${process.env.HOSTNAME ?? 'host'}:${process.pid}`;
  const outcome = await executeWithLease(h, { runId, owner: instance, ttlSeconds: 60 }, async () => {
    // Deliberate no-op: the canary proves the lease path, not work.
    return 'ok';
  });

  // Leave the row re-usable for the next beat.
  if (outcome.ran) {
    await db()
      .from('agent_runs')
      .update({ status: 'ready', updated_at: new Date().toISOString() })
      .eq('id', runId)
      .eq('status', 'completed');
  }

  const m = h.metrics;
  const summary = {
    ran: outcome.ran,
    ...(outcome.ran ? {} : { reason: outcome.reason }),
    metrics: {
      acquireWins: m.acquireWins,
      acquireCollisions: m.acquireCollisions,
      renews: m.renews,
      releases: m.releases,
      fenceRejections: m.fenceRejections,
    },
  };
  console.log(`[zoe/heart-canary] beat: ${JSON.stringify(summary)}`);
  return summary;
}
