/**
 * dispatch.ts — ZOE's Node-orchestrated dispatch loop (doc 759 Gap 2).
 *
 * Takes an APPROVED DecompositionPlan and runs it:
 *   - schedules subtasks in dependency waves (deps-satisfied subtasks run with
 *     bounded concurrency, MAX_WAVE_CONCURRENCY at a time)
 *   - routes each subtask to its worker (workers.ts) or to Hermes for code-fix
 *   - records every run for the Gap 5 learning loop (runs.ts)
 *   - enforces a per-plan USD budget via per-wave pre-flight (worst-case spend
 *     is checked BEFORE a wave launches) + a subtask-count ceiling. NOTE:
 *     Hermes subtasks self-account, so their spend is not seen here.
 *   - honors approval_gate_before_next: pauses the loop and returns
 *     'paused-for-gate' so the caller raises a fresh approval. On resume the
 *     caller re-invokes with alreadyCompleted set.
 *   - supports cooperative cancellation via hooks.isCancelled().
 *
 * Never throws — every failure resolves into the DispatchReport so the caller
 * can always report something back to Zaal.
 */

import { dispatchHermesRun } from '../hermes/runner';
import type { ZoeContext } from './types';
import type { DecompositionPlan, Subtask } from './decompose';
import { runClaudeWorker, workerMaxBudget, type ClaudeWorkerKind, type WorkerResult } from './workers';
import { recordRun, newRunId, type RunRecord } from './runs';

const DEFAULT_PLAN_BUDGET_USD = Number(process.env.ZOE_PLAN_BUDGET_USD ?? 5);
// H3 (doc 770): hard ceilings so one plan can't spawn unbounded `claude`
// processes or blow far past budget in a single wave.
const MAX_SUBTASKS = Number(process.env.ZOE_MAX_SUBTASKS ?? 12);
const MAX_WAVE_CONCURRENCY = Number(process.env.ZOE_MAX_WAVE_CONCURRENCY ?? 3);

/** Worst-case authorized spend for a subtask (hermes/inline track their own). */
function estimateSubtaskCost(st: Subtask): number {
  if (st.worker === 'hermes' || st.worker === 'task-dispatcher') return 0;
  return workerMaxBudget(st.worker as ClaudeWorkerKind);
}

/**
 * Run `fn` over items with at most `limit` in flight at once. Returns
 * PromiseSettledResult[] in input order. Caps concurrent CLI subprocesses.
 */
async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;
  const worker = async (): Promise<void> => {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      try {
        results[i] = { status: 'fulfilled', value: await fn(items[i]) };
      } catch (e) {
        results[i] = { status: 'rejected', reason: e };
      }
    }
  };
  const pool = Array.from({ length: Math.min(Math.max(1, limit), items.length) }, worker);
  await Promise.all(pool);
  return results;
}

export interface DispatchHooks {
  onSubtaskStart?: (st: Subtask) => Promise<void> | void;
  onSubtaskDone?: (st: Subtask, result: WorkerResult) => Promise<void> | void;
  /** Polled before each wave; return true to stop gracefully. */
  isCancelled?: () => boolean;
}

export interface DispatchPlanArgs {
  goal: string;
  plan: DecompositionPlan;
  context: ZoeContext;
  /** Telegram chat id, needed to route the hermes worker. */
  chatId: number;
  zaalTgId: number;
  hooks?: DispatchHooks;
  maxPlanBudgetUsd?: number;
  /** Subtask ids already completed in a prior invocation (resume after gate). */
  alreadyCompleted?: string[];
}

export interface DispatchReport {
  status:
    | 'completed'
    | 'paused-for-gate'
    | 'cancelled'
    | 'budget-exceeded'
    | 'too-large'
    | 'failed';
  results: WorkerResult[];
  completedIds: string[];
  /** For 'paused-for-gate': the subtask id whose gate paused the loop. */
  gateAfterId?: string;
  totalCostUsd: number;
  summary: string;
}

function toRunRecord(goal: string, r: WorkerResult): RunRecord {
  return {
    id: newRunId(),
    ts: new Date().toISOString(),
    goal,
    subtaskId: r.subtaskId,
    worker: r.worker,
    status: r.status,
    score: r.critique ? r.critique.score : null,
    criticSummary: r.critique ? r.critique.summary : null,
    criticIssues: r.critique
      ? r.critique.issues.map((i) => `${i.severity}: ${i.issue}`)
      : [],
    revised: r.revised,
    inputTokens: r.inputTokens,
    outputTokens: r.outputTokens,
    costUsd: r.costUsd,
    durationMs: r.durationMs,
    error: r.error ?? null,
  };
}

/** Map a Hermes dispatch outcome onto the uniform WorkerResult shape. */
function hermesToWorkerResult(
  subtask: Subtask,
  outcome: Awaited<ReturnType<typeof dispatchHermesRun>>,
): WorkerResult {
  const status: WorkerResult['status'] =
    outcome.kind === 'ready'
      ? 'completed'
      : outcome.kind === 'escalated'
        ? 'needs-revision'
        : 'failed';
  const reason = 'reason' in outcome ? outcome.reason : undefined;
  const output =
    outcome.kind === 'ready'
      ? `Hermes run ${outcome.run.id} ready.`
      : `Hermes ${outcome.kind}: ${reason ?? 'no detail'}`;
  return {
    subtaskId: subtask.id,
    worker: 'hermes',
    status,
    output,
    critique: null, // Hermes runs its own coder/critic loop internally
    revised: false,
    model: 'hermes',
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0, // Hermes accounts for its own spend via its runs DB
    durationMs: 0,
    error: status === 'failed' ? reason : undefined,
  };
}

async function runOne(
  subtask: Subtask,
  args: DispatchPlanArgs,
  outputsById: Map<string, { title: string; output: string }>,
): Promise<WorkerResult> {
  // task-dispatcher in a plan = "ZOE handles inline" — no subprocess.
  if (subtask.worker === 'task-dispatcher') {
    return {
      subtaskId: subtask.id,
      worker: 'task-dispatcher',
      status: 'completed',
      output: '(handled inline by ZOE — no worker dispatched)',
      critique: null,
      revised: false,
      model: 'inline',
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      durationMs: 0,
    };
  }

  if (subtask.worker === 'hermes') {
    const outcome = await dispatchHermesRun({
      triggered_by_telegram_id: args.zaalTgId,
      triggered_in_chat_id: args.chatId,
      issue_text: subtask.title,
    });
    return hermesToWorkerResult(subtask, outcome);
  }

  const priorOutputs = subtask.depends_on
    .map((id) => {
      const o = outputsById.get(id);
      return o ? { id, title: o.title, output: o.output } : null;
    })
    .filter((x): x is { id: string; title: string; output: string } => x !== null);

  return runClaudeWorker({
    subtask,
    context: args.context,
    goal: args.goal,
    priorOutputs,
  });
}

function summarize(report: Omit<DispatchReport, 'summary'>): string {
  const lines: string[] = [];
  const head =
    report.status === 'completed'
      ? `Done — ran ${report.results.length} subtask(s).`
      : report.status === 'paused-for-gate'
        ? `Paused at the approval gate after ${report.gateAfterId}.`
        : report.status === 'budget-exceeded'
          ? `Stopped — plan budget would be exceeded (ran ${report.results.length} subtask(s)).`
          : report.status === 'too-large'
            ? `Refused — plan has too many subtasks (max ${MAX_SUBTASKS}). Narrow the goal.`
            : report.status === 'cancelled'
              ? `Cancelled after ${report.results.length} subtask(s).`
              : `Stopped — ${report.results.length} subtask(s) ran, dependency unsatisfiable.`;
  lines.push(head);
  for (const r of report.results) {
    const score = r.critique ? ` [${r.critique.score}/100]` : '';
    const flag =
      r.status === 'completed' ? '✓' : r.status === 'needs-revision' ? '⚠' : '✗';
    lines.push(`${flag} ${r.subtaskId} (${r.worker})${score}${r.error ? ` — ${r.error.slice(0, 120)}` : ''}`);
  }
  lines.push('');
  lines.push(`Spend: $${report.totalCostUsd.toFixed(2)}`);
  if (report.status === 'paused-for-gate') {
    lines.push('Reply "y" to continue past the gate, or "n" to stop here.');
  }
  return lines.join('\n');
}

/**
 * Run an approved plan to completion, a budget cap, a gate, or cancellation.
 */
export async function dispatchPlan(args: DispatchPlanArgs): Promise<DispatchReport> {
  const { plan, goal } = args;
  const budget = args.maxPlanBudgetUsd ?? DEFAULT_PLAN_BUDGET_USD;
  const completed = new Set<string>(args.alreadyCompleted ?? []);
  const outputsById = new Map<string, { title: string; output: string }>();
  const results: WorkerResult[] = [];
  let totalCost = 0;

  const finish = (status: DispatchReport['status'], gateAfterId?: string): DispatchReport => {
    const partial = {
      status,
      results,
      completedIds: [...completed],
      gateAfterId,
      totalCostUsd: totalCost,
    };
    return { ...partial, summary: summarize(partial) };
  };

  // H3: refuse oversized plans up front — never spawn an unbounded fan-out.
  if (plan.subtasks.length > MAX_SUBTASKS) {
    return finish('too-large');
  }

  while (completed.size < plan.subtasks.length) {
    if (args.hooks?.isCancelled?.()) return finish('cancelled');

    // Runnable = not yet completed AND all deps satisfied.
    const runnable = plan.subtasks.filter(
      (s) => !completed.has(s.id) && s.depends_on.every((d) => completed.has(d)),
    );
    if (runnable.length === 0) {
      // No progress possible — dependency cycle or reference to a missing id.
      return finish('failed');
    }

    // H3: budget pre-flight — don't authorize a wave whose worst-case spend
    // would exceed the remaining budget. Stops the overspend BEFORE spawning,
    // not after (the old post-wave check could blow far past on a wide wave).
    const waveEstimate = runnable.reduce((sum, s) => sum + estimateSubtaskCost(s), 0);
    if (totalCost + waveEstimate > budget) {
      return finish('budget-exceeded');
    }

    // Run the wave with bounded concurrency (caps simultaneous CLI processes).
    const settled = await runWithConcurrency(runnable, MAX_WAVE_CONCURRENCY, async (st) => {
      await args.hooks?.onSubtaskStart?.(st);
      const res = await runOne(st, args, outputsById);
      await args.hooks?.onSubtaskDone?.(st, res);
      return res;
    });

    for (let i = 0; i < settled.length; i++) {
      const st = runnable[i];
      const s = settled[i];
      const res: WorkerResult =
        s.status === 'fulfilled'
          ? s.value
          : {
              subtaskId: st.id,
              worker: st.worker,
              status: 'failed',
              output: '',
              critique: null,
              revised: false,
              model: 'unknown',
              inputTokens: 0,
              outputTokens: 0,
              costUsd: 0,
              durationMs: 0,
              error: (s.reason as Error)?.message ?? String(s.reason),
            };
      results.push(res);
      completed.add(st.id);
      outputsById.set(st.id, { title: st.title, output: res.output });
      totalCost += res.costUsd;
      void recordRun(toRunRecord(goal, res));
    }

    if (totalCost > budget) {
      return finish('budget-exceeded');
    }

    // Gate: if any subtask in THIS wave is flagged approval_gate_before_next
    // and work remains, pause for Zaal. Pre-completed (resumed) subtasks never
    // re-trigger their gate because they aren't in `runnable` this invocation.
    const remaining = plan.subtasks.length - completed.size;
    if (remaining > 0) {
      const gated = runnable.find((s) => s.approval_gate_before_next);
      if (gated) {
        return finish('paused-for-gate', gated.id);
      }
    }
  }

  return finish('completed');
}
