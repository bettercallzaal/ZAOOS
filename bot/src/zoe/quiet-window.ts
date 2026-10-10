/**
 * quiet-window.ts - nothing reaches Zaal at night; it is held and sent in the morning.
 *
 * Zaal, 2026-10-10 (seat grill items 94 and 95): nothing reaches him after
 * 8:30 PM Eastern, lane asks and phone pings alike, from Monday 12 October.
 * Sleep is the week's first priority (item 88) and a phone that buzzes at 11 pm
 * is the cheapest way to lose it.
 *
 * WHAT IT DOES, with ZOE_QUIET=1. Between ZOE_QUIET_FROM (default 20:30) and
 * ZOE_QUIET_UNTIL (default 04:45), America/New_York, a send is HELD: written to
 * ~/.zao/zoe/quiet-queue.jsonl with its chat, text, class and options (buttons
 * and topic included), and not sent. From ZOE_QUIET_UNTIL a scheduler tick sends
 * the held messages one by one, oldest first, as themselves - not as a digest,
 * because a held question has to arrive with its buttons to be answerable.
 *
 * WHAT IS NOT HELD
 *   reply    He wrote to ZOE or tapped a button, and this is the answer. He is
 *            awake and he asked.
 *   morning  The 09:00 UTC brief. It drains its own deferred queue and has its
 *            own re-queue path; holding its output here would send that batch
 *            twice. NOTE: 09:00 UTC is 05:00 Eastern in daylight time, outside
 *            the window, but 04:00 after the clocks change on 1 November, 45
 *            minutes inside it. Moving that cron to Eastern time is its own
 *            change, flagged in the PR, not hidden here.
 *   an outage  One narrow exception: class `alarm` AND the sender set
 *            `zoeOutage: true` on that send. Class alone is not enough - most
 *            alarms ("no auto-fix target", an auth failure in the research
 *            engine) are true and can wait for morning. Nothing sets the flag
 *            today; a sender earns it one at a time, in review.
 *
 * NOT THE DEFERRED QUEUE. send-budget.ts already has one, and it is the wrong
 * shape: it keeps text only (no buttons), trims to the newest 200, and is
 * released as one digest. "Nothing dropped" needs the options kept and no trim.
 *
 * RETRYING SENDERS. A held send resolves like a budget-blocked one, so a sender
 * that retries (the grill offers the same card each tick) would queue a copy
 * per tick. Two guards: an IDENTICAL send (same chat, text, class and options,
 * so the same topic and the same buttons) is queued once, and surfaceGrill does
 * not try at all during the window. Two different messages that happen to
 * share their text - the same line to two topics - are two messages.
 *
 * DELIVERY IS AT-LEAST-ONCE. Each delivered message is struck from the
 * releasing file before the next is sent, so a crash mid-release repeats at
 * most the one message that was in flight. An unreadable line is never thrown
 * away: it is moved to quiet-queue.unreadable.jsonl and logged.
 *
 * KNOWN LIMITS, stated not hidden. The lock is in-process, which is enough
 * only because one ZOE process runs at a time (one instance per bot token);
 * two processes releasing at once would each send the batch. And a writer in
 * another process that holds the queue file open across the exact moment the
 * window ends could append after the last read; the zao-ask script opens,
 * writes and closes in one step, and only writes while the window is on.
 *
 * Fails OPEN: if the queue cannot be written the message is sent. A night ping
 * is a smaller harm than a lost alarm.
 */
import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { SendClass } from './send-budget';

export function quietEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.ZOE_QUIET === '1';
}

export const DEFAULT_QUIET_FROM = 20 * 60 + 30;
export const DEFAULT_QUIET_UNTIL = 4 * 60 + 45;

/** "20:30" -> 1230. Anything else -> the fallback: a typo must not open the night. */
export function parseClock(raw: string | undefined, fallback: number): number {
  const m = /^\s*(\d{1,2}):(\d{2})\s*$/.exec(raw ?? '');
  if (!m) return fallback;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h > 23 || min > 59 ? fallback : h * 60 + min;
}

export function quietBounds(env: NodeJS.ProcessEnv = process.env): { from: number; until: number } {
  return {
    from: parseClock(env.ZOE_QUIET_FROM, DEFAULT_QUIET_FROM),
    until: parseClock(env.ZOE_QUIET_UNTIL, DEFAULT_QUIET_UNTIL),
  };
}

/** Minutes after midnight in America/New_York. Reads the wall clock, so it is
 *  right on both sides of a daylight-time change without a table. */
export function easternMinute(now: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return get('hour') * 60 + get('minute');
}

/** Pure. `from` is inside the window, `until` is the first minute outside it. */
export function inQuietWindow(now: Date, bounds: { from: number; until: number } = quietBounds()): boolean {
  const m = easternMinute(now);
  const { from, until } = bounds;
  if (from === until) return false;
  return from < until ? m >= from && m < until : m >= from || m < until;
}

/** Pure. Should this send be held right now? */
export function shouldHold(cls: SendClass, opts: Record<string, unknown> | undefined, now: Date): boolean {
  if (!quietEnabled() || !inQuietWindow(now)) return false;
  if (cls === 'reply' || cls === 'morning') return false;
  if (cls === 'alarm' && opts?.zoeOutage === true) return false;
  return true;
}

/** Options minus the outage hint, so Telegram never sees it. */
export function stripOutageHint(opts?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!opts || !('zoeOutage' in opts)) return opts;
  const { zoeOutage: _drop, ...rest } = opts;
  return rest;
}

export interface QuietEntry {
  at: string;
  cls: SendClass;
  chatId: number | string;
  text: string;
  /** Telegram options as sent: reply_markup, message_thread_id, parse_mode. */
  opts?: Record<string, unknown>;
}

const zoeHome = (): string => process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe');
export const quietQueuePath = (): string => join(zoeHome(), 'quiet-queue.jsonl');
const releasingPath = (): string => join(zoeHome(), 'quiet-queue.releasing.jsonl');
export const unreadablePath = (): string => join(zoeHome(), 'quiet-queue.unreadable.jsonl');

/** One writer at a time in this process (same shape as send-budget's deferred lock). */
let chain: Promise<unknown> = Promise.resolve();
function locked<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.catch(() => undefined);
  return run;
}

async function readFileLines(path: string): Promise<{ entries: QuietEntry[]; bad: string[] }> {
  let raw: string;
  try {
    raw = await fs.readFile(path, 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException)?.code === 'ENOENT') return { entries: [], bad: [] };
    throw e;
  }
  const entries: QuietEntry[] = [];
  const bad: string[] = [];
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    try {
      const e = JSON.parse(line) as QuietEntry;
      if (typeof e?.text !== 'string' || e.chatId === undefined) throw new Error('not a held send');
      entries.push(e);
    } catch {
      bad.push(line);
    }
  }
  return { entries, bad };
}

async function readLines(path: string): Promise<QuietEntry[]> {
  return (await readFileLines(path)).entries;
}

export function readQuietQueue(): Promise<QuietEntry[]> {
  return readLines(quietQueuePath());
}

const toBody = (entries: QuietEntry[]): string => (entries.length ? `${entries.map((e) => JSON.stringify(e)).join('\n')}\n` : '');
/** Two sends are the same send only when everything about them matches. */
const sameSend = (a: QuietEntry, b: QuietEntry): boolean =>
  String(a.chatId) === String(b.chatId) &&
  a.text === b.text &&
  a.cls === b.cls &&
  JSON.stringify(a.opts ?? {}) === JSON.stringify(b.opts ?? {});

/**
 * Hold one send. Resolves true when it is in the queue (or already was), false
 * when it could not be written - the caller then sends it instead.
 */
export function holdSend(entry: QuietEntry): Promise<boolean> {
  return locked(async () => {
    try {
      const line = JSON.stringify(entry); // throws on a cyclic option: then it is sent
      const existing = await readQuietQueue();
      if (existing.some((e) => sameSend(e, entry))) return true;
      await fs.mkdir(zoeHome(), { recursive: true });
      // APPEND, never rewrite: the VPS zao-ask script appends to this same file.
      await fs.appendFile(quietQueuePath(), `${line}\n`, { mode: 0o600 });
      return true;
    } catch (e) {
      console.warn('[zoe/quiet] could not hold a send, sending it instead:', (e as Error)?.message);
      return false;
    }
  });
}

export interface ReleaseResult {
  sent: number;
  kept: number;
}

/**
 * Send the held messages, oldest first. No-op inside the window. Stops at the
 * first one that does not go (blocked by the budget, or Telegram threw) and
 * puts it and everything after it back, in order, for the next tick.
 *
 * The queue file is renamed aside before it is read, so an append that lands
 * during the release goes to a fresh file and is not overwritten.
 */
export function releaseQuietQueue(deps: {
  send: (chatId: number | string, text: string, opts: Record<string, unknown>) => Promise<unknown>;
  now?: Date;
  isBlocked: (result: unknown) => boolean;
}): Promise<ReleaseResult> {
  return locked(async () => {
    if (!quietEnabled() || inQuietWindow(deps.now ?? new Date())) return { sent: 0, kept: 0 };
    // A release that died half way left its file behind: finish that one first.
    let read = await readFileLines(releasingPath());
    if (!read.entries.length && !read.bad.length) {
      try {
        await fs.rename(quietQueuePath(), releasingPath());
      } catch (e) {
        if ((e as NodeJS.ErrnoException)?.code === 'ENOENT') return { sent: 0, kept: 0 };
        throw e;
      }
      read = await readFileLines(releasingPath());
    }
    if (read.bad.length) {
      // Never thrown away. Whatever it was, a person can still read it there.
      await fs.appendFile(unreadablePath(), `${read.bad.join('\n')}\n`, { mode: 0o600 });
      console.error(`[zoe/quiet] ${read.bad.length} unreadable line(s) in the quiet queue, kept in ${unreadablePath()}`);
    }
    const batch = read.entries;
    // From here the releasing file holds exactly the messages still to send,
    // rewritten after each delivery: the durable record of what has gone.
    await fs.writeFile(releasingPath(), toBody(batch), { mode: 0o600 });
    let sent = 0;
    for (const entry of batch) {
      let ok = false;
      try {
        const r = await deps.send(entry.chatId, entry.text, { ...(entry.opts ?? {}), zoeSendClass: entry.cls });
        ok = !deps.isBlocked(r);
      } catch (e) {
        console.error('[zoe/quiet] a held message failed to send, kept for the next tick:', (e as Error)?.message);
      }
      if (!ok) break;
      sent++;
      await fs.writeFile(releasingPath(), toBody(batch.slice(sent)), { mode: 0o600 });
    }
    const rest = batch.slice(sent);
    // Anything appended to the releasing file since (a writer in another
    // process that had it open across the rename) is picked up here.
    const late = (await readLines(releasingPath())).slice(rest.length);
    const back = [...rest, ...late];
    if (back.length) {
      // Unsent messages go back to the FRONT of the queue, ahead of anything
      // held since, so the order he sees is the order they were raised.
      const newer = await readQuietQueue();
      await fs.writeFile(quietQueuePath(), toBody([...back, ...newer]), { mode: 0o600 });
    }
    await fs.rm(releasingPath(), { force: true });
    return { sent, kept: back.length };
  });
}
