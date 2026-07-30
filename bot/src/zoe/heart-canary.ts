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
  DurableEffectLedger,
  executeWithLease,
  sendOnce,
  effectKey,
  deterministicResourceId,
  type SupabaseLikeClient,
  type OutboxClient,
  type FencingToken,
} from '../../../packages/heart-fleet/src/index';
import { db } from '../supabase';

const CANARY_KIND = 'zoe.heart.canary';
const CANARY_KEY = 'singleton';

/** Fixed demo content - a deterministic effect_key, so it sends ONCE ever then
 *  dedupes on every subsequent beat (that IS the at-most-once proof). */
const OUTBOX_DEMO_TEXT = '[outbox-demo] ZOE outbox is live - this message was delivered exactly once via the transactional outbox (doc 2145).';

export function heartCanaryEnabled(): boolean {
  return process.env.ZOE_HEART_FLEET_CANARY === 'true';
}

/** Second flag: also exercise the transactional outbox on each canary beat. */
export function outboxDemoEnabled(): boolean {
  return process.env.ZOE_OUTBOX_DEMO === 'true';
}

/** Send capability + target the outbox demo needs (injected from the scheduler). */
export interface CanaryDeps {
  send?: (chatId: number, text: string) => Promise<{ message_id?: number }>;
  groupId?: number;
}

let _ledger: DurableEffectLedger | null = null;
function ledger(): DurableEffectLedger {
  if (_ledger) return _ledger;
  _ledger = new DurableEffectLedger({ client: db() as unknown as OutboxClient });
  return _ledger;
}

/**
 * Send the fixed demo message through the transactional outbox, exactly once.
 * Runs INSIDE the canary's leased work so it has a live fence. Graceful: if the
 * effect_intents table is not applied yet (scripts/2148), it logs and returns
 * without breaking the canary. Returns the outcome for the beat log.
 */
async function runOutboxDemo(
  h: HeartFleet,
  fence: FencingToken,
  deps: CanaryDeps,
): Promise<string> {
  if (!deps.send || !deps.groupId) return 'no-send-deps';
  try {
    const outcome = await sendOnce(h, ledger(), {
      fence,
      channel: 'telegram',
      effectKey: effectKey('telegram', { chatId: deps.groupId, text: OUTBOX_DEMO_TEXT }),
      payload: { chatId: deps.groupId, text: OUTBOX_DEMO_TEXT },
      send: () => deps.send!(deps.groupId!, OUTBOX_DEMO_TEXT),
      toExternalRef: (r) => ({ message_id: r.message_id ?? null }),
    });
    console.log(`[zoe/heart-canary] outbox demo: ${JSON.stringify(outcome.sent ? { sent: true } : outcome)}`);
    return outcome.sent ? 'sent' : outcome.reason;
  } catch (err) {
    const msg = (err as Error)?.message ?? String(err);
    // The most likely cause is the migration not applied yet - say so clearly.
    console.warn(
      `[zoe/heart-canary] outbox demo skipped: ${msg}` +
        (/relation .*effect_intents.* does not exist|effect_intents/i.test(msg)
          ? ' (apply scripts/2148-transactional-outbox.sql first)'
          : ''),
    );
    return 'error';
  }
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
export async function runHeartFleetCanary(
  owner?: string,
  deps?: CanaryDeps,
): Promise<
  { skipped: 'disabled' | 'no-run' } | { ran: boolean; reason?: string; outbox?: string; metrics: Record<string, number> }
> {
  if (!heartCanaryEnabled()) return { skipped: 'disabled' };

  const runId = await ensureCanaryRun();
  if (!runId) return { skipped: 'no-run' };

  const h = heart();
  const instance = owner ?? `zoe:${process.env.HOSTNAME ?? 'host'}:${process.pid}`;
  let outboxResult: string | undefined;
  const outcome = await executeWithLease(h, { runId, owner: instance, ttlSeconds: 60 }, async (fence) => {
    // The canary proves the lease path; when ZOE_OUTBOX_DEMO is on it ALSO
    // exercises the transactional outbox end-to-end on the real table, using
    // this beat's live fence. Deterministic effect_key -> sends once, dedupes after.
    if (outboxDemoEnabled() && deps) {
      outboxResult = await runOutboxDemo(h, fence(), deps);
    }
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
    ...(outboxResult ? { outbox: outboxResult } : {}),
    metrics: {
      acquireWins: m.acquireWins,
      acquireCollisions: m.acquireCollisions,
      renews: m.renews,
      releases: m.releases,
      fenceRejections: m.fenceRejections,
      effectCommits: m.effectCommits,
      effectDedupes: m.effectDedupes,
    },
  };
  console.log(`[zoe/heart-canary] beat: ${JSON.stringify(summary)}`);
  return summary;
}
