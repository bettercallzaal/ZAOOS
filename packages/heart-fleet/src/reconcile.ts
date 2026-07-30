/**
 * reconcileOutbox - closes the crash window in the transactional outbox
 * (design doc 2145, the last piece). A row stuck in `dispatched` with an
 * expired fence means: the process claimed the send and MAY have performed it,
 * but crashed before recording the commit. The reconciler resolves each such
 * row, biased HARD toward at-most-once (never resend without proof).
 *
 * Per-channel PROBE decides:
 *   - 'sent' (+ external ref) -> markCommitted. The send did happen; record it.
 *   - 'not-sent'              -> reopen for ONE bounded retry (safe: proven not sent).
 *   - 'unknown'               -> the channel can't tell (e.g. Telegram has no
 *                                "did I send X" query). Do NOT resend - that
 *                                would risk a duplicate, breaking the whole
 *                                at-most-once promise. Past the attempt ceiling,
 *                                ABANDON with a clear reason so the caller sees
 *                                it (a distinct terminal state, not silent loss).
 *
 * The reconciler is meant to run under a lease (the recovery cron / canary), so
 * only one instance reconciles at a time.
 */
import type { DurableEffectLedger, IntentRow } from './durable-effect-ledger';

export type ProbeResult =
  | { status: 'sent'; externalRef: Record<string, unknown> }
  | { status: 'not-sent' }
  | { status: 'unknown' };

/** A per-channel probe: did this dispatched-but-uncommitted effect actually happen? */
export type ChannelProbe = (intent: IntentRow) => Promise<ProbeResult>;

export interface ReconcileOptions {
  /** Probes by channel. A channel with no probe is treated as 'unknown'. */
  probes?: Partial<Record<string, ChannelProbe>>;
  /** Beyond this attempt count, an unresolved 'unknown' row is abandoned. */
  maxAttempts?: number;
  /** How many stale rows to process per run. */
  limit?: number;
  /** Injectable clock. */
  now?: () => Date;
}

export interface ReconcileSummary {
  scanned: number;
  committed: number;
  reopened: number;
  abandoned: number;
  left: number; // still dispatched (unknown, under the ceiling) - revisited next run
  errors: Array<{ effectKey: string; error: string }>;
}

export async function reconcileOutbox(
  ledger: DurableEffectLedger,
  options?: ReconcileOptions,
): Promise<ReconcileSummary> {
  const probes = options?.probes ?? {};
  const maxAttempts = options?.maxAttempts ?? 5;
  const limit = options?.limit ?? 50;
  const nowFn = options?.now ?? (() => new Date());

  const summary: ReconcileSummary = { scanned: 0, committed: 0, reopened: 0, abandoned: 0, left: 0, errors: [] };

  let stale: IntentRow[];
  try {
    stale = await ledger.findStaleDispatched(nowFn().toISOString(), limit);
  } catch (err: unknown) {
    summary.errors.push({ effectKey: 'scan', error: err instanceof Error ? err.message : String(err) });
    return summary;
  }
  summary.scanned = stale.length;

  for (const intent of stale) {
    try {
      const probe = probes[intent.channel];
      const result: ProbeResult = probe ? await probe(intent) : { status: 'unknown' };

      if (result.status === 'sent') {
        await ledger.markCommitted({ runId: intent.run_id, effectKey: intent.effect_key, externalRef: result.externalRef });
        summary.committed++;
      } else if (result.status === 'not-sent') {
        await ledger.reopen(intent.run_id, intent.effect_key, 'reconciler: provably not sent, reopened for retry');
        summary.reopened++;
      } else {
        // unknown - never resend (at-most-once). Abandon past the ceiling.
        if (intent.attempts >= maxAttempts) {
          await ledger.abandon(
            intent.run_id,
            intent.effect_key,
            `reconciler: unverifiable send on '${intent.channel}' past ${maxAttempts} attempts - abandoned (not resent, at-most-once)`,
          );
          summary.abandoned++;
        } else {
          summary.left++;
        }
      }
    } catch (err: unknown) {
      summary.errors.push({ effectKey: intent.effect_key, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return summary;
}
