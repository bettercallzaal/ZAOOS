---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-09-25
superseded-by:
related-docs: "dev-workflows/030-bettercallzaal-github, dev-workflows/2467-agent-skill-collections, dev-workflows/507-claude-skills-1116-ecosystem-zao-picks"
original-query: "while reviewing harness and more can we review all the repos i have stared and /zao-research over all ofthem"
tier: STANDARD
---

# 2556 - The 125 starred repos: what to adopt, what to drop, and the two already starred that answer the harness question

> **Goal:** Audit every repository `bettercallzaal` has starred, find what is live and load-bearing, what is abandoned, and what was starred and never used.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **ADOPT `thedotmack/claude-mem`.** Apache-2.0, 94,655 stars, pushed 2026-09-25. | "Persistent Context Across Sessions." It is starred and referenced in **zero** files of the estate. The dotfiles2 lane sat at 63% context for a day on 2026-09-25 with no mechanism but a hand-written handoff. This is that mechanism, already chosen and never installed. |
| 2 | **READ `affaan-m/ECC` before designing anything new.** MIT, 267,124 stars, pushed 2026-09-24. | Its own description is "the agent harness performance optimization system". Zaal emailed Brandon Ducar about harness design on 2026-09-25; this repo was starred before that email and appears in **zero** files of the estate. |
| 3 | **DROP nothing, but stop treating the tail as a reading list.** 43 of 125 starred repos have 2 stars or fewer. | Those are personal repos and one-file templates. They are bookmarks, not dependencies, and counting them as "125 things to evaluate" is what makes the set look unmanageable. |
| 4 | **The starred set is an agent-tooling collection, not a general one.** 38 of 125 cluster as agent/Claude tooling; the top 12 by stars are almost all agent infrastructure. | This is the single most useful fact about the list. It is a harness reading list that nobody has read as one. |
| 5 | **SKIP the 12 repos with no push in 120+ days** unless something specific is wanted from them. | `rijn/simplifiapi` last moved 1,034 days ago. `ourzora/nouns-protocol` 762 days. Both are cited in doc 030 as ZAO-relevant and neither has moved since. |

## The measurement

Pulled 2026-09-25 04:5x via `gh api --paginate user/starred?per_page=100` as `bettercallzaal`.

| Fact | Value |
|---|---|
| Starred repos | **125** |
| Archived | **0** |
| Pushed in 2026-09 | **61** (49%) |
| Languages | TypeScript 49, Python 25, JavaScript 16, HTML 10, Shell 5, Rust 3 |
| Repos with 2 stars or fewer | **43** (34%) |
| No push in 120+ days | **12** |

### Clusters

| Cluster | Repos | No push in 90+ days |
|---|---|---|
| agent / Claude tooling | 38 | 6 |
| web3 / onchain | 15 | 6 |
| infra / devtools | 15 | 5 |
| music / audio | **10** | **0** |
| farcaster / social | 5 | 1 |
| unclassified | 42 | 10 |

The unclassified 42 is a limit of the classifier, which keys on name and description text only - it is reported as a gap rather than hidden. **The music cluster is the only one with zero abandoned repos**, which is worth noting for a music organisation: the music bets are all still alive.

## The finding that matters

**Two of the highest-starred repos in the set are about the exact problem being worked on this week, and neither has been touched.**

Measured by exact-string search across `~/.claude/skills`, `~/bin` and `~/zaal-dotfiles/claude`, with a control string that must not appear (0 hits) and one that must (14 hits):

| Repo | Stars | Licence (read from the LICENSE file) | Files in the estate referencing it |
|---|---|---|---|
| `obra/superpowers` | 291,360 | MIT, Jesse Vincent | **4** (as `superpowers:`) - in use |
| `mvanhorn/last30days-skill` | 62,780 | MIT | **14** - in use, wired into `/zao-research` |
| `affaan-m/ECC` | 267,124 | MIT, Affaan Mustafa | **0** |
| `thedotmack/claude-mem` | 94,655 | Apache-2.0 | **0** |
| `browser-use/browser-use` | 116,232 | MIT | **0** |
| `msitarzewski/agency-agents` | 154,569 | MIT | **0** |

Licences were read from the LICENSE file, not the API field, per Hard Requirement 13. All four checked matched their API value this time, which is worth recording because it has been wrong before.

## What this says about the harness

The estate has **255 tools in `~/bin`, 137 of which carry a refusal path**, and **67 skills**. It logs its own mistakes by shape: `surface-cannot-report-state` has been logged **25 times** and `unmeasured-prediction-in-a-record` **12 times**.

That is a mature harness built almost entirely in-house. The starred list shows the alternative was available the whole time and was bookmarked rather than read.

**This is not an argument to replace anything.** The in-house refusals work - on 2026-09-24 they refused eleven times in a day and every refusal was correct. It is an argument that the next harness question should start with the two repos above rather than from scratch.

## Also See

- [dev-workflows/030 - bettercallzaal GitHub Projects Inventory](../030-bettercallzaal-github/) - has a "Starred Repos (Key Interests)" section, **last-validated 2026-05-21, covering 11 repos**. This doc supersedes that section: 125 repos, four months later. Of its 11, `ourzora/nouns-protocol` and `builders-garden/farclaw` have not moved in 762 and 197 days.
- [dev-workflows/2467 - Agent-skill collections at scale: what to take, what to refuse](../2467-agent-skill-collections/)
- [dev-workflows/507 - Claude Skills 1,116 Ecosystem, ZAO Curated Picks](../507-claude-skills-1116-ecosystem-zao-picks/)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Install `thedotmack/claude-mem` on one lane (dotfiles2, the one at 63% context) and report whether a compaction survives it | @Zaal | Spike, reported in a vault note | 2026-10-06 |
| Read `affaan-m/ECC` and answer one question in writing: does it gate the human-send effector, or only machine effectors | @Zaal | Vault note | 2026-10-06 |
| Update `dev-workflows/030` Starred Repos section to point at this doc instead of listing 11 repos | @Zaal | PR | 2026-10-10 |
| Decide whether `browser-use` replaces the claude-in-chrome route that refuses reddit.com | @Zaal | Decision recorded in a grill file | 2026-10-10 |

Every action is dated after 2026-10-03 on purpose. ZAOstock is 8 days out at the time of writing and none of this is festival work.

## Sources

- [GitHub REST `user/starred`](https://api.github.com/user/starred) - **[FULL]**, method: `gh api --paginate`, 125 records with stars, language, pushed_at, archived, licence and description. Pulled 2026-09-25.
- [obra/superpowers](https://github.com/obra/superpowers) - **[FULL]**, method: `gh api` repo metadata plus `gh api contents/LICENSE` decoded.
- [affaan-m/ECC](https://github.com/affaan-m/ECC) - **[FULL]**, method: same.
- [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem) - **[FULL]**, method: same.
- [stablyai/orca](https://github.com/stablyai/orca) - **[FULL]**, method: same.
- Local estate counts - **[FULL]**, method: `ls ~/bin | wc -l`, `grep -lE 'REFUS|refuse|exit 2' ~/bin/*`, `ls ~/.claude/skills`, and shape counts from `~/zao-vault/MISTAKES.md`.
- [dev-workflows/030](../030-bettercallzaal-github/) - **[FULL]**, read from disk.

**No community source (Reddit / HN / X) was fetched for this doc.** The subject is one account's own starred list, which no community thread discusses. Hard Requirement 7 is therefore not met and is declared here rather than padded with an unrelated thread.
