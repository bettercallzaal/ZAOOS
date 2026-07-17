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

## Ranges-per-agent: the real fix for PARALLEL agents (2026-07-17)

The `check-research-doc-collisions.sh` guard checks a new doc's number against `main` **at commit time**. That catches accidental within-commit collisions, but it **cannot** stop two agents working in parallel: each branches off `main`, both see (say) 1170 free, both use it, and the second to merge collides with the first. This happened live on 2026-07-17 - two independent agents both created a doc 1170 (`research/agents/1170-loop-memory-audit` and `research/cross-platform/1170-zao-platform-management-strategy`), plus duplicate rule numbers 26/27 in `.claude/rules/agent-loops.md`. The guard passed for both because at each one's branch time the number was free.

**The fix: each agent draws doc numbers from its own reserved band, so parallel agents can never pick the same number.** Bands are disjoint, so no coordination or shared lock is needed - a purely local rule that is collision-proof for concurrent work.

### The bands (base 1200 - above the grandfathered sequential range)

| Band | Owner |
|------|-------|
| 1200-1299 | ZOE / the tmux **builder** loop |
| 1300-1399 | Mac orchestrator / ingestion agent |
| 1400-1499 | edenfractal loop |
| 1500-1599 | zaofractal loop |
| 1600-1699 | coc loop |
| 1700-1799 | ww loop |
| 1800-1899 | social loop |
| 1900-1999 | human loop |
| 2000-2099 | Zaal / manual / reserved |

### Rules

1. **Use the next free number WITHIN your band** (the collision guard still runs as a backstop). Never take a number from another band's range.
2. **Docs numbered below 1200 are grandfathered** - the existing sequential set (and its 30+ historical collisions above) is unchanged; the bands apply to NEW docs from here forward.
3. **When a band nears full**, allocate the owner a second band (e.g. 2100-2199) in a one-line PR to this file - do not spill into a neighbour's range.
4. **Rule numbers in a shared single file** (like `.claude/rules/agent-loops.md`) are a different space: parallel appends can both grab "rule 26". There is no band fix for one file - instead, whoever merges **second** renumbers their rules to the next free number, and never union-merge the file's conflict (that silently duplicates numbers - see `agent-loops.md` rule on union-merge). Re-read the current max rule number on `main` immediately before appending.

This is the durable answer to the doc/rule-number collisions; it is the lightweight, no-shared-state version of the task-leasing / durable-execution unlock (numbering is just one resource that needs a lease).
