/**
 * tick-lock.ts - an ATOMIC single-instance lock for the autonomous loops.
 *
 * THE BUG THIS REPLACES. work-loop.ts and orchestrator-tick.ts each carried their
 * own copy of:
 *
 *     const st = await fs.stat(LOCK).catch(() => null);
 *     if (st && Date.now() - st.mtimeMs < LOCK_STALE_MS) return false;
 *     await fs.writeFile(LOCK, String(Date.now()));
 *     return true;
 *
 * That is check-then-act. Two ticks that overlap both stat (each sees no lock, or
 * the same stale one), both fall through, both write, and BOTH RETURN TRUE. The
 * window is small but it is exactly the window that matters, because ticks are
 * started by a cron and by a manual kick that can land on top of each other -
 * which is how ZOE gets two runs doing the same work, spending twice, and
 * `agent-loops.md` rule 9 (one instance per resource) is violated by the very
 * code written to enforce it.
 *
 * A guard that looks like a guard but is not one is the worst kind: it stops
 * anyone from looking again.
 *
 * THE FIX. `fs.open(path, 'wx')` is atomic - the kernel either creates the file
 * or fails with EEXIST, with no window between the two. One winner, always.
 * Staleness is then handled explicitly and separately, which is also the only
 * safe way to do it.
 *
 * AND THE PLACE THAT WAS NOT ENOUGH. Making the create atomic is necessary, not
 * sufficient. The STALE BREAK was left as a bare `fs.unlink` followed by that
 * atomic create - and while each call is atomic, the pair is not, so the break
 * reintroduced check-then-act one line further down and two contenders could
 * again both come away holding the lock. `breakStaleLock` below closes it. The
 * lesson this header already states turned out to apply to its own fix: a guard
 * that looks like a guard is the worst kind, because it stops anyone looking
 * again - including at the guard.
 *
 * WHAT THIS STILL DOES NOT DO. A filesystem lock is per-machine. It cannot stop
 * the Mac and the VPS from both running a tick, because they do not share a
 * filesystem - and Zaal runs loops on a Mac, a VPS, a Pi and a Windows desktop.
 * The durable answer is the lease layer in packages/heart-fleet, which fences on
 * a shared Supabase row and is already built, tested, and gated OFF behind
 * ZOE_HEART_FLEET_CANARY. This module makes the single-machine case correct;
 * the Heart makes the multi-machine case correct. Both are needed, and this one
 * needs no migration to land.
 */
import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';

/** How long before a held lock is assumed to belong to a dead process. */
export const DEFAULT_STALE_MS = 30 * 60 * 1000;

/**
 * How long the break lock (below) may be held before it is itself assumed
 * abandoned. The critical section it guards is two filesystem calls, so a minute
 * is already several orders of magnitude of headroom - it exists only so a
 * process killed mid-break cannot wedge every future stale break forever.
 */
const BREAK_STALE_MS = 60 * 1000;

export interface TickLockOptions {
  staleMs?: number;
  /** Injected for tests; defaults to Date.now. */
  now?: () => number;
}

export interface AcquireResult {
  acquired: boolean;
  /** Why it was refused, for an honest log line rather than a silent skip. */
  reason?: 'held' | 'error';
  /** Age of the existing lock, when one blocked us. */
  heldForMs?: number;
}


/**
 * How long the existing lock has been held, or null if it is gone.
 *
 * Prefers the timestamp written into the file so the caller's clock is used on
 * both sides; falls back to the filesystem mtime when the contents cannot be
 * read or parsed.
 */
async function lockAgeMs(path: string, now: () => number): Promise<number | null> {
  const raw = await fs.readFile(path, 'utf8').catch(() => null);
  if (raw !== null) {
    const written = Number(raw.trim());
    if (Number.isFinite(written) && written > 0) return now() - written;
  }
  const st = await fs.stat(path).catch(() => null);
  if (!st) return null;
  return now() - st.mtimeMs;
}

/**
 * Remove a stale lock, but only ever the stale one - under a second lock so that
 * exactly one contender is deciding at a time.
 *
 * WHY THIS IS NOT JUST `unlink`. The break used to be an unconditional
 * `fs.unlink(path)` followed by an atomic create. The create is atomic; the
 * *pair* is not. Two contenders that both read the same stale age interleave as:
 *
 *     A unlink -> A create (WINS) -> B unlink (deletes A's FRESH lock) -> B create (WINS)
 *
 * and both return `acquired: true`. That is the identical check-then-act shape
 * this module was written to delete, just moved one call further down, and it is
 * strictly worse than the bug it replaced because the loser also destroys the
 * winner's lock on its way through.
 *
 * THE FIX HAS TWO HALVES, and it needs both:
 *  1. Re-read the age and unlink ONLY while it is still stale, so a lock a winner
 *     has already refreshed is never deleted.
 *  2. Do that re-read and unlink inside `path.break`, itself taken with the same
 *     atomic 'wx' create, so step 1 cannot be raced by a second contender.
 *
 * The final create deliberately stays OUTSIDE this section: it is already atomic,
 * so whichever contenders reach it, exactly one wins. All this has to guarantee
 * is that nobody deletes a lock somebody else is holding.
 */
async function breakStaleLock(path: string, staleMs: number, now: () => number): Promise<void> {
  const breakPath = `${path}.break`;

  type BreakHandle = { writeFile(data: string): Promise<void>; close(): Promise<void> };
  const openBreak = async (): Promise<BreakHandle | null> => {
    try {
      return await fs.open(breakPath, 'wx');
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'EEXIST') return null;
      // Either another contender is mid-break - in which case backing off is the
      // correct outcome, it will have broken the lock by the next tick - or a
      // process died holding it. Only the second case may be cleared.
      const breakAge = await lockAgeMs(breakPath, now);
      if (breakAge === null || breakAge < BREAK_STALE_MS) return null;
      await fs.unlink(breakPath).catch(() => {});
      return await fs.open(breakPath, 'wx').catch(() => null);
    }
  };

  const fh = await openBreak();
  if (!fh) return;
  try {
    // Stamp it with OUR clock, for the same reason the main lock carries one:
    // reading age from the filesystem mtime instead would compare an injectable
    // now() against real wall-clock and yield a meaningless number.
    await fh.writeFile(String(now()));

    // Re-read UNDER the break lock. `null` means someone already broke it and has
    // not created theirs yet; anything fresher than staleMs means someone broke it
    // and won. Neither is ours to delete.
    const age = await lockAgeMs(path, now);
    if (age !== null && age >= staleMs) await fs.unlink(path).catch(() => {});
  } finally {
    await fh.close().catch(() => {});
    await fs.unlink(breakPath).catch(() => {});
  }
}

/**
 * Try to take the lock. Atomic: exactly one caller can win, even if several race.
 *
 * A stale lock is broken and retried ONCE. The retry is deliberately not a loop -
 * if two processes both decide a lock is stale, the atomic create still lets only
 * one of them win, and the loser should back off rather than spin.
 */
export async function acquireTickLock(
  path: string,
  opts: TickLockOptions = {},
): Promise<AcquireResult> {
  const staleMs = opts.staleMs ?? DEFAULT_STALE_MS;
  const now = opts.now ?? (() => Date.now());

  const attempt = async (): Promise<AcquireResult | null> => {
    try {
      await fs.mkdir(dirname(path), { recursive: true });
      // 'wx' = create exclusively. EEXIST if it is already there. This is the
      // whole fix: the check and the create are one kernel operation.
      const fh = await fs.open(path, 'wx');
      try {
        await fh.writeFile(String(now()));
      } finally {
        await fh.close();
      }
      return { acquired: true };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'EEXIST') return null; // someone holds it
      return { acquired: false, reason: 'error' };
    }
  };

  const first = await attempt();
  if (first) return first;

  // Held. Is it stale?
  //
  // Age comes from the timestamp written INSIDE the lock, not from the file's
  // mtime. The two are not interchangeable: mtime is always real wall-clock,
  // while now() is injectable, so comparing them mixes clocks and yields a
  // meaningless age - a test caught this by getting -1786146576072ms, and the
  // same corruption would hit any caller that passed a custom clock. Reading our
  // own written value keeps one clock on both sides.
  //
  // mtime remains the fallback for a lock whose contents are missing or
  // unparseable, which also covers locks written by the previous implementation
  // (it wrote String(Date.now()), the same format).
  const age = await lockAgeMs(path, now);
  if (age === null) {
    // Released between our create and our read - race again, once.
    return (await attempt()) ?? { acquired: false, reason: 'held' };
  }
  if (age < staleMs) return { acquired: false, reason: 'held', heldForMs: age };

  // Stale: the holder is presumed dead. Break it - guarded, so a lock somebody
  // else has already taken is never deleted - then retry exactly once. If several
  // processes break at the same moment, the atomic create still picks one winner;
  // the losers simply skip this tick, which is the correct outcome.
  await breakStaleLock(path, staleMs, now);
  return (await attempt()) ?? { acquired: false, reason: 'held', heldForMs: age };
}

/** Release the lock. Best-effort: a failure here must never break a finished tick. */
export async function releaseTickLock(path: string): Promise<void> {
  await fs.unlink(path).catch(() => {});
}

/**
 * Run `fn` holding the lock, releasing it even if `fn` throws.
 *
 * Returns `{ ran: false }` when the lock was not available - a skipped tick is a
 * normal, expected outcome, not an error, so it is reported rather than thrown.
 */
export async function withTickLock<T>(
  path: string,
  fn: () => Promise<T>,
  opts: TickLockOptions = {},
): Promise<{ ran: true; value: T } | { ran: false; reason: string }> {
  const got = await acquireTickLock(path, opts);
  if (!got.acquired) {
    const held = got.heldForMs !== undefined ? ` (held ${Math.round(got.heldForMs / 1000)}s)` : '';
    return { ran: false, reason: `${got.reason ?? 'held'}${held}` };
  }
  try {
    return { ran: true, value: await fn() };
  } finally {
    // finally, not after: a throwing tick that keeps the lock would block every
    // future tick until the staleness timeout - a 30-minute outage from one bug.
    await releaseTickLock(path);
  }
}
