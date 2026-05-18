# Research Doc-Number Collision Policy

## Rule (from 2026-05-18 forward)

Every new doc gets a unique number across `research/<topic>/`. Enforced by `scripts/check-research-doc-collisions.sh` invoked from `.husky/pre-commit`.

## Historical collisions (grandfathered)

30+ doc numbers already had collisions on `main` as of 2026-05-18. They are NOT being renamed because:

- Each cross-references many other docs via `[Doc N](../N-old-name/)` links
- A coordinated rename would touch hundreds of files and break the link graph in unpredictable ways
- Renaming is high-blast-radius for low impact - readers find docs by path/title, not number

### Numbers in use multiple times on main

`040, 051 (x7), 057, 117, 159 (x3), 172, 229, 241, 243, 293, 298, 299 (x3), 305, 306 (x3), 307, 313 (x5), 314, 315, 319 (x3), 320 (x3), 321, 322 (x3), 323 (x3), 324, 325, 326, 327, 328, 329, 333, 662, 665`

(Verified via `git ls-tree -r origin/main | grep -E '^research/[^/]+/[0-9]+-' | sed -E 's|^research/[^/]+/([0-9]+)-.*|\1|' | sort -n | uniq -c | awk '$1 > 1 { print $2, $1 }'`)

## In-flight collision risk

As of 2026-05-18 there is one open PR (#555) with a doc 668 directory that will collide with merged doc 668 (this session's `668-zaocoworking-bot-audit/`) if merged as-is. Resolution path: parallel session renames to next-free (671+) before merge.

## How to override (rare)

If you are intentionally co-locating related docs under one number, document the intent in your commit message and bypass the hook for that specific commit. The guard is there to catch accidental collisions, not to block legitimate co-location.

## Why historical collisions are NOT auto-fixed

A renaming pass would need to:
1. `git mv` 30+ folders
2. Rewrite ~50+ cross-references across docs
3. Update any memory files that name docs by number
4. Notify any external readers (Iman, agent contexts, ZOE's prompts) that cite specific numbers
5. Verify no agent prompt has a number hardcoded
6. Take a backup tag so the link graph stays revertable

The current state (30+ collisions, all readable, all unique-by-slug) is tolerable as a soft problem. The collision GUARD prevents the problem from compounding.

If a future need arises to clean the historical set (e.g. agent ingestion that hashes by number), a dedicated cleanup PR can do it then - not now.
