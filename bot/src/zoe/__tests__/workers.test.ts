import { test } from 'node:test';
import assert from 'node:assert/strict';

import { revisionBudget } from '../workers.ts';

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
