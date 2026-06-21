import { test } from 'vitest';
import assert from 'node:assert/strict';

import { shouldDecompose, renderPlanForApproval } from '../decompose.ts';
import type { DecompositionPlan } from '../decompose.ts';

// =========================
// shouldDecompose heuristic
// =========================

test('shouldDecompose returns false for short messages', () => {
  assert.equal(shouldDecompose('hi'), false);
  assert.equal(shouldDecompose('y'), false);
  assert.equal(shouldDecompose('ok thanks'), false);
});

test('shouldDecompose returns false for single questions', () => {
  assert.equal(shouldDecompose('what time is the meeting tomorrow afternoon?'), false);
  assert.equal(shouldDecompose('when does ZAOstock launch this year actually?'), false);
  assert.equal(shouldDecompose('who is on the ZABAL Games mentor list right now'), false);
});

test('shouldDecompose returns true for multi-step goals', () => {
  assert.equal(
    shouldDecompose('research the kanban best practices and then ship a doc with the findings'),
    true,
  );
  assert.equal(
    shouldDecompose('build out the cowork tracker improvements then DM iman the test plan'),
    true,
  );
  assert.equal(
    shouldDecompose('decompose this idea into actionable subtasks, also brainstorm alternatives'),
    true,
  );
});

test('shouldDecompose returns false for y/n one-word replies', () => {
  assert.equal(shouldDecompose('yes'), false);
  assert.equal(shouldDecompose('no'), false);
});

// =========================
// renderPlanForApproval shape
// =========================

test('renderPlanForApproval surfaces ambiguities before subtasks when both present', () => {
  const plan: DecompositionPlan = {
    goal_summary: 'Test goal',
    subtasks: [
      {
        id: 'st-1',
        title: 'Do thing',
        worker: 'research-worker',
        depends_on: [],
        parallel_with: [],
        approval_gate_before_next: false,
        estimated_cost_class: 'small',
      },
    ],
    execution_plan: 'Run st-1.',
    ambiguities: ['Need to know X first'],
  };
  const out = renderPlanForApproval(plan);
  assert.match(out, /Need clarification first/);
  assert.match(out, /Need to know X first/);
  // When ambiguities exist, subtasks aren't dispatched, so step body shouldn't appear.
  assert.equal(out.includes('Reply y to dispatch'), false);
});

test('renderPlanForApproval shows steps + execution plan when no ambiguities', () => {
  const plan: DecompositionPlan = {
    goal_summary: 'Ship feature X',
    subtasks: [
      {
        id: 'st-1',
        title: 'Research patterns',
        worker: 'research-worker',
        depends_on: [],
        parallel_with: ['st-2'],
        approval_gate_before_next: false,
        estimated_cost_class: 'small',
      },
      {
        id: 'st-2',
        title: 'Draft comms',
        worker: 'comms-drafter',
        depends_on: [],
        parallel_with: ['st-1'],
        approval_gate_before_next: true,
        estimated_cost_class: 'medium',
      },
      {
        id: 'st-3',
        title: 'Ship the code',
        worker: 'hermes',
        depends_on: ['st-1', 'st-2'],
        parallel_with: [],
        approval_gate_before_next: true,
        estimated_cost_class: 'large',
      },
    ],
    execution_plan: 'st-1 + st-2 in parallel, then st-3.',
    ambiguities: [],
  };
  const out = renderPlanForApproval(plan);
  assert.match(out, /Plan: Ship feature X/);
  assert.match(out, /Steps \(3\):/);
  assert.match(out, /st-1\. Research patterns -> research-worker/);
  assert.match(out, /st-2\. Draft comms -> comms-drafter/);
  assert.match(out, /st-3\. Ship the code -> hermes/);
  // parallel_with surfaces on st-1 and st-2
  assert.match(out, /st-1.*parallel with st-2/);
  // approval gate marker on st-2 + st-3
  const stLines = out.split('\n').filter((l) => l.includes('->'));
  const gateMarkers = stLines.filter((l) => l.includes('[gate]'));
  assert.equal(gateMarkers.length, 2);
  // dependencies marker on st-3
  assert.match(out, /st-3.*after st-1, st-2/);
  // Execution plan line
  assert.match(out, /st-1 \+ st-2 in parallel, then st-3\./);
  assert.match(out, /Reply y to dispatch/);
});

test('renderPlanForApproval handles single-step plan cleanly', () => {
  const plan: DecompositionPlan = {
    goal_summary: 'Answer a simple question',
    subtasks: [
      {
        id: 'st-1',
        title: 'Look up the answer inline',
        worker: 'task-dispatcher',
        depends_on: [],
        parallel_with: [],
        approval_gate_before_next: false,
        estimated_cost_class: 'small',
      },
    ],
    execution_plan: 'Answer inline.',
    ambiguities: [],
  };
  const out = renderPlanForApproval(plan);
  assert.match(out, /Steps \(1\):/);
  assert.match(out, /st-1\. Look up the answer inline -> task-dispatcher/);
});
