#!/usr/bin/env python3
"""
Verify a bonfire-ingest manifest: best-effort GET each episode by its UUID
and report which ones the API confirms.

Limitation as of 2026-05-18: Bonfires API GET /knowledge_graph/episode/{uuid}
returns 404 even for episodes we KNOW exist (auto-extraction works per the
smoke-test dashboard screenshot). The supplied UUID may not be the internal
storage key. This script is forward-compatible: when the API surface stabilises
+ GETs return real data, the same manifests we're writing today will be
queryable retroactively. Until then: expect mostly 404s, treat as "ingest
was confirmed at POST time, KG visibility is dashboard-only."

Usage:
    set -a; . /root/cowork-zaodevz/agent/.env; set +a
    python3 scripts/bonfire-ingest/verify_manifest.py /root/.zaocoworking/ingest-research-library-XXXX.json [--limit N] [--sleep S]

Also supports --expand which uses POST /knowledge_graph/episodes/expand
(takes the UUID + returns connected entities/edges if any).
"""

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request


API_KEY = os.environ.get("BONFIRE_API_KEY")
BONFIRE_ID = os.environ.get("BONFIRE_ID")
API_URL = os.environ.get("BONFIRE_API_URL", "https://tnt-v2.api.bonfires.ai")

if not API_KEY or not BONFIRE_ID:
    raise SystemExit("BONFIRE_API_KEY or BONFIRE_ID missing from env")


def get_episode(uuid):
    url = f"{API_URL}/knowledge_graph/episode/{uuid}?bonfire_id={BONFIRE_ID}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {API_KEY}"})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")[:200]
        return e.code, {"error": body}
    except Exception as e:
        return -1, {"error": str(e)}


def expand_episode(uuid, limit=5):
    url = f"{API_URL}/knowledge_graph/episodes/expand"
    body = json.dumps({
        "bonfire_id": BONFIRE_ID,
        "episode_uuid": uuid,
        "limit": limit,
    }).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, {"error": e.read().decode("utf-8")[:200]}
    except Exception as e:
        return -1, {"error": str(e)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("manifest", help="path to ingest manifest .json")
    ap.add_argument("--limit", type=int, default=20, help="check first N (default 20)")
    ap.add_argument("--sleep", type=float, default=0.3, help="seconds between queries")
    ap.add_argument("--expand", action="store_true", help="use /episodes/expand instead of GET by uuid")
    args = ap.parse_args()

    m = json.load(open(args.manifest))
    sent = m.get("details", {}).get("sent", [])
    print(f"=== manifest: {args.manifest}")
    print(f"=== {len(sent)} sent episodes; checking first {min(args.limit, len(sent))}")
    print()

    found = 0
    missing = 0
    other = 0
    with_uuid = 0

    for i, ep in enumerate(sent[:args.limit]):
        uuid = ep.get("uuid")
        name = ep.get("name", "?")
        if not uuid:
            print(f"  [{i+1:3d}] {name} - manifest has no UUID (pre-v0.2 ingest)")
            continue
        with_uuid += 1
        if args.expand:
            code, resp = expand_episode(uuid)
            if code == 200:
                nodes = len(resp.get("nodes", []))
                edges = len(resp.get("edges", []))
                episodes = len(resp.get("episodes", []))
                if nodes or edges or episodes:
                    found += 1
                    print(f"  [{i+1:3d}] {name}: OK nodes={nodes} edges={edges} episodes={episodes}")
                else:
                    missing += 1
                    print(f"  [{i+1:3d}] {name}: 200 but empty (uuid={uuid[:8]}...)")
            else:
                other += 1
                print(f"  [{i+1:3d}] {name}: HTTP {code}")
        else:
            code, resp = get_episode(uuid)
            if code == 200:
                found += 1
                print(f"  [{i+1:3d}] {name}: FOUND ({list(resp.keys())[:5] if isinstance(resp, dict) else type(resp).__name__})")
            elif code == 500 and "not found" in str(resp).lower():
                missing += 1
                print(f"  [{i+1:3d}] {name}: not found (uuid={uuid[:8]}...)")
            else:
                other += 1
                print(f"  [{i+1:3d}] {name}: HTTP {code}: {str(resp)[:80]}")
        time.sleep(args.sleep)

    print()
    print(f"=== summary ===")
    print(f"with UUID:  {with_uuid} / {len(sent[:args.limit])}")
    print(f"found:      {found}")
    print(f"missing:    {missing}")
    print(f"other err:  {other}")
    if found == 0 and missing > 0:
        print()
        print("All UUIDs return 404. Per Bonfires-as-of-2026-05-18: dashboard visibility")
        print("confirms ingestion + auto-extraction; API GET by supplied UUID is not yet")
        print("queryable. The manifest is forward-compatible - re-run this script after")
        print("the API surface stabilises to retroactively verify.")


if __name__ == "__main__":
    main()
