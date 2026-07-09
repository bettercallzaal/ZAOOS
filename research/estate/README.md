# Estate - repo, GitHub, and project bloat cleanup

> The working folder for cleaning up ZAO's sprawl: dead/duplicate GitHub repos, the research-doc numbering breakdown, the leaky ZOE research pipeline, and any other "we have too much of this and it's not organized" problem. Created 2026-07-09 at Zaal's ask.

This is the hub. Detailed findings live in numbered research docs (linked below); the ongoing cleanup checklist lives here.

## Open problems + status

| # | Problem | Evidence | Status | Owner |
|---|---------|----------|--------|-------|
| 1 | **GitHub repo sprawl** - 129 repos, ~20 canonical, ~60-70 dead/dup/one-off | [Doc 998](../infrastructure/998-github-repo-estate-audit/) | Audit done; archive list drafted (58 safe + 14 review-first, `archive-repos.sh`); NOT yet executed | @Zaal to approve archives |
| 2 | **fractalbot monthly-rebuild antipattern** - 10 fractalbot repos, ~8 stale reboots | Doc 998 | Consolidate to fractalbotjuly2026 + ZAOfractal, iterate not rebuild | @Zaal |
| 3 | **Research-doc numbering is broken** - 202 doc numbers collide (doc 441 used 13x, 600 8x, 051 7x; recent 986/987/988/992 each 2x). Every agent computes max+1 off main and collides. | `git ls-files research/*/[0-9]*` dedup | Diagnosed. Needs a shared allocator OR a switch to a collision-proof ID scheme | @Zaal to pick fix |
| 4 | **ZOE research pipeline leaks** - explicit research lands as UNMERGED PRs with colliding numbers (raidguild = doc 990 = PR #1143, open); failed tasks (techfrenAJ) + needs-revision (mission-control) produce nothing; proactive Telegram research (SEO/YT blurbs) never committed | This session's audit, 2026-07-09 | Diagnosed. Needs: auto-merge-or-flag, retry-on-fail, and commit-proactive-research | @Zaal to pick fix |
| 5 | **Naming chaos** - ZAO-Video-Editor vs ZAOVideoEditor, zao-101/ZAO101, zao-stock/zaostock/ZAOstock, ZAOscout x3 | Doc 998 | Needs a naming convention + canonical-repo ledger (REPOS.md) | @Zaal |
| 6 | **Repo bloat** - 6 repos >150MB (chat 206MB, songjam-site 165MB, eliza1 158MB, zaloraV1 155MB, newsletter-bot-1 155MB) committing node_modules/media | Doc 998 | Archive the dead ones; .gitignore node_modules on any kept | @Zaal |

## Artifacts
- **Archive script:** `archive-repos.sh` (in the session scratchpad; `bash archive-repos.sh` dry-runs, `--go` archives the 58 safe repos; 14 review-first printed). Reversible via `gh repo unarchive`.
- **Doc 998** - full estate audit with keep/consolidate/archive tables.

## The doc-numbering fix (options - for #3 above)
1. **Shared allocator file** - a `research/.doc-counter` committed file that each agent atomically bumps (still races on parallel commits).
2. **Reserved ranges per agent** - ZOE gets 2000-2999, terminals get 3000+, etc. Simple, collision-proof by construction.
3. **Timestamp/date IDs** - drop sequential numbers; use `YYYYMMDD-slug`. Collision-proof, but breaks the "doc NNN" shorthand everyone uses.
4. **Accept collisions, dedup by slug** - stop treating the number as unique; the folder slug is the real key. Lowest effort.

Recommendation pending Zaal's call. Range-per-agent (option 2) is the cleanest for the multi-agent reality.

## Next actions
| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Approve + run the repo archive list (58 safe) | @Zaal | Decision + script | 2026-07-11 |
| Pick the doc-numbering fix (recommend option 2, ranges-per-agent) | @Zaal | Decision | 2026-07-11 |
| Pick the ZOE-research-pipeline fix (auto-merge-or-flag + retry + commit-proactive) | @Zaal | Decision | 2026-07-11 |
| Merge or close the orphaned raidguild PR #1143 (doc 990 collision) | @Zaal | PR | 2026-07-10 |
