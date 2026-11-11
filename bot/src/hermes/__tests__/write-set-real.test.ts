// @vitest-environment node
//
// listTouchedFiles + outsideWriteSet against REAL git, in a scratch repo this
// file creates under the OS temp dir and removes at the end (the exact path
// mkdtemp returned). These are the two bypasses the #4295 review reproduced
//: a staged rename hiding its out-of-set source, and a
// trailing-space name trimmed into an in-set path.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { listTouchedFiles, outsideWriteSet } from '../write-set';

let repo = '';
const git = (...args: string[]) => execFileSync('git', args, { cwd: repo, stdio: 'pipe' }).toString();
const SET = ['src/foo.ts', 'src/moved.ts'];

beforeAll(() => {
  repo = mkdtempSync(join(tmpdir(), 'hermes-write-set-real-'));
  git('init', '-q');
  git('config', 'user.name', 'test');
  git('config', 'user.email', 'test@example.com');
  git('config', 'commit.gpgsign', 'false');
  mkdirSync(join(repo, 'src'), { recursive: true });
  mkdirSync(join(repo, 'lib'), { recursive: true });
  writeFileSync(join(repo, 'lib/outside.ts'), 'export const outside = true;\n'.repeat(20));
  writeFileSync(join(repo, 'src/foo.ts'), 'export const foo = 1;\n');
  git('add', '-A');
  git('commit', '-q', '-m', 'base');
  git('update-ref', 'refs/remotes/origin/main', 'HEAD');
});

afterAll(() => {
  if (repo) rmSync(repo, { recursive: true, force: true });
});

describe('write-set on real git', () => {
  it('a staged move of an out-of-set file into the set is caught on its source', async () => {
    git('mv', 'lib/outside.ts', 'src/moved.ts');
    const offenders = outsideWriteSet(await listTouchedFiles(repo), SET);
    expect(offenders).toEqual(['lib/outside.ts']);
    git('mv', 'src/moved.ts', 'lib/outside.ts');
  });

  it('a new file named like an in-set path plus a trailing space is out of set', async () => {
    writeFileSync(join(repo, 'src/foo.ts '), 'shipped\n');
    const offenders = outsideWriteSet(await listTouchedFiles(repo), SET);
    expect(offenders).toEqual(['src/foo.ts ']);
  });
});
