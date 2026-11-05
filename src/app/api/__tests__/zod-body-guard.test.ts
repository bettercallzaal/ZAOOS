import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

// The api-routes rule (.claude/rules/api-routes.md): "Validate ALL input with
// Zod `safeParse` before processing." Until this file nothing refused a breach
// (issue #4150). This is a ratchet: a route that reads the request body must
// contain safeParse, except the routes in BASELINE, which broke the rule on
// 2026-10-23 when this check was written. The list may only shrink: an entry
// that gains safeParse, or is deleted, fails the second test until it is
// removed here, so the baseline cannot go stale and hide a new breach.

const ROOT = join(process.cwd(), 'src/app/api');
const BODY_READ = /\b(req|request)\.(json|formData|text)\(/;

// 15 of 152 body-reading routes, measured 2026-10-23 on main e868649.
const BASELINE = new Set([
  '100ms/webhook/route.ts',
  'autocliper/approve/route.ts',
  'autocliper/ingest/route.ts',
  'autocliper/publish/route.ts',
  'bluesky/route.ts',
  'directory/route.ts',
  'discord/proposals/vote/route.ts',
  'juke/webhooks/route.ts',
  'miniapp/webhook/route.ts',
  'platforms/lens/route.ts',
  'stream/webhook/route.ts',
  'upload/route.ts',
  'webhooks/alchemy/route.ts',
  'webhooks/github/route.ts',
  'webhooks/neynar/route.ts',
]);

function routes(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === '__tests__') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...routes(p));
    else if (name === 'route.ts') out.push(p);
  }
  return out;
}

function breaches(files: Record<string, string>): string[] {
  return Object.entries(files)
    .filter(([, src]) => BODY_READ.test(src) && !src.includes('safeParse'))
    .map(([path]) => path)
    .sort();
}

const files: Record<string, string> = {};
for (const p of routes(ROOT)) files[relative(ROOT, p)] = readFileSync(p, 'utf8');

describe('api routes validate the request body with Zod safeParse', () => {
  it('the scan reads the real route tree, so an empty walk cannot pass', () => {
    expect(Object.keys(files).length).toBeGreaterThan(100);
    expect(Object.values(files).filter((s) => BODY_READ.test(s)).length).toBeGreaterThan(100);
  });

  it('no route outside the baseline reads a body without safeParse', () => {
    expect(breaches(files).filter((p) => !BASELINE.has(p))).toEqual([]);
  });

  it('the baseline only shrinks: each entry still exists and still breaks the rule', () => {
    const now = new Set(breaches(files));
    expect([...BASELINE].filter((p) => !now.has(p))).toEqual([]);
  });

  it('red control: a body read without safeParse is caught, with safeParse it is not', () => {
    const bad = 'export async function POST(req) { const b = await req.json(); }';
    const good = 'export async function POST(req) { const r = S.safeParse(await req.json()); }';
    const outgoing = 'const r = await fetch(u); const d = await res.json();';
    expect(breaches({ 'x/route.ts': bad })).toEqual(['x/route.ts']);
    expect(breaches({ 'x/route.ts': good })).toEqual([]);
    expect(breaches({ 'x/route.ts': outgoing })).toEqual([]);
  });
});
