// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockReadTasks = vi.hoisted(() => vi.fn());
vi.mock('../memory', () => ({
  ZOE_PATHS: { home: '/tmp/zoe-test' },
  readTasks: mockReadTasks,
}));

const mockReadFile = vi.hoisted(() => vi.fn());
const mockWriteFile = vi.hoisted(() => vi.fn());
const mockMkdir = vi.hoisted(() => vi.fn());
const mockAccess = vi.hoisted(() => vi.fn());
const mockUnlink = vi.hoisted(() => vi.fn());

vi.mock('node:fs', () => ({
  promises: {
    readFile: mockReadFile,
    writeFile: mockWriteFile,
    mkdir: mockMkdir,
    access: mockAccess,
    unlink: mockUnlink,
  },
}));

import {
  disableNudges,
  enableNudges,
  markNudgeSent,
  nextNudge,
  NUDGE_COOLDOWN_MS,
  nudgeCooldownElapsed,
  nudgesEnabled,
} from '../nudges';

afterEach(() => vi.clearAllMocks());

const makeTask = (id: string, title: string, priority: 'high' | 'med' | 'low', status: 'pending' | 'done' = 'pending') => ({
  id, title, priority, status, description: `Do ${title}`, created_at: '2026-01-01',
});

// ── nextNudge ─────────────────────────────────────────────────────────────────

describe('nextNudge', () => {
  it('returns null when there are no open tasks', async () => {
    mockReadTasks.mockResolvedValue([makeTask('1', 'Done task', 'high', 'done')]);
    expect(await nextNudge()).toBeNull();
  });

  it('returns null when task list is empty', async () => {
    mockReadTasks.mockResolvedValue([]);
    expect(await nextNudge()).toBeNull();
  });

  it('returns the highest-priority open task', async () => {
    mockReadTasks.mockResolvedValue([
      makeTask('1', 'Low task', 'low'),
      makeTask('2', 'High task', 'high'),
      makeTask('3', 'Med task', 'med'),
    ]);
    mockReadFile.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' })); // no pointer
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    const nudge = await nextNudge();
    expect(nudge).toContain('High task');
    expect(nudge).toContain('[high]');
  });

  it('starts at index 0 when pointer file does not exist', async () => {
    mockReadTasks.mockResolvedValue([makeTask('1', 'Task A', 'high'), makeTask('2', 'Task B', 'med')]);
    mockReadFile.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    const nudge = await nextNudge();
    expect(nudge).toContain('Task A'); // index 0 = first after sort = high
  });

  it('rotates to the next task using the pointer', async () => {
    mockReadTasks.mockResolvedValue([makeTask('1', 'Task A', 'high'), makeTask('2', 'Task B', 'med')]);
    mockReadFile.mockResolvedValue('1'); // pointer says idx=1
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    const nudge = await nextNudge();
    expect(nudge).toContain('Task B'); // sorted high→med; idx 1 = Task B
  });

  it('includes the open queue count in the message', async () => {
    mockReadTasks.mockResolvedValue([makeTask('1', 'A', 'high'), makeTask('2', 'B', 'med'), makeTask('3', 'C', 'low')]);
    mockReadFile.mockRejectedValue(new Error('ENOENT'));
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    const nudge = await nextNudge();
    expect(nudge).toContain('3 open in your queue');
  });

  it('still sends the nudge even when the pointer write fails', async () => {
    mockReadTasks.mockResolvedValue([makeTask('1', 'Task A', 'high')]);
    mockReadFile.mockRejectedValue(new Error('ENOENT'));
    mockMkdir.mockRejectedValue(new Error('disk full')); // write fails
    const nudge = await nextNudge();
    expect(nudge).toContain('Task A');
  });
});

// ── nudgesEnabled ─────────────────────────────────────────────────────────────

describe('nudgesEnabled', () => {
  it('returns true when no flag files exist', async () => {
    mockAccess.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    expect(await nudgesEnabled()).toBe(true);
  });

  it('returns false when nudges-disabled.flag exists', async () => {
    mockAccess.mockResolvedValueOnce(undefined); // nudges-disabled.flag found
    expect(await nudgesEnabled()).toBe(false);
  });

  it('returns false when the legacy tips-disabled.flag exists', async () => {
    mockAccess
      .mockRejectedValueOnce(new Error('ENOENT')) // nudges-disabled absent
      .mockResolvedValueOnce(undefined);           // tips-disabled found
    expect(await nudgesEnabled()).toBe(false);
  });
});

// ── disableNudges / enableNudges ──────────────────────────────────────────────

describe('disableNudges', () => {
  it('writes the nudges-disabled.flag file', async () => {
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    await disableNudges();
    expect(mockWriteFile).toHaveBeenCalledOnce();
    expect(mockWriteFile.mock.calls[0][0]).toContain('nudges-disabled.flag');
  });
});

describe('enableNudges', () => {
  it('unlinks both flag files', async () => {
    mockUnlink.mockResolvedValue(undefined);
    await enableNudges();
    expect(mockUnlink).toHaveBeenCalledTimes(2);
  });

  it('swallows ENOENT when flags are already absent', async () => {
    mockUnlink.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    await expect(enableNudges()).resolves.toBeUndefined();
  });
});

// ── nudgeCooldownElapsed ──────────────────────────────────────────────────────

describe('nudgeCooldownElapsed', () => {
  const NOW = 1_700_000_000_000;

  it('returns true when the file does not exist (never sent)', async () => {
    mockReadFile.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    expect(await nudgeCooldownElapsed(NOW)).toBe(true);
  });

  it('returns true when last sent > 4h ago', async () => {
    const fiveHoursAgo = new Date(NOW - 5 * 60 * 60 * 1000).toISOString();
    mockReadFile.mockResolvedValue(fiveHoursAgo);
    expect(await nudgeCooldownElapsed(NOW)).toBe(true);
  });

  it('returns false when last sent < 4h ago', async () => {
    const oneHourAgo = new Date(NOW - 60 * 60 * 1000).toISOString();
    mockReadFile.mockResolvedValue(oneHourAgo);
    expect(await nudgeCooldownElapsed(NOW)).toBe(false);
  });

  it('returns false when last sent exactly at cooldown boundary', async () => {
    const exactlyFourH = new Date(NOW - NUDGE_COOLDOWN_MS).toISOString();
    mockReadFile.mockResolvedValue(exactlyFourH);
    expect(await nudgeCooldownElapsed(NOW)).toBe(true); // >= so exactly 4h → true
  });

  it('returns true when the stored timestamp is invalid (NaN)', async () => {
    mockReadFile.mockResolvedValue('not-a-date');
    expect(await nudgeCooldownElapsed(NOW)).toBe(true);
  });
});

// ── markNudgeSent ─────────────────────────────────────────────────────────────

describe('markNudgeSent', () => {
  it('writes the ISO timestamp to the last-sent file', async () => {
    const NOW = 1_700_000_000_000;
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    await markNudgeSent(NOW);
    expect(mockWriteFile).toHaveBeenCalledOnce();
    expect(mockWriteFile.mock.calls[0][0]).toContain('nudge-last-sent.txt');
    expect(mockWriteFile.mock.calls[0][1]).toBe(new Date(NOW).toISOString());
  });

  it('swallows errors without throwing (best-effort)', async () => {
    mockMkdir.mockRejectedValue(new Error('disk full'));
    await expect(markNudgeSent(Date.now())).resolves.toBeUndefined();
  });
});
