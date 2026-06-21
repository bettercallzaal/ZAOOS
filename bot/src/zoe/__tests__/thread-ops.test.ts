import { test } from 'vitest';
import assert from 'node:assert/strict';

import { resolveDueAt, summarizeThreadOps, type ThreadOpsSummary } from '../thread-ops.ts';
import type { OpenThread } from '../threads.ts';

const NOW = Date.parse('2026-06-04T15:00:00Z'); // 11am ET

// --- resolveDueAt ------------------------------------------------------------

test('null / empty dueAt resolves to null (open-ended)', () => {
  assert.equal(resolveDueAt(null, NOW), null);
  assert.equal(resolveDueAt(undefined, NOW), null);
  assert.equal(resolveDueAt('', NOW), null);
});

test('an ISO date passes through as a timestamp', () => {
  const out = resolveDueAt('2026-06-10', NOW);
  assert.ok(out);
  assert.equal(new Date(out).getUTCFullYear(), 2026);
  assert.equal(new Date(out).getUTCMonth(), 5); // June
  assert.equal(new Date(out).getUTCDate(), 10);
});

test('"today" / "tonight" / "eod" anchor to 23:00 UTC same day', () => {
  for (const phrase of ['today', 'tonight', 'eod', 'by tonight', 'end of day']) {
    const out = resolveDueAt(phrase, NOW);
    assert.ok(out, `${phrase} should resolve`);
    assert.equal(new Date(out).getUTCHours(), 23, `${phrase} -> 23:00`);
    assert.equal(new Date(out).getUTCDate(), 4, `${phrase} -> same day`);
  }
});

test('"tomorrow" anchors to the next day', () => {
  const out = resolveDueAt('tomorrow', NOW);
  assert.ok(out);
  assert.equal(new Date(out).getUTCDate(), 5);
  assert.equal(new Date(out).getUTCHours(), 23);
});

test('"this week" / "by friday" lands a few days out', () => {
  const out = resolveDueAt('by friday', NOW);
  assert.ok(out);
  assert.ok(Date.parse(out) > NOW);
});

test('"in 3h" resolves relative to now', () => {
  const out = resolveDueAt('in 3h', NOW);
  assert.ok(out);
  assert.equal(Date.parse(out), NOW + 3 * 3600_000);
});

test('an unrecognized phrase resolves to null (tracked, never clock-nudged)', () => {
  assert.equal(resolveDueAt('someday maybe', NOW), null);
});

// --- summarizeThreadOps ------------------------------------------------------

function openedThread(id: string): OpenThread {
  return {
    id,
    summary: 's',
    sourceTurn: 's',
    createdAt: new Date(NOW).toISOString(),
    dueAt: null,
    status: 'open',
    lastNudgedAt: null,
    nudgeCount: 0,
    snoozeCount: 0,
    snoozeUntil: null,
    bonfireEpisodeId: null,
  };
}

test('summary names new tracking with the undo hint', () => {
  const s: ThreadOpsSummary = { opened: 1, resolved: 0, snoozed: 0, dropped: 0, openedThreads: [openedThread('th-a')] };
  const line = summarizeThreadOps(s);
  assert.match(line, /Tracking 1 new commitment/);
  assert.match(line, /untrack th-a/);
});

test('summary reports closes, drops, snoozes', () => {
  const s: ThreadOpsSummary = { opened: 0, resolved: 2, snoozed: 1, dropped: 1, openedThreads: [] };
  const line = summarizeThreadOps(s);
  assert.match(line, /Closed 2/);
  assert.match(line, /Dropped 1/);
  assert.match(line, /Snoozed 1/);
});

test('an empty summary is the empty string (no postscript)', () => {
  const s: ThreadOpsSummary = { opened: 0, resolved: 0, snoozed: 0, dropped: 0, openedThreads: [] };
  assert.equal(summarizeThreadOps(s), '');
});
