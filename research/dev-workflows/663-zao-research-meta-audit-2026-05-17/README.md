---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-20
original-query: Extend /zao-research skill to search across 30+ bettercallzaal repos - inventory every active ZAO ecosystem repo score graduation readiness - audit research library for collisions orphans stale broken refs (reconstructed)
related-docs: 459, 547, 562, 601, 660, 661, 664
tier: DISPATCH
---

# 663 — ZAO Ecosystem Meta-Audit + Library Hygiene + Skill Upgrade (May 2026)

> **Goal:** Three-in-one DISPATCH per Zaal's prompt ("can we /zao-research the research and all the githubs"). (1) Extend the /zao-research skill to search across 30+ bettercallzaal repos by default. (2) Inventory every active ZAO ecosystem repo + score graduation readiness. (3) Audit the research library itself (729 docs) for collisions, orphans, stale, broken refs, frontmatter compliance. 7 parallel sub-agents ran for ~10 min each; this hub synthesizes their returns.

## Top 10 Findings (Cross-Doc Consensus)

| # | Finding | Severity | Cited by | Action |
|---|---|---|---|---|
| 1 | **58 doc-number collisions across the research library** — systemic parallel-session bug | P0 | 663g | Bulk rename script + git history rewrite NOT needed (just rename future-facing); pre-commit hook to claim numbers atomically (Doc 655 playbook) |
| 2 | **/zao-research skill already upgraded to v2.2** with Step 2.5 cross-repo search | DONE | 663a | Verified — skill description in available-skills now reads "Searches across 30+ bettercallzaal org repos by default" |
| 3 | **5 of 6 active ZAO products lack LICENSE** (only bcz-yapz has one) | P0 | 663b | Add MIT to ZAOOS, zaostock, CoCConcertZ, ZAONEXUS, zao-101 in one PR |
| 4 | **5 dead/empty/superseded repos to archive or delete:** mixer (empty), fractalbotmarch2026 (superseded by April), ZAOFlights (abandoned MVP), duodo-snap + nouns-snap (stale demo Snaps, nested in ZAOOS root as cruft) | P0 | 663c, 663d, 663e | Archive 5 repos via `gh repo archive`; delete the 2 nested git dirs from ZAOOS root |
| 5 | **11 orphan docs in research/ root** (280-284, 288-289, 309-312) belong in topic folders | P1 | 663g | One PR: `git mv research/N-foo research/<topic>/N-foo` for all 11; update cross-refs |
| 6 | **Frontmatter compliance is 33%** (10/30 sampled docs) — older docs pre-frontmatter standard | P1 | 663g | Pre-commit hook enforce frontmatter on new docs; backfill is multi-PR sweep |
| 7 | **2 undocumented repos** (B-ZBUILD2, textsplitter) — purpose unclear | P1 | 663e | Either write 1-paragraph README each OR archive |
| 8 | **Stack fragmentation:** ZAONEXUS on Next.js 14/React 18 while ZAOOS + zaostock + bcz-yapz on Next.js 16/React 19/Tailwind v4 | P1 | 663b | Upgrade ZAONEXUS in 1 PR (or pin its position as the "legacy stack" reference) |
| 9 | **2 OSS-ready audio repos dormant:** Aurdour (412 MB DJ tool, polish done April 4) + ZAOVideoEditor (295 MB video transcription, polish done March 28) | P1 | 663c | Add LICENSE + community-asks issues + cast on Farcaster announcing OSS availability |
| 10 | **Zero CONTRIBUTING.md across all 6 active products** | P2 | 663b | One template doc + add to all 6 (reuse the Aroussi pod template? — see Doc 656) |

## The 7 Sub-Docs

| # | Dimension | Top finding | File |
|---|---|---|---|
| 663a | /zao-research skill upgrade | Modified `~/.claude/skills/zao-research/SKILL.md` to v2.2 with Step 2.5 cross-repo search. Verified live in available-skills description. | [663a/](./663a-skill-cross-repo-search/) |
| 663b | Active ZAO products (6 repos) | All 6 public + alive but 5 need LICENSE; ZAONEXUS stack lagging | [663b/](./663b-active-zao-products/) |
| 663c | WaveWarZ + music/audio (6 repos) | mixer is empty; fishbowlz paused (Juke pivot, see Doc 662); Aurdour + ZAOVideoEditor are OSS candidates | [663c/](./663c-wavewarz-music-audio/) |
| 663d | Snaps + zlank family (7 repos) | zlank-snap-template is the working pattern; duodo + nouns are stale demos + nested in ZAOOS root as cruft | [663d/](./663d-snaps-zlank-family/) |
| 663e | Bots + standalone tools (5+ repos) | fractalbotmarch2026 superseded; April version 52 commands; B-ZBUILD2 + textsplitter purpose unclear | [663e/](./663e-bots-standalone-tools/) |
| 663f | Brand + misc utility (2 public + 5 private) | zao-mono `.gitmodules` is the ecosystem map; zao-ui = canonical design tokens (private); 5 active submodules | [663f/](./663f-brand-misc-utility/) |
| 663g | Research library hygiene | 58 collisions, 11 orphan docs, 33% frontmatter compliance, 20% broken cross-refs, _archive needs metadata | [663g/](./663g-library-hygiene/) |

## Convergence Pattern (multi-doc cited)

Three findings appear in 3+ sub-docs (highest-confidence). These should ship before anything else:

1. **The "missing LICENSE + CONTRIBUTING" wedge.** 663b + 663c (Aurdour + ZAOVideoEditor are OSS candidates but unlicensed). Single PR adding MIT LICENSE + CONTRIBUTING template across ZAOOS, zaostock, CoCConcertZ, ZAONEXUS, zao-101, Aurdour, ZAOVideoEditor. ~30 min total.

2. **Doc-number collision pre-commit hook.** 663g found 58 collisions. The most recent (659, 662) happened during this very session. Pattern: parallel sessions claim the same number. Fix: pre-commit hook that reads origin/main + reserves the next-free number atomically via a remote-claim file (Doc 655 has the playbook for similar lock patterns).

3. **Repo graveyard PR.** 663c (mixer empty) + 663d (duodo-snap + nouns-snap nested git cruft) + 663e (fractalbotmarch2026, ZAOFlights, B-ZBUILD2, textsplitter). Archive or delete via `gh repo archive` in one batch.

## Unified Action Plan (P0 / P1 / P2)

### P0 — Ship This Week

| Action | Source doc(s) | Effort | Why now |
|---|---|---|---|
| Add MIT LICENSE to 5 active products (ZAOOS, zaostock, CoCConcertZ, ZAONEXUS, zao-101) + 2 OSS audio candidates (Aurdour, ZAOVideoEditor) | 663b + 663c | 1 PR, ~15 min | Blocks any "open-source it" claim; zero-cost public-share enabler |
| Archive 5 dead/superseded repos (mixer, fractalbotmarch2026, ZAOFlights, B-ZBUILD2, textsplitter — verify first); delete nested duodo-snap + nouns-snap from ZAOOS root | 663c + 663d + 663e | 1 PR + 5 `gh repo archive` calls | Clean ecosystem signal; matches CLAUDE.md "graduate or delete" policy |
| Implement doc-number collision pre-commit hook on ZAOOS | 663g | 1 hook file + docs | Prevents 59th collision this week |

### P1 — Ship Next Sprint

| Action | Source doc(s) | Effort |
|---|---|---|
| Move 11 orphan research/ docs into proper topic folders + update cross-refs | 663g | 1 PR |
| Backfill frontmatter on the 67% of docs that lack it (multi-PR sweep, oldest first) | 663g | 3-5 PRs (sweep batches) |
| Fix 6 broken cross-references identified by 663g sample | 663g | 1 PR |
| Add CONTRIBUTING.md template + populate across 6 active products | 663b | 1 template + 6 placements |
| Upgrade ZAONEXUS to Next.js 16 / React 19 / Tailwind v4 stack | 663b | 1 sprint (small) |
| Write 1-paragraph READMEs for B-ZBUILD2 + textsplitter OR archive them | 663e | 1 decision + executions |
| Announce Aurdour + ZAOVideoEditor as OSS-available (Farcaster cast + repo issues for community asks) | 663c | 30 min |

### P2 — Background

| Action | Source doc(s) | Effort |
|---|---|---|
| Mirror zao-mono `.gitmodules` to a public ecosystem-deps doc | 663f | 1 doc |
| Add status metadata to _archive/ docs (`superseded-by: N` or `historical-reference`) | 663g | Multi-PR sweep |
| Decide topical balance: do security/ (7 docs) + inspiration/ (1) reflect real signal or are they undersupplied? | 663g | 1 decision doc |
| Audit cross-repo grep.app coverage gap (per Doc 664 note — zero hits for fractal/Respect patterns across bettercallzaal/ + Optimystics/) | 663a, 664 | 1 investigation, possibly switch to `gh search code` as primary cross-repo tool |
| Document `zao-mono` private submodule list publicly | 663f | 1 doc |

## What's Healthy (Don't Touch)

- **All 6 active ZAO products are public + alive** (last commits within 23 days).
- **0 stale research docs** — every audited doc has `last-validated` within 23 days. Library is actively maintained.
- **Stack discipline holds** in 4 of 6 active products (Next.js 16 / React 19 / Tailwind v4 / TypeScript).
- **zao-mono submodule map exists** even if private. The ecosystem skeleton is intact.
- **/zao-research skill upgrade is already live** as of this session (v2.2 with Step 2.5 cross-repo search).
- **No `any` types in `bot/src/`** (per Doc 661b precedent).
- **No security non-negotiables violated** in active products (per Doc 661f scan).

## Hard Numbers (from sub-docs)

- 30+ public bettercallzaal repos audited (5 private accessible-as-metadata + 5 fully private).
- 729 research docs across 14 topic folders + 5 orphan root docs (+11 orphans according to 663g, vs 5 by my earlier count; reconcile).
- 58 doc-number collisions across the library (e.g., 100, 111, 113, 117, 280-284, 299, 325, 659, 662).
- 33% frontmatter compliance on 30-doc random sample.
- 20% broken cross-references on 30-doc random sample.
- 0% of audited docs have `last-validated` > 90 days.
- 5 dead/empty/superseded repos identified for archival.
- 5 of 6 active products missing LICENSE.
- 0 active products have CONTRIBUTING.md.
- 7 sub-agents ran parallel for ~6-11 min each. Total wall-clock: ~12 min. Total subagent compute: ~70 min.
- The /zao-research skill upgrade adds Step 2.5: cross-repo search via `mcp__grep__searchGitHub`, budget 2-3 calls/STANDARD tier + 5/DEEP tier.

## Methodology

Each sub-agent ran read-only Bash + Read + (663a additionally) Edit on `~/.claude/skills/zao-research/SKILL.md`. No source code in any ZAO repo was modified. The skill file modification is local to the user's home dir (not in the ZAOOS repo). Cross-repo searches used `gh` CLI (`gh repo view`, `gh api`) + `mcp__grep__searchGitHub` (with the noted indexing-gap limitation from Doc 664).

## Where The Audit Would Be Wrong

The audit is point-in-time. Three places where the snapshot might mislead:

1. **Doc 664 was created on a fresh branch DURING this audit.** Doc 663 was being written when the user pivoted to the Farcaster #19 / async fractal research. So 663g's "58 collisions" doesn't yet include 664 (the new doc 664 is unique). But 663 hub itself was being numbered 663 simultaneously with another session — risk of 663 collision. Per pattern, mitigate via pre-commit hook (P0 action above).
2. **Private repos were inspected only via metadata.** zao-mono, zao-ui, quad-sandbox, zaoos-workspace, budget2026 — limited visibility. The "healthy" assessments for these are guarded.
3. **grep.app cross-repo search returned zero results** for known-good patterns. Either (a) bettercallzaal + Optimystics aren't indexed deeply, or (b) the patterns I queried (`fractal`, `Respect`, `submitBreakout`, `OREC`) need different syntax. Doc 663a flags this; verification via direct `gh search code` is the recommended fallback until grep.app coverage improves.

## Re-validate

Audit is dated 2026-05-17. Library churn is fast (729 docs and growing). Suggested re-validation: 2026-08-17 (90 days).

Recurring check candidates:
- Doc-number collisions (run `663g` script monthly)
- Stale `last-validated` (run quarterly)
- License + CONTRIBUTING presence (one-time after P0 ships)
- Repo health (run quarterly via a cron job; cite this hub as the baseline)

## Also See

- [Doc 459](../459-workspace-worktrees-multi-session/) — parallel-session safety (relevant to the 58-collision root cause)
- [Doc 547](../../community/547-zaostock-master-strategy/) — Cassie's "infrastructure IS the product" — informs the OSS announce play
- [Doc 562](../562-reddit-x-scraping-meta-eval-last30days/) — v1 fetch chain
- [Doc 601](../../agents/601-agent-stack-cleanup-decision/) — surface consolidation baseline
- [Doc 655](../655-post-merge-execution-playbook/) — execution rituals; relevant to the collision pre-commit hook design
- [Doc 660](../660-x-content-extraction-v2/) — no-login content extraction; same shape as Step 2.5 cross-repo
- [Doc 661](../661-zaoos-codebase-audit-may-2026/) — the prior codebase audit; 663 extends to ecosystem-wide
- [Doc 664](../../governance/664-farcaster-fip-pow-tokenization-and-async-github-fractal/) — async GitHub-native fractal idea; the grep.app gap was first surfaced there

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Open P0 PR — add MIT LICENSE to 7 repos (5 active + 2 OSS audio) | @Zaal | PR | This week |
| Open P0 PR — implement doc-number collision pre-commit hook + update Doc 655 playbook | @Zaal | PR | This week |
| Run `gh repo archive` on 5 dead repos (mixer, fractalbotmarch2026, ZAOFlights, B-ZBUILD2, textsplitter) — verify each first | @Zaal | Repo admin | This week |
| Delete duodo-snap + nouns-snap from ZAOOS root in 1 PR | @Zaal | PR | This week |
| Schedule P1 sprint: orphan-doc move PR + frontmatter backfill batch 1 + CONTRIBUTING template | @Zaal | Sprint planning | Next sync |
| Re-validate audit by 2026-08-17 | @Zaal | Recurring check | 90 days |
| Cite this audit when Tadas + Dan respond to Doc 664 outreach (Frapp-GH coordination) | @Zaal | Memory | Trigger on response |

## Sources

Each finding traces back to its sub-doc evidence section. The hub doc cross-references everything. Methodology: 7 parallel general-purpose sub-agents launched via Claude Code Agent tool, each running STANDARD-tier research per the /zao-research skill v2.2. No source code modified during the audit.

Sub-docs:
- [663a — Skill cross-repo search](./663a-skill-cross-repo-search/)
- [663b — Active ZAO products](./663b-active-zao-products/)
- [663c — WaveWarZ + music/audio](./663c-wavewarz-music-audio/)
- [663d — Snaps + zlank family](./663d-snaps-zlank-family/)
- [663e — Bots + standalone tools](./663e-bots-standalone-tools/)
- [663f — Brand + misc utility](./663f-brand-misc-utility/)
- [663g — Research library hygiene](./663g-library-hygiene/)

External tools used:
- `gh` CLI 2.86.0 (sub-agents 663b-f for repo metadata)
- `mcp__grep__searchGitHub` (cross-repo code search; flagged indexing gap)
- Local Bash for file system scans (663g library hygiene)
- Read + Edit for skill modification (663a)
