#!/usr/bin/env python3
"""zao-board - the fleet's shared board-write helper.

Every loop calls this so a work item auto-becomes an in_progress -> done row with
a PR link, instead of each loop hand-rolling raw REST inserts (which is how it was
done, inconsistently, before this). The board is a Supabase `tasks` table; creds
are read from the same env-file ladder as the other fleet tools (never inlined).

    zao-board add "<title>" [--priority P2] [--source <legacy_source>]
                            [--project zaodevz] [--notes "..."] [--dedup]
    zao-board start <id>
    zao-board done  <id> [--pr <url>]
    zao-board list  [--source <legacy_source>] [--status todo]
    zao-board --selftest        # no network - proves the pure payload logic

Lifecycle a loop uses:
    ID=$(zao-board add "Fix X" --source my-loop --priority P2)   # or --dedup
    zao-board start "$ID"
    # ... ship the PR ...
    zao-board done "$ID" --pr https://github.com/org/repo/pull/42

`--dedup` on `add` skips creating a row when an open one with the same
(title, legacy_source) already exists - a small step toward replay-safety
(re-running a loop should not spawn duplicate board rows).
"""

import argparse
import json
import os
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone

ENV_FILES = ("~/.zao/private/tracker.env", "~/zao-os/bot/.env", "~/.zao/zao.env")


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
    url = env.get("COWORK_TRACKER_URL")
    key = env.get("COWORK_TRACKER_KEY")
    if not url or not key:
        sys.exit("zao-board: no COWORK_TRACKER_URL/KEY found in env files")
    return url.rstrip("/"), key


# --- pure payload builders (unit-tested via --selftest, no network) ----------

def build_add_payload(title: str, priority: str, source: str | None,
                      project: str, notes: str | None) -> dict:
    if not title or not title.strip():
        raise ValueError("title is required")
    if priority not in ("P0", "P1", "P2", "P3"):
        raise ValueError(f"priority must be P0..P3, got {priority!r}")
    payload = {"title": title.strip(), "status": "todo", "priority": priority, "project": project}
    if source:
        payload["legacy_source"] = source
    if notes:
        payload["notes"] = notes
    return payload


def build_done_patch(pr_url: str | None, existing_notes: str | None, now_iso: str) -> dict:
    patch = {"status": "done", "completed_at": now_iso}
    if pr_url:
        line = f"[done {now_iso[:10]}] PR: {pr_url}"
        patch["notes"] = f"{existing_notes}\n{line}" if existing_notes else line
    return patch


def dedup_filter(title: str, source: str | None) -> str:
    """PostgREST filter selecting an OPEN row with the same title + source."""
    q = ["status=in.(todo,in_progress)", "title=eq." + urllib.parse.quote(title.strip())]
    if source:
        q.append("legacy_source=eq." + urllib.parse.quote(source))
    return "&".join(q)


# --- thin REST wrappers -------------------------------------------------------

def _req(method: str, url: str, key: str, body: dict | list | None = None):
    data = json.dumps(body).encode() if body is not None else None
    headers = {"apikey": key, "Authorization": "Bearer " + key, "Content-Type": "application/json"}
    if method in ("POST", "PATCH"):
        headers["Prefer"] = "return=representation"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=25) as r:
        raw = r.read()
        return json.loads(raw) if raw else []


def cmd_add(args, url, key) -> int:
    if args.dedup:
        existing = _req("GET", f"{url}/rest/v1/tasks?{dedup_filter(args.title, args.source)}&select=id", key)
        if existing:
            print(existing[0]["id"])  # already exists - return its id, create nothing
            return 0
    payload = build_add_payload(args.title, args.priority, args.source, args.project, args.notes)
    row = _req("POST", f"{url}/rest/v1/tasks", key, payload)
    print(row[0]["id"] if isinstance(row, list) else row["id"])
    return 0


def cmd_start(args, url, key) -> int:
    _req("PATCH", f"{url}/rest/v1/tasks?id=eq.{urllib.parse.quote(args.id)}", key, {"status": "in_progress"})
    print(f"{args.id} -> in_progress")
    return 0


def cmd_done(args, url, key) -> int:
    cur = _req("GET", f"{url}/rest/v1/tasks?id=eq.{urllib.parse.quote(args.id)}&select=notes", key)
    existing_notes = cur[0].get("notes") if cur else None
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    _req("PATCH", f"{url}/rest/v1/tasks?id=eq.{urllib.parse.quote(args.id)}", key,
         build_done_patch(args.pr, existing_notes, now))
    print(f"{args.id} -> done" + (f" ({args.pr})" if args.pr else ""))
    return 0


def cmd_list(args, url, key) -> int:
    q = ["select=id,title,status,priority,legacy_source", "order=priority.asc"]
    if args.source:
        q.append("legacy_source=eq." + urllib.parse.quote(args.source))
    q.append("status=eq." + (args.status or "todo"))
    for t in _req("GET", f"{url}/rest/v1/tasks?{'&'.join(q)}", key):
        print(f"{t['id'][:8]} [{t['priority']}] [{t['status']}] {t['title'][:80]}")
    return 0


def _selftest() -> int:
    """Network-free proof of the pure payload builders."""
    checks = []
    p = build_add_payload("  Fix X ", "P2", "my-loop", "zaodevz", "note")
    checks.append(("add payload trims title + sets todo",
                   p["title"] == "Fix X" and p["status"] == "todo" and p["legacy_source"] == "my-loop"))
    try:
        build_add_payload("", "P2", None, "zaodevz", None); checks.append(("empty title rejected", False))
    except ValueError:
        checks.append(("empty title rejected", True))
    try:
        build_add_payload("x", "high", None, "zaodevz", None); checks.append(("bad priority rejected", False))
    except ValueError:
        checks.append(("bad priority rejected", True))
    d = build_done_patch("http://pr/1", "old", "2026-07-16T00:00:00Z")
    checks.append(("done patch appends PR to notes + sets done",
                   d["status"] == "done" and "PR: http://pr/1" in d["notes"] and d["notes"].startswith("old")))
    d2 = build_done_patch(None, None, "2026-07-16T00:00:00Z")
    checks.append(("done without PR sets no notes", "notes" not in d2 and d2["status"] == "done"))
    f = dedup_filter("A B", "src")
    checks.append(("dedup filter encodes title + source + open-status",
                   "status=in.(todo,in_progress)" in f and "A%20B" in f and "legacy_source=eq.src" in f))
    fails = 0
    for label, ok in checks:
        fails += 0 if ok else 1
        print(f"  {'ok  ' if ok else 'FAIL'} {label}")
    print(f"selftest: {len(checks) - fails}/{len(checks)} passed")
    return 1 if fails else 0


def main() -> int:
    p = argparse.ArgumentParser(prog="zao-board", description="fleet shared board-write helper")
    p.add_argument("--selftest", action="store_true", help="run the network-free self-test and exit")
    sub = p.add_subparsers(dest="cmd")

    a = sub.add_parser("add"); a.add_argument("title")
    a.add_argument("--priority", default="P2"); a.add_argument("--source"); a.add_argument("--project", default="zaodevz")
    a.add_argument("--notes"); a.add_argument("--dedup", action="store_true")
    s = sub.add_parser("start"); s.add_argument("id")
    dn = sub.add_parser("done"); dn.add_argument("id"); dn.add_argument("--pr")
    ls = sub.add_parser("list"); ls.add_argument("--source"); ls.add_argument("--status")

    args = p.parse_args()
    if args.selftest:
        return _selftest()
    if not args.cmd:
        p.print_help(); return 1

    url, key = load_creds()
    return {"add": cmd_add, "start": cmd_start, "done": cmd_done, "list": cmd_list}[args.cmd](args, url, key)


if __name__ == "__main__":
    sys.exit(main())
