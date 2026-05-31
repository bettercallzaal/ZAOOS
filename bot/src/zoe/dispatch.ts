/**
 * dispatch.ts — ZOE's Node-orchestrated dispatch loop (doc 759 Gap 2).
 *
 * Takes an APPROVED DecompositionPlan and runs it:
 *   - schedules subtasks in dependency waves (deps-satisfied subtasks run
 *     concurrently, capped at WAVE_CONCURRENCY per batch — doc 770 H3)
 *   - routes each subtask to its worker (workers.ts) or to Hermes for code-fix
 *   - records every run for the Gap 5 learning loop (runs.ts)
 *   - enforces a hard per-plan USD budget, pre-flighting each batch before it
 *     launches and stopping the moment the cap is hit (doc 770 H3)
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
import type { DecompositionPlan, Subtask, WorkerKind } from './decompose';
import {
  runClaudeWorker,
  workerMaxBudget,
  type ClaudeWorkerKind,
  type WorkerResult,
} from './workers';
import { recordRun, newRunId, type RunRecord } from './runs';

const DEFAULT_PLAN_BUDGET_USD = Number(process.env.ZOE_PLAN_BUDGET_USD ?? 5);

/**
 * Max worker subprocesses launched at once within a single dependency wave
 * (doc 770 H3). Without a cap an 8-subtask wave spawns 8 concurrent `claude`
 * processes and can blow past the plan budget before the post-wave check ever
 * runs. Override via ZOE_WAVE_CONCURRENCY.
 */
const WAVE_CONCURRENCY = Math.max(1, Number(process.env.ZOE_WAVE_CONCURRENCY ?? 3));

/**
 * Worst-case USD a subtask can spend against ZOE's plan budget, used to
 * pre-flight a batch before launching it (doc 770 H3). Inline task-dispatcher
 * runs spend nothing; Hermes accounts for its own spend in its own DB, so it
 * is 0 against the plan budget here.
 */
function subtaskBudgetEstimate(worker: WorkerKind): number {
  if (worker === 'task-dispatcher' || worker === 'hermes') return 0;
  return workerMaxBudget(worker as ClaudeWorkerKind);
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
          ? `Stopped — plan budget exceeded after ${report.results.length} subtask(s).`
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

  // Duplicate ids break the completed-Set loop bound + outputsById (doc 770
  // MED): the Set size can never reach plan.subtasks.length, so the loop would
  // otherwise return a misleading 'dependency unsatisfiable' failure. Bail with
  // a clear diagnostic instead.
  if (new Set(plan.subtasks.map((s) => s.id)).size !== plan.subtasks.length) {
    return {
      status: 'failed',
      results: [],
      completedIds: [...completed],
      totalCostUsd: 0,
      summary: 'Stopped — the plan has duplicate subtask ids and cannot be dispatched safely. Re-decompose.',
    };
  }

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

    // Run the wave in bounded-concurrency batches (doc 770 H3) so we never
    // launch more than WAVE_CONCURRENCY worker subprocesses at once, and can
    // stop the moment the budget is hit instead of after the whole wave runs.
    let budgetHit = false;
    for (let start = 0; start < runnable.length && !budgetHit; start += WAVE_CONCURRENCY) {
      const batch = runnable.slice(start, start + WAVE_CONCURRENCY);

      // Pre-flight: refuse to launch a batch we can't afford. Each subtask is
      // estimated at its worker's hard per-invocation cap. Inline/Hermes
      // subtasks estimate to 0, so a batch of only those never trips here.
      const batchEstimate = batch.reduce((sum, st) => sum + subtaskBudgetEstimate(st.worker), 0);
      if (batchEstimate > 0 && totalCost + batchEstimate > budget) {
        budgetHit = true;
        break;
      }

      const settled = await Promise.allSettled(
        batch.map(async (st) => {
          await args.hooks?.onSubtaskStart?.(st);
          const res = await runOne(st, args, outputsById);
          await args.hooks?.onSubtaskDone?.(st, res);
          return res;
        }),
      );

      for (let i = 0; i < settled.length; i++) {
        const st = batch[i];
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

      if (totalCost > budget) budgetHit = true;
    }

    if (budgetHit) {
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
