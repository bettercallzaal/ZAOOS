#!/usr/bin/env python3
"""zao-loop-health - catch a stalled loop within the hour, not the week.

WHY. Seventeen cheap-loop lanes on the VPS ran roughly 1,200 no-op ticks across
THREE DAYS and produced nothing. Every tick printed a confident message that was
wrong about both of its claims, so nobody looked. The loops were fail-closed and
spent nothing - the design worked - but three days of intended work simply did
not happen, and the only way to find out was to read a tmux pane by hand.

Zaal: "we should be checking in at least once an hour on some of these
processes, i dont want them stalled out, thats the worst since its wasted time."

WHAT COUNTS AS STALLED. Not "erroring" - a loop can error loudly and be fine.
Stalled means PRODUCING NOTHING: no new file in the output directory within the
window, while the loop is still being invoked. Wasted wall-clock is the thing
being measured, because that is the thing Zaal is paying for.

WHAT IT WILL NOT DO. It will not tell you the same thing every hour. It
fingerprints the set of stalled loops and speaks only when that set CHANGES, so
"still broken" is silent and "a new one broke" is loud. A check that fires every
hour is one nobody reads (noisy-signal-guard.md), and this exists precisely
because a message nobody read cost three days.

FAIL CLOSED. If the output directory is missing, or no loop has ever produced
anything, that is reported as CANNOT ASSESS - never as healthy. An empty
measurement is not a clean bill of health; that conflation is the whole family
of bug this repo has been finding all week.

USAGE
  zao-loop-health              # notify only on change; exit 1 if anything stalled
  zao-loop-health --report     # always print the full picture
  zao-loop-health --hours N    # staleness window (default 3)
"""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
import time
from pathlib import Path

OUT_DIR = Path.home() / "cheap-loop-out"
FAILURES = Path.home() / ".zao" / "loop-failures.jsonl"
STATE = Path.home() / ".zao" / "loop-health-state.json"
NOTIFY = Path.home() / "bin" / "zao-notify.sh"


def sh(cmd: list[str], timeout: int = 20) -> tuple[int, str]:
    try:
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return p.returncode, p.stdout
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return 1, ""


# A pane started as a bare login shell is a LANE SLOT waiting for someone to
# attach, not a loop. Doc 2282 measured 17 of the VPS's 20 sessions in that
# state; every one was reported "stalled" on every run, forever, because they
# hold stale files in cheap-loop-out from whenever a loop last ran there.
#
# A count that can never reach zero is a count nobody reads - which is why
# "17 loop(s) stalled" sat in the log unexamined while the one genuinely broken
# pipeline went unnoticed for five days (noisy-signal-guard.md).
IDLE_SHELL_STARTS = {"bash -l", "bash", "-bash", "zsh", "-zsh", "sh", "login"}


def loop_lanes() -> list[str]:
    """tmux sessions actually running a loop. Raises nothing - empty means unknown.

    Excludes idle lane slots. The test is the pane's START command, not its
    current one: a real loop launched as `sh -c "node thing.js"` reports its
    current command as `sh`, so filtering on that would drop live loops.
    """
    rc, out = sh(["tmux", "ls", "-F", "#{session_name}"])
    if rc != 0:
        return []
    names = [l.strip() for l in out.splitlines() if l.strip()]

    rc2, panes = sh(["tmux", "list-panes", "-a", "-F", "#{session_name}\t#{pane_start_command}"])
    if rc2 != 0:
        # Cannot tell slots from loops. Return everything rather than silently
        # narrowing - over-reporting is recoverable, a blind spot is not.
        return names

    idle: set[str] = set()
    for line in panes.splitlines():
        if "\t" not in line:
            continue
        sess, start = line.split("\t", 1)
        if start.strip().strip('"').strip() in IDLE_SHELL_STARTS:
            idle.add(sess.strip())

    return [n for n in names if n not in idle]


def last_output(loop: str) -> float | None:
    """mtime of the newest file this loop produced, or None if it never has."""
    if not OUT_DIR.is_dir():
        return None
    files = list(OUT_DIR.glob(f"{loop}-*"))
    return max((f.stat().st_mtime for f in files), default=None)


def recent_failures(since: float) -> dict[str, str]:
    """loop -> most recent failure reason, from the trail cheap-loop.sh writes."""
    if not FAILURES.is_file():
        return {}
    out: dict[str, str] = {}
    try:
        for line in FAILURES.read_text(errors="ignore").splitlines()[-400:]:
            try:
                d = json.loads(line)
            except json.JSONDecodeError:
                continue
            if d.get("ts", 0) < since:
                continue
            why = d.get("primary") or d.get("fallback") or "no reason recorded"
            out[d.get("loop", "?")] = why
    except OSError:
        pass
    return out


def main() -> int:
    ap = argparse.ArgumentParser(prog="zao-loop-health")
    ap.add_argument("--report", action="store_true")
    ap.add_argument("--hours", type=float, default=3.0)
    args = ap.parse_args()

    now = time.time()
    window = args.hours * 3600
    lanes = loop_lanes()

    if not lanes:
        # Blind, not calm. Say so.
        msg = "CANNOT ASSESS loops: tmux returned no sessions (not running, or not on PATH)"
        print(msg, file=sys.stderr)
        return 1

    if not OUT_DIR.is_dir():
        msg = f"CANNOT ASSESS loops: {OUT_DIR} does not exist - no loop has ever produced output"
        print(msg, file=sys.stderr)
        if NOTIFY.exists():
            sh([str(NOTIFY), f"loop health: {msg}", "with", "title", "ZAO loops"], timeout=15)
        return 1

    fails = recent_failures(now - window)

    stalled: list[tuple[str, str, str]] = []   # (loop, age, reason)
    healthy: list[tuple[str, str]] = []
    never: list[str] = []

    for lane in lanes:
        ts = last_output(lane)
        if ts is None:
            # Never produced anything. Only interesting if it is genuinely a
            # loop - a lane with a failure trail proves it is one.
            if lane in fails:
                never.append(lane)
            continue
        age = now - ts
        age_s = f"{int(age//3600)}h" if age >= 3600 else f"{int(age//60)}m"
        if age > window:
            stalled.append((lane, age_s, fails.get(lane, "no failure recorded - check the pane")))
        else:
            healthy.append((lane, age_s))

    problems = stalled + [(l, "never", fails.get(l, "")) for l in never]

    if args.report:
        print(f"\nloop health - {len(lanes)} lanes, window {args.hours}h\n")
        if healthy:
            print(f"  PRODUCING ({len(healthy)})")
            for l, a in sorted(healthy):
                print(f"    {l:<14} last output {a} ago")
        if stalled:
            print(f"\n  STALLED ({len(stalled)}) - invoked but producing nothing")
            for l, a, why in sorted(stalled):
                print(f"    {l:<14} last output {a} ago")
                print(f"      {why[:150]}")
        if never:
            print(f"\n  NEVER PRODUCED ({len(never)})")
            for l in sorted(never):
                print(f"    {l:<14} {fails.get(l,'')[:130]}")
        if not problems:
            print("  nothing stalled")
        print()

    if not problems:
        STATE.write_text(json.dumps({"fingerprint": "clean"}))
        return 0

    names = sorted(l for l, *_ in problems)
    fp = hashlib.sha256(",".join(names).encode()).hexdigest()[:16]
    try:
        prev = json.loads(STATE.read_text()).get("fingerprint")
    except (OSError, json.JSONDecodeError):
        prev = None
    STATE.parent.mkdir(parents=True, exist_ok=True)
    STATE.write_text(json.dumps({"fingerprint": fp, "stalled": names}))

    if prev == fp and not args.report:
        return 1  # same set as last hour; already said

    # One representative reason - the cause is nearly always shared.
    why = next((w for _, _, w in problems if w), "")
    body = f"{len(names)} loop(s) stalled: {', '.join(names[:6])}"
    if len(names) > 6:
        body += f" +{len(names)-6}"
    if why:
        body += f"\n{why[:200]}"

    print(body)
    if NOTIFY.exists() and not args.report:
        sh([str(NOTIFY), f"loop health: {body}", "with", "title", "ZAO loops"], timeout=15)
    return 1


if __name__ == "__main__":
    sys.exit(main())
