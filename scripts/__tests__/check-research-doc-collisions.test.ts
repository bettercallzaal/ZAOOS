/**
 * scripts/check-research-doc-collisions.sh against real git, in throwaway repos.
 *
 * The bug this pins (measured 2026-09-12): the gate selected staged docs with
 * `git diff --cached --name-only --diff-filter=A`, and git detects renames by
 * default, so `git mv research/x/2400-old research/x/2471-new` stages as a
 * single R entry that A drops. A doc renumbered ONTO a number another doc
 * already holds passed the pre-commit gate with exit 0 - the one thing this
 * gate exists to stop. Same shape as the secret scan's rename hole (PR #3444).
 *
 * Renames are deliberately NOT folded in as `--diff-filter=ACMR`. That would
 * put every edited doc's own number into the reservation check and block every
 * ordinary edit to any doc predating the tag scheme. Only a rename that CHANGES
 * the number is a new claim, and `renames the slug but keeps the number` below
 * is the case that would fail if someone ever "tidies" the filter to ACMR.
 *
 * Every case runs the real script against a real staged commit, because "the
 * filter looks right" is not the same as "the gate blocks the commit".
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const GATE = resolve(__dirname, '..', 'check-research-doc-collisions.sh');

/**
 * A repo shaped like research/, holding doc 2471 under one slug and doc 2400
 * under another. 2400's body is long enough that git scores a rename rather
 * than an add+delete pair - a one-line file renames as A+D and would not
 * exercise the bug at all.
 */
function repo(): { dir: string; git: (...a: string[]) => string } {
  const dir = mkdtempSync(join(tmpdir(), 'doc-collision-'));
  const git = (...a: string[]) =>
    execFileSync('git', a, { cwd: dir, encoding: 'utf8', stdio: 'pipe' });
  git('init', '-q');
  git('config', 'user.email', 't@t');
  git('config', 'user.name', 'T');
  mkdirSync(join(dir, 'research', 'dev-workflows', '2471-existing-doc'), { recursive: true });
  mkdirSync(join(dir, 'research', 'business', '2400-old-doc'), { recursive: true });
  writeFileSync(
    join(dir, 'research', 'dev-workflows', '2471-existing-doc', 'README.md'),
    '# 2471 - existing doc\n',
  );
  writeFileSync(
    join(dir, 'research', 'business', '2400-old-doc', 'README.md'),
    `${Array.from({ length: 40 }, (_, i) => `line ${i + 1} of the old doc body`).join('\n')}\n`,
  );
  git('add', '-A');
  git('commit', '-qm', 'base');
  return { dir, git };
}

const runGate = (dir: string) =>
  spawnSync('bash', [GATE, dir], { cwd: dir, encoding: 'utf8', timeout: 20000 });

/** Reserve a number the way zao-doc-next does, so the reservation check is satisfied. */
const reserve = (git: (...a: string[]) => string, num: string) =>
  git('tag', '-a', `doc-${num}`, '-m', 'reserved');

describe('check-research-doc-collisions.sh', () => {
  it('blocks a doc renumbered onto a number another doc already holds', () => {
    const { dir, git } = repo();
    reserve(git, '2471'); // isolate the collision check from the reservation check
    git('mv', 'research/business/2400-old-doc', 'research/business/2471-renumbered');
    appendFileSync(
      join(dir, 'research', 'business', '2471-renumbered', 'README.md'),
      'and an edit\n',
    );
    git('add', '-A');

    // Precondition: this really is staged as a rename. If git ever stopped
    // scoring it as R, the test would pass for the wrong reason.
    expect(git('diff', '--cached', '--name-status')).toMatch(/^R\d+\t/);

    const res = runGate(dir);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain("doc 2471: new = 'renumbered', existing = 'existing-doc'");
  });

  it('blocks a rename onto an unreserved number, naming that number', () => {
    const { dir, git } = repo();
    git('mv', 'research/business/2400-old-doc', 'research/business/2999-brand-new');
    git('add', '-A');

    const res = runGate(dir);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('doc number(s) not reserved: 2999');
  });

  it('does NOT fire when a rename keeps the number and only changes the slug', () => {
    // The case that makes the fix a fix rather than a wider net. 2400 predates
    // the tag scheme and has no reservation, so a filter of ACMR - or one that
    // treated every rename as a new claim - would block this.
    const { dir, git } = repo();
    git('mv', 'research/business/2400-old-doc', 'research/business/2400-better-slug');
    git('add', '-A');

    const res = runGate(dir);
    expect(res.status).toBe(0);
    expect(res.stderr).toBe('');
  });

  it('does NOT fire on an ordinary edit to an existing doc', () => {
    const { dir, git } = repo();
    appendFileSync(
      join(dir, 'research', 'dev-workflows', '2471-existing-doc', 'README.md'),
      'an edit\n',
    );
    git('add', '-A');

    const res = runGate(dir);
    expect(res.status).toBe(0);
  });

  it('still blocks a brand-new added doc at a taken number', () => {
    // Pre-existing behaviour, pinned so the rename work cannot regress it.
    const { dir, git } = repo();
    reserve(git, '2471');
    mkdirSync(join(dir, 'research', 'business', '2471-a-second-doc'), { recursive: true });
    writeFileSync(join(dir, 'research', 'business', '2471-a-second-doc', 'README.md'), 'x\n');
    git('add', '-A');

    const res = runGate(dir);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain("doc 2471: new = 'a-second-doc', existing = 'existing-doc'");
  });

  it('the pre-fix filter misses the renumbering rename (red control)', () => {
    // Runs against a DIFFERENT artifact than the gate under test: a fixture
    // reproducing only the old selection line. Pinned as a fixture rather than
    // as `git show origin/main:...` on purpose - once this fix merges, main IS
    // the fixed version and a control pointed at main would silently invert.
    const { dir, git } = repo();
    reserve(git, '2471');
    git('mv', 'research/business/2400-old-doc', 'research/business/2471-renumbered');
    appendFileSync(
      join(dir, 'research', 'business', '2471-renumbered', 'README.md'),
      'and an edit\n',
    );
    git('add', '-A');

    const preFix = join(dir, 'pre-fix-selection.sh');
    writeFileSync(
      preFix,
      [
        '#!/usr/bin/env bash',
        "# The gate's selection line as it stood before 2026-09-12.",
        'set -uo pipefail',
        'cd "$1" || exit 0',
        "STAGED=$(git diff --cached --name-only --diff-filter=A 2>/dev/null | grep -E '^research/[^_/][^/]*/[0-9]+-' | head -50)",
        'if [[ -z "$STAGED" ]]; then exit 0; fi',
        'echo "$STAGED"; exit 1',
      ].join('\n'),
      { mode: 0o755 },
    );

    // The old filter selects nothing, so the gate it fed exited 0 and the
    // commit went through. The real gate blocks the identical commit.
    expect(spawnSync('bash', [preFix, dir], { encoding: 'utf8' }).status).toBe(0);
    expect(runGate(dir).status).toBe(1);
  });
});

/**
 * The --range half of the seam, which is what .github/workflows/
 * doc-collision-guard.yml calls. Same rule, different question: "what does this
 * PR claim" rather than "what does this commit claim". Tested here because a
 * workflow file cannot be unit-tested, and shipping the CI half untested is
 * how the first version of this hole survived.
 */
const SEAM = resolve(__dirname, '..', 'doc-new-claims.sh');

function prRepo(): { dir: string; git: (...a: string[]) => string } {
  const { dir, git } = repo();
  git('branch', '-M', 'main');
  git('checkout', '-q', '-b', 'pr');
  return { dir, git };
}

const claims = (dir: string, ...args: string[]) =>
  spawnSync('bash', [SEAM, ...args], { cwd: dir, encoding: 'utf8', timeout: 20000 });

describe("doc-new-claims.sh --range (the CI guard's selection)", () => {
  it('reports a doc renumbered onto another number as a claim', () => {
    const { dir, git } = prRepo();
    git('mv', 'research/business/2400-old-doc', 'research/business/2471-renumbered');
    appendFileSync(join(dir, 'research', 'business', '2471-renumbered', 'README.md'), 'edit\n');
    git('add', '-A');
    git('commit', '-qm', 'renumber');

    const res = claims(dir, '--range', 'main');
    expect(res.status).toBe(0);
    expect(res.stdout.trim()).toBe('research/business/2471-renumbered/');
  });

  it('reports nothing for a slug-only rename', () => {
    const { dir, git } = prRepo();
    git('mv', 'research/business/2400-old-doc', 'research/business/2400-better-slug');
    git('add', '-A');
    git('commit', '-qm', 'reslug');

    const res = claims(dir, '--range', 'main');
    expect(res.status).toBe(0);
    expect(res.stdout.trim()).toBe('');
  });

  it('reports a genuinely added doc, once, however many files it has', () => {
    const { dir, git } = prRepo();
    mkdirSync(join(dir, 'research', 'business', '2500-new-doc'), { recursive: true });
    writeFileSync(join(dir, 'research', 'business', '2500-new-doc', 'README.md'), 'x\n');
    writeFileSync(join(dir, 'research', 'business', '2500-new-doc', 'notes.md'), 'y\n');
    git('add', '-A');
    git('commit', '-qm', 'add');

    const res = claims(dir, '--range', 'main');
    expect(res.stdout.trim()).toBe('research/business/2500-new-doc/');
  });

  it('fails closed when git cannot answer, instead of printing nothing', () => {
    // Empty output must mean "no claims", never "I could not look" - the
    // confusion that let a staged secret past the scan gate in PR #3444.
    const { dir } = prRepo();
    const res = claims(dir, '--range', 'no-such-ref');
    expect(res.status).not.toBe(0);
    expect(res.stdout.trim()).toBe('');
    expect(res.stderr).toContain('failing closed');
  });

  it('the pre-fix CI selection misses the renumbering rename (red control)', () => {
    const { dir, git } = prRepo();
    git('mv', 'research/business/2400-old-doc', 'research/business/2471-renumbered');
    appendFileSync(join(dir, 'research', 'business', '2471-renumbered', 'README.md'), 'edit\n');
    git('add', '-A');
    git('commit', '-qm', 'renumber');

    // The workflow's selection exactly as it stood before 2026-09-12.
    const preFix = join(dir, 'pre-fix-ci.sh');
    writeFileSync(
      preFix,
      [
        '#!/usr/bin/env bash',
        'set -uo pipefail',
        'cd "$1" || exit 2',
        'added=$(git diff --name-only --diff-filter=A "main...HEAD") || exit 1',
        `printf '%s\\n' "$added" | grep -oE '^research/[^_/][^/]*/[0-9]{3,4}-[^/]+/' | sort -u || true`,
      ].join('\n'),
      { mode: 0o755 },
    );

    expect(spawnSync('bash', [preFix, dir], { encoding: 'utf8' }).stdout.trim()).toBe('');
    expect(claims(dir, '--range', 'main').stdout.trim()).toBe('research/business/2471-renumbered/');
  });
});
