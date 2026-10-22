/**
 * check-research-index.sh --all on a tree with no research/ dir (card 10405).
 *
 * A full audit that finds no tree has audited nothing, and it used to exit 0,
 * which reads as "every doc is indexed". An evaluator verdict rested on that
 * exit code on 2026-10-12 (ZAOOS #3923). In --all mode it now exits 2 and says
 * it could not run; the staged mode, used by pre-commit, is unchanged.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const GUARD = resolve(__dirname, '..', 'check-research-index.sh');
const run = (...args: string[]) => spawnSync('bash', [GUARD, ...args], { encoding: 'utf8' });

describe('check-research-index.sh --all that audits nothing', () => {
  it('exits 2 and says nothing was audited', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ridx-none-'));
    const r = run('--all', dir);
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/CANNOT RUN/);
  });

  it('keeps exit 0 in the staged mode, which has nothing to judge there', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ridx-none-'));
    expect(run(dir).status).toBe(0);
  });

  // evaluator-b2 on #4115: the first version tested only a MISSING research/.
  it('exits 2 for an empty research/ dir', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ridx-empty-'));
    mkdirSync(join(dir, 'research'));
    const r = run('--all', dir);
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/examined 0/);
  });

  it('exits 2 when the only docs sit in a topic folder with no README.md', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ridx-noreadme-'));
    mkdirSync(join(dir, 'research', 'agents', '9002-orphan'), { recursive: true });
    writeFileSync(join(dir, 'research', 'agents', '9002-orphan', 'README.md'), '# a doc\n');
    expect(run('--all', dir).status).toBe(2);
  });

  it('still audits a real tree in --all mode: an indexed doc passes', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ridx-ok-'));
    mkdirSync(join(dir, 'research', 'agents', '9001-a-doc'), { recursive: true });
    writeFileSync(join(dir, 'research', 'agents', '9001-a-doc', 'README.md'), '# a doc\n');
    writeFileSync(join(dir, 'research', 'agents', 'README.md'), '| n | doc |\n|---|---|\n| x | [T](./9001-a-doc/) |\n');
    expect(run('--all', dir).status).toBe(0);
  });
});
