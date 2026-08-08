#!/usr/bin/env python3
"""Regenerate src/lib/surface-map.ts from the actual route files.

Run this in the SAME PR as any route add/remove/rename:
    python3 scripts/agents/gen-surface-map.py

A hand-maintained map drifts within a week; a generated one cannot. This feeds
both /surface (the clickable explorer) and research doc 2245 (the written map).

WHY THE AUTH DETECTOR LOOKS FOR SO MANY THINGS (the 2026-08-07 audit)
--------------------------------------------------------------------
v1 of this script only knew two guards: `isAdmin` and `getSession`. Everything
else fell through to `public`, which produced 35 "public" routes and sent a
security audit chasing four false positives in a row - /api/crm/capture (token +
origin allowlist + rate limit), /api/stream/webhook (HMAC + timingSafeEqual),
/api/webhooks/alchemy (HMAC, fails closed), /api/miniapp/webhook (Farcaster's
own verification). All four were correctly guarded. A detector that cries wolf
35 times gets ignored on the one that matters, so it now recognises the guards
this codebase actually uses.

The far more useful signal turned out not to be "is it public" but
"is it public AND does it hold a service-role key". A service-role client
bypasses RLS, so an unauthenticated handler holding one can read whole tables -
that is precisely the shape of the August 2026 anonymous-board leak (#2829).
That combination is what `review` flags.

`auth` remains INFERRED FROM SOURCE TEXT. It is a strong hint and an audit
starting point, never a proof. Read the handler before you trust the label.

ROUTE PATHS ARE ALWAYS POSIX, ON EVERY OS (the 2026-08-07 Windows fix)
----------------------------------------------------------------------
A URL path is not a filesystem path. Building one out of os.sep meant that
running this script on Windows - now one of the always-on machines - wrote all
324 routes as `\\api\\...`, which is not a URL and breaks every link in
/surface. The `/cron/` fallback in auth_of() also cannot match a backslash path;
today that changes no label (all 14 cron routes are caught earlier by their
CRON_SECRET marker), but a cron route without that marker would silently be
labelled `public`. The separator is normalised once, where the relative path is
built, and everything downstream consumes that one posix string.
"""
import json
import os
import re
import subprocess
import sys

ROOT = subprocess.check_output(['git', 'rev-parse', '--show-toplevel'], text=True).strip()
APP = os.path.join(ROOT, 'src', 'app')
API = os.path.join(APP, 'api')
OUT = os.path.join(ROOT, 'src', 'lib', 'surface-map.ts')
SUFFIX_LEN = len('/route.ts')  # 9. Getting this wrong silently truncates every path.

# Each guard the codebase actually uses, most-specific first. Order matters:
# a route with both a session check and an HMAC is reported as `session`.
GUARDS = [
    ('admin', ('isAdmin',)),
    ('session', ('getSession', 'getSessionData')),
    ('cron', ('CRON_SECRET',)),
    # Cryptographic sender verification - HMAC, timing-safe compare, or a
    # protocol library that does the same (Farcaster, SIWE).
    ('signed', ('WEBHOOK_SECRET', 'createHmac', 'timingSafeEqual', 'verifyAppKey',
                'parseWebhookEvent', 'verifySignature', 'verifyMessage')),
    # A shared token and/or an origin allowlist. Weaker than a signature but a
    # real gate - the caller must know something or come from somewhere.
    ('token', ('ALLOWED_ORIGIN', 'allowedOrigins', 'CAPTURE_TOKEN',
               'authorization', 'Bearer')),
]

SERVICE_ROLE_MARKERS = ('getSupabaseAdmin', 'SERVICE_ROLE')
RATELIMIT_MARKERS = ('rateLimit', 'ratelimit', 'checkRate', 'RATE_LIMIT')

# A route that is public + service-role ON PURPOSE, and has been read by a human
# who wrote down why, carries this marker in its header comment:
#
#     @public-reviewed 2026-08-07 - OBS overlays cannot carry a session; ...
#
# Without it, the `review` flag would be permanent: the four flagged routes on
# 2026-08-07 included one that is correctly public, so the count could never
# reach zero and would become exactly the background noise this audit existed to
# remove. A signal that can never be cleared is a signal that gets ignored - the
# same failure as v1's 35 false-positive `public` labels.
#
# The marker asserts "a human read this and it is public on purpose", not "safe".
# It is deliberately a source comment: it lives with the code, moves with it, and
# shows up in the diff if someone removes it.
REVIEWED_MARKER = '@public-reviewed'


def first_doc(path, maxlines=14):
    """First human line of the file header - a JSDoc bullet or a // comment."""
    try:
        with open(path, encoding='utf-8', errors='ignore') as fh:
            for i, line in enumerate(fh):
                if i > maxlines:
                    break
                l = line.strip()
                m = re.match(r'^\*\s+(?:(?:GET|POST|PUT|PATCH|DELETE)\s+)?(.+)', l)
                if m and len(m.group(1)) > 12 and not m.group(1).startswith('/'):
                    return m.group(1).rstrip('.')[:100]
                if l.startswith('// ') and len(l) > 15 and not l.startswith('// eslint'):
                    return l[3:].rstrip('.')[:100]
    except OSError:
        pass
    return ''


def auth_of(src, path):
    for label, markers in GUARDS:
        if any(m in src for m in markers):
            return label
    if '/cron/' in path:
        return 'cron'
    return 'public'


def main():
    routes = []
    for root, dirs, files in os.walk(API):
        dirs[:] = [d for d in dirs if d not in ('node_modules', '__tests__')]
        if 'route.ts' not in files:
            continue
        p = os.path.join(root, 'route.ts')
        try:
            src = open(p, encoding='utf-8', errors='ignore').read()
        except OSError:
            continue
        # A URL path, not a filesystem path: posix separators on every OS.
        rel = '/' + os.path.relpath(p, APP).replace(os.sep, '/')
        rel = rel[:-SUFFIX_LEN]
        methods = [m for m in ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')
                   if re.search(rf'export async function {m}\b', src)]
        # The route path, never the filesystem path - auth_of()'s `/cron/` test
        # only matches a posix URL path.
        auth = auth_of(src, rel)
        service_role = any(m in src for m in SERVICE_ROLE_MARKERS)
        rate_limited = any(m in src for m in RATELIMIT_MARKERS)
        # The one combination worth a human's eyes: no gate at all, yet holding a
        # key that bypasses RLS. A rate limit slows enumeration but does not
        # authorize anyone, so it does not clear the flag.
        reviewed = REVIEWED_MARKER in src
        review = auth == 'public' and service_role and not reviewed
        routes.append({
            'path': rel,
            'methods': methods,
            'auth': auth,
            'what': first_doc(p),
            'dynamic': '[' in rel,
            'serviceRole': service_role,
            'rateLimited': rate_limited,
            'reviewed': reviewed,
            'review': review,
        })
    routes.sort(key=lambda r: r['path'])

    stamp = subprocess.check_output(
        ['git', 'log', '-1', '--format=%cs'], cwd=ROOT, text=True).strip()

    body = f"""// AUTO-GENERATED by scripts/agents/gen-surface-map.py - do not hand-edit.
// Regenerate in the SAME PR as any route change: python3 scripts/agents/gen-surface-map.py
// Source of truth for /surface (the route explorer) and doc 2245.

export interface RouteEntry {{
  path: string;
  methods: string[];
  /** guard inferred from the route source: admin | session | cron | signed | token | public */
  auth: string;
  what: string;
  /** true when the path has a [param] segment - not directly callable without a value */
  dynamic: boolean;
  /** holds a service-role / RLS-bypassing Supabase client */
  serviceRole: boolean;
  /** applies its own rate limit (slows enumeration; does NOT authorize anyone) */
  rateLimited: boolean;
  /** carries an @public-reviewed marker: a human read it and it is public on purpose */
  reviewed: boolean;
  /** public AND service-role AND not yet reviewed. Read this handler. */
  review: boolean;
}}

export const GENERATED_AT = '{stamp}';
export const ROUTES: RouteEntry[] = {json.dumps(routes, indent=2)};
"""
    # LF and utf-8 explicitly: text mode on Windows would write CRLF and make
    # every line of a 300-route file show up as changed.
    with open(OUT, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write(body)
    # Format with the repo's own formatter so a regeneration never shows up as a
    # lint failure - the generator has to agree with biome, not fight it.
    #
    # Two things went wrong with the old `npx biome ...` call:
    #
    #  1. npx is a .cmd on Windows, which CreateProcess will not run without a
    #     shell, so it raised FileNotFoundError AFTER the file was written - a
    #     traceback on top of a half-done job.
    #  2. With node_modules absent, `npx biome` does not fail. It fetches the
    #     unrelated public package named `biome` (0.3.3, not @biomejs/biome) and
    #     runs THAT - exit 0, no formatting, and a stranger's code executed.
    #
    # So: run the repo's own installed binary by path, and if it is not there,
    # say so instead of reaching for whatever the registry hands back.
    bin_dir = os.path.join(ROOT, 'node_modules', '.bin')
    biome = os.path.join(bin_dir, 'biome.cmd' if sys.platform == 'win32' else 'biome')
    if os.path.exists(biome):
        fmt = subprocess.run([biome, 'format', '--write', OUT], cwd=ROOT, capture_output=True)
        if fmt.returncode != 0:
            print(f'  WARNING: biome format exited {fmt.returncode} - '
                  'the file is written but unformatted')
    else:
        print('  WARNING: @biomejs/biome is not installed (run `npm install`); '
              'the file is written but UNFORMATTED - format it before committing')

    by_auth = {}
    for r in routes:
        by_auth[r['auth']] = by_auth.get(r['auth'], 0) + 1
    flagged = sum(1 for r in routes if r['review'])
    ok = sum(1 for r in routes if r['reviewed'])
    print(f'wrote {OUT}: {len(routes)} routes')
    print('  ' + '  '.join(f'{k}={v}' for k, v in sorted(by_auth.items())))
    print(f'  NEEDS REVIEW (public + service-role, unreviewed): {flagged}')
    print(f'  reviewed-and-intentional: {ok}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
