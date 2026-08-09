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

import { DRIP_DEFAULT } from '../backlog-grill';
import { outstandingCount } from '../backlog-grill-runner';
import { grillDepth } from '../pinned-brief-runner';

const STATE_PATH = join(FAKE_HOME, '.zao/zoe/backlog-grill-state.json');

async function writeState(state: unknown): Promise<void> {
  await fs.mkdir(dirname(STATE_PATH), { recursive: true });
  await fs.writeFile(STATE_PATH, JSON.stringify(state), 'utf8');
}

const ts = '2026-08-09T12:00:00.000Z';

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
