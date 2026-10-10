// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const goals = vi.hoisted(() => [] as string[]);
// The worker produces nothing, so each item parks quickly with no spend; the
// goal it was handed is what these tests read.
vi.mock('../dispatch', () => ({
  dispatchPlan: vi.fn(async (opts: { goal: string }) => {
    goals.push(opts.goal);
  }),
}));
vi.mock('../receipts', () => ({ emitReceipt: vi.fn(async () => undefined) }));
vi.mock('../../hermes/claude-cli', () => ({ callClaudeCli: vi.fn(async () => ({ text: '' })) }));

let tmp: string;
beforeEach(async () => {
  tmp = join(tmpdir(), 'zoe-wl-resource-' + Math.random().toString(36).slice(2));
  await fs.mkdir(tmp, { recursive: true });
  vi.stubEnv('ZOE_HOME', tmp);
  goals.length = 0;
});
afterEach(async () => {
  vi.unstubAllEnvs();
  await fs.rm(tmp, { recursive: true, force: true });
});

const deps = () => ({ sendToZaal: async () => undefined, zaalTgId: 1, repoDir: tmp, currentDate: '2026-10-10' });

describe('work loop with resource items', () => {
  it('a resource item runs with the fit-check brief, not its raw input', async () => {
    const { enqueueWork, runWorkTick } = await import('../work-loop');
    await enqueueWork('https://github.com/obra/superpowers', undefined, 'resource');
    await runWorkTick(deps());
    expect(goals[0]).toContain('SELF-UPGRADE FIT CHECK for https://github.com/obra/superpowers');
  });

  it('red control: a research item runs with its input unchanged', async () => {
    const { enqueueWork, runWorkTick } = await import('../work-loop');
    await enqueueWork('Investigate sound gear in Ellsworth');
    await runWorkTick(deps());
    expect(goals[0]).toBe('Investigate sound gear in Ellsworth');
  });

  it('once the daily resource cap is spent, research behind a resource still runs', async () => {
    vi.stubEnv('ZOE_SELF_UPGRADE_DAILY', '1');
    const { bumpResourcesToday } = await import('../self-upgrade');
    await bumpResourcesToday('2026-10-10');
    const { enqueueWork, runWorkTick, queueDepth } = await import('../work-loop');
    await enqueueWork('https://github.com/obra/superpowers', undefined, 'resource');
    await enqueueWork('Investigate sound gear in Ellsworth');
    await runWorkTick(deps());
    expect(goals).toEqual(['Investigate sound gear in Ellsworth']);
    expect(await queueDepth()).toBe(1); // the resource waits for tomorrow
    await runWorkTick(deps());
    expect(goals).toHaveLength(1); // nothing runnable today: no spend
  });
});
