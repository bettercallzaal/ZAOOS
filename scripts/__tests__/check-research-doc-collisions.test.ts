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
import { describe, expect, it, vi } from 'vitest';

// These cases run REAL git in throwaway repos - a merge fixture needs ten
// process spawns before the gate is even called. vitest's 5s default is tight
// for that on any loaded machine, so it is raised here on its own merits. It is
// NOT covering for a slow suite: CI's Test job passes this file green, and the
// local timeouts that prompted a look were a saturated laptop (load average
// 143) rather than anything about the code.
vi.setConfig({ testTimeout: 30_000, hookTimeout: 30_000 });

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

/**
 * Known false positives this change CREATES, pinned deliberately.
 *
 * `EXISTING_NUMS` is read from `git ls-tree -r HEAD` - the tree BEFORE the
 * commit. Renames were invisible to this gate until 2026-09-12, so that
 * assumption was never load-bearing for them; making renames visible makes it
 * load-bearing. A commit that FREES a number and reuses it in the same commit
 * now reads the freed number as still taken.
 *
 * Shipped rather than fixed, on the vault lane's call reviewing #3494: the
 * rename hole is the real bug, these commits are rare, and the gate fails LOUD
 * with its own cause printed. These tests exist so the behaviour is documented
 * rather than discovered, and so the proper fix - subtracting paths deleted or
 * renamed-away in the same change from EXISTING_NUMS - has a place to flip.
 * Found by review, not by me.
 */
describe('known false positives: a number freed in the same commit', () => {
  it('blocks reusing a number the same commit deletes, and says why', () => {
    const { dir, git } = repo();
    reserve(git, '2400');
    mkdirSync(join(dir, 'research', 'business', '2399-draft'), { recursive: true });
    writeFileSync(
      join(dir, 'research', 'business', '2399-draft', 'README.md'),
      `${Array.from({ length: 40 }, (_, i) => `line ${i + 1} of the draft`).join('\n')}\n`,
    );
    git('add', '-A');
    git('commit', '-qm', 'add draft');
    git('rm', '-qr', 'research/business/2400-old-doc');
    git('mv', 'research/business/2399-draft', 'research/business/2400-final');
    git('add', '-A');

    const res = runGate(dir);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain("doc 2400: new = 'final', existing = 'old-doc'");
    // The false positive must carry its own cause. An unexplained one is what
    // gets a pre-commit gate commented out.
    expect(res.stderr).toContain('this is a FALSE POSITIVE');
    expect(res.stderr).toContain('read from HEAD, the tree before this commit');
  });

  it('blocks a same-commit swap of two numbers, naming both', () => {
    const { dir, git } = repo();
    reserve(git, '2400');
    reserve(git, '2471');
    git('mv', 'research/business/2400-old-doc', 'research/business/2471-swapped');
    git('mv', 'research/dev-workflows/2471-existing-doc', 'research/dev-workflows/2400-swapped');
    git('add', '-A');

    const res = runGate(dir);
    expect(res.status).toBe(1);
    // Both directions read as taken, because both vacating docs are still at HEAD.
    expect(res.stderr).toContain('doc 2400');
    expect(res.stderr).toContain('doc 2471');
    expect(res.stderr).toContain('this is a FALSE POSITIVE');
  });
});

/**
 * A merge commit's index holds everything BOTH sides brought, so diffing it
 * against HEAD alone reports every doc the other side added since the branch
 * point as newly added. Measured on a branch 40 commits behind main: 5 claims
 * seen, 0 genuinely new, and the commit was refused for numbers main already
 * held. That made a conflicted merge impossible on any branch behind by doc
 * work - the exact operation "merge, never rebase" requires.
 *
 * Two fixes were proposed and both were wrong. `git merge-base` does not help:
 * the other side added those docs AFTER the branch point. And exiting early
 * when MERGE_HEAD exists is FAIL-OPEN, because conflict resolution is an edit -
 * a doc typed during a merge would skip the gate with no flag and no trace.
 * The second test below is the one that tells those two apart, and it is why it
 * is not optional. Fix shape from the dotfiles lane.
 */
describe('a merge commit claims only what neither parent already had', () => {
  /** A conflicted merge where the other side also added a doc. */
  function merging(): { dir: string; git: (...a: string[]) => string } {
    const dir = mkdtempSync(join(tmpdir(), 'doc-merge-'));
    const git = (...a: string[]) =>
      execFileSync('git', a, { cwd: dir, encoding: 'utf8', stdio: 'pipe' });
    git('init', '-q');
    git('config', 'user.email', 't@t');
    git('config', 'user.name', 'T');
    mkdirSync(join(dir, 'research', 'business', '2400-seed'), { recursive: true });
    writeFileSync(join(dir, 'research', 'business', '2400-seed', 'README.md'), 'base\n');
    git('add', '-A');
    git('commit', '-qm', 'base');
    git('branch', '-M', 'main');
    git('branch', 'side');

    // main adds a doc AFTER the branch point, and edits the shared file
    mkdirSync(join(dir, 'research', 'agents', '2480-main-added'), { recursive: true });
    writeFileSync(join(dir, 'research', 'agents', '2480-main-added', 'README.md'), 'x\n');
    writeFileSync(join(dir, 'research', 'business', '2400-seed', 'README.md'), 'main\n');
    git('add', '-A');
    git('commit', '-qm', 'main adds 2480 and edits the seed');

    // side edits the same file, so the merge conflicts
    git('checkout', '-q', 'side');
    writeFileSync(join(dir, 'research', 'business', '2400-seed', 'README.md'), 'side\n');
    git('add', '-A');
    git('commit', '-qm', 'side edits the seed');
    try {
      git('merge', 'main', '--no-edit', '-q');
    } catch {
      /* expected: the merge conflicts */
    }
    writeFileSync(join(dir, 'research', 'business', '2400-seed', 'README.md'), 'resolved\n');
    git('add', 'research/business/2400-seed/README.md');
    return { dir, git };
  }

  it('does not claim a doc the other parent brought in', () => {
    const { dir, git } = merging();
    expect(git('rev-parse', '-q', '--verify', 'MERGE_HEAD').trim()).not.toBe('');

    expect(claims(dir, '--staged').stdout.trim()).toBe('');
    expect(runGate(dir).status).toBe(0);
  });

  // THE DISCRIMINATING CONTROL. A MERGE_HEAD early-exit passes the test above
  // and fails this one, letting an unreserved number land during a merge.
  it('still blocks a doc authored during the conflict resolution', () => {
    const { dir, git } = merging();
    mkdirSync(join(dir, 'research', 'business', '2999-authored-in-resolution'), {
      recursive: true,
    });
    writeFileSync(
      join(dir, 'research', 'business', '2999-authored-in-resolution', 'README.md'),
      'x\n',
    );
    git('add', '-A');

    expect(claims(dir, '--staged').stdout.trim()).toBe(
      'research/business/2999-authored-in-resolution/',
    );
    const res = runGate(dir);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('not reserved: 2999');
    // and it must NOT complain about the number the other parent brought
    expect(res.stderr).not.toContain('2480');
  });
});

/**
 * A THIRD question: what does the MERGED RESULT contain twice?
 *
 * "What did this commit author" cannot see a concurrent claim, by construction.
 * Two branches each claim 2480 with different slugs; each one's own pre-commit
 * run correctly saw 2480 free at the time; the MERGE is what puts both on disk.
 * So it is absent from neither parent - present in both - and the intersection
 * added in #3498 is empty. Measured: the gate passed and two directories
 * numbered 2480 landed. That is the case a reservation gate exists for, and the
 * one a merge uniquely produces. Found by the vault lane reviewing #3498.
 *
 * Scoped to numbers THIS MERGE touched. 221 numbers on main already hold more
 * than one directory - the pre-band duplicates COLLISION_TOLERANCE.md tolerates
 * - so a whole-tree scan would fire on every commit and be ignored
 * (noisy-signal-guard.md). The second test is what proves the scoping, and it
 * inherits its duplicate from the base commit rather than staging one, which is
 * the distinction that makes it a real control.
 */
describe('a merge can create a duplicate neither side authored', () => {
  /** base -> both sides claim `num` with different slugs -> conflicted merge. */
  function concurrentClaim(num: string): { dir: string; git: (...a: string[]) => string } {
    const dir = mkdtempSync(join(tmpdir(), 'doc-dupe-'));
    const git = (...a: string[]) =>
      execFileSync('git', a, { cwd: dir, encoding: 'utf8', stdio: 'pipe' });
    git('init', '-q');
    git('config', 'user.email', 't@t');
    git('config', 'user.name', 'T');
    mkdirSync(join(dir, 'research', 'business', '2400-seed'), { recursive: true });
    writeFileSync(join(dir, 'research', 'business', '2400-seed', 'README.md'), 'base\n');
    git('add', '-A');
    git('commit', '-qm', 'base');
    git('branch', '-M', 'main');
    git('branch', 'side');

    const claim = (slug: string, body: string) => {
      mkdirSync(join(dir, 'research', 'business', `${num}-${slug}`), { recursive: true });
      writeFileSync(join(dir, 'research', 'business', `${num}-${slug}`, 'README.md'), 'x\n');
      writeFileSync(join(dir, 'research', 'business', '2400-seed', 'README.md'), `${body}\n`);
      git('add', '-A');
      git('commit', '-qm', `${body} claims ${num}`);
    };
    claim('main-thing', 'main');
    git('checkout', '-q', 'side');
    claim('branch-thing', 'side');
    git('tag', '-a', `doc-${num}`, '-m', 'reserved');
    try {
      git('merge', 'main', '--no-edit', '-q');
    } catch {
      /* expected */
    }
    writeFileSync(join(dir, 'research', 'business', '2400-seed', 'README.md'), 'resolved\n');
    git('add', 'research/business/2400-seed/README.md');
    return { dir, git };
  }

  it('blocks a number both sides claimed independently', () => {
    const { dir } = concurrentClaim('2480');
    // The claim set is empty - neither side authored it relative to the other.
    expect(claims(dir, '--staged').stdout.trim()).toBe('');

    const res = runGate(dir);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('this merge puts one doc number on two docs');
    expect(res.stderr).toContain('DUPLICATE 2480');
    expect(res.stderr).toContain('2480-branch-thing');
    expect(res.stderr).toContain('2480-main-thing');
  });

  // THE SCOPING CONTROL. Without it the check would fire on all 221 pre-band
  // duplicates and be ignored. The duplicate here is INHERITED from the base
  // commit, not staged, which is what makes this a control rather than a
  // restatement.
  it('stays silent on a duplicate inherited from the base commit', () => {
    const dir = mkdtempSync(join(tmpdir(), 'doc-dupe-old-'));
    const git = (...a: string[]) =>
      execFileSync('git', a, { cwd: dir, encoding: 'utf8', stdio: 'pipe' });
    git('init', '-q');
    git('config', 'user.email', 't@t');
    git('config', 'user.name', 'T');
    for (const p of [
      ['agents', '900-alpha'],
      ['music', '900-beta'],
      ['business', '2400-seed'],
    ]) {
      mkdirSync(join(dir, 'research', p[0], p[1]), { recursive: true });
      writeFileSync(join(dir, 'research', p[0], p[1], 'README.md'), 'x\n');
    }
    git('add', '-A');
    git('commit', '-qm', 'base already holds a 900 duplicate');
    git('branch', '-M', 'main');
    git('branch', 'side');
    writeFileSync(join(dir, 'research', 'business', '2400-seed', 'README.md'), 'main\n');
    git('add', '-A');
    git('commit', '-qm', 'main edits');
    git('checkout', '-q', 'side');
    writeFileSync(join(dir, 'research', 'business', '2400-seed', 'README.md'), 'side\n');
    git('add', '-A');
    git('commit', '-qm', 'side edits');
    try {
      git('merge', 'main', '--no-edit', '-q');
    } catch {
      /* expected */
    }
    writeFileSync(join(dir, 'research', 'business', '2400-seed', 'README.md'), 'resolved\n');
    git('add', 'research/business/2400-seed/README.md');

    // the duplicate really is still there, inherited by both parents
    expect(
      git('ls-files')
        .split('\n')
        .filter((l) => l.includes('900-')).length,
    ).toBe(2);
    expect(claims(dir, '--merge-duplicates').stdout.trim()).toBe('');
    expect(runGate(dir).status).toBe(0);
  });

  it('says nothing when not merging at all', () => {
    const { dir } = repo();
    expect(claims(dir, '--merge-duplicates').stdout.trim()).toBe('');
  });
});
