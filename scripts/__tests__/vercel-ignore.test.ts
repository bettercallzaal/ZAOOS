// @vitest-environment node
// Runs scripts/vercel-ignore.sh against throwaway git repos. Harness adapted
// from bettercallzaal/zao-app scripts/__tests__/vercel-ignore.test.ts (MIT,
// Zaal Panthaki / The ZAO).
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SCRIPT = join(process.cwd(), 'scripts/vercel-ignore.sh');
// Isolate from the machine's git config and hooks so the test is deterministic.
const GIT_ENV = {
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  NODE_ENV: 'test' as const,
};
const ABSENT = '0123456789abcdef0123456789abcdef01234567';

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: { PATH: process.env.PATH ?? '', ...GIT_ENV },
  }).trim();
}

function write(cwd: string, path: string, body: string): void {
  mkdirSync(dirname(join(cwd, path)), { recursive: true });
  writeFileSync(join(cwd, path), body);
}

function commit(cwd: string, paths: string[], msg: string): void {
  for (const p of paths) write(cwd, p, `${msg} ${p}\n`);
  git(cwd, 'add', '-A');
  git(cwd, 'commit', '-qm', msg);
}

/** A repo with one base commit; returns its dir and the base sha. */
function newRepo(): { cwd: string; base: string } {
  const cwd = mkdtempSync(join(tmpdir(), 'vercel-ignore-zaoos-'));
  git(cwd, 'init', '-q');
  git(cwd, 'config', 'user.email', 'test');
  git(cwd, 'config', 'user.name', 'test');
  commit(cwd, ['src/app/page.tsx', 'README.md', 'research/x/README.md'], 'base');
  return { cwd, base: git(cwd, 'rev-parse', 'HEAD') };
}

/** Runs the real script as a production deploy; exit 0 = SKIP, 1 = BUILD. */
function decide(cwd: string, env: Record<string, string>): { code: number | null; log: string } {
  const r = spawnSync('bash', [SCRIPT], {
    cwd,
    encoding: 'utf8',
    env: { PATH: process.env.PATH ?? '', ...GIT_ENV, VERCEL_ENV: 'production', ...env },
  });
  return { code: r.status, log: `${r.stdout}${r.stderr}` };
}

describe('scripts/vercel-ignore.sh', { timeout: 30_000 }, () => {
  it('skips a docs-only change against a reachable previous deploy', () => {
    const { cwd, base } = newRepo();
    commit(cwd, ['research/x/README.md', 'docs/notes.md'], 'docs');
    const r = decide(cwd, { VERCEL_GIT_PREVIOUS_SHA: base });
    expect(r.code, r.log).toBe(0);
  });

  it('builds a src change', () => {
    const { cwd, base } = newRepo();
    commit(cwd, ['src/app/page.tsx'], 'code');
    expect(decide(cwd, { VERCEL_GIT_PREVIOUS_SHA: base }).code).toBe(1);
  });

  it.each([
    ['packages/', 'packages/heart-fleet/src/index.ts'],
    ['patches/', 'patches/some-lib+1.0.0.patch'],
    ['instrumentation.ts', 'instrumentation.ts'],
    ['instrumentation-client.ts', 'instrumentation-client.ts'],
    ['sentry.edge.config.ts', 'sentry.edge.config.ts'],
    ['sentry.server.config.ts', 'sentry.server.config.ts'],
    ['postcss.config.mjs', 'postcss.config.mjs'],
  ])('builds a change only in %s', (_label, path) => {
    const { cwd, base } = newRepo();
    commit(cwd, [path], 'build input');
    const r = decide(cwd, { VERCEL_GIT_PREVIOUS_SHA: base });
    expect(r.code, r.log).toBe(1);
  });

  it('builds markdown under public/, which is served', () => {
    const { cwd, base } = newRepo();
    commit(cwd, ['public/notes.md'], 'public');
    expect(decide(cwd, { VERCEL_GIT_PREVIOUS_SHA: base }).code).toBe(1);
  });

  it('builds a rename of a src file into research/', () => {
    const { cwd, base } = newRepo();
    git(cwd, 'mv', 'src/app/page.tsx', 'research/x/page.md');
    git(cwd, 'commit', '-qm', 'move');
    expect(decide(cwd, { VERCEL_GIT_PREVIOUS_SHA: base }).code).toBe(1);
  });

  it('builds when there is no previous deploy sha', () => {
    const { cwd } = newRepo();
    commit(cwd, ['docs/notes.md'], 'docs');
    const r = decide(cwd, {});
    expect(r.code, r.log).toBe(1);
    expect(r.log).toContain('no previous deploy sha');
  });

  it('builds when the previous deploy sha is unreachable, even for docs only', () => {
    const { cwd } = newRepo();
    commit(cwd, ['docs/notes.md'], 'docs');
    const r = decide(cwd, { VERCEL_GIT_PREVIOUS_SHA: ABSENT });
    expect(r.code, r.log).toBe(1);
    expect(r.log).toContain('not reachable');
  });

  it('builds a src change followed by a docs commit when the previous sha is unreachable (the HEAD^ case)', () => {
    const { cwd } = newRepo();
    commit(cwd, ['src/app/page.tsx'], 'code');
    commit(cwd, ['docs/notes.md'], 'docs');
    expect(decide(cwd, { VERCEL_GIT_PREVIOUS_SHA: ABSENT }).code).toBe(1);
  });

  it('still skips every non-production deploy', () => {
    const { cwd, base } = newRepo();
    commit(cwd, ['src/app/page.tsx'], 'code');
    const r = decide(cwd, { VERCEL_ENV: 'preview', VERCEL_GIT_PREVIOUS_SHA: base });
    expect(r.code, r.log).toBe(0);
    expect(r.log).toContain('non-production');
  });
});
