// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  easternMinute,
  holdSend,
  inQuietWindow,
  parseClock,
  quietBounds,
  quietEnabled,
  quietQueuePath,
  readQuietQueue,
  releaseQuietQueue,
  shouldHold,
  unreadablePath,
} from '../quiet-window';
import { gateSend, resetSendBudgetForTest, runWithSendClass, wasSendBlocked } from '../send-budget';

const at = (iso: string) => new Date(iso);
const B = { from: 20 * 60 + 30, until: 4 * 60 + 45 };
const GROUP = -1003813973176;
const DM = 123456;
// Tue 13 Oct 2026, daylight time (UTC-4).
const NIGHT = at('2026-10-14T03:00:00Z'); // 23:00 Tue
const DAY = at('2026-10-13T18:00:00Z'); // 14:00 Tue

let home: string;
const saved = { ...process.env };
beforeEach(async () => {
  home = await fs.mkdtemp(join(tmpdir(), 'zoe-quiet-'));
  process.env.ZOE_HOME = home;
  delete process.env.ZOE_SEND_BUDGET;
  delete process.env.ZOE_QUIET;
  delete process.env.ZOE_QUIET_FROM;
  delete process.env.ZOE_QUIET_UNTIL;
  delete process.env.ZOE_TAG_ZAAL;
  resetSendBudgetForTest();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(async () => {
  vi.restoreAllMocks();
  process.env = { ...saved };
  await fs.rm(home, { recursive: true, force: true });
});

describe('flag and bounds', () => {
  it('is on only for the literal 1', () => {
    expect(quietEnabled({ ZOE_QUIET: '1' })).toBe(true);
    expect(quietEnabled({ ZOE_QUIET: 'true' })).toBe(false);
    expect(quietEnabled({})).toBe(false);
  });
  it('defaults to 20:30 until 04:45', () => {
    expect(quietBounds({})).toEqual(B);
  });
  it('a bound that does not parse keeps the default: a typo must not open the night', () => {
    expect(parseClock('8:30pm', 1230)).toBe(1230);
    expect(parseClock('25:00', 1230)).toBe(1230);
    expect(parseClock('21:15', 1230)).toBe(1275);
    expect(quietBounds({ ZOE_QUIET_FROM: 'late', ZOE_QUIET_UNTIL: '05:30' })).toEqual({ from: 1230, until: 330 });
  });
});

describe('the window edges, on both sides of the 1 November clock change', () => {
  it.each([
    // Daylight time, UTC-4. Fri 30 Oct into Sat 31 Oct.
    ['2026-10-31T00:29:00Z', false, 'EDT 20:29, one minute before'],
    ['2026-10-31T00:30:00Z', true, 'EDT 20:30, the first quiet minute'],
    ['2026-10-31T08:44:00Z', true, 'EDT 04:44, the last quiet minute'],
    ['2026-10-31T08:45:00Z', false, 'EDT 04:45, the first open minute'],
    // Standard time, UTC-5. Mon 2 Nov into Tue 3 Nov.
    ['2026-11-03T01:29:00Z', false, 'EST 20:29, one minute before'],
    ['2026-11-03T01:30:00Z', true, 'EST 20:30, the first quiet minute'],
    ['2026-11-03T09:44:00Z', true, 'EST 04:44, the last quiet minute'],
    ['2026-11-03T09:45:00Z', false, 'EST 04:45, the first open minute'],
    // The UTC instants that were the edges last week are NOT the edges now.
    ['2026-11-03T00:30:00Z', false, 'EST 19:30: 00:30 UTC was 20:30 in October'],
    ['2026-11-03T08:45:00Z', true, 'EST 03:45: 08:45 UTC was 04:45 in October'],
  ])('%s -> quiet=%s (%s)', (iso, quiet) => {
    expect(inQuietWindow(at(iso as string), B)).toBe(quiet);
  });

  it('the night of the change itself: quiet the whole way through the repeated hour', () => {
    // Sun 1 Nov 2026: 02:00 EDT becomes 01:00 EST at 06:00 UTC.
    for (const iso of ['2026-11-01T04:30:00Z', '2026-11-01T05:30:00Z', '2026-11-01T06:30:00Z', '2026-11-01T09:44:00Z']) {
      expect(inQuietWindow(at(iso), B)).toBe(true);
    }
    expect(easternMinute(at('2026-11-01T05:30:00Z'))).toBe(90); // 01:30 EDT
    expect(easternMinute(at('2026-11-01T06:30:00Z'))).toBe(90); // 01:30 EST, the repeat
    expect(inQuietWindow(at('2026-11-01T09:45:00Z'), B)).toBe(false); // 04:45 EST
  });

  it('a window that does not cross midnight, and an empty one', () => {
    const noon = { from: 12 * 60, until: 13 * 60 };
    expect(inQuietWindow(at('2026-10-13T16:30:00Z'), noon)).toBe(true); // 12:30
    expect(inQuietWindow(at('2026-10-13T17:00:00Z'), noon)).toBe(false); // 13:00
    expect(inQuietWindow(NIGHT, { from: 600, until: 600 })).toBe(false);
  });
});

describe('shouldHold', () => {
  beforeEach(() => {
    process.env.ZOE_QUIET = '1';
  });
  it.each(['status', 'digest', 'noise', 'gated', 'alarm'] as const)('holds class %s at night', (cls) => {
    expect(shouldHold(cls, undefined, NIGHT)).toBe(true);
  });
  it('never holds a reply: he wrote or tapped, and this is the answer', () => {
    expect(shouldHold('reply', undefined, NIGHT)).toBe(false);
  });
  it('does not hold the morning brief (it has its own queue and re-queue path)', () => {
    expect(shouldHold('morning', undefined, NIGHT)).toBe(false);
  });
  it('the ONE exception: an alarm the sender marked as an outage', () => {
    expect(shouldHold('alarm', { zoeOutage: true }, NIGHT)).toBe(false);
  });
  it('the exception is narrow: the mark alone, or a truthy non-true value, is not enough', () => {
    expect(shouldHold('gated', { zoeOutage: true }, NIGHT)).toBe(true);
    expect(shouldHold('status', { zoeOutage: true }, NIGHT)).toBe(true);
    expect(shouldHold('alarm', { zoeOutage: 'true' }, NIGHT)).toBe(true);
    expect(shouldHold('alarm', { zoeOutage: 1 }, NIGHT)).toBe(true);
  });
  it('holds nothing in the daytime', () => {
    expect(shouldHold('gated', undefined, DAY)).toBe(false);
  });
  it('red control: flag off, nothing is held at night either', () => {
    delete process.env.ZOE_QUIET;
    expect(shouldHold('gated', undefined, NIGHT)).toBe(false);
  });
});

describe('gateSend with the window', () => {
  const sender = (now: Date) => {
    const calls: Array<[number, string, Record<string, unknown> | undefined]> = [];
    const raw = async (chatId: number, text: string, opts?: Record<string, unknown>) => {
      calls.push([chatId, text, opts]);
      return { message_id: calls.length };
    };
    return { calls, send: gateSend(raw, () => now) };
  };

  it('red control: flag off, a night send goes out and no queue file is made', async () => {
    const s = sender(NIGHT);
    const r = await runWithSendClass('gated', () => s.send(DM, 'pick A or B'));
    expect(wasSendBlocked(r)).toBe(false);
    expect(s.calls).toEqual([[DM, 'pick A or B', undefined]]);
    await expect(fs.stat(quietQueuePath())).rejects.toThrow();
  });

  it('at night an ask is held: not sent, reported as deferred, in the queue with its buttons', async () => {
    process.env.ZOE_QUIET = '1';
    const s = sender(NIGHT);
    const keyboard = { inline_keyboard: [[{ text: 'A', callback_data: 'q:x:QQ' }]] };
    const r = await runWithSendClass('gated', () => s.send(DM, 'pick A or B', { reply_markup: keyboard, message_thread_id: 7 }));
    expect(s.calls).toEqual([]);
    expect(r).toEqual({ message_id: 0, zoeSendBudget: 'deferred' });
    expect(await readQuietQueue()).toEqual([
      { at: NIGHT.toISOString(), cls: 'gated', chatId: DM, text: 'pick A or B', opts: { reply_markup: keyboard, message_thread_id: 7 } },
    ]);
  });

  it('at night a reply to him still goes out', async () => {
    process.env.ZOE_QUIET = '1';
    const s = sender(NIGHT);
    await runWithSendClass('reply', () => s.send(DM, 'here you go'));
    expect(s.calls).toHaveLength(1);
    expect(await readQuietQueue()).toEqual([]);
  });

  it('an outage alarm goes out at night, and Telegram never sees the mark', async () => {
    process.env.ZOE_QUIET = '1';
    const s = sender(NIGHT);
    await s.send(GROUP, 'ZOE cannot reach Telegram', { zoeSendClass: 'alarm', zoeOutage: true, parse_mode: 'HTML' });
    expect(s.calls).toEqual([[GROUP, 'ZOE cannot reach Telegram', { parse_mode: 'HTML' }]]);
  });

  it('an ordinary alarm waits for morning', async () => {
    process.env.ZOE_QUIET = '1';
    const s = sender(NIGHT);
    await s.send(GROUP, 'no auto-fix target', { zoeSendClass: 'alarm' });
    expect(s.calls).toEqual([]);
    expect((await readQuietQueue())[0]).toMatchObject({ cls: 'alarm', text: 'no auto-fix target' });
  });

  it('in the daytime, flag on, nothing is held', async () => {
    process.env.ZOE_QUIET = '1';
    const s = sender(DAY);
    await runWithSendClass('gated', () => s.send(DM, 'pick A or B'));
    expect(s.calls).toHaveLength(1);
  });

  it('a sender that retries the same card all night queues it ONCE', async () => {
    process.env.ZOE_QUIET = '1';
    const s = sender(NIGHT);
    for (let i = 0; i < 5; i++) await runWithSendClass('gated', () => s.send(DM, 'the same card'));
    await runWithSendClass('gated', () => s.send(GROUP, 'the same card')); // a different chat is its own message
    expect((await readQuietQueue()).map((e) => e.chatId)).toEqual([DM, GROUP]);
  });

  it('the same text to two topics, or with different buttons, is two messages', async () => {
    process.env.ZOE_QUIET = '1';
    const s = sender(NIGHT);
    await runWithSendClass('alarm', () => s.send(GROUP, 'Build failed', { message_thread_id: 1 }));
    await runWithSendClass('alarm', () => s.send(GROUP, 'Build failed', { message_thread_id: 2 }));
    await runWithSendClass('alarm', () => s.send(GROUP, 'Build failed', { message_thread_id: 2 })); // a true repeat
    await runWithSendClass('status', () => s.send(GROUP, 'Build failed', { message_thread_id: 2 })); // another class
    expect((await readQuietQueue()).map((e) => [e.cls, e.opts?.message_thread_id])).toEqual([
      ['alarm', 1],
      ['alarm', 2],
      ['status', 2],
    ]);
  });

  it('the window still holds when the budget itself is switched off', async () => {
    process.env.ZOE_QUIET = '1';
    process.env.ZOE_SEND_BUDGET = 'off';
    const s = sender(NIGHT);
    await runWithSendClass('status', () => s.send(DM, 'fyi'));
    expect(s.calls).toEqual([]);
  });

  it('fails open: if the queue cannot be written, the message is sent', async () => {
    process.env.ZOE_QUIET = '1';
    await fs.mkdir(quietQueuePath()); // a directory where the file should be
    const s = sender(NIGHT);
    const r = await runWithSendClass('alarm', () => s.send(DM, 'something broke'));
    expect(wasSendBlocked(r)).toBe(false);
    expect(s.calls).toHaveLength(1);
  });

  it('the tag is applied before holding, so the held text is what arrives', async () => {
    process.env.ZOE_QUIET = '1';
    process.env.ZOE_TAG_ZAAL = '1';
    const s = sender(NIGHT);
    await runWithSendClass('gated', () => s.send(GROUP, 'pick A or B'));
    expect((await readQuietQueue())[0].text).toBe('@bettercallzaal pick A or B');
  });
});

describe('releaseQuietQueue', () => {
  const entry = (n: number, extra: Record<string, unknown> = {}) => ({
    at: `2026-10-14T03:0${n}:00.000Z`,
    cls: 'gated' as const,
    chatId: DM,
    text: `msg ${n}`,
    ...extra,
  });
  const collect = (blockAt = -1, throwAt = -1) => {
    const sent: Array<{ text: string; opts: Record<string, unknown> }> = [];
    let n = 0;
    const send = async (_c: number | string, text: string, opts: Record<string, unknown>) => {
      const i = n++;
      if (i === throwAt) throw new Error('Telegram unavailable');
      if (i === blockAt) return { message_id: 0, zoeSendBudget: 'dropped' };
      sent.push({ text, opts });
      return { message_id: 100 + i };
    };
    return { sent, send };
  };
  const MORNING = at('2026-10-14T08:45:00Z'); // 04:45 Wed

  beforeEach(() => {
    process.env.ZOE_QUIET = '1';
  });

  it('inside the window nothing is released', async () => {
    await holdSend(entry(1));
    const c = collect();
    expect(await releaseQuietQueue({ send: c.send, now: NIGHT, isBlocked: wasSendBlocked })).toEqual({ sent: 0, kept: 0 });
    expect(c.sent).toEqual([]);
    expect(await readQuietQueue()).toHaveLength(1);
  });

  it('at the window end everything goes out, oldest first, with its class and buttons', async () => {
    const keyboard = { inline_keyboard: [[{ text: 'A', callback_data: 'q:x:QQ' }]] };
    await holdSend(entry(1, { opts: { reply_markup: keyboard } }));
    await holdSend(entry(2, { cls: 'alarm' }));
    await holdSend(entry(3));
    const c = collect();
    expect(await releaseQuietQueue({ send: c.send, now: MORNING, isBlocked: wasSendBlocked })).toEqual({ sent: 3, kept: 0 });
    expect(c.sent.map((m) => m.text)).toEqual(['msg 1', 'msg 2', 'msg 3']);
    expect(c.sent[0].opts).toEqual({ reply_markup: keyboard, zoeSendClass: 'gated' });
    expect(c.sent[1].opts).toEqual({ zoeSendClass: 'alarm' });
    expect(await readQuietQueue()).toEqual([]);
  });

  it('a blocked message and everything after it are kept, in order, for the next tick', async () => {
    for (const n of [1, 2, 3, 4]) await holdSend(entry(n));
    const c = collect(1);
    expect(await releaseQuietQueue({ send: c.send, now: MORNING, isBlocked: wasSendBlocked })).toEqual({ sent: 1, kept: 3 });
    expect((await readQuietQueue()).map((e) => e.text)).toEqual(['msg 2', 'msg 3', 'msg 4']);
    const again = collect();
    expect(await releaseQuietQueue({ send: again.send, now: MORNING, isBlocked: wasSendBlocked })).toEqual({ sent: 3, kept: 0 });
    expect(again.sent.map((m) => m.text)).toEqual(['msg 2', 'msg 3', 'msg 4']);
  });

  it('a send that throws keeps that message too: nothing is dropped', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    for (const n of [1, 2]) await holdSend(entry(n));
    const c = collect(-1, 0);
    expect(await releaseQuietQueue({ send: c.send, now: MORNING, isBlocked: wasSendBlocked })).toEqual({ sent: 0, kept: 2 });
    expect((await readQuietQueue()).map((e) => e.text)).toEqual(['msg 1', 'msg 2']);
  });

  it('kept messages go back AHEAD of anything held since', async () => {
    for (const n of [1, 2]) await holdSend(entry(n));
    const c = collect(0);
    // A new message is held while the release is running (the send callback is the hook).
    const send = async (cid: number | string, text: string, opts: Record<string, unknown>) => {
      await fs.appendFile(quietQueuePath(), `${JSON.stringify(entry(9))}\n`);
      return c.send(cid, text, opts);
    };
    await releaseQuietQueue({ send, now: MORNING, isBlocked: wasSendBlocked });
    expect((await readQuietQueue()).map((e) => e.text)).toEqual(['msg 1', 'msg 2', 'msg 9']);
  });

  it('a line appended by another process (the zao-ask script) is released like any other', async () => {
    await fs.writeFile(
      quietQueuePath(),
      `${JSON.stringify({ at: 'x', cls: 'gated', chatId: String(GROUP), text: 'Q: ship it?', opts: { reply_markup: { inline_keyboard: [] } } })}\n`,
    );
    const c = collect();
    expect((await releaseQuietQueue({ send: c.send, now: MORNING, isBlocked: wasSendBlocked })).sent).toBe(1);
    expect(c.sent[0].text).toBe('Q: ship it?');
  });

  it('a torn line is KEPT in the unreadable file; the messages around it still go', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await fs.writeFile(quietQueuePath(), `${JSON.stringify(entry(1))}\n{"at": "x", "cls\n${JSON.stringify(entry(2))}\n`);
    const c = collect();
    expect((await releaseQuietQueue({ send: c.send, now: MORNING, isBlocked: wasSendBlocked })).sent).toBe(2);
    expect(await fs.readFile(unreadablePath(), 'utf8')).toBe('{"at": "x", "cls\n');
  });

  it('a crash mid-release repeats at most the message in flight, never the ones delivered', async () => {
    for (const n of [1, 2, 3]) await holdSend(entry(n));
    const first: string[] = [];
    // "Crash": the send for message 2 never returns control; the release is abandoned there.
    const crashing = async (_c: number | string, text: string) => {
      if (text === 'msg 2') throw Object.assign(new Error('process killed'), { fatal: true });
      first.push(text);
      return { message_id: 1 };
    };
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // Simulate the kill by reading the releasing file as the next process would find it.
    const releasing = join(home, 'quiet-queue.releasing.jsonl');
    let seenAfterFirst = '';
    const spy = async (c: number | string, text: string) => {
      if (text === 'msg 2') seenAfterFirst = await fs.readFile(releasing, 'utf8');
      return crashing(c, text);
    };
    await releaseQuietQueue({ send: spy, now: MORNING, isBlocked: wasSendBlocked });
    expect(first).toEqual(['msg 1']);
    // At the moment message 2 was in flight, the durable file no longer held message 1.
    expect(seenAfterFirst).not.toContain('msg 1');
    expect(seenAfterFirst).toContain('msg 2');
    expect(seenAfterFirst).toContain('msg 3');
  });

  it('a release that died leaves its file; the next one finishes it before taking new messages', async () => {
    const releasing = join(home, 'quiet-queue.releasing.jsonl');
    await fs.writeFile(releasing, `${JSON.stringify(entry(2))}\n${JSON.stringify(entry(3))}\n`);
    await holdSend(entry(7));
    const c = collect();
    expect(await releaseQuietQueue({ send: c.send, now: MORNING, isBlocked: wasSendBlocked })).toEqual({ sent: 2, kept: 0 });
    expect(c.sent.map((m) => m.text)).toEqual(['msg 2', 'msg 3']);
    expect((await readQuietQueue()).map((e) => e.text)).toEqual(['msg 7']);
    const next = collect();
    await releaseQuietQueue({ send: next.send, now: MORNING, isBlocked: wasSendBlocked });
    expect(next.sent.map((m) => m.text)).toEqual(['msg 7']);
  });

  it('an empty queue, or the flag off, does nothing', async () => {
    const c = collect();
    expect(await releaseQuietQueue({ send: c.send, now: MORNING, isBlocked: wasSendBlocked })).toEqual({ sent: 0, kept: 0 });
    await holdSend(entry(1));
    delete process.env.ZOE_QUIET;
    expect(await releaseQuietQueue({ send: c.send, now: MORNING, isBlocked: wasSendBlocked })).toEqual({ sent: 0, kept: 0 });
    expect(c.sent).toEqual([]);
  });

  it('end to end: held at night through the gate, released in the morning through the gate', async () => {
    const calls: Array<[number, string]> = [];
    const raw = async (chatId: number, text: string) => {
      calls.push([chatId, text]);
      return { message_id: calls.length };
    };
    let clock = NIGHT;
    const send = gateSend(raw, () => clock);
    await runWithSendClass('gated', () => send(DM, 'first'));
    await runWithSendClass('status', () => send(DM, 'second'));
    expect(calls).toEqual([]);
    clock = MORNING;
    const r = await releaseQuietQueue({
      send: (cid, text, opts) => send(cid as number, text, opts),
      now: MORNING,
      isBlocked: wasSendBlocked,
    });
    expect(r).toEqual({ sent: 2, kept: 0 });
    expect(calls).toEqual([
      [DM, 'first'],
      [DM, 'second'],
    ]);
  });
});
