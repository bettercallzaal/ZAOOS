---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-04-29
related-docs: 552, 553, 554, 555, 556, 557
tier: STANDARD
---

# 551 - Research Roadmap + Library Audit (573 docs, audit + next 30 days)

> **Goal:** Take stock of the 573-doc research library, find structural debt (dupe numbers, stale topics, floating docs, conflicts), and propose the next 30 days of research with clear ranking.

## Library Stats (verified 2026-04-29 via local filesystem)

| Metric | Value | Notes |
|---|---|---|
| Total numbered doc folders | 573 | Includes `_archive/` |
| Active categories | 13 | dev-workflows (98), agents (82), music (79), infrastructure (42), events (32), business (32), community (31), governance (30), farcaster (23), cross-platform (14), identity (10), security (7), wavewarz (5) |
| Archived | 77 docs in `_archive/` | No frontmatter, pre-frontmatter era |
| **Duplicate doc numbers across categories** | **10+** | 117, 229, 280, 281, 282, 283, 288, 289, 293, 298 |
| Floating docs (loose in `research/` root, not in category folder) | 6+ | 280-284, 288-289, 309-314 |
| Docs with `superseded-by` set | 0 | Either nothing is superseded, or nobody updates it |
| Docs with `status: draft` | 2 | `business/498-zlank-unified-sdk-concept`, `events/504-aug15-dryrun-planning` |

## Findings (Sorted by Severity)

### CRITICAL - Duplicate doc numbers

10+ numbers exist in two folders. Example: doc 280 appears in two places. This breaks the "every doc has a unique number" invariant the `/zao-research` skill assumes.

**Fix plan:**
1. List all dupe numbers with both paths.
2. For each pair, decide: keep canonical, mark the other `superseded-by` and rename.
3. Add to `/zao-research` skill: pre-flight check that the next number isn't already taken.

### HIGH - 72 FISHBOWLZ-mentioning docs vs 1 deprecation memory

Memory `project_fishbowlz_deprecated` (2026-04-16) marks FISHBOWLZ as paused / partnered with Juke. But **72 research docs still reference FISHBOWLZ** as if it's active. New readers (or new agents) will get conflicting context.

**Fix plan:**
1. Add a `status: superseded` + `superseded-by: project_fishbowlz_deprecated.md` line to the top of each FISHBOWLZ doc that's no longer active.
2. Or write doc 558 "FISHBOWLZ -> Juke transition map" that other docs can `related-docs` to.
3. Keep the historical docs (don't delete) but flag them.

### HIGH - 15 TRAE docs after SKIP decision

Memory `project_trae_ai_skip` (Doc 506) says skip TRAE for ZAO/BCZ. 15 docs still mention it. Mostly fine (research docs about a thing we evaluated and skipped is normal), but verify none are still acted on.

### MEDIUM - Floating docs (no category folder)

Docs 280-284, 288-289, 309-314 are loose in `research/` root, not under a topic. Reading the names:

- 280-289 cluster around FID/registration/Privy/agents
- 309-314 cluster around Karpathy + meta-tribe + vibe-coded apps + claude skills marketplace + music metadata

Both clusters have natural homes (`agents/`, `dev-workflows/`, `music/`). Move them.

### MEDIUM - 0 docs use `superseded-by`

The frontmatter field exists in the v2 `/zao-research` template but no one fills it. Either:
- Research never gets superseded (unlikely given pace)
- Or the field is forgotten when superseding happens

**Fix plan:** in `/zao-research` skill, when saving a new doc, prompt "does this supersede an existing doc?" If yes, write the link both ways.

### LOW - Many docs from same week with same `last-validated` date

20 docs from 2026-04-24 alone. Either healthy (a research sprint that week) or a sign of "auto-stamp instead of think." Skill should remind: re-validation is a re-read, not a re-stamp.

## Topic Coverage Gaps (vs ZAO Active Surfaces)

| ZAO surface | Research coverage | Gap |
|---|---|---|
| ZAO OS V1 client + chat | 50+ docs | Well-covered |
| ZABAL token + stake | ~10 docs | Missing: live chart stack, distribution analytics |
| ZAO Music + Cipher | 30+ docs | Missing: gasless mint mechanics, royalty split contract concrete spec |
| ZAOstock Oct 3 festival | ~10 docs (events/) | **MISSING: onchain ticketing stack, sponsor pass NFT pattern, day-of comms infra** |
| ZOE agent stack | 20+ docs | Missing: 1code comparison, agent budget enforcement |
| FISHBOWLZ -> Juke | 72 stale + 1 deprecation | Need transition map doc |
| Hypersnap fork | 1 doc + Doc 508 update | Active monitoring needed |
| QuadWork pattern | A few docs | Missing: head-to-head vs 1code, vs ECC, vs DevFleet |
| BetterCallZaal portfolio | A few docs | Low priority |

## Next 30 Days Research Slate (this PR)

This roadmap is the parent doc for **551, 552, 553, 554, 555, 556, 557**. Each is a real doc shipped in this same PR:

| Doc | Type | Tier | Why |
|---|---|---|---|
| **551** (this) | Roadmap | STANDARD | Parent / index |
| **552** | Skill library audit | STANDARD | 142 SKILL.md files, no audit ever, finally have Lazer's audit-skill (Doc 548) |
| **553** | Memory file health audit | STANDARD | 115 memory files, MEMORY.md hits 101 of 200-line cap, conflicts present |
| **554** | Worktree collision postmortem | STANDARD | Hit it 2x in one session 2026-04-29; concrete fix proposal |
| **555** | Agent harness shootout (1code vs QuadWork vs DevFleet vs ECC vs obra/superpowers vs Lazer) | DEEP | Promised in Doc 549d. Now urgent because 1code is a real Cursor-clone competitor. |
| **556** | Gasless onboarding stack for ZAOstock + Cipher mint | STANDARD | Coinbase $15K Base Gasless Campaign + Privy gas + Pimlico/Stackup paymaster comparison; ZAOstock-tied. |
| **557** | Onchain festival ticketing for ZAOstock Oct 3 | STANDARD | 5 months out. Tixbase + POAP + Unlock + Tropee + Highlight stack. Sponsor pass + ticket + attribution. |

## Future Slate (NOT in this PR, queued for next session)

| Topic | Why | Complexity |
|---|---|---|
| 558 - FISHBOWLZ -> Juke transition map | Closes the 72-stale-doc problem | Low |
| 559 - PR pipeline retrospective (Doc 461 / 523 in prod since 2026-04-25) | 4 days of telemetry | Medium |
| 560 - MCP server inventory + cost audit | What MCPs are wired, what they cost | Medium |
| 561 - 0xSplits + Cipher attribution contract spec | ZAO Music release #1 | High |
| 562 - Onchain reputation vs OG/ZOR Respect | Karma3, Ethos, EAS, OpenRank | Medium |
| 563 - Audio-first retention patterns for Juke partnership | sound.xyz, Audius, Catalog, Drip Haus | Medium |
| 564 - AI music tooling rights audit (Suno/Udio licensing for ZAO artists) | Korea voice actor crisis (Doc 508) sets precedent | Medium |
| 565 - ENS subnames live setup (memory `project_ens_subnames_todo`) | Code complete, needs on-chain session | Low (execution doc) |
| 566 - Empire Builder V3 + RaidSharks integration | Memory `project_raidsharks_empire_builder` | Medium |
| 567 - Hypersnap monthly check-in | Standing monthly research | Low |

## Action Bridge

| Action | Owner | Type | By When |
|---|---|---|---|
| Run dupe-number resolution sweep on 117/229/280/281/282/283/288/289/293/298 | Zaal or auto | One-shot script | This week |
| Move floating docs (280-289 cluster, 309-314 cluster) to category folders | Zaal or auto | Filesystem move + git mv | This week |
| Add `superseded-by` to top of each known-stale FISHBOWLZ doc | Zaal | One-shot pass | After Doc 558 lands |
| Update `/zao-research` skill v3: pre-flight dupe check + supersession prompt | Zaal | Skill PR | Next sprint |
| Ship docs 552-557 (this PR) | This session | Already done | Now |
| Queue 558-567 for future sessions | Zaal | Memory note | Updated below |

## Also See

- [552 - Skill library audit](../552-zao-skill-library-audit/)
- [553 - Memory health audit](../553-memory-file-health-audit/)
- [554 - Worktree collision postmortem](../554-worktree-collision-postmortem/)
- [555 - Agent harness shootout](../555-agent-harness-shootout/)
- [556 - Gasless onboarding stack](../556-gasless-onboarding-stack-zaostock/)
- [557 - Onchain festival ticketing](../557-onchain-festival-ticketing-zaostock/)
- [Doc 506 - TRAE skip](../506-trae-ai-solo-bytedance-coding-agent/)
- [Doc 549 - 21st.dev hub](../549-21st-dev-component-platform/)
- [Doc 548 - Lazer Mini Apps](../../farcaster/548-lazer-miniapps-cli-evaluation/)

## Sources

- Local filesystem scan of `/Users/zaalpanthaki/Documents/ZAO OS V1/research/` 2026-04-29
- Memory directory at `~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/`
- Existing memory entries: `project_fishbowlz_deprecated.md`, `project_trae_ai_skip.md`, `project_zaoos_monorepo_as_lab.md`

## Staleness Notes

This audit is point-in-time 2026-04-29. Re-run quarterly. Re-validate by 2026-07-29.
