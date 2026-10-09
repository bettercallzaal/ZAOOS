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

## Key Decisions

Recommendations first. Every row is grounded in a file or a fetched source cited below. The gate rows depend on one unresolved conflict, flagged in the gate section.

| # | Decision | Recommendation | Why (evidence) |
|---|---|---|---|
| 1 | **obra/superpowers** | USE the methods, not a new install yet. Append the verification-before-completion and TDD gates to the Hermes coder system prompt as text. Install the plugin on the VPS only after Zaal approves it as a new dependency. | Installed on this Mac as `superpowers@claude-plugins-official` 6.4.1 (`~/.claude/plugins/installed_plugins.json`). The VPS `installed_plugins.json` has no superpowers entry (ssh grep, 2026-10-09). `bot/src/hermes/claude-cli.ts` builds the `claude -p` args (lines ~205-252) with no plugin flag. New dependencies are "ask first" (`CLAUDE.md`). |
| 2 | **99darwin/orchestrator** | USE three patterns: declared write-set per worker, cross-family verifier, bounded iterations. SKIP its slash-command review prompts. | Write-set rule in `references/parallel-safety.md` ("Two tasks are parallel-safe iff their write-sets don't overlap"). Verifier prefers a different model family (`SKILL.md`, Phase 2 Step 3). Hard cap of 5 worker iterations (`SKILL.md`, Phase 6). ZOE already has the cross-family reviewer (`bot/src/hermes/critic.ts` header, Codex per doc 2204). Its `commands/secure.md` and `commands/review.md` use emoji severity markers, which our output rules forbid. |
| 3 | **99darwin/nexus** | USE the `BaseAdapter` shape (retry with backoff, rate limit, abort-aware) as the template for a link-source adapter. Keep the credit already in `research-dedupe.ts`. SKIP the HN, Twitter, RSS and arXiv adapters as code; ZOE does not need them. | `packages/agent/src/sources/base-adapter.ts` (FULL): `maxRetries` default 3, backoff `Math.min(1000 * 2 ** attempt, 30000)`, abort rethrown without retry. `bot/src/zoe/research-dedupe.ts:10-12` already adapts its arXiv id matching (MIT). `dedup.ts:84` sets content Jaccard threshold 0.6 and `dedup.ts:90` entity overlap 2, but both are wired to a Postgres pool. |
| 4 | **99darwin/carapace-oss** | SKIP the enclave. Record the idea (per-secret host allowlist, redaction, signed receipts) as a revisit item for when ZOE hands an agent a third-party token. | Beta, "Not independently audited" (`README.md`). Self-host list cost about $92/month in `us-central1` (`docs/SELF_HOST.md`, Cost table). 15 residual risks R1-R15 (`docs/THREAT_MODEL.md` sections). ZOE does not yet give agents third-party credentials, so the threat it defends against does not exist in our code today. |
| 5 | **public-apis/public-apis** | USE a curated subset (target about 15 APIs, not yet chosen) across 6 categories as a research-worker source list. SKIP the full catalogue. | 2,058 entry rows under 52 category headings at commit `874e5879` (awk count of the saved README). Categories with most entries: Development 204, Government 118, Geocoding 107, Cryptocurrency 90, Finance 88, Open Data 71. Doc 092 cites "1,436 APIs" at a March-May 2026 measurement and is stale; this count supersedes it for the list. |
| 6 | **Intake path** | EXTEND the existing link path. Do not build a second one. | A DM link already runs `wasResearched` then `enqueueWork` (`bot/src/zoe/index.ts:2315-2332`), and `work-loop.ts` runs a `research-worker` task that commits a numbered doc plus PR (`work-loop.ts:184-191`). The missing stages are fit-check against live code and the build PR. |
| 7 | **Build stage** | EXTEND the Hermes coder (`bot/src/hermes/coder.ts`, `runner.ts`) with a declared write-set and keep its 3-attempt cap (`HERMES_DEFAULT_MAX_ATTEMPTS = 3`, `types.ts:162`). | Forbidden paths already block `bot/src/hermes`, `.env*`, `package.json`, `CLAUDE.md` (`types.ts:169`). The 5-iteration cap from the orchestrator is larger than the 3 we already run. Keep 3, the lower one, under `agent-loops.md` rule 5. |
| 8 | **Feature flag** | Add `ZOE_SELF_UPGRADE` (default OFF) and `ZOE_SELF_UPGRADE_DAILY` (default 2). | `grep -rl SELF_UPGRADE bot/src research/agents` returned no matches (2026-10-09), so the name is free. The existing `ZOE_WORKLOOP_DAILY` default is 6 (`work-loop.ts:39`). |

## Ground truth: what is BUILT, WIRED, FLAGGED, LIVE

Per `state-claims.md` rule 5 these are separate states. Only BUILT is confirmed from code in this run. WIRED is confirmed from a call site. FLAGGED names the env var and its default from code. LIVE is NOT measured here: that needs `zoe-liveness --remote` or the VPS process, and this run did not query it.

| Capability | BUILT | WIRED | FLAGGED (default) | LIVE |
|---|---|---|---|---|
| Chat link to research doc and PR | Yes, `index.ts:2315-2332`, `work-loop.ts` | Yes, `enqueueWork` called from `index.ts:2327` and `:2797` | `ZOE_WORKLOOP_DAILY` = 6 | UNVERIFIED (not queried) |
| Work-loop tick on a 2h cron | Yes, `scheduler.ts:1578` | Yes, via `runTickLeased('work-loop', ...)` | `loopLeasesEnabled()` (`scheduler.ts:144-170`) | UNVERIFIED |
| Repo-improver scout (3h) | Yes, `repo-improver.ts` header (cheap OpenRouter model proposes one fix, ZOE reviews, routes to Hermes) | Yes, `scheduler.ts:257-262` and `:1680` | `ZOE_REPO_IMPROVER_LEASES` = off unless `true` (`scheduler.ts:139-141`) | Doc 2170 measured 14 receipts, the latest 2026-07-28, as of late July. NOT re-measured here. |
| Email inbox ingest and triage | Yes, `inbox-ingest.ts:109` `ingestInbox`; `inbox-triage.ts` header (summarize, classify, connect, land on board) | Yes, `fleet.ts:40` `ingestAllIdentities`, called from `scheduler.ts:1191` | No flag found in these modules | UNVERIFIED |
| Hermes coder, critic, PR watcher | Yes, `bot/src/hermes/` | Yes, `runner.ts:155` retry loop | Pass threshold 70 (`types.ts:161`) | UNVERIFIED |
| Cross-family critic (Codex) | Yes, `codex-cli.ts` header (read-only sandbox, doc 2204), `critic.ts` header | Yes, `critic.ts` imports `callCodexCli` | `hasCodexCli()` gate | UNVERIFIED |
| Superpowers skills on the Mac | Yes, plugin 6.4.1 | Mac Claude sessions only | n/a | Yes on the Mac (installed_plugins.json) |
| Superpowers skills on the VPS | No (no entry in `installed_plugins.json`) | No | n/a | No |
| Self-upgrade loop (this doc's design) | NO. Not built. | NO | `ZOE_SELF_UPGRADE` proposed, not present | No |

The single most likely failure: a comment says the critic runs, but the Codex CLI may be absent on the VPS, which would make `hasCodexCli()` false and the critic fall back to a same-family model. This run did not check the VPS for the `codex` binary. That is UNVERIFIED and it matters for decision 2.

## Design: the self-upgrade loop

Each stage names the existing module it extends. Nothing here adds a bot (`CLAUDE.md`: "no new bots without doc").

| Stage | Input | Extends (existing) | Change | Default |
|---|---|---|---|---|
| 1. Intake | A shared link from Telegram DM or email to zoe-zao@agentmail.to | `index.ts:2315-2332` (DM), `inbox-ingest.ts:109` (email) | Classify the link as `resource` (repo, API list) or `topic`. A resource goes to `enqueueWork` with kind `resource`. | OFF behind `ZOE_SELF_UPGRADE` |
| 2. Dedupe | URL | `research-dedupe.ts` | Unchanged. The arXiv id logic already covers the nexus credit. | Existing |
| 3. Snapshot | GitHub repo | `zao-research-snapshot` (in `~/bin`, not git-tracked in this repo) | Call from the worker. **Must be git-tracked first** (`vanishing-dependencies.md` rule 1). | OFF |
| 4. Fit check | Snapshot plus live code | `research-doc.ts` (doc writer), research-worker in `work-loop.ts:184` | Add a fit section: `gh search code` over both owners (skill Step 2.5), output one verdict per capability: EXTEND `<file>`, NEW, or SKIP. The worker stays read-only. | OFF |
| 5. Draft | Verdict EXTEND or NEW | `hermes/coder.ts`, `runner.ts` | Declare the write-set from the fit section BEFORE the coder runs. Reject any diff outside it. Keep `HERMES_FORBIDDEN_PATHS`. Keep 3 attempts. | OFF |
| 6. Review inside the build | Diff | `hermes/critic.ts` (Codex, threshold 70) | Already the orchestrator's cross-family verifier pattern. Add the loop-evals A-F checks as criteria (`loop-evals.md`). | Existing, flag state UNVERIFIED |
| 7. PR | Passing diff | `hermes/pr.ts`, `pr-watcher.ts` | Unchanged. PR body carries the credit line (`credit-attribution.md`). | Existing |
| 8. Gate | PR outcome | `needs-zaal-digest.ts` | Route by the gate table below. Non-gated items log one line (`lane-autonomy.md`). | Existing |

Caps: at most `ZOE_SELF_UPGRADE_DAILY` (default 2) builds per day, 3 coder attempts per build, one instance per resource (`agent-loops.md` rule 9).

### Superpowers wiring, concretely

- The Hermes coder invokes `claude -p` through `callClaudeCli` (`bot/src/hermes/claude-cli.ts:200-260`). It passes `--allowedTools`, `--disallowedTools`, `--permission-mode`, `--add-dir` and `--append-system-prompt`. It passes no plugin directory.
- Skills from a plugin are loaded by the claude CLI from its user config, not from a flag we pass. Whether a headless `claude -p` run on the VPS loads an installed plugin's skills is UNVERIFIED. It needs one spike.
- The method that transfers without any install: the verification-before-completion gate (`SKILL.md`: "NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE") and the TDD cycle. Both can go into `FIXER_SYSTEM` text.
- The self-improvement angle is `skills/writing-skills/SKILL.md`: "Writing skills IS Test-Driven Development applied to process documentation", with a pressure scenario run before the skill is written. ZOE's `learn.ts` already runs a weekly, human-gated prompt-sharpening pass (doc 2199 header). A ZOE-written skill should go through the same RED-GREEN test before it is merged.

## Gate table: what auto-merges and what reaches Zaal

**Unresolved conflict.** The brief says Zaal ruled "agents merge anything reviewed and reversible" (vault decisions item 28). This run searched `~/zao-vault/decisions/` for 2026-10-09 files and for "item 28" and found nothing (UNVERIFIED that the ruling exists). Two standing rules say the opposite for code:

- `agent-loops.md` rule 8: "Autonomous work opens PRs; a human merges."
- The memory index entry `feedback_workflow_contract_v2`: "docs auto-merge, Zaal reviews code" (LOCKED).

Until Zaal rules, the default is the stricter reading. Docs auto-merge and code waits for Zaal.

| Outcome | Auto-merge | Reaches Zaal | Basis |
|---|---|---|---|
| Research doc or index row, no code | Yes | Only if it contains a gated item | `feedback_workflow_contract_v2` |
| Source list file (the public-apis subset), no code path | No until ruled | Yes, one PR review | Conflict above |
| Build PR to ZOE code, flag OFF | No | Yes | `agent-loops.md` rule 8 |
| Any DB migration or schema change | Never | Yes, impact review only | Brief: "he reviews IMPACT not code for DB changes" |
| Live site with more than 5 users | Never | Yes, impact review only | Brief, same source |
| Money, on-chain, outbound post, settings, deletion | Never | Yes | `pii-hygiene.md`, `no-rm-rf.md`, `CLAUDE.md` ask-first list |
| Credential or key handling | Never | Yes | `secret-hygiene.md` |
| Change to Hermes itself (`bot/src/hermes`) | Never by the loop | Yes | `HERMES_FORBIDDEN_PATHS` (`types.ts:169`) |

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

**99darwin/orchestrator** (MIT, 8 stars, 2 forks, 1 contributor, last activity 2026-08-06 per snapshot). It is a Claude Code skill: decompose, dispatch workers, run `/secure` and `/review`, verify, loop. Its own prerequisites say the core loop needs three files it ships (`commands/secure.md`, `commands/review.md`, `agents/security-reviewer.md`). Its `security-reviewer` runs on `model: opus`. Our `zao-evaluator` is `sonnet` with no write tools (`.claude/agents/zao-evaluator.md` header). The orchestrator's review is after the worker finishes, and our critic is inside the Hermes run. That is the one structural difference worth copying.

**99darwin/nexus** (MIT, 2 stars, 2 contributors, last activity 2026-10-07). A TypeScript topological news and signal pipeline. Source adapters extend `BaseAdapter`. The code is a Postgres-backed pipeline; ZOE uses Supabase and the filesystem. Adapting it means changing the storage, not copying the algorithm wholesale.

**99darwin/carapace-oss** (Apache-2.0, 1 star, 8 open issues, last activity 2026-10-02). The threat model says the design trusts the enclave and not the server or GCP project Owner (`docs/THREAT_MODEL.md`, Actors table: "Anyone on the internet ... No"). The self-host cost table is list price, marked as an estimate. There is a Hacker News search for "carapace enclave agent secrets" with zero hits (2026-10-09).

**obra/superpowers** (MIT, 296,871 stars, 26,512 forks, 325 open issues, last activity 2026-10-09 per snapshot). Fifteen skills at HEAD (`skills/*/SKILL.md`, from the git tree). Doc 054 (March 2026, "Install it") counts 14 skills and says "200K+ stars"; both are stale and the count is now 15. The Mac plugin is version 6.4.1. Its Hacker News footprint is one Show HN ("JDS", 9 points, 0 comments, 2026-05-14), a Copilot port that credits superpowers as its inspiration.

**public-apis/public-apis** (MIT, 486,983 stars per snapshot). 2,058 entry rows under 52 headings at commit `874e5879d20843f7c2a5822cef4c0752127b3775`. The top Hacker News story for the name, "A Collection of Free Public APIs That Is Tested Daily" (602 points, 122 comments, 2024-08-27), points to a separate site, not this repo.

### 2. Community signal

- Hacker News superpowers search returned the Show HN above and no discussion thread on obra's repo itself (search run 2026-10-09).
- GitHub issues on obra/superpowers: the five most recent are #2482-#2486 (titles only, bodies not read). Two are open skill edits (`brainstorming`, `systematic-debugging`) and one is a release-notes PR. This shows active maintenance, not user sentiment.
- Reddit: FAILED. `zao-fetch-reddit.sh --selftest` reports creds ABSENT and every public path walled. Arctic Shift returned HTTP 522 on the query "superpowers claude". No Reddit thread was read.

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

Counts are from the saved README at commit `874e5879`. The list is a proposal. Each entry needs an auth, free-tier and CORS check before the research worker uses it.

| Category | Entries in category | ZAO use |
|---|---|---|
| Music | 35 | Artist and release metadata |
| Weather | 43 | Event day-of planning (ZAOstock, ZABAL) |
| Events | 4 | Event discovery |
| Geocoding | 107 | Venue location (ZAOstock Franklin St parklet) |
| Open Data | 71 | Civic and open datasets |
| Currency Exchange | 27 | Payments context (proposal only, no money movement) |

## Sources

Method key: FULL = read in full this run; PARTIAL = part read, the gap named; FAILED = not retrieved.

| # | Source | Status | Method |
|---|---|---|---|
| 1 | https://github.com/99darwin/orchestrator `skills/orchestrator/SKILL.md` | FULL | `gh api repos/99darwin/orchestrator/contents/skills/orchestrator/SKILL.md -H "Accept: application/vnd.github.raw"` |
| 2 | Same repo `skills/orchestrator/assets/verifier-prompt.md` | FULL | gh api raw, head and tail |
| 3 | Same repo `skills/orchestrator/assets/worker-prompt.md` | PARTIAL | gh api raw, head -80 only (report-format tail not read) |
| 4 | Same repo `skills/orchestrator/references/parallel-safety.md` | FULL | gh api raw |
| 5 | Same repo `commands/review.md` | FULL | gh api raw |
| 6 | Same repo `commands/secure.md` | FULL | gh api raw, head -40 (file short) |
| 7 | Same repo `agents/security-reviewer.md` | PARTIAL | gh api raw, head -30 (checklist not read) |
| 8 | Same repo `skills/orchestrator/references/verification-guide.md` | FAILED | Not read in this run |
| 9 | https://github.com/99darwin/nexus `packages/agent/src/sources/base-adapter.ts` | FULL | gh api raw |
| 10 | Same repo `packages/agent/src/dedup.ts` | PARTIAL | gh api raw, function list via grep (algorithm bodies not read) |
| 11 | Same repo source adapters `arxiv.ts`, `hackernews.ts`, `rss.ts`, `twitter.ts` | FAILED | Not read; their absence from the adoption list is a decision, not a finding |
| 12 | https://github.com/99darwin/carapace-oss `docs/THREAT_MODEL.md` | PARTIAL | gh api raw, sections via grep, Actors and Trusted computing base read |
| 13 | Same repo `docs/SELF_HOST.md` Cost section | FULL | gh api raw, sed on the cost lines |
| 14 | Same repo `README.md` | PARTIAL | gh api raw, head -80 |
| 15 | https://github.com/obra/superpowers git tree at HEAD | FULL | `gh api 'repos/obra/superpowers/git/trees/HEAD?recursive=1'` |
| 16 | Same repo `skills/writing-skills/SKILL.md` | PARTIAL | gh api raw, head -40 |
| 17 | Same repo `skills/subagent-driven-development/SKILL.md` | PARTIAL | gh api raw, head -40 |
| 18 | Same repo `skills/verification-before-completion/SKILL.md` | PARTIAL | gh api raw, head -30 |
| 19 | Same repo `skills/requesting-code-review/SKILL.md` | PARTIAL | gh api raw, head -25 |
| 20 | Same repo `skills/using-git-worktrees/SKILL.md` | PARTIAL | gh api raw, head -12 |
| 21 | https://github.com/public-apis/public-apis `README.md` | FULL | gh api raw to a scratchpad file, awk counts over the whole file |
| 22 | LICENSE files (all five repos) | FULL | `gh api repos/OWNER/REPO/contents/LICENSE -H "Accept: application/vnd.github.raw"`, read the first lines |
| 23 | `zao-research-snapshot` for all five repos | FULL | local script; licence in its output came from the API field and was overridden by row 22 |
| 24 | https://hn.algolia.com/api/v1/search (superpowers obra; public-apis; carapace enclave agent secrets; superpowers claude code) | FULL | JSON API via curl |
| 25 | https://github.com/obra/superpowers/issues (5 most recent) | PARTIAL | gh api, titles only |
| 26 | GitHub Discussions for obra/superpowers and the 99darwin repos | FAILED | Not attempted in this run |
| 27 | Reddit threads on superpowers | FAILED | `zao-fetch-reddit.sh --selftest`: creds ABSENT, walled. Arctic Shift returned HTTP 522. |
| 28 | Live code: `bot/src/zoe/*` headers (inbox-ingest, inbox-triage, repo-improver, research-dedupe, research-doc, work-loop, index.ts lines 2315-2332, scheduler.ts lines 139-262, 1191, 1578, 1680) | FULL | Read via sed and head, paths in the Findings |
| 29 | Live code: `bot/src/hermes/*` (coder, critic, claude-cli, codex-cli, pr-watcher, types) | FULL for cited lines | Read via head and sed |
| 30 | `bot/src/zoe/env.ts` header | FULL | head -25 |
| 31 | VPS `~/.claude/plugins/installed_plugins.json` | PARTIAL | `ssh -o BatchMode=yes vps grep superpowers`: no match. VPS `codex` binary not checked. |
| 32 | Existing docs 054, 092, 2199, 2170, 2640, 2641, 2225 | FULL for headers | `zao-research-health --resolve N` and head |
| 33 | Doc 601 | AMBIGUOUS | Two documents share the number (`agents/601-agent-stack-cleanup-decision` and `music/601-suno-music-generation-deep-tooling-2026`). Cited here by path, the agents one. |
| 34 | Docs 2640, 2641 | RESOLVED | Found by path under `research/agents/` (`zao-research-health --resolve` said "no directory found") |
| 35 | Vault decision for item 28 | FAILED | `~/zao-vault/decisions/` searched for 2026-10-09 files and for "item 28": no matches |

Shell limitations this run: a `grep` over bot source for the name `process.env.*` was DENIED by the permission system and not retried. Some bash calls were refused by the worktree guard for compound commands and were split. Neither changes a conclusion above.

Snapshot commit SHAs captured: nexus `0a59cfc30887f94924f0426b8cef8ca6a7ff9d1a`, superpowers `8ca22dba9a94f28898bbce59f2537ff4d87c747d`, public-apis `874e5879d20843f7c2a5822cef4c0752127b3775`. The orchestrator and carapace HEAD SHAs were NOT captured; their content is cited by path, not by SHA.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Rule on the gate conflict: item 28 (agents merge reviewed reversible code) vs `agent-loops.md` rule 8 and the LOCKED contract (Zaal reviews code). Append the one-line ruling to `~/zao-vault/decisions/`. Shipped when the ruling is a dated line in the decisions folder. | @Zaal | Decision | 2026-10-12 |
| Approve or refuse the superpowers plugin install on the VPS (new dependency). Shipped when the answer is recorded; if approved, the install is a PR-tracked dotfiles change. | @Zaal | Decision | 2026-10-12 |
| Spike: confirm whether a headless `claude -p` run on the VPS loads a plugin's skills. Shipped when one run's output, pasted into the doc, shows the skill invoked or not invoked. | ZOE build lane (Claude Code) | Spike | 2026-10-16 |
| Confirm the Codex CLI binary exists on the VPS, so the cross-family critic is real and not a fallback. Shipped when `hasCodexCli()` result is pasted from a VPS run. | ZOE build lane | Measurement | 2026-10-16 |
| Git-track `zao-research-snapshot` (currently in `~/bin`) before the worker calls it. Shipped when the script is in the repo and the path is named in the PR. | ZOE build lane | PR | 2026-10-16 |
| Build PR: `resource` kind in `enqueueWork` plus the fit-check section in `research-doc.ts`, behind `ZOE_SELF_UPGRADE` (default OFF). Shipped when the PR is merged with unit tests, `npm run typecheck` clean, and the bot boot-imported (not run as entrypoint). | ZOE build lane | PR | 2026-10-23 |
| Write-set declaration in `hermes/runner.ts` before the coder runs, rejecting out-of-set diffs. Shipped when a test shows an out-of-set edit is refused. | ZOE build lane | PR | 2026-10-23 |
| Curated public-apis subset file, each entry with auth, free-tier and CORS checked. Shipped when the file is in the repo with a dated check per entry. | ZOE build lane | PR | 2026-10-30 |
| Restore Reddit credentials (`~/.zao/private/reddit.env`, about 2 minutes). Shipped when `zao-fetch-reddit.sh --selftest` reports creds PRESENT. | @Zaal | Setup | 2026-10-16 |
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
