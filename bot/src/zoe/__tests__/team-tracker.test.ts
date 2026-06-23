import { describe, it, expect } from 'vitest';
import { formatTeamTasks, teamTrackerConfigured, summarizeTeamForBrief, type TeamTask } from '../team-tracker';

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
