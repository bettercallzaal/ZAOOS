#!/usr/bin/env python3
"""
Trigger Bonfires labeling on the bonfire to populate the vector store.

Without labeling, POST /vector_store/search returns 0 chunks even though
episodes are in the KG. Labeling chunks the episodes + creates the searchable
vector index.

Endpoint: POST /labeling/hybrid

ASK JOSHUA FIRST: cost, time, idempotency. This is unknown territory.
Currently writes a DRY-RUN by default; pass --really to actually fire.

Usage:
    set -a; . /root/cowork-zaodevz/agent/.env; set +a
    python3 scripts/bonfire-ingest/trigger_labeling.py             # dry-run
    python3 scripts/bonfire-ingest/trigger_labeling.py --really   # actually trigger
"""

import argparse
import json
import os
import sys
import urllib.error
import urllib.request


API_KEY = os.environ.get("BONFIRE_API_KEY")
BONFIRE_ID = os.environ.get("BONFIRE_ID")
API_URL = os.environ.get("BONFIRE_API_URL", "https://tnt-v2.api.bonfires.ai")

if not API_KEY or not BONFIRE_ID:
    raise SystemExit("BONFIRE_API_KEY or BONFIRE_ID missing from env")


def trigger():
    url = f"{API_URL}/labeling/hybrid"
    body = json.dumps({"bonfire_id": BONFIRE_ID}).encode("utf-8")
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
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, {"error": e.read().decode("utf-8")[:300]}
    except Exception as e:
        return -1, {"error": str(e)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--really", action="store_true", help="actually trigger (default is dry-run)")
    args = ap.parse_args()

    print(f"=== labeling trigger for bonfire {BONFIRE_ID[:8]}... ===")
    print(f"endpoint: POST {API_URL}/labeling/hybrid")
    print()

    if not args.really:
        print("DRY-RUN: pass --really to actually fire.")
        print()
        print("Before firing for real:")
        print("  1. DM Joshua (@joshua.eth on Telegram or via Ryan in the GC):")
        print("     - Does this cost $ or compute beyond what's covered by the Genesis NFT?")
        print("     - Is it idempotent (can we re-run safely)?")
        print("     - Does it process the existing 780+ episodes in one shot or")
        print("       does it need to be run per-batch?")
        print("     - Expected wall-clock time for ~780 episodes?")
        print("  2. Confirm with Zaal before sending. Once labeled, vector_store/search")
        print("     starts working, which unlocks programmatic verification.")
        return

    print("FIRING labeling/hybrid for real...")
    code, resp = trigger()
    print(f"HTTP {code}")
    print(json.dumps(resp, indent=2)[:2000])


if __name__ == "__main__":
    main()
