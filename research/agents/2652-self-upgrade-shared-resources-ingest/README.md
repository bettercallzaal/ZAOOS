---
topic: agents
type: decision
status: research-complete
last-validated: 2026-10-09
superseded-by:
related-docs: "agents/2199-zoe-upgrade-failure-memory-skills, agents/2225-austin-griffith-clawd-agent-swarm, agents/253-autoagent-self-optimizing-agents, agents/2170-organism-diagnostic-v1, agents/601-agent-stack-cleanup-decision, agents/2640-orchestrator-loop-improvements, agents/2641-orchestrator-seat-measured-dispatch, dev-workflows/054-superpowers-agentic-skills, infrastructure/092-public-apis-2026-update, dev-workflows/441-everything-claude-code-integration, agents/2212-zao-sovereign-a2a-bus-design"
original-query: "https://github.com/public-apis/public-apis with fable lets deep /zao-research how we can use all these things ill keep sharing resources i want u to get the zoe to be able to upgrade itself plus https://github.com/obra/superpowers this would be big for zoe"
tier: DEEP
---

# 2652 - ZOE self-upgrade loop: ingesting shared resources (99darwin orchestrator/nexus/carapace, obra/superpowers, public-apis) into reviewed PRs

> **Goal:** Decide which of the five shared resources ZOE should learn from, and design the loop that lets Zaal share a link and get a reviewed PR against OUR live code, extending the ZOE modules that already exist rather than adding a bot.

> **Process note (2026-10-09).** The first pass read the working-tree clone of `~/zao-vault`, which is 862 commits behind `origin/main`, and reported vault item 28 as missing. Reading `origin/main` found it. That stale-copy miss is itself the case for the design's "fit check against LIVE code" stage: a stale copy produced a confident absence.

## Key Decisions

Recommendations first. Every row is grounded in a file or a fetched source cited below. The gate rows follow vault decision item 28, read from `origin/main`.

| # | Decision | Recommendation | Why (evidence) |
|---|---|---|---|
| 1 | **obra/superpowers** | USE the methods, not a new install yet. Append the verification-before-completion and TDD gates to the Hermes coder system prompt as text. Install the plugin on the VPS only after Zaal approves it as a new dependency. | Installed on this Mac as `superpowers@claude-plugins-official` 6.4.1 (`~/.claude/plugins/installed_plugins.json`). The VPS `installed_plugins.json` has no superpowers entry (ssh grep, 2026-10-09). `bot/src/hermes/claude-cli.ts` builds the `claude -p` args (lines ~205-252) with no plugin flag. New dependencies are "ask first" (`CLAUDE.md`). |
| 2 | **99darwin/orchestrator** | USE three patterns: declared write-set per worker, cross-family verifier, bounded iterations. SKIP its slash-command review prompts. | Write-set rule in `references/parallel-safety.md` ("Two tasks are parallel-safe iff their write-sets don't overlap"). Verifier prefers a different model family (`SKILL.md`, Phase 2 Step 3). Hard cap of 5 worker iterations (`SKILL.md`, Phase 6). ZOE already has a cross-family reviewer design (`bot/src/hermes/critic.ts` header, Codex per doc 2204), but the Codex binary is NOT on the VPS PATH (measured below). Its `commands/secure.md` and `commands/review.md` use emoji severity markers, which our output rules forbid. |
| 3 | **99darwin/nexus** | USE the `BaseAdapter` shape (retry with backoff, rate limit, abort-aware) as the template for a link-source adapter. Keep the credit already in `research-dedupe.ts`. SKIP the HN, Twitter, RSS and arXiv adapters as code; ZOE does not need them. | `packages/agent/src/sources/base-adapter.ts` (FULL): `maxRetries` default 3, backoff `Math.min(1000 * 2 ** attempt, 30000)`, abort rethrown without retry. `bot/src/zoe/research-dedupe.ts:10-12` already adapts its arXiv id matching (MIT). `dedup.ts:84` sets content Jaccard threshold 0.6 and `dedup.ts:90` entity overlap 2, but both are wired to a Postgres pool. |
| 4 | **99darwin/carapace-oss** | SKIP the enclave. Record the idea (per-secret host allowlist, redaction, signed receipts) as a revisit item for when ZOE hands an agent a third-party token. | Beta, "Not independently audited" (`README.md`). Self-host list cost about $92/month in `us-central1` (`docs/SELF_HOST.md`, Cost table, estimates). 15 residual risks R1-R15 (`docs/THREAT_MODEL.md`, lines 130-330). ZOE does not yet give agents third-party credentials, so the threat it defends against does not exist in our code today. |
| 5 | **public-apis/public-apis** | USE a curated subset (target about 15 APIs, not yet chosen) across 6 categories as a research-worker source list. SKIP the full catalogue. | 2,058 entry rows under 52 category headings at commit `874e5879` (awk count of the saved README). Categories with most entries: Development 204, Government 118, Geocoding 107, Cryptocurrency 90, Finance 88, Open Data 71. Doc 092 cites "1,436 APIs" at a March-May 2026 measurement and is stale; this count supersedes it for the list. |
| 6 | **Intake path** | EXTEND the existing link path. Do not build a second one. | A DM link already runs `wasResearched` then `enqueueWork` (`bot/src/zoe/index.ts:2315-2332`), and `work-loop.ts` runs a `research-worker` task that commits a numbered doc plus PR (`work-loop.ts:184-191`). The missing stages are fit-check against live code and the build PR. |
| 7 | **Build stage** | EXTEND the Hermes coder (`bot/src/hermes/coder.ts`, `runner.ts`) with a declared write-set and keep its 3-attempt cap (`HERMES_DEFAULT_MAX_ATTEMPTS = 3`, `types.ts:162`). | Forbidden paths already block `bot/src/hermes`, `.env*`, `package.json`, `CLAUDE.md` (`types.ts:169`). The 5-iteration cap from the orchestrator is larger than the 3 we already run. Keep 3, the lower one, under `agent-loops.md` rule 5. |
| 8 | **Feature flag** | Add `ZOE_SELF_UPGRADE` (default OFF) and `ZOE_SELF_UPGRADE_DAILY` (default 2). | `grep -rl SELF_UPGRADE bot/src research/agents` returned no matches (2026-10-09), so the name is free. The existing `ZOE_WORKLOOP_DAILY` default is 6 (`work-loop.ts:39`). |

## Ground truth: what is BUILT, WIRED, FLAGGED, LIVE

Per `state-claims.md` rule 5 these are separate states. BUILT and WIRED are confirmed from code. FLAGGED names the env var and its default from code. LIVE is NOT measured here except where a row says so.

| Capability | BUILT | WIRED | FLAGGED (default) | LIVE |
|---|---|---|---|---|
| Chat link to research doc and PR | Yes, `index.ts:2315-2332`, `work-loop.ts` | Yes, `enqueueWork` called from `index.ts:2327` and `:2797` | `ZOE_WORKLOOP_DAILY` = 6 | UNVERIFIED (not queried) |
| Work-loop tick on a 2h cron | Yes, `scheduler.ts:1578` | Yes, via `runTickLeased('work-loop', ...)` | `loopLeasesEnabled()` (`scheduler.ts:144-170`) | UNVERIFIED |
| Repo-improver scout (3h) | Yes, `repo-improver.ts` header | Yes, `scheduler.ts:257-262` and `:1680` | `ZOE_REPO_IMPROVER_LEASES` = off unless `true` (`scheduler.ts:139-141`) | Doc 2170 measured 14 receipts, latest 2026-07-28, as of late July. NOT re-measured here. |
| Email inbox ingest and triage | Yes, `inbox-ingest.ts:109` `ingestInbox`; `inbox-triage.ts` header | Yes, `fleet.ts:40` `ingestAllIdentities`, called from `scheduler.ts:1191` | No flag found in these modules | UNVERIFIED |
| Hermes coder, critic, PR watcher | Yes, `bot/src/hermes/` | Yes, `runner.ts:155` retry loop | Pass threshold 70 (`types.ts:161`) | UNVERIFIED |
| Cross-family critic (Codex) | Yes, `codex-cli.ts` header, `critic.ts` header | Yes, `critic.ts` imports `callCodexCli` | `hasCodexCli()` gate | MEASURED ABSENT on the VPS: `command -v codex` returned nothing on `vps` (2026-10-09). The critic therefore falls back, and the fallback is not cross-family on that host unless another path is set. |
| Superpowers skills on the Mac | Yes, plugin 6.4.1 | Mac Claude sessions only | n/a | Yes on the Mac (installed_plugins.json) |
| Superpowers skills on the VPS | No (no entry in `installed_plugins.json`) | No | n/a | No |
| Self-upgrade loop (this doc's design) | NO. Not built. | NO | `ZOE_SELF_UPGRADE` proposed, not present | No |

## Design: the self-upgrade loop

Each stage names the existing module it extends. Nothing here adds a bot (`CLAUDE.md`: "no new bots without doc").

| Stage | Input | Extends (existing) | Change | Default |
|---|---|---|---|---|
| 1. Intake | A shared link from Telegram DM or email to zoe-zao@agentmail.to | `index.ts:2315-2332` (DM), `inbox-ingest.ts:109` (email) | Classify the link as `resource` (repo, API list) or `topic`. A resource goes to `enqueueWork` with kind `resource`. | OFF behind `ZOE_SELF_UPGRADE` |
| 2. Dedupe | URL | `research-dedupe.ts` | Unchanged. | Existing |
| 3. Snapshot | GitHub repo | `zao-research-snapshot` (in `~/bin`, not git-tracked in this repo) | Call from the worker. **Must be git-tracked first** (`vanishing-dependencies.md` rule 1). | OFF |
| 4. Fit check | Snapshot plus LIVE code, read from `origin/main` not a local copy | `research-doc.ts` (doc writer), research-worker in `work-loop.ts:184` | Add a fit section: `gh search code` over both owners (skill Step 2.5), output one verdict per capability: EXTEND `<file>`, NEW, or SKIP. The worker stays read-only. | OFF |
| 5. Draft | Verdict EXTEND or NEW | `hermes/coder.ts`, `runner.ts` | Declare the write-set from the fit section BEFORE the coder runs. Reject any diff outside it. Keep `HERMES_FORBIDDEN_PATHS`. Keep 3 attempts. | OFF |
| 6. Review inside the build | Diff | `hermes/critic.ts` (Codex, threshold 70) | Already the orchestrator's cross-family verifier pattern, but on the VPS the Codex binary is absent (see ground truth). Add the loop-evals A-F checks as criteria (`loop-evals.md`). | Existing; the cross-family path needs the binary |
| 7. PR | Passing diff | `hermes/pr.ts`, `pr-watcher.ts` | Unchanged. PR body carries the credit line (`credit-attribution.md`) and the review count and reversibility (item 28). | Existing |
| 8. Gate | PR outcome | `needs-zaal-digest.ts` | Route by the gate table below. Non-gated items log one line (`lane-autonomy.md`). | Existing |

Caps: at most `ZOE_SELF_UPGRADE_DAILY` (default 2) builds per day, 3 coder attempts per build, one instance per resource (`agent-loops.md` rule 9).

### Superpowers wiring, concretely

- The Hermes coder invokes `claude -p` through `callClaudeCli` (`bot/src/hermes/claude-cli.ts:200-260`). It passes `--allowedTools`, `--disallowedTools`, `--permission-mode`, `--add-dir` and `--append-system-prompt`. It passes no plugin directory.
- Skills from a plugin are loaded by the claude CLI from its user config, not from a flag we pass. Whether a headless `claude -p` run on the VPS loads an installed plugin's skills is UNVERIFIED. It needs one spike.
- The method that transfers without any install: the verification-before-completion gate (`skills/verification-before-completion/SKILL.md`: "NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE") and the TDD cycle. Both can go into `FIXER_SYSTEM` text.
- The self-improvement angle is `skills/writing-skills/SKILL.md`: "Writing skills IS Test-Driven Development applied to process documentation", with a pressure scenario run before the skill is written. ZOE's `learn.ts` already runs a weekly, human-gated prompt-sharpening pass (doc 2199 header). A ZOE-written skill should go through the same RED-GREEN test before it is merged.

## Gate table: what auto-merges and what reaches Zaal

**Source of the rule.** Vault decision item 28, read from `origin/main` of `~/zao-vault` after `git fetch origin main` (2026-10-09). Verbatim ruling:

> "Ruling: agents merge anything reviewed and reversible. Zaal reviews IMPACT (not code) only for database/schema changes and changes to production sites with more than 5 users. Every PR surfaced to him states the review count, reversibility, and for those two classes the user impact. Which sites count: Q2, unanswered at time of writing. Blocker is mechanical, not policy: auto mode denies GitHub writes on most repos; the settings fix is his at the Mac."

His words in the same item: "most things are but like data base changes or things that will affect production sites with more than 5 users are things i wanna reveiw the impact not hte code does that make sense".

**Scope.** Item 28 narrows the CODE-MERGE gate only. Outbound posts, money, on-chain, settings, deletes and key rotation stay gated under `agent-loops.md` rule 8, `CLAUDE.md` ask-first and the workflow contract.

**Open.** Which sites count as "production with more than 5 users" is Q2 in item 28, still open. A separate ZOE Telegram grill answer (item 145, 21:15Z) reads "None of those", which is not yet clear as an answer to that question; it has not been acted on.

| Outcome | Merge | Reaches Zaal | Basis |
|---|---|---|---|
| Reviewed, reversible code PR (ZOE build behind a flag, docs, research, tests, scripts) | Agent merges. The PR states the review count and reversibility. | Nothing, unless it hits a row below | Item 28 |
| Database or schema change | Agent does not merge | Yes: user-impact review | Item 28 |
| Change to a production site with more than 5 users | Agent does not merge | Yes: user-impact review. Which sites count is open (Q2). | Item 28 |
| Outbound posts, DMs, publishing to external audiences | Never by agent | Yes | `agent-loops.md` rule 8; workflow contract |
| Money, on-chain, spend | Never by agent | Yes | `agent-loops.md` rule 8; `CLAUDE.md` ask-first list |
| Settings, permissions, hooks | Never by agent, except a named change in a Zaal ruling | Yes | Item 5 and the no-self-grant rule |
| Deletes, key rotation, credential handling | Never by agent | Yes | `no-rm-rf.md`; `secret-hygiene.md` |
| Changes to `bot/src/hermes` (the coder's own code) | Not merged by the loop | Yes | PROPOSED by this doc, not a Zaal ruling. `HERMES_FORBIDDEN_PATHS` (`types.ts:169`) blocks the loop from editing it. |

## Credit

| Source | Licence (read from the LICENSE file, not the API field) | Author | What we take |
|---|---|---|---|
| 99darwin/orchestrator | MIT, "Copyright (c) 2026 Nick" | 99darwin (GitHub handle) | Write-set rule, verifier family rule, iteration cap idea |
| 99darwin/nexus | MIT, "Copyright (c) 2026 Nexus Contributors" | 99darwin, agustif (GitHub) | BaseAdapter retry shape; arXiv id matching already credited in `research-dedupe.ts:10-12` |
| 99darwin/carapace-oss | Apache-2.0 (LICENSE header read; NOTICE file not checked) | 99darwin | Ideas only, no code. Apache-2.0 requires attribution if code is ever copied. |
| obra/superpowers | MIT, "Copyright (c) 2025 Jesse Vincent" | Jesse Vincent (obra) and contributors | Method text (verification, TDD, writing-skills) |
| public-apis/public-apis | MIT, "Copyright (c) 2022 public-apis" | public-apis maintainers | Category list; each listed API keeps its own terms |

## Findings

### 1. The five sources

**99darwin/orchestrator** (MIT, 8 stars, 2 forks, 1 contributor, HEAD `de586196068993b17581131f3456aab0638b64ba`). It is a Claude Code skill: decompose, dispatch workers, run `/secure` and `/review`, verify, loop. Its prerequisites say the core loop needs three files it ships (`commands/secure.md`, `commands/review.md`, `agents/security-reviewer.md`). Its `security-reviewer` runs on `model: opus` with a checklist of auth, IDOR, RLS and crypto items. Our `zao-evaluator` is `sonnet` with no write tools (`.claude/agents/zao-evaluator.md` header). The orchestrator's review runs after the worker finishes; our critic runs inside the Hermes run. That is the one structural difference worth copying.

**99darwin/nexus** (MIT, 2 stars, 2 contributors, HEAD `0a59cfc30887f94924f0426b8cef8ca6a7ff9d1a`). A TypeScript signal pipeline. Source adapters extend `BaseAdapter`. The dedup code is Postgres-backed (`deduplicateByContent(items, pool)`) and builds Jaccard fingerprints from stop-word-filtered words (`dedup.ts:202`). ZOE uses Supabase and the filesystem, so adapting it means changing the storage, not copying the algorithm wholesale.

**99darwin/carapace-oss** (Apache-2.0, 1 star, 8 open issues, HEAD `c7b48a7ad9ebbb5a3782d2f6ab3ba2113d866b29`). The threat model names what it trusts: the enclave, not the server operator or a GCP project Owner (`docs/THREAT_MODEL.md`, Actors table, and residual risk R1: "A GCP project Owner can decrypt"). The README says "Status: beta. Not independently audited; start with scoped, revocable tokens." The self-host cost table is labelled "estimates, not measured bills".

**obra/superpowers** (MIT, 296,871 stars, 26,512 forks, 325 open issues, HEAD `8ca22dba9a94f28898bbce59f2537ff4d87c747d`). Fifteen skills at HEAD (`skills/*/SKILL.md`, from the git tree). Doc 054 (March 2026, "Install it") counts 14 skills and says "200K+ stars"; both are stale. The Mac plugin is version 6.4.1; an open issue (#2482) reports a run on 6.4.2, so the version has moved since this Mac's install.

**public-apis/public-apis** (MIT, 486,983 stars per snapshot, HEAD `874e5879d20843f7c2a5822cef4c0752127b3775`). 2,058 entry rows under 52 headings. The top Hacker News story for the name, "A Collection of Free Public APIs That Is Tested Daily" (602 points, 122 comments, 2024-08-27), points to freepublicapis.com, not this repo.

### 2. Community signal

- **Hacker News.** Superpowers search returned one Show HN, "JDS", a Copilot port that credits superpowers as its inspiration (9 points, 0 comments, 2026-05-14). The public-apis story above. Carapace: zero hits (2026-10-09).
- **GitHub issues on obra/superpowers.** The five most recent are #2482-#2486. I read #2482 and #2485 in part. #2485 is a field report of a flaky test caught in real use on 2026-10-09 and filed upstream because the plugin is version-pinned. It shows the skills are being used and triaged, not user sentiment.
- **GitHub discussions.** obra/superpowers returns HTTP 410, "Discussions are disabled for this repo". The 99darwin repos were not checked.
- **Reddit.** PARTIAL and rate-limited. `zao-fetch-reddit.sh --selftest`: creds ABSENT, every public path walled. Arctic Shift returned HTTP 522 (retried). PullPush returned one submission for "superpowers claude", an r/ClaudeCode post, title and body not extracted. A second PullPush call returned HTTP 429 with the notice "This website does not provide free scraping resources for agents", so no further calls were made.

## Comparison table

| Option | Cost | Fit with live code | Risk | Verdict |
|---|---|---|---|---|
| Install superpowers plugin on VPS | Free (MIT), one dependency | Medium: coder is headless `claude -p`, plugin loading UNVERIFIED | New dependency; skills change agent behaviour under a live loop | Defer to Zaal's approval; text methods first |
| Copy superpowers method text into `FIXER_SYSTEM` | Zero | High | Low | USE |
| Adopt orchestrator write-set and cap | Zero | High, `runner.ts` already caps at 3 | Low | USE |
| Adopt nexus BaseAdapter shape | Zero | Medium, a new adapter is needed | Low | USE the shape |
| Carapace enclave | About $92/month list plus ops; GCP Confidential Space; beta | Low today, no third-party agent credentials in ZOE | High (beta, unaudited, 15 residual risks) | SKIP |
| public-apis full catalogue | Zero | Low; most entries unrelated | Stale and unvetted entries | SKIP the full list |
| public-apis curated subset | Zero | High for music, events, weather, geocoding, open data | Each API needs an auth and free-tier check | USE |

## Curated public-apis subset (proposed, not yet checked)

Counts are category sizes from the saved README at commit `874e5879`. The subset itself is not chosen. Each entry needs an auth, free-tier and CORS check before the research worker uses it.

| Category | Entries in category | ZAO use |
|---|---|---|
| Music | 35 | Artist and release metadata |
| Weather | 43 | Event day-of planning (ZAOstock, ZABAL) |
| Events | 4 | Event discovery |
| Geocoding | 107 | Venue location |
| Open Data | 71 | Civic and open datasets |
| Currency Exchange | 27 | Payments context (proposal only, no money movement) |

## Sources

Method key: FULL = read in full for the claim it supports; PARTIAL = part read, the gap named; FAILED = not retrieved after a real attempt. "Raw" means `gh api ... -H "Accept: application/vnd.github.raw"` or `curl` with no summariser in between.

| # | Source | Status | Method and gap |
|---|---|---|---|
| 1 | 99darwin/orchestrator `skills/orchestrator/SKILL.md` | FULL | Raw gh api, whole file |
| 2 | Same repo `assets/verifier-prompt.md` | FULL | Raw gh api, head 80 and tail |
| 3 | Same repo `assets/worker-prompt.md` | FULL | Raw gh api, head 80 and tail |
| 4 | Same repo `references/parallel-safety.md` | FULL | Raw gh api |
| 5 | Same repo `commands/review.md` | FULL | Raw gh api, whole file |
| 6 | Same repo `commands/secure.md` | FULL | Raw gh api, whole file |
| 7 | Same repo `agents/security-reviewer.md` | PARTIAL | Raw, lines 1-100 read; checklist after the crypto section not read |
| 8 | Same repo `references/verification-guide.md` | PARTIAL | Raw, first 60 lines (frontend and backend sections); data-scripts section and later not read |
| 9 | nexus `packages/agent/src/sources/base-adapter.ts` | FULL | Raw gh api, whole file |
| 10 | nexus `packages/agent/src/dedup.ts` | PARTIAL | Raw, lines 1-90 and 200-260 and exported-function list; `deduplicateByContent` body from line 248 partly read |
| 11 | nexus `sources/rss.ts`, `arxiv.ts`, `hackernews.ts`, `twitter.ts` | PARTIAL | Raw, rss.ts first 40 lines only; the other three not read. The decision not to adopt them does not depend on their bodies. |
| 12 | carapace-oss `docs/THREAT_MODEL.md` | PARTIAL | Raw: section list; Assets, Actors, TCB read; R1 read in full; R2-R15 headings only |
| 13 | carapace-oss `docs/SELF_HOST.md` Cost section | FULL | Raw, cost table read in full |
| 14 | carapace-oss `README.md` | PARTIAL | Raw, first 80 lines plus a grep of the rest for status and cost terms |
| 15 | obra/superpowers git tree at HEAD | FULL | `gh api 'repos/obra/superpowers/git/trees/HEAD?recursive=1'` |
| 16 | obra/superpowers `skills/writing-skills/SKILL.md` | PARTIAL | Raw, lines 1-100 of 681 |
| 17 | obra/superpowers `skills/subagent-driven-development/SKILL.md` | PARTIAL | Raw, first 40 of 568 lines |
| 18 | obra/superpowers `skills/verification-before-completion/SKILL.md` | PARTIAL | Raw, lines 1-80 |
| 19 | obra/superpowers `skills/requesting-code-review/SKILL.md` | PARTIAL | Raw, first 25 lines |
| 20 | obra/superpowers `skills/using-git-worktrees/SKILL.md` | PARTIAL | Raw, first 12 lines |
| 21 | public-apis/public-apis `README.md` | FULL | Raw to a scratchpad file; awk counts over the whole file |
| 22 | LICENSE files, all five repos | FULL | Raw gh api, first lines |
| 23 | `zao-research-snapshot` for all five repos | FULL | Local script; its licence field was overridden by row 22 |
| 24 | hn.algolia.com search API (4 queries: superpowers obra; public-apis; carapace enclave agent secrets; superpowers claude code) | FULL | JSON API via curl |
| 25 | obra/superpowers issues #2482-#2486 | PARTIAL | `gh api` titles for all five; bodies read in part for #2482 and #2485 |
| 26 | GitHub discussions | FAILED | obra/superpowers: HTTP 410, discussions disabled. 99darwin repos: not attempted. |
| 27 | Reddit | PARTIAL | zao-fetch-reddit.sh selftest: creds ABSENT, walled. Arctic Shift: HTTP 522 (twice). PullPush: one r/ClaudeCode submission, metadata only; a second call was rate-limited (HTTP 429, "does not provide free scraping resources for agents") and not retried. |
| 28 | Live code: `bot/src/zoe/*` (inbox-ingest, inbox-triage, repo-improver, research-dedupe, research-doc, work-loop, index.ts 2315-2332, scheduler.ts 139-262, 1191, 1578, 1680) | FULL for cited lines | sed and head, lines in the Findings |
| 29 | Live code: `bot/src/hermes/*` (coder, critic, claude-cli, codex-cli, pr-watcher, types) | FULL for cited lines | head and sed |
| 30 | `bot/src/zoe/env.ts` header | FULL | head 25 |
| 31 | VPS `~/.claude/plugins/installed_plugins.json` and `command -v codex` | FULL | ssh BatchMode: no superpowers entry; `codex` not on PATH (NO_CODEX_ON_PATH) |
| 32 | Existing docs 054, 092, 2199, 2170, 2640, 2641, 2225 | FULL for headers | `zao-research-health --resolve N`, head |
| 33 | Doc 601 | AMBIGUOUS | Two documents share the number. Cited here by path: `agents/601-agent-stack-cleanup-decision`. |
| 34 | Docs 2640, 2641 | RESOLVED | Found by path under `research/agents/` |
| 35 | Vault decision item 28 | FULL | `git -C /Users/zaalpanthaki/zao-vault fetch origin main`, then `show origin/main:decisions/grill-2026-10-09-seat-morning.md`. Quoted in the gate section. The earlier working-tree read was stale and is retracted. |

Shell limitations this run: the worktree guard refused some compound commands and a `~`-relative git path, and the commands were split or given literal paths. A grep over bot source for `process.env.*` was denied by the permission system and not retried. Neither changes a conclusion above.

Snapshot commit SHAs captured this run: nexus `0a59cfc30887f94924f0426b8cef8ca6a7ff9d1a`, superpowers `8ca22dba9a94f28898bbce59f2537ff4d87c747d`, public-apis `874e5879d20843f7c2a5822cef4c0752127b3775`, orchestrator `de586196068993b17581131f3456aab0638b64ba`, carapace-oss `c7b48a7ad9ebbb5a3782d2f6ab3ba2113d866b29`.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Answer Q2 of vault item 28: which sites count as "production with more than 5 users". Shipped when the list of sites is a dated line in `decisions/grill-2026-10-09-seat-morning.md` on `origin/main` of the vault. | @Zaal | Decision | 2026-10-12 |
| Rule on whether the loop may merge its own Hermes changes (`bot/src/hermes`); this doc proposes Zaal-gated. Shipped when the ruling is a dated line in the vault decisions file. | @Zaal | Decision | 2026-10-12 |
| Approve or refuse the superpowers plugin install on the VPS (new dependency). Shipped when the answer is recorded; if approved, the install is a PR-tracked dotfiles change. | @Zaal | Decision | 2026-10-12 |
| Put Codex on the VPS PATH, or accept the same-family critic fallback in writing. Shipped when `command -v codex` on `vps` returns a path, or the fallback is recorded in the critic's docs. | ZOE build lane (Claude Code) | Measurement | 2026-10-16 |
| Spike: confirm whether a headless `claude -p` run on the VPS loads a plugin's skills. Shipped when one run's output, pasted into the doc, shows the skill invoked or not invoked. | ZOE build lane | Spike | 2026-10-16 |
| Git-track `zao-research-snapshot` (currently in `~/bin`) before the worker calls it. Shipped when the script is in the repo and the path is named in the PR. | ZOE build lane | PR | 2026-10-16 |
| Build PR: `resource` kind in `enqueueWork` plus the fit-check section in `research-doc.ts`, behind `ZOE_SELF_UPGRADE` (default OFF). Shipped when the PR is merged with unit tests, `npm run typecheck` clean, and the bot boot-imported (not run as entrypoint). | ZOE build lane | PR | 2026-10-23 |
| Write-set declaration in `hermes/runner.ts` before the coder runs, rejecting out-of-set diffs. Shipped when a test shows an out-of-set edit is refused. | ZOE build lane | PR | 2026-10-23 |
| Curated public-apis subset file, each entry with auth, free-tier and CORS checked. Shipped when the file is in the repo with a dated check per entry. | ZOE build lane | PR | 2026-10-30 |
| Restore Reddit credentials (`~/.zao/private/reddit.env`, about 2 minutes), so Reddit sources can be read without the third-party index. Shipped when `zao-fetch-reddit.sh --selftest` reports creds PRESENT. | @Zaal | Setup | 2026-10-16 |
| Carapace: record SKIP and a revisit trigger (ZOE gives an agent a third-party token). | @Zaal | Decision | wontfix (2026-10-09) |

## Also See

- [Doc 2199 - ZOE upgrade: failure memory and skills](../2199-zoe-upgrade-failure-memory-skills/)
- [Doc 2225 - Austin Griffith and clawd](../2225-austin-griffith-clawd-agent-swarm/)
- [Doc 2170 - organism diagnostic (repo-improver receipts)](../2170-organism-diagnostic-v1/)
- [Doc 2640 - orchestrator loop improvements](../2640-orchestrator-loop-improvements/)
- [Doc 2641 - the seat as a dispatcher, measured](../2641-orchestrator-seat-measured-dispatch/)
- [Doc 054 - Superpowers (stale: says 14 skills)](../../dev-workflows/054-superpowers-agentic-skills/)
- [Doc 092 - public APIs 2026 (stale count)](../../infrastructure/092-public-apis-2026-update/)
- [Doc 441 - ECC integration](../../dev-workflows/441-everything-claude-code-integration/)
- [Doc 2212 - sovereign A2A bus](../2212-zao-sovereign-a2a-bus-design/)
