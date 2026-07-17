#!/usr/bin/env python3
"""
measure-pr-velocity.py — ZAO OS merged-PR velocity + composition, by ISO week.

Verifies the oft-cited "34 PRs/week" (doc 449) against the real merge history and
separates raw velocity from *product* velocity (feat/fix) vs automation (docs/tests),
so the number is honest — the agent fleet inflates raw PR count.

Requires `gh` authed to the repo (not a public API). Read-only.

USAGE
  python3 measure-pr-velocity.py            # print weekly table + JSON summary
"""
from __future__ import annotations
import json, subprocess, datetime, collections, re

def typ(t: str) -> str:
    m = re.match(r"\s*(\w+)", t or "")
    p = (m.group(1).lower() if m else "other")
    return p if p in ("test", "docs", "doc", "feat", "fix", "chore", "refactor") else "other"

def main() -> int:
    raw = subprocess.run(
        ["gh", "pr", "list", "--state", "merged", "--limit", "5000",
         "--json", "mergedAt,title"],
        capture_output=True, text=True, timeout=120,
    ).stdout
    prs = json.loads(raw or "[]")
    wk = collections.Counter()
    comp = collections.defaultdict(collections.Counter)
    for p in prs:
        m = p.get("mergedAt")
        if not m:
            continue
        dt = datetime.datetime.fromisoformat(m.replace("Z", "+00:00"))
        iso = dt.isocalendar()
        key = f"{iso[0]}-W{iso[1]:02d}"
        wk[key] += 1
        comp[key][typ(p["title"])] += 1
    weeks = sorted(wk)
    rows = []
    for w in weeks:
        c = comp[w]
        auto = c["test"] + c["docs"] + c["doc"]
        product = c["feat"] + c["fix"]
        rows.append({
            "week": w, "total": wk[w],
            "product_feat_fix": product,
            "automation_docs_tests": auto,
            "automation_pct": round(100 * auto / max(wk[w], 1)),
        })
    print(json.dumps({
        "generated_from": "gh pr list --state merged (read-only)",
        "total_merged_pulled": len(prs),
        "weeks_covered": len(weeks),
        "earliest": weeks[0] if weeks else None,
        "latest": weeks[-1] if weeks else None,
        "by_week": rows,
    }, indent=2))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
