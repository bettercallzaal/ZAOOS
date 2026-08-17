#!/usr/bin/env python3
"""
Enumerate the OG Respect ERC-20 on Optimism into a settlement record.

Contract: OG Respect ERC-20 0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957
          on Optimism mainnet. Confirmed against docs 1200/1202/1254/696 and the
          on-chain-facts memory (total supply 38,484 / 122 holders) before use.

WHY THIS DOES NOT PRODUCE WEEK FILES, unlike the ZOR enumerator.

ZOR encodes the meeting number inside the token id, so a week is recoverable
from the chain alone. The OG ERC-20 encodes nothing: it is a plain fungible
token. Its 69 mints all go to ONE operator wallet, which then distributes to
members across 48 days, and only some of those days are a single week's clean
Fibonacci set - the rest are bulk settlements of a backlog. The very first day,
2024-07-30, pays 22 people in arbitrary sums (210, 185, 110, 93, ...) because it
settled everything that had accumulated off-chain before the token existed.

So the chain CANNOT say which week an OG award belongs to. Inventing a mapping
would be fabrication. The week-numbered source for 1-73 is the Airtable export,
handled by build-airtable-weeks.py; this script produces the on-chain settlement
record that CORROBORATES it, and the per-member reconciliation between the two.

Read-only. Computes nothing about who deserved what.

Usage: python3 fetch-og-onchain.py --fetch --repo /path/to/ZAOOS
"""

import argparse
import csv
import json
import os
import time
import urllib.parse
import urllib.request
from collections import defaultdict

CONTRACT = "0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957"
BASE = f"https://optimism.blockscout.com/api/v2/tokens/{CONTRACT}/transfers"
CACHE = "og-transfers-raw.json"
OUT = "og-settlements.json"
ZERO = "0x0000000000000000000000000000000000000000"
WEI = 10 ** 18

FIB_1X = {5, 8, 13, 21, 34, 55}
FIB_2X = {10, 16, 26, 42, 68, 110}


def fetch(cache_path: str) -> list:
    items, params, pages = [], None, 0
    while True:
        url = BASE + ("?" + urllib.parse.urlencode(params) if params else "")
        req = urllib.request.Request(
            url, headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=45) as resp:
            page = json.load(resp)
        batch = page.get("items", [])
        items.extend(batch)
        pages += 1
        nxt = page.get("next_page_params")
        if not nxt or not batch:
            break
        if pages > 200:
            raise SystemExit("FAIL: page cap hit - coverage would be incomplete")
        params = {k: v for k, v in nxt.items() if v is not None}
        time.sleep(0.35)
    with open(cache_path, "w", encoding="utf-8") as fh:
        json.dump(items, fh)
    print(f"fetched {len(items)} transfer rows over {pages} pages")
    return items


def names_by_wallet(repo: str) -> dict:
    out = {}
    path = os.path.join(repo, "csv import", "Wallet Data-Grid view.csv")
    if os.path.exists(path):
        with open(path, newline="", encoding="utf-8-sig") as fh:
            for row in csv.DictReader(fh):
                name = (row.get("Name") or "").strip()
                addr = (row.get("ETH WALLET") or "").strip().lower()
                if name and addr.startswith("0x"):
                    out.setdefault(addr, name)
    return out


def build(raw: list, repo: str) -> dict:
    names = names_by_wallet(repo)
    mints = [r for r in raw if r["from"]["hash"] == ZERO]
    operators = {r["to"]["hash"] for r in mints}
    if len(operators) != 1:
        raise SystemExit(
            f"FAIL: expected every mint to land on ONE operator wallet, saw "
            f"{len(operators)}: {sorted(operators)}. The distribution model this "
            f"script assumes no longer holds - stopping rather than guessing."
        )
    operator = operators.pop()

    distributions, other = [], []
    for row in raw:
        if row["from"]["hash"] == ZERO:
            continue
        entry = {
            "from": row["from"]["hash"],
            "to": row["to"]["hash"],
            "respect": int(row["total"]["value"]) // WEI,
            "date": row["timestamp"][:10],
            "tx": row["transaction_hash"],
            "block": row["block_number"],
        }
        (distributions if row["from"]["hash"] == operator else other).append(entry)

    by_day = defaultdict(list)
    for entry in distributions:
        by_day[entry["date"]].append(entry)

    days = []
    for date in sorted(by_day, reverse=True):
        rows = by_day[date]
        values = [r["respect"] for r in rows]
        on_curve = all(v in FIB_1X or v in FIB_2X for v in values)
        days.append(
            {
                "date": date,
                "recipients": len(rows),
                "respect_total": sum(values),
                # A day whose every value sits on the Fibonacci curve is most
                # likely ONE week's awards. A day with arbitrary sums is a bulk
                # settlement of accumulated off-chain weeks. This is a
                # CLASSIFICATION, not a week number - see the module docstring.
                "shape": "single_week_fibonacci" if on_curve else "aggregate_or_backfill",
                "awards": [
                    {
                        "name": names.get(r["to"].lower()),
                        "wallet": r["to"],
                        "respect": r["respect"],
                        "tx": r["tx"],
                    }
                    for r in sorted(rows, key=lambda r: -r["respect"])
                ],
            }
        )

    received = defaultdict(int)
    for entry in distributions:
        received[entry["to"].lower()] += entry["respect"]

    return {
        "contract": CONTRACT,
        "chain": "optimism",
        "standard": "ERC-20",
        "enumerated": "2026-08-17 via Blockscout, pagination to natural exhaustion",
        "transfer_rows": len(raw),
        "mints": len(mints),
        "operator_wallet": operator,
        "operator_note": (
            "Every mint lands on this single wallet, which then distributes to "
            "members. 447 of 449 member-facing transfers originate here. This is a "
            "distribution mechanism, not a market."
        ),
        "distributions": len(distributions),
        "non_operator_transfers": other,
        "distinct_distribution_days": len(by_day),
        "span": [min(by_day), max(by_day)] if by_day else [],
        "total_distributed": sum(received.values()),
        "distinct_recipients": len(received),
        "days": days,
    }


def reconcile(record: dict, repo: str) -> dict:
    """Per-member: what Airtable claims was settled on-chain vs what the chain shows."""
    wallets = {}
    path = os.path.join(repo, "csv import", "Wallet Data-Grid view.csv")
    with open(path, newline="", encoding="utf-8-sig") as fh:
        for row in csv.DictReader(fh):
            name = (row.get("Name") or "").strip()
            addr = (row.get("ETH WALLET") or "").strip().lower()
            if name and addr.startswith("0x"):
                wallets.setdefault(name, addr)

    received = defaultdict(int)
    for day in record["days"]:
        for award in day["awards"]:
            received[award["wallet"].lower()] += award["respect"]

    exact, mismatched, unmappable = 0, [], 0
    summary = os.path.join(repo, "csv import", "Summary-Grid view.csv")
    with open(summary, newline="", encoding="utf-8-sig") as fh:
        for row in csv.DictReader(fh):
            name = (row.get("Name") or "").strip()
            raw = (row.get("actual ZAO onchain") or "").strip().replace(",", "")
            if not name or not raw:
                continue
            try:
                claimed = int(float(raw))
            except ValueError:
                continue
            addr = wallets.get(name)
            if not addr or addr not in received:
                unmappable += 1
                continue
            if received[addr] == claimed:
                exact += 1
            else:
                mismatched.append(
                    {"name": name, "airtable": claimed, "chain": received[addr]}
                )
    return {
        "exact_match": exact,
        "mismatched": mismatched,
        "unmappable": unmappable,
        "note": (
            "The operator wallet's own row understates badly by construction - it "
            "holds the undistributed mint balance and is the SENDER of every "
            "distribution, so what it 'received' is not what it was awarded."
        ),
    }


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--fetch", action="store_true")
    ap.add_argument("--repo", default=os.path.expanduser("~/Documents/ZAO OS V1"))
    ap.add_argument("--cache", default=CACHE)
    args = ap.parse_args()

    if args.fetch or not os.path.exists(args.cache):
        raw = fetch(args.cache)
    else:
        with open(args.cache, encoding="utf-8") as fh:
            raw = json.load(fh)
        print(f"using cached {args.cache} ({len(raw)} rows)")

    record = build(raw, args.repo)
    record["reconciliation_vs_airtable"] = reconcile(record, args.repo)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(record, fh, indent=1, ensure_ascii=False)
        fh.write("\n")

    rec = record["reconciliation_vs_airtable"]
    print(f"wrote {OUT}")
    print(f"  {record['mints']} mints -> operator {record['operator_wallet']}")
    print(f"  {record['distributions']} distributions over "
          f"{record['distinct_distribution_days']} days, "
          f"{record['total_distributed']} Respect to "
          f"{record['distinct_recipients']} members")
    shapes = defaultdict(int)
    for day in record["days"]:
        shapes[day["shape"]] += 1
    print(f"  day shapes: {dict(shapes)}")
    print(f"  reconciliation vs Airtable: {rec['exact_match']} exact, "
          f"{len(rec['mismatched'])} mismatched, {rec['unmappable']} unmappable")
