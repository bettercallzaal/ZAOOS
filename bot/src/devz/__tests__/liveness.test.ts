import { describe, expect, it, vi } from 'vitest';
import type { Bot, Context } from 'grammy';
import {
  BEAT_INTERVAL_MS,
  POLL_STALE_MS,
  beatLine,
  newTracker,
  pollStatus,
  recordPoll,
  startBeat,
  trackPolling,
} from '../liveness';

const T0 = Date.parse('2026-10-17T12:00:00Z');

describe('pollStatus', () => {
  it.each([
    ['never polled', null, true, 'degraded'],
    ['polled just now', T0, true, 'up'],
    ['polled at the stale edge', T0 - POLL_STALE_MS, true, 'up'],
    ['last poll older than the stale window', T0 - POLL_STALE_MS - 1, true, 'degraded'],
    ['polling loop stopped', T0, false, 'down'],
  ] as const)('%s -> %s', (_label, lastPollAt, running, expected) => {
    const t = newTracker('devz');
    t.lastPollAt = lastPollAt;
    expect(pollStatus(t, running, T0)).toBe(expected);
  });
});

describe('recordPoll', () => {
  it('an ok empty poll moves last_poll but not last_update', () => {
    const t = newTracker('devz');
    recordPoll(t, true, 0, T0);
    expect(t).toMatchObject({ lastPollAt: T0, lastUpdateAt: null, updates: 0 });
  });

  it('a failed poll is not a poll', () => {
    const t = newTracker('devz');
    recordPoll(t, false, 0, T0);
    expect(t.lastPollAt).toBeNull();
  });

  it('updates are counted and dated', () => {
    const t = newTracker('devz');
    recordPoll(t, true, 3, T0);
    recordPoll(t, true, 2, T0 + 1000);
    expect(t).toMatchObject({ lastUpdateAt: T0 + 1000, updates: 5 });
  });
});

describe('beatLine', () => {
  it('names each bot, its status and both timestamps', () => {
    const devz = newTracker('devz');
    recordPoll(devz, true, 1, T0);
    const hermes = newTracker('hermes');
    expect(
      beatLine(
        [
          { t: devz, running: true },
          { t: hermes, running: true },
        ],
        T0,
      ),
    ).toBe(
      '[devz/beat] devz=up last_poll=2026-10-17T12:00:00.000Z last_update=2026-10-17T12:00:00.000Z updates=1 | hermes=degraded last_poll=never last_update=never updates=0',
    );
  });
});

type Transformer = (
  prev: (m: string, p: unknown, s?: AbortSignal) => Promise<{ ok: boolean; result?: unknown }>,
  method: string,
  payload: unknown,
  signal?: AbortSignal,
) => Promise<{ ok: boolean; result?: unknown }>;

function fakeBot(running = true): { bot: Bot<Context>; transformer: () => Transformer } {
  let installed: Transformer | null = null;
  const bot = {
    api: { config: { use: (fn: Transformer) => (installed = fn) } },
    isRunning: () => running,
  } as unknown as Bot<Context>;
  return { bot, transformer: () => installed as Transformer };
}

describe('trackPolling', () => {
  it('records an answered getUpdates and passes the response through', async () => {
    const { bot, transformer } = fakeBot();
    const t = newTracker('devz');
    trackPolling(bot, t);
    const res = { ok: true, result: [{ update_id: 1 }] };
    expect(await transformer()(async () => res, 'getUpdates', {})).toBe(res);
    expect(t.lastPollAt).not.toBeNull();
    expect(t.updates).toBe(1);
  });

  it('ignores other methods and failed polls', async () => {
    const { bot, transformer } = fakeBot();
    const t = newTracker('devz');
    trackPolling(bot, t);
    await transformer()(async () => ({ ok: true, result: { message_id: 1 } }), 'sendMessage', {});
    await transformer()(async () => ({ ok: false }), 'getUpdates', {});
    expect(t.lastPollAt).toBeNull();
  });
});

describe('startBeat', () => {
  it('prints one [devz/beat] line per interval', () => {
    vi.useFakeTimers();
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const { bot } = fakeBot(false);
      const stop = startBeat([{ bot, t: newTracker('devz') }]);
      vi.advanceTimersByTime(BEAT_INTERVAL_MS * 2);
      stop();
      vi.advanceTimersByTime(BEAT_INTERVAL_MS);
      expect(log).toHaveBeenCalledTimes(2);
      expect(log.mock.calls[0][0]).toMatch(/^\[devz\/beat\] devz=down /);
    } finally {
      log.mockRestore();
      vi.useRealTimers();
    }
  });
});
