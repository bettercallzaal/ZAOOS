// @vitest-environment node
//
// listChangedFiles / listUntrackedFiles against REAL git, in a scratch repo
// this file creates under the OS temp dir and removes at the end (the exact
// path mkdtemp returned). Mocks cannot show what git actually prints, and the
// two holes found in the #4295 review were exactly that: rename detection
// hiding a moved path, and a trim turning "x.ts " into "x.ts".
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { listChangedFiles, listUntrackedFiles } from '../git';

let repo = '';
const git = (...args: string[]) => execFileSync('git', args, { cwd: repo, stdio: 'pipe' }).toString();

beforeAll(() => {
  repo = mkdtempSync(join(tmpdir(), 'hermes-git-real-'));
  git('init', '-q');
  git('config', 'user.name', 'test');
  git('config', 'user.email', 'test@example.com');
  git('config', 'commit.gpgsign', 'false');
  mkdirSync(join(repo, 'bot/src/hermes'), { recursive: true });
  mkdirSync(join(repo, 'src'), { recursive: true });
  writeFileSync(join(repo, 'bot/src/hermes/guard.ts'), 'export const guard = true;\n'.repeat(20));
  writeFileSync(join(repo, 'src/foo.ts'), 'export const foo = 1;\n');
  git('add', '-A');
  git('commit', '-q', '-m', 'base');
  git('update-ref', 'refs/remotes/origin/main', 'HEAD');
});

afterAll(() => {
  if (repo) rmSync(repo, { recursive: true, force: true });
});

describe('real git', () => {
  it('a staged move of a forbidden file lists the forbidden SOURCE too, not only the destination', async () => {
    git('mv', 'bot/src/hermes/guard.ts', 'src/guard.ts');
    const files = await listChangedFiles(repo);
    expect(files).toContain('bot/src/hermes/guard.ts');
    expect(files).toContain('src/guard.ts');
    git('mv', 'src/guard.ts', 'bot/src/hermes/guard.ts');
  });

  it('a new file named like an allowed path plus a trailing space keeps its real name', async () => {
    writeFileSync(join(repo, 'src/foo.ts '), 'shipped\n');
    const files = await listUntrackedFiles(repo);
    expect(files).toContain('src/foo.ts ');
    expect(files).not.toContain('src/foo.ts');
  });
});
