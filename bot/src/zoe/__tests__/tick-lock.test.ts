import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  acquireTickLock,
  DEFAULT_STALE_MS,
  releaseTickLock,
  withTickLock,
} from '../tick-lock';

let dir: string;
let lock: string;

beforeEach(async () => {
  dir = await fs.mkdtemp(join(tmpdir(), 'ticklock-'));
  lock = join(dir, 'nested', 'tick.lock');
});
afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
});

describe('acquireTickLock', () => {
  it('acquires when free, and creates the directory', async () => {
    expect((await acquireTickLock(lock)).acquired).toBe(true);
    await expect(fs.stat(lock)).resolves.toBeTruthy();
  });

  it('refuses a second acquire while held', async () => {
    await acquireTickLock(lock);
    const second = await acquireTickLock(lock);
    expect(second.acquired).toBe(false);
    expect(second.reason).toBe('held');
  });

  // THE BUG THIS MODULE EXISTS FOR. The old stat-then-write let two concurrent
  // callers both observe a free lock and both proceed. Exactly one may win.
  it('gives exactly ONE winner when many callers race', async () => {
    const results = await Promise.all(
      Array.from({ length: 25 }, () => acquireTickLock(lock)),
    );
    expect(results.filter((r) => r.acquired)).toHaveLength(1);
  });

  it('gives exactly one winner on a repeated race', async () => {
    for (let round = 0; round < 5; round++) {
      const results = await Promise.all(
        Array.from({ length: 10 }, () => acquireTickLock(lock)),
      );
      expect(results.filter((r) => r.acquired)).toHaveLength(1);
      await releaseTickLock(lock);
    }
  });

  it('reacquires after release', async () => {
    await acquireTickLock(lock);
    await releaseTickLock(lock);
    expect((await acquireTickLock(lock)).acquired).toBe(true);
  });

  it('reports how long a blocking lock has been held', async () => {
    let t = 1_000_000;
    await acquireTickLock(lock, { now: () => t });
    t += 5000;
    const blocked = await acquireTickLock(lock, { now: () => t });
    expect(blocked.acquired).toBe(false);
    expect(blocked.heldForMs).toBeGreaterThanOrEqual(0);
  });

  it('breaks a stale lock so a dead process cannot wedge the loop forever', async () => {
    await acquireTickLock(lock);
    // Age the lock past the threshold the way a crashed holder would. The module
    // reads the timestamp it wrote, so age the CONTENT.
    await fs.writeFile(lock, String(Date.now() - (DEFAULT_STALE_MS + 60_000)));
    expect((await acquireTickLock(lock)).acquired).toBe(true);
  });

  it('still yields ONE winner when several callers break a stale lock at once', async () => {
    await acquireTickLock(lock);
    await fs.writeFile(lock, String(Date.now() - (DEFAULT_STALE_MS + 60_000)));
    const results = await Promise.all(
      Array.from({ length: 12 }, () => acquireTickLock(lock)),
    );
    expect(results.filter((r) => r.acquired)).toHaveLength(1);
  });

  // The break is guarded by `<lock>.break` so only one contender at a time may
  // decide a lock is dead. While another contender holds that, the correct answer
  // is to skip this tick - not to break a lock somebody else may be about to win.
  it('does not break a stale lock while another contender is mid-break', async () => {
    await acquireTickLock(lock);
    await fs.writeFile(lock, String(Date.now() - (DEFAULT_STALE_MS + 60_000)));
    await fs.writeFile(`${lock}.break`, String(Date.now()));

    const blocked = await acquireTickLock(lock);
    expect(blocked.acquired).toBe(false);
    // The stale lock is still there: nobody deleted it behind the break lock.
    await expect(fs.stat(lock)).resolves.toBeTruthy();
  });

  // ...but a process killed mid-break must not wedge every future break forever.
  it('clears an abandoned break lock so a crash cannot wedge the break', async () => {
    await acquireTickLock(lock);
    await fs.writeFile(lock, String(Date.now() - (DEFAULT_STALE_MS + 60_000)));
    await fs.writeFile(`${lock}.break`, String(Date.now() - 10 * 60_000));

    expect((await acquireTickLock(lock)).acquired).toBe(true);
    // The break lock is released again, not left behind for the next tick.
    await expect(fs.stat(`${lock}.break`)).rejects.toThrow();
  });

  it('honours a custom staleness threshold', async () => {
    await acquireTickLock(lock);
    await fs.writeFile(lock, String(Date.now() - 5000));
    expect((await acquireTickLock(lock, { staleMs: 1000 })).acquired).toBe(true);
  });
});

describe('withTickLock', () => {
  it('runs the body and returns its value', async () => {
    const r = await withTickLock(lock, async () => 42);
    expect(r).toEqual({ ran: true, value: 42 });
  });

  it('releases afterwards so the next tick can run', async () => {
    await withTickLock(lock, async () => 1);
    expect((await acquireTickLock(lock)).acquired).toBe(true);
  });

  // A throwing tick that kept the lock would block every future tick until the
  // staleness timeout - a 30-minute outage caused by one bug.
  it('releases even when the body throws, and propagates the error', async () => {
    await expect(
      withTickLock(lock, async () => {
        throw new Error('tick blew up');
      }),
    ).rejects.toThrow('tick blew up');
    expect((await acquireTickLock(lock)).acquired).toBe(true);
  });

  it('reports a skip rather than throwing when the lock is held', async () => {
    await acquireTickLock(lock);
    const r = await withTickLock(lock, async () => 'should not run');
    expect(r.ran).toBe(false);
    if (!r.ran) expect(r.reason).toContain('held');
  });

  it('never runs the body twice under concurrency', async () => {
    let runs = 0;
    await Promise.all(
      Array.from({ length: 15 }, () =>
        withTickLock(lock, async () => {
          runs++;
          await new Promise((r) => setTimeout(r, 5));
        }),
      ),
    );
    expect(runs).toBe(1);
  });
});

// Regression: staleness once compared an injected now() against the filesystem
// mtime, producing ages like -1786146576072ms. Any caller passing a clock got
// nonsense. Age must come from the timestamp the lock itself carries.
describe('clock consistency', () => {
  it('computes age from its own written timestamp, not the filesystem mtime', async () => {
    let t = 1_000_000;
    const clock = () => t;
    await acquireTickLock(lock, { now: clock });
    t += 5000;
    const blocked = await acquireTickLock(lock, { now: clock });
    expect(blocked.acquired).toBe(false);
    expect(blocked.heldForMs).toBe(5000);
  });

  it('breaks a stale lock using the injected clock alone', async () => {
    let t = 1_000_000;
    const clock = () => t;
    await acquireTickLock(lock, { now: clock, staleMs: 10_000 });
    t += 20_000;
    expect((await acquireTickLock(lock, { now: clock, staleMs: 10_000 })).acquired).toBe(true);
  });
});
