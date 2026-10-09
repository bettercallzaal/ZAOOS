import { test } from 'vitest';
import assert from 'node:assert/strict';

import { CliAuthError, CliError } from '../../hermes/claude-cli.ts';
import { attemptRevision, MIN_REVISION_BUDGET_USD, revisionBudget, shouldRevise } from '../workers.ts';

// =========================
// revisionBudget — doc 770 MED (critic-fail no longer doubles the cap)
// =========================

test('revision gets the remaining budget under the cap', () => {
  assert.equal(revisionBudget(1.0, 0.4), 0.6);
});

test('revision budget never goes negative when the first call hit the cap', () => {
  assert.equal(revisionBudget(1.0, 1.0), 0);
  assert.equal(revisionBudget(1.0, 1.5), 0);
});

// =========================
// Card 10319 - the revision floor was below the cost of one turn
// =========================

// Verbatim from the VPS journal, 2026-10-09 10:02 UTC: the work-loop revision
// for "Investigate sound gear in Ellsworth" was refused after turn one.
const REFUSED_REVISION_COST_USD = 0.2754075;
const REFUSED_REVISION_ERROR =
  "claude CLI exited 1 [budget: per-call budget cap (--max-budget-usd) refused before the first API call - the caller's maxBudgetUsd is below the minimum cost of its own prompt]";

test('the floor is above what the refused revision turn cost', () => {
  assert.ok(MIN_REVISION_BUDGET_USD > REFUSED_REVISION_COST_USD);
});

test('a first pass that leaves less than one turn of budget skips the revision', () => {
  // A $1.00 research cap after a $0.93 first pass (measured 2026-08-14).
  assert.equal(shouldRevise(revisionBudget(1.0, 0.93)), false);
  assert.equal(shouldRevise(revisionBudget(1.0, 0.4)), true);
});

test('a revision refused for budget returns null so the first pass is kept', async () => {
  const skipped: string[] = [];
  const r = await attemptRevision(
    () => Promise.reject(new CliError(REFUSED_REVISION_ERROR, 'budget')),
    (m) => skipped.push(m),
  );
  assert.equal(r, null);
  assert.deepEqual(skipped, [REFUSED_REVISION_ERROR]);
});

test('a successful revision is returned unchanged', async () => {
  assert.equal(await attemptRevision(() => Promise.resolve('second pass')), 'second pass');
});

test('an auth error during revision still propagates', async () => {
  await assert.rejects(
    attemptRevision(() => Promise.reject(new CliAuthError('Not logged in'))),
    CliAuthError,
  );
});
