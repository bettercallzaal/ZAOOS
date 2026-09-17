/**
 * The /spaces/songjam embed is retired (Zaal, 2026-09-17): a 301 to /spaces,
 * and no iframe, card or header allowance left behind that would keep the
 * embed reachable from somewhere else.
 *
 * Source-level where the thing under test is config or markup with no runtime
 * harness here (next.config redirects are callable; the middleware headers and
 * the page tree are read as files).
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import nextConfig from '../../../../next.config';

const ROOT = join(__dirname, '..', '..', '..', '..');
// The retired partner's name has to appear here once: these are the things
// that must NOT exist. Every other line refers to these constants.
const RETIRED_ROUTE = '/spaces/songjam'; // [CLAIM-OK: songjam-live the route this test proves is retired]
const RETIRED_PAGE_DIR = `src/app${RETIRED_ROUTE}`;
const RETIRED_ORIGIN = /songjam\.space/i; // [CLAIM-OK: songjam-live the origin this test proves cannot be framed]
const RETIRED_ORIGIN_URL = String.raw`https?:\/\/(www\.)?songjam\.space`; // [CLAIM-OK: songjam-live same origin, as a regex source]
const RETIRED_CARD = /spaces\/songjam|SongjamSpaceCard/; // [CLAIM-OK: songjam-live the removed card and its link]

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === '__tests__' ? [] : sourceFiles(p);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [p] : [];
  });
}

describe('the retired spaces route is a permanent redirect', () => {
  it('301s to /spaces - a 301 exactly, not the 308 that permanent: true sends', async () => {
    const redirects = (await nextConfig.redirects?.()) ?? [];
    const rule = redirects.find((r) => r.source === RETIRED_ROUTE);
    expect(rule).toMatchObject({ destination: '/spaces', statusCode: 301 });
    expect(rule).not.toHaveProperty('permanent');
  });

  it('has no page left behind the redirect', () => {
    expect(existsSync(join(ROOT, RETIRED_PAGE_DIR))).toBe(false);
  });
});

describe('the embed is gone, not moved', () => {
  it('no iframe points at the retired origin by literal, and no app entry marks it embeddable', () => {
    // A listing that LINKS out (the ecosystem page) is the separate naming
    // sweep, not this ruling. What must not exist is something that FRAMES it.
    const offenders = sourceFiles(join(ROOT, 'src')).filter((f) => {
      const text = readFileSync(f, 'utf8');
      const literalFrame = new RegExp(
        `<iframe[^>]*src=\\{?\\s*['"\`]${RETIRED_ORIGIN_URL}`,
        'i',
      ).test(text);
      const embeddableEntry = new RegExp(
        `url:\\s*['"]${RETIRED_ORIGIN_URL}[^}]*embeddable:\\s*true`,
        'is',
      ).test(text);
      const constantFrame = /SONGJAM_SPACE_URL|SONGJAM_IFRAME_ALLOW/.test(text); // [CLAIM-OK: songjam-live identifiers of the removed embed module]
      return literalFrame || embeddableEntry || constantFrame;
    });
    expect(offenders).toEqual([]);
  });

  it('the spaces list no longer renders a card pointing at the old route', () => {
    const page = readFileSync(join(ROOT, 'src/app/spaces/page.tsx'), 'utf8');
    expect(page).not.toMatch(RETIRED_CARD);
  });

  // The load-bearing check: with the origin out of frame-src, the browser
  // refuses to frame it from ANY page on zaoos.com, whatever renders an iframe.
  it('middleware no longer lets the retired origin be framed or use camera and microphone', () => {
    const mw = readFileSync(join(ROOT, 'src/middleware.ts'), 'utf8');
    const csp = mw.split('\n').find((l) => l.includes('frame-src')) ?? '';
    const perms = mw.split('\n').find((l) => l.includes('camera=(')) ?? '';
    expect(csp).not.toBe('');
    expect(perms).not.toBe('');
    expect(csp).not.toMatch(RETIRED_ORIGIN);
    expect(perms).not.toMatch(RETIRED_ORIGIN);
  });
});
