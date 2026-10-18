#!/usr/bin/env python3
"""radar-pick.py - choose the research doc the daily Research Radar revalidates.

The radar routine's own rule was "the README.md under research/*/* with the
OLDEST last-validated date". That rule has no memory. When a radar PR is closed
without merging, main never sees the new date, the doc stays oldest, and the
next run picks it again. Doc 694 was picked on 2026-10-15 (#3959, closed),
2026-10-16 (#3979, closed) and 2026-10-17 (#4001, merged). Card 10460.

The memory already exists: every run pushes a branch named
ws/radar-<docnum>-<YYYY-MM-DD>, and closing a PR does not delete it. So a doc
with a radar branch dated within --cooldown-days is skipped, and the next
oldest is picked. A doc with no last-validated line is not a candidate (as
before); the count is printed so it is not invisible.

Usage (from the repo root):
  python3 scripts/radar-pick.py                 # prints: <num> <path> <last-validated>
  python3 scripts/radar-pick.py --today 2026-10-18 --cooldown-days 14
  python3 scripts/radar-pick.py --branches-file F   # branch names, one per line, instead of ls-remote

Exit 0 with one line on stdout; exit 2 when nothing can be picked. Reasons go
to stderr. If the remote cannot be read, it says so on stderr and picks
without the cooldown, which is the old behaviour, rather than stopping the run.
"""
import argparse
import datetime as dt
import re
import subprocess
import sys
from pathlib import Path

LAST_VALIDATED = re.compile(r"^last-validated:\s*[\"']?(\d{4}-\d{2}-\d{2})[\"']?\s*$", re.M)
RADAR_BRANCH = re.compile(r"(?:^|/)ws/radar-([0-9]+[a-z]?)-(\d{4}-\d{2}-\d{2})$")
DOC_NUM = re.compile(r"^([0-9]+[a-z]?)-")


def candidates(root: Path):
    """(last_validated, path, docnum) for every research/<topic>/<doc>/README.md with a date."""
    rows, missing = [], 0
    for readme in sorted(root.glob("research/*/*/README.md")):
        m = LAST_VALIDATED.search(readme.read_text(encoding="utf-8", errors="replace"))
        if not m:
            missing += 1
            continue
        n = DOC_NUM.match(readme.parent.name)
        rows.append((m.group(1), readme.relative_to(root).as_posix(), n.group(1) if n else ""))
    return rows, missing


def recent_radar_docs(branches, today: dt.date, cooldown_days: int):
    """{docnum: newest branch date} for radar branches no older than the cooldown."""
    recent = {}
    for b in branches:
        m = RADAR_BRANCH.search(b.strip())
        if not m:
            continue
        try:
            day = dt.date.fromisoformat(m.group(2))
        except ValueError:
            continue
        if 0 <= (today - day).days <= cooldown_days:
            num = m.group(1).lstrip("0") or "0"
            recent[num] = max(recent.get(num, day), day)
    return recent


def remote_branches(root: Path):
    out = subprocess.run(
        ["git", "ls-remote", "--heads", "origin", "refs/heads/ws/radar-*"],
        cwd=root, capture_output=True, text=True, timeout=60,
    )
    if out.returncode != 0:
        return None
    return [line.split("\t", 1)[1] for line in out.stdout.splitlines() if "\t" in line]


def pick(rows, recent):
    """Oldest date first, then path; skip a doc number in the cooldown."""
    for date, path, num in sorted(rows):
        key = num.lstrip("0") or "0"
        if num and key in recent:
            print(f"skip doc {num} ({path}): radar branch {recent[key]} is in the cooldown", file=sys.stderr)
            continue
        return date, path, num
    return None


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".")
    ap.add_argument("--today", default=None)
    ap.add_argument("--cooldown-days", type=int, default=14)
    ap.add_argument("--branches-file", default=None)
    a = ap.parse_args(argv)

    root = Path(a.root).resolve()
    today = dt.date.fromisoformat(a.today) if a.today else dt.date.today()
    rows, missing = candidates(root)
    print(f"{len(rows)} docs carry last-validated; {missing} do not and are never picked", file=sys.stderr)
    if not rows:
        print("no research README carries last-validated: nothing to pick", file=sys.stderr)
        return 2

    if a.branches_file:
        branches = Path(a.branches_file).read_text(encoding="utf-8").splitlines()
    else:
        branches = remote_branches(root)
        if branches is None:
            print("WARNING: could not list origin radar branches; picking WITHOUT the cooldown", file=sys.stderr)
            branches = []
    chosen = pick(rows, recent_radar_docs(branches, today, a.cooldown_days))
    if not chosen:
        print("every dated doc is in the cooldown: nothing to pick", file=sys.stderr)
        return 2
    date, path, num = chosen
    print(f"{num or '-'} {path} {date}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
