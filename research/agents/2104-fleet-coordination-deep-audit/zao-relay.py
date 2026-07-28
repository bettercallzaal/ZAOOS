#!/usr/bin/env python3
"""zao-relay - lightweight terminal-to-terminal message relay across the fleet.

Kills the clipboard paste-bus for the common case: one live terminal (or loop)
hands a message to another WITHOUT Zaal copy-pasting between them. Messages live
in a single shared "relay hub" row in the cowork Supabase (migration-free -
reuses the tasks table's metadata jsonb), so it works across the Mac, the VPS
loops, and the Pi - anything with the cowork-tracker creds.

Usage:
  zao-relay send <to-lane> "<message>"     # drop a message into a lane's inbox
  zao-relay inbox <my-lane>                # read + ACK unread messages for me
  zao-relay peek <my-lane>                 # read WITHOUT acking (preview)
  zao-relay count                          # pending-per-lane (for cockpit)
  zao-relay list                           # everything, newest first (debug)

Lanes are free strings: zoe, cowork, fractal, zabalgamez, zol, ww, sparkz, ...
A message is {from, to, msg, ts, read}. `inbox` prints unread-for-<lane> and
flips them read; `peek` doesn't. All state is one task row (legacy_id 9000),
so there is zero board pollution and no schema change.
"""
import os, sys, json, time, datetime, urllib.request, urllib.error

HUB_LEGACY_ID = 9000           # the single relay-hub task row
HUB_TITLE = "ZAO Relay Hub (fleet cross-terminal messages)"

def env():
    e = {}
    for p in ("~/.zao/cowork-tracker.env", "~/.zao/zao.env"):
        fp = os.path.expanduser(p)
        if os.path.exists(fp):
            for line in open(fp):
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    k, v = line.split("=", 1)
                    e.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    return e

E = env()
URL = E.get("SUPABASE_URL", "").rstrip("/")
KEY = E.get("SUPABASE_SERVICE_KEY") or E.get("SUPABASE_SERVICE_ROLE_KEY")
if not (URL and KEY):
    sys.exit("zao-relay: no cowork Supabase creds (~/.zao/cowork-tracker.env)")
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}

def api(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(URL + "/rest/v1/" + path, data=data,
                               headers={**H, "Prefer": "return=representation"}, method=method)
    with urllib.request.urlopen(r) as resp:
        raw = resp.read().decode()
        return json.loads(raw) if raw else []

def now():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def get_hub():
    rows = api("GET", f"tasks?select=id,metadata&legacy_id=eq.{HUB_LEGACY_ID}")
    if rows:
        return rows[0]["id"], (rows[0].get("metadata") or {})
    # create the hub row once
    created = api("POST", "tasks", {
        "legacy_id": HUB_LEGACY_ID, "title": HUB_TITLE, "status": "todo",
        "kind": "task", "project": "zaodevz", "category": "Other",
        "source": "human-web", "legacy_source": "relay-hub",
        "metadata": {"relays": [], "hub": True}})
    return created[0]["id"], created[0].get("metadata") or {"relays": []}

def save_hub(hub_id, md):
    api("PATCH", f"tasks?id=eq.{hub_id}", {"metadata": md})

def cmd_send(to, msg, frm):
    hub_id, md = get_hub()
    relays = md.get("relays") or []
    relays.append({"from": frm, "to": to, "msg": msg, "ts": now(), "read": False})
    md["relays"] = relays[-500:]  # cap
    save_hub(hub_id, md)
    print(f"relay -> {to}: {msg[:80]}")

def cmd_inbox(lane, ack=True):
    hub_id, md = get_hub()
    relays = md.get("relays") or []
    unread = [r for r in relays if r.get("to") == lane and not r.get("read")]
    if not unread:
        print(f"[{lane}] inbox empty")
        return
    print(f"[{lane}] {len(unread)} message(s):\n")
    for r in unread:
        print(f"  from {r.get('from','?')} ({r.get('ts','')[:16]}):\n    {r.get('msg')}\n")
    if ack:
        for r in relays:
            if r.get("to") == lane and not r.get("read"):
                r["read"] = True
        save_hub(hub_id, md)
        print(f"({len(unread)} acked)")

def cmd_count():
    _, md = get_hub()
    relays = md.get("relays") or []
    per = {}
    for r in relays:
        if not r.get("read"):
            per[r.get("to")] = per.get(r.get("to"), 0) + 1
    if not per:
        print("no pending relays")
    else:
        print(" ".join(f"{k}:{v}" for k, v in sorted(per.items())))

def cmd_list():
    _, md = get_hub()
    for r in reversed((md.get("relays") or [])[-30:]):
        flag = " " if r.get("read") else "*"
        print(f"{flag} {r.get('ts','')[:16]} {r.get('from','?')}->{r.get('to','?')}: {r.get('msg','')[:70]}")

def main():
    a = sys.argv[1:]
    if not a:
        print(__doc__); return
    frm = os.environ.get("ZAO_LANE", os.environ.get("ZAO_RELAY_FROM", "unknown"))
    if a[0] == "send" and len(a) >= 3:
        cmd_send(a[1], " ".join(a[2:]), frm)
    elif a[0] == "inbox" and len(a) >= 2:
        cmd_inbox(a[1], ack=True)
    elif a[0] == "peek" and len(a) >= 2:
        cmd_inbox(a[1], ack=False)
    elif a[0] == "count":
        cmd_count()
    elif a[0] == "list":
        cmd_list()
    else:
        print(__doc__)

if __name__ == "__main__":
    main()
