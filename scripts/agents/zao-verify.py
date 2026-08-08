#!/usr/bin/env python3
"""zao-verify - the authoritative answer, faster than the wrong one.

    zao-verify dep grammy          what version is ACTUALLY installed
    zao-verify wired heart-canary  what actually imports it
    zao-verify flag ZOE_GUARDRAILS what value the code actually accepts
    zao-verify exists publish      what already exists before you build it
    zao-verify env                 is the toolchain even installed

WHY THIS EXISTS
---------------
On 2026-08-07 I made eight wrong statements about this repo's own state. Not
guesses about the world - claims about files sitting on the disk. Zaal:
"There's a lot of times u say correction, saying it's built."

`confirm-before-claiming-absence.md` already existed and told me to verify. It
did not help, and the reason it did not help is the whole design of this tool:

    EVERY WRONG ANSWER CAME FROM A PROXY THAT WAS CHEAPER TO REACH
    THAN THE TRUTH.

  claim                          I read                  truth was in
  -----------------------------  ----------------------  ----------------------
  "we're on grammy ^1.29.0"      package.json range      package-lock.json
  "21 files can't find grammy"   tsc output              an empty node_modules
  "3 pre-existing test failures" test output             the same empty dir
  "Heart's only consumer is a
   canary"                       the canary file itself  a grep for call sites
  "seven things to build"        my sense of the repo    the code
  "boot-verify passed"           esbuild's exit code     which commit it checked
  "no new typecheck errors"      a diff vs a baseline    whether that baseline
                                                         was still current
  flags set to `true`            the assumption that
                                 true means true         the `=== '1'` in code

package.json was already in context; the lockfile was one more read. tsc
volunteered 183 errors; nobody asks an empty directory whether it is empty. The
proxy always wins on effort, and it is usually right, which is what makes it
dangerous - it is wrong exactly when the answer matters.

So a rule saying "check the lockfile" loses to "package.json is already open".
The only fix that survives contact with a tired session is to make the
authoritative answer the CHEAPER one. That is this file.

EVERY ANSWER NAMES ITS SOURCE, so a claim can carry it: not "we're on 1.42.0" but
"package-lock.json pins 1.42.0". A sourced claim is checkable by the reader; an
unsourced one has to be trusted.
"""
import argparse
import json
import os
import re
import subprocess
import sys

ROOT = subprocess.check_output(['git', 'rev-parse', '--show-toplevel'], text=True).strip()


def say(source: str, answer: str) -> None:
    """One answer, one source. The source is not decoration - it is the point."""
    print(f'  {answer}')
    print(f'  source: {source}')


def cmd_dep(name: str) -> int:
    """What is ACTUALLY installed - not what a caret range permits."""
    found = False
    for area in ('.', 'bot'):
        lock = os.path.join(ROOT, area, 'package-lock.json')
        pkg = os.path.join(ROOT, area, 'package.json')
        if not os.path.exists(lock):
            continue
        label = area if area != '.' else 'root'

        declared = None
        if os.path.exists(pkg):
            p = json.load(open(pkg, encoding='utf-8'))
            declared = (p.get('dependencies', {}) or {}).get(name) or \
                       (p.get('devDependencies', {}) or {}).get(name)

        pinned = None
        d = json.load(open(lock, encoding='utf-8'))
        for k, v in (d.get('packages') or {}).items():
            if k.endswith(f'node_modules/{name}'):
                pinned = v.get('version')
                break

        on_disk = None
        disk_pkg = os.path.join(ROOT, area, 'node_modules', name, 'package.json')
        if os.path.exists(disk_pkg):
            on_disk = json.load(open(disk_pkg, encoding='utf-8')).get('version')

        if declared is None and pinned is None:
            continue
        found = True
        print(f'\n[{label}]')
        print(f'  package.json declares : {declared or "-"}   <- a RANGE, not a version')
        print(f'  package-lock.json pins: {pinned or "-"}   <- what npm ci installs')
        print(f'  actually on disk      : {on_disk or "NOT INSTALLED"}')
        if pinned and on_disk and pinned != on_disk:
            print('  MISMATCH: disk differs from the lockfile - run npm ci')
        if pinned and not on_disk:
            print('  NOT INSTALLED HERE: any tsc/test output about this package is FICTION')
    if not found:
        print(f'  {name}: not declared in any package.json under {ROOT}')
    return 0


def _ts_files(base: str):
    for root, dirs, files in os.walk(base):
        dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', 'dist', 'out')]
        for fn in files:
            if fn.endswith(('.ts', '.tsx', '.js')):
                yield os.path.join(root, fn)


def cmd_wired(stem: str) -> int:
    """Who imports it - excluding itself and its own tests.

    "It exists" and "anything uses it" are different questions, and the file
    itself cannot answer the second one.
    """
    exists, callers, tests = [], [], []
    for base in (os.path.join(ROOT, 'bot', 'src'), os.path.join(ROOT, 'src'),
                 os.path.join(ROOT, 'packages')):
        if not os.path.isdir(base):
            continue
        for p in _ts_files(base):
            rel = os.path.relpath(p, ROOT)
            if os.path.basename(p).rsplit('.', 1)[0] == stem:
                exists.append(rel)
                continue
            try:
                src = open(p, encoding='utf-8', errors='ignore').read()
            except OSError:
                continue
            if re.search(rf"""from ['"][^'"]*{re.escape(stem)}['"]""", src) or \
               re.search(rf"""require\(['"][^'"]*{re.escape(stem)}['"]\)""", src):
                (tests if '__tests__' in rel or '.test.' in rel else callers).append(rel)

    if not exists:
        say('filesystem walk of bot/src, src, packages', f'{stem}: DOES NOT EXIST')
        return 0
    print(f'\n  defined in : {", ".join(exists)}')
    print(f'  imported by: {", ".join(callers) if callers else "NOTHING (not wired)"}')
    print(f'  tests      : {len(tests)}')
    if not callers:
        print('\n  built but unwired. That can be deliberate (a reviewed wiring step)')
        print('  or an orphan - the code cannot tell you which. Read its header.')
    say('import/require scan excluding the module itself and its tests', '')
    return 0


def cmd_flag(name: str) -> int:
    """What value does the code accept? `true` is not universally true."""
    hits = []
    for base in (os.path.join(ROOT, 'bot', 'src'), os.path.join(ROOT, 'src')):
        if not os.path.isdir(base):
            continue
        for p in _ts_files(base):
            try:
                src = open(p, encoding='utf-8', errors='ignore').read()
            except OSError:
                continue
            if f'process.env.{name}' not in src:
                continue
            rel = os.path.relpath(p, ROOT)
            for m in re.finditer(
                    rf"process\.env\.{re.escape(name)}\s*(===|!==|\?\?)\s*'?([^'\s;)&|]*)'?", src):
                hits.append((rel, m.group(1), m.group(2)))
            if not any(h[0] == rel for h in hits):
                hits.append((rel, 'read', '(no direct comparison)'))
    if not hits:
        say('grep of bot/src and src', f'{name}: not referenced anywhere')
        return 0
    print()
    for rel, op, lit in hits:
        if op == '===':
            print(f'  ENABLED WHEN the value is exactly "{lit}"   ({rel})')
        elif op == '!==':
            print(f'  guard: `!== "{lit}"` - usually an early return, so it REQUIRES "{lit}"   ({rel})')
        else:
            print(f'  {op} {lit}   ({rel})')
    print('\n  Setting a different truthy string leaves it OFF while looking ON.')
    say('the comparison in the source, not an assumption about truthiness', '')
    return 0


def cmd_exists(term: str) -> int:
    """Before building: what already covers this?

    Seven proposals in one week already existed. This is the ten-second check
    that would have caught all seven.
    """
    t = term.lower()
    routes, mods, docs = [], [], []
    api = os.path.join(ROOT, 'src', 'app', 'api')
    if os.path.isdir(api):
        for root, dirs, files in os.walk(api):
            dirs[:] = [d for d in dirs if d != '__tests__']
            if 'route.ts' in files and t in root.lower():
                routes.append(os.path.relpath(root, os.path.join(ROOT, 'src', 'app')))
    for base in (os.path.join(ROOT, 'bot', 'src'), os.path.join(ROOT, 'src', 'lib')):
        if not os.path.isdir(base):
            continue
        for p in _ts_files(base):
            if t in os.path.basename(p).lower():
                mods.append(os.path.relpath(p, ROOT))
    research = os.path.join(ROOT, 'research')
    if os.path.isdir(research):
        for d in os.listdir(research):
            sub = os.path.join(research, d)
            if not os.path.isdir(sub):
                continue
            for e in os.listdir(sub):
                if t in e.lower():
                    docs.append(f'research/{d}/{e}')

    print(f'\n  API routes matching "{term}" : {len(routes)}')
    for r in routes[:8]:
        print(f'    {r}')
    print(f'  modules matching             : {len(mods)}')
    for m in mods[:8]:
        print(f'    {m}')
    print(f'  research docs matching       : {len(docs)}')
    for d in docs[:6]:
        print(f'    {d}')
    if routes or mods or docs:
        print('\n  Something already covers this. Extend it rather than adding a second.')
    say('filesystem scan of src/app/api, bot/src, src/lib and research/', '')
    return 0


def cmd_env() -> int:
    """Is the toolchain even installed? Ask BEFORE believing any tool's output."""
    print()
    ok = True
    for area in ('.', 'bot'):
        nm = os.path.join(ROOT, area, 'node_modules')
        label = area if area != '.' else 'root'
        if not os.path.isdir(nm):
            print(f'  {label:<6} node_modules: MISSING')
            ok = False
            continue
        n = len([x for x in os.listdir(nm) if not x.startswith('.')])
        flag = '' if n else '   <- EMPTY: tsc/test output from here is FICTION'
        print(f'  {label:<6} node_modules: {n} packages{flag}')
        if not n:
            ok = False
    print('\n  ' + ('toolchain present - tool output can be trusted'
                    if ok else 'run npm install before believing any tsc or test result'))
    say('directory listing, not a tool report', '')
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description='Answer state questions from the authoritative source.')
    sub = ap.add_subparsers(dest='cmd', required=True)
    for name, helptext in (
        ('dep', 'what version is actually installed'),
        ('wired', 'what actually imports this module'),
        ('flag', 'what value does the code accept'),
        ('exists', 'what already covers this before you build it'),
    ):
        s = sub.add_parser(name, help=helptext)
        s.add_argument('name')
    sub.add_parser('env', help='is the toolchain installed at all')

    a = ap.parse_args()
    return {
        'dep': lambda: cmd_dep(a.name),
        'wired': lambda: cmd_wired(a.name),
        'flag': lambda: cmd_flag(a.name),
        'exists': lambda: cmd_exists(a.name),
        'env': cmd_env,
    }[a.cmd]()


if __name__ == '__main__':
    sys.exit(main())
