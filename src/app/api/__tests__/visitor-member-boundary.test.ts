// @vitest-environment node
/**
 * The open front door lets non-member Farcaster accounts hold a VISITOR
 * session. Visitors are kept out of member routes by getSessionData()
 * returning null for them. This guard fails the build if a route reads the
 * session some other way without excluding visitors, or opts into visitor
 * reads without being on the reviewed list.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const API_DIR = join(process.cwd(), 'src/app/api');

function routeFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' ? [] : routeFiles(p);
    return e.name === 'route.ts' ? [p] : [];
  });
}

/** Routes reviewed to serve visitors (read only). Adding one needs a security review. */
const VISITOR_READ_ROUTES = ['chat/messages/route.ts', 'auth/session/route.ts'];

const routes = routeFiles(API_DIR).map((p) => ({
  rel: relative(API_DIR, p),
  src: readFileSync(p, 'utf8'),
}));

describe('visitor / member boundary', () => {
  it('scans the real route tree (not an empty set)', () => {
    expect(routes.length).toBeGreaterThan(300);
  });

  it('every route reading the raw session also excludes visitors', () => {
    const unguarded = routes
      .filter((r) => /\bgetSession\(\)/.test(r.src))
      .filter(
        (r) =>
          !r.src.includes('getSessionData(') &&
          !r.src.includes('isMember === false') &&
          !/session\??\.isAdmin/.test(r.src),
      )
      .map((r) => r.rel);
    expect(unguarded).toEqual([]);
  });

  it('only reviewed routes accept a visitor reader session', () => {
    const readers = routes
      .filter((r) => r.src.includes('getReaderSession('))
      .map((r) => r.rel)
      .sort();
    expect(readers).toEqual([...VISITOR_READ_ROUTES].sort());
  });

  it('visitor read routes export no write handlers', () => {
    for (const rel of VISITOR_READ_ROUTES) {
      const src = routes.find((r) => r.rel === rel)?.src ?? '';
      expect(src, rel).not.toMatch(/export async function (POST|PUT|PATCH|DELETE)\b/);
    }
  });
});
