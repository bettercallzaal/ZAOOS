import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { checkFleetLiveness, healFleet } from '../fleet-health';

let tmp: string;
beforeEach(async () => {
  tmp = join(tmpdir(), 'zoe-fleet-test-' + Math.random().toString(36).slice(2));
  await fs.mkdir(tmp, { recursive: true });
  vi.stubEnv('ZOE_HOME', tmp);
});
afterEach(async () => {
  vi.unstubAllEnvs();
  await fs.rm(tmp, { recursive: true, force: true });
});

describe('checkFleetLiveness', () => {
  it('no alerts when all active', async () => {
    expect(await checkFleetLiveness(['a', 'b'], async () => true)).toEqual([]);
  });
  it('alerts the down units', async () => {
    const a = await checkFleetLiveness(['a', 'b'], async (u) => u === 'a');
    expect(a[0].message).toContain('b');
  });
  it('throwing checker counts as down', async () => {
    const a = await checkFleetLiveness(['x'], async () => {
      throw new Error('boom');
    });
    expect(a).toHaveLength(1);
  });
});

describe('healFleet', () => {
  it('does nothing when all active', async () => {
    const restart = vi.fn();
    const a = await healFleet({ date: '2026-06-30', units: ['a'], isActive: async () => true, restart });
    expect(a).toEqual([]);
    expect(restart).not.toHaveBeenCalled();
  });

  it('restarts a down unit and reports healed when it comes back', async () => {
    let up = false;
    const restart = vi.fn(async () => {
      up = true;
    });
    const a = await healFleet({
      date: '2026-06-30',
      units: ['worker'],
      isActive: async () => up,
      restart,
    });
    expect(restart).toHaveBeenCalledOnce();
    expect(a[0].code).toBe('unit-healed');
  });

  it('reports down when restart fails to revive', async () => {
    const a = await healFleet({
      date: '2026-06-30',
      units: ['worker'],
      isActive: async () => false,
      restart: async () => {},
    });
    expect(a[0].code).toBe('unit-down');
    expect(a[0].message).toContain('did not bring it up');
  });

  it('never restarts zoe-bot (core unit)', async () => {
    const restart = vi.fn();
    const a = await healFleet({ date: '2026-06-30', units: ['zoe-bot'], isActive: async () => false, restart });
    expect(restart).not.toHaveBeenCalled();
    expect(a[0].message).toContain('not auto-restarted');
  });

  it('stops restarting after the daily cap (crash-loop guard)', async () => {
    const restart = vi.fn(async () => {});
    const run = () =>
      healFleet({ date: '2026-06-30', units: ['worker'], isActive: async () => false, restart });
    await run();
    await run();
    await run();
    const capped = await run(); // 4th - over cap (default 3)
    expect(restart).toHaveBeenCalledTimes(3);
    expect(capped[0].message).toContain('restart cap');
  });
});
