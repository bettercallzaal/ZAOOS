#!/usr/bin/env python3
"""triage - nightly board auto-triage (slice 2 of the board-integration keystone).

Does the four things Zaal asked for over the cowork `tasks` board:
  1. RERANK       - score each open task by priority x deadline x urgency/importance
  2. DEDUP        - group tasks with the same (title, legacy_source), keep one
  3. CLOSE-SHIPPED- mark done any task whose PR link is already merged (via `gh`)
  4. TOP-10       - emit the true top-10 the morning brief + fleet page read

Safe by default: it PLANS and prints (dry-run). It mutates the board only with
--apply, so a human can wire the nightly cron with --apply once they trust it.
The scoring / dedup / shipped-detection logic is pure and unit-tested; only the
fetch, `gh` PR-state check, and PATCH touch the outside world.

    python3 scripts/fleet/triage.py            # dry-run: print plan + top-10
    python3 scripts/fleet/triage.py --apply    # execute dedup + close-shipped
    python3 scripts/fleet/triage.py --selftest  # no network
"""

import argparse
import json
import os
import re
import subprocess
import sys
import urllib.parse
import urllib.request
from datetime import date

ENV_FILES = ("~/.zao/private/tracker.env", "~/zao-os/bot/.env", "~/.zao/zao.env")
PR_URL_RE = re.compile(r"https://github\.com/[\w.-]+/[\w.-]+/pull/\d+")


def load_creds() -> tuple[str, str]:
    env: dict[str, str] = {}
    for p in ENV_FILES:
        fp = os.path.expanduser(p)
        if not os.path.exists(fp):
            continue
        for line in open(fp):
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                env.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    url, key = env.get("COWORK_TRACKER_URL"), env.get("COWORK_TRACKER_KEY")
    if not url or not key:
        sys.exit("triage: no COWORK_TRACKER_URL/KEY found")
    return url.rstrip("/"), key


# --- pure logic (unit-tested) ------------------------------------------------

PRIORITY_BASE = {"P0": 1000, "P1": 100, "P2": 10, "P3": 1}


def _days_until(today: str, due: str | None) -> int | None:
    if not due:
        return None
    try:
        y, m, d = (int(x) for x in due[:10].split("-"))
        ty, tm, td = (int(x) for x in today[:10].split("-"))
        return (date(y, m, d) - date(ty, tm, td)).days
    except (ValueError, TypeError):
        return None


def rank_score(task: dict, today: str) -> float:
    """Higher = more urgent. Priority is the base; deadline + Eisenhower flags adjust."""
    score = float(PRIORITY_BASE.get(task.get("priority"), 5))
    days = _days_until(today, task.get("due"))
    if days is not None:
        if days < 0:
            score += 500          # overdue
        elif days <= 2:
            score += 200          # due within 2 days
        elif days <= 7:
            score += 50           # due this week
    if task.get("urgent"):
        score += 40
    if task.get("important"):
        score += 60
    return score


def dedup_key(task: dict) -> tuple[str, str]:
    title = re.sub(r"\s+", " ", (task.get("title") or "").strip().lower())
    return (title, task.get("legacy_source") or "")


def plan_dedup(tasks: list[dict]) -> list[dict]:
    """Group by (title, source); keep the best row, list the rest as duplicates.
    Survivor preference: in_progress over todo, then most-recently-updated."""
    groups: dict[tuple[str, str], list[dict]] = {}
    for t in tasks:
        groups.setdefault(dedup_key(t), []).append(t)
    plan = []
    for key, rows in groups.items():
        if len(rows) < 2:
            continue
        rows_sorted = sorted(
            rows,
            key=lambda r: (r.get("status") == "in_progress", r.get("updated_at") or ""),
            reverse=True,
        )
        keep, dupes = rows_sorted[0], rows_sorted[1:]
        plan.append({"keep": keep["id"], "title": keep.get("title", "")[:60],
                     "close": [d["id"] for d in dupes]})
    return plan


def extract_pr_urls(task: dict) -> list[str]:
    return PR_URL_RE.findall(task.get("notes") or "")


def plan_close_shipped(tasks: list[dict], merged: dict[str, bool]) -> list[dict]:
    """Tasks that are not done but carry a PR url that `merged` says is merged."""
    out = []
    for t in tasks:
        if t.get("status") == "done":
            continue
        urls = extract_pr_urls(t)
        if urls and any(merged.get(u) for u in urls):
            hit = next(u for u in urls if merged.get(u))
            out.append({"id": t["id"], "title": t.get("title", "")[:60], "pr": hit})
    return out


def top_n(tasks: list[dict], today: str, n: int = 10) -> list[dict]:
    open_tasks = [t for t in tasks if t.get("status") in ("todo", "in_progress")]
    ranked = sorted(open_tasks, key=lambda t: rank_score(t, today), reverse=True)
    return [{"rank": i + 1, "score": rank_score(t, today), "id": t["id"],
             "priority": t.get("priority"), "title": (t.get("title") or "")[:70]}
            for i, t in enumerate(ranked[:n])]


# --- IO ----------------------------------------------------------------------

def fetch_open(url: str, key: str) -> list[dict]:
    q = "status=in.(todo,in_progress)&select=id,title,status,priority,due,important,urgent,legacy_source,notes,updated_at"
    req = urllib.request.Request(f"{url}/rest/v1/tasks?{q}",
                                 headers={"apikey": key, "Authorization": "Bearer " + key})
    return json.load(urllib.request.urlopen(req, timeout=30))


def gh_pr_merged(pr_url: str) -> bool:
    try:
        out = subprocess.run(["gh", "pr", "view", pr_url, "--json", "state"],
                             capture_output=True, text=True, timeout=25)
        if out.returncode != 0:
            return False
        return json.loads(out.stdout).get("state") == "MERGED"
    except Exception:
        return False


def patch(url: str, key: str, task_id: str, body: dict) -> None:
    req = urllib.request.Request(
        f"{url}/rest/v1/tasks?id=eq.{urllib.parse.quote(task_id)}",
        data=json.dumps(body).encode(),
        headers={"apikey": key, "Authorization": "Bearer " + key,
                 "Content-Type": "application/json"}, method="PATCH")
    urllib.request.urlopen(req, timeout=25).read()


def _selftest() -> int:
    today = "2026-07-17"
    checks = []
    # rerank
    p1 = rank_score({"priority": "P1"}, today)
    p2 = rank_score({"priority": "P2"}, today)
    overdue = rank_score({"priority": "P2", "due": "2026-07-10"}, today)
    checks.append(("P1 outranks P2", p1 > p2))
    checks.append(("overdue P2 outranks fresh P2", overdue > p2))
    checks.append(("overdue P2 can outrank a fresh P1", overdue > p1))
    checks.append(("important+urgent adds up",
                   rank_score({"priority": "P3", "important": True, "urgent": True}, today) == 1 + 60 + 40))
    # dedup
    dup = plan_dedup([
        {"id": "a", "title": "Fix  X", "legacy_source": "s", "status": "todo", "updated_at": "2026-07-01"},
        {"id": "b", "title": "fix x", "legacy_source": "s", "status": "in_progress", "updated_at": "2026-07-02"},
        {"id": "c", "title": "unrelated", "legacy_source": "s", "status": "todo"},
    ])
    checks.append(("dedup groups normalized titles, keeps in_progress",
                   len(dup) == 1 and dup[0]["keep"] == "b" and dup[0]["close"] == ["a"]))
    # close-shipped
    shipped = plan_close_shipped(
        [{"id": "x", "status": "todo", "notes": "done: https://github.com/o/r/pull/5"},
         {"id": "y", "status": "todo", "notes": "https://github.com/o/r/pull/6"},
         {"id": "z", "status": "done", "notes": "https://github.com/o/r/pull/5"}],
        {"https://github.com/o/r/pull/5": True, "https://github.com/o/r/pull/6": False})
    checks.append(("close-shipped only flags not-done tasks with a MERGED pr",
                   [s["id"] for s in shipped] == ["x"]))
    # top-n
    tn = top_n([{"id": "1", "status": "todo", "priority": "P2"},
                {"id": "2", "status": "todo", "priority": "P0"},
                {"id": "3", "status": "done", "priority": "P0"}], today, n=10)
    checks.append(("top-n excludes done + orders by score",
                   [t["id"] for t in tn] == ["2", "1"]))

    fails = 0
    for label, ok in checks:
        fails += 0 if ok else 1
        print(f"  {'ok  ' if ok else 'FAIL'} {label}")
    print(f"selftest: {len(checks) - fails}/{len(checks)} passed")
    return 1 if fails else 0


def main() -> int:
    p = argparse.ArgumentParser(description="nightly board auto-triage")
    p.add_argument("--selftest", action="store_true")
    p.add_argument("--apply", action="store_true", help="execute dedup + close-shipped (default: dry-run)")
    p.add_argument("--today", help="override today (YYYY-MM-DD) for deterministic runs")
    args = p.parse_args()

    if args.selftest:
        return _selftest()

    today = args.today or date.today().isoformat()
    url, key = load_creds()
    tasks = fetch_open(url, key)

    print(f"# Board triage {today} ({'APPLY' if args.apply else 'dry-run'}) - {len(tasks)} open tasks\n")

    print("## True top-10")
    for t in top_n(tasks, today):
        print(f"{t['rank']:>2}. [{t['priority']}] {t['title']}  (score {t['score']:.0f})")

    dedup = plan_dedup(tasks)
    print(f"\n## Dedup - {sum(len(d['close']) for d in dedup)} duplicate row(s) across {len(dedup)} group(s)")
    for d in dedup:
        print(f"- keep {d['keep'][:8]} '{d['title']}'  close {[c[:8] for c in d['close']]}")

    # close-shipped needs a `gh` PR-state check per unique PR url
    urls = {u for t in tasks for u in extract_pr_urls(t)}
    merged = {u: gh_pr_merged(u) for u in urls}
    shipped = plan_close_shipped(tasks, merged)
    print(f"\n## Close-shipped - {len(shipped)} task(s) whose PR is merged")
    for s in shipped:
        print(f"- {s['id'][:8]} '{s['title']}'  <- {s['pr']}")

    if args.apply:
        n = 0
        for d in dedup:
            for cid in d["close"]:
                patch(url, key, cid, {"status": "archived", "notes": f"[triage] duplicate of {d['keep']}"})
                n += 1
        for s in shipped:
            patch(url, key, s["id"], {"status": "done", "notes": f"[triage] shipped: {s['pr']}"})
            n += 1
        print(f"\nAPPLIED {n} change(s).")
    else:
        print("\n(dry-run - re-run with --apply to execute dedup + close-shipped)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
