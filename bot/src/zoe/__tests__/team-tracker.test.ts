import { describe, it, expect } from 'vitest';
import { formatTeamTasks, teamTrackerConfigured, summarizeTeamForBrief, zaalFocusForBrief, buildTeamTaskRow, capturePriority, formatTeamDigest, buildPrioritiesEpisode, buildTeamContextBlock, formatOwnerDigest, isBareCapture, splitCapturesByQuality, type TeamTask } from '../team-tracker';

// ── capture quality gate (card b8cba711) ────────────────────────────────────

describe('isBareCapture - flags empty context, does not grade prose', () => {
  it('bare: no description, empty, whitespace, or too short to carry a why', () => {
    expect(isBareCapture({ title: 'Sparq' })).toBe(true);
    expect(isBareCapture({ title: 'Colleen', description: '' })).toBe(true);
    expect(isBareCapture({ title: 'NEXUS', description: '   ' })).toBe(true);
    expect(isBareCapture({ title: 'x', description: 'call him' })).toBe(true);
  });

  it('ok: any description long enough to carry a why', () => {
    expect(
      isBareCapture({ title: 'x', description: 'Sparq asked about ZAOstock sponsorship tiers' }),
    ).toBe(false);
  });
});

describe('splitCapturesByQuality', () => {
  it('partitions without losing or reordering anything', () => {
    const a = { title: 'a', description: 'why: follow up on the artizen submission' };
    const b = { title: 'b' };
    const c = { title: 'c', description: 'done when the deck v2 is in the vault' };
    const { ok, bare } = splitCapturesByQuality([a, b, c]);
    expect(ok).toEqual([a, c]);
    expect(bare).toEqual([b]);
    expect(ok.length + bare.length).toBe(3);
  });
});

describe('formatOwnerDigest', () => {
  const members = new Map([['u1', 'zaal'], ['u2', 'iman']]);
  const tk = (o: Partial<TeamTask>): TeamTask => ({
    title: 'x', status: 'todo', priority: null, due: null, project: null, legacy_id: null, ...o,
  });

  it('filters to one person by name (case-insensitive), in-progress first', () => {
    const tasks = [
      tk({ title: 'iman UI work', status: 'in_progress', owner_id: 'u2' }),
      tk({ title: 'iman todo', status: 'todo', priority: 'P1', owner_id: 'u2' }),
      tk({ title: 'zaal thing', status: 'in_progress', owner_id: 'u1' }),
    ];
    const out = formatOwnerDigest(tasks, members, 'IMAN');
    expect(out).toContain('iman - 2 open, 1 in progress');
    expect(out).toContain('iman UI work [doing]');
    expect(out).not.toContain('zaal thing');
    expect(out.indexOf('iman UI work')).toBeLessThan(out.indexOf('iman todo'));
  });

  it('handles no-match and empty query', () => {
    expect(formatOwnerDigest([], members, '')).toMatch(/Usage/);
    expect(formatOwnerDigest([tk({ owner_id: 'u1' })], members, 'nobody')).toMatch(/No open tasks found/);
  });
});

describe('buildTeamContextBlock', () => {
  const members = new Map([['u1', 'zaal'], ['u2', 'iman']]);
  const tt = (o: Partial<TeamTask>): TeamTask => ({
    title: 'x', status: 'todo', priority: null, due: null, project: null, legacy_id: null, ...o,
  });

  it('lists in-progress items by owner, compact', () => {
    const out = buildTeamContextBlock([
      tt({ title: 'shipping board', status: 'in_progress', owner_id: 'u1' }),
      tt({ title: 'backlog item', status: 'todo', owner_id: 'u2' }),
    ], members);
    expect(out).toContain('Team board (live): 2 open');
    expect(out).toContain('In progress now:');
    expect(out).toContain('zaal: shipping board');
    expect(out).not.toContain('backlog item'); // todo not listed in the compact block
  });

  it('returns undefined when only standing items or empty', () => {
    expect(buildTeamContextBlock([], members)).toBeUndefined();
    expect(buildTeamContextBlock([tt({ title: '[standing] x', owner_id: 'u1' })], members)).toBeUndefined();
  });
});

const t = (o: Partial<TeamTask>): TeamTask => ({
  title: 'x', status: 'todo', priority: null, due: null, project: null, legacy_id: null, ...o,
});

describe('formatTeamDigest', () => {
  const members = new Map([['u1', 'zaal'], ['u2', 'iman']]);

  it('groups by owner, in-progress people first, doing before todo', () => {
    const tasks: TeamTask[] = [
      t({ title: 'iman backlog A', status: 'todo', owner_id: 'u2' }),
      t({ title: 'zaal shipping X', status: 'in_progress', owner_id: 'u1' }),
      t({ title: 'zaal todo Y', status: 'todo', priority: 'P1', owner_id: 'u1' }),
    ];
    const out = formatTeamDigest(tasks, members);
    expect(out.indexOf('zaal')).toBeLessThan(out.indexOf('iman'));
    expect(out).toContain('zaal shipping X [doing]');
    expect(out.indexOf('zaal shipping X')).toBeLessThan(out.indexOf('zaal todo Y'));
    expect(out).toContain('1 in progress now');
  });

  it('maps unknown/null owners to unassigned and sorts them last', () => {
    const tasks: TeamTask[] = [
      t({ title: 'orphan', owner_id: null }),
      t({ title: 'zaal doing', status: 'in_progress', owner_id: 'u1' }),
    ];
    const out = formatTeamDigest(tasks, members);
    expect(out).toContain('unassigned');
    expect(out.indexOf('zaal')).toBeLessThan(out.indexOf('unassigned'));
  });

  it('drops standing/recurring items and handles empty', () => {
    expect(formatTeamDigest([], members)).toMatch(/No open team tasks/);
    const onlyStanding = [t({ title: '[standing] weekly review', owner_id: 'u1' })];
    expect(formatTeamDigest(onlyStanding, members)).toMatch(/only standing/i);
  });
});

describe('buildPrioritiesEpisode', () => {
  const members = new Map([['u1', 'zaal']]);

  it('builds a rich episode from in-progress + P0/P1, with owners', () => {
    const tasks: TeamTask[] = [
      t({ title: 'shipping the board', status: 'in_progress', owner_id: 'u1' }),
      t({ title: 'p1 thing', status: 'todo', priority: 'P1', owner_id: 'u1' }),
      t({ title: 'p3 noise', status: 'todo', priority: 'P3', owner_id: 'u1' }),
    ];
    const ep = buildPrioritiesEpisode(tasks, members, '2026-08-05T12:00:00Z');
    expect(ep).not.toBeNull();
    expect(ep!.name).toBe('zao-priorities:2026-08-05');
    expect(ep!.body).toContain('In progress right now');
    expect(ep!.body).toContain('shipping the board (zaal)');
    expect(ep!.body).toContain('p1 thing');
    expect(ep!.body).not.toContain('p3 noise');
  });

  it('returns null when nothing is in progress or P0/P1', () => {
    const tasks = [t({ title: 'low', status: 'todo', priority: 'P3', owner_id: 'u1' })];
    expect(buildPrioritiesEpisode(tasks, members, '2026-08-05T12:00:00Z')).toBeNull();
  });
});

describe('zaalFocusForBrief', () => {
  it('returns null when nothing is dated and nothing needs Zaal', () => {
    const tasks: TeamTask[] = [
      { title: 'no date', status: 'todo', priority: 'P3', due: null, project: null, legacy_id: '1' },
    ];
    expect(zaalFocusForBrief(tasks)).toBeNull();
  });
  it('lists the top 3 by deadline, soonest first, and counts next_owner=me', () => {
    const tasks: TeamTask[] = [
      { title: 'C', status: 'todo', priority: 'P2', due: '2026-07-10', project: null, legacy_id: '3', metadata: { next_owner: 'me' } },
      { title: 'A', status: 'todo', priority: 'P1', due: '2026-07-07', project: null, legacy_id: '1', metadata: { next_owner: 'me' } },
      { title: 'B', status: 'todo', priority: 'P1', due: '2026-07-08', project: null, legacy_id: '2', metadata: { next_owner: 'agent' } },
      { title: 'D', status: 'todo', priority: 'P3', due: '2026-07-20', project: null, legacy_id: '4' },
    ];
    const out = zaalFocusForBrief(tasks)!;
    // soonest-first ordering, asserted on the unambiguous due-date strings
    expect(out.indexOf('2026-07-07')).toBeLessThan(out.indexOf('2026-07-08'));
    expect(out.indexOf('2026-07-08')).toBeLessThan(out.indexOf('2026-07-10'));
    expect(out).not.toContain('2026-07-20'); // D is beyond the top-3
    expect(out).toMatch(/2 tasks waiting on your call/);
  });
  it('ignores rows with a malformed due and still surfaces the needs-me count', () => {
    const tasks: TeamTask[] = [
      { title: 'bad', status: 'todo', priority: 'P1', due: 'someday', project: null, legacy_id: '1', metadata: { next_owner: 'me' } },
    ];
    const out = zaalFocusForBrief(tasks)!;
    expect(out).toMatch(/1 task waiting on your call/);
    expect(out).not.toContain('TOP 3');
  });
});

describe('summarizeTeamForBrief', () => {
  it('returns null when empty (so the brief skips the section)', () => {
    expect(summarizeTeamForBrief([])).toBeNull();
  });
  it('summarizes open/overdue and top non-recurring items', () => {
    const tasks: TeamTask[] = [
      { title: 'Daily standup [STANDING]', status: 'todo', priority: 'P1', due: null, project: null, legacy_id: '1' },
      { title: 'Ship feature', status: 'todo', priority: 'P1', due: '2020-01-01', project: null, legacy_id: '2' },
    ];
    const out = summarizeTeamForBrief(tasks)!;
    expect(out).toMatch(/2 open/);
    expect(out).toMatch(/1 overdue/);
    expect(out).toContain('Ship feature');
    expect(out).not.toContain('Daily standup'); // recurring excluded from "Top"
  });
});

describe('buildTeamTaskRow', () => {
  it('builds a minimal row with required fields + zoe tagging', () => {
    const row = buildTeamTaskRow({ title: '  Ship it  ', project: ' zaodevz ' });
    expect(row.title).toBe('Ship it');
    expect(row.project).toBe('zaodevz');
    expect(row.status).toBe('todo');
    expect(row.source).toBe('zoe');
    expect(row.legacy_source).toBe('zoe-bot');
    expect('priority' in row).toBe(false);
  });
  it('includes priority when given', () => {
    expect(buildTeamTaskRow({ title: 'x', project: 'p', priority: 'P1' }).priority).toBe('P1');
  });
  it('writes notes (context) when given, and omits them when empty', () => {
    expect(buildTeamTaskRow({ title: 'x', project: 'p', notes: '  freezes supply + 50%/mo  ' }).notes).toBe(
      'freezes supply + 50%/mo',
    );
    expect('notes' in buildTeamTaskRow({ title: 'x', project: 'p', notes: '   ' })).toBe(false);
    expect('notes' in buildTeamTaskRow({ title: 'x', project: 'p' })).toBe(false);
  });
});

describe('capturePriority', () => {
  it('maps ZoeTask high/med/low -> tracker P1/P2/P3', () => {
    expect(capturePriority('high')).toBe('P1');
    expect(capturePriority('med')).toBe('P2');
    expect(capturePriority('low')).toBe('P3');
    expect(capturePriority('whatever')).toBe('P2');
  });
});

describe('formatTeamTasks', () => {
  it('renders an empty state when there are no tasks', () => {
    expect(formatTeamTasks([])).toMatch(/no open team tasks/i);
  });

  it('priority-sorts, tags P-levels, and marks in-progress', () => {
    const tasks: TeamTask[] = [
      { title: 'Low thing', status: 'todo', priority: 'P3', due: null, project: 'ZAOstock', legacy_id: '1' },
      { title: 'Urgent thing', status: 'in_progress', priority: 'P1', due: null, project: 'zaodevz', legacy_id: '2' },
    ];
    const out = formatTeamTasks(tasks);
    expect(out).toMatch(/2 open/);
    expect(out).toContain('[P1] Urgent thing - doing');
    // P1 sorts above P3
    expect(out.indexOf('Urgent thing')).toBeLessThan(out.indexOf('Low thing'));
  });

  it('summarizes overdue in the header, not per line', () => {
    const tasks: TeamTask[] = [
      { title: 'Stale task', status: 'todo', priority: 'P2', due: '2020-01-01', project: null, legacy_id: '3' },
    ];
    const out = formatTeamTasks(tasks);
    expect(out).toMatch(/1 overdue/);
    expect(out).not.toContain('due 2020-01-01'); // overdue dates are not shown per-line
  });

  it('sorts recurring/standing tasks last', () => {
    const tasks: TeamTask[] = [
      { title: 'Daily checkin [STANDING]', status: 'todo', priority: 'P1', due: null, project: null, legacy_id: '4' },
      { title: 'One-off P2', status: 'todo', priority: 'P2', due: null, project: null, legacy_id: '5' },
    ];
    const out = formatTeamTasks(tasks);
    expect(out.indexOf('One-off P2')).toBeLessThan(out.indexOf('Daily checkin'));
  });

  it('caps the list and shows a +N more footer', () => {
    const tasks: TeamTask[] = Array.from({ length: 20 }, (_, i) => ({
      title: `Task ${i}`,
      status: 'todo',
      priority: 'P2',
      due: null,
      project: null,
      legacy_id: String(i),
    }));
    const out = formatTeamTasks(tasks);
    expect(out).toContain('20 open');
    expect(out).toMatch(/\+5 more/);
  });
});

describe('teamTrackerConfigured', () => {
  it('is false without both env vars', () => {
    const url = process.env.COWORK_TRACKER_URL;
    const key = process.env.COWORK_TRACKER_KEY;
    delete process.env.COWORK_TRACKER_URL;
    delete process.env.COWORK_TRACKER_KEY;
    expect(teamTrackerConfigured()).toBe(false);
    if (url) process.env.COWORK_TRACKER_URL = url;
    if (key) process.env.COWORK_TRACKER_KEY = key;
  });
});
