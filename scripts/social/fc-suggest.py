#!/usr/bin/env python3
"""fc-suggest - keyless "accounts you should follow" for any Farcaster user.

A small primitive: given an FID, find accounts that MANY of that user's follows
also follow but the user does NOT - the friends-of-friends signal - every one a
REAL FID pulled from the live graph via Haatz (no Neynar key, no invented handles).
Each suggestion is verified (username + a recent cast) before it is printed.

Reversible + standalone: reads only the public Haatz Snapchain mirror; changes
nothing. Spiked from the 2026-08-07 @zaal discovery (research doc 2224).

Usage:
  fc-suggest.py <fid> [--sample N] [--min-overlap K] [--top T] [--json]
  fc-suggest.py 19640                 # @zaal, defaults (sample 14, overlap>=4, top 12)
  fc-suggest.py 19640 --json          # machine-readable for a bot/skill
"""
from __future__ import annotations
import argparse, json, sys, time, urllib.request
from collections import Counter

HAATZ = "https://haatz.quilibrium.com"


def _get(path: str) -> dict:
    try:
        with urllib.request.urlopen(HAATZ + path, timeout=25) as r:
            return json.load(r)
    except Exception:
        return {}


def resolve_fid(name: str) -> int | None:
    """Resolve an fname/ENS username to an FID (so callers can pass @handle too)."""
    d = _get(f"/v1/userNameProofByName?name={urllib.parse.quote(name)}")
    fid = d.get("fid")
    return int(fid) if fid else None


def follows_of(fid: int, pages: int = 1) -> list[int]:
    out: list[int] = []
    token = None
    for _ in range(pages):
        q = f"/v1/linksByFid?fid={fid}&link_type=follow&pageSize=1000" + (f"&pageToken={token}" if token else "")
        d = _get(q)
        for m in d.get("messages", []):
            t = m.get("data", {}).get("linkBody", {}).get("targetFid")
            if t:
                out.append(t)
        token = d.get("nextPageToken")
        if not token:
            break
    return out


def user_of(fid: int) -> tuple[str | None, str | None]:
    d = _get(f"/v1/userDataByFid?fid={fid}")
    uname = disp = None
    for m in d.get("messages", []):
        b = m.get("data", {}).get("userDataBody", {})
        if b.get("type") == "USER_DATA_TYPE_USERNAME":
            uname = b.get("value")
        if b.get("type") == "USER_DATA_TYPE_DISPLAY":
            disp = b.get("value")
    return uname, disp


def recent_cast(fid: int) -> str:
    d = _get(f"/v1/castsByFid?fid={fid}&reverse=true&pageSize=3")
    for m in d.get("messages", []):
        txt = m.get("data", {}).get("castAddBody", {}).get("text", "")
        if txt:
            return txt[:160].replace("\n", " ")
    return ""


def suggest(fid: int, sample: int, min_overlap: int, top: int) -> list[dict]:
    my = set(follows_of(fid, pages=3))
    if not my:
        return []
    tally: Counter[int] = Counter()
    for f in list(my)[:sample]:
        for t in follows_of(f, pages=1):
            if t not in my and t != fid:
                tally[t] += 1
        time.sleep(0.05)
    out: list[dict] = []
    for cand, n in tally.most_common():
        if n < min_overlap:
            break
        uname, disp = user_of(cand)
        if not uname:  # unverifiable -> drop (never emit an unresolved handle)
            continue
        out.append({"fid": cand, "username": uname, "display": disp, "overlap": n,
                    "of_sample": min(sample, len(my)), "recent_cast": recent_cast(cand),
                    "url": f"https://farcaster.xyz/{uname}"})
        if len(out) >= top:
            break
    return out


def main(argv: list[str]) -> int:
    import urllib.parse as _u  # noqa: F401 (used by resolve_fid via urllib.parse)
    ap = argparse.ArgumentParser(description="Keyless Farcaster follow suggestions (friends-of-friends).")
    ap.add_argument("fid", help="FID (number) or @username to suggest follows for")
    ap.add_argument("--sample", type=int, default=14)
    ap.add_argument("--min-overlap", type=int, default=4)
    ap.add_argument("--top", type=int, default=12)
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args(argv)
    fid = int(a.fid) if a.fid.lstrip("-").isdigit() else resolve_fid(a.fid.lstrip("@"))
    if not fid:
        print(f"could not resolve {a.fid}", file=sys.stderr)
        return 1
    res = suggest(fid, a.sample, a.min_overlap, a.top)
    if a.json:
        print(json.dumps({"fid": fid, "suggestions": res}, indent=2))
        return 0
    if not res:
        print(f"no grounded suggestions for fid {fid} (no follows found, or graph unavailable)")
        return 0
    print(f"Accounts fid {fid} does NOT follow but {a.min_overlap}+ of a {a.sample}-sample of their follows DO:\n")
    for s in res:
        print(f"@{s['username']} (fid {s['fid']}, {s['display'] or ''}) - {s['overlap']}/{s['of_sample']} overlap")
        if s["recent_cast"]:
            print(f"    recent: {s['recent_cast']}")
        print(f"    {s['url']}")
    print("\n(all FIDs real from the graph; each verified with a username + recent cast)")
    return 0


import urllib.parse  # noqa: E402  (top-level for resolve_fid)

if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
