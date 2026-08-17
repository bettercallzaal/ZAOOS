#!/usr/bin/env python3
"""
Build week files for the PRE-CHAIN / OG era (weeks 1-73) from the Airtable export.

Why this is a different builder from fetch-zor-onchain.py: the OG Respect ERC-20
does not carry a week number. Its 69 mints all go to one operator wallet, which
then distributes to members across 48 days, and only some of those days are a
single week's clean Fibonacci set - the rest are bulk settlements of a backlog
(the first day, 2024-07-30, pays out 22 people in arbitrary sums). So the chain
cannot tell you which week an OG award belongs to.

The week-numbered source for 1-73 is `csv import/Respect-Grid view.csv`, which
records per-session Respect by NAME, one column per session, plus a parallel
`ZAO Video N` column per session - the camera-on record.

What that costs, stated plainly:
  - These weeks carry NO settlement transaction. They are an off-chain record.
  - Wallets are attached where the Airtable wallet map knows one, and are null
    otherwise. A null wallet is not a guess.
  - Group structure is unknown, so results are one group with mode "recorded"
    rather than a fabricated ranking.

Usage: python3 build-airtable-weeks.py --repo /path/to/ZAOOS --out weeks
"""

import argparse
import csv
import os
import re
import json

DENOM_RANK_2X = {110: 1, 68: 2, 42: 3, 26: 4, 16: 5, 10: 6}
DENOM_RANK_1X = {55: 1, 34: 2, 21: 3, 13: 4, 8: 5, 5: 6}

SESSION_RE = re.compile(r"(?:fract\w*|respect)\D*(\d+(?:\.\d+)?)", re.I)
VIDEO_RE = re.compile(r"video\D*(\d+(?:\.\d+)?)", re.I)


def classify(columns: list) -> tuple:
    """-> ({week: session_col}, {week: video_col}). Column names drift badly."""
    sessions, videos = {}, {}
    for col in columns:
        low = col.lower()
        if "total" in low or "sum of" in low or low.startswith("summary"):
            continue
        if "video" in low:
            m = VIDEO_RE.search(col)
            if m:
                videos.setdefault(m.group(1), col)
        else:
            m = SESSION_RE.search(col)
            if m:
                sessions.setdefault(m.group(1), col)
    return sessions, videos


def load_wallets(repo: str) -> dict:
    """name -> wallet. Name and ETH WALLET columns only (pii-hygiene)."""
    out = {}
    path = os.path.join(repo, "csv import", "Wallet Data-Grid view.csv")
    if os.path.exists(path):
        with open(path, newline="", encoding="utf-8-sig") as fh:
            for row in csv.DictReader(fh):
                name = (row.get("Name") or "").strip()
                addr = (row.get("ETH WALLET") or "").strip()
                if name and addr.startswith("0x") and len(addr) == 42:
                    out.setdefault(name, addr)
    return out


def build(repo: str, out_dir: str, lo: int, hi: int) -> tuple:
    path = os.path.join(repo, "csv import", "Respect-Grid view.csv")
    with open(path, newline="", encoding="utf-8-sig") as fh:
        rows = list(csv.DictReader(fh))
    sessions, videos = classify(list(rows[0].keys()))
    wallets = load_wallets(repo)

    os.makedirs(out_dir, exist_ok=True)
    built, skipped_existing, fractional = [], [], []

    for key in sorted(sessions, key=lambda k: float(k)):
        if "." in key:
            fractional.append(key)  # e.g. "73.2" - a sub-session, not a week slot
            continue
        week = int(key)
        if not (lo <= week <= hi):
            continue
        target = os.path.join(out_dir, f"week-{week:03d}.json")
        existing = None
        if os.path.exists(target):
            with open(target, encoding="utf-8") as fh:
                existing = json.load(fh)
            if existing.get("participants", 0) > 0:
                # A chain-derived file with live awards is authoritative. Never
                # overwrite it with the Airtable copy.
                skipped_existing.append(week)
                continue
            # participants == 0 means every ZOR mint for this week was reversed.
            # The Airtable still holds what the room actually awarded, so merge
            # rather than leave the week looking empty.

        col = sessions[key]
        vcol = videos.get(key)
        results, camera_on = [], []
        for row in rows:
            name = (row.get("Name") or "").strip()
            raw = (row.get(col) or "").strip()
            if name and raw:
                try:
                    respect = int(float(raw))
                except ValueError:
                    continue
                if respect <= 0:
                    continue
                results.append(
                    {
                        "name": name,
                        "wallet": wallets.get(name),
                        "rank": None,
                        "level": None,
                        "respect": respect,
                        "settled": None,
                        "title": None,
                        "reason": None,
                    }
                )
            if vcol and name and (row.get(vcol) or "").strip():
                camera_on.append(name)

        if not results:
            continue
        results.sort(key=lambda r: -r["respect"])

        tiers = {r["respect"] for r in results}
        off_curve = sorted(
            t for t in tiers if t not in DENOM_RANK_1X and t not in DENOM_RANK_2X
        )

        week_doc = {
            "week": week,
            "period_number": None,
            "date": None,
            "era": "airtable",
            "contract": None,
            "chain": None,
            "mint_type": None,
            "groups": [{"group": 1, "mode": "recorded", "results": results}],
            "video_awards": [],
            "camera_on": camera_on,
            "photos": [],
            "attendance": None,
            "participants": len(results),
            "respect_total": sum(r["respect"] for r in results),
            # Same meaning as the chain builder: rows we could not put a NAME to.
            # This era is name-first, so it is always 0; the interesting number
            # here is the inverse - names with no known wallet - which goes in
            # the notes below rather than overloading this field.
            "unnamed_wallets": sum(1 for r in results if not r["name"]),
            "sources": [
                f"csv import/Respect-Grid view.csv, column {col!r}",
                "csv import/Wallet Data-Grid view.csv (name -> wallet, where known)",
            ],
            "coverage": "partial",
            "notes": [
                "OFF-CHAIN RECORD. No settlement transaction exists for this week - "
                "the OG ERC-20 does not carry a week number, so the chain cannot "
                "confirm which week an award belongs to. Values are as recorded in "
                "Airtable, by name.",
                "Group structure is NOT known for this era. All results are in one "
                "group with mode 'recorded' rather than an invented ranking.",
            ],
        }
        if existing:
            # Carry the on-chain reversal forward so the merged week still records
            # that ZOR settlement was attempted and undone.
            week_doc["reversed_awards"] = existing.get("reversed_awards", [])
            week_doc["sources"] = existing.get("sources", []) + week_doc["sources"]
            week_doc["notes"] = existing.get("notes", []) + week_doc["notes"]
            week_doc["notes"].append(
                "MERGED: the ZOR mints for this week were fully reversed on-chain, "
                "so the live record here is the Airtable one. The reversed on-chain "
                "awards are preserved in reversed_awards."
            )

        if vcol:
            week_doc["sources"].append(f"camera-on from column {vcol!r}")
        else:
            week_doc["notes"].append("No video/camera column exists for this week.")
        no_wallet = sum(1 for r in results if not r["wallet"])
        if no_wallet:
            week_doc["notes"].append(
                f"{no_wallet} of {len(results)} people this week have no known "
                f"wallet in the Airtable map - recorded by name only, never guessed."
            )
        if off_curve:
            week_doc["notes"].append(
                f"Values off the Fibonacci curve in this week: {off_curve}. "
                f"Recorded verbatim, not corrected."
            )

        with open(target, "w", encoding="utf-8") as fh:
            json.dump(week_doc, fh, indent=2, ensure_ascii=False)
            fh.write("\n")
        built.append((week, len(results), week_doc["respect_total"], len(camera_on)))

    return built, skipped_existing, fractional


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default=os.path.expanduser("~/Documents/ZAO OS V1"))
    ap.add_argument("--out", default="weeks")
    ap.add_argument("--from-week", type=int, default=1)
    ap.add_argument("--to-week", type=int, default=73)
    args = ap.parse_args()

    built, skipped, fractional = build(args.repo, args.out, args.from_week, args.to_week)
    for week, people, total, cams in built:
        print(f"week {week}: {people} people, {total} Respect, {cams} camera-on")
    print(f"\nbuilt {len(built)} week files")
    if skipped:
        print(f"skipped {len(skipped)} weeks that already have a chain-derived file "
              f"(chain is authoritative): {skipped}")
    if fractional:
        print(f"NOT WRITTEN - sub-session columns with fractional numbers {fractional}; "
              f"they have no week slot and are left for a human to place")
