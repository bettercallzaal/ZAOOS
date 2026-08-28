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
  readDeferred,
  readSendLog,
  renderDeferredBatch,
  resetSendBudgetForTest,
  resolveSendClass,
  runWithSendClass,
  currentSendClass,
  sendBudgetEnabled,
  sendsToday,
  stripSendClass,
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
