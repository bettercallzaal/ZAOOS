#!/usr/bin/env python3
"""
Enumerate ZOR Respect awards from Optimism and write one JSON per week.

Contract: ZOR Respect ERC-1155 0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c
          on Optimism mainnet (NOT Base - the $ZAO identity token is on Base,
          Respect governance is on Optimism). Address confirmed against
          docs 1200/1202/1254/696 and the on-chain-facts memory before querying.

Read-only. Awards are made manually by Zaal and settled on-chain; this reads
that settled record back out. It computes nothing.

HOW THE ENCODING WORKS (this resolves a question the on-chain-facts memory left
open - "does amount = Respect, or does tokenId encode Respect and amount = count?"
The answer is BOTH, in two ids emitted by one TransferBatch):

  One award = ONE log entry carrying TWO token ids to the same recipient:
    id 0                                  -> value = the RESPECT AMOUNT (110, 68, ...)
    id (mintType | period | recipient)    -> value = 1, a per-period badge

  The structured id is 32 bytes: 4 bytes mintType, 8 bytes period, 20 bytes
  recipient address. Pair the two rows on (tx_hash, log_index, to).

  meeting = period + 1. Verified: 15 of 18 meetings reconstructed this way match
  data/ordaoawards.csv exactly, recipient-for-recipient and value-for-value.

Usage:
  python3 fetch-zor-onchain.py --fetch          # hit Blockscout, cache raw
  python3 fetch-zor-onchain.py --out weeks      # decode cache -> week files
"""

import argparse
import csv
import json
import os
import time
import urllib.parse
import urllib.request
from collections import defaultdict

CONTRACT = "0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c"
BASE = f"https://optimism.blockscout.com/api/v2/tokens/{CONTRACT}/transfers"
CACHE = "zor-transfers-raw.json"
NORMALIZED = "zor-awards.json"

DENOM_RANK_2X = {110: 1, 68: 2, 42: 3, 26: 4, 16: 5, 10: 6}
DENOM_RANK_1X = {55: 1, 34: 2, 21: 3, 13: 4, 8: 5, 5: 6}


def fetch(cache_path: str) -> list:
    """Page through every transfer. A truncated page-cap is reported, never silent."""
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
        time.sleep(0.4)
    with open(cache_path, "w", encoding="utf-8") as fh:
        json.dump(items, fh)
    print(f"fetched {len(items)} transfer rows over {pages} pages -> {cache_path}")
    return items


ZERO = "0x0000000000000000000000000000000000000000"


def _pair(rows: list, counterparty: str) -> list:
    """Pair the two token ids of each event on (tx, log_index, holder)."""
    groups = defaultdict(dict)
    for row in rows:
        hexid = format(int(row["total"]["token_id"]), "064x")
        mint_type, period = int(hexid[0:8], 16), int(hexid[8:24], 16)
        holder = row[counterparty]["hash"]
        key = (row["transaction_hash"], row["log_index"], holder.lower())
        rec = groups[key]
        rec.setdefault("wallet", holder)
        rec.setdefault("tx", row["transaction_hash"])
        rec.setdefault("block", row["block_number"])
        rec.setdefault("minted_at", row["timestamp"])
        if mint_type == 0 and period == 0:
            rec["respect"] = int(row["total"]["value"])
        else:
            rec["mint_type"] = mint_type
            rec["period"] = period

    paired, unpaired = [], []
    for rec in groups.values():
        if "respect" in rec and "period" in rec:
            rec["meeting"] = rec["period"] + 1
            paired.append(rec)
        else:
            unpaired.append(rec)
    if unpaired:
        raise SystemExit(
            f"FAIL: {len(unpaired)} transfer rows did not pair; "
            f"first: {unpaired[0]}. Refusing to write a partial record."
        )
    return paired


def decode(raw: list) -> tuple:
    """Split mints from burns, pair each, and NET the burns against the mints.

    56 of the 688 rows on this contract are burns, all dated 2025-10-24, all at
    the 1x tier, against meetings 68 and 69 - those two weeks were minted and
    then reversed. A burned award is not a live award, so it is removed from the
    week's totals and recorded in `reversed_awards` so the correction stays
    VISIBLE rather than silently dropped.
    """
    mints_raw = [r for r in raw if r["from"]["hash"] == ZERO]
    burns_raw = [r for r in raw if r["to"]["hash"] == ZERO]
    stray = len(raw) - len(mints_raw) - len(burns_raw)
    if stray:
        raise SystemExit(
            f"FAIL: {stray} rows are neither mint nor burn (holder-to-holder "
            f"transfer on a soulbound token) - stopping for review."
        )

    mints = _pair(mints_raw, "to")
    burns = _pair(burns_raw, "from")

    remaining = list(mints)
    reversed_awards, unmatched = [], []
    for burn in burns:
        hit = next(
            (
                m
                for m in remaining
                if m["wallet"].lower() == burn["wallet"].lower()
                and m["respect"] == burn["respect"]
                and m["meeting"] == burn["meeting"]
            ),
            None,
        )
        if hit:
            remaining.remove(hit)
            hit["burned_at"] = burn["minted_at"]
            hit["burn_tx"] = burn["tx"]
            reversed_awards.append(hit)
        else:
            unmatched.append(burn)
    if unmatched:
        print(
            f"WARNING: {len(unmatched)} burns matched no mint - listed in the "
            f"affected weeks' notes, NOT silently dropped"
        )
    print(
        f"decoded {len(mints)} mints and {len(burns)} burns from {len(raw)} rows; "
        f"{len(remaining)} live awards after netting, {len(reversed_awards)} reversed"
    )
    return remaining, reversed_awards, unmatched


def load_names(repo: str) -> dict:
    """wallet -> name. Name and ETH WALLET columns only (pii-hygiene)."""
    out = {}
    path = os.path.join(repo, "csv import", "Wallet Data-Grid view.csv")
    if os.path.exists(path):
        with open(path, newline="", encoding="utf-8-sig") as fh:
            for row in csv.DictReader(fh):
                addr = (row.get("ETH WALLET") or "").strip().lower()
                name = (row.get("Name") or "").strip()
                if addr.startswith("0x") and name:
                    out.setdefault(addr, name)
    awards_csv = os.path.join(repo, "data", "ordaoawards.csv")
    if os.path.exists(awards_csv):
        with open(awards_csv, newline="", encoding="utf-8-sig") as fh:
            for row in csv.DictReader(fh):
                title = row.get("title") or ""
                if " for " in title:
                    guess = title.rsplit(" for ", 1)[1].strip()
                    if guess:
                        out.setdefault(row["recipient"].lower(), guess)
    return out


def load_csv_groups(repo: str) -> dict:
    """(meeting, wallet, respect) -> groupNum, from the ORDAO export where it exists."""
    out = {}
    path = os.path.join(repo, "data", "ordaoawards.csv")
    if os.path.exists(path):
        with open(path, newline="", encoding="utf-8-sig") as fh:
            for row in csv.DictReader(fh):
                key = (
                    int(row["meetingNumber"]),
                    row["recipient"].lower(),
                    int(row["denomination"]),
                )
                out[key] = int(row["groupNum"])
    return out


def build(awards: list, repo: str, out_dir: str, reversed_awards=(), unmatched=()) -> list:
    names = load_names(repo)
    csv_groups = load_csv_groups(repo)
    by_meeting = defaultdict(list)
    for award in awards:
        by_meeting[award["meeting"]].append(award)
    reversed_by_meeting = defaultdict(list)
    for award in reversed_awards:
        reversed_by_meeting[award["meeting"]].append(award)
    unmatched_by_meeting = defaultdict(list)
    for burn in unmatched:
        unmatched_by_meeting[burn["meeting"]].append(burn)

    os.makedirs(out_dir, exist_ok=True)
    built = []
    # A week whose awards were ALL reversed still gets a file. Dropping it would
    # silently erase the fact that settlement was attempted and undone.
    all_meetings = set(by_meeting) | set(reversed_by_meeting) | set(unmatched_by_meeting)
    for meeting in sorted(all_meetings, reverse=True):  # newest first
        rows = by_meeting.get(meeting, [])
        # Group by settlement tx: one submitBreakout / batch call = one group.
        by_tx = defaultdict(list)
        for row in rows:
            by_tx[row["tx"]].append(row)

        groups, used_csv = [], False
        for idx, tx in enumerate(sorted(by_tx, key=lambda t: min(r["block"] for r in by_tx[t])), 1):
            members = by_tx[tx]
            denoms = [m["respect"] for m in members]
            ranked = all(d in DENOM_RANK_2X or d in DENOM_RANK_1X for d in denoms)
            mode = "ranked" if ranked and len(set(denoms)) == len(denoms) else "even_split"

            csv_nums = {
                csv_groups.get((meeting, m["wallet"].lower(), m["respect"]))
                for m in members
            }
            csv_nums.discard(None)
            if len(csv_nums) == 1:
                group_no, source = csv_nums.pop(), "ordaoawards.csv"
                used_csv = True
            else:
                group_no, source = idx, "inferred_from_settlement_tx"

            results = []
            for m in members:
                rank = DENOM_RANK_2X.get(m["respect"]) or DENOM_RANK_1X.get(m["respect"])
                results.append(
                    {
                        "name": names.get(m["wallet"].lower()),
                        "wallet": m["wallet"],
                        "rank": rank if mode == "ranked" else None,
                        "level": (7 - rank) if (rank and mode == "ranked") else None,
                        "respect": m["respect"],
                        "settled": {
                            "tx": m["tx"],
                            "block": m["block"],
                            "minted_at": m["minted_at"],
                        },
                        "title": None,
                        "reason": None,
                    }
                )
            results.sort(key=lambda r: (r["rank"] is None, r["rank"] or 0))
            groups.append(
                {
                    "group": group_no,
                    "mode": mode,
                    "group_source": source,
                    "settlement_tx": tx,
                    "results": results,
                }
            )

        groups.sort(key=lambda g: g["group"])
        sources = [
            f"Optimism ZOR ERC-1155 {CONTRACT} via Blockscout (enumerated)",
        ]
        if used_csv:
            sources.append("data/ordaoawards.csv (group numbers only)")
        sources.append("csv import/Wallet Data-Grid view.csv (name <-> wallet)")

        week = {
            "week": meeting,
            "period_number": meeting - 1,
            "date": min(
                r["minted_at"]
                for r in (rows or reversed_by_meeting.get(meeting, []))
            )[:10],
            "era": "zor",
            "contract": CONTRACT,
            "chain": "optimism",
            "mint_type": max(
                (
                    r.get("mint_type", 0)
                    for r in (rows or reversed_by_meeting.get(meeting, []))
                ),
                default=0,
            ),
            "groups": groups,
            "video_awards": [],
            "camera_on": [],
            "photos": [],
            "attendance": None,
            "participants": sum(len(g["results"]) for g in groups),
            "respect_total": sum(r["respect"] for r in rows),
            "unnamed_wallets": sum(
                1 for g in groups for r in g["results"] if not r["name"]
            ),
            "sources": sources,
            "coverage": "partial",
            "reversed_awards": [
                {
                    "name": names.get(r["wallet"].lower()),
                    "wallet": r["wallet"],
                    "respect": r["respect"],
                    "minted_at": r["minted_at"],
                    "burned_at": r["burned_at"],
                    "burn_tx": r["burn_tx"],
                }
                for r in sorted(
                    reversed_by_meeting.get(meeting, []), key=lambda r: -r["respect"]
                )
            ],
            "notes": [
                "Built from the on-chain settled record, which is authoritative. "
                "`date` is the settlement date, NOT the session date - awards are batched."
            ],
        }
        if not rows and week["reversed_awards"]:
            week["notes"].append(
                "NO LIVE AWARDS: every ZOR award minted for this week was later "
                "burned. Settlement was attempted and fully reversed - this week is "
                "not a gap in the record, it is a reversal."
            )
        if week["reversed_awards"]:
            week["notes"].append(
                f"{len(week['reversed_awards'])} award(s) for this week were minted "
                f"and later BURNED on-chain; they are excluded from participants and "
                f"respect_total and listed in reversed_awards."
            )
        for burn in unmatched_by_meeting.get(meeting, []):
            week["notes"].append(
                f"UNMATCHED BURN: {burn['respect']} Respect from {burn['wallet']} "
                f"({burn['tx']}) matched no mint in the enumerated record - review."
            )
        path = os.path.join(out_dir, f"week-{meeting:03d}.json")
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(week, fh, indent=2, ensure_ascii=False)
            fh.write("\n")
        built.append((meeting, week["participants"], week["respect_total"]))
    return built


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--fetch", action="store_true", help="re-fetch from Blockscout")
    ap.add_argument("--repo", default=os.path.expanduser("~/Documents/ZAO OS V1"))
    ap.add_argument("--out", default="weeks")
    ap.add_argument("--cache", default=CACHE)
    args = ap.parse_args()

    if args.fetch or not os.path.exists(args.cache):
        raw = fetch(args.cache)
    else:
        with open(args.cache, encoding="utf-8") as fh:
            raw = json.load(fh)
        print(f"using cached {args.cache} ({len(raw)} rows)")

    awards, reversed_awards, unmatched = decode(raw)
    with open(NORMALIZED, "w", encoding="utf-8") as fh:
        json.dump(
            {
                "live_awards": sorted(awards, key=lambda a: (-a["meeting"], a["wallet"])),
                "reversed_awards": sorted(
                    reversed_awards, key=lambda a: (-a["meeting"], a["wallet"])
                ),
                "unmatched_burns": unmatched,
            },
            fh,
            indent=1,
        )
        fh.write("\n")
    print(f"wrote {NORMALIZED}")

    for meeting, people, total in build(
        awards, args.repo, args.out, reversed_awards, unmatched
    ):
        print(f"week {meeting}: {people} awards, {total} Respect")
