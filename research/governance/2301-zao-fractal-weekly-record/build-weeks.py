#!/usr/bin/env python3
"""
Build one JSON per Fractal week from the ORDAO on-chain award export.

Input  : data/ordaoawards.csv  (ZAOOS repo root) - the ORDAO-era award export
         csv import/Wallet Data-Grid view.csv    - Airtable name <-> wallet map
Output : weeks/week-NNN.json, newest week first

Nothing here computes or awards Respect. Points are awarded manually by Zaal
(and settled on-chain); this script only RE-SHAPES an existing settled record
into the per-week convention documented in README.md.

Rank/level: the ORDAO export stores `level` (6 = first place). rank = 7 - level.
Denomination -> rank is verified against doc 1770's table, x2 tier:
110/68/42/26/16/10 = ranks 1..6. A denomination outside that table (e.g. 40) is
an even split and gets rank: null, mode: "even_split".

Usage: python3 build-weeks.py --repo /path/to/ZAOOS --out weeks/
"""

import argparse
import csv
import json
import os
from datetime import datetime, timezone

# doc 1770, "Breakout Respect - the ranked path", x2 tier (mintType 10)
DENOM_RANK_2X = {110: 1, 68: 2, 42: 3, 26: 4, 16: 5, 10: 6}
DENOM_RANK_1X = {55: 1, 34: 2, 21: 3, 13: 4, 8: 5, 5: 6}

ZOR_CONTRACT = "0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c"  # doc 1202, Optimism


def load_name_map(repo: str) -> dict:
    """wallet(lowercase) -> display name. Airtable + award titles only.

    Reads ONLY the Name and ETH WALLET columns of the Airtable export - the
    same file carries email addresses, which never leave that CSV (pii-hygiene).
    """
    out = {}
    wallet_csv = os.path.join(repo, "csv import", "Wallet Data-Grid view.csv")
    if os.path.exists(wallet_csv):
        with open(wallet_csv, newline="", encoding="utf-8-sig") as fh:
            for row in csv.DictReader(fh):
                addr = (row.get("ETH WALLET") or "").strip().lower()
                name = (row.get("Name") or "").strip()
                if addr.startswith("0x") and name:
                    out.setdefault(addr, name)
    return out


def name_from_title(title: str) -> str | None:
    """'Meeting 76 Group 1 Respect for SwarthyHatter' -> 'SwarthyHatter'."""
    if not title:
        return None
    marker = " for "
    if marker in title:
        return title.rsplit(marker, 1)[1].strip() or None
    return None


def build(repo: str, out_dir: str) -> list:
    awards_csv = os.path.join(repo, "data", "ordaoawards.csv")
    with open(awards_csv, newline="", encoding="utf-8-sig") as fh:
        rows = list(csv.DictReader(fh))

    names = load_name_map(repo)
    # Enrich the map from award titles that name their recipient.
    for row in rows:
        guess = name_from_title(row.get("title", ""))
        if guess:
            names.setdefault(row["recipient"].lower(), guess)

    weeks = {}
    for row in rows:
        meeting = int(row["meetingNumber"])
        week = weeks.setdefault(
            meeting,
            {
                "week": meeting,
                "period_number": int(row["periodNumber"]),
                "date": None,
                "era": "zor",
                "contract": ZOR_CONTRACT,
                "chain": "optimism",
                "mint_type": int(row["mintType"]),
                "groups": {},
                "video_awards": [],
                "camera_on": [],
                "photos": [],
                "attendance": None,
                "sources": [
                    "data/ordaoawards.csv (ORDAO award export, ZAOOS repo)",
                    "csv import/Wallet Data-Grid view.csv (name <-> wallet)",
                ],
                "coverage": "partial",
                "notes": [],
            },
        )

        ts = int(row["mintTs"])
        minted = datetime.fromtimestamp(ts, tz=timezone.utc).date().isoformat()
        week["date"] = minted if week["date"] is None else min(week["date"], minted)

        denom = int(row["denomination"])
        level = int(row["level"]) if row["level"] else None
        rank = DENOM_RANK_2X.get(denom) or DENOM_RANK_1X.get(denom)
        mode = "ranked" if rank else "even_split"
        if level is not None and rank is not None and (7 - level) != rank:
            week["notes"].append(
                f"level/denomination mismatch for {row['recipient']}: "
                f"level={level} denomination={denom}"
            )

        group = week["groups"].setdefault(
            row["groupNum"], {"group": int(row["groupNum"]), "mode": mode, "results": []}
        )
        if mode == "even_split":
            group["mode"] = "even_split"

        wallet = row["recipient"]
        group["results"].append(
            {
                "name": names.get(wallet.lower()),
                "wallet": wallet,
                "rank": rank,
                "level": level,
                "respect": denom,
                "settled": {
                    "tx": row["mintTxHash"] or None,
                    "token_id": row["tokenId"] or None,
                    "minted_at": datetime.fromtimestamp(ts, tz=timezone.utc).isoformat(),
                },
                "title": row["title"] or None,
                "reason": row["reason"] or None,
            }
        )

    built = []
    os.makedirs(out_dir, exist_ok=True)
    for meeting in sorted(weeks, reverse=True):  # newest first
        week = weeks[meeting]
        groups = []
        for key in sorted(week["groups"], key=int):
            grp = week["groups"][key]
            grp["results"].sort(key=lambda r: (r["rank"] is None, r["rank"] or 0))
            groups.append(grp)
        week["groups"] = groups
        week["participants"] = sum(len(g["results"]) for g in groups)
        week["respect_total"] = sum(
            r["respect"] for g in groups for r in g["results"]
        )
        week["unnamed_wallets"] = sum(
            1 for g in groups for r in g["results"] if not r["name"]
        )
        path = os.path.join(out_dir, f"week-{meeting:03d}.json")
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(week, fh, indent=2, ensure_ascii=False)
            fh.write("\n")
        built.append((meeting, week["participants"], week["respect_total"], path))
    return built


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default=os.path.expanduser("~/Documents/ZAO OS V1"))
    ap.add_argument("--out", default="weeks")
    args = ap.parse_args()
    for meeting, people, total, path in build(args.repo, args.out):
        print(f"week {meeting}: {people} participants, {total} Respect -> {path}")
