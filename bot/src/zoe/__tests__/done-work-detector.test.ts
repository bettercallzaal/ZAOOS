import { describe, expect, it } from 'vitest';
import {
  capCloses,
  findVacuousReviewReminders,
  MAX_CLOSES_PER_RUN,
  planAutoCloses,
  trackedDocNum,
  trackedPrNum,
  type OpenTask,
  type RepoFacts,
} from '../done-work-detector';

const facts = (over: Partial<RepoFacts> = {}): RepoFacts => ({
  mergedPrNums: new Set<string>(),
  closedUnmergedPrNums: new Set<string>(),
  mergedDocNums: new Set<string>(),
  ...over,
});

const task = (title: string, legacySource?: string, id = 't1'): OpenTask => ({ id, title, legacySource });

describe('trackedPrNum / trackedDocNum - legacy_source only', () => {
  it('reads the PR from legacy_source', () => {
    expect(trackedPrNum(task('anything at all', 'pr-auto:2867'))).toBe('2867');
  });

  it('reads the doc from legacy_source', () => {
    expect(trackedDocNum(task('anything at all', 'research-doc:2207'))).toBe('2207');
  });

  // The defect that nearly shipped. A number in a title is a CITATION - the doc
  // is where the ask is written down, not the ask itself.
  it.each([
    'Build zao-claude-kit open-source repo via opensource-pipeline (doc 946)',
    'Name Site Lead + First Aid Lead for ZAOstock Oct 3 (doc 1032)',
    'Decide: publish doc 1168 to zao-papers',
    'Test plan: PR #2867 - doc 2207: media-to-drive archive',
  ])('never reads a number out of the title: %s', (t) => {
    expect(trackedDocNum(task(t))).toBeNull();
    expect(trackedPrNum(task(t))).toBeNull();
  });

  it('rejects a legacy_source that merely contains the pattern', () => {
    expect(trackedPrNum(task('x', 'meeting:pr-auto:2867'))).toBeNull();
    expect(trackedDocNum(task('x', 'research-doc:2207-extra'))).toBeNull();
  });
});

describe('planAutoCloses - closes only on a state change AFTER the task was born', () => {
  it('closes a PR task when the PR merged', () => {
    const v = planAutoCloses([task('Test plan: PR #2867', 'pr-auto:2867')], facts({ mergedPrNums: new Set(['2867']) }));
    expect(v).toHaveLength(1);
    expect(v[0].reason).toContain('#2867 is merged');
  });

  it('closes a PR task when the PR was closed WITHOUT merging, and says which', () => {
    const v = planAutoCloses([task('Test plan: PR #2870', 'pr-auto:2870')], facts({ closedUnmergedPrNums: new Set(['2870']) }));
    expect(v[0].reason).toContain('closed without merging');
    expect(v[0].reason).toContain('abandoned');
    expect(v[0].reason).not.toContain('is merged into main');
  });

  it('leaves an OPEN PR alone', () => {
    expect(planAutoCloses([task('Test plan: PR #2952', 'pr-auto:2952')], facts({ mergedPrNums: new Set(['2867']) }))).toEqual([]);
  });

  // THE CORE SAFETY PROPERTY. A stale repo or an unreachable API yields empty
  // facts, and empty facts must close nothing.
  it('closes NOTHING on empty facts', () => {
    const tasks = [
      task('Test plan: PR #2867', 'pr-auto:2867', 'a'),
      task('Review research doc 2207', 'research-doc:2207', 'b'),
      task('Decide agent-token economics', undefined, 'c'),
    ];
    expect(planAutoCloses(tasks, facts())).toEqual([]);
  });

  // THE VACUOUS-RULE REGRESSION. Measured 2026-08-08: 25 of 25 open doc-review
  // tasks pointed at an already-merged doc, because the writer creates the task
  // when the doc ships. A condition true at birth is not evidence.
  it('NEVER closes a doc-review task, even when the doc is merged', () => {
    const v = planAutoCloses(
      [task('Review research doc 2207 - Media to drive', 'research-doc:2207')],
      facts({ mergedDocNums: new Set(['2207']) }),
    );
    expect(v).toEqual([]);
  });

  // The four titles that would have been wrongly closed by the title regex.
  it('NEVER closes live work that merely cites a doc', () => {
    const cited = [
      task('Build zao-claude-kit open-source repo via opensource-pipeline (doc 946)', 'inbox', 'a'),
      task('Name Site Lead + First Aid Lead for ZAOstock Oct 3 (doc 1032)', 'inbox', 'b'),
      task('zaalcaster: one-pager + landing (from doc 988)', 'zaal-master', 'c'),
      task('ZOE TG upgrade phase 1b: REACTIONS API approvals (doc 1134)', 'escalated', 'd'),
    ];
    const all = facts({ mergedDocNums: new Set(['946', '1032', '988', '1134']), mergedPrNums: new Set(['946']) });
    expect(planAutoCloses(cited, all)).toEqual([]);
  });

  it('never closes a task that names no artefact - most of the board', () => {
    const v = planAutoCloses([task('Post to ZAO Festivals LinkedIn', 'inbox')], facts({ mergedPrNums: new Set(['244']) }));
    expect(v).toEqual([]);
  });

  it('handles a batch, closing only the concluded PRs', () => {
    const v = planAutoCloses(
      [
        task('Test plan: PR #2867', 'pr-auto:2867', 'a'),
        task('Test plan: PR #2952', 'pr-auto:2952', 'b'),
        task('Review research doc 2207', 'research-doc:2207', 'c'),
        task('Decide something human', 'inbox', 'd'),
      ],
      facts({ mergedPrNums: new Set(['2867']), mergedDocNums: new Set(['2207']) }),
    );
    expect(v.map((x) => x.id)).toEqual(['a']);
  });

  it('every verdict carries a reason - a close nobody can explain is untrustworthy', () => {
    const v = planAutoCloses([task('Test plan: PR #2867', 'pr-auto:2867')], facts({ mergedPrNums: new Set(['2867']) }));
    expect(v[0].reason.length).toBeGreaterThan(20);
  });
});

describe('findVacuousReviewReminders - reports, never closes', () => {
  it('finds doc-review reminders whose doc was already merged at birth', () => {
    const found = findVacuousReviewReminders(
      [
        task('Review research doc 2207', 'research-doc:2207', 'a'),
        task('Review research doc 9999', 'research-doc:9999', 'b'),
        task('Build a thing (doc 946)', 'inbox', 'c'),
      ],
      facts({ mergedDocNums: new Set(['2207', '946']) }),
    );
    expect(found.map((t) => t.id)).toEqual(['a']);
  });

  it('is a separate function from the close path, so a report can never close', () => {
    const tasks = [task('Review research doc 2207', 'research-doc:2207')];
    const f = facts({ mergedDocNums: new Set(['2207']) });
    expect(findVacuousReviewReminders(tasks, f)).toHaveLength(1);
    expect(planAutoCloses(tasks, f)).toHaveLength(0);
  });
});

describe('capCloses - blast radius, not performance', () => {
  const many = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `t${i}`, title: `t${i}`, reason: 'merged' }));

  it('passes a small batch through untouched', () => {
    const { toClose, deferred } = capCloses(many(5));
    expect(toClose).toHaveLength(5);
    expect(deferred).toBe(0);
  });

  it('caps a large batch and reports what it deferred', () => {
    const { toClose, deferred } = capCloses(many(100));
    expect(toClose).toHaveLength(MAX_CLOSES_PER_RUN);
    expect(deferred).toBe(100 - MAX_CLOSES_PER_RUN);
  });

  it('never silently drops the overflow', () => {
    const { toClose, deferred } = capCloses(many(30));
    expect(toClose.length + deferred).toBe(30);
  });
});
