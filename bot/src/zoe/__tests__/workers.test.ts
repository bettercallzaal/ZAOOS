import { test } from 'node:test';
import assert from 'node:assert/strict';

import { workerMaxBudget } from '../workers.ts';

// doc-extractor (doc 773) must be a fully-wired ClaudeWorkerKind: in the
// WorkerKind union, in WORKER_CONFIG, and thus dispatchable + budget-estimable.
test('doc-extractor is a configured worker with a positive budget cap', () => {
  const cap = workerMaxBudget('doc-extractor');
  assert.equal(typeof cap, 'number');
  assert.ok(cap > 0, 'doc-extractor should have a non-zero budget cap');
});

test('research-worker remains configured alongside doc-extractor', () => {
  assert.ok(workerMaxBudget('research-worker') > 0);
  // research-worker (web) should be capped at least as high as doc-extractor (internal).
  assert.ok(workerMaxBudget('research-worker') >= workerMaxBudget('doc-extractor'));
});
