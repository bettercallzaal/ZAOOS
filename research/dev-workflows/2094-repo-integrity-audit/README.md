---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-07-27
related-docs: 2093, 554
original-query: "Do audits on everything + fabricate info less. Overnight: repo/research-library integrity audit, every finding verified against main before reporting."
tier: STANDARD
---

# 2094 - Repo integrity audit (subagent flagged 4 high, verification left 1 low)

> **Goal:** Audit the research library's integrity AND demonstrate the anti-fabrication protocol (doc/rule `anti-fabrication.md`): every subagent finding re-checked against origin/main before it is reported. Most of the alarm dissolved.

## Headline

An audit subagent returned **1 CRITICAL + 3 HIGH + 1 MEDIUM**. Re-verified against `origin/main`, the real result is **0 critical, 1 low**. Two high/critical findings were a mis-grade or a stale-working-tree artifact. This doc records what was claimed, what was verified, and the one thing that is actually true - the intended output of the "fabricate less, audit everything" directive.

## Findings (claim -> verified)

| # | Subagent claim | Verified verdict | Evidence |
|---|----------------|------------------|----------|
| 1 | "212 duplicate doc numbers - CRITICAL, breaks linking" | **KNOWN + TOLERATED, not a bug (INFO)** | The count (212) is real, but `research/COLLISION_TOLERANCE.md` documents cross-folder number reuse as accepted policy (see also doc 554 worktree-collision postmortem, `research/_handoffs/2026-05-21-...-doc-collision-audit.md`). Numbers are unique within a folder/band; cross-folder reuse is by design. Minor real caveat: a bare `related-docs: N` can be ambiguous across folders. |
| 2 | "8 missing meetings-index refs (745-751, 1325) - HIGH" | **REAL, but LOW** | Confirmed on main: `research/events/_meetings-index.md` has rows `[745](745-...)`..`[751]` + `[1325]`, but `ls research/events/745-*` .. returns MISSING for all 8. The index over-claims recaps whose dirs are absent. Not data loss - stale index rows. |
| 3 | "5 docs missing from folder README index, guard BLOCKS - HIGH" | **FALSE POSITIVE** | 2040/2060/2038/2050/2058 are all present AND already indexed on origin/main; `add-index-row.sh` returned "already indexed - no-op" for each, and `check-research-index.sh --all` passes clean on main. The subagent ran against the local working tree (a stale `ws/` branch where those dirs show as untracked), not main. |
| 4 | "Broken internal links" | **CLEAN** (as claimed) | Sampled recent docs; relative links resolve. |
| 5 | "Empty/stub docs" | **CLEAN** (as claimed) | `find research -name README.md -size -500c` returned nothing. |
| 6 | "Untracked git artifacts" | **Local-only, not a main issue** | The `??` dirs at session start are this working tree's stale-branch state; they are committed on main (see #3). `worktrees/` is a stray local worktree dir, not tracked. |

## The one real (low) item for Zaal

**8 phantom rows in `research/events/_meetings-index.md`** (docs 745-751, 1325) point at recap directories that do not exist in `research/events/`. These are May/July meetings the index claims were recapped. Options: (a) the recaps were never written (remove the rows), (b) they were misfiled under other numbers/folders (repoint the rows), or (c) they were lost (restore from Bonfire/transcripts). Your call - it is a stale index, not a data-loss emergency. Note: doc 745 is referenced in memory (`project_jose_acabrera`) as the Jose intro recap, so at least that one was believed to exist.

## Meta: this is the anti-fabrication protocol working

Per `.claude/rules/anti-fabrication.md`, no subagent finding shipped as fact until it was re-run against `origin/main`. That turned an alarming "1 critical + 3 high" into an honest "0 critical, 1 low." The failure modes caught: an over-grade of a documented policy (#1), and a stale-working-tree artifact reported as a main-repo bug (#3). Sibling to doc 2093 where the same discipline turned "8 critical" into 1.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide the 8 phantom meetings-index rows (remove / repoint / restore) | zaal | Decision | 2026-08-05 |
| (No repo fix needed - main is clean on findings 3-6) | - | - | - |

## Sources

- `research/COLLISION_TOLERANCE.md` + doc 554 - [FULL] (the tolerated-collision policy)
- `research/events/_meetings-index.md` on origin/main vs `ls research/events/745-*..751-*,1325-*` - [FULL] (the phantom refs)
- `add-index-row.sh` no-op output + `check-research-index.sh --all` clean on main - [FULL] (finding 3 false-positive)
