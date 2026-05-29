import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseApprovalReply,
  isPendingExpired,
  PENDING_TTL_MS,
} from '../approvals.ts';
import type { PendingApproval } from '../approvals.ts';

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
    kind: 'reflexion',
    chatScope: 'private',
    createdAt,
    patches: [],
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
