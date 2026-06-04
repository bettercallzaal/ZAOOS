import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  scoreThreadCandidate,
  pickBest,
  passesThreshold,
  unackedInWindow,
  nextThreshold,
  DEFAULT_THRESHOLD,
  MAX_THRESHOLD,
  UNACKED_LIMIT,
  UNACKED_WINDOW_MS,
  type Candidate,
  type ProactivePush,
} from '../proactive.ts';
import type { OpenThread } from '../threads.ts';

const NOW = Date.parse('2026-06-04T18:00:00Z');

function thread(overrides: Partial<OpenThread> = {}): OpenThread {
  return {
    id: 'th-1',
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

function push(overrides: Partial<ProactivePush> = {}): ProactivePush {
  return {
    id: 'px-1',
    sentAt: new Date(NOW - 3600_000).toISOString(),
    kind: 'thread-nudge',
    acked: false,
    ...overrides,
  };
}

// --- scoreThreadCandidate ----------------------------------------------------

test('a non-escalating (open-ended) thread yields no candidate', () => {
  assert.equal(scoreThreadCandidate(thread({ dueAt: null }), NOW), null);
});

test('overdue thread scores high and is a thread-nudge', () => {
  const c = scoreThreadCandidate(thread({ dueAt: new Date(NOW - 3600_000).toISOString() }), NOW);
  assert.ok(c);
  assert.equal(c.kind, 'thread-nudge');
  assert.ok(c.score >= 0.75, `expected >=0.75, got ${c.score}`);
  assert.match(c.message, /did it land/);
});

test('overdue score climbs with how late it is, capped at 0.95', () => {
  const a = scoreThreadCandidate(thread({ dueAt: new Date(NOW - 1 * 3600_000).toISOString() }), NOW);
  const b = scoreThreadCandidate(thread({ dueAt: new Date(NOW - 5 * 3600_000).toISOString() }), NOW);
  const c = scoreThreadCandidate(thread({ dueAt: new Date(NOW - 1000 * 3600_000).toISOString() }), NOW);
  assert.ok(a && b && c);
  assert.ok(b.score > a.score);
  assert.ok(c.score <= 0.95);
});

test('due-soon thread is a 0.6 baseline nudge', () => {
  const c = scoreThreadCandidate(thread({ dueAt: new Date(NOW + 3600_000).toISOString() }), NOW);
  assert.ok(c);
  assert.equal(c.score, 0.6);
  assert.match(c.message, /still on track/);
});

test('two-snooze thread is a thread-decision at 0.8', () => {
  const c = scoreThreadCandidate(thread({ snoozeCount: 2, dueAt: new Date(NOW - 3600_000).toISOString() }), NOW);
  assert.ok(c);
  assert.equal(c.kind, 'thread-decision');
  assert.equal(c.score, 0.8);
  assert.match(c.message, /reschedule it, drop it/);
});

// --- pickBest ----------------------------------------------------------------

test('pickBest returns the single highest-scoring candidate', () => {
  const cands: Candidate[] = [
    { kind: 'thread-nudge', score: 0.6, message: 'a' },
    { kind: 'thread-decision', score: 0.8, message: 'b' },
    { kind: 'inactivity', score: 0.5, message: 'c' },
  ];
  assert.equal(pickBest(cands)?.message, 'b');
});

test('pickBest on empty is null (silent tick)', () => {
  assert.equal(pickBest([]), null);
});

// --- passesThreshold ---------------------------------------------------------

test('passesThreshold is inclusive at the boundary', () => {
  assert.equal(passesThreshold(0.6, 0.6), true);
  assert.equal(passesThreshold(0.59, 0.6), false);
});

// --- unackedInWindow ---------------------------------------------------------

test('counts only unacked pushes inside the window', () => {
  const pushes: ProactivePush[] = [
    push({ id: 'a', acked: false, sentAt: new Date(NOW - 3600_000).toISOString() }),
    push({ id: 'b', acked: true, sentAt: new Date(NOW - 3600_000).toISOString() }),
    push({ id: 'c', acked: false, sentAt: new Date(NOW - (UNACKED_WINDOW_MS + 3600_000)).toISOString() }),
  ];
  assert.equal(unackedInWindow(pushes, NOW), 1);
});

test('no pushes means zero unacked', () => {
  assert.equal(unackedInWindow([], NOW), 0);
});

// --- nextThreshold (self-throttle curve) -------------------------------------

test('threshold unchanged below the unacked limit', () => {
  assert.equal(nextThreshold(DEFAULT_THRESHOLD, UNACKED_LIMIT - 1), DEFAULT_THRESHOLD);
});

test('threshold rises by a step at/above the unacked limit', () => {
  const raised = nextThreshold(DEFAULT_THRESHOLD, UNACKED_LIMIT);
  assert.ok(raised > DEFAULT_THRESHOLD);
});

test('threshold never exceeds MAX', () => {
  assert.equal(nextThreshold(MAX_THRESHOLD, UNACKED_LIMIT + 10), MAX_THRESHOLD);
});
