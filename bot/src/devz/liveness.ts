/**
 * liveness.ts - make the devz process able to say whether it is polling.
 *
 * Measured 2026-10-17: zao-devz-stack.service read "active (running)" for 38
 * days while `journalctl --user -u zao-devz-stack` printed "-- No entries --"
 * for the whole 7-day retention window. The process logs only at boot and on
 * error, and both cowork heartbeats sent a constant 'up', so neither surface
 * could tell a polling bot from a wedged one (state-claims.md: a process needs
 * a heartbeat before its silence means anything).
 *
 * This records the last SUCCESSFUL getUpdates per bot (an API transformer, so
 * it measures Telegram answering, not a timer firing) and prints one beat line
 * per interval:
 *   journalctl --user -u zao-devz-stack | grep '\[devz/beat\]'
 */
import type { Bot, Context } from 'grammy';
import type { BotHealthStatus } from '../lib/cowork';

/** A long poll returns at least every ~30s; two missed polls is stale. */
export const POLL_STALE_MS = 120_000;
/** Beat cadence: 96 lines a day, enough to date the last poll to the quarter hour. */
export const BEAT_INTERVAL_MS = 15 * 60_000;

export interface PollTracker {
  name: string;
  lastPollAt: number | null;
  lastUpdateAt: number | null;
  updates: number;
}

export function newTracker(name: string): PollTracker {
  return { name, lastPollAt: null, lastUpdateAt: null, updates: 0 };
}

/** Record one getUpdates result. Only an ok response counts as a poll. */
export function recordPoll(t: PollTracker, ok: boolean, updateCount: number, now: number): void {
  if (!ok) return;
  t.lastPollAt = now;
  if (updateCount > 0) {
    t.updates += updateCount;
    t.lastUpdateAt = now;
  }
}

/** down = polling loop stopped; degraded = loop running but no answered poll recently. */
export function pollStatus(t: PollTracker, running: boolean, now: number): BotHealthStatus {
  if (!running) return 'down';
  if (t.lastPollAt === null || now - t.lastPollAt > POLL_STALE_MS) return 'degraded';
  return 'up';
}

const iso = (ms: number | null): string => (ms === null ? 'never' : new Date(ms).toISOString());

export function beatLine(trackers: Array<{ t: PollTracker; running: boolean }>, now: number): string {
  const parts = trackers.map(
    ({ t, running }) =>
      `${t.name}=${pollStatus(t, running, now)} last_poll=${iso(t.lastPollAt)} last_update=${iso(t.lastUpdateAt)} updates=${t.updates}`,
  );
  return `[devz/beat] ${parts.join(' | ')}`;
}

/** Wire a tracker into a bot's API calls. Call before bot.start(). */
export function trackPolling(bot: Bot<Context>, t: PollTracker): void {
  bot.api.config.use(async (prev, method, payload, signal) => {
    const res = await prev(method, payload, signal);
    if (method === 'getUpdates') {
      const count = res.ok && Array.isArray(res.result) ? res.result.length : 0;
      recordPoll(t, res.ok, count, Date.now());
    }
    return res;
  });
}

/** Print a beat line every BEAT_INTERVAL_MS. Never keeps the process alive. */
export function startBeat(bots: Array<{ bot: Bot<Context>; t: PollTracker }>): () => void {
  const tick = (): void => {
    try {
      console.log(beatLine(bots.map(({ bot, t }) => ({ t, running: bot.isRunning() })), Date.now()));
    } catch {
      // Observability must never break the bot it observes.
    }
  };
  const handle = setInterval(tick, BEAT_INTERVAL_MS);
  (handle as { unref?: () => void }).unref?.();
  return () => clearInterval(handle);
}
