/**
 * send-budget.test.ts - the gate that bounds ZOE's daily Telegram volume.
 *
 * The pure core (decide) is pinned first because it is where the whole policy
 * lives; the wrapper tests then prove that policy actually reaches the wire -
 * that a dropped send never calls the underlying API, that a deferred one is
 * recoverable in the morning, and that neither is silent.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  DEFAULT_DAILY_SEND_CAP,
  DEFAULT_NOISE_SHARE,
  effectiveCap,
  noiseShare,
  MAX_DEFERRED,
  dailySendCap,
  decide,
  drainDeferred,
  easternDay,
  gateSend,
  installSendBudget,
  isBatchFragment,
  readDeferred,
  readSendLog,
  renderDeferredBatch,
  requeueDeferred,
  resetSendBudgetForTest,
  resolveSendClass,
  runWithSendClass,
  currentSendClass,
  sendBudgetEnabled,
  sendsToday,
  stripSendClass,
  wasSendBlocked,
  assertSendDelivered,
  SendBlockedError,
  type DeferredSend,
  type SendClass,
} from '../send-budget';

let home: string;
const savedEnv = { ...process.env };

beforeEach(async () => {
  home = await fs.mkdtemp(join(tmpdir(), 'zoe-send-budget-'));
  process.env.ZOE_HOME = home;
  delete process.env.ZOE_DAILY_SEND_CAP;
  delete process.env.ZOE_SEND_BUDGET;
  resetSendBudgetForTest();
  // The gate is deliberately loud; keep the suite readable.
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  process.env = { ...savedEnv };
  resetSendBudgetForTest();
});

/**
 * A raw send that records what it was handed - including how many arguments it
 * actually received, because arity is load-bearing for the plain-send path.
 * Declared as a `function` (not an arrow) so `arguments` is real.
 */
function recordingSend() {
  const calls: Array<{ chatId: number; text: string; opts?: Record<string, unknown>; argc: number }> = [];
  const send = async function (chatId: number, text: string, opts?: Record<string, unknown>) {
    // eslint-disable-next-line prefer-rest-params
    const argc = arguments.length;
    calls.push({ chatId, text, opts, argc });
    return { message_id: 100 + calls.length };
  };
  return { send: send as (c: number, t: string, o?: Record<string, unknown>) => Promise<unknown>, calls };
}

// ---------------------------------------------------------------------------
// The policy table
// ---------------------------------------------------------------------------

describe('decide - the policy', () => {
  it('lets a direct reply through under the cap, and does not count it', () => {
    const d = decide('reply', 0, 20);
    expect(d.allow).toBe(true);
    expect(d.outcome).toBe('sent');
    expect(d.counts).toBe(false);
  });

  it('lets a direct reply through even when the cap is spent', () => {
    const d = decide('reply', 999, 20);
    expect(d.allow).toBe(true);
    expect(d.outcome).toBe('sent');
    expect(d.counts).toBe(false);
    expect(d.reason).toContain('over cap');
  });

  it('lets a gated needs-you card through when the cap is spent, and counts it', () => {
    const under = decide('gated', 3, 20);
    expect(under.allow).toBe(true);
    expect(under.counts).toBe(true);

    const over = decide('gated', 20, 20);
    expect(over.allow).toBe(true);
    expect(over.outcome).toBe('sent');
    expect(over.counts).toBe(true);
  });

  it('sends a status message under the cap and counts it', () => {
    const d = decide('status', 19, 20);
    expect(d.allow).toBe(true);
    expect(d.counts).toBe(true);
  });

  it('drops a status message once the cap is spent', () => {
    const d = decide('status', 20, 20);
    expect(d.allow).toBe(false);
    expect(d.outcome).toBe('dropped');
    expect(d.counts).toBe(false); // a send that never left does not spend budget
    expect(d.reason).toContain('dropped');
  });

  it('defers a brief/digest/reflection once the cap is spent', () => {
    const d = decide('digest', 20, 20);
    expect(d.allow).toBe(false);
    expect(d.outcome).toBe('deferred');
    expect(d.reason).toContain('morning batch');
  });

  it('treats the cap as exclusive - the Nth send passes, the N+1th does not', () => {
    expect(decide('status', 19, 20).allow).toBe(true);
    expect(decide('status', 20, 20).allow).toBe(false);
  });

  it('always carries a reason, for every class and either side of the cap', () => {
    const classes: SendClass[] = ['reply', 'gated', 'status', 'digest'];
    for (const cls of classes) {
      for (const count of [0, 20]) {
        expect(decide(cls, count, 20).reason.length).toBeGreaterThan(0);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// The two classes the 9,627-message corpus forced (alarm + noise)
// ---------------------------------------------------------------------------

describe('alarm - the class Zaal reliably answers', () => {
  it('always passes, cap spent or not', () => {
    expect(decide('alarm', 0, 20).allow).toBe(true);
    const over = decide('alarm', 500, 20);
    expect(over.allow).toBe(true);
    expect(over.outcome).toBe('sent');
  });

  it('NEVER queues - a deferred breakage notice is a lost one', () => {
    for (const count of [0, 20, 500]) {
      expect(decide('alarm', count, 20).outcome).not.toBe('deferred');
    }
  });

  it('counts, so the number stays honest about what went out', () => {
    expect(decide('alarm', 0, 20).counts).toBe(true);
  });

  it('reaches Telegram through the gate with the cap fully spent', async () => {
    process.env.ZOE_DAILY_SEND_CAP = '1';
    const { send, calls } = recordingSend();
    const gated = gateSend(send);
    await gated(1, 'burns the cap');
    await gated(1, 'a status that will not make it');
    await gated(1, 'ZOE bot crashed on boot', { zoeSendClass: 'alarm' });
    expect(calls.map((c) => c.text)).toEqual(['burns the cap', 'ZOE bot crashed on boot']);
    expect(await readDeferred()).toEqual([]);
  });
});

describe('noise - the eight zero-reply types, cut first', () => {
  it('defaults the reserve to a quarter of the day', () => {
    expect(noiseShare()).toBe(DEFAULT_NOISE_SHARE);
    expect(DEFAULT_NOISE_SHARE).toBe(0.25);
    expect(effectiveCap('noise', 20)).toBe(5);
  });

  it('leaves every other class on the full cap', () => {
    for (const cls of ['reply', 'alarm', 'gated', 'status', 'digest'] as SendClass[]) {
      expect(effectiveCap(cls, 20)).toBe(20);
    }
  });

  it('reads the reserve from ZOE_NOISE_SHARE and rejects an out-of-range one', () => {
    process.env.ZOE_NOISE_SHARE = '0.5';
    expect(effectiveCap('noise', 20)).toBe(10);
    process.env.ZOE_NOISE_SHARE = '2';
    expect(noiseShare()).toBe(DEFAULT_NOISE_SHARE);
    process.env.ZOE_NOISE_SHARE = 'some';
    expect(noiseShare()).toBe(DEFAULT_NOISE_SHARE);
  });

  it('runs out well before a status message does', () => {
    // 5 sends into a 20-cap day: noise is finished, status has 15 left.
    expect(decide('noise', 5, 20).allow).toBe(false);
    expect(decide('status', 5, 20).allow).toBe(true);
  });

  it('is dropped, never deferred - re-sending tomorrow what he ignored 1,116 times saves nothing', () => {
    expect(decide('noise', 5, 20).outcome).toBe('dropped');
  });

  it('says the noise reserve, not the cap, bound it', () => {
    expect(decide('noise', 5, 20).reason).toContain('noise reserve');
    expect(decide('noise', 5, 20).cap).toBe(5);
  });

  it('is the first traffic the gate actually cuts', async () => {
    process.env.ZOE_DAILY_SEND_CAP = '4'; // noise reserve = 1
    const { send, calls } = recordingSend();
    const gated = gateSend(send);
    await gated(1, 'watchdog restarted a lane', { zoeSendClass: 'noise' });
    await gated(1, 'another watchdog restart', { zoeSendClass: 'noise' });
    await gated(1, 'an ordinary status');
    expect(calls.map((c) => c.text)).toEqual(['watchdog restarted a lane', 'an ordinary status']);
    const log = await readSendLog();
    expect(log).toHaveLength(1);
    expect(log[0].cls).toBe('noise');
    expect(log[0].outcome).toBe('dropped');
  });
});

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

describe('config', () => {
  it('defaults the cap to 20', () => {
    expect(dailySendCap()).toBe(DEFAULT_DAILY_SEND_CAP);
    expect(DEFAULT_DAILY_SEND_CAP).toBe(20);
  });

  it('reads the cap from ZOE_DAILY_SEND_CAP', () => {
    process.env.ZOE_DAILY_SEND_CAP = '5';
    expect(dailySendCap()).toBe(5);
  });

  it('falls back to the default on garbage or a non-positive cap', () => {
    process.env.ZOE_DAILY_SEND_CAP = 'lots';
    expect(dailySendCap()).toBe(20);
    process.env.ZOE_DAILY_SEND_CAP = '0';
    expect(dailySendCap()).toBe(20);
    process.env.ZOE_DAILY_SEND_CAP = '-3';
    expect(dailySendCap()).toBe(20);
  });

  it('enforces by default and disables only on ZOE_SEND_BUDGET=off', () => {
    expect(sendBudgetEnabled()).toBe(true);
    process.env.ZOE_SEND_BUDGET = 'off';
    expect(sendBudgetEnabled()).toBe(false);
    process.env.ZOE_SEND_BUDGET = 'on';
    expect(sendBudgetEnabled()).toBe(true);
  });

  it('keys the day to America/New_York, not UTC', () => {
    // 2026-08-27T02:00Z is still the 26th in New York (22:00 EDT).
    expect(easternDay(new Date('2026-08-27T02:00:00Z'))).toBe('2026-08-26');
    expect(easternDay(new Date('2026-08-27T13:00:00Z'))).toBe('2026-08-27');
  });
});

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

describe('classification', () => {
  it('defaults an untagged send to status - the capped class', () => {
    expect(resolveSendClass()).toBe('status');
    expect(currentSendClass()).toBeUndefined();
  });

  it('takes the class from the enclosing context', () => {
    runWithSendClass('reply', () => {
      expect(currentSendClass()).toBe('reply');
      expect(resolveSendClass()).toBe('reply');
    });
    expect(currentSendClass()).toBeUndefined();
  });

  it('lets an explicit opts hint override the enclosing context', () => {
    runWithSendClass('digest', () => {
      expect(resolveSendClass({ zoeSendClass: 'gated' })).toBe('gated');
    });
  });

  it('ignores a bogus hint rather than trusting it', () => {
    expect(resolveSendClass({ zoeSendClass: 'urgent' })).toBe('status');
  });

  it('strips the private hint so Telegram never sees it', () => {
    expect(stripSendClass({ zoeSendClass: 'gated', message_thread_id: 7 })).toEqual({
      message_thread_id: 7,
    });
    expect(stripSendClass(undefined)).toBeUndefined();
    expect(stripSendClass({ message_thread_id: 7 })).toEqual({ message_thread_id: 7 });
  });

  it('carries the context across an await', async () => {
    await runWithSendClass('digest', async () => {
      await Promise.resolve();
      expect(currentSendClass()).toBe('digest');
    });
  });
});

// ---------------------------------------------------------------------------
// The gate on the wire
// ---------------------------------------------------------------------------

describe('gateSend', () => {
  it('passes a send through under the cap and returns the real result', async () => {
    const { send, calls } = recordingSend();
    const gated = gateSend(send);
    const res = (await gated(1, 'hello')) as { message_id: number };
    expect(calls).toHaveLength(1);
    expect(res.message_id).toBe(101);
    expect(await sendsToday()).toBe(1);
  });

  it('does not call the underlying API once the cap is spent', async () => {
    process.env.ZOE_DAILY_SEND_CAP = '2';
    const { send, calls } = recordingSend();
    const gated = gateSend(send);
    await gated(1, 'one');
    await gated(1, 'two');
    const blocked = (await gated(1, 'three')) as { message_id: number; zoeSendBudget: string };
    expect(calls).toHaveLength(2);
    expect(blocked.message_id).toBe(0);
    expect(blocked.zoeSendBudget).toBe('dropped');
  });

  it('never counts a blocked send against the budget', async () => {
    process.env.ZOE_DAILY_SEND_CAP = '1';
    const { send } = recordingSend();
    const gated = gateSend(send);
    await gated(1, 'one');
    await gated(1, 'two');
    await gated(1, 'three');
    expect(await sendsToday()).toBe(1);
  });

  it('always lets a direct reply to Zaal through, cap spent or not', async () => {
    process.env.ZOE_DAILY_SEND_CAP = '1';
    const { send, calls } = recordingSend();
    const gated = gateSend(send);
    await gated(1, 'burns the cap');
    await runWithSendClass('reply', async () => {
      await gated(1, 'he asked a question');
      await gated(1, 'and a follow-up');
    });
    expect(calls.map((c) => c.text)).toEqual(['burns the cap', 'he asked a question', 'and a follow-up']);
    // Replies are solicited, so they never spend budget.
    expect(await sendsToday()).toBe(1);
  });

  it('always lets a gated needs-you card through, and counts it', async () => {
    process.env.ZOE_DAILY_SEND_CAP = '1';
    const { send, calls } = recordingSend();
    const gated = gateSend(send);
    await gated(1, 'burns the cap');
    await gated(1, 'approve this?', { zoeSendClass: 'gated' });
    expect(calls).toHaveLength(2);
    expect(await sendsToday()).toBe(2);
  });

  it('queues a digest into the morning batch instead of dropping it', async () => {
    process.env.ZOE_DAILY_SEND_CAP = '1';
    const { send, calls } = recordingSend();
    const gated = gateSend(send);
    await gated(1, 'burns the cap');
    const held = (await gated(1, 'evening reflection', { zoeSendClass: 'digest' })) as {
      zoeSendBudget: string;
    };
    expect(calls).toHaveLength(1);
    expect(held.zoeSendBudget).toBe('deferred');

    const queued = await readDeferred();
    expect(queued).toHaveLength(1);
    expect(queued[0].text).toBe('evening reflection');
    expect(queued[0].cls).toBe('digest');
  });

  it('drains the deferred queue exactly once', async () => {
    process.env.ZOE_DAILY_SEND_CAP = '0'; // invalid -> default 20; use a real 1 instead
    process.env.ZOE_DAILY_SEND_CAP = '1';
    const { send } = recordingSend();
    const gated = gateSend(send);
    await gated(1, 'burns the cap');
    await gated(1, 'brief', { zoeSendClass: 'digest' });
    await gated(1, 'digest', { zoeSendClass: 'digest' });

    const first = await drainDeferred();
    expect(first.map((e) => e.text)).toEqual(['brief', 'digest']);
    expect(await drainDeferred()).toEqual([]);
  });

  it('requeues a drained batch when the morning send never left the process', async () => {
    process.env.ZOE_DAILY_SEND_CAP = '1';
    const { send } = recordingSend();
    const gated = gateSend(send);
    await gated(1, 'burns the cap');
    await gated(1, 'brief', { zoeSendClass: 'digest' });
    await gated(1, 'digest', { zoeSendClass: 'digest' });

    const held = await drainDeferred();
    expect(await readDeferred()).toEqual([]); // the drain really did clear it

    // The batch send failed. Without the restore these two are gone for good.
    await requeueDeferred(held);
    expect((await readDeferred()).map((e) => e.text)).toEqual(['brief', 'digest']);
  });

  it('puts a requeued batch ahead of anything deferred since the drain', async () => {
    process.env.ZOE_DAILY_SEND_CAP = '1';
    const { send } = recordingSend();
    const gated = gateSend(send);
    await gated(1, 'burns the cap');
    await gated(1, 'older', { zoeSendClass: 'digest' });

    const held = await drainDeferred();
    await gated(1, 'newer', { zoeSendClass: 'digest' });
    await requeueDeferred(held);

    expect((await readDeferred()).map((e) => e.text)).toEqual(['older', 'newer']);
  });

  it('requeueing nothing leaves the queue untouched', async () => {
    process.env.ZOE_DAILY_SEND_CAP = '1';
    const { send } = recordingSend();
    const gated = gateSend(send);
    await gated(1, 'burns the cap');
    await gated(1, 'still waiting', { zoeSendClass: 'digest' });

    await requeueDeferred([]);
    expect((await readDeferred()).map((e) => e.text)).toEqual(['still waiting']);
  });

  it('keeps the newest MAX_DEFERRED when a requeue overflows the queue', async () => {
    const stale: DeferredSend[] = Array.from({ length: MAX_DEFERRED }, (_, i) => ({
      at: '2026-09-05T10:00:00.000Z',
      cls: 'digest' as SendClass,
      chatId: 1,
      text: `old-${i}`,
    }));
    await requeueDeferred(stale);

    await requeueDeferred([
      { at: '2026-09-04T10:00:00.000Z', cls: 'digest', chatId: 1, text: 'older-still' },
    ]);

    const queue = await readDeferred();
    expect(queue).toHaveLength(MAX_DEFERRED);
    expect(queue.some((e) => e.text === 'older-still')).toBe(false);
    expect(queue[0].text).toBe('old-0');
  });

  it('logs every drop and every deferral - nothing is silent', async () => {
    process.env.ZOE_DAILY_SEND_CAP = '1';
    const { send } = recordingSend();
    const gated = gateSend(send);
    await gated(1, 'burns the cap');
    await gated(1, 'a status nobody will see');
    await gated(1, 'a brief held for morning', { zoeSendClass: 'digest' });

    const log = await readSendLog();
    expect(log.map((r) => r.outcome)).toEqual(['dropped', 'deferred']);
    expect(log[0].preview).toContain('a status nobody will see');
    expect(log[0].cap).toBe(1);
    expect(log[0].reason.length).toBeGreaterThan(0);
    // console.warn is the journald half of "never silent".
    expect(console.warn).toHaveBeenCalled();
  });

  it('strips the class hint before the send reaches Telegram', async () => {
    const { send, calls } = recordingSend();
    const gated = gateSend(send);
    await gated(1, 'hi', { zoeSendClass: 'gated', message_thread_id: 4 });
    expect(calls[0].opts).toEqual({ message_thread_id: 4 });
  });

  it('preserves send arity for a plain send with no options', async () => {
    const { send, calls } = recordingSend();
    const gated = gateSend(send);
    await gated(1, 'plain');
    expect(calls[0].argc).toBe(2);
  });

  it('passes everything through untouched when the budget is off', async () => {
    process.env.ZOE_SEND_BUDGET = 'off';
    process.env.ZOE_DAILY_SEND_CAP = '1';
    const { send, calls } = recordingSend();
    const gated = gateSend(send);
    await gated(1, 'one');
    await gated(1, 'two');
    await gated(1, 'three');
    expect(calls).toHaveLength(3);
  });

  it('resets the counter when the day rolls over in New York', async () => {
    process.env.ZOE_DAILY_SEND_CAP = '1';
    const { send, calls } = recordingSend();
    let clock = new Date('2026-08-26T20:00:00Z'); // 16:00 EDT on the 26th
    const gated = gateSend(send, () => clock);
    await gated(1, 'day one');
    await gated(1, 'day one, over cap');
    expect(calls).toHaveLength(1);

    clock = new Date('2026-08-27T20:00:00Z'); // 16:00 EDT on the 27th
    await gated(1, 'day two');
    expect(calls.map((c) => c.text)).toEqual(['day one', 'day two']);
  });

  it('survives a restart without handing back a fresh budget', async () => {
    process.env.ZOE_DAILY_SEND_CAP = '2';
    const { send, calls } = recordingSend();
    await gateSend(send)(1, 'one');
    resetSendBudgetForTest(); // simulate the process restarting
    const afterRestart = gateSend(send);
    await afterRestart(1, 'two');
    await afterRestart(1, 'three');
    expect(calls.map((c) => c.text)).toEqual(['one', 'two']);
  });

  it('fails OPEN when the state cannot be read - a broken budget never mutes ZOE', async () => {
    process.env.ZOE_DAILY_SEND_CAP = '1';
    // Point ZOE_HOME at a path whose parent is a file, so every fs op errors.
    const blocker = join(home, 'not-a-dir');
    await fs.writeFile(blocker, 'x', 'utf8');
    process.env.ZOE_HOME = join(blocker, 'zoe');
    resetSendBudgetForTest();

    const { send, calls } = recordingSend();
    const gated = gateSend(send);
    await gated(1, 'one');
    await gated(1, 'two');
    await gated(1, 'three');
    // Reads fall back to a zero counter and writes fail loudly; sends still go.
    expect(calls.length).toBeGreaterThanOrEqual(1);
  });

  it('never throws out of a blocked send', async () => {
    process.env.ZOE_DAILY_SEND_CAP = '1';
    const { send } = recordingSend();
    const gated = gateSend(send);
    await gated(1, 'one');
    await expect(gated(1, 'two')).resolves.toMatchObject({ message_id: 0 });
  });
});

// ---------------------------------------------------------------------------
// Install + batch rendering
// ---------------------------------------------------------------------------

describe('installSendBudget', () => {
  it('replaces bot.api.sendMessage in place so every existing call site is gated', async () => {
    process.env.ZOE_DAILY_SEND_CAP = '1';
    const calls: string[] = [];
    const bot = {
      api: {
        sendMessage: async (_chatId: number, text: string) => {
          calls.push(text);
          return { message_id: 1 };
        },
      },
    };
    const original = bot.api.sendMessage;
    installSendBudget(bot as never);
    expect(bot.api.sendMessage).not.toBe(original);

    await bot.api.sendMessage(1, 'first');
    await bot.api.sendMessage(1, 'second');
    expect(calls).toEqual(['first']);
  });
});

describe('renderDeferredBatch', () => {
  it('renders one message carrying every held item', () => {
    const out = renderDeferredBatch([
      { at: '2026-08-26T22:15:00.000Z', cls: 'digest', chatId: 1, text: 'evening reflection' },
      { at: '2026-08-26T23:40:00.000Z', cls: 'digest', chatId: 1, text: 'nightly recap' },
    ]);
    expect(out).toContain('2 items');
    expect(out).toContain('evening reflection');
    expect(out).toContain('nightly recap');
    expect(out).toContain('22:15');
  });

  it('says item, not items, for a single held message', () => {
    const out = renderDeferredBatch([
      { at: '2026-08-26T22:15:00.000Z', cls: 'digest', chatId: 1, text: 'just one' },
    ]);
    expect(out).toContain('1 item,');
  });
});

describe('morning - the batch that drains the queue can never be queued', () => {
  it('always passes and counts, even far over the cap', () => {
    const d = decide('morning', 17, 3);
    expect(d.allow).toBe(true);
    expect(d.outcome).toBe('sent');
    expect(d.counts).toBe(true);
  });

  it('is accepted as an explicit class hint', () => {
    expect(resolveSendClass({ zoeSendClass: 'morning' })).toBe('morning');
  });

  it('a flush sent in the morning context over the cap is SENT, and nothing is re-queued', async () => {
    process.env.ZOE_DAILY_SEND_CAP = '1';
    const { send, calls } = recordingSend();
    const gated = gateSend(send);
    await gated(1, 'burns the cap');
    await runWithSendClass('morning', () => gated(1, 'Held back yesterday (2 items, over the daily send cap):'));
    expect(calls.map((c) => c.text)).toContain('Held back yesterday (2 items, over the daily send cap):');
    expect(await readDeferred()).toEqual([]);
  });

  it('the same flush as a digest (the old context) is deferred - the bug this class fixes', async () => {
    process.env.ZOE_DAILY_SEND_CAP = '1';
    const { send } = recordingSend();
    const gated = gateSend(send);
    await gated(1, 'burns the cap');
    await runWithSendClass('digest', () => gated(1, 'Held back yesterday (2 items, over the daily send cap):'));
    expect((await readDeferred()).map((e) => e.text)).toEqual([
      'Held back yesterday (2 items, over the daily send cap):',
    ]);
  });
});

describe('the scheduler drains the queue under the morning class', () => {
  it('the job that calls drainDeferred() runs in runWithSendClass(\'morning\'), not digest', async () => {
    // A source check, because the job is a cron closure with a dozen live
    // dependencies. It pins the one line that decides whether the flush can
    // defer itself: the nearest runWithSendClass before drainDeferred().
    const src = await fs.readFile(join(__dirname, '..', 'scheduler.ts'), 'utf8');
    const drainAt = src.indexOf('await drainDeferred()');
    expect(drainAt).toBeGreaterThan(0);
    const before = src.slice(0, drainAt);
    const m = [...before.matchAll(/runWithSendClass\('([a-z]+)'/g)].pop();
    expect(m?.[1]).toBe('morning');
  });
});

describe('renderDeferredBatch - never nests, never repeats', () => {
  const at = '2026-09-11T09:00:00.000Z';
  const e = (text: string, cls: DeferredSend['cls'] = 'digest'): DeferredSend => ({ at, cls, chatId: 1, text });

  it('recognises the fragments measured in the live queue on 2026-09-11', () => {
    expect(isBatchFragment('(1/41) Held back yesterday (44 items, over the daily send cap):')).toBe(true);
    expect(isBatchFragment('(2/41) - [09:00 digest] (2/38) - [09:00 digest] more')).toBe(true);
    expect(isBatchFragment('Held back yesterday (3 items, over the daily send cap):')).toBe(true);
  });

  it('does not mistake a real chunked digest for a fragment', () => {
    expect(isBatchFragment('(1/2) Cockpit - 2026-09-11\n104 open')).toBe(false);
    expect(isBatchFragment('(2/2) NEEDS YOUR REVIEW (open PRs)')).toBe(false);
    expect(isBatchFragment('Evening reflection - Thu Sep 10 9pm')).toBe(false);
  });

  it('leaves fragments out, says how many, and never nests them', () => {
    const out = renderDeferredBatch([
      e('(1/41) Held back yesterday (44 items, over the daily send cap):'),
      e('(2/41) - [09:00 digest] (2/38) - [09:00 digest] old'),
      e('Evening reflection - Thu Sep 10 9pm'),
    ]);
    expect(out).toContain('1 item,');
    expect(out).toContain('2 pieces of earlier held-back batches left out');
    expect(out).not.toContain('(2/41)');
    expect(out).toContain('Evening reflection');
  });

  it('a chunk that starts MID-ITEM is still a fragment when its batch head was queued with it', () => {
    const atMs = (ms: number) => new Date(Date.parse(at) + ms).toISOString();
    const entries: DeferredSend[] = [
      { at, cls: 'digest', chatId: 1, text: '(1/41) Held back yesterday (44 items, over the daily send cap):' },
      { at: atMs(3000), cls: 'digest', chatId: 1, text: '(20/41) Reply with your call and I log it + move it off your plate.' },
      { at: atMs(4000), cls: 'digest', chatId: 1, text: "(24/41) 1. What shipped today?\n2. What's stuck?" },
      // A real chunked digest, hours away and a different N: kept.
      { at: atMs(3 * 3600_000), cls: 'digest', chatId: 1, text: '(1/2) Cockpit - 2026-09-11' },
      { at: atMs(3 * 3600_000 + 1000), cls: 'digest', chatId: 1, text: '(2/2) NEEDS YOUR REVIEW (open PRs)' },
      // Same N as the batch but a day later: not the batch's chunk, kept.
      { at: atMs(86_400_000), cls: 'digest', chatId: 1, text: '(7/41) an unrelated long digest' },
    ];
    const out = renderDeferredBatch(entries);
    expect(out).toContain('3 pieces of earlier held-back batches left out');
    expect(out).not.toContain('Reply with your call');
    expect(out).not.toContain('What shipped today');
    expect(out).toContain('(1/2) Cockpit');
    expect(out).toContain('(2/2) NEEDS YOUR REVIEW');
    expect(out).toContain('an unrelated long digest');
    expect(out).toContain('3 items');
  });

  it('shows an identical held message once, with its count', () => {
    const out = renderDeferredBatch([
      e('Handoff: images/content lane PARKED', 'status'),
      e('Handoff: images/content lane PARKED', 'status'),
      e('Handoff: images/content lane PARKED', 'status'),
      e('nightly recap'),
    ]);
    expect(out).toContain('4 items');
    expect(out).toContain('(x3) Handoff: images/content lane PARKED');
    expect(out.match(/Handoff: images/g)).toHaveLength(1);
  });

  it('a queue of nothing but fragments renders a head only, never an empty list', () => {
    const out = renderDeferredBatch([e('(3/41) - [09:00 digest] x')]);
    expect(out).toContain('0 items');
    expect(out).toContain('1 piece of earlier held-back batches left out');
  });
});

describe('deferred queue runaway guard', () => {
  it('keeps at most MAX_DEFERRED entries', async () => {
    process.env.ZOE_DAILY_SEND_CAP = '1';
    const { send } = recordingSend();
    const gated = gateSend(send);
    await gated(1, 'burns the cap');
    for (let i = 0; i < MAX_DEFERRED + 5; i++) {
      // eslint-disable-next-line no-await-in-loop
      await gated(1, `held ${i}`, { zoeSendClass: 'digest' });
    }
    const queued = await readDeferred();
    expect(queued).toHaveLength(MAX_DEFERRED);
    // The newest survive; the oldest are the ones reported as dropped.
    expect(queued[queued.length - 1].text).toBe(`held ${MAX_DEFERRED + 4}`);
  });
});

describe('wasSendBlocked - telling a blocked send from a real one', () => {
  it('is true for the value gateSend resolves with on a drop, and on a defer', async () => {
    process.env.ZOE_DAILY_SEND_CAP = '1';
    const { send } = recordingSend();
    const gated = gateSend(send);
    await gated(1, 'burns the cap');
    expect(wasSendBlocked(await gated(1, 'over cap', { zoeSendClass: 'status' }))).toBe(true);
    expect(wasSendBlocked(await gated(1, 'held', { zoeSendClass: 'digest' }))).toBe(true);
  });

  it('assertSendDelivered throws on the drop and on the defer, naming the outcome', async () => {
    process.env.ZOE_DAILY_SEND_CAP = '1';
    const { send } = recordingSend();
    const gated = gateSend(send);
    await gated(1, 'burns the cap');

    const dropped = await gated(1, 'over cap', { zoeSendClass: 'status' });
    expect(() => assertSendDelivered(dropped)).toThrow(SendBlockedError);
    expect(() => assertSendDelivered(dropped)).toThrow(/dropped/);

    const deferred = await gated(1, 'held', { zoeSendClass: 'digest' });
    expect(() => assertSendDelivered(deferred)).toThrow(/deferred/);
  });

  it('assertSendDelivered returns a delivered send untouched', async () => {
    process.env.ZOE_DAILY_SEND_CAP = '5';
    const { send } = recordingSend();
    const delivered = await gateSend(send)(1, 'under cap');
    expect(assertSendDelivered(delivered)).toBe(delivered);
    // And it is not fooled by a plain message_id 0 with no marker.
    const bare = { message_id: 0 };
    expect(assertSendDelivered(bare)).toBe(bare);
  });

  it('is false for a real Telegram Message, and for the empty answers', () => {
    // A delivered send returns whatever the API returned - never the sentinel.
    expect(wasSendBlocked({ message_id: 42, chat: { id: 1 } })).toBe(false);
    // message_id 0 alone is not the marker: the marker is the zoeSendBudget key.
    expect(wasSendBlocked({ message_id: 0 })).toBe(false);
    expect(wasSendBlocked(null)).toBe(false);
    expect(wasSendBlocked(undefined)).toBe(false);
  });
});
