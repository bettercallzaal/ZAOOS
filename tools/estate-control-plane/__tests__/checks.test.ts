import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { EstateConfig } from '../types';
import { driftCheck, measureLiveCounts } from '../checks/drift';
import { zombieCheck } from '../checks/zombie';
import { countUntestedDomains, qualityCheck } from '../checks/quality';

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
      apiRoutes: 'src/app/api/**/route.ts',
      apiDomainsDir: 'src/app/api',
      components: 'src/components/**/*.tsx',
      hooks: 'src/hooks',
      libDomainsDir: 'src/lib',
      researchDir: 'research',
    },
    docPointers: [
      {
        file: 'CLAUDE.md',
        claims: { apiRoutes: '(\\d+) route handlers', components: '(\\d+) components', hooks: '(\\d+) hooks' },
      },
    ],
    phantomPathScan: [{ file: 'CLAUDE.md' }],
    zombie: {
      denylist: [{ pattern: 'openclaw', label: 'decommissioned: openclaw', paths: ['src', 'bot/src'] }],
      graduation: [{ name: 'graduated-thing', removedPaths: ['src/graduated'], redirect: '/graduated' }],
    },
    quality: { apiDomainsDir: 'src/app/api', testDirName: '__tests__' },
    staleness: { maxDays: 120, estateMaxDays: 100, estateStampFile: '.estate-scan-stamp' },
    baseline: { auditAllowlist: [], typecheckErrors: 0, untestedDomains: 0 },
  };
}

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'ecp-'));
  // 2 routes across 2 domains, 1 component, 1 hook, 1 lib domain
  await write('src/app/api/foo/route.ts', 'export const GET = () => {};');
  await write('src/app/api/bar/route.ts', 'export const GET = () => {};');
  await write('src/app/api/bar/__tests__/route.test.ts', 'test');
  await write('src/components/Widget.tsx', 'export const Widget = () => null;');
  await write('src/hooks/useThing.ts', 'export const useThing = () => {};');
  await write('src/lib/auth/index.ts', 'export {};');
  await write('research/infra/100-sample/README.md', '---\nlast-validated: 2020-01-01\n---\n# old');
  // a decommissioned-code reference + graduated code left behind
  await write('src/legacy/old.ts', '// uses openclaw under the hood');
  await write('src/graduated/leftover.ts', 'export {};');
  // CLAUDE.md with WRONG counts + a phantom path row
  await write(
    'CLAUDE.md',
    [
      '# Test',
      'It has 9 route handlers, 9 components, 9 hooks.',
      '',
      '| Dir | What |',
      '|-----|------|',
      '| `src/app/api/` | routes |',
      '| `ghost/` | does not exist |',
    ].join('\n'),
  );
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('drift check', () => {
  it('measures live counts from the repo', async () => {
    const live = await measureLiveCounts(cfg());
    expect(live.apiRoutes).toBe(2);
    expect(live.apiDomains).toBe(2);
    expect(live.components).toBe(1);
    expect(live.hooks).toBe(1);
    expect(live.libDomains).toBe(1);
    expect(live.researchDocs).toBe(1);
  });

  it('flags count drift (claims 9, repo has fewer) as fixable fails', async () => {
    const res = await driftCheck(cfg());
    const counts = res.findings.filter((f) => f.title.includes('count drift'));
    expect(counts.length).toBe(3); // routes, components, hooks all wrong
    expect(counts.every((f) => f.severity === 'fail' && f.fixable)).toBe(true);
  });

  it('flags a phantom path that exists only in the project-map table', async () => {
    const res = await driftCheck(cfg());
    expect(res.findings.some((f) => f.title.includes('phantom path `ghost/`'))).toBe(true);
    // does NOT flag src/app/api/ (it exists)
    expect(res.findings.some((f) => f.title.includes('src/app/api'))).toBe(false);
  });

  it('warns on a research doc past its last-validated SLA', async () => {
    const res = await driftCheck(cfg());
    expect(res.findings.some((f) => f.severity === 'warn' && f.title.includes('last-validated SLA'))).toBe(true);
  });
});

describe('zombie check', () => {
  it('flags decommissioned code references (code, not docs)', async () => {
    const res = await zombieCheck(cfg());
    expect(res.findings.some((f) => f.title.includes('openclaw'))).toBe(true);
  });

  it('fails when graduated code is still present', async () => {
    const res = await zombieCheck(cfg());
    const g = res.findings.find((f) => f.title.includes("graduated 'graduated-thing' code still present"));
    expect(g?.severity).toBe('fail');
  });
});

describe('quality check', () => {
  it('counts API domains with no __tests__', async () => {
    const { untested, total } = await countUntestedDomains(join(root, 'src/app/api'), '__tests__');
    expect(total).toBe(2);
    expect(untested).toEqual(['foo']); // bar has __tests__, foo does not
  });

  it('warns when untested domains exceed the baseline', async () => {
    const res = await qualityCheck(cfg()); // baseline untestedDomains=0, actual=1
    expect(res.findings.some((f) => f.title.includes('untested API domains'))).toBe(true);
  });
});
