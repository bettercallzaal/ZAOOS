import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { EstateConfig } from '../types';
import { applyCountFixes } from '../fix-drift';

let root: string;

async function write(rel: string, content: string) {
  const full = join(root, rel);
  await mkdir(join(full, '..'), { recursive: true });
  await writeFile(full, content);
}

function cfg(): EstateConfig {
  return {
    repoRoot: root,
    live: {
      apiRoutes: '', apiDomainsDir: 'src/app/api', components: '', hooks: 'src/hooks',
      libDomainsDir: 'src/lib', researchDir: 'research',
    },
    docPointers: [
      { file: 'CLAUDE.md', claims: { apiRoutes: '(\\d+) route handlers', components: '(\\d+) components' } },
    ],
    phantomPathScan: [],
    zombie: { denylist: [], graduation: [] },
    quality: { apiDomainsDir: 'src/app/api', testDirName: '__tests__' },
    staleness: { maxDays: 120, estateMaxDays: 100, estateStampFile: '.estate-scan-stamp' },
    baseline: { auditAllowlist: [], typecheckErrors: 0, untestedDomains: 0, ratchetMaxFails: 0 },
  };
}

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'ecp-fix-'));
  await write('src/app/api/foo/route.ts', '');
  await write('src/app/api/bar/route.ts', '');
  await write('src/app/api/baz/route.ts', '');
  await write('src/components/A.tsx', '');
  await write('src/components/B.tsx', '');
  // doc claims wrong numbers (3 routes, 2 components in reality)
  await write('CLAUDE.md', 'This repo has 99 route handlers and 77 components total.');
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('applyCountFixes', () => {
  it('rewrites stale counts to live values and reports each change', async () => {
    const res = await applyCountFixes(cfg());
    expect(res.changed).toContainEqual({ file: 'CLAUDE.md', key: 'apiRoutes', from: 99, to: 3 });
    expect(res.changed).toContainEqual({ file: 'CLAUDE.md', key: 'components', from: 77, to: 2 });
    const text = await readFile(join(root, 'CLAUDE.md'), 'utf8');
    expect(text).toBe('This repo has 3 route handlers and 2 components total.');
  });

  it('is idempotent - a second run changes nothing', async () => {
    const res = await applyCountFixes(cfg());
    expect(res.changed).toHaveLength(0);
  });
});
