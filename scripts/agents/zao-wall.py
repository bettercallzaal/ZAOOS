#!/usr/bin/env python3
"""zao-wall - the board half of THE WALL.

Zaal named the lane surface on 2026-08-20: "lets call it the wall so i can have
things on the wall autonomous but i can pick things off the wall and have them
be active."

    ON THE WALL  = autonomous. A lane owns it and is working it unattended.
    PICKED OFF   = active. Zaal has engaged it; it is his focus.
    UNCLAIMED    = agent-routable, nobody owns it. This is the failure state.

`zj` already answers "what are the lanes doing" by walking tmux. This answers
the other half - "what WORK is on the wall" - by reading the cowork board. The
two together are the wall; neither alone is.

WHY THIS EXISTS. A 48h audit on 2026-08-20 measured 45 of 46 Claude sessions
stamped WAITING, exactly one WORKING, 13 of 14 lanes idle - while 18
agent-routable cards had no lane at all. Nothing connected a card to the lane
that should work it, so unclaimed work was invisible and lanes sat idle next to
it. This makes that gap countable.

NO MIGRATION. The `tasks` table has no lane column and does not need one -
`metadata` is already a JSON blob carrying `route`, `next_owner`, `owner_label`.
The lane goes in `metadata.lane`.

USAGE
    zao-wall                    the wall: cards by lane, then unclaimed
    zao-wall --unclaimed        only agent-routable work nobody owns
    zao-wall --lane <name>      what one lane owns
    zao-wall --claim <id> <lane>    stamp a lane onto a card
    zao-wall --release <id>     put a card back on the wall, unclaimed
    zao-wall --json             machine-readable, for the TG/Discord views

Reads SUPABASE_URL + SUPABASE_SERVICE_KEY from ~/.zao/zao.env. The board is the
truth; this never writes anything but `metadata.lane`.
"""

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from collections import defaultdict

ENV_PATH = os.path.expanduser("~/.zao/zao.env")
OPEN_STATUSES = ("todo", "in_progress")


def load_env():
    """Read the two keys we need out of ~/.zao/zao.env.

    Deliberately does not print or return the key anywhere it could be logged.
    """
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if url and key:
        return url.rstrip("/"), key
    if not os.path.exists(ENV_PATH):
        sys.exit(f"zao-wall: no {ENV_PATH} and SUPABASE_URL/SUPABASE_SERVICE_KEY unset")
    with open(ENV_PATH) as fh:
        for line in fh:
            line = line.strip()
            if line.startswith("SUPABASE_URL=") and not url:
                url = line.split("=", 1)[1].strip().strip('"').strip("'")
            elif line.startswith("SUPABASE_SERVICE_KEY=") and not key:
                key = line.split("=", 1)[1].strip().strip('"').strip("'")
    if not url or not key:
        sys.exit("zao-wall: SUPABASE_URL or SUPABASE_SERVICE_KEY missing from the env file")
    return url.rstrip("/"), key


def headers(key, extra=None):
    h = {"apikey": key, "Authorization": "Bearer " + key}
    if extra:
        h.update(extra)
    return h


def fetch_open(root, key):
    """Page through every open card.

    PostgREST caps a response at 1000 rows and SILENTLY IGNORES `limit=5000`,
    so a naive single request looks complete and is not. Page with Range.
    """
    rows, offset = [], 0
    while True:
        h = headers(key, {"Range": f"{offset}-{offset + 999}"})
        q = (f"{root}/rest/v1/tasks?select=id,title,status,priority,due,project,metadata"
             f"&status=in.({','.join(OPEN_STATUSES)})&order=due.asc")
        try:
            with urllib.request.urlopen(urllib.request.Request(q, headers=h), timeout=30) as r:
                batch = json.load(r)
        except urllib.error.HTTPError as e:
            sys.exit(f"zao-wall: board read failed ({e.code}). Is SUPABASE_SERVICE_KEY current?")
        except Exception as e:
            sys.exit(f"zao-wall: board unreachable: {e}")
        rows.extend(batch)
        if len(batch) < 1000:
            return rows
        offset += 1000


def meta(card, field, default=None):
    return (card.get("metadata") or {}).get(field, default)


def resolve(root, key, prefix):
    """Accept an 8-char card prefix, return the full uuid.

    The board is keyed by uuid and PostgREST cannot LIKE a uuid column, so the
    match happens here rather than in the query.
    """
    if len(prefix) >= 36:
        return prefix
    hits = [c["id"] for c in fetch_open(root, key) if c["id"].startswith(prefix)]
    if not hits:
        sys.exit(f"zao-wall: no OPEN card starts with {prefix}")
    if len(hits) > 1:
        sys.exit(f"zao-wall: {prefix} is ambiguous - matches {len(hits)} cards")
    return hits[0]


def set_lane(root, key, card_id, lane):
    """Write metadata.lane, preserving every other metadata key."""
    h = headers(key, {"Content-Type": "application/json", "Prefer": "return=representation"})
    q = f"{root}/rest/v1/tasks?id=eq.{card_id}&select=metadata,title"
    with urllib.request.urlopen(urllib.request.Request(q, headers=h), timeout=20) as r:
        current = json.load(r)
    if not current:
        sys.exit(f"zao-wall: card {card_id[:8]} not found")
    md = current[0].get("metadata") or {}
    title = current[0].get("title") or ""
    if lane is None:
        md.pop("lane", None)
    else:
        md["lane"] = lane
    body = json.dumps({"metadata": md}).encode()
    req = urllib.request.Request(f"{root}/rest/v1/tasks?id=eq.{card_id}",
                                 data=body, headers=h, method="PATCH")
    with urllib.request.urlopen(req, timeout=20) as r:
        json.load(r)
    return title


def bucket(cards):
    """Split open cards into on-the-wall / unclaimed / needs-Zaal."""
    on_wall, unclaimed, human = defaultdict(list), [], []
    for c in cards:
        route = meta(c, "route")
        lane = meta(c, "lane")
        if lane:
            on_wall[lane].append(c)
        elif route == "agent":
            unclaimed.append(c)
        elif route == "human":
            human.append(c)
    return on_wall, unclaimed, human


def line(c):
    due = c.get("due") or "--------"
    pri = c.get("priority") or "--"
    return f"  {due}  {pri:<2}  {c['id'][:8]}  {(c.get('title') or '')[:66]}"


def sort_key(c):
    return (c.get("due") or "9999-99-99", c.get("priority") or "P9")


def main():
    ap = argparse.ArgumentParser(add_help=True, description="THE WALL - the board half")
    ap.add_argument("--unclaimed", action="store_true", help="only agent work nobody owns")
    ap.add_argument("--lane", metavar="NAME", help="what one lane owns")
    ap.add_argument("--claim", nargs=2, metavar=("CARD", "LANE"), help="stamp a lane onto a card")
    ap.add_argument("--release", metavar="CARD", help="put a card back on the wall")
    ap.add_argument("--json", action="store_true", help="machine-readable")
    args = ap.parse_args()

    root, key = load_env()

    if args.claim:
        card, lane = args.claim
        cid = resolve(root, key, card)
        title = set_lane(root, key, cid, lane)
        print(f"on the wall at {lane}: {cid[:8]}  {title[:60]}")
        return
    if args.release:
        cid = resolve(root, key, args.release)
        title = set_lane(root, key, cid, None)
        print(f"released to unclaimed: {cid[:8]}  {title[:60]}")
        return

    cards = fetch_open(root, key)
    on_wall, unclaimed, human = bucket(cards)

    if args.json:
        print(json.dumps({
            "on_wall": {k: [{"id": c["id"], "title": c.get("title"),
                             "due": c.get("due"), "priority": c.get("priority")}
                            for c in sorted(v, key=sort_key)] for k, v in on_wall.items()},
            "unclaimed": [{"id": c["id"], "title": c.get("title"), "due": c.get("due"),
                           "priority": c.get("priority"), "project": c.get("project")}
                          for c in sorted(unclaimed, key=sort_key)],
            "counts": {"open": len(cards), "on_wall": sum(len(v) for v in on_wall.values()),
                       "unclaimed": len(unclaimed), "needs_zaal": len(human)},
        }, indent=2))
        return

    if args.lane:
        mine = sorted(on_wall.get(args.lane, []), key=sort_key)
        print(f"\nON THE WALL - {args.lane}  ({len(mine)})")
        print("\n".join(line(c) for c in mine) if mine
              else "  nothing claimed. An idle lane with no cards is the bug this tool exists to show.")
        return

    if not args.unclaimed:
        total = sum(len(v) for v in on_wall.values())
        print(f"\nON THE WALL - {total} cards across {len(on_wall)} lanes")
        if not on_wall:
            print("  NOTHING. No card carries metadata.lane, so no work is claimed by any lane.")
        for lane in sorted(on_wall):
            print(f"\n  {lane}  ({len(on_wall[lane])})")
            for c in sorted(on_wall[lane], key=sort_key)[:8]:
                print(line(c))

    print(f"\nUNCLAIMED - agent-routable, nobody owns it  ({len(unclaimed)})")
    if not unclaimed:
        print("  none. Every agent-routable card has a lane.")
    for c in sorted(unclaimed, key=sort_key)[:25]:
        print(line(c))

    if not args.unclaimed:
        print(f"\nNEEDS ZAAL  ({len(human)})   - not wall work; these are picked off by definition")
        print(f"\nopen: {len(cards)}   on the wall: {sum(len(v) for v in on_wall.values())}   "
              f"unclaimed: {len(unclaimed)}   needs Zaal: {len(human)}")


if __name__ == "__main__":
    main()
