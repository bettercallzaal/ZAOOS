/**
 * git-secret-scan.sh against real git merges, in throwaway repos.
 *
 * THE BUG. The gate reads `git diff --cached`, which in a merge commit compares
 * the index against HEAD only - so every line the OTHER parent brought reads as
 * newly added. A branch behind main by any commit that touched a file with a
 * secret-shaped string in it could not be merged at all, and the gate's message
 * blamed the person doing the merge for content already on main.
 *
 * Third instance of one shape: check-research-doc-collisions.sh (#3498) and
 * git-pii-scan.py (#3502) were the first two. Two gates still have it.
 *
 * THIS WIDENS A FAIL-CLOSED SECURITY GATE, so the controls are the review. A
 * line INHERITED from a parent must pass; a line typed DURING the resolution
 * must still block. A MERGE_HEAD early-exit satisfies the first and fails the
 * second, which is what makes the pair a control rather than two agreeing
 * assertions.
 *
 * Rows are compared PATH-TAGGED rather than as bare text. I believed bare text
 * could produce a false pass - the other parent's `+<secret>` in one file
 * cancelling a genuinely new one in another - wrote a test for it, and THE TEST
 * DID NOT GO RED. A file created during the resolution is new relative to
 * MERGE_HEAD too, so its lines are always in that set and can never be cancelled.
 * The hypothesis was wrong and the test was deleted rather than kept as a
 * passing decoration. Path-tagging stays because comparing a line in the file it
 * belongs to is the semantically right comparison, not because it is a proven
 * guard - see the note in the script.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

vi.setConfig({ testTimeout: 30_000, hookTimeout: 30_000 });

const SCANNER = resolve(__dirname, '..', 'git-secret-scan.sh');

/**
 * AWS-key-shaped fixtures, ASSEMBLED AT RUNTIME on purpose: this file is scanned
 * by the gate it tests, and the gate cannot tell a fixture from a real key -
 * correctly. Joining the parts keeps the SOURCE clean while the temp repo the
 * scanner actually reads holds a full key-shaped string.
 */
const INHERITED = ['AKIA', 'Q7ZZEXAMPLE00001'].join('');
const TYPED_IN_RESOLUTION = ['AKIA', 'R9YYRESOLVED0002'].join('');

type Git = (...a: string[]) => string;

const gitIn = (dir: string): Git =>
  (...a) => execFileSync('git', a, { cwd: dir, encoding: 'utf8', stdio: 'pipe' });

function newRepo(prefix: string): { dir: string; git: Git } {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  const git = gitIn(dir);
  git('init', '-q');
  git('config', 'user.email', 't@t');
  git('config', 'user.name', 'T');
  return { dir, git };
}

/**
 * base -> the OTHER side commits a file containing a key -> our side edits a
 * shared file -> conflicted merge, resolved. The key is inherited from
 * MERGE_HEAD and authored by nobody here.
 */
function mergeInheritingAKey(): { dir: string; git: Git } {
  const { dir, git } = newRepo('secret-merge-');
  writeFileSync(join(dir, 'shared.md'), 'base\n');
  git('add', '-A');
  git('commit', '-qm', 'base');
  git('branch', '-M', 'main');
  git('branch', 'side');

  mkdirSync(join(dir, 'docs'), { recursive: true });
  writeFileSync(join(dir, 'docs', 'sample.md'), `an old example\n\n    key = ${INHERITED}\n`);
  writeFileSync(join(dir, 'shared.md'), 'main\n');
  git('add', '-A');
  git('commit', '-qm', 'main adds a doc containing a key-shaped string');

  git('checkout', '-q', 'side');
  writeFileSync(join(dir, 'shared.md'), 'side\n');
  git('add', '-A');
  git('commit', '-qm', 'side edits the shared file');
  try {
    git('merge', 'main', '--no-edit', '-q');
  } catch {
    /* expected: the merge conflicts */
  }
  writeFileSync(join(dir, 'shared.md'), 'resolved\n');
  git('add', 'shared.md');
  return { dir, git };
}

const run = (dir: string) =>
  spawnSync('bash', [SCANNER], { cwd: dir, encoding: 'utf8', timeout: 30_000 });

describe('git-secret-scan.sh on a merge commit', () => {
  it('does not flag a key inherited from the other parent', () => {
    const { dir, git } = mergeInheritingAKey();
    expect(git('rev-parse', '-q', '--verify', 'MERGE_HEAD').trim()).not.toBe('');

    const res = run(dir);
    expect(res.stderr).not.toContain(INHERITED);
    expect(res.status).toBe(0);
  });

  /**
   * THE DISCRIMINATING CONTROL. A MERGE_HEAD early-exit passes the test above
   * and fails this one, letting a real key typed during a conflict resolution
   * through a security gate.
   */
  it('still blocks a key typed DURING the conflict resolution', () => {
    const { dir, git } = mergeInheritingAKey();
    writeFileSync(join(dir, 'notes.md'), `aws_key = ${TYPED_IN_RESOLUTION}\n`);
    git('add', 'notes.md');

    const res = run(dir);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain(TYPED_IN_RESOLUTION);
    expect(res.stderr).not.toContain(INHERITED);
  });

  it('still blocks a staged env file typed during the resolution', () => {
    const { dir, git } = mergeInheritingAKey();
    writeFileSync(join(dir, '.env'), 'SOME=value\n');
    git('add', '-f', '.env');

    const res = run(dir);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('.env');
  });

  it('still blocks a key on an ordinary, non-merge commit', () => {
    const { dir, git } = newRepo('secret-plain-');
    writeFileSync(join(dir, 'a.md'), 'base\n');
    git('add', '-A');
    git('commit', '-qm', 'base');
    writeFileSync(join(dir, 'notes.md'), `aws_key = ${TYPED_IN_RESOLUTION}\n`);
    git('add', '-A');

    const res = run(dir);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain(TYPED_IN_RESOLUTION);
  });

  it('passes a clean ordinary commit', () => {
    const { dir, git } = newRepo('secret-clean-');
    writeFileSync(join(dir, 'a.md'), 'base\n');
    git('add', '-A');
    git('commit', '-qm', 'base');
    writeFileSync(join(dir, 'b.md'), 'nothing secret here\n');
    git('add', '-A');

    expect(run(dir).status).toBe(0);
  });
});
