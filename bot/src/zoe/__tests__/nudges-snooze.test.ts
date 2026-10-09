// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockReadTasks = vi.hoisted(() => vi.fn());
vi.mock('../memory', () => ({
  ZOE_PATHS: { home: '/tmp/zoe-snooze-test' },
  readTasks: mockReadTasks,
}));

const files = vi.hoisted(() => new Map<string, string>());
vi.mock('node:fs', () => ({
  promises: {
    readFile: vi.fn(async (p: string) => {
      if (!files.has(p)) throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
      return files.get(p);
    }),
    writeFile: vi.fn(async (p: string, d: string) => {
      files.set(p, d);
    }),
    mkdir: vi.fn(async () => undefined),
    access: vi.fn(async () => {
      throw new Error('ENOENT');
    }),
    unlink: vi.fn(async () => undefined),
  },
}));

import { nextNudgeDetailed, nudgeKeyboard, snoozeTask, SNOOZE_LATER_MS, SNOOZE_SHELVE_MS } from '../nudges';

afterEach(() => {
  files.clear();
  vi.clearAllMocks();
});

const task = (id: string, priority: 'high' | 'med' | 'low') => ({
  id,
  title: `task ${id}`,
  priority,
  status: 'pending',
  description: `Do ${id}`,
  created_at: '2026-01-01',
});

describe('nextNudgeDetailed', () => {
  it('returns the task id and priority with the text', async () => {
    mockReadTasks.mockResolvedValue([task('t1', 'high')]);
    const n = await nextNudgeDetailed();
    expect(n).toMatchObject({ taskId: 't1', priority: 'high' });
    expect(n?.text).toContain('Next move - [high] task t1');
  });

  it('highOnly leaves med and low tasks out, and returns null when only those exist', async () => {
    mockReadTasks.mockResolvedValue([task('m', 'med'), task('l', 'low')]);
    expect(await nextNudgeDetailed({ highOnly: true })).toBeNull();
    // red control: without the flag the same queue nudges
    expect(await nextNudgeDetailed()).not.toBeNull();
  });

  it('skips a snoozed task until the snooze expires', async () => {
    const now = Date.parse('2026-10-09T12:00:00Z');
    mockReadTasks.mockResolvedValue([task('a', 'high'), task('b', 'high')]);
    await snoozeTask('a', SNOOZE_LATER_MS, now);
    for (let k = 0; k < 3; k++) {
      expect((await nextNudgeDetailed({ now: now + 60_000 }))?.taskId).toBe('b');
    }
    const later = await nextNudgeDetailed({ now: now + SNOOZE_LATER_MS + 1 });
    expect(later).not.toBeNull();
  });

  it('shelve lasts seven days and prunes expired entries on the next write', async () => {
    const now = Date.parse('2026-10-09T12:00:00Z');
    await snoozeTask('old', 1000, now - 10_000);
    await snoozeTask('a', SNOOZE_SHELVE_MS, now);
    const stored = JSON.parse(files.get('/tmp/zoe-snooze-test/nudge-snooze.json') ?? '{}');
    expect(Object.keys(stored)).toEqual(['a']);
    expect(Date.parse(stored.a) - now).toBe(SNOOZE_SHELVE_MS);
  });
});

describe('nudgeKeyboard', () => {
  it('carries the task id on each button', () => {
    const row = nudgeKeyboard('t1').inline_keyboard[0];
    expect(row.map((b) => b.callback_data)).toEqual(['nudge:now:t1', 'nudge:later:t1', 'nudge:shelve:t1']);
  });

  it('falls back to id-less buttons when the id would pass 64 bytes', () => {
    const row = nudgeKeyboard('x'.repeat(80)).inline_keyboard[0];
    expect(row.map((b) => b.callback_data)).toEqual(['nudge:now', 'nudge:later', 'nudge:shelve']);
  });

  it('matches the handler pattern in index.ts', () => {
    const handler = /^nudge:(now|later|shelve)(?::(.+))?$/;
    for (const b of nudgeKeyboard('inbox-1760000000000-abc123').inline_keyboard[0]) {
      const m = handler.exec(b.callback_data);
      expect(m?.[2]).toBe('inbox-1760000000000-abc123');
    }
    expect(handler.exec('nudge:later')?.[2]).toBeUndefined();
  });
});
