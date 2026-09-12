/**
 * check-research-index.sh: the merge blindness, and the word it used to print.
 *
 * TWO DEFECTS, and the second is the interesting one.
 *
 * 1. MERGE BLINDNESS. `git diff --cached` compares the index against HEAD only,
 *    so in a merge every doc the OTHER parent added reads as newly added here.
 *    Third gate with this shape after #3498 and #3502.
 *
 * 2. CRYING WOLF. It printed "BLOCKED" and exited 1 while .husky/pre-commit
 *    invokes it as `... || echo "not blocking"`, so both lines landed in one
 *    terminal, one above the other. On 2026-09-12 that was read as the thing
 *    refusing a merge commit; the actual blocker was a different gate. An
 *    advisory check speaking in the imperative trains readers to skim the word,
 *    and then the next real BLOCKED gets skimmed too.
 *
 * The last test is the control for defect 2, and it is a control rather than a
 * style assertion because it goes red against the exact previous output.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

vi.setConfig({ testTimeout: 30_000, hookTimeout: 30_000 });

const GUARD = resolve(__dirname, '..', 'check-research-index.sh');
type Git = (...a: string[]) => string;

function doc(dir: string, topic: string, slug: string): void {
  mkdirSync(join(dir, 'research', topic, slug), { recursive: true });
  writeFileSync(join(dir, 'research', topic, slug, 'README.md'), '# a doc\n');
}
function indexRow(dir: string, topic: string, slug: string): void {
  const p = join(dir, 'research', topic, 'README.md');
  writeFileSync(p, `# ${topic}\n\n| n | doc |\n|---|---|\n| x | [T](./${slug}/) |\n`);
}

/**
 * base -> the OTHER side adds an UNINDEXED doc -> our side edits a shared file
 * -> conflicted merge, resolved. The unindexed doc is inherited from MERGE_HEAD.
 */
function mergeInheritingAnUnindexedDoc(): { dir: string; git: Git } {
  const dir = mkdtempSync(join(tmpdir(), 'ridx-'));
  const git: Git = (...a) =>
    execFileSync('git', a, { cwd: dir, encoding: 'utf8', stdio: 'pipe' });
  git('init', '-q');
  git('config', 'user.email', 't@t');
  git('config', 'user.name', 'T');
  mkdirSync(join(dir, 'research', 'business'), { recursive: true });
  writeFileSync(join(dir, 'research', 'business', 'README.md'), '# business\n');
  writeFileSync(join(dir, 'shared.md'), 'base\n');
  git('add', '-A');
  git('commit', '-qm', 'base');
  git('branch', '-M', 'main');
  git('branch', 'side');

  doc(dir, 'business', '2477-inherited-and-unindexed');
  writeFileSync(join(dir, 'shared.md'), 'main\n');
  git('add', '-A');
  git('commit', '-qm', 'main adds a doc and never indexes it');

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
  spawnSync('bash', [GUARD], { cwd: dir, encoding: 'utf8', timeout: 30_000 });

describe('check-research-index.sh on a merge commit', () => {
  it('says nothing about a doc the other parent brought in unindexed', () => {
    const { dir, git } = mergeInheritingAnUnindexedDoc();
    expect(git('rev-parse', '-q', '--verify', 'MERGE_HEAD').trim()).not.toBe('');

    const res = run(dir);
    expect(res.stderr).not.toContain('2477-inherited-and-unindexed');
    expect(res.status).toBe(0);
  });

  /**
   * THE DISCRIMINATING CONTROL. A MERGE_HEAD early-exit passes the test above
   * and fails this one - the advisory would go silent for the whole resolution.
   */
  it('still reports a doc added DURING the conflict resolution', () => {
    const { dir, git } = mergeInheritingAnUnindexedDoc();
    doc(dir, 'business', '2999-authored-in-resolution');
    git('add', '-A');

    const res = run(dir);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('2999-authored-in-resolution');
    expect(res.stderr).not.toContain('2477-inherited-and-unindexed');
  });

  it('still reports an unindexed doc on an ordinary, non-merge commit', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ridx-plain-'));
    const git: Git = (...a) =>
      execFileSync('git', a, { cwd: dir, encoding: 'utf8', stdio: 'pipe' });
    git('init', '-q');
    git('config', 'user.email', 't@t');
    git('config', 'user.name', 'T');
    mkdirSync(join(dir, 'research', 'business'), { recursive: true });
    writeFileSync(join(dir, 'research', 'business', 'README.md'), '# business\n');
    git('add', '-A');
    git('commit', '-qm', 'base');
    doc(dir, 'business', '2500-not-indexed');
    git('add', '-A');

    const res = run(dir);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('2500-not-indexed');
  });

  it('is silent when the new doc IS indexed', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ridx-ok-'));
    const git: Git = (...a) =>
      execFileSync('git', a, { cwd: dir, encoding: 'utf8', stdio: 'pipe' });
    git('init', '-q');
    git('config', 'user.email', 't@t');
    git('config', 'user.name', 'T');
    mkdirSync(join(dir, 'research', 'business'), { recursive: true });
    writeFileSync(join(dir, 'research', 'business', 'README.md'), '# business\n');
    git('add', '-A');
    git('commit', '-qm', 'base');
    doc(dir, 'business', '2501-indexed');
    indexRow(dir, 'business', '2501-indexed');
    git('add', '-A');

    expect(run(dir).status).toBe(0);
  });

  /**
   * THE WORDING CONTROL. .husky/pre-commit runs this as `... || echo "not
   * blocking"`, so a check that prints BLOCKED contradicts its own caller in
   * the same terminal. If this script ever becomes genuinely blocking, change
   * the caller first and this test second - in that order.
   */
  it('does not claim to BLOCK, because its pre-commit caller does not', () => {
    const { dir, git } = mergeInheritingAnUnindexedDoc();
    doc(dir, 'business', '2999-authored-in-resolution');
    git('add', '-A');

    const res = run(dir);
    expect(res.status).toBe(1); // it did find something
    expect(res.stderr).not.toContain('BLOCKED');
    expect(res.stderr).toContain('FOUND');
  });
});
