#!/usr/bin/env python3
"""zoe-liveness - is this feature actually RUNNING, or just merged?

    python3 scripts/agents/zoe-liveness.py            # local view
    python3 scripts/agents/zoe-liveness.py --remote   # + what is live on the VPS

WHY THIS EXISTS
---------------
Zaal, 2026-08-07: "There's a lot of times u say correction, saying it's built. I
feel like visibility is a big challenge."

He was right, and every correction that day was the SAME mistake wearing a
different hat: reading an artifact that looked authoritative and was not.

  - "we're on grammy ^1.29.0"      -> that is the package.json RANGE. The lockfile
                                      pinned 1.42.0. Ranges tell you a floor.
  - "21 files can't find grammy"   -> node_modules was EMPTY on that machine. The
                                      repo was fine; CI was green the whole time.
  - "the Heart's only consumer is
     a canary"                     -> scheduler.ts had carried a real consumer for
                                      weeks. Existence of a canary is not absence
                                      of anything else.
  - "seven things we should build" -> all seven already existed.

The root cause is that a ZOE feature has FOUR independent states, and only the
first is visible from the code:

    BUILT     the module exists                     (ls)
    WIRED     something outside its own file and
              its tests calls it                    (grep for call sites)
    FLAGGED   an env flag gates it, and that flag
              has a default                         (grep process.env)
    LIVE      that flag is actually set on the
              running host, on the deployed commit  (only the host knows)

A feature is REAL only when all four are true. "Merged" is not "running", and the
gap between them is where a whole day of wrong statements came from.

This script answers all four in one place so the answer is a lookup, not a guess.

SECURITY: env VALUES are never read, printed, or transmitted - only whether a NAME
is present. Flag names are not secrets; the tokens next to them are.
"""
import argparse
import json
import os
import re
import subprocess
import sys

ROOT = subprocess.check_output(['git', 'rev-parse', '--show-toplevel'], text=True).strip()
BOT_SRC = os.path.join(ROOT, 'bot', 'src')

# Flags that switch BEHAVIOUR on and off. Deliberately not every env var: tokens,
# model names, paths and numeric caps are configuration, and listing them here
# would bury the dozen that actually answer "is this feature on?" - which is the
# same crying-wolf failure noisy-signal-guard.md is about.
BEHAVIOUR_FLAGS = {
    'ZOE_DM_BUILD': 'build from a Telegram DM',
    'ZOE_GUARDRAILS': 'concierge input/output guardrails',
    'ZOE_MEMORY_GIT': 'commit-per-edit memory versioning',
    'ZOE_MISSION_CONTROL': 'pinned mission-control message',
    'ZOE_HEART_FLEET_CANARY': 'Heart lease canary',
    'ZOE_REPO_IMPROVER_LEASES': 'repo-improver under a Heart lease',
    'ZOE_LOOP_LEASES': 'work-loop + orchestrator under Heart leases',
    'ZOE_ORCHESTRATOR_ENABLED': 'the orchestrator tick at all',
    'ZOE_OUTBOX_DEMO': 'transactional-outbox demo beat',
    'ZOE_CRITIC_PANEL': 'multi-critic panel',
    'ZOE_CROSS_FAMILY_VERIFY': 'cross-family verification',
    'ZOE_RELAY_TG_ENABLED': 'Telegram relay',
    'ZOE_USE_CLI': 'Claude CLI path for the concierge',
    'ZOE_NUDGE_LADDER': 'escalating nudge ladder',
    'ZOE_TASK_COMPLEXITY_ROUTING': 'complexity-based model routing',
}


def ts_files():
    for root, dirs, files in os.walk(BOT_SRC):
        dirs[:] = [d for d in dirs if d not in ('node_modules',)]
        for fn in files:
            if fn.endswith('.ts'):
                yield os.path.join(root, fn)


def read(p):
    try:
        return open(p, encoding='utf-8', errors='ignore').read()
    except OSError:
        return ''


def flag_sites():
    """Which file(s) read each behaviour flag, and what the default is."""
    out = {f: {'files': [], 'default_on': None, 'expects': None} for f in BEHAVIOUR_FLAGS}
    for p in ts_files():
        if '__tests__' in p:
            continue
        src = read(p)
        rel = p.replace(BOT_SRC + '/', '')
        for flag in BEHAVIOUR_FLAGS:
            if f'process.env.{flag}' not in src:
                continue
            out[flag]['files'].append(rel)
            # A flag compared to a truthy literal is OFF unless set. One compared
            # with !== 'false' / ?? true is ON unless explicitly disabled - and
            # that distinction decides whether merging changed prod.
            if re.search(rf"process\.env\.{flag}\s*!==\s*'false'", src) or \
               re.search(rf"process\.env\.{flag}\s*\?\?\s*true", src):
                out[flag]['default_on'] = True
            elif out[flag]['default_on'] is None:
                out[flag]['default_on'] = False

            # WHICH literal does the code compare against? This matters more than
            # it looks. On 2026-08-07 five flags were switched on by writing
            # `true` to all of them - but three compare `=== '1'`, so guardrails,
            # memory-git and mission-control sat there LOOKING enabled and doing
            # nothing. A flag set to the wrong value is worse than an unset one,
            # because it reads as done. The first version of this script reported
            # them all as `set`, which is the same failure it exists to catch,
            # one level down.
            m = re.search(rf"process\.env\.{flag}\s*===\s*'([^']*)'", src)
            if m and not out[flag]['expects']:
                out[flag]['expects'] = m.group(1)
            m2 = re.search(rf"process\.env\.{flag}\s*!==\s*'([^']*)'", src)
            if m2 and not out[flag]['expects']:
                lit = m2.group(1)
                # `!==` cuts BOTH ways and the direction is what matters.
                #   if (env !== '1') return;      -> the flag REQUIRES '1'
                #   if (env !== 'false') enable;  -> on unless explicitly disabled
                # The early-return guard is by far the commoner shape here, so a
                # truthy literal means "this exact value is required" - reading it
                # as an exclusion is how ZOE_MISSION_CONTROL got rendered as
                # needing anything-but-1, which is the opposite of the truth.
                if lit in ('false', '0', 'off', 'no'):
                    out[flag]['expects'] = f'!{lit}'
                    out[flag]['default_on'] = True
                else:
                    out[flag]['expects'] = lit
    return out


def wired(module_stem: str) -> list:
    """Files that import a module, excluding itself and its tests. This is the
    difference between 'the code exists' and 'anything calls it'."""
    hits = []
    for p in ts_files():
        rel = p.replace(BOT_SRC + '/', '')
        if rel.endswith(f'{module_stem}.ts') or '__tests__' in rel:
            continue
        src = read(p)
        if re.search(rf"from '\.{{1,2}}/[^']*{re.escape(module_stem)}'", src):
            hits.append(rel)
    return hits


def git(*args, cwd=ROOT):
    try:
        return subprocess.check_output(['git', *args], cwd=cwd, text=True,
                                       stderr=subprocess.DEVNULL).strip()
    except Exception:
        return ''


def remote_state(expectations=None):
    """Ask the live host what it is actually running.

    Flag VALUES never leave the host. The expected literal is sent TO the box, the
    comparison happens THERE, and only a verdict comes back (ok / MISMATCH). That
    keeps the original security property - this script never transmits, prints or
    stores an env value - while still answering the question that actually
    matters, which is not "is it set" but "is it set to something that works".
    """
    checks = ''
    for flag, want in (expectations or {}).items():
        if not want or want.startswith('!'):
            continue  # inverse-match flags are on unless explicitly disabled
        checks += (
            f'V=$(grep -m1 "^{flag}=" bot/.env 2>/dev/null | cut -d= -f2-); '
            f'if [ -z "$V" ]; then echo "CHK={flag}:unset"; '
            f'elif [ "$V" = "{want}" ]; then echo "CHK={flag}:ok"; '
            f'else echo "CHK={flag}:MISMATCH"; fi; '
        )
    script = (
        'cd ~/zao-bot-live 2>/dev/null || exit 1; '
        'echo "COMMIT=$(git rev-parse --short HEAD)"; '
        'git fetch origin main -q 2>/dev/null; '
        'echo "BEHIND=$(git rev-list --count HEAD..origin/main)"; '
        'echo "ACTIVE=$(systemctl --user is-active zoe-bot 2>/dev/null)"; '
        + checks +
        'cut -d= -f1 bot/.env 2>/dev/null | grep -E "^ZOE_|^ZAO_|^HEART_" | sort -u | sed "s/^/FLAG=/"'
    )
    try:
        out = subprocess.check_output(
            ['ssh', '-o', 'ConnectTimeout=15', '-o', 'BatchMode=yes', 'vps', script],
            text=True, stderr=subprocess.DEVNULL, timeout=60)
    except Exception as e:
        return {'error': str(e)[:80]}
    st = {'flags': set(), 'checks': {}}
    for line in out.splitlines():
        if line.startswith('CHK='):
            name, _, verdict = line[4:].partition(':')
            st['checks'][name] = verdict.strip()
        elif line.startswith('FLAG='):
            st['flags'].add(line[5:].strip())
        elif '=' in line:
            k, v = line.split('=', 1)
            st[k.lower()] = v.strip()
    return st


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--remote', action='store_true', help='also query the live VPS')
    ap.add_argument('--json', action='store_true')
    args = ap.parse_args()

    sites = flag_sites()
    remote = remote_state({f: sites[f]['expects'] for f in BEHAVIOUR_FLAGS}) if args.remote else None

    rows = []
    for flag, what in sorted(BEHAVIOUR_FLAGS.items()):
        info = sites[flag]
        built = len(info['files']) > 0
        if remote and 'error' not in remote:
            verdict = remote.get('checks', {}).get(flag)
            if verdict == 'ok':
                live = 'ON'
            elif verdict == 'MISMATCH':
                # Set, but to a value the code does not accept. This reads as
                # done and does nothing - the worst of both.
                live = 'WRONG VALUE'
            elif flag in remote['flags']:
                live = 'set'
            else:
                live = 'default-on' if info['default_on'] else 'OFF'
        else:
            live = '?'
        rows.append({
            'flag': flag, 'what': what, 'built': built,
            'default_on': bool(info['default_on']),
            'expects': info['expects'],
            'files': info['files'], 'live': live,
        })

    if args.json:
        print(json.dumps({'flags': rows, 'remote': {k: (sorted(v) if isinstance(v, set) else v)
                                                    for k, v in (remote or {}).items()}}, indent=2))
        return 0

    print('ZOE LIVENESS - built / wired / flagged / live\n')
    local = git('rev-parse', '--short', 'HEAD')
    print(f'repo HEAD: {local}')
    if remote:
        if 'error' in remote:
            print(f'live host: UNREACHABLE ({remote["error"]})')
        else:
            behind = remote.get('behind', '?')
            warn = '  <-- RUNNING OLD CODE' if behind not in ('0', '?') else ''
            print(f'live host: {remote.get("commit","?")}  behind={behind}{warn}  '
                  f'bot={remote.get("active","?")}')
    print()

    print(f'{"FLAG":<30} {"EXPECTS":<9} {"LIVE":<12} WHAT')
    print('-' * 96)
    wrong = 0
    for r in rows:
        state = r['live'] if r['built'] else 'NOT IN CODE'
        if state == 'WRONG VALUE':
            wrong += 1
        print(f'{r["flag"]:<30} {(r["expects"] or "-"):<9} {state:<12} {r["what"]}')
    if wrong:
        print(f'\n  {wrong} flag(s) are SET TO A VALUE THE CODE REJECTS - they look on and are off.')

    # The four-state check for the modules where I actually got it wrong.
    print('\nWIRING - does anything outside the module and its tests import it?')
    for stem in ('heart-canary', 'memory-git', 'mission-control', 'build-intent',
                 'dm-build-session', 'live-status', 'tick-lock', 'bus-bridge'):
        exists = any(p.endswith(f'{stem}.ts') for p in ts_files())
        callers = wired(stem)
        if not exists:
            print(f'  {stem:<20} NOT BUILT')
        elif not callers:
            print(f'  {stem:<20} built, NOT WIRED (nothing imports it)')
        else:
            print(f'  {stem:<20} wired <- {", ".join(callers[:3])}')

    if not args.remote:
        print('\n(run with --remote to see what is actually ON, and whether the '
              'live host is behind)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
