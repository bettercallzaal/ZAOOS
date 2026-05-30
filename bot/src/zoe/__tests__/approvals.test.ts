import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseApprovalReply,
  isPendingExpired,
  wouldClobber,
  PENDING_TTL_MS,
} from '../approvals.ts';
import type { PendingApproval, PendingKind } from '../approvals.ts';

function pendingOf(kind: PendingKind): PendingApproval {
  return { kind, chatScope: 'private', createdAt: new Date().toISOString() } as PendingApproval;
}

// =========================
// parseApprovalReply
// =========================

test('reject phrasings resolve to reject (and beat approve)', () => {
  for (const t of ['n', 'no', 'No', 'nope', 'cancel', 'stop', 'abort', 'skip', 'nvm', 'never mind']) {
    assert.equal(parseApprovalReply(t).decision, 'reject', `"${t}" should reject`);
  }
});

test('bare approve phrasings resolve to approve-all', () => {
  for (const t of ['y', 'yes', 'yep', 'approve', 'go ahead', 'ship it', 'do it', 'lgtm']) {
    assert.equal(parseApprovalReply(t).decision, 'approve-all', `"${t}" should approve-all`);
  }
});

test('"y all" is approve-all even with ids absent', () => {
  assert.equal(parseApprovalReply('y all').decision, 'approve-all');
  assert.equal(parseApprovalReply('approve all').decision, 'approve-all');
});

test('approve with specific ids resolves to approve-ids and extracts them', () => {
  const r = parseApprovalReply('y st-1 st-3');
  assert.equal(r.decision, 'approve-ids');
  assert.deepEqual(r.ids, ['st-1', 'st-3']);

  const r2 = parseApprovalReply('approve patch-2 patch-2 patch-5'); // de-dupes
  assert.equal(r2.decision, 'approve-ids');
  assert.deepEqual(r2.ids, ['patch-2', 'patch-5']);
});

test('"y all" with ids present still approves all (all wins)', () => {
  const r = parseApprovalReply('y all st-1');
  assert.equal(r.decision, 'approve-all');
});

test('edit phrasings resolve to edit and carry the instruction', () => {
  const r = parseApprovalReply('edit: drop the comms step, add a test');
  assert.equal(r.decision, 'edit');
  assert.equal(r.editText, 'drop the comms step, add a test');

  const r2 = parseApprovalReply('actually research the pricing first');
  assert.equal(r2.decision, 'edit');
  assert.equal(r2.editText, 'research the pricing first');
});

test('non-approval messages pass through as not-an-approval', () => {
  for (const t of ['what time is it', 'tell me about doc 759', 'thanks', '']) {
    assert.equal(parseApprovalReply(t).decision, 'not-an-approval', `"${t}" should pass through`);
  }
});

test('reject is checked before approve so "no thanks" never approves', () => {
  assert.equal(parseApprovalReply('no thanks').decision, 'reject');
});

// =========================
// isPendingExpired
// =========================

function mkPending(createdAt: string): PendingApproval {
  return {
    kind: 'await-reflection',
    chatScope: 'private',
    createdAt,
  };
}

test('fresh pending is not expired', () => {
  const now = Date.now();
  const p = mkPending(new Date(now).toISOString());
  assert.equal(isPendingExpired(p, now), false);
});

test('pending older than TTL is expired', () => {
  const now = Date.now();
  const p = mkPending(new Date(now - PENDING_TTL_MS - 1000).toISOString());
  assert.equal(isPendingExpired(p, now), true);
});

test('pending exactly at TTL boundary is not yet expired', () => {
  const now = Date.now();
  const p = mkPending(new Date(now - PENDING_TTL_MS).toISOString());
  assert.equal(isPendingExpired(p, now), false);
});

test('corrupt timestamp is treated as expired', () => {
  const p = mkPending('not-a-date');
  assert.equal(isPendingExpired(p, Date.now()), true);
});

test('per-item ttlMs override extends the lifetime', () => {
  const now = Date.now();
  const p: PendingApproval = {
    kind: 'await-reflection',
    chatScope: 'private',
    createdAt: new Date(now - PENDING_TTL_MS - 1000).toISOString(),
    ttlMs: 14 * 60 * 60 * 1000, // 14h
  };
  // Older than the 30-min default, but well within the 14h override.
  assert.equal(isPendingExpired(p, now), false);
});

// =========================
// wouldClobber — doc 770 H2 regression
// A new pending must not silently clobber a live approval-bearing one of a
// different kind. Same-kind re-arm and superseding the passive await-reflection
// slot are both allowed.
// =========================

test('no existing pending never clobbers', () => {
  assert.equal(wouldClobber(undefined, 'plan'), false);
});

test('same-kind re-arm is allowed (e.g. plan -> plan after re-decompose)', () => {
  assert.equal(wouldClobber(pendingOf('plan'), 'plan'), false);
  assert.equal(wouldClobber(pendingOf('reflexion'), 'reflexion'), false);
});

test('a command/new pending may supersede the passive await-reflection slot', () => {
  // await-reflection is not approval-bearing — arming over it is allowed so a
  // plan: in the reflection window isn't blocked (keeps the H1 benefit).
  assert.equal(wouldClobber(pendingOf('await-reflection'), 'plan'), false);
  assert.equal(wouldClobber(pendingOf('await-reflection'), 'learn'), false);
});

test('a live approval-bearing pending blocks a different-kind arm', () => {
  assert.equal(wouldClobber(pendingOf('plan'), 'await-reflection'), true); // scheduler vs live plan
  assert.equal(wouldClobber(pendingOf('plan-gate'), 'learn'), true); // scheduler vs paused plan
  assert.equal(wouldClobber(pendingOf('learn'), 'plan'), true); // new plan: vs live learn
  assert.equal(wouldClobber(pendingOf('reflexion'), 'plan'), true);
});

// =========================
// parseApprovalReply — doc 770 MED tightening
// =========================

test('an approval verb anywhere overrides a leading edit prefix', () => {
  assert.equal(parseApprovalReply('actually yes do it').decision, 'approve-all');
  assert.equal(parseApprovalReply('change nothing, ship it').decision, 'approve-all');
});

test('an approval verb anywhere overrides a leading reject ("no but go ahead")', () => {
  assert.equal(parseApprovalReply('no but go ahead').decision, 'approve-all');
});

test('a bare edit keyword with no content is NOT an edit (leaves pending)', () => {
  // "wait" alone used to become edit with empty text → empty re-decompose.
  assert.equal(parseApprovalReply('wait').decision, 'not-an-approval');
});

test('edit with real instruction and no approval verb still parses as edit', () => {
  const r = parseApprovalReply('actually research the pricing first');
  assert.equal(r.decision, 'edit');
  assert.equal(r.editText, 'research the pricing first');
});
