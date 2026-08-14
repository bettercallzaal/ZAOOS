/**
 * heart-run.ts - resolve the agent_runs ROW that a Heart lease fences on.
 *
 * THE BUG THIS EXISTS FOR. Both lease wrappers in scheduler.ts passed
 * `deterministicResourceId(...)` straight into `executeWithLease` as its runId:
 *
 *     const resourceId = deterministicResourceId('zoe.work-loop', 'singleton');
 *     await executeWithLease(heart(), { runId: resourceId, ... }, run);
 *
 * That value is an IDEMPOTENCY KEY (`heart:resource:<sha256>`), which is what its
 * own docstring says it is - "used as agent_runs idempotency_key". But the store
 * resolves a lease by PRIMARY KEY: `SupabaseLeaseStore.getRun` does
 * `.eq('id', runId)`, and `agent_runs.id` is a UUID (scripts/1410). So the lookup
 * can never match - on a uuid column it does not even miss, it errors - `acquire`
 * returns "Run not found", and `executeWithLease` returns `{ ran: false }`.
 *
 * The effect is the exact inversion of what the flags advertise. Turning on
 * ZOE_LOOP_LEASES does not make the work-loop and orchestrator tick safe across
 * machines; it stops them running at all. Turning on ZOE_REPO_IMPROVER_LEASES
 * does the same to the repo-improver scout - and flipping that flag is written
 * up as the single highest-leverage next milestone (doc 2175).
 *
 * Nothing created a row for those resources either. The only code that ever did
 * find-or-create was the canary's private `ensureCanaryRun`, and it passed the
 * created row's real UUID. This module is that step, generalised, so a lease
 * wrapper cannot forget it again.
 *
 * AND THE SECOND WEDGE. `executeWithLease` releases to status 'completed' (or
 * 'failed' when the work throws), while `canAcquire` accepts only 'ready' or an
 * EXPIRED 'leased'/'running'. So even with the right id, a resource row would
 * work exactly once and then refuse every later tick forever. The canary resets
 * itself to 'ready' after each beat; the scheduler wrappers had no such step.
 * `resetRunReady` is it, and it clears 'failed' too - a tick that throws must not
 * wedge the loop permanently, the same lesson `withTickLock`'s `finally` encodes.
 */
import { randomUUID } from 'node:crypto';
import { deterministicResourceId } from '../../../packages/heart-fleet/src/index';
import { featureRan } from './feature-ran';

/** One row shape this module reads back - only the primary key is needed. */
interface RunIdRow {
  id: string;
}
interface QueryResult<T> {
  data: T | null;
  error?: { message: string } | null;
}

/**
 * Structural type for the injected Supabase client - kept local, and narrowed to
 * exactly the three chains used below, so this module is testable without a
 * database and without importing the bot's client.
 */
export interface RunTableClient {
  from(table: string): {
    select(columns: string): {
      eq(field: string, value: unknown): { maybeSingle(): Promise<QueryResult<RunIdRow>> };
    };
    insert(values: Record<string, unknown>): {
      select(columns: string): { single(): Promise<QueryResult<RunIdRow>> };
    };
    update(values: Record<string, unknown>): {
      eq(field: string, value: unknown): {
        in(field: string, values: readonly string[]): Promise<QueryResult<unknown>>;
      };
    };
  };
}

/** Statuses a resource row may be parked in between ticks. */
const TERMINAL_STATUSES = ['completed', 'failed'] as const;

/**
 * Find-or-create the singleton agent_runs row for a lease resource, and return
 * its PRIMARY KEY - the value `executeWithLease` actually needs.
 *
 * Returns null when the row can neither be read nor created; the caller decides
 * what that means. It must never throw: a lease bookkeeping problem must not be
 * the thing that takes down a scheduler tick.
 */
export async function ensureLeaseRun(
  client: RunTableClient,
  kind: string,
  key: string,
  objective: string,
): Promise<string | null> {
  const idempotencyKey = deterministicResourceId(kind, key);
  try {
    const { data: existing } = await client
      .from('agent_runs')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();
    if (existing?.id) {
      featureRan('heart-run', kind);
      return existing.id as string;
    }

    const { data: created, error } = await client
      .from('agent_runs')
      .insert({
        id: randomUUID(),
        // assignment_id is a UUID column with a UNIQUE constraint (scripts/1410).
        // These resource rows have no external assignment, so mint one.
        assignment_id: randomUUID(),
        objective,
        required_capabilities: [],
        status: 'ready',
        retries: 0,
        approval_state: 'auto',
        visibility: 'team',
        idempotency_key: idempotencyKey,
        created_by: `zoe:${kind}`,
      })
      .select('id')
      .single();
    if (!error && created?.id) {
      featureRan('heart-run', kind);
      return created.id as string;
    }

    // A unique violation on idempotency_key means a sibling host created the row
    // between our read and our insert - re-read rather than fail.
    const { data: raced } = await client
      .from('agent_runs')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();
    if (raced?.id) {
      featureRan('heart-run', kind);
      return raced.id as string;
    }

    console.error(
      `[zoe/heart-run] could not ensure lease run for ${kind}:${key}: ${error?.message ?? 'unknown error'}`,
    );
    return null;
  } catch (err) {
    console.error(
      `[zoe/heart-run] could not ensure lease run for ${kind}:${key}: ${(err as Error)?.message ?? String(err)}`,
    );
    return null;
  }
}

/**
 * Park a resource row back at 'ready' so the NEXT tick can acquire it.
 *
 * Conditional on the row still being terminal, so this can never stomp a lease a
 * different host has already taken. Best-effort: a failure here is logged, not
 * thrown, because the tick it follows has already done its work.
 */
export async function resetRunReady(client: RunTableClient, runId: string): Promise<void> {
  try {
    await client
      .from('agent_runs')
      .update({ status: 'ready', updated_at: new Date().toISOString() })
      .eq('id', runId)
      .in('status', TERMINAL_STATUSES);
  } catch (err) {
    console.error(
      `[zoe/heart-run] could not reset run ${runId} to ready: ${(err as Error)?.message ?? String(err)}`,
    );
  }
}
