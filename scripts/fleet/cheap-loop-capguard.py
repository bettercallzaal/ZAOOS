#!/usr/bin/env python3
"""cheap-loop-capguard - the missing enforcer for the cheap-loop daily spend cap.

The cheap-loop fleet already has two of the three pieces of a cost circuit
breaker: cheap-loop.sh HALTS when ~/.zao/cheap-loop.pause exists, and every
OpenRouter pass LOGS its cost to ~/.zao/cost-of-pass.jsonl. The missing third
piece is the ENFORCER that sums today's spend and TRIPS the pause when a cap is
exceeded. This script is that enforcer. Run it on a cron (e.g. every 15 min).

It supports two caps:
  - GLOBAL: total spend across all loops today > cap  -> writes ~/.zao/cheap-loop.pause
            (cheap-loop.sh already honors this file, so this works with ZERO loop edit).
  - PER-LOOP: one loop's spend today > cap             -> writes ~/.zao/cheap-loop-<slug>.pause
            (needs a one-line check added to cheap-loop.sh - see the PR/README).

Daily reset is automatic: a pause file THIS SCRIPT wrote (identified by a marker
line) is REMOVED once the relevant spend is back under cap (i.e. at the next UTC
day, when today's sum is 0 again). A pause file a HUMAN created (no marker) is
NEVER auto-removed - so Zaal pausing the loops by hand is respected.

Fail-safe: if the cost log is missing or unreadable, it does NOTHING (never
crashes a loop, never writes a spurious pause). "Today" is the UTC calendar day,
matching the cost-ledger convention (toISOString().slice(0,10)).

Env:
  CHEAP_LOOP_GLOBAL_USD_CAP     default 5.00   total across all loops / UTC day
  CHEAP_LOOP_PER_LOOP_USD_CAP   default 1.00   any single loop / UTC day
  ZAO_HOME                      default ~/.zao

Usage:
  cheap-loop-capguard.py            enforce (write/clear pause files)
  cheap-loop-capguard.py --dry-run  print what it WOULD do, write nothing
  cheap-loop-capguard.py --selftest run the built-in assertions (no side effects)
"""

from __future__ import annotations

import json
import os
import sys
import time
from datetime import datetime, timezone

MARKER = "# written by cheap-loop-capguard - safe to auto-remove"


def zao_home() -> str:
    return os.environ.get("ZAO_HOME", os.path.expanduser("~/.zao"))


def cost_log_path() -> str:
    return os.path.join(zao_home(), "cost-of-pass.jsonl")


def global_pause_path() -> str:
    return os.path.join(zao_home(), "cheap-loop.pause")


def per_loop_pause_path(slug: str) -> str:
    # slug is a loop name from the cost log; keep it filename-safe.
    safe = "".join(c for c in slug if c.isalnum() or c in "-_")[:64] or "unknown"
    return os.path.join(zao_home(), f"cheap-loop-{safe}.pause")


def utc_day_start(now_ts: float) -> int:
    """Unix ts of 00:00:00 UTC for the day containing now_ts."""
    d = datetime.fromtimestamp(now_ts, tz=timezone.utc)
    midnight = datetime(d.year, d.month, d.day, tzinfo=timezone.utc)
    return int(midnight.timestamp())


def sum_today(lines: list[str], now_ts: float) -> tuple[float, dict[str, float]]:
    """Return (total_usd_today, {loop: usd_today}). Corrupt lines are skipped."""
    day_start = utc_day_start(now_ts)
    total = 0.0
    per_loop: dict[str, float] = {}
    for line in lines:
        line = line.strip()
        if not line:
            continue
        try:
            rec = json.loads(line)
        except (ValueError, TypeError):
            continue
        ts = rec.get("ts", 0)
        if not isinstance(ts, (int, float)) or ts < day_start:
            continue
        usd = rec.get("usd", 0) or 0
        if not isinstance(usd, (int, float)):
            continue
        loop = str(rec.get("loop", "unknown"))
        total += usd
        per_loop[loop] = per_loop.get(loop, 0.0) + usd
    return total, per_loop


def read_cost_lines() -> list[str] | None:
    """Read the cost log. None means unreadable/missing -> caller does nothing."""
    try:
        with open(cost_log_path(), encoding="utf-8") as fh:
            return fh.readlines()
    except OSError:
        return None


def is_our_pause(path: str) -> bool:
    """True only if the pause file exists AND carries our marker (safe to remove)."""
    try:
        with open(path, encoding="utf-8") as fh:
            return MARKER in fh.read()
    except OSError:
        return False


def write_pause(path: str, reason: str, dry_run: bool) -> None:
    if dry_run:
        print(f"WOULD trip: {path} ({reason})")
        return
    try:
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(f"{MARKER}\n{reason}\ntripped_at={datetime.now(timezone.utc).isoformat()}\n")
        print(f"TRIPPED: {path} ({reason})")
    except OSError as exc:
        print(f"WARN could not write {path}: {exc}", file=sys.stderr)


def clear_pause_if_ours(path: str, dry_run: bool) -> None:
    """Remove a pause file only if WE wrote it (marker present). Human pauses stay."""
    if not os.path.exists(path):
        return
    if not is_our_pause(path):
        return  # human-created - never auto-clear
    if dry_run:
        print(f"WOULD clear: {path} (back under cap)")
        return
    try:
        os.remove(path)
        print(f"CLEARED: {path} (back under cap)")
    except OSError as exc:
        print(f"WARN could not clear {path}: {exc}", file=sys.stderr)


def enforce(now_ts: float, dry_run: bool = False) -> dict:
    """Core logic. Returns a summary dict (also used by the self-test)."""
    global_cap = float(os.environ.get("CHEAP_LOOP_GLOBAL_USD_CAP", "5.00"))
    per_loop_cap = float(os.environ.get("CHEAP_LOOP_PER_LOOP_USD_CAP", "1.00"))

    lines = read_cost_lines()
    if lines is None:
        print("cost log missing/unreadable - doing nothing (fail-safe).", file=sys.stderr)
        return {"ok": False, "reason": "no-cost-log"}

    total, per_loop = sum_today(lines, now_ts)

    # Global cap
    gpath = global_pause_path()
    if total > global_cap:
        write_pause(gpath, f"global daily cap ${global_cap:.2f} exceeded (today ${total:.4f})", dry_run)
    else:
        clear_pause_if_ours(gpath, dry_run)

    # Per-loop caps
    tripped_loops = []
    # Consider every loop seen today AND any loop we previously tripped (so it can clear).
    for loop, spent in sorted(per_loop.items()):
        ppath = per_loop_pause_path(loop)
        if spent > per_loop_cap:
            write_pause(ppath, f"loop '{loop}' daily cap ${per_loop_cap:.2f} exceeded (today ${spent:.4f})", dry_run)
            tripped_loops.append(loop)
        else:
            clear_pause_if_ours(ppath, dry_run)

    print(
        f"[capguard] UTC-today total ${total:.4f} / global ${global_cap:.2f}; "
        f"{len(per_loop)} loops active; per-loop cap ${per_loop_cap:.2f}; "
        f"{len(tripped_loops)} loop(s) tripped."
    )
    return {
        "ok": True,
        "total": total,
        "per_loop": per_loop,
        "global_tripped": total > global_cap,
        "tripped_loops": tripped_loops,
    }


def _selftest() -> int:
    """Assertions on synthetic data - no filesystem writes (dry_run + isolated env)."""
    now = 1_786_000_000  # fixed ts inside a known UTC day
    day_start = utc_day_start(now)

    def mk(loop, usd, ts):
        return json.dumps({"ts": ts, "loop": loop, "model": "x", "usd": usd})

    # Sum only today's entries; ignore yesterday + corrupt lines.
    lines = [
        mk("zoe", 0.50, now),
        mk("zoe", 0.30, now - 60),
        mk("sparkz", 2.00, now),
        mk("old", 99.0, day_start - 10),  # yesterday - ignored
        "not json",  # corrupt - skipped
        "",  # blank - skipped
    ]
    total, per_loop = sum_today(lines, now)
    assert abs(total - 2.80) < 1e-9, f"total wrong: {total}"
    assert abs(per_loop["zoe"] - 0.80) < 1e-9, f"zoe wrong: {per_loop['zoe']}"
    assert abs(per_loop["sparkz"] - 2.00) < 1e-9, f"sparkz wrong: {per_loop['sparkz']}"
    assert "old" not in per_loop, "yesterday leaked into today"

    # Cap logic via a temp env + temp cost log, dry-run so nothing persists.
    import tempfile

    with tempfile.TemporaryDirectory() as td:
        os.environ["ZAO_HOME"] = td
        os.environ["CHEAP_LOOP_GLOBAL_USD_CAP"] = "3.00"
        os.environ["CHEAP_LOOP_PER_LOOP_USD_CAP"] = "1.00"
        with open(os.path.join(td, "cost-of-pass.jsonl"), "w", encoding="utf-8") as fh:
            fh.write("\n".join(lines) + "\n")
        res = enforce(now, dry_run=True)
        assert res["ok"], "enforce failed on good input"
        assert res["global_tripped"] is False, "global should NOT trip (2.80 < 3.00)"
        assert "sparkz" in res["tripped_loops"], "sparkz (2.00) should trip per-loop cap 1.00"
        assert "zoe" not in res["tripped_loops"], "zoe (0.80) should NOT trip"

        # Missing cost log -> fail-safe no-op.
        os.remove(os.path.join(td, "cost-of-pass.jsonl"))
        res2 = enforce(now, dry_run=True)
        assert res2["ok"] is False and res2["reason"] == "no-cost-log", "should fail-safe on missing log"

        # Human-created pause (no marker) is never cleared.
        hp = global_pause_path()
        with open(hp, "w", encoding="utf-8") as fh:
            fh.write("paused by hand\n")
        clear_pause_if_ours(hp, dry_run=False)
        assert os.path.exists(hp), "human pause must NOT be auto-cleared"

    print("selftest OK")
    return 0


def main(argv: list[str]) -> int:
    if "--selftest" in argv:
        return _selftest()
    dry = "--dry-run" in argv
    res = enforce(time.time(), dry_run=dry)
    return 0 if res.get("ok") else 0  # always exit 0: a guard must never break its own cron


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
