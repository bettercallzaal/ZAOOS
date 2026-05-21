---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-20
original-query: Comprehensive 8-dimension audit of ZAO OS V1 monorepo against stated rules - surface what has drifted what is dead what is ready to graduate (reconstructed)
related-docs: 154, 459, 547, 601, 650, 655, 660
tier: DISPATCH
---

# 661 — ZAOOS Codebase Audit (May 2026)

> **Goal:** Comprehensive 8-dimension audit of the ZAO OS V1 monorepo against its own stated rules (CLAUDE.md, .claude/rules/*, doc 601 primary-surface decision). Surface what's drifted, what's dead, what's ready to graduate. 8 sub-agents ran in parallel; this hub is the synthesis.

## Top 10 Findings (Cross-Doc Consensus)

| # | Finding | Severity | Cited by | Action |
|---|---|---|---|---|
| 1 | **FISHBOWLZ code still active in 5 places** despite being killed 2026-05-04 | P0 | 661a, 661c, 661d, 661h | DELETE all `fishbowlz/` paths in one PR |
| 2 | **CLAUDE.md numbers are stale on every count** (routes 301→324, components 279→294, research 540+→729) | P0 | 661c, 661d, 661f | Patch CLAUDE.md headline section + remove "540+ research docs" claim |
| 3 | **ZAOstock graduation deadline passed** (2026-04-29) but code still in monorepo | P0 | 661f, 661h | Set new explicit date + ship the spinout per BCZ YapZ pattern (PR #480) |
| 4 | **84 npm vulnerabilities** (4 Critical, 26 High) in top-level package.json | P0 | 661g | Triage Critical/High; the 1 fixable now is `ws` via `@ardrive/turbo-sdk` v1.13 (breaking) |
| 5 | **122 inline style violations across 63 components** (forbidden per .claude/rules/components.md) | P1 | 661d | Sweep music/ + calls/ first (highest concentration), then global lint rule |
| 6 | **8/17 root files in `bot/src/` are ZAOstock-specific** (actions, capture, zsfb, circles, onepagers, status, schedule, digest) | P1 | 661b | Move to `bot/src/teams/` before ZAOstock graduates so the spinout is clean |
| 7 | **`duodo-snap/` + `nouns-snap/` are nested git repos** committed as cruft | P1 | 661e | Delete + .gitignore the snap pattern |
| 8 | **Magnetiq + AttaBotty bots added 2026-05-11 without doc** (per "no new bots without doc" CLAUDE.md rule) | P1 | 661a | Write retroactive numbered doc OR remove. Don't leave undocumented. |
| 9 | **Turbo monorepo is misconfigured** (`apps/` near-empty, scripts don't parallelize) | P2 | 661g | Either commit to turbo workspace or remove turbo:* scripts |
| 10 | **5 components > 600 LoC** (UsersTable 834, MusicSidebar 802, chat Sidebar 730, ComposeBar 662, DiscordLinkManager 649) | P2 | 661d | Refactor + tests during respective surface graduation prep |

## The 8 Sub-Docs

| # | Dimension | Key win | File |
|---|---|---|---|
| 661a | Primary-surface drift | FISHBOWLZ 26 files still active despite 2026-05-04 kill; Magnetiq/AttaBotty undocumented | [661a/](./661a-primary-surface-drift/) |
| 661b | bot/src/ sprawl | 8 root files belong in `teams/` subdir; hermes/ + zoe/posts/ need index.ts | [661b/](./661b-bot-src-sprawl/) |
| 661c | API route taxonomy | 324 routes (not 301); 90% auth+Zod coverage; fishbowlz routes still live | [661c/](./661c-api-route-taxonomy/) |
| 661d | Component layer | 122 inline style violations; 5 components > 600 LoC; useLiveTranscript hook unused | [661d/](./661d-component-layer/) |
| 661e | Top-level cruft | duodo-snap + nouns-snap + autoresearch-test-coverage cruft to delete; "csv import/" rename | [661e/](./661e-top-level-cruft/) |
| 661f | CLAUDE.md drift | Every number stale; ZAOstock date passed; Promise.allSettled rule under-adopted (38%) | [661f/](./661f-claudemd-drift/) |
| 661g | Dep + script health | 84 vulns (4 Critical); turbo misconfigured; Capacitor scripts dead | [661g/](./661g-dep-script-health/) |
| 661h | Graduation readiness | 0 GRADUATE NOW, 1 DELETE NOW (FISHBOWLZ), 3 GRADUATE NEXT QUARTER (ZAOstock + Music + Spaces) | [661h/](./661h-graduation-readiness/) |

## Convergence Pattern

Three findings appear in 3+ sub-docs (highest-confidence). These should ship before anything else:

1. **The FISHBOWLZ-cleanup wedge.** It's the single most-cited issue (4 sub-docs). One PR can delete 5 component folders + 13 routes + the bot reference + the agent comment. After this PR, no zombie surface remains in the repo. Doc 661h estimates this as the lowest-effort graduation-class action available.

2. **The CLAUDE.md numbers patch.** Cited by 3 sub-docs (661c, 661d, 661f). The file is loaded on every Claude session — its drift compounds. Doc 661f includes a ready-to-apply patch diff.

3. **The ZAOstock spinout deadline.** Cited by 661f + 661h. The Wed 2026-04-29 graduation date is 19 days past. Either ship the spinout or pick a new explicit date. Either way, freeze new ZAOstock-only features in this repo per CLAUDE.md "graduating now" status.

## Unified Action Plan (P0 / P1 / P2)

### P0 — Ship This Week

| Action | Source doc | Effort | Why now |
|---|---|---|---|
| Delete all `fishbowlz/` paths in one PR (src/app/fishbowlz/, src/app/api/fishbowlz/, src/components/fishbowlz/, bot refs, dealer comment) | 661a + 661c + 661d + 661h | 1 PR, ~40 file deletes | Zombie surface; killed 2026-05-04; partnership pivoted to Juke |
| Patch CLAUDE.md headline numbers + ZAOstock date + remove stale "540+" research claim | 661f | 1 doc edit | Every session starts from this; drift compounds daily |
| Triage `npm audit` Critical (4) + High (26); fix what's safe (likely 1 — `ws` via `@ardrive/turbo-sdk` v1.13 breaking change) | 661g | ~2 hours | Security debt in production deploys |
| Decide: ship ZAOstock spinout this week OR set new explicit date | 661h | 1 decision | 19 days past deadline; either honor pattern or update it |

### P1 — Ship Next Sprint

| Action | Source doc | Effort | Why |
|---|---|---|---|
| Move 8 ZAOstock-specific root files in `bot/src/` to `bot/src/teams/`; add `bot/src/hermes/index.ts` + `bot/src/zoe/posts/index.ts` | 661b | ~8 file moves + grep-replace | Pre-ZAOstock-spinout cleanup; makes the graduation diff tight |
| Sweep 122 inline-style violations starting with music/ + calls/ folders | 661d | Multi-PR, can paralllelize | Enforce existing rule; was never blocked |
| Delete duodo-snap + nouns-snap (nested git repos); delete `autoresearch-test-coverage/results.tsv`; rename `csv import/` to `data/csv-imports/` | 661e | 1 PR | Pure cleanup |
| Write retroactive doc OR remove Magnetiq + AttaBotty bots (added 2026-05-11 without numbered doc) | 661a | 1 doc OR 1 PR | Honor CLAUDE.md "no new bots without doc" rule |
| Refactor or delete top-5 oversized components (UsersTable, MusicSidebar, chat Sidebar, ComposeBar, DiscordLinkManager) | 661d | Component-by-component | Pair with each surface's graduation |
| Search-endpoint consolidation review (chat/search + music/search + miniapp/search + /search) | 661c | 1 review doc | Either document each as intentional or unify under SearchService |

### P2 — Background

| Action | Source doc | Effort | Why |
|---|---|---|---|
| Commit to turbo monorepo (move bot/ into apps/, define real packages/) OR delete turbo:* scripts + turbo.json | 661g | Architectural decision | Currently confusing; scripts pretend to parallelize but don't |
| Delete dead scripts from package.json: `cap:ios`, `cap:android`, `cap:dev`, `analyze`, `turbo:*` if removing turbo | 661g | 1 doc edit | Reduces contributor confusion |
| Pick canonical lint: `lint` (next lint) vs `lint:biome` (biome) — delete the other | 661g | 1 doc edit | Currently both active; redundant |
| Increase Promise.allSettled vs Promise.all adoption (38% → target ≥80%) | 661f | Per-file PR sweep | Existing rule under-enforced; matters for fault-tolerant parallel fetches |
| Delete unused `useLiveTranscript` hook | 661d | 1 commit | No imports found anywhere |
| Audit `infra/hindsight` + `mcp/hindsight-mcp-server` against doc 601 — alive or dead? | 661e | 1 status check | Currently unclear |
| Decide on Miniapp Frame strategy (4 files) — library or product? | 661h | 1 decision doc (proposes doc 662) | Blocks architecture clarity |

## What's Healthy (Don't Touch)

- **Auth + Zod coverage at 90%** on API routes — better than the 2026 baseline (661c).
- **Zero `any` types in bot/src/** — type discipline is real (661b).
- **No React.FC, no CSS modules, no `dangerouslySetInnerHTML`, no Redux/Zustand** anywhere in src/components/ (661d).
- **Decommissioned surfaces (openclaw, Composio, Agent Zero) properly marked** in memory + no lingering active code (661a). The doc 601 cleanup actually worked.
- **No dead API routes left** — the prior referrals deletion (commit 5006d30b) set the pattern, and it's been honored since (661c).
- **Stack versions in CLAUDE.md match package.json** — Next 16 / React 19 / Supabase / Neynar / etc. all aligned (661f).
- **Security non-negotiables hold** — no SUPABASE_SERVICE_ROLE_KEY or similar in browser bundle (661f).

## What This Audit Costs / Saves

Estimated combined P0+P1 effort: ~3-5 days of focused work, mostly delete-and-move-not-write. The graduation-class action (FISHBOWLZ deletion + CLAUDE.md patch + ZAOstock decision) is ≤ 1 day if uninterrupted.

Saved by doing it: every future Claude session starts cleaner, ZAOstock spinout is faster, security audit footprint shrinks, contributor confusion (turbo, lint, scripts) drops.

## Hard Numbers (from sub-docs)

- 324 API routes across 55 domains (not 301/54 as CLAUDE.md claims).
- 294 components (not 279).
- 729 research docs (not 540+).
- 23 hooks (not 19).
- 17 root files in bot/src/, 8 of them ZAOstock-specific.
- 105 npm deps (81 prod + 24 dev), 84 vulnerabilities (4 Critical + 26 High + 17 Moderate + 37 Low).
- 122 inline style violations across 63 components.
- 5 components > 600 LoC (max 834).
- 38 total test files across the entire repo.
- Promise.allSettled used 77 times vs Promise.all 125 times (38% vs 62% — under-adoption of the stated rule).
- 1 critical patch-package patch (XMTP WASM, 225MB, cannot upstream).

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Open P0 PR #1 — FISHBOWLZ cleanup | @Zaal | PR | This week |
| Open P0 PR #2 — CLAUDE.md numbers + dates patch (use 661f diff verbatim) | @Zaal | PR | This week |
| Decide ZAOstock spinout date (ship now OR pick explicit new date + write the doc) | @Zaal | Decision | This week |
| Run `npm audit fix` for safe fixes; review breaking changes for `@ardrive/turbo-sdk` v1.13 | @Zaal | Sec patch | This week |
| Schedule P1 sweeps (bot/src move, inline-styles sweep, top-level cruft delete) | @Zaal | Sprint planning | Next sync |
| Re-validate this audit in 90 days | @Zaal | Recurring check | 2026-08-17 |

## Sources

This hub doc is the synthesis. Each finding traces back to its sub-doc's evidence section. Read sub-docs directly for grep results, file paths with line numbers, and verbatim quotes:

- [661a — Primary-surface drift](./661a-primary-surface-drift/)
- [661b — bot/src/ sprawl](./661b-bot-src-sprawl/)
- [661c — API route taxonomy](./661c-api-route-taxonomy/)
- [661d — Component layer](./661d-component-layer/)
- [661e — Top-level cruft](./661e-top-level-cruft/)
- [661f — CLAUDE.md drift](./661f-claudemd-drift/)
- [661g — Dep + script health](./661g-dep-script-health/)
- [661h — Graduation readiness](./661h-graduation-readiness/)

Methodology: 8 parallel general-purpose sub-agents launched via Claude Code Agent tool, each running STANDARD-tier research per the `/zao-research` skill. Each sub-agent independently inspected the repo (read-only Bash + Read), wrote its sub-doc, returned a 5-line summary. Hub doc synthesizes across the 8 returns. No source code was modified during the audit.

Related precedents:
- [Doc 154](../../154-skills-commands-master-reference/) — skills + commands canonical reference
- [Doc 459](../459-workspace-worktrees-multi-session/) — parallel-session safety (relevant to the audit's parallel-agent pattern)
- [Doc 547](../../community/547-zaostock-master-strategy/) — Cassie's "infrastructure IS the product" validation; informs graduation pattern
- [Doc 601](../../agents/601-agent-stack-cleanup-decision/) — 12+ surfaces collapsed to 5; the cleanup this audit measures drift against
- [Doc 650](../../agents/650-cowork-zaodevz-imanagent/) — Iman as universal team action tracker (P1 fixes can route here)
- [Doc 655](../655-post-merge-execution-playbook/) — execution rituals (relevant for shipping the P0 patches)
- [Doc 660](../660-x-content-extraction-v2/) — no-login content extraction (precedent for "research before refactor" pattern this audit demonstrates)
