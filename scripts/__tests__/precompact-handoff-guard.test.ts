/**
 * scripts/hooks/precompact-handoff-guard.sh against real git, in throwaway
 * directories.
 *
 * The two bugs this pins (hit on 2026-10-06 by the skills lane and the
 * orchestrator, both told "NO brief exists for lane 'unknown'"):
 *
 *  1. An Orca pane has neither ZAO_LANE nor a tmux session, so the lane fell
 *     through to the literal word "unknown".
 *  2. The brief was looked up in the working copy of the shared vault clone,
 *     which runs behind origin, while lanes record to handoffs/status/ on
 *     origin.
 *
 * Every case builds a vault with a real `origin` and runs the real script.
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const HOOK = resolve(__dirname, '..', 'hooks', 'precompact-handoff-guard.sh');
const HOUR = 3600;

function git(cwd: string, args: string[], env: Record<string, string> = {}): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'T',
      GIT_AUTHOR_EMAIL: 't@t',
      GIT_COMMITTER_NAME: 'T',
      GIT_COMMITTER_EMAIL: 't@t',
      ...env,
    },
  });
}

/** A home directory holding ~/zao-vault with an origin, plus a commit helper. */
function world() {
  const home = mkdtempSync(join(tmpdir(), 'handoff-guard-'));
  const origin = join(home, 'origin.git');
  const vault = join(home, 'zao-vault');
  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', origin]);
  execFileSync('git', ['clone', '-q', origin, vault], { stdio: 'pipe' });
  git(vault, ['checkout', '-q', '-b', 'main']);
  const commit = (rel: string, hoursAgo: number) => {
    const full = join(vault, rel);
    mkdirSync(resolve(full, '..'), { recursive: true });
    writeFileSync(full, `entry ${Math.random()}\n`);
    const when = `${Math.floor(Date.now() / 1000) - hoursAgo * HOUR} +0000`;
    git(vault, ['add', rel]);
    git(vault, ['commit', '-q', '-m', `record ${rel}`], {
      GIT_AUTHOR_DATE: when,
      GIT_COMMITTER_DATE: when,
    });
    git(vault, ['push', '-q', 'origin', 'HEAD:main']);
  };
  commit('README.md', 100);
  return { home, vault, commit };
}

function run(
  home: string,
  cwd: string,
  opts: { env?: Record<string, string>; check?: boolean; path?: string } = {},
) {
  const env: Record<string, string> = {
    HOME: home,
    PATH: opts.path ?? process.env.PATH ?? '',
    ...(opts.env ?? {}),
  };
  const r = spawnSync('bash', [HOOK, ...(opts.check ? ['--check'] : [])], {
    input: JSON.stringify({ cwd }),
    encoding: 'utf8',
    env,
    timeout: 30_000,
  });
  return { out: r.stdout, code: r.status };
}

function dir(home: string, name: string): string {
  const d = join(home, 'work', name);
  mkdirSync(d, { recursive: true });
  return d;
}

describe('precompact-handoff-guard: which lane is this', { timeout: 30_000 }, () => {
  it('resolves an Orca pane with no tmux and no ZAO_LANE from its directory', () => {
    // THE BUG: this printed "NO brief exists for lane 'unknown'".
    const w = world();
    w.commit('handoffs/status/orchestration.md', 1);
    const r = run(w.home, dir(w.home, 'zao-icm'));
    expect(r.out).toContain("lane 'orchestration'");
    expect(r.out).toContain('fresh enough');
    expect(r.out).not.toMatch(/unknown/i);
    expect(r.code).toBe(0);
  });

  it('resolves a git worktree with an arbitrary name through its main checkout', () => {
    const w = world();
    w.commit('handoffs/status/zaostock.md', 2);
    const main = dir(w.home, 'zaostock');
    git(main, ['init', '-q', '-b', 'main']);
    git(main, ['commit', '-q', '--allow-empty', '-m', 'init']);
    const wt = join(w.home, 'work', 'orca-7f3a91');
    git(main, ['worktree', 'add', '-q', '--detach', wt]);
    const r = run(w.home, wt);
    expect(r.out).toContain("lane 'zaostock'");
    expect(r.out).toContain('main checkout zaostock of this worktree');
    expect(r.out).toContain('fresh enough');
  });

  it('accepts an unmapped directory name only when origin holds a record for it', () => {
    const w = world();
    w.commit('handoffs/status/newlane.md', 1);
    expect(run(w.home, dir(w.home, 'newlane')).out).toContain("lane 'newlane'");
    expect(run(w.home, dir(w.home, 'scratch-thing')).out).toContain('UNKNOWN');
  });

  it('says UNKNOWN, never a guessed name, when nothing names a lane', () => {
    const w = world();
    const r = run(w.home, dir(w.home, 'scratch-thing'));
    expect(r.out).toContain("this pane's lane is UNKNOWN");
    expect(r.out).toContain('was NOT checked');
    expect(r.out).not.toContain("lane 'unknown'");
    expect(r.out).not.toContain('NO record exists');
    expect(r.code).toBe(0); // as a hook it never blocks compaction
    expect(run(w.home, dir(w.home, 'scratch-thing'), { check: true }).code).toBe(2);
  });

  it('does not ask tmux for a name when this shell is not inside tmux', () => {
    // A machine with some other tmux server running: the old hook took that
    // server's session name as this pane's lane.
    const w = world();
    const bin = join(w.home, 'fakebin');
    mkdirSync(bin);
    writeFileSync(join(bin, 'tmux'), '#!/bin/sh\necho someone-elses-session\n');
    chmodSync(join(bin, 'tmux'), 0o755);
    const r = run(w.home, dir(w.home, 'scratch-thing'), { path: `${bin}:${process.env.PATH}` });
    expect(r.out).not.toContain('someone-elses-session');
    expect(r.out).toContain('UNKNOWN');
    // and inside tmux, the session name IS used
    const inside = run(w.home, dir(w.home, 'scratch-thing'), {
      path: `${bin}:${process.env.PATH}`,
      env: { TMUX: '/tmp/tmux-1/default,1,0' },
    });
    expect(inside.out).toContain("lane 'someone-elses-session' (from tmux session)");
  });

  it('lets ZAO_LANE win over the directory', () => {
    const w = world();
    w.commit('handoffs/status/skills.md', 1);
    const r = run(w.home, dir(w.home, 'zao-icm'), { env: { ZAO_LANE: 'skills' } });
    expect(r.out).toContain("lane 'skills' (from ZAO_LANE)");
  });
});

describe('precompact-handoff-guard: is the record fresh, read from origin', {
  timeout: 30_000,
}, () => {
  it('reads origin, not the working copy of a clone that is behind', () => {
    // THE SECOND BUG: the record exists on origin and not in the clone's files.
    const w = world();
    const other = join(w.home, 'other-clone');
    execFileSync('git', ['clone', '-q', join(w.home, 'origin.git'), other], { stdio: 'pipe' });
    mkdirSync(join(other, 'handoffs', 'status'), { recursive: true });
    writeFileSync(join(other, 'handoffs', 'status', 'zj.md'), 'recorded elsewhere\n');
    git(other, ['add', '.']);
    git(other, ['commit', '-q', '-m', 'status from another machine']);
    git(other, ['push', '-q', 'origin', 'HEAD:main']);
    // w.vault has not pulled: the file is not on its disk.
    const r = run(w.home, dir(w.home, 'zaal-dotfiles'), { check: true });
    expect(r.out).toContain("lane 'zj'");
    expect(r.out).toContain('fresh enough');
    expect(r.out).toContain('fetched just now');
    expect(r.code).toBe(0);
  });

  it('counts the legacy brief path as a record too', () => {
    const w = world();
    w.commit('handoffs/zj.md', 3);
    expect(run(w.home, dir(w.home, 'zaal-dotfiles')).out).toContain(
      'last recorded 3h ago - fresh enough',
    );
  });

  it('takes the newer of the two files', () => {
    const w = world();
    w.commit('handoffs/zj.md', 40);
    w.commit('handoffs/status/zj.md', 2);
    expect(run(w.home, dir(w.home, 'zaal-dotfiles')).out).toContain('last recorded 2h ago');
  });

  it('calls a record older than six hours stale and prints the directive', () => {
    const w = world();
    w.commit('handoffs/status/zj.md', 10);
    const r = run(w.home, dir(w.home, 'zaal-dotfiles'), { check: true });
    expect(r.out).toContain("lane 'zj'");
    expect(r.out).toContain('last recorded 10h ago');
    expect(r.out).not.toContain('fresh enough');
    expect(r.out).toContain('Before doing anything else after compaction');
    expect(r.code).toBe(1);
  });

  it('says NO record for a resolved lane with nothing on origin', () => {
    const w = world();
    const r = run(w.home, dir(w.home, 'zaal-dotfiles'), { check: true });
    expect(r.out).toContain("NO record exists for lane 'zj'");
    expect(r.out).toContain('vault origin/main');
    expect(r.code).toBe(1);
  });

  it('says UNKNOWN when the vault cannot be read, not "no record"', () => {
    const home = mkdtempSync(join(tmpdir(), 'handoff-guard-novault-'));
    const r = run(home, dir(home, 'zaal-dotfiles'), { check: true });
    expect(r.out).toContain("lane 'zj'");
    expect(r.out).toContain('could not be read');
    expect(r.out).toContain('UNKNOWN');
    expect(r.out).not.toContain('NO record exists');
    expect(r.code).toBe(2);
  });

  it('names a failed fetch instead of claiming a fresh read', () => {
    const w = world();
    w.commit('handoffs/status/zj.md', 1);
    git(w.vault, ['remote', 'set-url', 'origin', join(w.home, 'gone.git')]);
    const r = run(w.home, dir(w.home, 'zaal-dotfiles'));
    expect(r.out).toContain('fetch failed');
    expect(r.out).not.toContain('fetched just now');
  });

  it('never exits non-zero as a hook, whatever it found', () => {
    const w = world();
    w.commit('handoffs/status/zj.md', 10);
    expect(run(w.home, dir(w.home, 'zaal-dotfiles')).code).toBe(0);
    expect(run(w.home, dir(w.home, 'scratch-thing')).code).toBe(0);
  });
});
