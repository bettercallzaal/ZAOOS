// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  extractPRDecisions,
  extractTaskDecisions,
  formatPendingDecisions,
  gatherPendingDecisions,
} from '../pending-decisions';

const PAST_DATE = '2000-01-01'; // always overdue
const FUTURE_DATE = '2099-12-31'; // never overdue

// ── extractPRDecisions ────────────────────────────────────────────────────────

describe('extractPRDecisions', () => {
  it('returns [] for an empty PR list', () => {
    expect(extractPRDecisions([])).toEqual([]);
  });

  it('filters out PRs with approved or ready-to-merge labels', () => {
    const prs = [
      { number: 1, title: 'Feature A', labels: ['approved'] },
      { number: 2, title: 'Feature B', labels: ['ready-to-merge'] },
      { number: 3, title: 'Feature C', labels: ['bug'] },
    ];
    const result = extractPRDecisions(prs);
    expect(result).toHaveLength(1);
    expect(result[0].title).toContain('#3');
  });

  it('marks urgency=high for [URGENT] and [CRITICAL] title patterns', () => {
    const prs = [
      { number: 10, title: '[URGENT] Fix prod bug', labels: [] },
      { number: 11, title: '[CRITICAL] Payment broken', labels: [] },
    ];
    const result = extractPRDecisions(prs);
    expect(result[0].urgency).toBe('high');
    expect(result[1].urgency).toBe('high');
  });

  it('marks urgency=medium and kind=pr-review for plain titles', () => {
    const prs = [{ number: 20, title: 'Add new feature', labels: [] }];
    const result = extractPRDecisions(prs);
    expect(result[0].urgency).toBe('medium');
    expect(result[0].kind).toBe('pr-review');
  });
});

// ── extractTaskDecisions ──────────────────────────────────────────────────────

describe('extractTaskDecisions', () => {
  it('returns [] for an empty task list', () => {
    expect(extractTaskDecisions([])).toEqual([]);
  });

  it('includes blocked tasks as kind=task-blocked urgency=high when not overdue', () => {
    const tasks = [{ title: 'Stuck task', status: 'blocked', due: FUTURE_DATE, metadata: null }];
    const result = extractTaskDecisions(tasks);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('task-blocked');
    expect(result[0].urgency).toBe('high');
  });

  it('escalates blocked tasks to urgency=critical when overdue', () => {
    const tasks = [{ title: 'Old stuck task', status: 'blocked', due: PAST_DATE, metadata: null }];
    const result = extractTaskDecisions(tasks);
    expect(result[0].urgency).toBe('critical');
  });

  it('includes in_review tasks as kind=task-review urgency=high', () => {
    const tasks = [{ title: 'Review task', status: 'in_review', due: null, metadata: null }];
    const result = extractTaskDecisions(tasks);
    expect(result[0].kind).toBe('task-review');
    expect(result[0].urgency).toBe('high');
  });

  it('includes tasks with next_owner=me as task-review', () => {
    const tasks = [{ title: 'My task', status: 'pending', due: null, metadata: { next_owner: 'me' } }];
    const result = extractTaskDecisions(tasks);
    expect(result[0].kind).toBe('task-review');
  });

  it('skips tasks with untracked statuses (pending no owner, done, completed)', () => {
    const tasks = [
      { title: 'Pending task', status: 'pending', due: null, metadata: null },
      { title: 'Done task', status: 'done', due: null, metadata: null },
      { title: 'Completed task', status: 'completed', due: null, metadata: null },
    ];
    expect(extractTaskDecisions(tasks)).toEqual([]);
  });
});

// ── formatPendingDecisions ────────────────────────────────────────────────────

describe('formatPendingDecisions', () => {
  it('returns null for an empty list', () => {
    expect(formatPendingDecisions([])).toBeNull();
  });

  it('prefixes critical items with [!]', () => {
    const decisions = [
      { title: 'Critical thing', kind: 'task-blocked' as const, urgency: 'critical' as const },
    ];
    expect(formatPendingDecisions(decisions)).toContain('[!] Critical thing');
  });

  it('sorts critical before high before medium', () => {
    const decisions = [
      { title: 'Medium item', kind: 'pr-review' as const, urgency: 'medium' as const },
      { title: 'High item', kind: 'task-review' as const, urgency: 'high' as const },
      { title: 'Critical item', kind: 'task-blocked' as const, urgency: 'critical' as const },
    ];
    const result = formatPendingDecisions(decisions)!;
    const lines = result.split('\n');
    const critIdx = lines.findIndex((l) => l.includes('Critical item'));
    const highIdx = lines.findIndex((l) => l.includes('High item'));
    const medIdx = lines.findIndex((l) => l.includes('Medium item'));
    expect(critIdx).toBeLessThan(highIdx);
    expect(highIdx).toBeLessThan(medIdx);
  });

  it('limits output to the top 5 items', () => {
    const decisions = Array.from({ length: 8 }, (_, i) => ({
      title: `Item ${i}`,
      kind: 'pr-review' as const,
      urgency: 'medium' as const,
    }));
    const result = formatPendingDecisions(decisions)!;
    expect(result.split('\n')).toHaveLength(5);
  });

  it('includes dueDate and context in the formatted output', () => {
    const decisions = [
      {
        title: 'My task',
        kind: 'task-blocked' as const,
        urgency: 'high' as const,
        dueDate: '2026-07-20',
        context: 'awaiting merge',
      },
    ];
    const result = formatPendingDecisions(decisions)!;
    expect(result).toContain('2026-07-20');
    expect(result).toContain('awaiting merge');
  });
});

// ── gatherPendingDecisions ────────────────────────────────────────────────────

describe('gatherPendingDecisions', () => {
  it('returns null when there are no PRs or tasks', () => {
    expect(gatherPendingDecisions({ openPrs: [], teamTasks: [] })).toBeNull();
  });

  it('combines PR and task decisions into a single output', () => {
    const result = gatherPendingDecisions({
      openPrs: [{ number: 1, title: 'Some PR', labels: [] }],
      teamTasks: [{ title: 'Blocked task', status: 'blocked', due: null, metadata: null }],
    });
    expect(result).toContain('PR #1');
    expect(result).toContain('Blocked task');
  });
});
