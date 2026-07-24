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
 * Pure helpers (normalizeStack/stackHash/buildIssueText/repoToTarget/pickNext)
 * are unit-tested; runErrorRemediationTick takes injected deps so the routing
 * logic is testable without a DB or a live pipeline.
 */

import { createHash } from 'node:crypto';
import type { HermesRepoTarget } from '../hermes/types';
import { db } from '../supabase';
import { dispatchHermesRun } from '../hermes/runner';
import { emitReceipt } from './receipts';

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
  /** Post a human-readable outcome (ZAALBOTS group). */
  report: (message: string) => Promise<void>;
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
  const errors = await deps.fetchNewErrors();
  const next = pickNext(errors);
  if (!next) return 'no new errors';

  const claimed = await deps.claimError(next.id);
  if (!claimed) return `lost claim race on ${next.id}`;

  const target = repoToTarget(next.repo);
  if (!target) {
    await deps.markEscalated(next.id, `unsupported repo '${next.repo}' - no fix target`);
    await deps.report(
      `Error ${next.ref_code ?? next.id.slice(0, 8)} in '${next.repo}' needs you - no auto-fix target for that repo.`,
    );
    return `escalated (unsupported repo ${next.repo})`;
  }

  let result: RemediationDispatchResult;
  try {
    result = await deps.dispatchFix({ issueText: buildIssueText(next), targetRepo: target });
  } catch (err) {
    const reason = (err as Error)?.message ?? String(err);
    await deps.markEscalated(next.id, `dispatch threw: ${reason}`);
    await deps.report(
      `Error ${next.ref_code ?? next.id.slice(0, 8)} (${target}) - fix pipeline errored, needs you: ${reason}`,
    );
    return `escalated (dispatch threw)`;
  }

  const tag = next.ref_code ?? next.id.slice(0, 8);
  if (result.kind === 'ready') {
    await deps.markFixed(next.id, result.prUrl, result.runId);
    const prLabel = result.prNumber ? `PR #${result.prNumber}` : 'a PR';
    await deps.report(
      `Error ${tag} (${target}${next.brand ? `, brand ${next.brand}` : ''}): diagnosed -> fixed -> ${prLabel} open${result.prUrl ? ` ${result.prUrl}` : ''}. Ready for your merge.`,
    );
    return `fixed -> ${result.prUrl ?? 'pr'}`;
  }

  await deps.markEscalated(next.id, `${result.kind}: ${result.reason}`);
  await deps.report(
    `Error ${tag} (${target}) - pipeline could not auto-fix (${result.kind}): ${result.reason}. Needs you.`,
  );
  return `escalated (${result.kind})`;
}

/**
 * Wire the tick to the real cowork DB, the Hermes fix pipeline, and a report
 * sink. Not unit-tested (I/O); the routing logic it drives is (above).
 */
export function defaultRemediationDeps(
  report: (message: string) => Promise<void>,
  triggeredByTelegramId: number,
  triggeredInChatId: number,
): RemediationDeps {
  return {
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
