/**
 * git-pii-scan.py against real git merges, in throwaway repos.
 *
 * THE BUG. The scanner reads `git diff --cached`, which in a merge commit
 * compares the index against HEAD only - so every line the OTHER parent brought
 * reads as newly added. Measured 2026-09-12 merging main into a 44-commit-stale
 * branch: it refused the commit over an address-shaped string in
 * research/business/2477-jubjub-sdk-integration-spec/README.md, content that had
 * been on main since 2026-09-08 and that nobody in the merge authored.
 *
 * The scanner's own docstring already states the principle - "context lines are
 * already committed, and re-flagging them would make every commit near an old
 * address impossible". This extends that to the merge case, where "added
 * relative to HEAD" includes the other parent's committed content.
 *
 * THIS WIDENS A FAIL-CLOSED SECURITY GATE, so the second test is the review.
 * A line INHERITED from a parent must pass; a line typed DURING the resolution
 * must still block. A `MERGE_HEAD` early-exit satisfies the first and fails the
 * second, which is what makes the pair a control rather than two agreeing
 * assertions.
 *
 * These are vitest rather than additions to test_git_pii_scan.py because that
 * suite is referenced by no workflow and no package.json script - it does not
 * run in CI, which its own docstring says is indistinguishable from passing.
 * `scripts/**\/*.test.ts` is in the root vitest include, so these do run.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

// Real git in throwaway repos: several commits and a conflicted merge per case.
vi.setConfig({ testTimeout: 30_000, hookTimeout: 30_000 });

const SCANNER = resolve(__dirname, '..', 'git-pii-scan.py');

/**
 * Address-shaped fixture strings, ASSEMBLED AT RUNTIME on purpose.
 *
 * This file is itself scanned by the gate it tests, and the gate cannot tell a
 * fixture from a person - correctly, and it should not be taught to. Writing the
 * addresses literally here makes the file unommittable. Joining the parts keeps
 * the SOURCE clean while the temp repo the scanner actually reads still contains
 * a full address-shaped string, which is what the test needs.
 */
const INHERITED = ['jane', '@', 'newsorg', '.com'].join('');
const TYPED_IN_RESOLUTION = ['real.person', '@', 'somecompany', '.co.uk'].join('');
const FLAGGED = `  creator_email: '${INHERITED}',`;

type Git = (...a: string[]) => string;

/**
 * base -> the OTHER side commits a file containing a flagged string -> our side
 * edits a shared file -> conflicted merge, resolved.
 * So the flagged line is inherited from MERGE_HEAD and authored by nobody here.
 */
function mergeInheritingAFlaggedLine(): { dir: string; git: Git } {
  const dir = mkdtempSync(join(tmpdir(), 'pii-merge-'));
  const git: Git = (...a) => execFileSync('git', a, { cwd: dir, encoding: 'utf8', stdio: 'pipe' });
  git('init', '-q');
  git('config', 'user.email', 't@t');
  git('config', 'user.name', 'T');
  writeFileSync(join(dir, 'shared.md'), 'base\n');
  git('add', '-A');
  git('commit', '-qm', 'base');
  git('branch', '-M', 'main');
  git('branch', 'side');

  mkdirSync(join(dir, 'docs'), { recursive: true });
  writeFileSync(
    join(dir, 'docs', 'sample.md'),
    `a code sample\n\n\`\`\`javascript\n${FLAGGED}\n\`\`\`\n`,
  );
  writeFileSync(join(dir, 'shared.md'), 'main\n');
  git('add', '-A');
  git('commit', '-qm', 'main adds a doc with an address-shaped placeholder');

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

const runScanner = (dir: string) =>
  spawnSync('python3', [SCANNER], { cwd: dir, encoding: 'utf8', timeout: 30_000 });

describe('git-pii-scan.py on a merge commit', () => {
  it('does not flag a line inherited from the other parent', () => {
    const { dir, git } = mergeInheritingAFlaggedLine();
    // precondition: it really is a merge, and the line really is in MERGE_HEAD
    expect(git('rev-parse', '-q', '--verify', 'MERGE_HEAD').trim()).not.toBe('');
    expect(git('diff', '--cached', '--name-only', '--diff-filter=A', 'MERGE_HEAD').trim()).toBe('');

    const res = runScanner(dir);
    expect(res.stderr).not.toContain(INHERITED);
    expect(res.status).toBe(0);
  });

  /**
   * THE DISCRIMINATING CONTROL, and the whole review of this change. A
   * `MERGE_HEAD` early-exit passes the test above and fails this one, letting a
   * real address typed during a conflict resolution through a security gate.
   */
  it('still blocks a flagged line typed DURING the conflict resolution', () => {
    const { dir, git } = mergeInheritingAFlaggedLine();
    writeFileSync(join(dir, 'notes.md'), `reach her at ${TYPED_IN_RESOLUTION} about the deck\n`);
    git('add', 'notes.md');

    const res = runScanner(dir);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain(TYPED_IN_RESOLUTION);
    // ...and it must not also complain about the inherited placeholder
    expect(res.stderr).not.toContain(INHERITED);
  });

  it('still blocks a flagged line on an ordinary, non-merge commit', () => {
    // No merge in sight: the everyday path must be untouched by this change.
    const dir = mkdtempSync(join(tmpdir(), 'pii-plain-'));
    const git: Git = (...a) =>
      execFileSync('git', a, { cwd: dir, encoding: 'utf8', stdio: 'pipe' });
    git('init', '-q');
    git('config', 'user.email', 't@t');
    git('config', 'user.name', 'T');
    writeFileSync(join(dir, 'a.md'), 'base\n');
    git('add', '-A');
    git('commit', '-qm', 'base');
    writeFileSync(join(dir, 'notes.md'), `reach her at ${TYPED_IN_RESOLUTION} about the deck\n`);
    git('add', '-A');

    const res = runScanner(dir);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain(TYPED_IN_RESOLUTION);
  });

  it('passes a clean ordinary commit', () => {
    const dir = mkdtempSync(join(tmpdir(), 'pii-clean-'));
    const git: Git = (...a) =>
      execFileSync('git', a, { cwd: dir, encoding: 'utf8', stdio: 'pipe' });
    git('init', '-q');
    git('config', 'user.email', 't@t');
    git('config', 'user.name', 'T');
    writeFileSync(join(dir, 'a.md'), 'base\n');
    git('add', '-A');
    git('commit', '-qm', 'base');
    writeFileSync(join(dir, 'b.md'), 'nothing personal here\n');
    git('add', '-A');

    expect(runScanner(dir).status).toBe(0);
  });
});
