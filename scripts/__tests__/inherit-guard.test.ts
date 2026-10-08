/**
 * scripts/git-hooks/ - the inherit guard, now tracked.
 *
 * Two things are pinned here.
 *
 * 1. A review pin is not another lane's branch. On 2026-10-07 the shared clone
 *    held refs/remotes/pr/3653 and refs/remotes/pr/3781, made by hand with
 *    `git fetch origin pull/N/head:refs/remotes/pr/N`. "pr" is not a remote,
 *    but `git branch -r` lists it, so a lane's own first commit read as
 *    inherited and the push was refused. Red control: the same fixture run
 *    against the check with the configured-remotes filter removed fails.
 *
 * 2. The installer puts the guard into a fresh clone's hooks dir. Until this
 *    change the three files lived only in one clone's .git/hooks.
 */

import { execFileSync, spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const GUARD_DIR = resolve(__dirname, '..', 'git-hooks');
const CHECK = join(GUARD_DIR, 'inherited-work-check.sh');
const INSTALLER = resolve(__dirname, '..', 'install-git-hooks.mjs');
const GUARD_FILES = ['inherited-work-check.sh', 'pre-push', 'post-checkout'];
const T = 30_000;

/** A bare origin, a clone of it, and a lane branch one commit ahead of origin/main. */
function fixture(): { dir: string; git: (...a: string[]) => string; mine: string } {
  const root = mkdtempSync(join(tmpdir(), 'inherit-guard-'));
  const origin = join(root, 'origin.git');
  const dir = join(root, 'clone');
  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', origin]);
  execFileSync('git', ['clone', '-q', origin, dir], { stdio: 'pipe' });
  const git = (...a: string[]) =>
    execFileSync('git', a, { cwd: dir, encoding: 'utf8', stdio: 'pipe' }).trim();
  git('config', 'user.email', 't@t');
  git('config', 'user.name', 'T');
  writeFileSync(join(dir, 'a.txt'), 'a\n');
  git('add', '-A');
  git('commit', '-qm', 'base');
  git('push', '-q', 'origin', 'HEAD:main');
  git('fetch', '-q', 'origin');
  git('checkout', '-q', '-b', 'ws/lane', 'origin/main');
  writeFileSync(join(dir, 'b.txt'), 'b\n');
  git('add', '-A');
  git('commit', '-qm', 'the lane own commit');
  return { dir, git, mine: git('rev-parse', 'HEAD') };
}

const run = (script: string, dir: string) =>
  spawnSync('sh', [script], { cwd: dir, encoding: 'utf8', timeout: 20_000 });

/** The check as it was before the fix: the same file minus the remotes filter. */
function unfixedCheck(dir: string): string {
  const src = readFileSync(CHECK, 'utf8');
  const old = src
    .split('\n')
    .filter(
      (l) =>
        !l.includes('grep -E "^($remote_re)/"') && !l.includes('[ -z "$remote_re" ] && exit 0'),
    )
    .join('\n');
  expect(old).not.toBe(src); // the filter lines exist, so removing them changed the file
  const p = join(dir, '..', 'unfixed-check.sh');
  writeFileSync(p, old, { mode: 0o755 });
  return p;
}

describe('inherited-work-check.sh - a review pin is not another lane', () => {
  it(
    'a lane branch with only its own commit passes',
    () => {
      const { dir } = fixture();
      expect(run(CHECK, dir).status).toBe(0);
    },
    T,
  );

  it(
    'a refs/remotes/pr/N pin containing the commit passes with the fix',
    () => {
      const { dir, git, mine } = fixture();
      git('update-ref', 'refs/remotes/pr/3781', mine);
      expect(git('branch', '-r', '--contains', mine)).toContain('pr/3781'); // the pin IS listed by branch -r
      const r = run(CHECK, dir);
      expect(r.stderr).not.toContain('INHERITED WORK');
      expect(r.status).toBe(0);
    },
    T,
  );

  it(
    'RED CONTROL: the same pin fails the check without the filter',
    () => {
      const { dir, git, mine } = fixture();
      git('update-ref', 'refs/remotes/pr/3781', mine);
      const r = run(unfixedCheck(dir), dir);
      expect(r.status).toBe(1);
      expect(r.stderr).toContain('INHERITED WORK');
      expect(r.stderr).toContain('pr/3781');
    },
    T,
  );

  it(
    'still refuses real inherited work: the commit is on another branch of a configured remote',
    () => {
      const { dir, git, mine } = fixture();
      git('push', '-q', 'origin', `${mine}:refs/heads/ws/other-lane`);
      git('fetch', '-q', 'origin');
      const r = run(CHECK, dir);
      expect(r.status).toBe(1);
      expect(r.stderr).toContain('origin/ws/other-lane');
    },
    T,
  );

  it(
    'the branch seeing its own remote counterpart still passes',
    () => {
      const { dir, git } = fixture();
      git('push', '-q', 'origin', 'HEAD:refs/heads/ws/lane');
      git('fetch', '-q', 'origin');
      expect(run(CHECK, dir).status).toBe(0);
    },
    T,
  );
});

describe('install-git-hooks - installs the inherit guard', () => {
  function repo(): { dir: string; hooks: string } {
    const dir = mkdtempSync(join(tmpdir(), 'inherit-install-'));
    const git = (...a: string[]) =>
      execFileSync('git', a, { cwd: dir, encoding: 'utf8', stdio: 'pipe' });
    git('init', '-q');
    mkdirSync(join(dir, 'scripts', 'git-hooks'), { recursive: true });
    copyFileSync(INSTALLER, join(dir, 'scripts', 'install-git-hooks.mjs'));
    for (const f of GUARD_FILES)
      copyFileSync(join(GUARD_DIR, f), join(dir, 'scripts', 'git-hooks', f));
    return { dir, hooks: join(dir, '.git', 'hooks') };
  }
  const install = (dir: string) =>
    spawnSync(process.execPath, ['scripts/install-git-hooks.mjs'], {
      cwd: dir,
      encoding: 'utf8',
      timeout: 20_000,
    });

  it(
    'a fresh clone gets all three files, byte for byte and executable',
    () => {
      const { dir, hooks } = repo();
      expect(install(dir).status).toBe(0);
      for (const f of GUARD_FILES) {
        expect(existsSync(join(hooks, f))).toBe(true);
        expect(readFileSync(join(hooks, f)).equals(readFileSync(join(GUARD_DIR, f)))).toBe(true);
      }
      // the installed pre-push finds the check beside it and passes on a repo with no base
      expect(
        spawnSync('sh', [join(hooks, 'pre-push')], { cwd: dir, encoding: 'utf8', timeout: 20_000 })
          .status,
      ).toBe(0);
    },
    T,
  );

  it(
    'a second run changes nothing and makes no backup',
    () => {
      const { dir, hooks } = repo();
      install(dir);
      install(dir);
      expect(readdirSync(hooks).filter((f) => f.includes('.bak.'))).toEqual([]);
    },
    T,
  );

  it(
    'an older hand-installed copy is backed up, then replaced',
    () => {
      const { dir, hooks } = repo();
      mkdirSync(hooks, { recursive: true });
      writeFileSync(
        join(hooks, 'inherited-work-check.sh'),
        '#!/bin/sh\n# the 2026-09-20 copy\nexit 0\n',
        { mode: 0o755 },
      );
      install(dir);
      const baks = readdirSync(hooks).filter((f) => f.startsWith('inherited-work-check.sh.bak.'));
      expect(baks.length).toBe(1);
      expect(readFileSync(join(hooks, baks[0]), 'utf8')).toContain('the 2026-09-20 copy');
      expect(readFileSync(join(hooks, 'inherited-work-check.sh')).equals(readFileSync(CHECK))).toBe(
        true,
      );
    },
    T,
  );
});
