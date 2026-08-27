---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-08-27
superseded-by:
related-docs: 2204, 2205, 695, 710, 712
original-query: "DEEP: Nick Saponaro (github.com/99darwin, 95 repos) as a live collaborator - we already fork juke-space-recap from him and PR #1 is open on his repo. Research five repos as CODE (read actual source, LICENSE from the file per Hard Requirement 13): orchestrator, obsidian-vault-scaffolder, telecast, farcaster-audio, nexus. For each: architecture, what it does better than ours, what to ADOPT with exact files/patterns to port, what to contribute back. Deliverable: research doc + ADOPTION LIST ranked by value, each item naming source path, target repo, license compatibility, effort. Worktree per repo discipline. Commit, no push."
tier: DEEP
---

# 2423 - 99darwin's code, read as source: the adoption list

> **Goal:** Docs 2204 and 2205 read Nick Saponaro's repos from READMEs (2205 marks itself `[PARTIAL - top 4 read fully]`). This doc clones five repos and reads the actual source, reads every LICENSE from the file per Hard Requirement 13, and produces a ranked adoption list with exact source paths, target, licence compatibility and effort.

**Framing (Zaal, 2026-08-27, from reading `skills/orchestrator/SKILL.md` himself): his stack is COMPLEMENTARY to ours, not competing.** His orchestrator is a *per-task lifecycle* (implement -> /secure -> /review -> fix -> verify -> done) driving N parallel subagents. Ours is a *fleet layer* (watch, route, gate, vault). They compose: **his lifecycle is what each of our lanes should run internally.** Nothing below proposes replacing our layer with his.

He is also a live collaborator, not a subject: we fork `juke-space-recap` and **PR #1 is open on his repo**. Every "contribute back" item below is a message Zaal can already send.

## Key Decisions - the ADOPTION LIST, ranked by value

Ranks 1-3 are Zaal's call and are the three things that **bit us this week**.

| # | Adopt | Source path (read as source) | Target | Licence (from file) | Effort |
|---|---|---|---|---|---|
| **1** | **Parallel-safety by WRITE-SET.** Two tasks are parallel-safe iff their write-sets are disjoint; read-sets may overlap freely. Includes the rules that would have caught us: **lockfiles always serialize**, migrations serialize, shared config gets one owner, and workers **declare ports** so two lanes do not both claim 3000. Ends with "when in doubt, sequence - a stomp costs the rerun plus re-verification." | `skills/orchestrator/references/parallel-safety.md` (81 lines, read in full) | lane brief template + playbook convention 5 | MIT | **S** |
| **2** | **Cross-model verifiers - verifier defaults to a different model family than the worker.** "Same-model self-review shares blind spots." If the roster is homogeneous, the plan must SAY SO rather than silently self-review. | `skills/orchestrator/SKILL.md` Phase 2 Step 3 + `assets/verifier-prompt.md` | lane brief template | MIT | **S** |
| **3** | **Structured worker report with a verification target.** Fixed sections - Status (DONE/NEEDS_HELP/BLOCKED), Files touched, Summary, **Verification target** (domain + exact command/URL/payload + expected outcome), findings, Notes for orchestrator. Plus the enforcement clause: **"You may write to these files only... if your task requires writing outside this scope, STOP and report back instead of expanding scope."** | `skills/orchestrator/assets/worker-prompt.md` (114 lines, read in full) | lane brief template + convention 5 | MIT | **S** |
| 4 | **Self-hosted Juke incl. its own developer-key issuance.** `developer_key_service.py` + `routers/developer.py` implement application -> approval -> app -> key. This is the exact thing ZAO was blocked on: docs 695/710/712 all end "BLOCKED on nickysap issuing a `JUKE_API_KEY`". Self-hosting means **ZAO issues its own keys** and the blocker disappears. | `backend/app/services/developer_key_service.py`, `backend/app/routers/developer.py` (655 lines) | Zuke | MIT | **L** |
| 5 | **Skill test + benchmark harness.** A skill shipped with `tests/run_smoke_tests.sh` + fixtures + a with-skill-vs-baseline benchmark methodology (3 realistic prompts, pass rate / time / tokens). We have ~100 skills and no test harness for any of them. **Caveat, measured:** the published `benchmark.json` is an empty template - `runs: []`, `<model-name>`, all deltas 0.00. Adopt the *methodology*, not the numbers. | `tests/run_smoke_tests.sh`, `benchmarks/README.md` | skill library | MIT | **M** |
| 6 | **Tiered-model classification ladder for graph ingest.** Haiku triage -> heavier models only for what survives, with `triage.ts` defaulting to `claude-haiku-4-5-20251001`. Directly applicable to Bonfire ingest and `/graphify`. | `packages/agent/src/triage.ts`, `pipeline.ts`, `dedup.ts` | Bonfire / graphify | MIT | **M** |
| 7 | **Telegram-Farcaster bridge pattern (PATTERN ONLY - NOT ADOPTABLE AS CODE).** See the licence finding below. | `bot.ts` (1327 lines), `utils/fc/signer.ts` | ZOE v2 bridge | **NONE** | blocked |

## Hard Requirement 13: the licence findings

Every licence below was read from the file on disk, not from `gh api --jq .license`.

| Repo | API field | LICENSE file on disk | Verdict |
|---|---|---|---|
| orchestrator | MIT | `LICENSE`, 21 lines, "MIT License / Copyright (c) 2026 Nick" | MIT confirmed |
| obsidian-vault-scaffolder | MIT | `LICENSE`, 21 lines, "Copyright (c) 2026 Nick Saponaro" | MIT confirmed |
| farcaster-audio | MIT | `LICENSE`, 21 lines, "Copyright (c) 2026 Nick Saponaro" | MIT confirmed |
| nexus | MIT | `LICENSE`, 21 lines, "Copyright (c) 2026 Nexus Contributors" | MIT confirmed |
| **telecast** | **NONE** | **NO LICENSE FILE** | **all rights reserved** |

**telecast is the Hard Requirement 13 case.** There is no `LICENSE` file in the repo. Under `.claude/rules/credit-attribution.md` that is all-rights-reserved, not public domain, so **telecast is NOT adoptable as code**. The pattern is fair to learn from and cite.

One nuance worth carrying, because it makes the ask trivial: **`package.json` declares `"license": "ISC"`.** So Nick has already stated his intent - what is missing is only the LICENSE file that makes it a grant. The ask-Nick message is therefore not "will you license this" but "your package.json already says ISC, would you add the LICENSE file to match" - a one-line request on top of an open PR relationship.

## What each repo actually is (read as source)

**orchestrator** (11 files, 915 lines total, MIT, 7 stars, pushed 2026-08-06). A Claude Code skill, not a service. `SKILL.md` (169 lines) defines five phases; the load-bearing content is in two reference files and two prompt assets. Phase 1 is the one he insists on: *"Don't skip phase 1 - most orchestration failures trace back to dispatching tasks that weren't actually parallel-safe."* Bundles `/secure` + `/review` commands and a `security-reviewer` agent (221 lines). Hard cap of 5 worker iterations, then surface to the human. Optional skills must be reported as skipped, never silently treated as covered.

**obsidian-vault-scaffolder** (101 files, MIT, 4 stars, Python). A skill that turns a spec into a PARA-style Obsidian vault: `scripts/scaffold_vault.py` is 1000 lines and generates the boilerplate (folders, Bases views, templates, `AGENTS.md`), while Claude authors the project-specific atomized notes. Six reference files carry the contracts - `atomization_playbook.md`, `frontmatter_schema.md`, `bases_yaml.md`, `config_schema.md`, `folder_layout.md`, `memory_entries.md`. What makes it notable is not the vault output but that **it ships with tests and a benchmark methodology** - see adoption 5.

**telecast** (18 files, 2045 lines TS, no licence, 1 star, last pushed 2025-08-12). A grammY Telegram bot that is a working Farcaster client: `/feed`, `/cast`, `/channel_cast`, `/replies`, `/notifications`, photo casting via uploadthing, and a full signer lifecycle (`/check_approval`, `/update_signer`, `/get_approval_link`, `/reset_signer`, plus a background `checkAndUpdateAllSignerStatuses`). `utils/fc/signer.ts` (161 lines) does the real work - `mnemonicToAccount` -> `ViemLocalEip712Signer.signKeyRequest` with a 24h deadline -> `registerSignedKey` via Neynar. Redis holds per-user signer state. **This is ZOE's exact bridge shape**, which is why the missing licence matters.

**farcaster-audio** (443 files, backend 24,375 lines Python, MIT). The full OSS Juke: FastAPI backend + Expo client + landing. 18 routers and 20 services. `room_service.py` alone is 2414 lines. Substantial test coverage exists - `test_developer_keys.py` (1680), `test_auth.py` (721), `test_push_service.py` (617), `test_gifs.py` (537). Ships `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `SECURITY.md`, a Dockerfile and alembic migrations. The find that changes a ZAO decision is `developer_key_service.py` - see adoption 4.

**nexus** (120 files, 13,382 lines TS, MIT, 2 stars). Neo4j + PostgreSQL + BullMQ/Redis + Fastify + a 3D force-directed client, four pnpm packages (`agent`, `api`, `client`, `shared`). The agent package is the relevant part: `triage.ts`, `dedup.ts`, `anomaly.ts`, `pipeline.ts`, `mutations/`, `sources/`, with its own `__tests__`. Multi-stage LLM classification with a cheap-first ladder.

## Where WE are already ahead (do not re-adopt)

Doc 2204 established this against `orchestrator` and it still holds: our multi-provider fleet is native (he needs an external CLIProxyAPI shim), our deterministic secret/licence gate already overrides the model, and we have persistent infra he has none of - cost-ledger, `runs.ts`, `watcher.ts`, Bonfire memory, step-level `trace.ts`. Adoptions 1-3 are not capabilities we lack the infrastructure for; they are **rules we never wrote down**.

Measured this session, and the reason ranks 1-3 sit at the top: `grep -rn "write-set\|parallel-safe"` across `.claude/rules/` and `~/zao-vault/handoffs/lanes.md` returns **nothing**. We have no write-set rule anywhere. Two lanes nearly collided on `sync-projects.js` and two panes did collide on `ws/2422-lane-weighin` (issue #3338) in the same week.

## Contribute back (we are a collaborator, not a consumer)

1. **Ask him to add a LICENSE file to `telecast`** matching the ISC already in its `package.json`. Unblocks adoption 7 for us and anyone else.
2. **`juke-space-recap` PR #1 is already open** - land it before opening new threads.
3. **Offer the benchmark harness back with real numbers.** His `benchmark.json` is an empty template. If we adopt the methodology (adoption 5) and actually run it, contributing populated results is a genuine return on a skill he shipped scaffolding for.
4. **Report the telecast signer flow against current Neynar SDK** if we exercise it - that repo has not been pushed since 2025-08-12 and pins `@neynar/nodejs-sdk ^2.31.0`.

## Also See

- [Doc 2204](../../agents/2204-cross-family-verification-99darwin-orchestrator/) - orchestrator -> ZOE cross-family verify (shipped)
- [Doc 2205](../../dev-workflows/2205-nickysap-oss-ecosystem-for-zao/) - the README-level ecosystem survey this doc upgrades to source-level
- [Doc 695](../../music/695-juke-integration-zao/), [710](../../music/710-juke-path-b-architecture/), [712](../../music/712-juke-integration-remaining-gaps/) - the Juke gaps that adoption 4 closes
- `~/zao-vault/notes/adoption-candidates.md` - the running adoption index (orchestrator-written)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Port write-set parallel-safety into the lane brief template + convention 5; rule text lands and a lane brief renders it | Zaal | PR | 2026-08-31 |
| Add "verifier must be a different model family than the worker, or say so" to the lane brief template | Zaal | PR | 2026-08-31 |
| Adopt the structured worker report incl. Verification target + the do-not-expand-scope clause into convention 5 | Zaal | PR | 2026-08-31 |
| Message Nick: add a LICENSE file to telecast to match the ISC in package.json | Zaal | DM | 2026-08-28 |
| Land the open PR #1 on 99darwin/juke-space-recap before opening new threads with him | Zaal | PR | 2026-08-29 |
| Decide Zuke self-host vs hosted now that developer_key_service.py removes the key blocker | Zaal | Decision | 2026-09-05 |

## Sources

All five repos cloned to a scratch dir, one clone per repo, and read from disk.

- [99darwin/orchestrator](https://github.com/99darwin/orchestrator) - `SKILL.md`, `references/parallel-safety.md`, `assets/worker-prompt.md` read in full from the clone; LICENSE read from file **[FULL - git clone + cat]**
- [99darwin/obsidian-vault-scaffolder](https://github.com/99darwin/obsidian-vault-scaffolder) - `SKILL.md`, tree, `benchmarks/README.md`, `benchmarks/iteration-1/benchmark.json`; LICENSE from file **[FULL - git clone + cat]**
- [99darwin/telecast](https://github.com/99darwin/telecast) - full file tree, `bot.ts` command surface, `utils/fc/signer.ts` head, `package.json`; licence absence verified by `ls -a` on the clone **[FULL - git clone + cat]**
- [99darwin/farcaster-audio](https://github.com/99darwin/farcaster-audio) - tree, router + service inventory, per-file LOC, `routers/developer.py` symbol map; LICENSE from file **[PARTIAL - 24,375 backend lines; inventoried and spot-read, not line-by-line]**
- [99darwin/nexus](https://github.com/99darwin/nexus) - tree, `README.md` architecture, `packages/agent/src/` inventory, model-tier grep; LICENSE from file **[PARTIAL - 13,382 TS lines; inventoried, agent package spot-read]**
- Repo metadata (stars, push dates, sizes) via `gh api repos/99darwin/<name>` **[FULL]**
- Our own ground truth: `grep -rn "write-set\|parallel-safe"` over `/Users/zaalpanthaki/Documents/ZAO OS V1/.claude/rules/` and `~/zao-vault/handoffs/lanes.md` - **zero hits**, the negative signal behind ranks 1-3 **[FULL]**

**Path not verified:** "convention 5" and the lane brief template are named as targets from Zaal's own context; `grep` for a numbered convention 5 in `.claude/rules/lane-autonomy.md` and `~/zao-vault/handoffs/lanes.md` did not locate a literal file this session. Whoever ports these should confirm the path before editing.
