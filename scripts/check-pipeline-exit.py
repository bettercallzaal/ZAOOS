#!/usr/bin/env python3
"""check-pipeline-exit.py - catch `$?` being read after a pipeline.

WHY THIS EXISTS AS CODE AND NOT A RULE. `.claude/rules/silent-failure-guard.md`
rule 1 already says this in plain English: "A pipeline's exit is the LAST
command's. `curl | tee` reports `tee`." The rule was written on 2026-07-27 after
a cron job reported success for seven weeks while 503ing every run.

On 2026-08-09 the same bug happened THREE more times in one day, on two machines:

  1. `~/bin/lane-send cowork probe 2>&1 | sed 's/^/  /'; echo "exit=$?"`
     reported sed's status, so a refused send looked like a success.
  2. A staged secret scan, `git diff --cached | grep -inE '...' | head -5`,
     whose reported exit came from `head` - the scan could not have failed loudly.
  3. The Windows desktop read `ssh ansuz ... | tail` as exit 0 and reported SSH
     reachable. It was not; the host never authenticated.

Three recurrences of a documented rule means the rule is not the mechanism.
This is the mechanism.

WHAT IT DOES NOT DO. It does not flag pipelines. Piping into `head`, `tail`,
`sed`, or `jq` is normal and correct almost every time, and a check that fires on
the normal case is one people learn to ignore (`.claude/rules/noisy-signal-guard.md`).
It flags exactly one shape: reading `$?` when the status you get is a pipeline's
last stage, with neither `pipefail` nor `PIPESTATUS` in sight.

USAGE
  check-pipeline-exit.py --command '<shell text>'   # exit 2 if the shape is found
  check-pipeline-exit.py --hook                     # reads Claude Code hook JSON on stdin
  check-pipeline-exit.py --scan <file> [...]        # lint committed shell scripts
"""
from __future__ import annotations

import argparse
import json
import re
import sys

# `pipefail` makes a pipeline report the rightmost failure, and PIPESTATUS reads
# a specific stage. Either one means the author already thought about this.
SAFE_MARKERS = ("pipefail", "PIPESTATUS")

# A real pipe, not `||`. Also skip `|&`, which is bash's stderr-pipe shorthand
# but still a pipe - we WANT that flagged, so only `||` is excluded.
_PIPE = re.compile(r"(?<!\|)\|(?!\|)")


def _strip_quoted(line: str) -> str:
    """Remove quoted spans so a literal '|' inside a string is not read as a pipe.

    Deliberately simple: this is a heuristic guard, not a shell parser. It errs
    toward removing too much, which produces false NEGATIVES (a missed warning)
    rather than false POSITIVES (a bogus block). Given the check can block a
    command, being quiet when unsure is the correct direction to be wrong in.
    """
    out, quote = [], None
    for ch in line:
        if quote:
            if ch == quote:
                quote = None
            continue
        if ch in ("'", '"'):
            quote = ch
            continue
        out.append(ch)
    return "".join(out)


def has_pipe(line: str) -> bool:
    return bool(_PIPE.search(_strip_quoted(line)))


def reads_status(line: str) -> bool:
    """Does this line read `$?` - directly, or via ${PIPESTATUS[0]}-less checks."""
    return "$?" in _strip_quoted(line) or "$?" in line


def check(command: str) -> list[tuple[int, str]]:
    """Return [(line_number, line)] for each unsafe read of `$?`.

    A hit needs BOTH, within one logical step:
      - `$?` is read, and
      - the status it will receive comes from a pipeline - either the same line
        pipes, or the closest preceding non-empty line does.
    """
    if any(marker in command for marker in SAFE_MARKERS):
        return []

    lines = command.split("\n")
    hits: list[tuple[int, str]] = []
    for i, line in enumerate(lines):
        if not reads_status(line):
            continue
        if has_pipe(line):
            hits.append((i + 1, line.strip()))
            continue
        # `cmd | head` on one line, `echo $?` on the next is the same bug spread
        # over two lines - which is exactly how it was written all three times.
        for prev in reversed(lines[:i]):
            if prev.strip():
                if has_pipe(prev):
                    hits.append((i + 1, line.strip()))
                break
    return hits


ADVICE = """The status you read there is the LAST stage of the pipeline, not the command you care about.

  grep -q PATTERN file | head        -> $? is head's, which basically always succeeds

Three ways out, best first:
  1. Do not pipe when you need the status. Redirect to a file, check the status,
     then read the file:   cmd > /tmp/out; rc=$?;  head /tmp/out
  2. Read the stage you mean:        cmd | head;  rc=${PIPESTATUS[0]}
  3. Turn on pipefail for the script: set -o pipefail

See .claude/rules/silent-failure-guard.md rule 1."""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--command")
    ap.add_argument("--hook", action="store_true")
    ap.add_argument("--scan", nargs="*")
    args = ap.parse_args()

    if args.scan:
        bad = 0
        for path in args.scan:
            try:
                with open(path, encoding="utf-8", errors="ignore") as fh:
                    text = fh.read()
            except OSError:
                continue
            for lineno, line in check(text):
                bad += 1
                print(f"{path}:{lineno}: reads $? after a pipeline: {line}")
        if bad:
            print(f"\n{bad} unsafe status read(s).\n{ADVICE}", file=sys.stderr)
            return 1
        return 0

    command = args.command
    if args.hook:
        try:
            payload = json.load(sys.stdin)
        except (json.JSONDecodeError, ValueError):
            return 0  # unparseable hook input must never block real work
        command = (payload.get("tool_input") or {}).get("command", "")

    if not command:
        return 0

    hits = check(command)
    if not hits:
        return 0

    lines = "\n".join(f"  line {n}: {t}" for n, t in hits)
    # Exit 2 is Claude Code's "block and show stderr to the model" contract. This
    # blocks rather than warns because the failure mode is a SILENT wrong answer:
    # the command appears to succeed, so a warning would be read after the wrong
    # conclusion was already drawn.
    print(f"Reading $? after a pipeline:\n{lines}\n\n{ADVICE}", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())
