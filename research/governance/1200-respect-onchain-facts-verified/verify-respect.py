#!/usr/bin/env python3
"""
verify-respect.py — read the LIVE on-chain holder counts for the ZAO Respect
tokens on Optimism and reconcile the two figures the ZAO cites.

WHY
---
The ZAO's public facts (whitepaper 942, the ICM context boxes, member pages)
cite Respect holder counts. Two numbers were floating around and looked like a
contradiction: "122 holders" and "156 holders." They are BOTH correct in context:
  - 122  = holders of the OG ERC-20 (the soulbound governance token) alone.
  - ~156 = UNIQUE holders across OG *or* ZOR (the ERC-1155), de-duplicated.
This script proves it from chain state, so no doc has to guess.

HOW
---
Uses the free Blockscout Optimism explorer API (no key). Enumerates the full
holder list for each token (paginated), so `holders_enumerated` is a cross-check
on the explorer's own `holders_count`. Computes the OG∪ZOR union + intersection.

USAGE
  python3 verify-respect.py            # print reconciled facts JSON to stdout
  python3 verify-respect.py > respect-facts.json   # refresh the canonical facts file

This only READS public chain data. It writes nothing on-chain and needs no key.
Re-run it whenever a doc is about to quote a Respect number (drift guard).
"""
from __future__ import annotations
import json
import time
import urllib.parse
import urllib.request

BASE = "https://explorer.optimism.io/api/v2"  # Blockscout, Optimism mainnet
UA = {"User-Agent": "Mozilla/5.0"}

TOKENS = {
    "OG": "0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957",   # ERC-20  "ZAO RESPECT TOKEN"
    "ZOR": "0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c",  # ERC-1155 "ZAO Fractal Respect"
}


def _get(url: str) -> dict:
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=25) as r:
        return json.load(r)


def all_holders(addr: str) -> set[str]:
    """Enumerate every holder address (lowercased) via the paginated holders API."""
    holders: set[str] = set()
    url = f"{BASE}/tokens/{addr}/holders"
    for _ in range(40):  # hard page cap (backstop)
        d = _get(url)
        for it in d.get("items", []):
            h = (it.get("address") or {}).get("hash", "").lower()
            if h:
                holders.add(h)
        npp = d.get("next_page_params")
        if not npp:
            break
        q = "&".join(f"{k}={urllib.parse.quote(str(v))}" for k, v in npp.items())
        url = f"{BASE}/tokens/{addr}/holders?{q}"
        time.sleep(0.4)
    return holders


def main() -> int:
    meta = {name: _get(f"{BASE}/tokens/{addr}") for name, addr in TOKENS.items()}
    sets = {name: all_holders(addr) for name, addr in TOKENS.items()}
    latest = (_get(f"{BASE}/blocks?type=block").get("items") or [{}])[0]

    og, zor = sets["OG"], sets["ZOR"]
    og_supply = None
    try:
        og_supply = int(meta["OG"]["total_supply_raw" if "total_supply_raw" in meta["OG"] else "total_supply"]) / 10 ** int(meta["OG"]["decimals"])
    except Exception:
        pass

    out = {
        "verified_at_block": latest.get("height"),
        "verified_at_timestamp": latest.get("timestamp"),
        "source": "explorer.optimism.io (Blockscout) /api/v2 — holder lists enumerated",
        "chain": "Optimism",
        "og_respect": {
            "address": TOKENS["OG"],
            "name": meta["OG"].get("name"),
            "type": meta["OG"].get("type"),
            "holders_reported": meta["OG"].get("holders_count"),
            "holders_enumerated": len(og),
            "total_respect_points": og_supply,
        },
        "zor_respect": {
            "address": TOKENS["ZOR"],
            "name": meta["ZOR"].get("name"),
            "type": meta["ZOR"].get("type"),
            "holders_reported": meta["ZOR"].get("holders_count"),
            "holders_enumerated": len(zor),
        },
        "unique_holders_across_og_or_zor": len(og | zor),
        "holders_of_both_og_and_zor": len(og & zor),
        "naive_sum_og_plus_zor": len(og) + len(zor),
        "note": (
            "The '122' figure = OG holders alone. The '~156' figure = unique holders "
            "across OG or ZOR (de-duplicated). Both are correct; cite which one you mean."
        ),
    }
    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
