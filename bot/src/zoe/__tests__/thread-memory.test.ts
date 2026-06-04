import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildThreadEpisodeBody, emitThreadTransition } from '../thread-memory.ts';
import { containsPii } from '../pii.ts';
import { containsSecret } from '../recall.ts';
import type { OpenThread } from '../threads.ts';

function thread(overrides: Partial<OpenThread> = {}): OpenThread {
  return {
    id: 'th-xyz',
    summary: 'ship the onepager',
    sourceTurn: "I'll ship the onepager today",
    createdAt: '2026-06-04T12:00:00Z',
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

test('open episode body names the commitment and includes the due date', () => {
  const body = buildThreadEpisodeBody(thread({ dueAt: '2026-06-04T23:00:00Z' }), 'open');
  assert.match(body, /committed to: ship the onepager/);
  assert.match(body, /Due 2026-06-04 23:00 UTC/);
});

test('open episode body omits the due clause when open-ended', () => {
  const body = buildThreadEpisodeBody(thread({ dueAt: null }), 'open');
  assert.doesNotMatch(body, /Due/);
});

test('resolved and dropped bodies read distinctly', () => {
  assert.match(buildThreadEpisodeBody(thread(), 'resolved'), /resolved a commitment/);
  assert.match(buildThreadEpisodeBody(thread(), 'dropped'), /dropped a commitment/);
});

test('a clean commitment body trips neither the PII nor the secret guard', () => {
  const body = buildThreadEpisodeBody(thread(), 'open');
  assert.equal(containsPii(body), false);
  assert.equal(containsSecret(body), false);
});

test('a summary carrying a third-party email would be caught by the PII guard', () => {
  // The emit path runs containsPii(body) and SKIPS on a hit — this asserts the
  // guard fires on the composed body so a leaky summary never reaches Bonfire.
  const body = buildThreadEpisodeBody(thread({ summary: 'email partner jane@example.com' }), 'open');
  assert.equal(containsPii(body), true);
});

test('emit is a safe no-op when Bonfire is unconfigured (test env)', async () => {
  // No BONFIRE_API_KEY/BONFIRE_ID in the test env, so emit must short-circuit
  // to no-config without any network call.
  const r = await emitThreadTransition(thread(), 'open');
  assert.equal(r.ok, false);
  assert.equal(r.skipped, 'no-config');
});
