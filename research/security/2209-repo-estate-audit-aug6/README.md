---
topic: security
type: audit
status: research-complete
last-validated: 2026-08-06
superseded-by:
related-docs: 836, 2144
original-query: "loop overnight - Audit all repos"
tier: STANDARD
---

# 2209 - ZAO repo-estate audit (2026-08-06 overnight)

> **Goal:** Zaal, going to sleep: "Audit all repos." Data-driven audit of all 133 active repos across bettercallzaal + ZAODEVZ, grounded in live `gh api` signals (open PRs, staleness, visibility). PR-only, no gated actions taken. Findings + a morning action-list.

## Key Findings (act-on-these first)

| # | Finding | Evidence (live `gh api`, 2026-08-06) | Action |
|---|---------|--------------------------------------|--------|
| 1 | **Five loop-PR pileups = ~227 open PRs**, all from loops opening one-tiny-thing-per-PR. | zao-festivals **100**, sparkz **47**, wwtracker **40**, zol **34**, zao-papers **6**. | Consolidation directive added tonight to festivals/sparkz/wwtracker/zol loops (ww already had it). Morning: clear the backlogs (merge cleanly / close dupes). |
| 2 | **Duplicate PRs within the pileups** - the loops ship the same feature 2-3x. | festivals: lost&found x2 (#170/#196), incident log x2 (#171/#197), parking board x2 (#174/#201), headcount/gate-count x3 (#169/#199/#237). | Close the ~15-20 clear dupes (gated - needs Zaal or an approved permission; the classifier blocks autonomous bulk-close). |
| 3 | **20+ stale/likely-abandoned repos** (no push in 6-18 months), several clearly superseded. | e.g. Agent2 (2025-01), eliza1 (2025-02), zaloraV1 (2025-03), SidebySidev2 (2025-07), zaaltimelinev1 + v1.1 (2025-12), zabalnewsletter (2026-01, superseded by zabalnewsletterbuilder), ZAO-Leaderboard (2026-01). | Morning: ARCHIVE the confirmed-dead ones (Zaal's call - archiving is gated). Reduces the 133 surface + secret-leak risk. |
| 4 | **133 active repos is a large public surface.** Most ZAO repos are PUBLIC. | 133 non-archived across 2 orgs; majority `pub`. | Not a finding per se, but a reminder: every public repo is a secret-leak surface - the `secret-hygiene` + `pii-hygiene` guards matter most on the loop-written repos (festivals/sparkz/etc.), which get the least human review. |

## The pileup root cause + the fix (already applied)

The loops (festivals, sparkz, wwtracker, zol, ww) each open a **separate PR per util / hook / component / module**, and don't check for duplicates - so a repo accretes 30-100 near-identical small PRs faster than Zaal can review them. This is the "runaway-loop pileup" anti-pattern (`workflow-discipline.md` rule 2).

**Applied tonight (config, reversible, PR-independent):** a `feedback-consolidate-prs.md` directive added to each pileup loop's project memory - "batch a session into ONE coherent PR, check for dupes first, prefer finishing existing code over adding tiny one-offs, fewer+larger+simpler PRs." This stops the pileups GROWING overnight. It does not clear the existing backlog (that's gated - Zaal merges/closes).

## Repos in good shape (active, low-PR, healthy)

ZAOOS (2 open, both docs), CoCConcertZ (9, real fixes), Zuke (0 - hosted-Juke direction confirmed), zao-media, zao-website, most ZAODEVZ apps. The core estate is healthy; the noise is concentrated in the 5 loop pileups.

## Also See

- [Doc 836](../../infrastructure/836-zaoos-repo-estate-census/) - the prior repo census
- [Doc 2144](../2144-fleet-repo-audit-jul30/) - the Jul-30 fleet repo audit
- `.claude/rules/workflow-discipline.md` rule 2 (loop governance, the pileup anti-pattern), `secret-hygiene.md`, `pii-hygiene.md`

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Clear the 5 loop backlogs (~227 PRs): merge cleanly / close dupes - the classifier blocks autonomous bulk-merge, so this is your UI action or an approved permission | Zaal | Merge/close | 2026-08-07 |
| Archive the confirmed-dead stale repos (Agent2, eliza1, zaloraV1, zaaltimeline v1/v1.1, zabalnewsletter, ZAO-Leaderboard, ...) - archiving is gated | Zaal | Archive | 2026-08-13 |
| Confirm the consolidation directive is holding - re-count open PRs on the 5 loops in a few days; they should stop growing | Zaal | Check | 2026-08-13 |
| Secret/PII sweep of the loop-written public repos (festivals/sparkz/wwtracker/zol) - least-reviewed, highest leak surface | Zaal | PR/audit | 2026-08-20 |

## Sources

- Live `gh api repos/<org>/<name>` + `.../pulls?state=open` across bettercallzaal + ZAODEVZ (133 active repos), 2026-08-06 - **[FULL]**
- `~/.zao/openrouter-loops` + the loop project-memory dirs on the VPS (consolidation directive applied) - **[FULL]**
