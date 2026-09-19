import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, renameSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { refreshVault, vaultFreshnessLine, type VaultFreshness } from '../vault-freshness';

// Real git repos, not a stub of git. The thing under test is a sequence of git
// commands whose whole point is what they do and do not touch, so a mock that
// returns canned strings would test the mock. Every refusal below has a sibling
// that differs by one thing and must be ACCEPTED, so "never pulls" cannot pass.

let root: string;
let origin: string;
let copy: string;

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', ['-C', cwd, ...args], {
    encoding: 'utf8',
    env: { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' },
  }).trim();
}

function commitOnOrigin(name: string, body: string): void {
  const work = join(root, 'author');
  writeFileSync(join(work, name), body);
  git(work, 'add', '-A');
  git(work, 'commit', '-q', '-m', `add ${name}`);
  git(work, 'push', '-q', 'origin', 'main');
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'vault-fresh-'));
  origin = join(root, 'origin.git');
  copy = join(root, 'copy');
  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', origin]);
  execFileSync('git', ['clone', '-q', origin, join(root, 'author')], { stdio: 'ignore' });
  const work = join(root, 'author');
  git(work, 'checkout', '-q', '-b', 'main');
  writeFileSync(join(work, 'BLACKBOARD.md'), 'v1\n');
  git(work, 'add', '-A');
  git(work, 'commit', '-q', '-m', 'v1');
  git(work, 'push', '-q', '-u', 'origin', 'main');
  execFileSync('git', ['clone', '-q', origin, copy], { stdio: 'ignore' });
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('refreshVault', () => {
  it('is FRESH and pulls nothing when the copy is already current', async () => {
    const f = await refreshVault(copy);
    expect(f.state).toBe('FRESH');
    expect(f.pulled).toBe(0);
    expect(f.behind).toBe(0);
  });

  it('fast-forwards a clean copy that is behind, and says how many it pulled', async () => {
    commitOnOrigin('a.md', 'a\n');
    commitOnOrigin('b.md', 'b\n');
    const f = await refreshVault(copy);
    expect(f.state).toBe('FRESH');
    expect(f.pulled).toBe(2);
    expect(git(copy, 'rev-parse', 'HEAD')).toBe(git(copy, 'rev-parse', 'origin/main'));
    expect(readFileSync(join(copy, 'b.md'), 'utf8')).toBe('b\n');
  });

  it('does NOT move a dirty copy: it is STALE, the edit survives, HEAD is unchanged', async () => {
    commitOnOrigin('a.md', 'a\n');
    writeFileSync(join(copy, 'BLACKBOARD.md'), 'a human is editing this\n');
    const before = git(copy, 'rev-parse', 'HEAD');
    const f = await refreshVault(copy);
    expect(f.state).toBe('STALE');
    expect(f.behind).toBe(1);
    expect(f.pulled).toBe(0);
    expect(f.dirty).toBe(true);
    expect(git(copy, 'rev-parse', 'HEAD')).toBe(before);
    expect(readFileSync(join(copy, 'BLACKBOARD.md'), 'utf8')).toBe('a human is editing this\n');
  });

  it('an UNTRACKED file does not block the fast-forward: only tracked edits make it dirty', async () => {
    // The sibling of the case above. Without it, "never pulls" would pass that test.
    commitOnOrigin('a.md', 'a\n');
    writeFileSync(join(copy, 'scratch-note.txt'), 'untracked\n');
    const f = await refreshVault(copy);
    expect(f.state).toBe('FRESH');
    expect(f.pulled).toBe(1);
    expect(readFileSync(join(copy, 'scratch-note.txt'), 'utf8')).toBe('untracked\n');
  });

  it('NEVER resets a copy that has diverged: local commit kept, STALE, reason names it', async () => {
    commitOnOrigin('a.md', 'a\n');
    writeFileSync(join(copy, 'local.md'), 'local work\n');
    git(copy, 'add', '-A');
    git(copy, 'commit', '-q', '-m', 'local work that exists nowhere else');
    const before = git(copy, 'rev-parse', 'HEAD');
    const f = await refreshVault(copy);
    expect(f.state).toBe('STALE');
    expect(f.ahead).toBe(1);
    expect(f.behind).toBe(1);
    expect(f.reason).toMatch(/commits origin does not/);
    expect(git(copy, 'rev-parse', 'HEAD')).toBe(before);
    expect(readFileSync(join(copy, 'local.md'), 'utf8')).toBe('local work\n');
  });

  it('is UNKNOWN, never FRESH, when origin cannot be reached', async () => {
    // The trap this guards: with origin gone the remote-tracking ref still exists,
    // so "how far behind am I" answers 0 with complete confidence.
    commitOnOrigin('a.md', 'a\n');
    renameSync(origin, join(root, 'origin-moved-away.git'));
    const f = await refreshVault(copy);
    expect(f.state).toBe('UNKNOWN');
    expect(f.behind).toBeNull();
    expect(f.reason).toMatch(/could not reach origin/);
    expect(f.headCommittedAt).toBeInstanceOf(Date);
  });

  it('is UNKNOWN for a directory that is not a git checkout, and does not throw', async () => {
    const plain = mkdtempSync(join(tmpdir(), 'not-a-repo-'));
    try {
      const f = await refreshVault(plain);
      expect(f.state).toBe('UNKNOWN');
      expect(f.reason).toMatch(/not a git checkout/);
    } finally {
      rmSync(plain, { recursive: true, force: true });
    }
  });

  it('is UNKNOWN for a path that does not exist, and does not throw', async () => {
    const f = await refreshVault(join(root, 'no', 'such', 'dir'));
    expect(f.state).toBe('UNKNOWN');
  });
});

describe('vaultFreshnessLine', () => {
  const base: VaultFreshness = {
    state: 'FRESH', behind: 0, ahead: 0, dirty: false, pulled: 0,
    headCommittedAt: new Date('2026-09-17T07:52:00Z'), reason: '',
  };

  it('says current, and does not warn, when FRESH', () => {
    expect(vaultFreshnessLine(base)).toBe('vault copy: current');
    expect(vaultFreshnessLine({ ...base, pulled: 64 })).toBe('vault copy: current, pulled 64 new commits just now');
    expect(vaultFreshnessLine({ ...base, pulled: 1 })).toContain('1 new commit just now');
    expect(vaultFreshnessLine(base)).not.toMatch(/out of date/);
  });

  it('gives the count, the time of the newest commit it has, and a warning when STALE', () => {
    const line = vaultFreshnessLine({ ...base, state: 'STALE', behind: 64, reason: 'the copy has uncommitted changes, so it was not moved' });
    expect(line).toContain('64 commits BEHIND');
    expect(line).toContain('2026-09-17 07:52 UTC');
    expect(line).toMatch(/may be out of date/);
    expect(line).toContain('uncommitted changes');
  });

  it('never claims a number when UNKNOWN, and still warns', () => {
    const line = vaultFreshnessLine({ ...base, state: 'UNKNOWN', behind: null, reason: 'could not reach origin' });
    expect(line).toContain('age UNKNOWN');
    expect(line).toMatch(/may be out of date/);
    expect(line).not.toMatch(/\d+ commits? BEHIND/);
    expect(line).not.toContain('current');
  });

  it('carries no markdown characters, so it cannot break a Telegram parse_mode', () => {
    for (const state of ['FRESH', 'STALE', 'UNKNOWN'] as const) {
      const line = vaultFreshnessLine({ ...base, state, behind: state === 'STALE' ? 3 : null, reason: 'could not reach origin' });
      expect(line).not.toMatch(/[*_`\[\]]/);
    }
  });
});
