#!/usr/bin/env python3
"""
Validate every weeks/week-NNN.json against the convention in README.md.

Why this exists: research/** is auto-merged by docs-automerge.yml using
GITHUB_TOKEN, and GitHub does not start a workflow run for a push made with
that token - so the merge result gets ZERO CI (measured 2026-08-12, doc 2291).
The daily scheduled run on main catches problems the NEXT MORNING; it does not
gate them. A downstream reader of this convention (e.g. the RunAwardsTab work
on feat/fractal-run-awards) would inherit anything broken here.

So: assert it from this branch, before the merge. Exits non-zero on any
failure - a missing input or an unreadable file is a FAIL, never a skip.

Usage: python3 validate-weeks.py [--dir weeks]
"""

import argparse
import glob
import json
import os
import re
import sys

DENOM_RANK_2X = {110: 1, 68: 2, 42: 3, 26: 4, 16: 5, 10: 6}
DENOM_RANK_1X = {55: 1, 34: 2, 21: 3, 13: 4, 8: 5, 5: 6}

REQUIRED_TOP = [
    "week", "period_number", "date", "era", "contract", "chain", "mint_type",
    "groups", "video_awards", "camera_on", "photos", "attendance",
    "participants", "respect_total", "unnamed_wallets", "sources",
    "coverage", "notes",
]
REQUIRED_RESULT = ["name", "wallet", "rank", "level", "respect", "settled"]
VALID_ERA = {"og", "zor", "airtable"}
VALID_MODE = {"ranked", "even_split"}
VALID_COVERAGE = {"partial", "complete"}


def validate(directory: str) -> list:
    fails = []

    def fail(where, msg):
        fails.append(f"{where}: {msg}")

    paths = sorted(glob.glob(os.path.join(directory, "week-*.json")))
    if not paths:
        fail(directory, "no week-*.json files found - refusing to pass vacuously")
        return fails

    seen_weeks = set()
    for path in paths:
        base = os.path.basename(path)
        try:
            with open(path, encoding="utf-8") as fh:
                week = json.load(fh)
        except Exception as exc:  # unreadable or malformed = FAIL, not skip
            fail(base, f"could not parse: {exc}")
            continue

        match = re.fullmatch(r"week-(\d{3})\.json", base)
        if not match:
            fail(base, "filename does not match week-NNN.json")
            continue

        for key in REQUIRED_TOP:
            if key not in week:
                fail(base, f"missing required key '{key}'")
        if fails and any(base in f for f in fails[-len(REQUIRED_TOP):]):
            pass  # keep going; report everything

        if week.get("week") != int(match.group(1)):
            fail(base, f"filename week {match.group(1)} != week field {week.get('week')}")
        if week.get("week") in seen_weeks:
            fail(base, f"duplicate week number {week.get('week')}")
        seen_weeks.add(week.get("week"))

        if week.get("era") not in VALID_ERA:
            fail(base, f"era {week.get('era')!r} not in {sorted(VALID_ERA)}")
        if week.get("coverage") not in VALID_COVERAGE:
            fail(base, f"coverage {week.get('coverage')!r} not in {sorted(VALID_COVERAGE)}")
        if not week.get("sources"):
            fail(base, "sources is empty - every week must be traceable")
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(week.get("date", ""))):
            fail(base, f"date {week.get('date')!r} is not YYYY-MM-DD")

        people = 0
        total = 0
        unnamed = 0
        for group in week.get("groups", []):
            gid = group.get("group")
            if group.get("mode") not in VALID_MODE:
                fail(base, f"group {gid}: mode {group.get('mode')!r} invalid")
            wallets = set()
            for result in group.get("results", []):
                for key in REQUIRED_RESULT:
                    if key not in result:
                        fail(base, f"group {gid}: result missing '{key}'")
                wallet = result.get("wallet", "")
                if not re.fullmatch(r"0x[0-9a-fA-F]{40}", str(wallet)):
                    fail(base, f"group {gid}: wallet {wallet!r} is not a 20-byte address")
                if wallet.lower() in wallets:
                    fail(base, f"group {gid}: wallet {wallet} appears twice in one group")
                wallets.add(wallet.lower())

                respect = result.get("respect")
                if not isinstance(respect, int) or respect <= 0:
                    fail(base, f"group {gid}: respect {respect!r} not a positive int")
                rank, level = result.get("rank"), result.get("level")
                expected = DENOM_RANK_2X.get(respect) or DENOM_RANK_1X.get(respect)
                if group.get("mode") == "ranked":
                    if rank != expected:
                        fail(base, f"group {gid}: respect {respect} implies rank {expected}, got {rank}")
                    if level is not None and rank is not None and 7 - level != rank:
                        fail(base, f"group {gid}: level {level} and rank {rank} disagree")
                if rank is None and group.get("mode") == "ranked":
                    fail(base, f"group {gid}: ranked result has rank null")

                people += 1
                total += respect if isinstance(respect, int) else 0
                if not result.get("name"):
                    unnamed += 1

        if week.get("participants") != people:
            fail(base, f"participants {week.get('participants')} != {people} counted")
        if week.get("respect_total") != total:
            fail(base, f"respect_total {week.get('respect_total')} != {total} summed")
        if week.get("unnamed_wallets") != unnamed:
            fail(base, f"unnamed_wallets {week.get('unnamed_wallets')} != {unnamed} counted")

        att = week.get("attendance")
        if att is not None and isinstance(att, int) and att < people:
            fail(base, f"attendance {att} is below {people} people who received awards")

    return fails


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", default="weeks")
    args = ap.parse_args()

    problems = validate(args.dir)
    count = len(glob.glob(os.path.join(args.dir, "week-*.json")))
    if problems:
        print(f"FAIL - {len(problems)} problem(s) across {count} week file(s):")
        for problem in problems:
            print(f"  {problem}")
        sys.exit(1)
    print(f"PASS - {count} week file(s) valid against the README convention.")
