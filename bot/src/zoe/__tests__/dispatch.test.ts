import { test } from 'vitest';
import assert from 'node:assert/strict';

import {
  dispatchPlan,
  subtaskBudgetEstimate,
  hermesToWorkerResult,
} from '../dispatch.ts';
import type { DispatchPlanArgs } from '../dispatch.ts';
import type { DecompositionPlan, Subtask } from '../decompose.ts';
import { workerMaxBudget } from '../workers.ts';

// task-dispatcher subtasks short-circuit inside dispatch.ts (no Claude CLI,
// no Hermes), so a plan made of them exercises the scheduler — dependency
// waves, gates, resume, cycle detection, budget — with zero external calls.

function st(id: string, opts: Partial<Subtask> = {}): Subtask {
  return {
    id,
    title: `do ${id}`,
    worker: 'task-dispatcher',
    depends_on: [],
    parallel_with: [],
    approval_gate_before_next: false,
    estimated_cost_class: 'small',
    ...opts,
  };
}

function plan(subtasks: Subtask[]): DecompositionPlan {
  return { goal_summary: 'test', subtasks, execution_plan: '', ambiguities: [] };
}

function args(p: DecompositionPlan, extra: Partial<DispatchPlanArgs> = {}): DispatchPlanArgs {
  return {
    goal: 'test goal',
    plan: p,
    context: { zaal_tg_id: 1, workspace_dir: '/tmp', current_date: 'today' },
    chatId: 1,
    zaalTgId: 1,
    ...extra,
  };
}

test('linear plan completes all subtasks in dependency order', async () => {
  const p = plan([
    st('st-1'),
    st('st-2', { depends_on: ['st-1'] }),
    st('st-3', { depends_on: ['st-2'] }),
  ]);
  const report = await dispatchPlan(args(p));
  assert.equal(report.status, 'completed');
  assert.deepEqual(report.completedIds.sort(), ['st-1', 'st-2', 'st-3']);
  assert.equal(report.results.length, 3);
});

test('independent subtasks run in the same wave (parallel)', async () => {
  const p = plan([
    st('st-1'),
    st('st-2'),
    st('st-3', { depends_on: ['st-1', 'st-2'] }),
  ]);
  const report = await dispatchPlan(args(p));
  assert.equal(report.status, 'completed');
  assert.equal(report.completedIds.length, 3);
});

test('approval gate pauses the loop and reports the gate id', async () => {
  const p = plan([
    st('st-1'),
    st('st-2', { depends_on: ['st-1'], approval_gate_before_next: true }),
    st('st-3', { depends_on: ['st-2'] }),
  ]);
  const report = await dispatchPlan(args(p));
  assert.equal(report.status, 'paused-for-gate');
  assert.equal(report.gateAfterId, 'st-2');
  assert.deepEqual(report.completedIds.sort(), ['st-1', 'st-2']);
  // st-3 must NOT have run yet.
  assert.equal(report.results.find((r) => r.subtaskId === 'st-3'), undefined);
});

test('resuming with alreadyCompleted runs the rest without re-pausing', async () => {
  const p = plan([
    st('st-1'),
    st('st-2', { depends_on: ['st-1'], approval_gate_before_next: true }),
    st('st-3', { depends_on: ['st-2'] }),
  ]);
  const report = await dispatchPlan(args(p, { alreadyCompleted: ['st-1', 'st-2'] }));
  assert.equal(report.status, 'completed');
  // Only st-3 ran this invocation.
  assert.deepEqual(report.results.map((r) => r.subtaskId), ['st-3']);
  assert.deepEqual(report.completedIds.sort(), ['st-1', 'st-2', 'st-3']);
});

test('dependency cycle resolves to failed (no progress possible)', async () => {
  const p = plan([
    st('st-1', { depends_on: ['st-2'] }),
    st('st-2', { depends_on: ['st-1'] }),
  ]);
  const report = await dispatchPlan(args(p));
  assert.equal(report.status, 'failed');
  assert.equal(report.completedIds.length, 0);
});

test('budget cap stops the loop', async () => {
  const p = plan([st('st-1'), st('st-2', { depends_on: ['st-1'] })]);
  // task-dispatcher cost is 0, so any negative budget trips after wave 1.
  const report = await dispatchPlan(args(p, { maxPlanBudgetUsd: -1 }));
  assert.equal(report.status, 'budget-exceeded');
});

test('cancellation stops before the first wave', async () => {
  const p = plan([st('st-1')]);
  const report = await dispatchPlan(args(p, { hooks: { isCancelled: () => true } }));
  assert.equal(report.status, 'cancelled');
  assert.equal(report.results.length, 0);
});

// =========================
// doc 770 H3 — wave-concurrency cap + pre-flight budget
// =========================

test('pre-flight budget refuses to launch a batch it cannot afford (no worker runs)', async () => {
  // research-worker estimates at its $1.00 hard per-invocation cap. A $0.50
  // budget can't cover even one, so the wave is refused BEFORE any claude
  // subprocess launches — the test stays pure (no CLI call).
  const p = plan([st('st-1', { worker: 'research-worker' })]);
  const report = await dispatchPlan(args(p, { maxPlanBudgetUsd: 0.5 }));
  assert.equal(report.status, 'budget-exceeded');
  assert.equal(report.results.length, 0);
  assert.equal(report.totalCostUsd, 0);
});

test('duplicate subtask ids fail fast with a clear diagnostic (not "unsatisfiable")', async () => {
  // doc 770 MED: the completed-Set bound can never reach length with dup ids.
  const p = plan([st('st-1'), st('st-1', { title: 'dup' })]);
  const report = await dispatchPlan(args(p));
  assert.equal(report.status, 'failed');
  assert.equal(report.results.length, 0);
  assert.match(report.summary, /duplicate subtask ids/);
});

test('a wave larger than the concurrency cap still completes every subtask', async () => {
  // 7 independent task-dispatcher subtasks (cost 0) exceed WAVE_CONCURRENCY (3),
  // so they run across multiple batches. Batching must not drop any.
  const p = plan([
    st('st-1'),
    st('st-2'),
    st('st-3'),
    st('st-4'),
    st('st-5'),
    st('st-6'),
    st('st-7'),
  ]);
  const report = await dispatchPlan(args(p));
  assert.equal(report.status, 'completed');
  assert.equal(report.results.length, 7);
  assert.equal(report.completedIds.length, 7);
});

// --- doc 770 MED: Hermes cost is no longer invisible to the plan budget ---

test('subtaskBudgetEstimate gives Hermes a non-zero pre-flight estimate', () => {
  // Previously 0, so a plan of N Hermes subtasks never tripped the budget.
  assert.ok(subtaskBudgetEstimate('hermes') > 0);
  // task-dispatcher is still free (runs inline, no subprocess).
  assert.equal(subtaskBudgetEstimate('task-dispatcher'), 0);
  // claude workers estimate at their hard per-invocation cap.
  assert.equal(
    subtaskBudgetEstimate('research-worker'),
    workerMaxBudget('research-worker'),
  );
});

type HermesOutcome = Parameters<typeof hermesToWorkerResult>[1];

test('hermesToWorkerResult surfaces the run notional cost + tokens (not 0)', () => {
  const subtask: Subtask = st('st-h', { worker: 'hermes' });
  // Only the fields the mapper reads matter; cast the minimal shape.
  const outcome = {
    kind: 'ready',
    run: { id: 'run-1', total_input_tokens: 1200, total_output_tokens: 800, estimated_cost_usd: 0.42 },
  } as unknown as HermesOutcome;
  const result = hermesToWorkerResult(subtask, outcome);
  assert.equal(result.status, 'completed');
  assert.equal(result.costUsd, 0.42);
  assert.equal(result.inputTokens, 1200);
  assert.equal(result.outputTokens, 800);
});

test('hermesToWorkerResult tolerates null cost/tokens (falls back to 0)', () => {
  const subtask: Subtask = st('st-h2', { worker: 'hermes' });
  const outcome = {
    kind: 'failed',
    run: { id: 'r', total_input_tokens: null, total_output_tokens: null, estimated_cost_usd: null },
    reason: 'boom',
  } as unknown as HermesOutcome;
  const result = hermesToWorkerResult(subtask, outcome);
  assert.equal(result.status, 'failed');
  assert.equal(result.costUsd, 0);
  assert.equal(result.error, 'boom');
});
