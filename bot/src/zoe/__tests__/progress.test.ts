import { test } from 'node:test';
import assert from 'node:assert/strict';

import { renderProgress, bar, fmtElapsed, type ProgressRow } from '../progress.ts';

test('bar fills proportionally to done/total', () => {
  assert.equal(bar(0, 4), '░░░░░░░░░░');
  assert.equal(bar(2, 4), '█████░░░░░'); // 50%
  assert.equal(bar(4, 4), '██████████');
  assert.equal(bar(0, 0), '░░░░░░░░░░'); // no divide-by-zero
});

test('fmtElapsed formats mm:ss', () => {
  assert.equal(fmtElapsed(0), '0:00');
  assert.equal(fmtElapsed(5000), '0:05');
  assert.equal(fmtElapsed(75000), '1:15');
});

test('renderProgress counts finished subtasks and shows scores', () => {
  const rows: ProgressRow[] = [
    { id: 'st-1', worker: 'research-worker', status: 'done', score: 58 },
    { id: 'st-2', worker: 'comms-drafter', status: 'running' },
    { id: 'st-3', worker: 'research-worker', status: 'failed' },
  ];
  const out = renderProgress(rows, 75000, { costUsd: 0.94 });
  assert.match(out, /— 2\/3/); // done(1) + failed(1) = 2 finished
  assert.match(out, /1:15/);
  assert.match(out, /\$0\.94/);
  assert.match(out, /✓ st-1 research-worker 58/);
  assert.match(out, /⏳ st-2 comms-drafter/);
  assert.match(out, /✗ st-3 research-worker/);
  // running subtask shows no score
  assert.doesNotMatch(out, /st-2 comms-drafter \d/);
});

test('renderProgress final title + all done', () => {
  const rows: ProgressRow[] = [{ id: 'st-1', worker: 'recap-agent', status: 'done', score: 90 }];
  const out = renderProgress(rows, 1000, { final: true, costUsd: 0.1 });
  assert.match(out, /Plan complete — 1\/1/);
  assert.match(out, /██████████/);
});
