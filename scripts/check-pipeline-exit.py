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


_HEREDOC = re.compile(r"<<-?\s*[\'\"]?([A-Za-z_][A-Za-z0-9_]*)[\'\"]?")


def _strip_heredocs(command: str) -> str:
    """Blank out heredoc BODIES before scanning.

    A heredoc payload is data, not shell - it is routinely Python, SQL, Markdown
    or prose. On 2026-08-21 this check blocked a python patch script because its
    own comments mentioned a status read next to a pipe character in a sentence.

    Bodies are replaced with empty lines rather than removed, so reported line
    numbers still match the command the author wrote.
    """
    out, marker = [], None
    for line in command.split("\n"):
        if marker is None:
            out.append(line)
            m = _HEREDOC.search(line)
            if m:
                marker = m.group(1)
            continue
        out.append("")
        if line.strip() == marker:
            out[-1] = line
            marker = None
    return "\n".join(out)


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


def _segments(line: str) -> list[str]:
    """Split a line into command segments on `;`, `&&` and `||`, outside quotes.

    Segments are RAW (not quote-stripped) because a status read can sit inside a
    quoted string. Command substitution is not parsed - a `;` inside `$( )` will
    over-split, which yields a false NEGATIVE, the safe direction to be wrong in
    for a check that can block a command.
    """
    out, buf, quote, i = [], [], None, 0
    while i < len(line):
        ch = line[i]
        if quote:
            buf.append(ch)
            if ch == quote:
                quote = None
            i += 1
            continue
        if ch in ("'", '"'):
            quote = ch
            buf.append(ch)
            i += 1
            continue
        if ch == ";":
            out.append("".join(buf))
            buf = []
            i += 1
            continue
        if line[i:i + 2] in ("&&", "||"):
            out.append("".join(buf))
            buf = []
            i += 2
            continue
        buf.append(ch)
        i += 1
    out.append("".join(buf))
    return out


def _owning_segment(line: str) -> "str | None":
    """The command whose status the read will actually receive, if it is on THIS
    line.

    A redirect-then-check on one line reads that command's status, so a pipeline
    on the line above is irrelevant. Returns None when the read has no same-line
    command before it, in which case the caller falls back to the previous-line
    lookback.
    """
    segs = _segments(line)
    idx = None
    for i, seg in enumerate(segs):
        if '$?' in seg:
            idx = i
            break
    if idx is None:
        return None
    for prev in reversed(segs[:idx]):
        if prev.strip():
            return prev
    return None


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

    # Heredoc bodies are payload, not shell. Scanning them produced a false
    # positive on 2026-08-21 against a python script whose comments happened to
    # contain both a pipe character and a status read.
    lines = _strip_heredocs(command).split("\n")
    hits: list[tuple[int, str]] = []
    for i, line in enumerate(lines):
        if not reads_status(line):
            continue
        # A command earlier on the SAME line owns the status. Two false
        # positives on 2026-08-21 came from skipping this, and one of them
        # blocked the exact redirect-then-check shape this tool's own ADVICE
        # recommends - the clearest possible sign the check was wrong rather
        # than the author.
        owner = _owning_segment(line)
        if owner is not None:
            if has_pipe(owner):
                hits.append((i + 1, line.strip()))
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
