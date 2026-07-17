// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

const mockClassifyTask = vi.hoisted(() => vi.fn());
vi.mock('../../zoe/task-classifier', () => ({ classifyTask: mockClassifyTask }));

import {
  blocked,
  buildProposals,
  CAPTURE_STALE_DAYS,
  daysSince,
  filterReviewPRs,
  findStale,
  isCapture,
  isHandoff,
  needsYou,
  partitionCaptures,
  partitionHandoffs,
  priorityRank,
  STALE_DAYS,
  toCapture,
  toHandoff,
  topThree,
} from '../adapters';
import type { CockpitTask } from '../types';

// 2026-07-17 noon UTC — deterministic reference for all time-based tests.
const NOW = new Date('2026-07-17T12:00:00Z').getTime();

function makeTask(overrides: Partial<CockpitTask> = {}): CockpitTask {
  return {
    id: 'task-1',
    title: 'Fix the thing',
    status: 'in_progress',
    priority: 'P2',
    due: null,
    project: 'ZAO',
    legacy_id: null,
    legacy_source: null,
    notes: null,
    next_owner: null,
    updated_at: '2026-07-16T00:00:00Z', // 1 day ago — not stale
    created_at: '2026-07-16T00:00:00Z',
    ...overrides,
  };
}

// ── filterReviewPRs ───────────────────────────────────────────────────────────

describe('filterReviewPRs', () => {
  it('drops draft PRs', () => {
    const result = filterReviewPRs([{ draft: true, number: 1, title: 'Draft thing', repository_url: 'https://api.github.com/repos/owner/repo', html_url: 'u', created_at: '2026-01-01' }]);
    expect(result).toHaveLength(0);
  });

  it('drops PRs with "do not merge" in the title (case-insensitive)', () => {
    const result = filterReviewPRs([{ draft: false, number: 2, title: 'DO NOT MERGE: testing', repository_url: 'r', html_url: 'u', created_at: '2026-01-01' }]);
    expect(result).toHaveLength(0);
  });

  it('drops PRs with "wip" in the title', () => {
    const result = filterReviewPRs([{ draft: false, number: 3, title: 'WIP: early draft', repository_url: 'r', html_url: 'u', created_at: '2026-01-01' }]);
    expect(result).toHaveLength(0);
  });

  it('normalizes repository_url to "owner/repo" format', () => {
    const result = filterReviewPRs([{
      draft: false,
      number: 10,
      title: 'Add feature',
      repository_url: 'https://api.github.com/repos/bettercallzaal/ZAOOS',
      html_url: 'https://github.com/bettercallzaal/ZAOOS/pull/10',
      created_at: '2026-07-01T00:00:00Z',
    }]);
    expect(result[0].repo).toBe('bettercallzaal/ZAOOS');
    expect(result[0].number).toBe(10);
    expect(result[0].draft).toBe(false);
  });

  it('sorts newest first by createdAt', () => {
    const rows = [
      { draft: false, number: 1, title: 'Old PR', repository_url: 'r', html_url: 'u', created_at: '2026-01-01T00:00:00Z' },
      { draft: false, number: 2, title: 'New PR', repository_url: 'r', html_url: 'u', created_at: '2026-07-01T00:00:00Z' },
    ];
    const result = filterReviewPRs(rows);
    expect(result[0].number).toBe(2);
    expect(result[1].number).toBe(1);
  });
});

// ── isHandoff / partitionHandoffs / toHandoff ─────────────────────────────────

describe('isHandoff', () => {
  it('returns true for legacy_source starting with "handoff:"', () => {
    expect(isHandoff(makeTask({ legacy_source: 'handoff:zao-music' }))).toBe(true);
  });

  it('returns false for null legacy_source', () => {
    expect(isHandoff(makeTask({ legacy_source: null }))).toBe(false);
  });

  it('returns false for "inbox:" prefix', () => {
    expect(isHandoff(makeTask({ legacy_source: 'inbox:idea-1' }))).toBe(false);
  });
});

describe('partitionHandoffs', () => {
  it('splits handoff tasks from the rest', () => {
    const tasks = [
      makeTask({ id: 'h1', legacy_source: 'handoff:slug-1' }),
      makeTask({ id: 'r1', legacy_source: null }),
      makeTask({ id: 'h2', legacy_source: 'handoff:slug-2' }),
    ];
    const { handoffs, rest } = partitionHandoffs(tasks);
    expect(handoffs.map((t) => t.id)).toEqual(['h1', 'h2']);
    expect(rest.map((t) => t.id)).toEqual(['r1']);
  });
});

describe('toHandoff', () => {
  it('extracts slug from legacy_source and maps fields', () => {
    const t = makeTask({ id: 'h1', legacy_source: 'handoff:zao-whitepapers', notes: 'write them', created_at: '2026-07-01T00:00:00Z' });
    const h = toHandoff(t);
    expect(h.taskId).toBe('h1');
    expect(h.slug).toBe('zao-whitepapers');
    expect(h.note).toBe('write them');
    expect(h.createdAt).toBe('2026-07-01T00:00:00Z');
  });

  it('uses "unknown" slug when legacy_source has no slug part', () => {
    const h = toHandoff(makeTask({ legacy_source: 'handoff:' }));
    expect(h.slug).toBe('unknown');
  });
});

// ── isCapture / partitionCaptures / toCapture ─────────────────────────────────

describe('isCapture', () => {
  it('returns true for legacy_source starting with "inbox:"', () => {
    expect(isCapture(makeTask({ legacy_source: 'inbox:big-idea' }))).toBe(true);
  });

  it('returns false for null legacy_source', () => {
    expect(isCapture(makeTask({ legacy_source: null }))).toBe(false);
  });

  it('returns false for "handoff:" prefix', () => {
    expect(isCapture(makeTask({ legacy_source: 'handoff:thing' }))).toBe(false);
  });
});

describe('partitionCaptures', () => {
  it('splits capture tasks from the rest', () => {
    const tasks = [
      makeTask({ id: 'c1', legacy_source: 'inbox:idea-1' }),
      makeTask({ id: 'r1', legacy_source: null }),
    ];
    const { captures, rest } = partitionCaptures(tasks);
    expect(captures[0].id).toBe('c1');
    expect(rest[0].id).toBe('r1');
  });
});

describe('toCapture', () => {
  it('marks recent captures as not stale', () => {
    const recentIso = new Date(NOW - 2 * 86_400_000).toISOString(); // 2 days ago
    const t = makeTask({ legacy_source: 'inbox:fresh', created_at: recentIso });
    const c = toCapture(t, NOW);
    expect(c.stale).toBe(false);
    expect(c.ageDays).toBe(2);
  });

  it(`marks captures older than CAPTURE_STALE_DAYS (${CAPTURE_STALE_DAYS}) as stale`, () => {
    const oldIso = new Date(NOW - (CAPTURE_STALE_DAYS + 1) * 86_400_000).toISOString();
    const t = makeTask({ legacy_source: 'inbox:old', created_at: oldIso });
    const c = toCapture(t, NOW);
    expect(c.stale).toBe(true);
    expect(c.ageDays).toBeGreaterThanOrEqual(CAPTURE_STALE_DAYS);
  });

  it('extracts slug from legacy_source', () => {
    const c = toCapture(makeTask({ legacy_source: 'inbox:my-idea' }), NOW);
    expect(c.slug).toBe('my-idea');
  });
});

// ── priorityRank ──────────────────────────────────────────────────────────────

describe('priorityRank', () => {
  it.each([
    ['P0', 0],
    ['P1', 1],
    ['P2', 2],
    ['P3', 3],
  ])('ranks %s → %d', (p, expected) => {
    expect(priorityRank(p)).toBe(expected);
  });

  it('returns 5 for null', () => {
    expect(priorityRank(null)).toBe(5);
  });

  it('returns 5 for non-P prefixed string', () => {
    expect(priorityRank('high')).toBe(5);
    expect(priorityRank('')).toBe(5);
  });
});

// ── daysSince ─────────────────────────────────────────────────────────────────

describe('daysSince', () => {
  it('returns Infinity for null', () => {
    expect(daysSince(null, NOW)).toBe(Number.POSITIVE_INFINITY);
  });

  it('returns Infinity for an invalid ISO string', () => {
    expect(daysSince('not-a-date', NOW)).toBe(Number.POSITIVE_INFINITY);
  });

  it('returns ~7 days for an ISO 7 days before now', () => {
    const sevenDaysAgo = new Date(NOW - 7 * 86_400_000).toISOString();
    expect(daysSince(sevenDaysAgo, NOW)).toBeCloseTo(7, 3);
  });

  it('returns 0 for the exact current timestamp', () => {
    expect(daysSince(new Date(NOW).toISOString(), NOW)).toBeCloseTo(0, 3);
  });
});

// ── topThree ──────────────────────────────────────────────────────────────────

describe('topThree', () => {
  it('returns at most 3 tasks', () => {
    const tasks = Array.from({ length: 5 }, (_, i) => makeTask({ id: `t${i}` }));
    expect(topThree(tasks)).toHaveLength(3);
  });

  it('sorts by due date ascending (soonest first)', () => {
    const tasks = [
      makeTask({ id: 'late', due: '2026-08-01' }),
      makeTask({ id: 'soon', due: '2026-07-18' }),
    ];
    const result = topThree(tasks);
    expect(result[0].id).toBe('soon');
  });

  it('sinks undated tasks below dated ones', () => {
    const tasks = [
      makeTask({ id: 'undated', due: null }),
      makeTask({ id: 'dated', due: '2026-07-20' }),
    ];
    const result = topThree(tasks);
    expect(result[0].id).toBe('dated');
  });

  it('breaks ties by priority (lower rank wins)', () => {
    const tasks = [
      makeTask({ id: 'lo', due: '2026-07-20', priority: 'P3' }),
      makeTask({ id: 'hi', due: '2026-07-20', priority: 'P0' }),
    ];
    expect(topThree(tasks)[0].id).toBe('hi');
  });
});

// ── needsYou ──────────────────────────────────────────────────────────────────

describe('needsYou', () => {
  it('includes tasks with next_owner="me"', () => {
    expect(needsYou([makeTask({ next_owner: 'me' })])).toHaveLength(1);
  });

  it('includes unrouted P0 tasks', () => {
    expect(needsYou([makeTask({ next_owner: null, priority: 'P0' })])).toHaveLength(1);
  });

  it('includes unrouted P1 tasks', () => {
    expect(needsYou([makeTask({ next_owner: null, priority: 'P1' })])).toHaveLength(1);
  });

  it('excludes unrouted P2 tasks', () => {
    expect(needsYou([makeTask({ next_owner: null, priority: 'P2' })])).toHaveLength(0);
  });

  it('excludes tasks routed to "agent"', () => {
    expect(needsYou([makeTask({ next_owner: 'agent' })])).toHaveLength(0);
  });
});

// ── blocked ───────────────────────────────────────────────────────────────────

describe('blocked', () => {
  it('returns tasks with next_owner="blocked"', () => {
    expect(blocked([makeTask({ next_owner: 'blocked' })])).toHaveLength(1);
  });

  it('excludes tasks with other next_owners', () => {
    expect(blocked([makeTask({ next_owner: 'me' }), makeTask({ next_owner: null })])).toHaveLength(0);
  });
});

// ── findStale ─────────────────────────────────────────────────────────────────

describe('findStale', () => {
  it('never flags recurring tasks', () => {
    const old = makeTask({ title: 'Weekly sync [standing]', updated_at: new Date(0).toISOString() });
    expect(findStale([old], NOW)).toHaveLength(0);
  });

  it(`flags undated P1 tasks (undatedHot) regardless of age`, () => {
    const t = makeTask({ priority: 'P1', due: null, updated_at: new Date(NOW - 1_000).toISOString() });
    expect(findStale([t], NOW)).toHaveLength(1);
  });

  it(`flags tasks with no update in >= STALE_DAYS (${STALE_DAYS}) days`, () => {
    const staleIso = new Date(NOW - (STALE_DAYS + 1) * 86_400_000).toISOString();
    const t = makeTask({ priority: 'P3', due: '2026-09-01', updated_at: staleIso });
    expect(findStale([t], NOW)).toHaveLength(1);
  });

  it('does not flag recently updated tasks', () => {
    const t = makeTask({ priority: 'P3', due: '2026-09-01', updated_at: new Date(NOW - 86_400_000).toISOString() });
    expect(findStale([t], NOW)).toHaveLength(0);
  });
});

// ── buildProposals ────────────────────────────────────────────────────────────

describe('buildProposals', () => {
  it('generates a set_owner proposal for untagged tasks (next_owner=null)', () => {
    mockClassifyTask.mockReturnValue({ nextOwner: 'agent' });
    const task = makeTask({ id: 'untagged', next_owner: null });
    const proposals = buildProposals([task], NOW);
    const setOwner = proposals.find((p) => p.kind === 'set_owner');
    expect(setOwner).toBeDefined();
    expect(setOwner?.taskId).toBe('untagged');
    expect(setOwner?.nextOwner).toBe('agent');
    expect(mockClassifyTask).toHaveBeenCalledWith({ title: 'Fix the thing', notes: null });
  });

  it('generates an archive_stale proposal for very old tasks (>= 2×STALE_DAYS)', () => {
    mockClassifyTask.mockReturnValue({ nextOwner: 'me' });
    const veryOldIso = new Date(NOW - (STALE_DAYS * 2 + 1) * 86_400_000).toISOString();
    const task = makeTask({ id: 'ancient', priority: 'P3', due: '2099-01-01', updated_at: veryOldIso, created_at: veryOldIso, next_owner: null });
    const proposals = buildProposals([task], NOW);
    const archive = proposals.find((p) => p.kind === 'archive_stale');
    expect(archive?.taskId).toBe('ancient');
    expect(archive?.reason).toContain('propose archive');
  });

  it('skips tasks already routed to an owner', () => {
    mockClassifyTask.mockReturnValue({ nextOwner: 'me' });
    const routed = makeTask({ next_owner: 'me' });
    const proposals = buildProposals([routed], NOW);
    expect(proposals.find((p) => p.kind === 'set_owner')).toBeUndefined();
  });
});
