import { test } from 'vitest';
import assert from 'node:assert/strict';

import { summarizeRuns, renderLearnProposals, capLearnings } from '../learn.ts';
import type { LearnProposal } from '../learn.ts';
import type { RunRecord } from '../runs.ts';

function run(over: Partial<RunRecord> = {}): RunRecord {
  return {
    id: 'run-x',
    ts: new Date().toISOString(),
    goal: 'g',
    subtaskId: 'st-1',
    worker: 'research-worker',
    status: 'completed',
    score: 85,
    criticSummary: 'ok',
    criticIssues: [],
    revised: false,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
    durationMs: 0,
    error: null,
    ...over,
  };
}

test('summarizeRuns groups by worker and counts outcomes', () => {
  const runs = [
    run({ worker: 'research-worker', status: 'completed', score: 90 }),
    run({ worker: 'research-worker', status: 'needs-revision', score: 60 }),
    run({ worker: 'comms-drafter', status: 'failed', score: null }),
  ];
  const s = summarizeRuns(runs);
  const research = s.find((x) => x.worker === 'research-worker')!;
  assert.equal(research.total, 2);
  assert.equal(research.completed, 1);
  assert.equal(research.needsRevision, 1);
  assert.equal(research.avgScore, 75); // (90+60)/2
  const comms = s.find((x) => x.worker === 'comms-drafter')!;
  assert.equal(comms.failed, 1);
  assert.equal(comms.avgScore, null); // no scored runs
});

test('summarizeRuns ranks recurring critic issues by frequency', () => {
  const runs = [
    run({ criticIssues: ['high: missed RLS impact', 'low: nit'] }),
    run({ criticIssues: ['high: missed RLS impact'] }),
    run({ criticIssues: ['high: missed RLS impact', 'med: vague'] }),
  ];
  const s = summarizeRuns(runs);
  const top = s[0].topIssues;
  assert.equal(top[0].issue, 'high: missed RLS impact');
  assert.equal(top[0].count, 3);
});

test('summarizeRuns sorts workers by total runs desc', () => {
  const runs = [
    run({ worker: 'comms-drafter' }),
    run({ worker: 'research-worker' }),
    run({ worker: 'research-worker' }),
  ];
  const s = summarizeRuns(runs);
  assert.equal(s[0].worker, 'research-worker');
});

test('renderLearnProposals handles empty + populated', () => {
  assert.match(renderLearnProposals([]), /No worker learnings/);
  const proposals: LearnProposal[] = [
    { id: 'lp-1', target: 'research-worker', summary: 'cite paths', learning: 'Always cite the file path.', rationale: 'x3 missed RLS' },
  ];
  const out = renderLearnProposals(proposals);
  assert.match(out, /lp-1 \(research-worker\)/);
  assert.match(out, /Always cite the file path/);
  assert.match(out, /y all/);
});

// =========================
// capLearnings — doc 770 MED (bounded + deduped worker-prompt learnings)
// =========================

test('capLearnings keeps the header and the most recent N bullets', () => {
  const header = '# Learnings for research-worker\n\nAppended by ZOE.\n';
  const bullets = Array.from({ length: 50 }, (_, i) => `- (2026-05-${String((i % 28) + 1).padStart(2, '0')}) lesson ${i}`);
  const out = capLearnings(`${header}${bullets.join('\n')}\n`, 30);
  assert.match(out, /# Learnings for research-worker/);
  const kept = out.split('\n').filter((l) => l.trimStart().startsWith('- '));
  assert.equal(kept.length, 30);
  assert.match(out, /lesson 49/); // newest kept
  assert.doesNotMatch(out, /lesson 0\b/); // oldest dropped
});

test('capLearnings dedupes identical learning text (ignoring the date prefix)', () => {
  const raw = [
    '# Learnings',
    '- (2026-05-01) always cite sources',
    '- (2026-05-20) Always cite sources', // dup (case-insensitive, different date)
    '- (2026-05-21) keep it short',
  ].join('\n');
  const out = capLearnings(raw, 30);
  const kept = out.split('\n').filter((l) => l.trimStart().startsWith('- '));
  assert.equal(kept.length, 2);
});

test('capLearnings returns empty for empty input', () => {
  assert.equal(capLearnings(''), '');
  assert.equal(capLearnings('   \n  '), '');
});
