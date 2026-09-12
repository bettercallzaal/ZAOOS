/**
 * Error Remediation: ZOE turns a captured production error into a routed fix
 * and reports the OUTCOME - it does not ask (feedback_zoe_route_dont_ask).
 *
 * Flow per tick:
 *   read app_errors WHERE status='new' (highest count first)
 *   -> claim ONE (CAS new -> fixing, so two ticks never grab the same row)
 *   -> map its repo to a Hermes fix target
 *   -> dispatch the coder+critic+auto-PR pipeline
 *   -> on a PR: mark fixed, report "diagnosed -> fixed -> PR #N"
 *   -> on failure/big-build: mark escalated, report "needs you"
 *
 * One error per tick (bounded blast radius, agent-loops rule 5). The fix
 * pipeline (dispatchHermesRun) already enforces the fleet daily cap.
 *
 * EVERY OUTCOME IS QUEUED BEFORE THE ROW IS MARKED (vault review of #3446,
 * 2026-09-11). The row used to be marked 'fixed'/'escalated' and THEN reported,
 * and fetchNewErrors only reads status='new'. So a report that threw - Telegram
 * down, a bad group id, a blocked send - left an error permanently marked
 * handled that Zaal was never told about, with one console line as the trace.
 * Reporting first does not fix it: a failed report would leave the claim stuck
 * in 'fixing', which nothing re-reads either. So the report goes into a durable
 * outbox FIRST, then the row is marked, then the outbox is flushed. A crash
 * anywhere in between leaves the message in the outbox; the next tick sends it
 * before anything else, and claims no new error while one is still unsent. A
 * duplicate report after a crash is cheap. A lost one is the bug.
 *
 * Pure helpers (normalizeStack/stackHash/buildIssueText/repoToTarget/pickNext)
 * are unit-tested; runErrorRemediationTick takes injected deps so the routing
 * logic is testable without a DB or a live pipeline.
 */

import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { mcEmit } from './mission-control';
import type { HermesRepoTarget } from '../hermes/types';
import { db } from '../supabase';
import { dispatchHermesRun } from '../hermes/runner';
import { emitReceipt } from './receipts';
import { featureRan } from './feature-ran';

export interface AppError {
  id: string;
  ref_code: string | null;
  repo: string;
  route: string | null;
  brand: string | null;
  message: string;
  stack: string | null;
  stack_hash: string;
  count: number;
  status: string;
}

export type RemediationDispatchResult =
  | { kind: 'ready'; prNumber: number | null; prUrl: string | null; runId: string }
  | { kind: 'failed'; runId: string; reason: string }
  | { kind: 'escalated'; runId: string; reason: string };

export interface RemediationDeps {
  /** New errors, already ordered highest-count first. */
  fetchNewErrors: () => Promise<AppError[]>;
  /** Atomically move new -> fixing. Returns true iff THIS caller won the row. */
  claimError: (id: string) => Promise<boolean>;
  markFixed: (id: string, prUrl: string | null, runId: string) => Promise<void>;
  markEscalated: (id: string, notes: string) => Promise<void>;
  /** Trigger the fix pipeline for a supported target. */
  dispatchFix: (input: {
    issueText: string;
    targetRepo: HermesRepoTarget;
  }) => Promise<RemediationDispatchResult>;
  /** Post a human-readable outcome (ZAALBOTS group). Must THROW when the
   *  message did not reach Telegram, including a budget block. */
  report: (message: string) => Promise<void>;
  /** Durable queue of outcome reports not yet delivered, oldest first. */
  outbox: RemediationOutbox;
}

/** One queued report. `at` is when it was queued, so a stall has an age. */
export interface OutboxItem {
  at: number;
  message: string;
}

export interface RemediationOutbox {
  load: () => Promise<OutboxItem[]>;
  save: (pending: OutboxItem[]) => Promise<void>;
}

/**
 * Send queued reports oldest first; stop at the first that fails and keep it
 * and everything after it. Returns what is still unsent.
 *
 * A stall here stops remediation on purpose (see the tick), and the outbox is
 * the one channel that cannot announce it - the send is what is broken. So the
 * depth and the age of the oldest item go into the tick's status line and into
 * mission control, and zao-selftest reads the file over ssh (vault, #3446
 * review).
 *
 * The mission-control emit lives HERE, not in the caller. It was in the tick,
 * and the scheduler flushes first and returns early when anything is held - so
 * the one state that needed announcing was the one state that reached only a
 * console.error into journald, which nobody reads (vault, #3483 review). Any
 * caller that flushes now announces a stall whether it remembers to or not.
 */
export async function flushOutbox(deps: Pick<RemediationDeps, 'report' | 'outbox'>): Promise<OutboxItem[]> {
  const pending = await deps.outbox.load();
  let sent = 0;
  for (const item of pending) {
    try {
      await deps.report(item.message);
    } catch (err) {
      console.error('[zoe/remediation] report not delivered, kept in the outbox:', (err as Error)?.message);
      break;
    }
    sent += 1;
  }
  if (sent > 0) await deps.outbox.save(pending.slice(sent));
  const held = pending.slice(sent);
  if (held.length > 0) {
    mcEmit('error-remediation', 'zoe', 8, `reports undelivered: ${describeOutbox(held)}`);
  }
  return held;
}

/** "4 unsent, oldest 3h" - the sentence that turns a silent stall into a fact. */
export function describeOutbox(pending: OutboxItem[], now = Date.now()): string {
  if (pending.length === 0) return 'outbox empty';
  const oldestMs = now - Math.min(...pending.map((i) => i.at || now));
  const age = oldestMs >= 3600_000 ? `${Math.round(oldestMs / 3600_000)}h`
    : oldestMs >= 60_000 ? `${Math.round(oldestMs / 60_000)}m` : `${Math.round(oldestMs / 1000)}s`;
  return `${pending.length} unsent, oldest ${age}`;
}

/**
 * Record an outcome: queue the report, THEN mark the row, THEN try to send.
 * If the outbox cannot be written, fall back to send-first: report, then mark,
 * so a failure leaves the row unmarked rather than marked and unreported.
 */
async function settle(
  deps: RemediationDeps,
  message: string,
  mark: () => Promise<void>,
): Promise<'sent' | 'queued'> {
  let queued = true;
  try {
    await deps.outbox.save([...(await deps.outbox.load()), { at: Date.now(), message }]);
  } catch (err) {
    queued = false;
    console.error('[zoe/remediation] outbox unwritable, reporting before marking:', (err as Error)?.message);
  }
  if (!queued) {
    await deps.report(message); // throws -> the row is never marked
    await mark();
    return 'sent';
  }
  // Queue, THEN mark. If the process dies in between, the row is still 'new',
  // the next tick re-processes it, and Zaal gets the report twice. That is the
  // direction to fail: a duplicate is cheap, a silent drop is the bug this
  // exists to remove. Do not move the mark before the queue to "fix" it.
  await mark();
  return (await flushOutbox(deps)).length === 0 ? 'sent' : 'queued';
}

const SUPPORTED_TARGETS: readonly HermesRepoTarget[] = ['zaoos', 'zaostock', 'zaocowork'];

/**
 * Normalize a stack for deduplication: strip line:col numbers, hex ids, and
 * absolute /tmp clone paths so the same bug across deploys hashes identically.
 * Exported so the app-side handler can hash with the exact same rule.
 */
export function normalizeStack(stack: string | null | undefined): string {
  if (!stack) return '';
  return stack
    .replace(/:\d+:\d+/g, ':L:C') // line:col
    .replace(/\b0x[0-9a-f]+\b/gi, '0xID') // hex ids
    .replace(/\/tmp\/[^\s)]+/g, '/tmp/PATH') // ephemeral clone paths
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, 'UUID')
    .trim();
}

export function stackHash(stack: string | null | undefined): string {
  return createHash('sha256').update(normalizeStack(stack), 'utf8').digest('hex');
}

/** Map an app_errors.repo value to a Hermes fix target, or null if unsupported. */
export function repoToTarget(repo: string): HermesRepoTarget | null {
  return SUPPORTED_TARGETS.includes(repo as HermesRepoTarget)
    ? (repo as HermesRepoTarget)
    : null;
}

/** Highest-count new error, or null. Input is not required to be pre-sorted. */
export function pickNext(errors: AppError[]): AppError | null {
  const news = errors.filter((e) => e.status === 'new');
  if (news.length === 0) return null;
  return news.reduce((best, e) => (e.count > best.count ? e : best));
}

/** Build the issue text handed to the coder pipeline from a captured digest. */
export function buildIssueText(err: AppError): string {
  const lines = [
    `Production error to fix (captured by ZOE's remediation rail).`,
    ``,
    err.ref_code ? `Reference code: ${err.ref_code}` : ``,
    err.route ? `Route: ${err.route}` : ``,
    err.brand ? `Brand context: ${err.brand}` : ``,
    `Message: ${err.message}`,
    `Occurrences: ${err.count}`,
    ``,
    err.stack ? `Stack:\n${err.stack.slice(0, 2000)}` : `(no stack captured)`,
    ``,
    `Localize the throw and fix it with the SMALLEST safe change (prefer a null/undefined guard or default over a broad refactor). Verify with typecheck/build before opening the PR. Do not touch secrets, .env, or DB migrations.`,
  ];
  return lines.filter((l) => l !== ``).join('\n').replace(/\n{3,}/g, '\n\n');
}

/**
 * One remediation pass. Returns a short status string for logging.
 */
export async function runErrorRemediationTick(deps: RemediationDeps): Promise<string> {
  // Anything decided earlier and not yet told goes first. No new decisions
  // while Zaal cannot be told about the old ones.
  // flushOutbox emits the priority-8 stall itself, so this path and the
  // scheduler's early return announce the same thing.
  const unsent = await flushOutbox(deps);
  if (unsent.length > 0) {
    return `holding: ${describeOutbox(unsent)}, no new error claimed`;
  }

  const errors = await deps.fetchNewErrors();
  const next = pickNext(errors);
  if (!next) return 'no new errors';

  const claimed = await deps.claimError(next.id);
  if (!claimed) return `lost claim race on ${next.id}`;
  mcEmit('error-remediation', 'zoe', 3, `claimed error ${next.ref_code ?? next.id.slice(0, 8)} in ${next.repo}`);

  const target = repoToTarget(next.repo);
  if (!target) {
    const how = await settle(
      deps,
      `Error ${next.ref_code ?? next.id.slice(0, 8)} in '${next.repo}' needs you - no auto-fix target for that repo.`,
      () => deps.markEscalated(next.id, `unsupported repo '${next.repo}' - no fix target`),
    );
    return `escalated (unsupported repo ${next.repo}), report ${how}`;
  }

  let result: RemediationDispatchResult;
  try {
    result = await deps.dispatchFix({ issueText: buildIssueText(next), targetRepo: target });
  } catch (err) {
    const reason = (err as Error)?.message ?? String(err);
    const how = await settle(
      deps,
      `Error ${next.ref_code ?? next.id.slice(0, 8)} (${target}) - fix pipeline errored, needs you: ${reason}`,
      () => deps.markEscalated(next.id, `dispatch threw: ${reason}`),
    );
    return `escalated (dispatch threw), report ${how}`;
  }

  const tag = next.ref_code ?? next.id.slice(0, 8);
  if (result.kind === 'ready') {
    const prLabel = result.prNumber ? `PR #${result.prNumber}` : 'a PR';
    const ready = result;
    const how = await settle(
      deps,
      `Error ${tag} (${target}${next.brand ? `, brand ${next.brand}` : ''}): diagnosed -> fixed -> ${prLabel} open${result.prUrl ? ` ${result.prUrl}` : ''}. Ready for your merge.`,
      () => deps.markFixed(next.id, ready.prUrl, ready.runId),
    );
    mcEmit('error-remediation', 'zoe', 5, `error ${tag} fixed -> ${result.prUrl ?? 'PR open'}`);
    featureRan('error-remediation', 'auto-fixed');
    return `fixed -> ${result.prUrl ?? 'pr'}, report ${how}`;
  }

  const failed = result;
  const how = await settle(
    deps,
    `Error ${tag} (${target}) - pipeline could not auto-fix (${result.kind}): ${result.reason}. Needs you.`,
    () => deps.markEscalated(next.id, `${failed.kind}: ${failed.reason}`),
  );
  mcEmit('error-remediation', 'zoe', 8, `error ${tag} NEEDS ZAAL (${result.kind}): ${result.reason}`);
  featureRan('error-remediation', `escalated: ${result.kind}`);
  return `escalated (${result.kind}), report ${how}`;
}

/**
 * Wire the tick to the real cowork DB, the Hermes fix pipeline, and a report
 * sink. Not unit-tested (I/O); the routing logic it drives is (above).
 */
/** The outbox as a JSON array under ZOE_HOME, written atomically. */
export function fileOutbox(path: string = join(process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe'),
  'remediation-outbox.json')): RemediationOutbox {
  return {
    load: async () => {
      try {
        const parsed = JSON.parse(await fs.readFile(path, 'utf8'));
        if (!Array.isArray(parsed)) return [];
        return parsed
          .map((i) => (typeof i === 'string' ? { at: 0, message: i } : i))
          .filter((i): i is OutboxItem => typeof i?.message === 'string')
          .map((i) => ({ at: typeof i.at === 'number' ? i.at : 0, message: i.message }));
      } catch (err) {
        if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') return [];
        throw err; // unreadable is not empty: settle() falls back to send-first
      }
    },
    save: async (pending: OutboxItem[]) => {
      await fs.mkdir(dirname(path), { recursive: true });
      const tmp = `${path}.${process.pid}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(pending), 'utf8');
      await fs.rename(tmp, path);
    },
  };
}

export function defaultRemediationDeps(
  report: (message: string) => Promise<void>,
  triggeredByTelegramId: number,
  triggeredInChatId: number,
): RemediationDeps {
  return {
    outbox: fileOutbox(),
    fetchNewErrors: async () => {
      const { data, error } = await db()
        .from('app_errors')
        .select('id, ref_code, repo, route, brand, message, stack, stack_hash, count, status')
        .eq('status', 'new')
        .order('count', { ascending: false })
        .limit(10);
      if (error) {
        console.error('[zoe/remediation] fetchNewErrors failed:', error.message);
        return [];
      }
      return (data ?? []) as AppError[];
    },
    claimError: async (id: string) => {
      // CAS: only the caller that flips new -> fixing wins the row.
      const { data, error } = await db()
        .from('app_errors')
        .update({ status: 'fixing', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('status', 'new')
        .select('id');
      if (error) {
        console.error('[zoe/remediation] claimError failed:', error.message);
        return false;
      }
      return (data?.length ?? 0) > 0;
    },
    markFixed: async (id: string, prUrl: string | null, runId: string) => {
      await db()
        .from('app_errors')
        .update({ status: 'fixed', pr_url: prUrl, run_id: runId, updated_at: new Date().toISOString() })
        .eq('id', id);
      // Portable receipt for the autonomous fix (best-effort, never throws).
      await emitReceipt({
        runId,
        agentIdentity: 'zoe',
        capability: 'error_remediation',
        tool: 'error-remediation-rail',
        action: 'auto_fix_pr',
        resultType: 'success',
        approvalClass: 'auto',
        evidenceUrl: prUrl,
      });
    },
    markEscalated: async (id: string, notes: string) => {
      await db()
        .from('app_errors')
        .update({ status: 'escalated', notes, updated_at: new Date().toISOString() })
        .eq('id', id);
      await emitReceipt({
        runId: null,
        agentIdentity: 'zoe',
        capability: 'error_remediation',
        tool: 'error-remediation-rail',
        action: 'escalated',
        resultType: 'error',
        approvalClass: 'auto',
        evidenceUrl: null,
      });
    },
    dispatchFix: async ({ issueText, targetRepo }) => {
      const result = await dispatchHermesRun({
        triggered_by_telegram_id: triggeredByTelegramId,
        triggered_in_chat_id: triggeredInChatId,
        issue_text: issueText,
        target_repo: targetRepo,
      });
      if (result.kind === 'ready') {
        return {
          kind: 'ready',
          prNumber: result.run.pr_number,
          prUrl: result.run.pr_url,
          runId: result.run.id,
        };
      }
      return { kind: result.kind, runId: result.run.id, reason: result.reason };
    },
    report,
  };
}
