import { beforeEach, describe, expect, it, vi } from 'vitest';

// In-memory fs. Unlike the tick suite's mock this one also implements stat and
// appendFile, because the batch's second destination (GRILL-QUEUE.md) probes
// for the vault directory and appends to it.
const files = new Map<string, string>();
const dirs = new Set<string>();
vi.mock('node:fs', () => ({
  promises: {
    readFile: async (p: string) => {
      const v = files.get(p);
      if (v === undefined) throw new Error('ENOENT');
      return v;
    },
    writeFile: async (p: string, data: string) => {
      files.set(p, data);
    },
    appendFile: async (p: string, data: string) => {
      files.set(p, (files.get(p) ?? '') + data);
    },
    stat: async (p: string) => {
      if (!dirs.has(p)) throw new Error('ENOENT');
      return { isDirectory: () => true };
    },
    mkdir: async (p: string) => {
      dirs.add(p);
      return undefined;
    },
  },
}));

import { BATCH_DEFAULT, DRIP_DEFAULT, dailyBatchSize, shouldSendNext } from '../backlog-grill';
import { runBacklogGrillBatch } from '../backlog-grill-runner';

const VAULT = '/vault/handoffs';
const QUEUE = `${VAULT}/GRILL-QUEUE.md`;
const SPOOL = '/spooldir/grill-queue-spool.jsonl';

const rows = Array.from({ length: 25 }, (_, i) => ({
  id: `t${i}`,
  title: `Task ${i}`,
  created_at: '2026-01-01T00:00:00Z',
  notes: `why ${i}`,
}));

const boardFetch = (async (url: string, init?: RequestInit) => {
  if (init?.method === 'PATCH') return { ok: true, status: 200 } as unknown as Response;
  if (String(url).includes('order=created_at.asc')) {
    return { ok: true, status: 200, json: async () => rows } as unknown as Response;
  }
  return { ok: true, status: 200, json: async () => [{ notes: '' }] } as unknown as Response;
}) as unknown as typeof fetch;

let sent: string[];
/**
 * The cap is passed as `cfg`, never as ZOE_GRILL_MAX_OUTSTANDING. That env var
 * is read once, inside an IIFE, when backlog-grill.ts is imported - setting it
 * from a test is a no-op, and a test that appeared to exercise the cap would
 * really be exercising the default 20. Correct for the deployed service (the
 * ceiling should not shift under a running process), a trap for a test.
 */
const batch = (
  opts: { localHour?: number; size?: number; now?: number; cap?: number } = {},
) =>
  runBacklogGrillBatch({
    sendDM: async (text) => {
      sent.push(text);
      return { message_id: sent.length };
    },
    localHour: opts.localHour ?? 5,
    now: opts.now ?? Date.UTC(2026, 7, 26, 9, 0, 0),
    size: opts.size,
    cfg: opts.cap === undefined ? undefined : { ...BATCH_DEFAULT, maxOutstanding: opts.cap },
    fetchImpl: boardFetch,
  });

beforeEach(() => {
  files.clear();
  dirs.clear();
  sent = [];
  process.env.COWORK_TRACKER_URL = 'https://tracker.test';
  process.env.COWORK_TRACKER_KEY = 'k';
  process.env.ZOE_GRILL_QUEUE_PATH = QUEUE;
  process.env.ZOE_GRILL_SPOOL_PATH = SPOOL;
  delete process.env.ZOE_GRILL_DAILY_BATCH;
  delete process.env.ZOE_GRILL_MAX_OUTSTANDING;
});


describe('BATCH_DEFAULT - what the daily batch drops, and what it keeps', () => {
  /**
   * THE REGRESSION THAT WOULD HAVE SHIPPED SILENTLY.
   *
   * The batch fires on the morning brief's cron, '0 9 * * *' UTC. That is
   * 05:00 EDT and 04:00 EST - both OUTSIDE the drip's 06:00-22:00 window. Left
   * in, the window would have blocked every batch, every day, and the only
   * symptom would have been a grill that quietly sent nothing.
   */
  it('does not gate on the hour, because the cron is the schedule now', () => {
    expect(
      shouldSendNext({ nowMs: 1, localHour: 4, lastSentMs: null, outstanding: 0, remainingInQueue: 5, cfg: DRIP_DEFAULT }),
    ).toMatchObject({ send: false });
    expect(
      shouldSendNext({ nowMs: 1, localHour: 4, lastSentMs: null, outstanding: 0, remainingInQueue: 5, cfg: BATCH_DEFAULT }),
    ).toMatchObject({ send: true });
  });

  it('does not gate on spacing, or every card after the first would be blocked', () => {
    const justSent = { nowMs: 1000, localHour: 10, lastSentMs: 999, outstanding: 0, remainingInQueue: 5 };
    expect(shouldSendNext({ ...justSent, cfg: DRIP_DEFAULT }).send).toBe(false);
    expect(shouldSendNext({ ...justSent, cfg: BATCH_DEFAULT }).send).toBe(true);
  });

  it('KEEPS the cap - it is the only guard left once cadence stops limiting', () => {
    expect(BATCH_DEFAULT.maxOutstanding).toBe(DRIP_DEFAULT.maxOutstanding);
    expect(BATCH_DEFAULT.capWindowMs).toBe(DRIP_DEFAULT.capWindowMs);
  });

  it('defaults to ten a day, and honours ZOE_GRILL_DAILY_BATCH', () => {
    expect(dailyBatchSize()).toBe(10);
    process.env.ZOE_GRILL_DAILY_BATCH = '3';
    expect(dailyBatchSize()).toBe(3);
    process.env.ZOE_GRILL_DAILY_BATCH = 'nonsense';
    expect(dailyBatchSize()).toBe(10);
    delete process.env.ZOE_GRILL_DAILY_BATCH;
  });
});

describe('runBacklogGrillBatch', () => {
  it('sends the whole batch in one run at his wake hour', async () => {
    const r = await batch({ localHour: 5, size: 6 });
    expect(r.sent).toBe(6);
    expect(sent).toHaveLength(6);
    expect(r.titles).toEqual(['Task 0', 'Task 1', 'Task 2', 'Task 3', 'Task 4', 'Task 5']);
  });

  it('stops at the cap and says which card count it stopped on', async () => {
    const r = await batch({ size: 10, cap: 4 });
    expect(r.sent).toBe(4);
    expect(r.reason).toContain('stopped after 4');
    expect(r.reason).toContain('already unanswered');
  });

  it('stops when the queue runs dry, and says so differently', async () => {
    const r = await batch({ size: 30, cap: 999 });
    expect(r.sent).toBe(25);
    expect(r.reason).toContain('nothing left to ask about');
  });

  it('lands every card in GRILL-QUEUE.md when the vault is there', async () => {
    dirs.add(VAULT);
    files.set(QUEUE, '# GRILL-QUEUE\n\n## old\n\n12. an older item\n');
    const r = await batch({ size: 3 });
    expect(r.queued).toBe('queue:3');
    const body = files.get(QUEUE) ?? '';
    expect(body).toContain('12. an older item');
    expect(body).toContain('13. **Task 0**');
    expect(body).toContain('15. **Task 2**');
    // The lane has to know what it is allowed to clear on its own.
    expect(body).toContain('knocking those out');
  });

  it('spools instead of inventing a vault, and says which happened', async () => {
    // The VPS: /home/zaal/zao-vault does not exist there. A mkdir -p would
    // have produced a queue file nobody reads, and 'queue:10' in the log for
    // cards the grill lane can never see.
    const r = await batch({ size: 2 });
    expect(r.queued).toContain('spool:2');
    expect(files.has(QUEUE)).toBe(false);
    const spooled = (files.get(SPOOL) ?? '').trim().split('\n').map((l) => JSON.parse(l));
    expect(spooled.map((x) => x.taskId)).toEqual(['t0', 't1']);
  });

  it('still reports the sends when the queue write fails entirely', async () => {
    delete process.env.ZOE_GRILL_SPOOL_PATH;
    process.env.ZOE_GRILL_SPOOL_PATH = SPOOL;
    dirs.add(VAULT);
    files.set(QUEUE, '');
    const r = await batch({ size: 2 });
    // Telegram already has them; the queue is the second destination and must
    // never be able to retract a send that happened.
    expect(r.sent).toBe(2);
  });
});
