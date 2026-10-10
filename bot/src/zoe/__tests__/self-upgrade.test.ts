// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import {
  buildFitCheckGoal,
  bumpResourcesToday,
  claimResourceLink,
  DEFAULT_SELF_UPGRADE_DAILY,
  parseResourceLink,
  pickRunnable,
  resourceDocQuestion,
  resourceInput,
  resourcesRunToday,
  selfUpgradeDailyCap,
  selfUpgradeEnabled,
} from '../self-upgrade';

let tmp: string;
beforeEach(async () => {
  tmp = join(tmpdir(), 'zoe-selfup-test-' + Math.random().toString(36).slice(2));
  await fs.mkdir(tmp, { recursive: true });
  vi.stubEnv('ZOE_HOME', tmp);
});
afterEach(async () => {
  vi.unstubAllEnvs();
  await fs.rm(tmp, { recursive: true, force: true });
});

describe('flags', () => {
  it('ZOE_SELF_UPGRADE is on only for the literal 1; the daily cap defaults to 2', () => {
    expect(selfUpgradeEnabled({ ZOE_SELF_UPGRADE: '1' })).toBe(true);
    expect(selfUpgradeEnabled({ ZOE_SELF_UPGRADE: 'true' })).toBe(false);
    expect(selfUpgradeEnabled({})).toBe(false);
    expect(selfUpgradeDailyCap({})).toBe(DEFAULT_SELF_UPGRADE_DAILY);
    expect(selfUpgradeDailyCap({ ZOE_SELF_UPGRADE_DAILY: '5' })).toBe(5);
    expect(selfUpgradeDailyCap({ ZOE_SELF_UPGRADE_DAILY: '-1' })).toBe(DEFAULT_SELF_UPGRADE_DAILY);
  });
});

describe('parseResourceLink', () => {
  it.each([
    ['https://github.com/obra/superpowers', 'obra', 'superpowers', ''],
    ['look at https://github.com/99darwin/orchestrator/tree/main/skills for the write-set rule', '99darwin', 'orchestrator', 'look at for the write-set rule'],
    ['https://github.com/public-apis/public-apis.git', 'public-apis', 'public-apis', ''],
    ['https://www.github.com/a-b/c.d_e/issues/12', 'a-b', 'c.d_e', ''],
  ])('%s', (text, owner, repo, note) => {
    expect(parseResourceLink(text)).toEqual({ url: `https://github.com/${owner}/${repo}`, owner, repo, note });
  });

  it('ignores GitHub pages that are not repos, and other hosts', () => {
    expect(parseResourceLink('https://github.com/orgs/foo/repositories')).toBeNull();
    expect(parseResourceLink('https://github.com/settings/tokens')).toBeNull();
    expect(parseResourceLink('https://github.com/bettercallzaal')).toBeNull();
    expect(parseResourceLink('https://gitlab.com/a/b')).toBeNull();
    expect(parseResourceLink('no link')).toBeNull();
  });
});

describe('claimResourceLink (the DM gate)', () => {
  const LINK = 'https://github.com/obra/superpowers';
  const idle = { pendingArmed: false, whyArmed: false };
  it('flag unset: never claims, so the link takes the pre-existing path', () => {
    expect(claimResourceLink(LINK, idle, {})).toBeNull();
  });
  it('flag on: claims, unless a pending answer or Add-a-why reply is armed', () => {
    const on = { ZOE_SELF_UPGRADE: '1' };
    expect(claimResourceLink(LINK, idle, on)?.repo).toBe('superpowers');
    expect(claimResourceLink(LINK, { pendingArmed: true, whyArmed: false }, on)).toBeNull();
    expect(claimResourceLink(LINK, { pendingArmed: false, whyArmed: true }, on)).toBeNull();
  });
});

describe('the fit-check brief', () => {
  it('names the repo and the steer, demands live-code search, verdicts, credit and the hermes gate', () => {
    const goal = buildFitCheckGoal(resourceInput(parseResourceLink('https://github.com/obra/superpowers focus on TDD')!));
    expect(goal).toContain('SELF-UPGRADE FIT CHECK for https://github.com/obra/superpowers');
    expect(goal).toContain("ZAAL'S STEER: focus on TDD");
    expect(goal).toContain('--owner=bettercallzaal --owner=ZAODEVZ');
    expect(goal).toContain('origin/main');
    expect(goal).toContain('LICENSE FILE');
    expect(goal).toContain('EXTEND <exact file we already have>');
    expect(goal).toContain('## Fit check');
    expect(goal).toContain('REAL FETCHES ONLY');
    expect(goal).toContain('Do not write or change any code');
    expect(goal).toContain('bot/src/hermes');
    expect(goal).not.toMatch(/\u2014/);
  });
  it('the doc question is short and names the repo', () => {
    expect(resourceDocQuestion('https://github.com/obra/superpowers focus on TDD')).toBe('Self-upgrade fit check: obra/superpowers');
  });
});

describe('the daily resource cap', () => {
  it('counts per day', async () => {
    expect(await resourcesRunToday('2026-10-10')).toBe(0);
    await bumpResourcesToday('2026-10-10');
    await bumpResourcesToday('2026-10-10');
    expect(await resourcesRunToday('2026-10-10')).toBe(2);
    expect(await resourcesRunToday('2026-10-11')).toBe(0);
  });
  it('a capped resource is skipped without blocking research behind it', () => {
    expect(pickRunnable(['resource', 'research'], 2, 2)).toBe(1);
    expect(pickRunnable(['resource', 'research'], 1, 2)).toBe(0);
    expect(pickRunnable(['resource', 'resource'], 2, 2)).toBe(-1);
    expect(pickRunnable([], 0, 2)).toBe(-1);
  });
});

describe('index.ts wiring, pinned in source (index.ts cannot be imported)', () => {
  const src = readFileSync(fileURLToPath(new URL('../index.ts', import.meta.url)), 'utf8');
  it('the DM intake goes through claimResourceLink with the pending state read correctly', () => {
    const at = src.indexOf('const resource = claimResourceLink(text, {');
    expect(at).toBeGreaterThan(-1);
    expect(src.slice(at, at + 300)).toContain("pendingArmed: Boolean(getPending('private'))");
    expect(src.slice(at, at + 2500)).toContain("await enqueueWork(resourceInput(resource), { chatId: dmChatId }, 'resource');");
  });
  it('it sits after the pending block and before the nudge toggle', () => {
    const claim = src.indexOf('const resource = claimResourceLink(text, {');
    expect(claim).toBeGreaterThan(src.indexOf("const pending = getPending('private');"));
    expect(claim).toBeLessThan(src.indexOf('const nudgeToggle = /^(stop|pause|disable)'));
  });
  it('nothing else enqueues a resource item', () => {
    expect(src.split("'resource');").length - 1).toBe(1);
  });
});
