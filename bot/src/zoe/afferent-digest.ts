/**
 * Afferent Digest — receipts -> memory bridge.
 *
 * Nightly job (runs ~02:30 UTC after nightly-recap) that turns the day's receipts
 * into ONE durable memory record, so the organism remembers what it did.
 *
 * - Queries receipts table for the last 24h
 * - Composes a concise prose self-knowledge digest
 * - Emits a receipt for the digest itself (idempotent per calendar day)
 * - If Bonfire is configured, writes an episode to the graph for long-term recall
 * - Returns a status string (or null if silent/nothing to digest)
 *
 * Design: idempotent per calendar day (use a per-day key in the idempotency check).
 * Loud-fail: if DB is unreachable, logs at error level + returns failure result.
 */

import { db } from '../supabase';
import { emitReceipt } from './receipts';
import { buildEpisode, promoteSubmission, queueConfigured, type BonfireSubmission } from './bonfire-queue';

export interface DigestResult {
  status: 'success' | 'error' | 'silent';
  message: string;
  receiptCount?: number;
  bonfire?: boolean;
}

/**
 * Result of a digest build. "nothing happened today" (empty) and "we could not find
 * out what happened today" (error) are DIFFERENT outcomes and must not collapse into
 * one silent status - a DB outage reported as "nothing to digest" is exactly the
 * green-while-broken failure `.claude/rules/silent-failure-guard.md` bans.
 */
type DigestBuild =
  | {
      kind: 'ok';
      digest: string;
      receiptCount: number;
      statsByAgent: Record<string, number>;
      statsByCapability: Record<string, number>;
      statsByResultType: Record<string, number>;
    }
  | { kind: 'empty' }
  | { kind: 'error'; message: string };

/**
 * Compose a concise prose digest of today's organism activity.
 *
 * Queries receipts from the last 24h, groups by agent + capability, and produces
 * a terse, factual summary like:
 *   "Today the organism: 42 receipts across zoe(35), zol(7). Actions: 28 posts,
 *    8 repos, 4 fetches, 2 decisions. 1 error, rest success."
 */
async function buildDailyDigest(): Promise<DigestBuild> {
  try {
    const client = db();

    // Query last 24h of receipts, grouped for analysis
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await client
      .from('receipts')
      .select('agent_identity, capability, action, result_type, created_at')
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[zoe/afferent-digest] receipts query failed:', error.message);
      return { kind: 'error', message: `receipts query failed: ${error.message}` };
    }

    const receipts = (data ?? []) as Array<{
      agent_identity: string;
      capability: string;
      action: string;
      result_type: string;
      created_at: string;
    }>;

    if (receipts.length === 0) {
      return { kind: 'empty' }; // Silent if nothing to report
    }

    // Group by agent, capability, result type
    const statsByAgent: Record<string, number> = {};
    const statsByCapability: Record<string, number> = {};
    const statsByResultType: Record<string, number> = {};

    for (const r of receipts) {
      statsByAgent[r.agent_identity] = (statsByAgent[r.agent_identity] ?? 0) + 1;
      statsByCapability[r.capability] = (statsByCapability[r.capability] ?? 0) + 1;
      statsByResultType[r.result_type] = (statsByResultType[r.result_type] ?? 0) + 1;
    }

    // Format agents list (agent(count), agent(count), ...)
    const agentsSummary = Object.entries(statsByAgent)
      .sort((a, b) => b[1] - a[1])
      .map(([agent, count]) => `${agent}(${count})`)
      .join(', ');

    // Format capabilities list
    const capsSummary = Object.entries(statsByCapability)
      .sort((a, b) => b[1] - a[1])
      .map(([cap, count]) => `${count} ${cap}s`)
      .join(', ');

    // Format result summary (success, error, etc)
    const resultsSummary = Object.entries(statsByResultType)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => (count > 1 ? `${count} ${type}` : `${count} ${type}`))
      .join(', ');

    // Compose the digest
    const date = new Date().toISOString().slice(0, 10);
    const digest = `[${date}] Organism daily digest: ${receipts.length} actions across ${agentsSummary}. ${capsSummary}. ${resultsSummary}.`;

    return {
      kind: 'ok',
      digest,
      receiptCount: receipts.length,
      statsByAgent,
      statsByCapability,
      statsByResultType,
    };
  } catch (err) {
    const message = (err as Error)?.message ?? String(err);
    console.error('[zoe/afferent-digest] buildDailyDigest error:', message);
    return { kind: 'error', message };
  }
}

/**
 * Check if a digest receipt already exists for today (idempotency check).
 * Uses a per-day key: `afferent-digest-YYYY-MM-DD`.
 *
 * Tri-state on purpose: 'unknown' means the check itself failed, which is NOT the
 * same as "no digest exists". Collapsing 'unknown' into false would let a flaky
 * check wave through a duplicate emit - the opposite of the safeguard.
 */
async function digestExistsForToday(): Promise<'yes' | 'no' | 'unknown'> {
  try {
    const client = db();
    const today = new Date().toISOString().slice(0, 10);
    const key = `afferent-digest-${today}`;

    const { data, error } = await client
      .from('receipts')
      .select('id')
      .eq('agent_identity', 'zoe')
      .eq('action', 'daily_digest')
      .eq('input_digest', key)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found (ok), any other error is loud-fail
      console.error('[zoe/afferent-digest] idempotency check failed:', error.message);
      return 'unknown'; // On check failure, don't emit (safeguard against double-fire)
    }

    return data ? 'yes' : 'no';
  } catch (err) {
    console.error('[zoe/afferent-digest] digestExistsForToday error:', (err as Error)?.message ?? err);
    return 'unknown';
  }
}

/**
 * persistDailyDigest: Build + persist the digest to receipts + Bonfire (if configured).
 *
 * Returns a DigestResult status string for logging. On loud-fail (DB down), returns
 * { status: 'error', message: '...' }.
 */
export async function persistDailyDigest(): Promise<DigestResult> {
  try {
    // Idempotency: one digest per calendar day
    const existing = await digestExistsForToday();
    if (existing === 'yes') {
      return { status: 'silent', message: 'digest already emitted today' };
    }
    if (existing === 'unknown') {
      // The check failed, so we cannot prove this is not a re-run. Do NOT emit.
      return { status: 'error', message: 'idempotency check failed - skipped emit' };
    }

    // Build the digest
    const digestData = await buildDailyDigest();
    if (digestData.kind === 'error') {
      return { status: 'error', message: digestData.message };
    }
    if (digestData.kind === 'empty') {
      return { status: 'silent', message: 'no receipts to digest' };
    }

    const { digest, receiptCount } = digestData;

    // Emit a receipt for the digest itself (idempotent key: date-based)
    const today = new Date().toISOString().slice(0, 10);
    const idempotencyKey = `afferent-digest-${today}`;
    const receiptSuccess = await emitReceipt({
      agentIdentity: 'zoe',
      capability: 'organism_memory',
      tool: 'afferent-digest',
      action: 'daily_digest',
      inputDigest: idempotencyKey,
      resultType: 'success',
      approvalClass: 'auto',
    });

    if (!receiptSuccess) {
      console.error('[zoe/afferent-digest] failed to emit digest receipt');
      return { status: 'error', message: 'receipt emit failed', receiptCount };
    }

    // If Bonfire is configured, write an episode for long-term graph memory
    let bonfireSuccess = false;
    if (queueConfigured()) {
      try {
        // Construct a Bonfire submission from the digest
        const submission: BonfireSubmission = {
          id: idempotencyKey,
          fid: 0, // system-generated, no user FID
          username: null,
          type: 'doc',
          title: `Organism daily digest - ${today}`,
          body: digest,
          source: 'zoe-afferent-digest',
          status: 'promoted',
          ts: Date.now(),
        };

        // Promote to Bonfire graph (remember() carries secret-scan)
        const result = await promoteSubmission(submission);
        bonfireSuccess = result.ok === true;
        if (!bonfireSuccess) {
          console.warn('[zoe/afferent-digest] bonfire promotion returned non-ok:', result);
        }
      } catch (err) {
        console.error('[zoe/afferent-digest] bonfire promotion failed:', (err as Error)?.message ?? err);
        // Continue anyway — receipt was emitted, which is the critical path
      }
    }

    const msg = `digest persisted (receipt + ${bonfireSuccess ? 'bonfire' : 'no-bonfire'})`;
    return {
      status: 'success',
      message: msg,
      receiptCount,
      bonfire: bonfireSuccess,
    };
  } catch (err) {
    console.error('[zoe/afferent-digest] persistDailyDigest error:', (err as Error)?.message ?? err);
    return { status: 'error', message: (err as Error)?.message ?? 'unknown error' };
  }
}
