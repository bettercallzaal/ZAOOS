// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const goals = vi.hoisted(() => [] as string[]);
const sent = vi.hoisted(() => [] as string[]);
vi.mock('../dispatch', () => ({
  dispatchPlan: vi.fn(async (opts: { goal: string }) => {
    goals.push(opts.goal);
  }),
}));
vi.mock('../receipts', () => ({ emitReceipt: vi.fn(async () => undefined) }));
vi.mock('../../hermes/claude-cli', () => ({ callClaudeCli: vi.fn(async () => ({ text: '' })) }));

import {
  buildFitCheckGoal,
  parseResourceLink,
  selfUpgradeSnapshotEnabled,
  snapshotBinCandidates,
  takeResourceSnapshot,
} from '../self-upgrade';

let tmp: string;
let home: string;
let binDir: string;
const link = () => parseResourceLink('https://github.com/obra/superpowers')!;

async function fakeTool(body: string): Promise<void> {
  await fs.mkdir(binDir, { recursive: true });
  const p = join(binDir, 'zao-research-snapshot');
  await fs.writeFile(p, `#!/bin/sh\n${body}\n`);
  await fs.chmod(p, 0o755);
}
const fakeVault = () => fs.mkdir(join(home, 'zao-vault', '.git'), { recursive: true });

beforeEach(async () => {
  tmp = join(tmpdir(), 'zoe-su-snap-' + Math.random().toString(36).slice(2));
  home = join(tmp, 'home');
  binDir = join(tmp, 'pathbin');
  await fs.mkdir(home, { recursive: true });
  vi.stubEnv('ZOE_HOME', join(tmp, 'zoe'));
  goals.length = 0;
  sent.length = 0;
});
afterEach(async () => {
  vi.unstubAllEnvs();
  await fs.rm(tmp, { recursive: true, force: true });
});

describe('flag', () => {
  it('is on only for the literal 1', () => {
    expect(selfUpgradeSnapshotEnabled({ ZOE_SELF_UPGRADE_SNAPSHOT: '1' })).toBe(true);
    expect(selfUpgradeSnapshotEnabled({ ZOE_SELF_UPGRADE_SNAPSHOT: 'true' })).toBe(false);
    expect(selfUpgradeSnapshotEnabled({})).toBe(false);
  });
});

describe('snapshotBinCandidates', () => {
  it('searches PATH, then ~/bin, which the systemd PATH lacks', () => {
    expect(snapshotBinCandidates({ PATH: '/usr/bin:/bin' }, '/home/z')).toEqual([
      '/usr/bin/zao-research-snapshot',
      '/bin/zao-research-snapshot',
      '/home/z/bin/zao-research-snapshot',
    ]);
  });
  it('does not list ~/bin twice', () => {
    expect(snapshotBinCandidates({ PATH: '/home/z/bin' }, '/home/z')).toEqual(['/home/z/bin/zao-research-snapshot']);
  });
});

describe('takeResourceSnapshot fails closed', () => {
  it('no vault clone: refuses before looking for the tool', async () => {
    await fakeTool('echo should-not-run');
    const r = await takeResourceSnapshot(link(), { PATH: binDir }, home);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('no vault clone');
  });

  it('no tool: names the dirs it searched', async () => {
    await fakeVault();
    const r = await takeResourceSnapshot(link(), { PATH: binDir }, home);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toContain('zao-research-snapshot is not on this host');
      expect(r.reason).toContain(join(home, 'bin'));
    }
  });

  it('a non-zero exit is a failure, with its stderr', async () => {
    await fakeVault();
    await fakeTool('echo boom >&2; exit 3');
    const r = await takeResourceSnapshot(link(), { PATH: binDir }, home);
    expect(r).toEqual({ ok: false, reason: expect.stringContaining('boom') });
  });

  it('empty output is a failure, not an empty snapshot', async () => {
    await fakeVault();
    await fakeTool('true');
    const r = await takeResourceSnapshot(link(), { PATH: binDir }, home);
    expect(r).toEqual({ ok: false, reason: expect.stringContaining('printed nothing') });
  });

  it('runs owner/repo and returns its output; ~/bin is found off PATH', async () => {
    await fakeVault();
    binDir = join(home, 'bin');
    await fakeTool('echo "snap for $1 home=$HOME"');
    const r = await takeResourceSnapshot(link(), { PATH: '/nonexistent' }, home);
    expect(r).toEqual({ ok: true, text: `snap for obra/superpowers home=${home}` });
  });
});

describe('the fit-check goal carries the snapshot', () => {
  it('with a snapshot', () => {
    expect(buildFitCheckGoal('https://github.com/obra/superpowers', 'stars 123')).toContain(
      'SNAPSHOT (zao-research-snapshot',
    );
    expect(buildFitCheckGoal('https://github.com/obra/superpowers', 'stars 123')).toContain('stars 123');
  });
  it('red control: without one the brief is unchanged', () => {
    expect(buildFitCheckGoal('https://github.com/obra/superpowers')).not.toContain('SNAPSHOT');
  });
});

describe('work loop with stage 3 on', () => {
  const deps = () => ({
    sendToZaal: async (t: string) => {
      sent.push(t);
    },
    zaalTgId: 1,
    repoDir: tmp,
    currentDate: '2026-10-10',
  });

  it('missing tool: parks before any spend, says what is missing, dequeues', async () => {
    vi.stubEnv('ZOE_SELF_UPGRADE_SNAPSHOT', '1');
    vi.stubEnv('HOME', home);
    vi.stubEnv('PATH', binDir);
    await fakeVault();
    const { enqueueWork, runWorkTick, queueDepth } = await import('../work-loop');
    await enqueueWork('https://github.com/obra/superpowers', undefined, 'resource');
    await runWorkTick(deps());
    expect(goals).toEqual([]);
    expect(await queueDepth()).toBe(0);
    expect(sent.join('\n')).toContain('parked before the fit check');
    expect(sent.join('\n')).toContain('not on this host');
    const { resourcesRunToday } = await import('../self-upgrade');
    expect(await resourcesRunToday('2026-10-10')).toBe(0);
    const parked = await fs.readFile(join(tmp, 'zoe', 'work-parked.jsonl'), 'utf8').catch(() => '');
    expect(parked).toContain('needs-input');
  });

  it('tool present: the worker gets the snapshot in its brief', async () => {
    vi.stubEnv('ZOE_SELF_UPGRADE_SNAPSHOT', '1');
    vi.stubEnv('HOME', home);
    vi.stubEnv('PATH', binDir);
    await fakeVault();
    await fakeTool('echo "obra/superpowers stars 99"');
    const { enqueueWork, runWorkTick } = await import('../work-loop');
    await enqueueWork('https://github.com/obra/superpowers', undefined, 'resource');
    await runWorkTick(deps());
    expect(goals[0]).toContain('SELF-UPGRADE FIT CHECK');
    expect(goals[0]).toContain('obra/superpowers stars 99');
  });

  it('red control: flag off, no tool, no vault: the fit check runs as before', async () => {
    vi.stubEnv('HOME', home);
    vi.stubEnv('PATH', binDir);
    const { enqueueWork, runWorkTick } = await import('../work-loop');
    await enqueueWork('https://github.com/obra/superpowers', undefined, 'resource');
    await runWorkTick(deps());
    expect(goals[0]).toContain('SELF-UPGRADE FIT CHECK');
    expect(goals[0]).not.toContain('SNAPSHOT');
  });

  it('a research item never takes a snapshot, flag on or not', async () => {
    vi.stubEnv('ZOE_SELF_UPGRADE_SNAPSHOT', '1');
    vi.stubEnv('HOME', home);
    vi.stubEnv('PATH', binDir);
    const { enqueueWork, runWorkTick } = await import('../work-loop');
    await enqueueWork('Investigate sound gear in Ellsworth');
    await runWorkTick(deps());
    expect(goals).toEqual(['Investigate sound gear in Ellsworth']);
  });
});
