// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── Hoisted mocks (must precede imports) ────────────────────────────────────

const {
  mockExecFileRaw,
  mockFsReadFile,
  mockFsWriteFile,
  mockFsMkdir,
  mockFsReaddir,
  mockFsStat,
  mockGraphTopicAgeDays,
  mockGetCalendarEvents,
} = vi.hoisted(() => ({
  mockExecFileRaw: vi.fn(),
  mockFsReadFile: vi.fn(),
  mockFsWriteFile: vi.fn(),
  mockFsMkdir: vi.fn(),
  mockFsReaddir: vi.fn(),
  mockFsStat: vi.fn(),
  mockGraphTopicAgeDays: vi.fn(),
  mockGetCalendarEvents: vi.fn(),
}));

// execFile is wrapped by promisify at module load. We mock promisify to be an
// identity so execFileP === execFile === mockExecFileRaw (already returns a Promise).
vi.mock('node:util', () => ({ promisify: (fn: unknown) => fn }));

vi.mock('node:child_process', () => ({
  execFile: (...args: unknown[]) => mockExecFileRaw(...args),
}));

vi.mock('node:fs', () => ({
  promises: {
    readFile: (...args: unknown[]) => mockFsReadFile(...args),
    writeFile: (...args: unknown[]) => mockFsWriteFile(...args),
    mkdir: (...args: unknown[]) => mockFsMkdir(...args),
    readdir: (...args: unknown[]) => mockFsReaddir(...args),
    stat: (...args: unknown[]) => mockFsStat(...args),
  },
}));

vi.mock('../recall', () => ({
  graphTopicAgeDays: (...args: unknown[]) => mockGraphTopicAgeDays(...args),
}));

vi.mock('../memory', () => ({
  ZOE_PATHS: { home: '/home/test/.zao/zoe' },
}));

vi.mock('../calendar', () => ({
  getCalendarEvents: (...args: unknown[]) => mockGetCalendarEvents(...args),
}));

import {
  gatherCalendarCandidates,
  gatherEventCandidates,
  gatherGraphCandidates,
  gatherInactivityCandidates,
  touchLastSeen,
} from '../events';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const NOW = new Date('2026-07-22T14:00:00.000Z').getTime(); // Tuesday 14:00 UTC = 10am EDT (waking hours)
const TODAY = '2026-07-22';

function makePr(overrides: {
  number?: number;
  title?: string;
  updatedAt?: string;
  repoName?: string;
}) {
  const updatedAt = overrides.updatedAt ?? new Date(NOW - 5 * 24 * 3600_000).toISOString(); // 5 days ago
  return {
    number: overrides.number ?? 1,
    title: overrides.title ?? 'test PR',
    url: `https://github.com/test/repo/pull/${overrides.number ?? 1}`,
    createdAt: new Date(NOW - 6 * 24 * 3600_000).toISOString(),
    updatedAt,
    repository: {
      name: overrides.repoName ?? 'repo',
      nameWithOwner: `bettercallzaal/${overrides.repoName ?? 'repo'}`,
    },
  };
}

// ── gatherEventCandidates ─────────────────────────────────────────────────────

describe('gatherEventCandidates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: seen file is empty
    mockFsReadFile.mockResolvedValue('{}');
    mockFsWriteFile.mockResolvedValue(undefined);
    mockFsMkdir.mockResolvedValue(undefined);
    // Default: no CI failures
    mockExecFileRaw.mockResolvedValue({ stdout: '{"statusCheckRollup":[]}' });
  });

  it('returns [] when gh command throws', async () => {
    mockExecFileRaw.mockRejectedValueOnce(new Error('gh: command not found'));
    const result = await gatherEventCandidates(NOW);
    expect(result).toEqual([]);
  });

  it('returns [] when gh returns invalid JSON', async () => {
    mockExecFileRaw.mockResolvedValueOnce({ stdout: 'not-json' });
    const result = await gatherEventCandidates(NOW);
    expect(result).toEqual([]);
  });

  it('returns [] when all PRs are too fresh (< 4 days old)', async () => {
    const freshPr = makePr({ updatedAt: new Date(NOW - 2 * 24 * 3600_000).toISOString() }); // 2 days
    mockExecFileRaw.mockResolvedValueOnce({ stdout: JSON.stringify([freshPr]) });
    const result = await gatherEventCandidates(NOW);
    expect(result).toEqual([]);
  });

  it('returns [] when PR is older than 21 days (abandoned)', async () => {
    const oldPr = makePr({ updatedAt: new Date(NOW - 25 * 24 * 3600_000).toISOString() }); // 25 days
    mockExecFileRaw.mockResolvedValueOnce({ stdout: JSON.stringify([oldPr]) });
    const result = await gatherEventCandidates(NOW);
    expect(result).toEqual([]);
  });

  it('returns a [STALE PR] candidate for a PR stuck 5 days', async () => {
    const stalePr = makePr({ number: 42, title: 'feat: add cool thing' });
    mockExecFileRaw.mockResolvedValueOnce({ stdout: JSON.stringify([stalePr]) });
    // CI check for the PR returns no failures
    mockExecFileRaw.mockResolvedValue({ stdout: '{"statusCheckRollup":[]}' });

    const result = await gatherEventCandidates(NOW);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('github-event');
    expect(result[0].message).toContain('[STALE PR]');
    expect(result[0].message).toContain('42');
    expect(result[0].message).toContain('feat: add cool thing');
    expect(result[0].score).toBeGreaterThan(0.6);
  });

  it('deduplicates: seen PR does not re-appear on same day', async () => {
    const stalePr = makePr({ number: 10 });
    mockExecFileRaw.mockResolvedValueOnce({ stdout: JSON.stringify([stalePr]) });
    mockExecFileRaw.mockResolvedValue({ stdout: '{"statusCheckRollup":[]}' });

    // Seen file already has this PR keyed for today
    const seenData = { [`stale:repo#10:${TODAY}`]: NOW - 1000 };
    mockFsReadFile.mockResolvedValue(JSON.stringify(seenData));

    const result = await gatherEventCandidates(NOW);
    expect(result).toEqual([]);
  });

  it('returns a [CI FAIL] candidate when PR checks show failure', async () => {
    const stalePr = makePr({ number: 99, title: 'fix: broken build' });
    mockExecFileRaw
      .mockResolvedValueOnce({ stdout: JSON.stringify([stalePr]) }) // gh search
      .mockResolvedValueOnce({
        stdout: JSON.stringify({
          statusCheckRollup: [{ conclusion: 'FAILURE', name: 'Test' }],
        }),
      }); // gh pr view

    const result = await gatherEventCandidates(NOW);
    const cifail = result.find((c) => c.message.includes('[CI FAIL]'));
    expect(cifail).toBeDefined();
    expect(cifail?.score).toBeGreaterThan(0.8);
    expect(cifail?.message).toContain('99');
  });

  it('[CI FAIL] is not added when checks show success', async () => {
    const stalePr = makePr({ number: 55 });
    mockExecFileRaw
      .mockResolvedValueOnce({ stdout: JSON.stringify([stalePr]) })
      .mockResolvedValueOnce({
        stdout: JSON.stringify({
          statusCheckRollup: [{ conclusion: 'SUCCESS', name: 'Test' }],
        }),
      });

    const result = await gatherEventCandidates(NOW);
    expect(result.some((c) => c.message.includes('[CI FAIL]'))).toBe(false);
  });

  it('writes the seen file after detecting new events', async () => {
    const stalePr = makePr({ number: 7 });
    mockExecFileRaw.mockResolvedValueOnce({ stdout: JSON.stringify([stalePr]) });
    mockExecFileRaw.mockResolvedValue({ stdout: '{"statusCheckRollup":[]}' });

    await gatherEventCandidates(NOW);
    expect(mockFsWriteFile).toHaveBeenCalled();
  });

  it('does not write the seen file when no events are detected', async () => {
    mockExecFileRaw.mockResolvedValueOnce({ stdout: JSON.stringify([]) });
    await gatherEventCandidates(NOW);
    expect(mockFsWriteFile).not.toHaveBeenCalled();
  });
});

// ── gatherInactivityCandidates ─────────────────────────────────────────────────

describe('gatherInactivityCandidates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFsReadFile.mockResolvedValue('{}');
    mockFsWriteFile.mockResolvedValue(undefined);
    mockFsMkdir.mockResolvedValue(undefined);
  });

  it('returns [] outside waking hours (02:00 UTC = 10pm EDT)', async () => {
    const nightTime = new Date('2026-07-22T02:00:00.000Z').getTime(); // 2am UTC (between 1-13)
    const result = await gatherInactivityCandidates(nightTime);
    expect(result).toEqual([]);
  });

  it('returns [] when last-seen file does not exist', async () => {
    // During waking hours but no last-seen file
    mockFsReadFile.mockImplementation((path: string) => {
      if ((path as string).endsWith('last-seen.txt')) return Promise.reject(new Error('ENOENT'));
      return Promise.resolve('{}');
    });
    const result = await gatherInactivityCandidates(NOW);
    expect(result).toEqual([]);
  });

  it('returns [] when Zaal was active < 4 hours ago', async () => {
    const recentActivity = NOW - 2 * 3600_000; // 2 hours ago
    mockFsReadFile.mockImplementation((path: string) => {
      if ((path as string).endsWith('last-seen.txt')) return Promise.resolve(String(recentActivity));
      return Promise.resolve('{}');
    });
    const result = await gatherInactivityCandidates(NOW);
    expect(result).toEqual([]);
  });

  it('returns check-in candidate when silent for 5+ hours during waking hours', async () => {
    const longAgo = NOW - 5 * 3600_000; // 5 hours ago
    mockFsReadFile.mockImplementation((path: string) => {
      if ((path as string).endsWith('last-seen.txt')) return Promise.resolve(String(longAgo));
      return Promise.resolve('{}');
    });
    const result = await gatherInactivityCandidates(NOW);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('inactivity');
    expect(result[0].message).toContain('5h');
    expect(result[0].score).toBeGreaterThan(0.6);
  });

  it('deduplicates: returns [] when already triggered today', async () => {
    const longAgo = NOW - 5 * 3600_000;
    const seenData = { [`inactivity:${TODAY}`]: NOW - 1000 };
    mockFsReadFile.mockImplementation((path: string) => {
      if ((path as string).endsWith('last-seen.txt')) return Promise.resolve(String(longAgo));
      return Promise.resolve(JSON.stringify(seenData));
    });
    const result = await gatherInactivityCandidates(NOW);
    expect(result).toEqual([]);
  });
});

// ── touchLastSeen ─────────────────────────────────────────────────────────────

describe('touchLastSeen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFsMkdir.mockResolvedValue(undefined);
    mockFsWriteFile.mockResolvedValue(undefined);
  });

  it('writes the now timestamp to the last-seen file', async () => {
    await touchLastSeen(NOW);
    expect(mockFsWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('last-seen.txt'),
      String(NOW),
      'utf8',
    );
  });

  it('creates the zoe home directory if needed', async () => {
    await touchLastSeen(NOW);
    expect(mockFsMkdir).toHaveBeenCalledWith(
      expect.stringContaining('.zao'),
      { recursive: true },
    );
  });
});

// ── gatherGraphCandidates ─────────────────────────────────────────────────────

describe('gatherGraphCandidates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFsReadFile.mockResolvedValue('{}');
    mockFsWriteFile.mockResolvedValue(undefined);
    mockFsMkdir.mockResolvedValue(undefined);
    mockGraphTopicAgeDays.mockResolvedValue(null);
  });

  it('returns [] when daily gate already triggered', async () => {
    const seenData = { [`graphcheck:${TODAY}`]: NOW - 1000 };
    mockFsReadFile.mockResolvedValue(JSON.stringify(seenData));
    const result = await gatherGraphCandidates(NOW);
    expect(result).toEqual([]);
  });

  it('returns [] when all topics are fresh (< 10 days)', async () => {
    mockGraphTopicAgeDays.mockResolvedValue(5); // 5 days — below threshold
    const result = await gatherGraphCandidates(NOW);
    expect(result).toEqual([]);
  });

  it('returns [] when graphTopicAgeDays returns null', async () => {
    mockGraphTopicAgeDays.mockResolvedValue(null);
    const result = await gatherGraphCandidates(NOW);
    expect(result).toEqual([]);
  });

  it('returns a [GRAPH] nudge for the coldest topic when stale > 10 days', async () => {
    mockGraphTopicAgeDays.mockImplementation((topic: string) => {
      if (topic === 'WaveWarZ') return Promise.resolve(15);
      return Promise.resolve(3);
    });
    const result = await gatherGraphCandidates(NOW);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('graph-event');
    expect(result[0].message).toContain('[GRAPH]');
    expect(result[0].message).toContain('WaveWarZ');
    expect(result[0].message).toContain('15d');
  });

  it('surfaces the single coldest topic (not all stale ones)', async () => {
    mockGraphTopicAgeDays.mockImplementation((topic: string) => {
      if (topic === 'ZAOstock') return Promise.resolve(12);
      if (topic === 'WaveWarZ') return Promise.resolve(20); // coldest
      return Promise.resolve(5);
    });
    const result = await gatherGraphCandidates(NOW);
    expect(result).toHaveLength(1);
    expect(result[0].message).toContain('WaveWarZ');
  });

  it('marks the daily gate as done even when no stale topics found', async () => {
    mockGraphTopicAgeDays.mockResolvedValue(2); // all fresh
    await gatherGraphCandidates(NOW);
    const writeCall = mockFsWriteFile.mock.calls[0];
    const written = JSON.parse(writeCall[1] as string) as Record<string, number>;
    expect(written[`graphcheck:${TODAY}`]).toBe(NOW);
  });
});

// ── gatherCalendarCandidates ──────────────────────────────────────────────────

describe('gatherCalendarCandidates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFsReadFile.mockResolvedValue('{}');
    mockFsWriteFile.mockResolvedValue(undefined);
    mockFsMkdir.mockResolvedValue(undefined);
    mockFsReaddir.mockRejectedValue(new Error('ENOENT')); // no private dir by default
    mockGetCalendarEvents.mockResolvedValue([]);
  });

  it('returns [] when private dir does not exist and no ZOE events', async () => {
    const result = await gatherCalendarCandidates(NOW);
    expect(result).toEqual([]);
  });

  it('returns [] when gcal file is older than 24h (stale)', async () => {
    mockFsReaddir.mockResolvedValue(['gcal-2026-07-01.json']);
    mockFsStat.mockResolvedValue({ mtimeMs: NOW - 25 * 3600_000 }); // 25h old = stale
    const result = await gatherCalendarCandidates(NOW);
    expect(result).toEqual([]);
  });

  it('returns a calendar candidate for a gcal event within 2 hours', async () => {
    const startIn30min = NOW + 30 * 60_000;
    const gcalEvent = {
      id: 'evt-1',
      summary: 'ZAO Community Call',
      start: { dateTime: new Date(startIn30min).toISOString() },
    };
    mockFsReaddir.mockResolvedValue(['gcal-2026-07-22.json']);
    mockFsStat.mockResolvedValue({ mtimeMs: NOW - 1000 }); // fresh
    mockFsReadFile.mockImplementation((path: string) => {
      if ((path as string).endsWith('gcal-2026-07-22.json'))
        return Promise.resolve(JSON.stringify([gcalEvent]));
      return Promise.resolve('{}'); // seen file
    });

    const result = await gatherCalendarCandidates(NOW);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('calendar');
    expect(result[0].message).toContain('[CALENDAR]');
    expect(result[0].message).toContain('ZAO Community Call');
    expect(result[0].score).toBeGreaterThan(0.7);
  });

  it('skips gcal events that are in the past', async () => {
    const pastEvent = {
      id: 'past-1',
      summary: 'Missed Meeting',
      start: { dateTime: new Date(NOW - 60 * 60_000).toISOString() }, // 1h ago
    };
    mockFsReaddir.mockResolvedValue(['gcal-2026-07-22.json']);
    mockFsStat.mockResolvedValue({ mtimeMs: NOW - 1000 });
    mockFsReadFile.mockImplementation((path: string) => {
      if ((path as string).endsWith('gcal-2026-07-22.json'))
        return Promise.resolve(JSON.stringify([pastEvent]));
      return Promise.resolve('{}');
    });

    const result = await gatherCalendarCandidates(NOW);
    expect(result).toEqual([]);
  });

  it('skips gcal events more than 2 hours away', async () => {
    const farFutureEvent = {
      id: 'far-1',
      summary: 'Far Future Call',
      start: { dateTime: new Date(NOW + 3 * 3600_000).toISOString() }, // 3h away
    };
    mockFsReaddir.mockResolvedValue(['gcal-2026-07-22.json']);
    mockFsStat.mockResolvedValue({ mtimeMs: NOW - 1000 });
    mockFsReadFile.mockImplementation((path: string) => {
      if ((path as string).endsWith('gcal-2026-07-22.json'))
        return Promise.resolve(JSON.stringify([farFutureEvent]));
      return Promise.resolve('{}');
    });

    const result = await gatherCalendarCandidates(NOW);
    expect(result).toEqual([]);
  });

  it('returns a ZOE calendar candidate from getCalendarEvents', async () => {
    const startIn45min = new Date(NOW + 45 * 60_000);
    mockGetCalendarEvents.mockResolvedValue([
      { id: 'zoe-1', title: 'ZAO Stage Prep', start: startIn45min, end: startIn45min, location: 'Discord' },
    ]);

    const result = await gatherCalendarCandidates(NOW);
    expect(result).toHaveLength(1);
    expect(result[0].message).toContain('ZAO Stage Prep');
    expect(result[0].message).toContain('@ Discord');
  });

  it('deduplicates: same calendar event does not appear twice on the same day', async () => {
    const startIn30min = NOW + 30 * 60_000;
    mockGetCalendarEvents.mockResolvedValue([
      { id: 'zoe-1', title: 'Repeat Call', start: new Date(startIn30min), end: new Date(startIn30min) },
    ]);
    // Already seen
    const seenData = { [`calendar-zoe:zoe-1:${TODAY}`]: NOW - 1000 };
    mockFsReadFile.mockResolvedValue(JSON.stringify(seenData));

    const result = await gatherCalendarCandidates(NOW);
    expect(result).toEqual([]);
  });
});
