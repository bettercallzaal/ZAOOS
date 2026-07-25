import { describe, it, expect } from 'vitest';
import { toQueue, pickNext, formatGrill, type GrillState } from '../grill';
import type { CockpitTask, ReviewPR } from '../../cockpit/types';

function task(over: Partial<CockpitTask>): CockpitTask {
  return {
    id: '1',
    title: 'a task',
    status: 'todo',
    priority: 'P2',
    due: null,
    legacy_id: null,
    next_owner: null,
    ...over,
  } as CockpitTask;
}
function pr(over: Partial<ReviewPR>): ReviewPR {
  return { url: 'https://github.com/x/y/pull/1', title: 'a PR', ...over } as ReviewPR;
}

const emptyState: GrillState = { items: {}, activeKey: null, lastAskedAt: null };

describe('toQueue', () => {
  it('includes need-you decisions, review PRs, and blocked - ranked by urgency', () => {
    const tasks = [
      task({ id: '1', title: 'P0 decision', priority: 'P0', next_owner: 'me' }),
      task({ id: '2', title: 'not mine', next_owner: null, priority: 'P2' }), // excluded
      task({ id: '3', title: 'blocked thing', next_owner: 'blocked' }),
    ];
    const prs = [pr({ url: 'u1', title: 'review me' })];
    const q = toQueue(tasks, prs);
    const kinds = q.map((i) => i.kind);
    // P0 decision (0) < review (2) < blocked (3)
    expect(q[0].title).toBe('P0 decision');
    expect(kinds).toContain('review');
    expect(kinds).toContain('blocked');
    expect(q.map((i) => i.title)).not.toContain('not mine');
  });

  it('dedupes by key keeping the most urgent', () => {
    const tasks = [task({ id: '5', legacy_id: 'k', title: 'P1', priority: 'P1', next_owner: 'me' })];
    const q = toQueue([...tasks, ...tasks], []);
    expect(q.filter((i) => i.key === 'k')).toHaveLength(1);
  });
});

describe('pickNext', () => {
  const queue = toQueue([task({ id: '1', legacy_id: 'a', title: 'A', priority: 'P0', next_owner: 'me' })], []);

  it('picks a never-asked item', () => {
    expect(pickNext(queue, emptyState, 1000)?.key).toBe('a');
  });
  it('skips a done item', () => {
    const s: GrillState = { ...emptyState, items: { a: { askedAt: '2026-07-25T00:00:00Z', status: 'done' } } };
    expect(pickNext(queue, s, Date.now())).toBeNull();
  });
  it('does not re-nag an asked item within cooldown', () => {
    const now = Date.parse('2026-07-25T00:00:00Z');
    const s: GrillState = { ...emptyState, items: { a: { askedAt: '2026-07-25T00:00:00Z', status: 'asked' } } };
    expect(pickNext(queue, s, now + 60_000)).toBeNull(); // 1 min later, still cooling
    expect(pickNext(queue, s, now + 4 * 3600_000)?.key).toBe('a'); // 4h later, re-surface
  });
  it('re-surfaces a skipped item + respects snooze window', () => {
    const now = Date.parse('2026-07-25T00:00:00Z');
    const skipped: GrillState = { ...emptyState, items: { a: { askedAt: '2026-07-25T00:00:00Z', status: 'skipped' } } };
    expect(pickNext(queue, skipped, now)?.key).toBe('a');
    const snoozed: GrillState = { ...emptyState, items: { a: { askedAt: '2026-07-25T00:00:00Z', status: 'snoozed', snoozeUntil: '2026-07-25T06:00:00Z' } } };
    expect(pickNext(queue, snoozed, now + 3600_000)).toBeNull(); // still snoozed
    expect(pickNext(queue, snoozed, Date.parse('2026-07-25T07:00:00Z'))?.key).toBe('a'); // snooze elapsed
  });
});

describe('formatGrill', () => {
  it('frames a review as build-to-test with a link + remaining counter', () => {
    const { text, buttons } = formatGrill({ key: 'u', kind: 'review', title: 'PR X', link: 'https://gh/pr/1', priority: 2 }, 3);
    expect(text).toContain('review/test');
    expect(text).toContain('https://gh/pr/1');
    expect(text).toContain('3 more waiting');
    expect(buttons[0][0].text).toBe('Reviewed');
    expect(buttons[0].map((b) => b.data)).toEqual(['grill:done', 'grill:skip', 'grill:snooze']);
  });
  it('frames a decision plainly with no counter when none remain', () => {
    const { text } = formatGrill({ key: 'a', kind: 'decision', title: 'pick 1 or 2', priority: 0 }, 0);
    expect(text).toContain('Decision needed');
    expect(text).not.toContain('more waiting');
  });
});
