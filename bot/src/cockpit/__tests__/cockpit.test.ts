import { describe, it, expect } from 'vitest';
import { topThree, needsYou, blocked, findStale, buildProposals, priorityRank, daysSince, STALE_DAYS, filterReviewPRs, isHandoff, partitionHandoffs, toHandoff } from '../adapters';
import { formatCockpitBrief } from '../brief';
import type { CockpitTask, CockpitBrief } from '../types';

const DAY = 86_400_000;
const NOW = Date.parse('2026-07-09T12:00:00Z');

function task(o: Partial<CockpitTask> & { id: string; title: string }): CockpitTask {
  return {
    status: 'todo',
    priority: null,
    due: null,
    project: null,
    legacy_id: null,
    legacy_source: null,
    notes: null,
    next_owner: null,
    updated_at: new Date(NOW).toISOString(),
    created_at: new Date(NOW).toISOString(),
    ...o,
  };
}

describe('priorityRank', () => {
  it('parses P0-P9, defaults 5', () => {
    expect(priorityRank('P0')).toBe(0);
    expect(priorityRank('p1')).toBe(1);
    expect(priorityRank(null)).toBe(5);
    expect(priorityRank('urgent')).toBe(5);
  });
});

describe('daysSince', () => {
  it('returns Infinity for null/bad dates', () => {
    expect(daysSince(null, NOW)).toBe(Number.POSITIVE_INFINITY);
    expect(daysSince('not-a-date', NOW)).toBe(Number.POSITIVE_INFINITY);
  });
  it('computes whole days', () => {
    expect(Math.round(daysSince(new Date(NOW - 5 * DAY).toISOString(), NOW))).toBe(5);
  });
});

describe('topThree', () => {
  it('soonest due first, undated last, caps at 3', () => {
    const tasks = [
      task({ id: '1', title: 'no due' }),
      task({ id: '2', title: 'later', due: '2026-07-20' }),
      task({ id: '3', title: 'soon', due: '2026-07-10' }),
      task({ id: '4', title: 'sooner', due: '2026-07-09' }),
    ];
    const t = topThree(tasks);
    expect(t.map((x) => x.id)).toEqual(['4', '3', '2']);
  });
});

describe('needsYou', () => {
  it('picks next_owner=me and unrouted P0/P1', () => {
    const tasks = [
      task({ id: 'a', title: 'mine', next_owner: 'me' }),
      task({ id: 'b', title: 'agent', next_owner: 'agent' }),
      task({ id: 'c', title: 'hot unrouted', priority: 'P1' }),
      task({ id: 'd', title: 'cold unrouted', priority: 'P3' }),
    ];
    expect(needsYou(tasks).map((x) => x.id).sort()).toEqual(['a', 'c']);
  });
});

describe('blocked', () => {
  it('picks next_owner=blocked', () => {
    const tasks = [task({ id: 'a', title: 'x', next_owner: 'blocked' }), task({ id: 'b', title: 'y' })];
    expect(blocked(tasks).map((x) => x.id)).toEqual(['a']);
  });
});

describe('findStale', () => {
  it('flags undated P1 and no-update-in-14d, skips recurring', () => {
    const tasks = [
      task({ id: 'a', title: 'undated hot', priority: 'P0' }),
      task({ id: 'b', title: 'cold', updated_at: new Date(NOW - (STALE_DAYS + 1) * DAY).toISOString(), created_at: new Date(NOW - 30 * DAY).toISOString() }),
      task({ id: 'c', title: '[recurring] standup', updated_at: new Date(NOW - 60 * DAY).toISOString() }),
      task({ id: 'd', title: 'fresh dated', due: '2026-07-15', priority: 'P1' }),
    ];
    expect(findStale(tasks, NOW).map((x) => x.id).sort()).toEqual(['a', 'b']);
  });
});

describe('buildProposals', () => {
  it('proposes owner for untagged and archive for very-stale', () => {
    const tasks = [
      task({ id: 'a', title: 'wavewarz thing' }), // untagged -> set_owner
      task({ id: 'b', title: 'tagged', next_owner: 'agent' }), // skip
      task({ id: 'c', title: 'ancient', next_owner: 'review', updated_at: new Date(NOW - (STALE_DAYS * 2 + 1) * DAY).toISOString(), created_at: new Date(NOW - 90 * DAY).toISOString() }),
    ];
    const p = buildProposals(tasks, NOW);
    expect(p.some((x) => x.taskId === 'a' && x.kind === 'set_owner')).toBe(true);
    expect(p.some((x) => x.taskId === 'c' && x.kind === 'archive_stale')).toBe(true);
    expect(p.some((x) => x.taskId === 'b')).toBe(false);
  });
});

describe('formatCockpitBrief', () => {
  it('renders sections + counts, no emojis/em dashes', () => {
    const b: CockpitBrief = {
      date: '2026-07-09',
      top3: [task({ id: '1', title: 'do this', due: '2026-07-09', priority: 'P0' })],
      needsYou: [task({ id: '2', title: 'your call', next_owner: 'me' })],
      needsReview: [
        {
          repo: 'ZAODEVZ/ZAOcowork',
          number: 174,
          title: 'GEO FAQ page',
          url: 'https://github.com/ZAODEVZ/ZAOcowork/pull/174',
          draft: false,
          createdAt: '2026-07-10T05:00:00Z',
        },
      ],
      handoffs: [
        { taskId: 'h1', slug: 'zao-whitepapers', title: 'Papers terminal', note: '12 drafts live, needs ZABAL call', createdAt: '2026-07-10T06:00:00Z' },
      ],
      captures: [
        { taskId: 'c1', slug: 'flow-app', title: 'Flow energy meter app', createdAt: '2026-07-11T00:00:00Z', ageDays: 1, stale: false },
        { taskId: 'c2', slug: 'old-idea', title: 'An idea I hoarded', createdAt: '2026-06-25T00:00:00Z', ageDays: 16, stale: true },
      ],
      stale: [],
      blocked: [],
      counts: { open: 2, needsYou: 1, needsReview: 1, handoffs: 1, captures: 2, stale: 0, blocked: 0 },
      proposedWrites: [],
    };
    const out = formatCockpitBrief(b);
    expect(out).toContain('Cockpit - 2026-07-09');
    expect(out).toContain('DO FIRST');
    expect(out).toContain('NEEDS YOU');
    expect(out).toContain('NEEDS YOUR REVIEW');
    expect(out).toContain('ZAODEVZ/ZAOcowork #174');
    expect(out).toContain('1 PRs to review');
    expect(out).toContain('HANDOFFS (from other terminals)');
    expect(out).toContain('zao-whitepapers: Papers terminal');
    expect(out).toContain('1 handoffs');
    expect(out).toContain('IDEA INBOX (captures)');
    expect(out).toContain('Flow energy meter app');
    expect(out).toContain('STALE 16d'); // collector's-fallacy flag
    expect(out).toContain('1 stale, ship or drop');
    expect(out).toContain('2 captures');
    expect(out).not.toMatch(/[—\u{1F300}-\u{1FAFF}]/u); // no em dash, no emoji
  });
});

describe('handoff helpers', () => {
  it('isHandoff detects the legacy_source marker', () => {
    expect(isHandoff(task({ id: '1', title: 'x', legacy_source: 'handoff:papers' }))).toBe(true);
    expect(isHandoff(task({ id: '2', title: 'y', legacy_source: 'meeting:foo' }))).toBe(false);
    expect(isHandoff(task({ id: '3', title: 'z' }))).toBe(false);
  });
  it('partitionHandoffs splits handoffs from regular tasks', () => {
    const tasks = [
      task({ id: 'a', title: 'real task' }),
      task({ id: 'b', title: 'handed off', legacy_source: 'handoff:papers' }),
    ];
    const { handoffs, rest } = partitionHandoffs(tasks);
    expect(handoffs.map((t) => t.id)).toEqual(['b']);
    expect(rest.map((t) => t.id)).toEqual(['a']);
  });
  it('toHandoff parses slug + carries note', () => {
    const h = toHandoff(task({ id: 'b', title: 'Papers', legacy_source: 'handoff:zao-whitepapers', notes: 'open items' }));
    expect(h).toMatchObject({ taskId: 'b', slug: 'zao-whitepapers', title: 'Papers', note: 'open items' });
  });
});

describe('filterReviewPRs', () => {
  it('drops drafts + do-not-merge, parses repo, sorts newest first', () => {
    const rows = [
      {
        repository_url: 'https://api.github.com/repos/bettercallzaal/ZAOOS',
        number: 10,
        title: 'old fix',
        html_url: 'u10',
        draft: false,
        created_at: '2026-07-01T00:00:00Z',
      },
      {
        repository_url: 'https://api.github.com/repos/ZAODEVZ/ZAOcowork',
        number: 20,
        title: 'new feature',
        html_url: 'u20',
        draft: false,
        created_at: '2026-07-10T00:00:00Z',
      },
      {
        repository_url: 'https://api.github.com/repos/x/y',
        number: 30,
        title: 'WIP do not touch',
        html_url: 'u30',
        draft: false,
        created_at: '2026-07-11T00:00:00Z',
      },
      {
        repository_url: 'https://api.github.com/repos/x/y',
        number: 40,
        title: 'a draft one',
        html_url: 'u40',
        draft: true,
        created_at: '2026-07-12T00:00:00Z',
      },
    ];
    const out = filterReviewPRs(rows);
    expect(out.map((p) => p.number)).toEqual([20, 10]); // draft + WIP dropped, newest first
    expect(out[0].repo).toBe('ZAODEVZ/ZAOcowork');
  });
});
