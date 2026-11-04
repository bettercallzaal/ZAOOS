import { test } from 'vitest';
import assert from 'node:assert/strict';

import { shouldDecompose, renderPlanForApproval, ownWords, wrapQuotedReply } from '../decompose.ts';
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

// Item 193 (vault decisions, 2026-11-04): plain talk is answered inline. These
// are Zaal's messages from his 1-4 Nov Telegram export, verbatim; every one got
// "Decomposing into a routed plan" from the old rule.
const PLANNED_BY_MISTAKE = [
  'I want to use text or audio whatever more convient at that time so you should send both',
  'Honestly we shouldn’t be using open router anyways for our agent. Let’s research what others use.',
  'I can’t read this at all in telegram',
  'Priority is upgrading Zoe by identifying gaps fixing and testing them',
  'Please loop on this task',
  'Just honestly back and forth conversation and keeping memories',
  "Okay, I'm gonna start doing voice notes in Telegram. I think that's the most effective way to do things. I also like listening to voice notes from the ZO. So let's start here. What are our cues? What's the to-do's today?",
];

test.each(PLANNED_BY_MISTAKE)('plain talk stays inline: %s', (msg) => {
  assert.equal(shouldDecompose(msg), false);
});

// The quoted message is context, not the ask. A long bot plan full of " and "
// and " then " used to make any short reply look multi-step.
const QUOTED_PLAN =
  'Plan: Upgrade ZOE by auditing for gaps, then fixing and testing them, and then research the routing and build the formatter.';

test.each(PLANNED_BY_MISTAKE)('a quote-reply is judged on his words only: %s', (msg) => {
  assert.equal(shouldDecompose(wrapQuotedReply(QUOTED_PLAN, msg)), false);
});

test('the quoted plan alone still reads as multi-step (control for the case above)', () => {
  assert.equal(shouldDecompose(QUOTED_PLAN), true);
});

test('a multi-step ask in his own reply still plans when quote-replying', () => {
  assert.equal(
    shouldDecompose(wrapQuotedReply('ok', 'research the hosting options and then draft a one-pager for Iman')),
    true,
  );
});

test('ownWords strips exactly the wrapper wrapQuotedReply builds', () => {
  assert.equal(ownWords(wrapQuotedReply('earlier "message" with ]\n\n inside', 'zol yes')), 'zol yes');
  assert.equal(ownWords('no wrapper here'), 'no wrapper here');
});

test('a work verb without a sequence, or a sequence without a work verb, stays inline', () => {
  assert.equal(shouldDecompose('can you research what other agent builders use for routing'), false);
  assert.equal(shouldDecompose('I went to the gym and then had breakfast with my family'), false);
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

// --- modelForCostClass: per-task complexity routing (opt-in) ---
import { modelForCostClass } from '../decompose.ts';

test('modelForCostClass: routing OFF returns the worker default unchanged', () => {
  const prev = process.env.ZOE_TASK_COMPLEXITY_ROUTING;
  delete process.env.ZOE_TASK_COMPLEXITY_ROUTING;
  try {
    assert.equal(modelForCostClass('sonnet', 'small'), 'sonnet');
    assert.equal(modelForCostClass('haiku', 'large'), 'haiku');
    assert.equal(modelForCostClass('sonnet', undefined), 'sonnet');
  } finally {
    if (prev === undefined) delete process.env.ZOE_TASK_COMPLEXITY_ROUTING;
    else process.env.ZOE_TASK_COMPLEXITY_ROUTING = prev;
  }
});

test('modelForCostClass: routing ON maps cost class to model tier', () => {
  const prev = process.env.ZOE_TASK_COMPLEXITY_ROUTING;
  process.env.ZOE_TASK_COMPLEXITY_ROUTING = '1';
  try {
    assert.equal(modelForCostClass('sonnet', 'small'), 'haiku'); // ZOE_QUICK_MODEL
    assert.equal(modelForCostClass('haiku', 'medium'), 'sonnet'); // ZOE_DEFAULT_MODEL
    assert.equal(modelForCostClass('haiku', 'large'), 'opus'); // ZOE_HARD_MODEL
    assert.equal(modelForCostClass('sonnet', undefined), 'sonnet'); // default -> medium tier
  } finally {
    if (prev === undefined) delete process.env.ZOE_TASK_COMPLEXITY_ROUTING;
    else process.env.ZOE_TASK_COMPLEXITY_ROUTING = prev;
  }
});
