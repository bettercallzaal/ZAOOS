/**
 * recall-carry.ts - a Bonfire search that finishes after ZOE has answered is
 * kept for the next message in that chat, instead of thrown away.
 *
 * Measured: the DM turn gave recall 3 s (#3995) and every delve in the VPS
 * journal ran out of that time. On 2026-10-18 16:40:14Z Zaal's test DM ("what
 * is ZABAL Gamez and who is in season 1?") logged "0 hits in 3003ms
 * (timeout)", and one keyed delve on 2026-10-17 took 14.31 s end to end. So
 * the search is slow, not empty, and waiting for it would make every reply
 * about 15 s slower.
 *
 * Zaal's option A (auto-proceeded by the seat 2026-10-18, override anytime):
 * the search starts when the message arrives with a long budget, the reply
 * still waits only the short turn budget, and a result that lands later is
 * carried into the next turn in the same chat, labelled with the question it
 * answered. At most one search runs per chat at a time, and a carried result
 * older than CARRY_TTL_MS is dropped.
 *
 * Everything here is in memory; a restart loses only what was in flight.
 */

/** How long a search may run in the background. ZOE_RECALL_BACKGROUND_MS overrides; clamped to 5-30 s. */
export function backgroundRecallMs(raw: string | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 25_000;
  return Math.min(Math.max(n, 5_000), 30_000);
}

/** A carried result this old is not used: the conversation has moved on. */
export const CARRY_TTL_MS = 30 * 60 * 1000;

export interface CarriedRecall {
  query: string;
  text: string;
  at: number;
}

export interface RecallCarry {
  carried: Map<string, CarriedRecall>;
  inFlight: Set<string>;
}

export function newRecallCarry(): RecallCarry {
  return { carried: new Map(), inFlight: new Set() };
}

/** The search itself: resolves to text, or undefined when there was nothing. Must not throw. */
export type RecallSearch = (query: string, timeoutMs: number) => Promise<string | undefined>;

export interface TurnRecall {
  /** Context for this turn: a carried result from earlier, then this message's own result. */
  context?: string;
  /** What happened, for one log line. */
  outcome: 'now' | 'carried-later' | 'skipped-in-flight' | 'empty';
}

const wait = (ms: number): Promise<undefined> => new Promise((r) => setTimeout(() => r(undefined), ms));

/**
 * Run this turn's recall. Returns within turnMs. If the search is still going,
 * it keeps running up to backgroundMs and its result is stored for the next
 * turn in this chat.
 */
export async function turnRecall(
  carry: RecallCarry,
  chatKey: string,
  query: string,
  search: RecallSearch,
  opts: { turnMs: number; backgroundMs: number; now?: () => number },
): Promise<TurnRecall> {
  const now = opts.now ?? Date.now;
  const earlier = takeCarried(carry, chatKey, now());

  if (carry.inFlight.has(chatKey)) {
    return { context: earlier, outcome: 'skipped-in-flight' };
  }

  carry.inFlight.add(chatKey);
  let settled = false;
  const running = search(query, opts.backgroundMs)
    .catch(() => undefined)
    .then((text) => {
      settled = true;
      carry.inFlight.delete(chatKey);
      return text;
    });

  const fast = await Promise.race([running, wait(opts.turnMs)]);
  if (settled) {
    return { context: joinContext(earlier, fast), outcome: fast ? 'now' : 'empty' };
  }

  // Too slow for this reply: keep it for the next one.
  void running.then((text) => {
    if (text) carry.carried.set(chatKey, { query, text, at: now() });
    console.log(`[zoe/recall] background delve for chat ${chatKey}: ${text ? 'carried to the next turn' : 'nothing'}`);
  });
  return { context: earlier, outcome: 'carried-later' };
}

/** A carried result for this chat, once, if it is fresh. */
export function takeCarried(carry: RecallCarry, chatKey: string, nowMs: number): string | undefined {
  const c = carry.carried.get(chatKey);
  if (!c) return undefined;
  carry.carried.delete(chatKey);
  if (nowMs - c.at > CARRY_TTL_MS) return undefined;
  return `(From a knowledge-graph search on an earlier message: "${c.query.slice(0, 120)}")\n${c.text}`;
}

function joinContext(earlier: string | undefined, current: string | undefined): string | undefined {
  if (earlier && current) return `${earlier}\n\n${current}`;
  return earlier ?? current;
}
