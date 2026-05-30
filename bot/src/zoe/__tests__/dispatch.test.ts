import { test } from 'node:test';
import assert from 'node:assert/strict';

import { dispatchPlan } from '../dispatch.ts';
import type { DispatchPlanArgs } from '../dispatch.ts';
import type { DecompositionPlan, Subtask } from '../decompose.ts';

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

// --- H3 (doc 770/771) guards: refuse oversized plans + budget pre-flight ---

test('H3: a plan over the subtask ceiling is refused as too-large', async () => {
  const many = Array.from({ length: 13 }, (_, i) => st(`st-${i + 1}`));
  const report = await dispatchPlan(args(plan(many)));
  assert.equal(report.status, 'too-large');
  assert.equal(report.results.length, 0); // nothing dispatched
});

test('H3: budget pre-flight stops a costed wave BEFORE spawning the worker', async () => {
  // research-worker has a $1.00 cap; a $0.50 budget must trip pre-flight and
  // never invoke the CLI (results stays empty — no worker ran).
  const p = plan([st('st-1', { worker: 'research-worker' })]);
  const report = await dispatchPlan(args(p, { maxPlanBudgetUsd: 0.5 }));
  assert.equal(report.status, 'budget-exceeded');
  assert.equal(report.results.length, 0);
});
