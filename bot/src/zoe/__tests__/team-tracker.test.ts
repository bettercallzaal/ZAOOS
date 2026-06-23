import { describe, it, expect } from 'vitest';
import { formatTeamTasks, teamTrackerConfigured, type TeamTask } from '../team-tracker';

describe('formatTeamTasks', () => {
  it('renders an empty state when there are no tasks', () => {
    expect(formatTeamTasks([])).toMatch(/no open team tasks/i);
  });

  it('lists tasks with project, priority, due, and status', () => {
    const tasks: TeamTask[] = [
      { title: 'Ship the board', status: 'doing', priority: 'high', due: '2026-06-25', project: 'ZAOstock', legacy_id: '42' },
      { title: 'Write recap', status: 'todo', priority: 'normal', due: null, project: null, legacy_id: '43' },
    ];
    const out = formatTeamTasks(tasks);
    expect(out).toMatch(/2 open/);
    expect(out).toContain('ZAOstock: Ship the board');
    expect(out).toContain('[high]');
    expect(out).toContain('due 2026-06-25');
    expect(out).toContain('doing');
    // normal priority is not shown as a tag
    expect(out).not.toContain('[normal]');
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
