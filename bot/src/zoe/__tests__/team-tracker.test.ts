import { describe, it, expect } from 'vitest';
import { formatTeamTasks, teamTrackerConfigured, summarizeTeamForBrief, zaalFocusForBrief, buildTeamTaskRow, type TeamTask } from '../team-tracker';

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
