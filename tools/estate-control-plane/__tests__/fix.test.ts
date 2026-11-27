import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { EstateConfig } from '../types';
import { applyCountFix, driftCheck, planCountFix } from '../checks/drift';

const CLAIMS = { apiRoutes: '(\\d+) (?:API )?route handlers?', components: '(\\d+) components', hooks: '(\\d+) (?:custom )?hooks' };

describe('planCountFix', () => {
  it('rewrites a stale count to the measured value and leaves the rest of the line alone', () => {
    const text =
      '| `src/app/api/` | 325 route handlers across 62 domains | x |\n' +
      '| `src/components/` | 308 components by feature | y |\n' +
      '| `src/hooks/` | 18 custom hooks (useAuth) | z |';
    const plan = planCountFix('CLAUDE.md', text, CLAIMS, { apiRoutes: 327, components: 317, hooks: 19 });
    expect(plan.refusal).toBeUndefined();
    expect(plan.text).toBe(
      '| `src/app/api/` | 327 route handlers across 62 domains | x |\n' +
        '| `src/components/` | 317 components by feature | y |\n' +
        '| `src/hooks/` | 19 custom hooks (useAuth) | z |',
    );
    expect(plan.changes.map((c) => [c.key, c.from, c.to])).toEqual([
      ['apiRoutes', 325, 327],
      ['components', 308, 317],
      ['hooks', 18, 19],
    ]);
  });

  it('changes nothing when every claim already matches the measurement', () => {
    const text = '327 route handlers and 317 components and 19 hooks';
    const plan = planCountFix('CLAUDE.md', text, CLAIMS, { apiRoutes: 327, components: 317, hooks: 19 });
    expect(plan.refusal).toBeUndefined();
    expect(plan.changes).toEqual([]);
    expect(plan.text).toBe(text);
  });

  it('refuses, changing no text, when a claim pattern finds no count to rewrite', () => {
    const text = 'a page that mentions route handlers without any number in front';
    const plan = planCountFix('AGENTS.md', text, CLAIMS, { apiRoutes: 327 });
    expect(plan.refusal).toMatch(/apiRoutes: pattern .* found no count/);
    expect(plan.text).toBe(text);
    expect(plan.changes).toEqual([]);
  });

  it('skips a claim with no measurement instead of guessing one', () => {
    const text = '5 components';
    const plan = planCountFix('CLAUDE.md', text, CLAIMS, { components: 317 });
    expect(plan.text).toBe('317 components');
    expect(plan.refusal).toBeUndefined();
  });
});

describe('applyCountFix on a temp repo', () => {
  let root: string;

  async function write(rel: string, content: string) {
    const full = join(root, rel);
    await mkdir(join(full, '..'), { recursive: true });
    await writeFile(full, content);
  }

  function cfg(claimsFor: Record<string, Record<string, string>>): EstateConfig {
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
      docPointers: Object.entries(claimsFor).map(([file, claims]) => ({ file, claims })),
      phantomPathScan: [],
      zombie: { denylist: [], graduation: [] },
      quality: { apiDomainsDir: 'src/app/api', testDirName: '__tests__' },
      staleness: { maxDays: 120, estateMaxDays: 100, estateStampFile: '.estate-scan-stamp' },
      baseline: { auditAllowlist: [], typecheckErrors: 0, untestedDomains: 0 },
    };
  }

  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'ecp-fix-'));
    await write('src/app/api/foo/route.ts', 'export const GET = () => {};');
    await write('src/app/api/bar/route.ts', 'export const GET = () => {};');
    await write('src/components/Widget.tsx', 'export const Widget = () => null;');
    await write('src/components/Other.tsx', 'export const Other = () => null;');
    await write('src/hooks/useThing.ts', 'export const useThing = () => {};');
  });

  afterAll(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('writes measured counts so the doc-count drift check passes afterwards', async () => {
    await write('CLAUDE.md', '# Doc\nIt has 9 route handlers, 9 components, 9 hooks.\n');
    const cfg1 = cfg({ 'CLAUDE.md': { apiRoutes: '(\\d+) route handlers', components: '(\\d+) components', hooks: '(\\d+) hooks' } });

    const before = await driftCheck(cfg1);
    expect(before.findings.filter((f) => f.title.includes('count drift'))).toHaveLength(3);

    const res = await applyCountFix(cfg1, { write: true });
    expect(res.refusals).toEqual([]);
    expect(res.written).toEqual(['CLAUDE.md']);
    expect(res.changes).toHaveLength(3);

    const after = await driftCheck(cfg1);
    expect(after.findings.filter((f) => f.title.includes('count drift'))).toEqual([]);
    expect(await readFile(join(root, 'CLAUDE.md'), 'utf8')).toBe('# Doc\nIt has 2 route handlers, 2 components, 1 hooks.\n');
  });

  it('writes nothing when a second doc refuses, even though the first would have changed', async () => {
    await write('CLAUDE.md', '# Doc\nIt has 9 route handlers, 9 components, 9 hooks.\n');
    await write('AGENTS.md', '# Agents\nno counts here at all\n');
    const cfg2 = cfg({
      'CLAUDE.md': { apiRoutes: '(\\d+) route handlers' },
      'AGENTS.md': { apiRoutes: '(\\d+) route handlers' },
    });

    const res = await applyCountFix(cfg2, { write: true });
    expect(res.refusals).toHaveLength(1);
    expect(res.refusals[0]).toMatch(/^AGENTS\.md: /);
    expect(res.written).toEqual([]);
    expect(await readFile(join(root, 'CLAUDE.md'), 'utf8')).toBe('# Doc\nIt has 9 route handlers, 9 components, 9 hooks.\n');
  });

  it('reports the changes but writes nothing without write: true', async () => {
    await write('CLAUDE.md', '# Doc\nIt has 9 route handlers.\n');
    const cfg3 = cfg({ 'CLAUDE.md': { apiRoutes: '(\\d+) route handlers' } });
    const res = await applyCountFix(cfg3, { write: false });
    expect(res.changes.map((c) => c.to)).toEqual([2]);
    expect(res.written).toEqual([]);
    expect(await readFile(join(root, 'CLAUDE.md'), 'utf8')).toBe('# Doc\nIt has 9 route handlers.\n');
  });
});
