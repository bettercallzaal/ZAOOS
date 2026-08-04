/**
 * DurableEffectLedger - the production EffectLedger backed by effect_intents
 * (migration scripts/2148-transactional-outbox.sql, design doc 2145).
 *
 * Where MemoryEffectLedger (execute.ts) gives at-most-once WITHIN a process
 * lifetime, this gives it across process crashes and across the fleet: the
 * `(run_id, effect_key)` primary key is the atomic lock, so a retry that
 * recomputes the same deterministic effect_key collides and dedupes.
 *
 * The Supabase client is INJECTED (structural type, no dependency) - same
 * pattern as SupabaseLeaseStore - so the package stays dependency-free and both
 * the Next app and the isolated bot build can use it.
 *
 * Protocol (doc 2145): claimIntent -> markDispatched -> [send] -> markCommitted.
 * A crash leaves a reconcilable row; findStaleDispatched + resolve close it. It
 * also implements EffectLedger.recordOnce so guardIrreversible works unchanged.
 */
import type { EffectLedger } from './execute';

export type EffectChannel = 'telegram' | 'farcaster' | 'mail' | 'onchain' | 'internal';

export interface IntentRow {
  run_id: string;
  effect_key: string;
  state: 'intent' | 'dispatched' | 'committed' | 'abandoned';
  channel: EffectChannel;
  payload_digest: string;
  fence_owner: string | null;
  fence_expires_at: string | null;
  external_ref: Record<string, unknown> | null;
  attempts: number;
  last_error: string | null;
  created_at: string;
  committed_at: string | null;
}

/** Minimal structural Supabase client - avoids a package dependency. */
export interface OutboxClient {
  from(table: string): OutboxQuery;
}
interface OutboxQuery {
  insert(values: Record<string, unknown>): OutboxQuery;
  update(values: Record<string, unknown>): OutboxQuery;
  select(columns?: string): OutboxQuery;
  eq(field: string, value: unknown): OutboxQuery;
  in(field: string, values: unknown[]): OutboxQuery;
  lt(field: string, value: string): OutboxQuery;
  limit(n: number): OutboxQuery;
  maybeSingle(): Promise<{ data: unknown; error: { code?: string; message: string } | null }>;
  then?: unknown;
}

const UNIQUE_VIOLATION = '23505';

export interface DurableEffectLedgerOpts {
  client: OutboxClient;
  intentsTable?: string;
  logTable?: string;
  now?: () => Date;
}

export class DurableEffectLedger implements EffectLedger {
  private readonly client: OutboxClient;
  private readonly intents: string;
  private readonly log: string;
  private readonly nowFn: () => Date;

  constructor(opts: DurableEffectLedgerOpts) {
    this.client = opts.client;
    this.intents = opts.intentsTable ?? 'effect_intents';
    this.log = opts.logTable ?? 'outbox_dispatch_log';
    this.nowFn = opts.now ?? (() => new Date());
  }

  /** Best-effort append to the dispatch log. Never throws. */
  private async logAttempt(runId: string, effectKey: string, attempt: number, outcome: string, detail?: Record<string, unknown>): Promise<void> {
    try {
      await this.client
        .from(this.log)
        .insert({ run_id: runId, effect_key: effectKey, attempt, outcome, at: this.nowFn().toISOString(), detail: detail ?? null })
        .select('id')
        .maybeSingle();
    } catch {
      // audit log failure must never break the effect path
    }
  }

  /**
   * Atomic claim: INSERT the intent, return true iff THIS call created it.
   * A PK conflict (23505) means another attempt already owns this effect -> false.
   */
  async claimIntent(input: { runId: string; effectKey: string; channel: EffectChannel; payloadDigest: string }): Promise<boolean> {
    const { data, error } = await this.client
      .from(this.intents)
      .insert({
        run_id: input.runId,
        effect_key: input.effectKey,
        state: 'intent',
        channel: input.channel,
        payload_digest: input.payloadDigest,
        attempts: 0,
        created_at: this.nowFn().toISOString(),
      })
      .select('run_id')
      .maybeSingle();

    if (error) {
      if (error.code === UNIQUE_VIOLATION) {
        await this.logAttempt(input.runId, input.effectKey, 0, 'deduped');
        return false; // already claimed - dedupe
      }
      throw new Error(`claimIntent failed: ${error.message}`);
    }
    await this.logAttempt(input.runId, input.effectKey, 0, 'claimed', { channel: input.channel });
    return Boolean(data);
  }

  /** EffectLedger contract: minimal claim so guardIrreversible works unchanged. */
  async recordOnce(runId: string, effectKey: string): Promise<boolean> {
    return this.claimIntent({ runId, effectKey, channel: 'internal', payloadDigest: '' });
  }

  /**
   * Take ownership of the dispatch: intent -> dispatched, fenced. Conditional on
   * state='intent' so only one worker can advance it. Returns true on success.
   */
  async markDispatched(input: { runId: string; effectKey: string; fenceOwner: string; fenceExpiresAt: string }): Promise<boolean> {
    const { data, error } = await this.client
      .from(this.intents)
      .update({ state: 'dispatched', fence_owner: input.fenceOwner, fence_expires_at: input.fenceExpiresAt })
      .eq('run_id', input.runId)
      .eq('effect_key', input.effectKey)
      .eq('state', 'intent')
      .select('run_id')
      .maybeSingle();
    if (error) throw new Error(`markDispatched failed: ${error.message}`);
    return Boolean(data);
  }

  /**
   * Record the committed evidence in the SAME statement that flips to committed
   * (dispatched -> committed). external_ref carries the message_id / hash / tx.
   */
  async markCommitted(input: { runId: string; effectKey: string; externalRef: Record<string, unknown> }): Promise<boolean> {
    const { data, error } = await this.client
      .from(this.intents)
      .update({ state: 'committed', external_ref: input.externalRef, committed_at: this.nowFn().toISOString() })
      .eq('run_id', input.runId)
      .eq('effect_key', input.effectKey)
      .eq('state', 'dispatched')
      .select('run_id')
      .maybeSingle();
    if (error) throw new Error(`markCommitted failed: ${error.message}`);
    if (data) await this.logAttempt(input.runId, input.effectKey, 1, 'sent', input.externalRef);
    return Boolean(data);
  }

  /** Reconciler feed: dispatched rows whose fence has expired (the crash window). */
  async findStaleDispatched(nowIso: string, limit = 50): Promise<IntentRow[]> {
    const res = await (this.client
      .from(this.intents)
      .select('*')
      .eq('state', 'dispatched')
      .lt('fence_expires_at', nowIso)
      .limit(limit) as unknown as Promise<{ data: IntentRow[] | null; error: { message: string } | null }>);
    if (res.error) throw new Error(`findStaleDispatched failed: ${res.error.message}`);
    return res.data ?? [];
  }

  /** Reconciler outcome: a provably-not-sent effect goes back to intent for one bounded retry. */
  async reopen(runId: string, effectKey: string, lastError: string): Promise<void> {
    await this.client
      .from(this.intents)
      .update({ state: 'intent', fence_owner: null, fence_expires_at: null, last_error: lastError.slice(0, 500) })
      .eq('run_id', runId)
      .eq('effect_key', effectKey)
      .eq('state', 'dispatched')
      .select('run_id')
      .maybeSingle();
    await this.logAttempt(runId, effectKey, 0, 'reconciled', { reopened: true });
  }

  /**
   * Reconciler bookkeeping: record ONE unresolved reconcile pass on a stale
   * dispatched row. `attempts` is inserted as 0 by claimIntent and no other path
   * writes it, so without this the reconciler's abandon ceiling can never be
   * reached and an unverifiable row is revisited forever instead of reaching a
   * terminal state. Conditional on state='dispatched' so a row that got resolved
   * concurrently is not touched. Returns the recorded count.
   */
  async noteUnresolved(runId: string, effectKey: string, currentAttempts: number): Promise<number> {
    const next = (Number.isFinite(currentAttempts) ? currentAttempts : 0) + 1;
    const { error } = await this.client
      .from(this.intents)
      .update({ attempts: next })
      .eq('run_id', runId)
      .eq('effect_key', effectKey)
      .eq('state', 'dispatched')
      .select('run_id')
      .maybeSingle();
    if (error) throw new Error(`noteUnresolved failed: ${error.message}`);
    return next;
  }

  /** Reconciler outcome: give up past the attempt ceiling (terminal). */
  async abandon(runId: string, effectKey: string, reason: string): Promise<void> {
    await this.client
      .from(this.intents)
      .update({ state: 'abandoned', last_error: reason.slice(0, 500) })
      .eq('run_id', runId)
      .eq('effect_key', effectKey)
      .in('state', ['intent', 'dispatched'])
      .select('run_id')
      .maybeSingle();
    await this.logAttempt(runId, effectKey, 0, 'abandoned', { reason: reason.slice(0, 120) });
  }
}
