/**
 * The queue depth the pinned brief reports must be the SAME number the grill
 * gates on. The brief's own threshold text says "stuck at 20", so a depth
 * computed differently from `outstandingCount` turns the brief into a permanent
 * false alarm - the exact failure the grill's docstring warns about.
 */
import { promises as fs } from 'node:fs';
import { dirname, join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const FAKE_HOME = vi.hoisted(() => {
  const base = (process.env.TMPDIR || process.env.TEMP || '/tmp').replace(/[\\/]+$/, '');
  return `${base}/zoe-pinned-brief-runner-home`;
});

vi.mock('node:os', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:os')>();
  return { ...actual, default: { ...actual, homedir: () => FAKE_HOME }, homedir: () => FAKE_HOME };
});

// gatherBrief shells out to `gh` twice. Failing them fast keeps this offline and
// exercises the documented omit-rather-than-guess path.
vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  return {
    ...actual,
    exec: (_cmd: string, _opts: unknown, cb?: (e: Error | null, o: string, e2: string) => void) => {
      const done = typeof _opts === 'function' ? (_opts as typeof cb) : cb;
      done?.(new Error('offline in tests'), '', '');
      return undefined as never;
    },
  };
});

import { DRIP_DEFAULT } from '../backlog-grill';
import { outstandingCount } from '../backlog-grill-runner';
import { gatherBrief, grillDepth } from '../pinned-brief-runner';
import { CLAUDE_HEALTH_PATH } from '../../hermes/claude-health';

const STATE_PATH = join(FAKE_HOME, '.zao/zoe/backlog-grill-state.json');

async function writeState(state: unknown): Promise<void> {
  await fs.mkdir(dirname(STATE_PATH), { recursive: true });
  await fs.writeFile(STATE_PATH, JSON.stringify(state), 'utf8');
}

// An hour ago, not a fixed calendar date. The depth is time-relative now - a
// card stops holding a cap slot once it is older than DRIP_DEFAULT.capWindowMs -
// so a hardcoded timestamp would quietly age past the window and leave every
// assertion below passing or failing for the wrong reason.
const ts = new Date(Date.now() - 3_600_000).toISOString();
/** Older than the cap window: sent, never answered, long since scrolled past. */
const stale = new Date(Date.now() - 5 * 86_400_000).toISOString();

describe('grillDepth', () => {
  beforeEach(async () => {
    await fs.rm(STATE_PATH, { force: true });
  });

  it('does not count a requeued card - it is parked, not waiting on him', async () => {
    await writeState({
      asked: {
        open: { at: ts, title: 'still on his phone' },
        requeued: { at: ts, title: 'answered work, comes back later', requeuedAt: ts },
      },
      // A requeue deletes its `answered` mark, so asked-minus-answered would be 2.
      answered: {},
      activeTaskId: null,
      lastSentMs: null,
    });
    expect(await grillDepth()).toBe(1);
  });

  it('agrees with the grill own outstandingCount', async () => {
    const state = {
      asked: {
        a: { at: ts, title: 'a' },
        b: { at: ts, title: 'b', requeuedAt: ts },
        c: { at: ts, title: 'c' },
      },
      answered: { c: { at: ts, verdict: 'done' } },
      activeTaskId: null,
      lastSentMs: null,
    };
    await writeState(state);
    expect(await grillDepth()).toBe(outstandingCount(state));
  });

  /**
   * The phone-side twin of the 2026-08-09 jam. Twenty cards sent days ago and
   * never answered pinned the terminal's "grill JAMMED 20/20" AND this brief's
   * "stuck at 20" for five days. The brief promises to be the one correct
   * surface, so it has to release them too.
   */
  it('does not count cards that aged out of the cap window', async () => {
    const asked: Record<string, { at: string; title: string }> = {};
    for (let i = 0; i < DRIP_DEFAULT.maxOutstanding; i++) {
      asked[`t${i}`] = { at: stale, title: `t${i}` };
    }
    await writeState({ asked, answered: {}, activeTaskId: null, lastSentMs: null });
    expect(await grillDepth()).toBe(0);
  });

  it('twenty requeues do not fake the cap', async () => {
    const asked: Record<string, { at: string; title: string; requeuedAt?: string }> = {};
    for (let i = 0; i < DRIP_DEFAULT.maxOutstanding; i++) {
      asked[`t${i}`] = { at: ts, title: `t${i}`, requeuedAt: ts };
    }
    await writeState({ asked, answered: {}, activeTaskId: null, lastSentMs: null });
    const depth = await grillDepth();
    expect(depth).toBe(0);
    expect(depth).toBeLessThan(DRIP_DEFAULT.maxOutstanding);
  });

  it('returns null when the state cannot be read, so the line is omitted', async () => {
    expect(await grillDepth()).toBeNull();
  });
});


/**
 * The regression for 2026-08-08: ZOE's OAuth token was revoked, every Claude call
 * 401'd for four days, and the brief said nothing because it had no Claude line at
 * all. These assert the line exists, that it alerts on a real observed failure,
 * and - just as importantly - that it does not invent health when nothing is known.
 */
describe('gatherBrief surfaces Claude reachability', () => {
  async function writeHealth(h: unknown): Promise<void> {
    await fs.mkdir(dirname(CLAUDE_HEALTH_PATH), { recursive: true });
    await fs.writeFile(CLAUDE_HEALTH_PATH, JSON.stringify(h), 'utf8');
  }

  beforeEach(async () => {
    await fs.rm(CLAUDE_HEALTH_PATH, { force: true });
  });

  it('puts an auth failure in needs-you', async () => {
    const now = new Date('2026-08-12T12:00:00.000Z');
    await writeHealth({
      lastOkMs: now.getTime() - 6 * 86400_000,
      lastFailMs: now.getTime() - 4 * 86400_000,
      lastFailKind: 'auth',
      lastFailHint: 'run /login',
    });
    const brief = await gatherBrief(now);
    expect(brief.needsYou.some((l) => l.includes('cannot reach Claude'))).toBe(true);
    expect(brief.running).toContainEqual(['claude', 'auth failed']);
  });

  it('reports "not checked" rather than ok when nothing has been observed', async () => {
    const brief = await gatherBrief(new Date('2026-08-12T12:00:00.000Z'));
    expect(brief.running).toContainEqual(['claude', 'not checked']);
    expect(brief.needsYou.some((l) => l.includes('Claude'))).toBe(false);
  });

  it('says ok, and raises nothing, after a recent success', async () => {
    const now = new Date('2026-08-12T12:00:00.000Z');
    await writeHealth({ lastOkMs: now.getTime() - 60_000, lastFailMs: null, lastFailKind: null, lastFailHint: null });
    const brief = await gatherBrief(now);
    expect(brief.running).toContainEqual(['claude', 'ok']);
    expect(brief.needsYou.some((l) => l.includes('Claude'))).toBe(false);
  });
});
