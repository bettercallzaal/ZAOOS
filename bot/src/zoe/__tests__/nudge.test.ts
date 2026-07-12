import { describe, it, expect } from 'vitest';
import { computeNudges, formatNudge } from '../nudge';
import type { CockpitTask } from '../../cockpit/types';

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

describe('computeNudges', () => {
  it('detects stale captures (7+ days, not done)', () => {
    const tasks = [
      task({
        id: '1',
        title: 'fresh capture',
        legacy_source: 'inbox:idea1',
        created_at: new Date(NOW - 1 * DAY).toISOString(),
      }),
      task({
        id: '2',
        title: 'stale capture',
        legacy_source: 'inbox:idea2',
        created_at: new Date(NOW - 8 * DAY).toISOString(),
      }),
      task({
        id: '3',
        title: 'stale but done',
        legacy_source: 'inbox:idea3',
        status: 'done',
        created_at: new Date(NOW - 10 * DAY).toISOString(),
      }),
    ];
    const nudges = computeNudges(tasks, NOW);
    expect(nudges.staleCaptures.length).toBe(1);
    expect(nudges.staleCaptures[0]?.id).toBe('2');
    expect(nudges.overdue.length).toBe(0);
  });

  it('detects overdue tasks (due < today, not done)', () => {
    const tasks = [
      task({
        id: '1',
        title: 'overdue task',
        due: '2026-07-05',
        status: 'todo',
      }),
      task({
        id: '2',
        title: 'overdue but triage',
        due: '2026-07-05',
        status: 'triage',
      }),
      task({
        id: '3',
        title: 'overdue but done',
        due: '2026-07-05',
        status: 'done',
      }),
      task({
        id: '4',
        title: 'due today',
        due: '2026-07-09',
      }),
      task({
        id: '5',
        title: 'future due',
        due: '2026-07-15',
      }),
    ];
    const nudges = computeNudges(tasks, NOW);
    expect(nudges.overdue.length).toBe(1);
    expect(nudges.overdue[0]?.id).toBe('1');
  });

  it('caps at 5 stale captures and 5 overdue', () => {
    const tasks: CockpitTask[] = [];
    // Create 10 stale captures.
    for (let i = 0; i < 10; i++) {
      tasks.push(
        task({
          id: `capture-${i}`,
          title: `stale capture ${i}`,
          legacy_source: 'inbox:idea',
          created_at: new Date(NOW - 8 * DAY).toISOString(),
        }),
      );
    }
    // Create 10 overdue tasks.
    for (let i = 0; i < 10; i++) {
      tasks.push(
        task({
          id: `overdue-${i}`,
          title: `overdue task ${i}`,
          due: '2026-07-05',
        }),
      );
    }
    const nudges = computeNudges(tasks, NOW);
    expect(nudges.staleCaptures.length).toBe(5);
    expect(nudges.overdue.length).toBe(5);
  });

  it('skips non-capture items and non-stale captures', () => {
    const tasks = [
      task({
        id: '1',
        title: 'regular task',
        legacy_source: null,
      }),
      task({
        id: '2',
        title: 'handoff',
        legacy_source: 'handoff:slug',
      }),
      task({
        id: '3',
        title: 'fresh capture',
        legacy_source: 'inbox:idea',
        created_at: new Date(NOW - 3 * DAY).toISOString(),
      }),
    ];
    const nudges = computeNudges(tasks, NOW);
    expect(nudges.staleCaptures.length).toBe(0);
    expect(nudges.overdue.length).toBe(0);
  });
});

describe('formatNudge', () => {
  it('returns null when nothing to nudge', () => {
    const msg = formatNudge({ staleCaptures: [], overdue: [] });
    expect(msg).toBeNull();
  });

  it('formats stale captures only', () => {
    const nudges = {
      staleCaptures: [
        task({ id: '1', title: 'first idea' }),
        task({ id: '2', title: 'second idea' }),
      ],
      overdue: [],
    };
    const msg = formatNudge(nudges);
    expect(msg).toContain('2 idea(s) captured 7+ days ago');
    expect(msg).toContain('first idea');
  });

  it('formats overdue tasks only', () => {
    const nudges = {
      staleCaptures: [],
      overdue: [
        task({ id: '1', title: 'urgent thing' }),
        task({ id: '2', title: 'another due' }),
      ],
    };
    const msg = formatNudge(nudges);
    expect(msg).toContain('2 task(s) overdue');
    expect(msg).toContain('urgent thing');
  });

  it('formats both stale captures and overdue', () => {
    const nudges = {
      staleCaptures: [task({ id: '1', title: 'stale idea' })],
      overdue: [task({ id: '2', title: 'overdue task' })],
    };
    const msg = formatNudge(nudges);
    expect(msg).toContain('1 idea(s) captured 7+ days ago');
    expect(msg).toContain('1 task(s) overdue');
  });

  it('truncates long titles at 40 chars', () => {
    const longTitle = 'a'.repeat(50);
    const nudges = {
      staleCaptures: [task({ id: '1', title: longTitle })],
      overdue: [],
    };
    const msg = formatNudge(nudges);
    expect(msg).toContain('aaaaaaaaaa'); // at least some of the truncated a's
    expect(msg?.length).toBeLessThan(200); // sanity check message isn't huge
  });

  it('includes no emojis or em-dashes', () => {
    const nudges = {
      staleCaptures: [task({ id: '1', title: 'test' })],
      overdue: [task({ id: '1', title: 'test' })],
    };
    const msg = formatNudge(nudges);
    expect(msg).toBeDefined();
    expect(msg).not.toMatch(/[^\x00-\x7F]/); // no unicode emojis
    expect(msg).not.toContain('--'); // no em-dashes (would be represented as --)
    expect(msg).not.toMatch(/[–—]/); // no actual em/en dashes
  });
});
