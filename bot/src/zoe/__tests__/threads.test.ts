import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  isOverdue,
  isDueSoon,
  snoozeActive,
  nudgeCooldownElapsed,
  nextEscalationAction,
  newThreadId,
  NUDGE_COOLDOWN_MS,
  SNOOZE_FLIP_THRESHOLD,
  type OpenThread,
} from '../threads.ts';

const NOW = Date.parse('2026-06-04T18:00:00Z');

function thread(overrides: Partial<OpenThread> = {}): OpenThread {
  return {
    id: 'th-test',
    summary: 'ship the onepager',
    sourceTurn: "I'll ship the onepager today",
    createdAt: new Date(NOW - 6 * 3600_000).toISOString(),
    dueAt: null,
    status: 'open',
    lastNudgedAt: null,
    nudgeCount: 0,
    snoozeCount: 0,
    snoozeUntil: null,
    bonfireEpisodeId: null,
    ...overrides,
  };
}

// --- isOverdue / isDueSoon ---------------------------------------------------

test('open-ended threads (no dueAt) are never overdue or due-soon', () => {
  const t = thread({ dueAt: null });
  assert.equal(isOverdue(t, NOW), false);
  assert.equal(isDueSoon(t, NOW), false);
});

test('a past due date is overdue, not due-soon', () => {
  const t = thread({ dueAt: new Date(NOW - 3600_000).toISOString() });
  assert.equal(isOverdue(t, NOW), true);
  assert.equal(isDueSoon(t, NOW), false);
});

test('a due date inside the 2h window is due-soon, not overdue', () => {
  const t = thread({ dueAt: new Date(NOW + 3600_000).toISOString() });
  assert.equal(isDueSoon(t, NOW), true);
  assert.equal(isOverdue(t, NOW), false);
});

test('a due date far in the future is neither', () => {
  const t = thread({ dueAt: new Date(NOW + 10 * 3600_000).toISOString() });
  assert.equal(isDueSoon(t, NOW), false);
  assert.equal(isOverdue(t, NOW), false);
});

// --- snoozeActive ------------------------------------------------------------

test('snoozeActive true only while snoozed and snoozeUntil in the future', () => {
  assert.equal(snoozeActive(thread({ status: 'snoozed', snoozeUntil: new Date(NOW + 3600_000).toISOString() }), NOW), true);
  assert.equal(snoozeActive(thread({ status: 'snoozed', snoozeUntil: new Date(NOW - 3600_000).toISOString() }), NOW), false);
  assert.equal(snoozeActive(thread({ status: 'open' }), NOW), false);
});

// --- nudgeCooldownElapsed ----------------------------------------------------

test('never-nudged thread has elapsed cooldown', () => {
  assert.equal(nudgeCooldownElapsed(thread({ lastNudgedAt: null }), NOW), true);
});

test('recently-nudged open-ended thread is still cooling down', () => {
  const t = thread({ lastNudgedAt: new Date(NOW - 60_000).toISOString() });
  assert.equal(nudgeCooldownElapsed(t, NOW), false);
});

test('cooldown elapsed after the full window on an open-ended thread', () => {
  const t = thread({ lastNudgedAt: new Date(NOW - NUDGE_COOLDOWN_MS - 1000).toISOString() });
  assert.equal(nudgeCooldownElapsed(t, NOW), true);
});

test('overdue threads use the shorter near cooldown', () => {
  // nudged 3h ago — past the 2h near-cooldown but inside the 6h base cooldown.
  const t = thread({
    dueAt: new Date(NOW - 3600_000).toISOString(),
    lastNudgedAt: new Date(NOW - 3 * 3600_000).toISOString(),
  });
  assert.equal(nudgeCooldownElapsed(t, NOW), true);
});

// --- nextEscalationAction ----------------------------------------------------

test('resolved / dropped threads never escalate', () => {
  assert.equal(nextEscalationAction(thread({ status: 'done', dueAt: new Date(NOW - 3600_000).toISOString() }), NOW).kind, 'none');
  assert.equal(nextEscalationAction(thread({ status: 'dropped', dueAt: new Date(NOW - 3600_000).toISOString() }), NOW).kind, 'none');
});

test('an actively-snoozed thread does not escalate', () => {
  const t = thread({ status: 'snoozed', snoozeUntil: new Date(NOW + 3600_000).toISOString(), dueAt: new Date(NOW - 3600_000).toISOString() });
  assert.equal(nextEscalationAction(t, NOW).kind, 'none');
});

test('two snoozes flips escalation to a decision', () => {
  const t = thread({ snoozeCount: SNOOZE_FLIP_THRESHOLD, dueAt: new Date(NOW - 3600_000).toISOString() });
  assert.equal(nextEscalationAction(t, NOW).kind, 'decision');
});

test('overdue + cooldown-elapsed yields a nudge marked overdue', () => {
  const t = thread({ dueAt: new Date(NOW - 3600_000).toISOString(), lastNudgedAt: null });
  const action = nextEscalationAction(t, NOW);
  assert.equal(action.kind, 'nudge');
  assert.equal(action.kind === 'nudge' && action.overdue, true);
});

test('due-soon + cooldown-elapsed yields a non-overdue nudge', () => {
  const t = thread({ dueAt: new Date(NOW + 3600_000).toISOString(), lastNudgedAt: null });
  const action = nextEscalationAction(t, NOW);
  assert.equal(action.kind, 'nudge');
  assert.equal(action.kind === 'nudge' && action.overdue, false);
});

test('open-ended thread with no due date never nudges on a clock', () => {
  assert.equal(nextEscalationAction(thread({ dueAt: null }), NOW).kind, 'none');
});

test('overdue but still cooling down does not nudge', () => {
  const t = thread({ dueAt: new Date(NOW - 3600_000).toISOString(), lastNudgedAt: new Date(NOW - 60_000).toISOString() });
  assert.equal(nextEscalationAction(t, NOW).kind, 'none');
});

// --- newThreadId -------------------------------------------------------------

test('newThreadId is prefixed and reasonably unique', () => {
  const a = newThreadId(NOW);
  const b = newThreadId(NOW);
  assert.match(a, /^th-/);
  assert.notEqual(a, b);
});
