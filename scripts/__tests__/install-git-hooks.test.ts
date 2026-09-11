/**
 * scripts/install-git-hooks.mjs against real git, in throwaway repos.
 *
 * The bug this pins (measured 2026-09-11 on the main clone): with
 * core.hooksPath pointing at .husky, `git rev-parse --git-path hooks` returns
 * .husky itself, so the installer's destination WAS its source. It backed the
 * real hook up to pre-commit.bak.<ts> and wrote a delegator over it that execs
 * itself - the secret + PII gates stopped existing, and a commit in that
 * checkout never returns. Every case below commits for real, with a timeout,
 * because "the hook file looks right" is not the same as "a commit runs the
 * gate and finishes".
 */
import { describe, it, expect } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const INSTALLER = resolve(__dirname, '..', 'install-git-hooks.mjs');
const REAL_HOOK = '#!/usr/bin/env sh\necho REAL-GATE-RAN >&2\nexit 0\n';

function repo(): { dir: string; git: (...a: string[]) => string } {
  const dir = mkdtempSync(join(tmpdir(), 'hooks-installer-'));
  const git = (...a: string[]) => execFileSync('git', a, { cwd: dir, encoding: 'utf8', stdio: 'pipe' });
  git('init', '-q');
  git('config', 'user.email', 't@t');
  git('config', 'user.name', 'T');
  mkdirSync(join(dir, '.husky'));
  mkdirSync(join(dir, 'scripts'));
  writeFileSync(join(dir, '.husky', 'pre-commit'), REAL_HOOK, { mode: 0o755 });
  copyFileSync(INSTALLER, join(dir, 'scripts', 'install-git-hooks.mjs'));
  writeFileSync(join(dir, 'a.txt'), 'a\n');
  git('add', '-A');
  git('commit', '-qm', 'base'); // nothing is wired yet, so no hook runs
  return { dir, git };
}

const install = (dir: string) =>
  spawnSync(process.execPath, ['scripts/install-git-hooks.mjs'], { cwd: dir, encoding: 'utf8', timeout: 20000 });

const commit = (dir: string) =>
  spawnSync('git', ['commit', '-qm', 'x', '--allow-empty'], { cwd: dir, encoding: 'utf8', timeout: 8000 });

const backups = (dir: string) => readdirSync(join(dir, '.husky')).filter((f) => f.includes('.bak.'));

describe('install-git-hooks - never overwrites the hook it delegates to', () => {
  it('plain clone: wires a delegator into .git/hooks and the real gate runs', () => {
    const { dir } = repo();
    install(dir);
    expect(readFileSync(join(dir, '.husky', 'pre-commit'), 'utf8')).toBe(REAL_HOOK);
    expect(readFileSync(join(dir, '.git', 'hooks', 'pre-commit'), 'utf8')).toContain('zaoos-husky-delegator');
    const c = commit(dir);
    expect(c.status).toBe(0);
    expect(c.stderr).toContain('REAL-GATE-RAN');
  });

  it('core.hooksPath=.husky (relative): leaves the real hook alone, and a commit finishes', () => {
    const { dir, git } = repo();
    git('config', 'core.hooksPath', '.husky');
    const r = install(dir);
    expect(r.stderr).toContain('nothing to wire');
    expect(readFileSync(join(dir, '.husky', 'pre-commit'), 'utf8')).toBe(REAL_HOOK);
    expect(backups(dir)).toEqual([]);
    const c = commit(dir);
    expect(c.error).toBeUndefined(); // a timeout surfaces here: the self-exec loop
    expect(c.status).toBe(0);
    expect(c.stderr).toContain('REAL-GATE-RAN');
  });

  it('core.hooksPath absolute (the live main clone): same', () => {
    const { dir, git } = repo();
    git('config', 'core.hooksPath', join(dir, '.husky'));
    install(dir);
    expect(readFileSync(join(dir, '.husky', 'pre-commit'), 'utf8')).toBe(REAL_HOOK);
    expect(backups(dir)).toEqual([]);
    const c = commit(dir);
    expect(c.error).toBeUndefined();
    expect(c.status).toBe(0);
  });

  it('an already-poisoned .husky/pre-commit is reported, never re-wired', () => {
    const { dir, git } = repo();
    install(dir); // plain clone: produces a delegator in .git/hooks
    const delegator = readFileSync(join(dir, '.git', 'hooks', 'pre-commit'), 'utf8');
    writeFileSync(join(dir, '.husky', 'pre-commit'), delegator, { mode: 0o755 });
    git('config', 'core.hooksPath', '.husky');
    const r = install(dir);
    expect(r.stderr).toContain('is a generated delegator, not the real hook');
    expect(r.stderr).toContain('git checkout -- .husky/pre-commit');
  });

  it('a delegator that finds itself fails fast and says why, instead of looping', () => {
    const { dir, git } = repo();
    install(dir);
    const delegator = readFileSync(join(dir, '.git', 'hooks', 'pre-commit'), 'utf8');
    writeFileSync(join(dir, '.husky', 'pre-commit'), delegator, { mode: 0o755 });
    git('config', 'core.hooksPath', '.husky');
    const c = commit(dir);
    expect(c.error).toBeUndefined();
    expect(c.status).not.toBe(0);
    expect(c.stderr).toContain('is this delegator itself');
  });
});
