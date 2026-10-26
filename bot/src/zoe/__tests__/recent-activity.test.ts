import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { featureRan, recentRuns, resetAnnouncedForTest } from '../feature-ran';
import type { Context } from 'grammy';
import { newOwnerOnlyState, OWNER_ONLY_LINE } from '../owner-only';
import {
  buildStatus,
  renderStatus,
  shortTime,
  statusCommandEnabled,
  statusCommandHandler,
  statusKeyboard,
  statusRefreshHandler,
} from '../recent-activity';
import type { SendLogRow } from '../send-budget';

// 2026-10-26 14:00 UTC = 10:00 EDT, a Monday.
const NOW = new Date('2026-10-26T14:00:00Z');

function send(at: string, outcome: SendLogRow['outcome'], preview: string): SendLogRow {
  return { at, outcome, cls: 'status', chatId: 1, countBefore: 0, cap: 3, reason: 'r', preview };
}

describe('statusCommandEnabled', () => {
  it('is on by default and off only at 0', () => {
    expect(statusCommandEnabled({})).toBe(true);
    expect(statusCommandEnabled({ ZOE_STATUS_COMMAND: '1' })).toBe(true);
    expect(statusCommandEnabled({ ZOE_STATUS_COMMAND: '0' })).toBe(false);
  });
});

describe('shortTime', () => {
  it('shows only the clock for today, in Eastern', () => {
    expect(shortTime(new Date('2026-10-26T13:05:00Z'), NOW)).toBe('09:05');
  });
  it('adds the weekday for an earlier day', () => {
    expect(shortTime(new Date('2026-10-25T23:30:00Z'), NOW)).toBe('Sun 19:30');
  });
});

describe('renderStatus', () => {
  it('merges runs, sends and gaps newest first, capped at ten', () => {
    const ran = Array.from({ length: 12 }, (_, i) => ({
      feature: `f${i}`,
      at: new Date(Date.parse('2026-10-26T12:00:00Z') + i * 60_000),
      count: 1,
    }));
    const text = renderStatus({
      now: NOW,
      bootAt: new Date('2026-10-26T10:00:00Z'),
      ran,
      sends: [send('2026-10-26T13:59:00Z', 'sent', 'Morning brief')],
      gaps: [{ ts: '2026-10-26T13:58:00Z', want: 'book a flight' }],
    });
    const lines = text.split('\n');
    expect(lines[0]).toBe('ZOE status, up since 06:00 ET');
    expect(lines[1]).toBe('Today: 1 sent, 0 held, 0 dropped');
    const body = lines.slice(3);
    expect(body).toHaveLength(10);
    expect(body[0]).toBe('09:59 sent - Morning brief');
    expect(body[1]).toBe('09:58 could not - book a flight');
    expect(body[2]).toBe('08:11 ran - f11');
  });

  it('names held and dropped sends, and counts today only', () => {
    const text = renderStatus({
      now: NOW,
      bootAt: NOW,
      ran: [],
      sends: [
        send('2026-10-25T15:00:00Z', 'sent', 'yesterday'),
        send('2026-10-26T13:00:00Z', 'deferred', 'digest'),
        send('2026-10-26T13:01:00Z', 'dropped', 'noise'),
      ],
      gaps: [],
    });
    expect(text).toContain('Today: 0 sent, 1 held, 1 dropped');
    expect(text).toContain('09:01 DROPPED - noise');
    expect(text).toContain('09:00 held - digest');
    expect(text).toContain('Sun 11:00 sent - yesterday');
  });

  it('shows run counts and details, and clips long text to one short line', () => {
    const text = renderStatus({
      now: NOW,
      bootAt: NOW,
      ran: [{ feature: 'tick-lock', at: new Date('2026-10-26T13:50:00Z'), count: 42, detail: 'x'.repeat(200) }],
      sends: [],
      gaps: [],
    });
    const line = text.split('\n')[3];
    expect(line.startsWith('09:50 ran - tick-lock: xxx')).toBe(true);
    expect(line.endsWith('...')).toBe(true);
    expect(line.length).toBeLessThanOrEqual('09:50 ran - '.length + 70);
  });

  it('says so when nothing is recorded, and skips rows with a bad time', () => {
    const text = renderStatus({
      now: NOW,
      bootAt: NOW,
      ran: [],
      sends: [send('not a date', 'sent', 'x')],
      gaps: [{ ts: '', want: 'y' }],
    });
    expect(text).toContain('Nothing recorded yet since the last start.');
  });
});

describe('statusKeyboard', () => {
  it('offers one Refresh button', () => {
    expect(statusKeyboard().inline_keyboard).toEqual([[{ text: 'Refresh', callback_data: 'zst:refresh' }]]);
  });
});

describe('featureRan feeds recentRuns', () => {
  beforeEach(() => resetAnnouncedForTest());
  afterEach(() => resetAnnouncedForTest());

  it('keeps one entry per feature with the latest detail and a count', () => {
    featureRan('tick-lock', 'a');
    featureRan('tick-lock', 'b');
    featureRan('brief', 'generated');
    const runs = recentRuns();
    expect(runs).toHaveLength(2);
    const tick = runs.find((r) => r.feature === 'tick-lock');
    expect(tick?.count).toBe(2);
    expect(tick?.detail).toBe('b');
  });
});

describe('buildStatus reads the files ZOE writes', () => {
  const prevHome = process.env.ZOE_HOME;
  afterEach(() => {
    if (prevHome === undefined) delete process.env.ZOE_HOME;
    else process.env.ZOE_HOME = prevHome;
  });

  it('reads the send log and survives a corrupt line', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'zoe-status-'));
    process.env.ZOE_HOME = dir;
    writeFileSync(
      join(dir, 'send-budget-log.jsonl'),
      `${JSON.stringify(send('2026-10-26T13:30:00Z', 'sent', 'from disk'))}\n{not json\n`,
    );
    const text = await buildStatus(NOW);
    expect(text).toContain('09:30 sent - from disk');
  });

  it('a missing send log is an empty list, not a crash', async () => {
    process.env.ZOE_HOME = mkdtempSync(join(tmpdir(), 'zoe-status-empty-'));
    const text = await buildStatus(NOW);
    expect(text).toContain('Today: 0 sent, 0 held, 0 dropped');
  });
});

describe('owner gate on /status and the Refresh button', () => {
  const ZAAL = 111;
  const STRANGER = 222;

  function fakeCtx(fromId: number | undefined) {
    const calls = { reply: [] as unknown[][], answer: [] as unknown[][], edit: [] as unknown[][] };
    const ctx = {
      from: fromId === undefined ? undefined : { id: fromId },
      reply: async (...a: unknown[]) => {
        calls.reply.push(a);
      },
      answerCallbackQuery: async (...a: unknown[]) => {
        calls.answer.push(a);
      },
      editMessageText: async (...a: unknown[]) => {
        calls.edit.push(a);
      },
    };
    return { ctx: ctx as unknown as Context, calls };
  }

  function deps() {
    return {
      zaalId: ZAAL,
      ownerOnlyState: newOwnerOnlyState(),
      enabled: () => true,
      build: async () => 'STATUS TEXT',
      now: () => 0,
    };
  }

  it('a non-owner never sees the status, only the owner-only line', async () => {
    const { ctx, calls } = fakeCtx(STRANGER);
    await statusCommandHandler(deps())(ctx, async () => undefined);
    expect(calls.reply).toEqual([[OWNER_ONLY_LINE]]);
    expect(JSON.stringify(calls.reply)).not.toContain('STATUS TEXT');
  });

  it('a non-owner asking again inside the hour gets silence', async () => {
    const d = deps();
    const first = fakeCtx(STRANGER);
    await statusCommandHandler(d)(first.ctx, async () => undefined);
    const second = fakeCtx(STRANGER);
    await statusCommandHandler(d)(second.ctx, async () => undefined);
    expect(second.calls.reply).toEqual([]);
  });

  it('an update with no sender gets nothing', async () => {
    const { ctx, calls } = fakeCtx(undefined);
    await statusCommandHandler(deps())(ctx, async () => undefined);
    expect(calls.reply).toEqual([]);
  });

  it('the owner gets the status with the Refresh button', async () => {
    const { ctx, calls } = fakeCtx(ZAAL);
    await statusCommandHandler(deps())(ctx, async () => undefined);
    expect(calls.reply).toEqual([['STATUS TEXT', { reply_markup: statusKeyboard() }]]);
  });

  it('switched off, the command falls through and replies nothing', async () => {
    const { ctx, calls } = fakeCtx(ZAAL);
    let passed = false;
    await statusCommandHandler({ ...deps(), enabled: () => false })(ctx, async () => {
      passed = true;
    });
    expect(passed).toBe(true);
    expect(calls.reply).toEqual([]);
  });

  it('a non-owner tapping Refresh gets an empty answer and no edit', async () => {
    const { ctx, calls } = fakeCtx(STRANGER);
    await statusRefreshHandler(deps())(ctx);
    expect(calls.answer).toEqual([[]]);
    expect(calls.edit).toEqual([]);
  });

  it('the owner tapping Refresh gets the status edited in place', async () => {
    const { ctx, calls } = fakeCtx(ZAAL);
    await statusRefreshHandler(deps())(ctx);
    expect(calls.answer).toEqual([[{ text: 'Refreshed' }]]);
    expect(calls.edit).toEqual([['STATUS TEXT', { reply_markup: statusKeyboard() }]]);
  });
});

describe('a JSONL row that parses to null', () => {
  const prevHome = process.env.ZOE_HOME;
  afterEach(() => {
    if (prevHome === undefined) delete process.env.ZOE_HOME;
    else process.env.ZOE_HOME = prevHome;
  });

  it('is skipped instead of crashing the render', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'zoe-status-null-'));
    process.env.ZOE_HOME = dir;
    writeFileSync(
      join(dir, 'send-budget-log.jsonl'),
      `null\n42\n"text"\n${JSON.stringify(send('2026-10-26T13:40:00Z', 'sent', 'after nulls'))}\n`,
    );
    const text = await buildStatus(NOW);
    expect(text).toContain('09:40 sent - after nulls');
  });
});
