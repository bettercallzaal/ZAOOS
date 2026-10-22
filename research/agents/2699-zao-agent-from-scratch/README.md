---
topic: agents
type: decision
status: research-complete
last-validated: 2026-10-22
superseded-by:
related-docs: "agents/601-agent-stack-cleanup-decision, agents/673-zoe-bonfires-dialog-automation, agents/2188-cheap-fleet-premium-escalation, agents/2438-hermes-agent-concepts-zoe-runtime, agents/2235-zoe-vs-agent-toolkits-audit, agents/483-hermes-agent-local-llm-framework, agents/632-r-hermesagent-subreddit"
original-query: "building a hermes agent from scratch and knowing every line that's in there to try and build a functioning zao agent that can help not only me as zaal but my whole team"
tier: STANDARD
---

# 2699 - A ZAO agent built from scratch, where every line is known

> **NO NEW BOT WITHOUT THIS DOC AND ZAAL'S EXPLICIT APPROVAL.** ZAOOS `CLAUDE.md`
> ("Rule: no new bots without doc") and `research/agents/601-agent-stack-cleanup-decision/`.
> Nothing described here runs as a bot, polls a Telegram token, or gets a systemd unit
> until Zaal approves this doc in writing. Until then every PR below is library code
> plus tests, with no entrypoint.

> **Goal:** Say what a from-scratch ZAO agent would be, for Zaal and for the team, what
> to carry over from `bot/src/` and what to leave, a build plan in small PRs, and the
> monthly cost, grounded in a measured inventory of the code we already run.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **BUILD a small new core in TypeScript (`bot/src/zao-agent/`), do NOT adopt NousResearch Hermes Agent and do NOT keep growing ZOE's monolith.** | "Knowing every line" fails on both alternatives. Hermes Agent is a 1,296,151 KB repo with 11,152 Python files (GitHub API, 2026-10-22). ZOE plus Hermes is 227 modules and 57,598 lines (measured below), and `zoe/index.ts` alone is 5,025 lines. A new core can be held to a line budget a person can read. |
| 2 | **Hard line budget: the core stays under 2,500 lines of non-test code, and every PR is under 400.** Each PR body lists every file it adds with its line count. | Makes "knowing every line" a checkable property instead of a hope. A PR that breaks the budget is split, not merged. |
| 3 | **PORT, by reading, about 15 audited functions from `bot/src/hermes` and `bot/src/zoe`** (table below). Copy the function, read every line, keep the test. Do not import across the boundary. | These already encode lessons we paid for (talk-only CLI args, PII scan, free-tier refusal, send cap, PR opener). Importing would drag the whole graph back in: 210 of the 227 modules are reachable from `zoe/index.ts`. |
| 4 | **Gates are one module, not scattered checks.** Every tool call is classified first; money, public, outbound, on-chain, deletes, settings, hooks and merge guards never execute, they produce a Zaal approval card. | The gap doc `agents/2235-zoe-vs-agent-toolkits-audit` named: ZOE's guards (cost, PII, preflight) are scattered, not one interface. Hermes Agent's own security page puts "dangerous command approval" as layer 2 of 8 and ships a `--yolo` switch that turns it all off; ours has no off switch. |
| 5 | **Memory is the vault and the cowork board, read through the tools we already have.** No new database. | `.claude/rules/handoff-discipline.md` rule 7 already names the stores. The agent reads `~/zao-vault` (git, read-only) and writes the board only through `zao-tracker create --why --done-when` (`capture-quality.md` rule 3). |
| 6 | **Hands are PR-only.** The agent's only write path to code is a worktree, a commit, a ready PR with the `hold` label. It never merges. | `agent-loops.md` rules 8, 25 and 38. `hermes/git.ts:48` and `hermes/pr.ts:36` already do the worktree and the PR. |
| 7 | **The team is an allowlist of Telegram user ids mapped to people in the vault, with two roles: `zaal` and `member`.** Members can ask, capture and get answers; only `zaal` can approve a gated card. | "Help not only me but my whole team." ZOE today routes DMs from `ZAAL_TELEGRAM_ID` only (`zoe/index.ts:4`) and keeps per-group member allowlists (`zoe/index.ts:1817`, `zoe/groups.ts:48`). |
| 8 | **Whether it is a NEW bot or ZOE's next core is Zaal's call (Question 1).** Default: it becomes ZOE's next core under the existing `@zaoclaw_bot` identity, no new token, no new process. | `CLAUDE.md` lists "ZOE v2 / Agent Zero migration plan" as decommissioned 2026-05-04, and doc `agents/2438-hermes-agent-concepts-zoe-runtime` (decision 4) flagged the same naming risk. A new core behind the same identity is not a new bot; a second bot is, and needs this doc approved. |

## Phase 1 inventory: what we already run (measured 2026-10-22)

**Source:** `origin/main` at `833807fc6c44d096ffd2d50c2e78eb994cb1bb32`, read with a script that parses
`import`/`export ... from`/`import()` across all non-test `bot/src/**/*.ts`, then walks the
graph from `bot/src/zoe/index.ts`. The full per-file table (path, lines, header comment, local
import count, importers, in-graph yes/no, `featureRan` names) is
[`inventory.md`](./inventory.md), 227 rows.

| Measure | Value | Source |
|---|---|---|
| `bot/src/zoe/` non-test modules | 214 files, 54,273 lines | script over `git ls-tree origin/main` |
| `bot/src/hermes/` non-test modules | 13 files, 3,325 lines | same |
| Reachable from `zoe/index.ts` | 210 of 227 | import-graph walk |
| Not reachable (no importer outside tests, no script names them) | 17: `hermes/commands.ts`, `zoe/advisors.ts`, `zoe/agents/{decay,index,newsletter}.ts`, `zoe/bus-receipt.ts`, `zoe/bus-upload.ts`, `zoe/caster/mention-listener.ts`, `zoe/farcaster/{read-node,wiki}.ts`, `zoe/federation-checkpoint.ts`, `zoe/federation-states.ts`, `zoe/golden-eval.ts`, `zoe/mcp/farcaster-{client,server}.ts`, `zoe/node-cron.d.ts`, `zoe/teammate-heartbeat.ts` | graph walk, plus `git grep` of `origin/main` excluding `research/` for each basename |
| Largest modules | `index.ts` 5,025, `scheduler.ts` 2,220, `discord.ts` 1,113, `send-budget.ts` 989, `memory.ts` 958, `grill.ts` 926 | line counts |
| Hermes modules ZOE uses | all 12 except `commands.ts` (which only the ZAOstock bot entry `bot/src/index.ts` imports) | importer lists |

`hermes/commands.ts` being outside ZOE's graph is not a dead file: `bot/src/index.ts` imports it. The
other 16 had no importer I could find in that `git grep`; I did not search the VPS crontab for
direct `tsx` invocations of them, so "unused" is not proven for those 16.

### Liveness, read on the VPS (read-only, nothing restarted)

| Process | State | How I know |
|---|---|---|
| `zoe-bot.service` | active, runs `~/zao-bot-live/bot/src/zoe/index.ts` | `systemctl --user is-active`, unit file `bot/systemd/zoe-bot.service` |
| Live clone `~/zao-bot-live` | HEAD `d6d14b1d` (2026-10-22 01:11 -0400), one commit behind origin/main (`833807fc`, a rules-only change) | `git -C ~/zao-bot-live rev-parse` |
| ZOE restarts | 1 start in the last 3 h, 26 in 24 h, 44 in 3 days (09:10 UTC 2026-10-22). Each is a clean `Stopping` then `Started` at `:x0:05`, `NRestarts=0`, so not crashes | `journalctl --user -u zoe-bot`, `systemctl show -p NRestarts` |
| Why ZOE restarts on every merge | cron `*/10 * * * * ~/bin/zoe-autodeploy.sh`. The **running** copy (`~/bin/zoe-autodeploy.sh`, 120 lines) exits at line 17 only if HEAD equals origin/main, otherwise restarts at line 97, so ANY commit restarts ZOE, docs included. The **repo** copy (`~/zao-bot-live/scripts/zoe-autodeploy.sh`, 210 lines) documents at line 40 the fix where docs-only merges fast-forward with no restart. `cmp`: the two differ at line 2. Merged, not live (`.claude/rules/vanishing-dependencies.md` rule 6, `.claude/rules/state-claims.md` rule 5). **Swapping the VPS script is Zaal's.** | `crontab -l`, `grep -n` on both copies, `cmp` |
| `zao-devz-stack.service` (Coder + Critic dual bot) | active since 2026-10-17 15:54 UTC, but runs from `~/zaostock-bot` at `a83ec3e` (2026-09-09): a stale deploy, six weeks behind | unit file ExecStart, `git -C ~/zaostock-bot log -1` |
| Hermes coder/critic `/fix` runs | none logged by the devz stack in 14 days (13 journal lines total, all start/stop) | `journalctl --user -u zao-devz-stack --since -14d` |
| Hermes runner inside ZOE | **UNKNOWN**. `hermes/runner.ts` has no `featureRan` call and logs only on failure (`runner.ts:181`), so silence cannot mean "did not run" (`state-claims.md`, "Silence is not evidence") | grep of `bot/src/hermes/*.ts` for `featureRan`: zero hits |
| What ZOE actually did in 3 days | `featureRan` lines: tick-lock 43, pinned-brief-tick 43, orchestrator-tick 43, discord-slash 43, pinned-brief 40, claude-auth-probe 28, auto-close 23, inbox-nudge 9, repo-improver-scout 7, mission-control 7, receipts 6, sleep-checkin 4, reflect 3, quiet-window 3, backlog-grill 3, afferent-digest 3, grill-pause 1. These are once-per-boot, so the counts track the 44 boots, not usage | `journalctl ... grep "[zoe/ran]"` |
| Repo-improver loop | 106 log lines in 14 days; 4 ticks failed on OpenRouter 429 | same journal |

**What this tells the build:** most of ZOE's 54k lines are schedulers and surfaces around a
small core (model call, memory read, reply, a PR path). The core is what a from-scratch agent
rebuilds; the surfaces are what it should not.

## The external "Hermes Agent" (NousResearch)

The superpowers skill reference `skills/using-superpowers/references/hermes-tools.md` (superpowers
7.0.0 plugin cache) maps skill actions to Hermes Agent tools (`read_file`, `patch`, `terminal`,
`delegate_task`, `skill_view`) and names `~/.hermes/SOUL.md` as the global instructions file. It
does not name a repo. The repo whose README describes `SOUL.md` as the "persona file" and
`~/.hermes` as home is **`NousResearch/hermes-agent`**.

| Fact | Value | Method |
|---|---|---|
| Owner, repo | Nous Research, `github.com/NousResearch/hermes-agent` | GitHub API `repos/NousResearch/hermes-agent` |
| Licence | MIT, "Copyright (c) 2025 Nous Research" | LICENSE file read via `gh api .../license`, base64-decoded |
| Latest release | v0.22.4, 2026-10-21 | `gh api .../releases` |
| Size | 1,296,151 KB, 55,883 forks, 50,486 open issues | GitHub API |
| Python files | 11,152 (code-search count) | `gh api search/code?q=repo:...+extension:py` |
| Features (README) | Telegram, Discord, Slack, WhatsApp, Signal and CLI from one gateway; agent-curated memory; autonomous skill creation; built-in cron; subagents; seven terminal backends | README raw via GitHub API |
| Security model | eight layers; layer 2 is "Dangerous command approval - human-in-the-loop for destructive operations"; `approvals.mode: off` or `--yolo` disables all prompts | docs page `user-guide/security`, curl + HTML strip |

ZAO's own `bot/src/hermes/` is unrelated code with the same name
(`research/agents/632-r-hermesagent-subreddit/`). Hermes Agent is a good map of what a personal
agent has (gateway, memory, skills, cron, subagents, approvals); it is not a codebase anyone at
ZAO will know every line of.

## Options compared

| Option | Lines to know | Team use | Gates | Fits ZAO memory (vault + board) | Verdict |
|---|---|---|---|---|---|
| A. Adopt NousResearch Hermes Agent | 11,152 Python files, 1.3 GB repo | Yes: DM pairing, allowlists | Built in, but can be switched off (`--yolo`) | No: own MEMORY.md / USER.md / SQLite state | **SKIP** as the ZAO agent. Read its docs as a feature checklist. |
| B. Keep growing ZOE | 57,598 lines, 227 modules, 5,025-line entry | Partly: Zaal DMs plus allowlisted groups | Scattered (`cost-governance.ts`, `pii.ts`, `preflight.ts`, `send-budget.ts`) | Partly: `~/.zao/zoe/*.md` blocks, Bonfire recall, board via `team-tracker.ts` | **KEEP RUNNING** until the new core replaces its centre; stop adding surfaces. |
| C. New small core, port audited functions | under 2,500 by budget | Yes, by design: roster plus two roles | One `gates.ts`, no off switch | Yes: vault read-only, board through `zao-tracker` | **USE.** |

Community signal, Hacker News "Migrate from OpenClaw" thread (item 48586005, 122 points, 105
comments, 2026-06-18), read raw via the Algolia items API: one user wrote "I can't stand how
much crap comes along with it... Pi is the perfect clean slate" (alasano, 48586693); another,
"none of these projects inspire enough trust to justify being installed - let alone directly on
the machine I use every day" (_pdp_, 48586581); a third uses it because building the gateway
"is not a problem I care about solving right now" (chapel, 48586674). That is the trade in one
thread: size and trust on one side, time saved on the other. Zaal's ask picks the first.

## What the from-scratch agent is

```
 Telegram (DM + allowlisted groups)            later: Discord adapter
            |
   adapter/telegram.ts  (grammY, the ONLY entrypoint, added last)
            |
   core/loop.ts  message -> who (roster) -> context -> model -> tool calls -> reply
            |                  |              |           |
   core/roster.ts       memory/vault.ts   models/route.ts   tools/*
   (tg id -> person,    (git read-only    (CLI on plan,     every call passes
    role zaal|member)    ~/zao-vault)      API fallback,     core/gates.ts FIRST
                         memory/board.ts   free-tier refusal)
                         (zao-tracker)
            |
   core/gates.ts  money | public | outbound | on-chain | delete | settings | hooks | merge-guard
            |  gated -> approval card to Zaal (inline buttons), never executed by the agent
            |  open  -> tool runs
   hands/pr.ts  worktree off origin/main -> commit -> ready PR + hold label (never merge)
            |
   obs/ran.ts  featureRan on success + a beat file per cycle
```

What a team member can do: ask a question answered from the vault and the board; capture an
idea or task (boarded with WHY and DONE-WHEN, or held for one button question, as
`team-tracker.ts` does today); ask for a code change, which becomes a ready PR with `hold`;
see their own open board items. What only Zaal can do: tap Approve on a gated card.

## Keep and drop, cited

**Port by reading (copy into the new core, read every line, bring the test):**

| Function | Where | Why it earns a place |
|---|---|---|
| `callClaudeCli`, `talkOnlyArgs`, `classifyClaudeError` | `bot/src/hermes/claude-cli.ts:260`, `:61`, `:218` | The model call on the plan, a tool-less mode, and cap/auth error classes we hit for real |
| `makeWorkdir` | `bot/src/hermes/git.ts:48` | Per-run isolated workdir |
| `openPullRequest` | `bot/src/hermes/pr.ts:36` | The one write path to code |
| `runPreFlightGate` | `bot/src/hermes/preflight.ts:35` | Typecheck/test before a PR opens (`loop-evals.md` A) |
| `runCritic` | `bot/src/hermes/critic.ts:93` | A second read before a PR; keep the single-critic path only, not the panel/shadow code (`:311`, `:554`) |
| `featureRan` | `bot/src/zoe/feature-ran.ts:40` | Without it silence means nothing |
| `scanPii` | `bot/src/zoe/pii.ts:80` | `pii-hygiene.md` allowlists, already encoded |
| `assertNotFreeTier` | `bot/src/zoe/models/free-tier.ts:24` | `claude-usage.md`: private text never reaches a free model |
| `shouldPauseAutonomousWork` | `bot/src/zoe/cost-governance.ts:109` | Spend ceiling (`agent-loops.md` rule 5) |
| `DEFAULT_DAILY_SEND_CAP` and gated hourly cap | `bot/src/zoe/send-budget.ts:198`, `:226` | Outbound volume ceiling |
| `toolsFor`, `NO_TOOLS_DENY` | `bot/src/zoe/concierge.ts:368`, `:379` | The deny list for a chat turn |
| `containsSecret` | `bot/src/zoe/recall.ts:71` | Keeps secrets out of model context |
| `getOpenTeamTasks` | `bot/src/zoe/team-tracker.ts:56` | Board read |

**Leave behind (not ported; nothing is deleted from ZOE by this doc):**

| What | Where | Why |
|---|---|---|
| The 5,025-line entry | `bot/src/zoe/index.ts` | It is the thing that cannot be known line by line |
| Scheduler and tick fleet | `zoe/scheduler.ts` (2,220), `orchestrator-tick.ts` (808), `backlog-grill-runner.ts` (803) | Timers are cron, not agent code (`code-over-inference.md` rule 2) |
| Discord surface | `zoe/discord.ts` (1,113), `discord-admin.ts` (515) | Second adapter, after Telegram works |
| Critic panel, shadow mode, Codex critic | `hermes/critic.ts:311`, `:554`; `hermes/codex-cli.ts` | Complexity before the single critic has a reliability number |
| Devz dual-bot | `bot/src/devz/` | Two bot identities narrating one pipeline; and its deploy is six weeks stale |
| The 17 unreachable modules | listed above | No caller in ZOE's graph |

## Build plan, small PRs

Every PR: under 400 non-test lines, a file list with line counts in the body, `npm run
typecheck` and the full bot `vitest run` green, opened ready with `hold`, no entrypoint until PR 7.

| PR | Adds | Done when |
|---|---|---|
| 0 | This doc | Zaal approves or rejects it (the bot gate) |
| 1 | `core/loop.ts` + types: one turn, fake model, fake tools | Unit tests drive a turn end to end with no network |
| 2 | `core/gates.ts`: classify a tool call into the eight gated kinds or open | Table test per kind, plus the ones it must NOT block (`loop-evals.md`, "both directions") |
| 3 | `core/roster.ts`: Telegram id -> person -> role, read from a vault file | Unknown id gets a refusal; `member` cannot approve |
| 4 | `memory/vault.ts` (read-only `git -C ~/zao-vault show origin/main:<path>`) and `memory/board.ts` (`zao-tracker` read, create with `--why --done-when`) | Reads name their source and ref in the reply |
| 5 | `models/route.ts`: ported `callClaudeCli`, `assertNotFreeTier`, spend pause | A free-tier id throws; a cap error falls back as `claude-usage.md` orders |
| 6 | `hands/pr.ts`: ported `makeWorkdir`, `runPreFlightGate`, `openPullRequest`, `runCritic`; always `hold` | A dry-run against a scratch repo opens nothing and prints the PR it would open |
| 7 | `adapter/telegram.ts`, the only entrypoint. **Not deployed by the PR.** | Zaal has approved this doc AND answered Question 1 |
| 8 | `obs/ran.ts` + beat file in `~/.zao/beats/` | A stale beat is visible to the existing watcher (`silent-failure-guard.md` rule 10) |

Annotations: PRs 1 to 6 are grounded live-code edits (the Claude Code tier, `claude-usage.md`);
the "both directions" gate tests in PR 2 are the high-stakes part and get a fresh-context
evaluator (`/zao-evaluate`) before merge.

## Cost per month

Prices fetched 2026-10-22. Volume is an **assumption**, not a measurement: 10 team members, 20
turns each a day, 6,000 turns a month, about 8,000 input and 500 output tokens a turn.

| Line | Monthly | Source |
|---|---|---|
| VPS | $0 incremental: runs on the existing VPS beside ZOE | `research/infrastructure/826-zao-infrastructure-estate-map/` ("already paid"); that box's own monthly price appears as $25 and as ~$30 in different repo docs, UNVERIFIED |
| Telegram Bot API | Not priced in the page I read beyond one rule: broadcasts above "the free amount of 30 per second" cost 0.1 Stars a message. A team bot stays far under that. ZOE runs today with no Telegram bill in any doc I found | core.telegram.org/bots/faq |
| Model, Claude Haiku 5.5 API | 48M in x $0.10 + 3M out x $0.50 = **about $6** | docs.anthropic.com pricing: Haiku 5.5 $0.10 / MTok in, $0.50 out |
| Model, Claude Sonnet 5.5 API | 48M x $2 + 3M x $10 = **about $126** | same page: $2 / $10 |
| Model, OpenRouter DeepSeek V3.2 | 48M x $0.28 + 3M x $0.42 = **about $15** | `openrouter.ai/api/v1/models` JSON |
| Model, on Zaal's Claude Max plan through the CLI | $0 marginal on top of the plan (Max "From $100 Per month") | claude.com/pricing |
| Measured turn cost in our own Claude Code fleet, for scale | Sonnet 5.5 $0.03, Haiku 5.5 $0.01 a turn (7 days to 2026-10-17) | `.claude/rules/agent-spend.md` |

Recommended default: Haiku 5.5 for routing and short answers, Sonnet 5.5 for code requests,
both on the API with a hard monthly cap. The split of turns between them is also an
assumption; at the same 8,000 in / 500 out per turn:

| Haiku / Sonnet split | Haiku turns, cost | Sonnet turns, cost | Monthly |
|---|---|---|---|
| 90 / 10 | 5,400: 43.2M x $0.10 + 2.7M x $0.50 = $5.67 | 600: 4.8M x $2 + 0.3M x $10 = $12.60 | **about $18** |
| 80 / 20 | 4,800: $3.84 + $1.20 = $5.04 | 1,200: $19.20 + $6.00 = $25.20 | **about $30** |
| 60 / 40 | 3,600: $2.88 + $0.90 = $3.78 | 2,400: $38.40 + $12.00 = $50.40 | **about $54** |

So roughly **$18 to $54 a month** at the assumed volume. Whether a team-facing bot may run on Zaal's personal Max plan through the CLI is
**UNVERIFIED**: I did not fetch the consumer terms for that use. That is Question 2.

## Also found (route to the seat, not built here)

- ZOE restarts on every merge to main because the running `~/bin/zoe-autodeploy.sh` is the old
  120-line copy (see liveness table). The swap is Zaal's.
- The devz dual-bot runs a six-week-old clone (`~/zaostock-bot` at `a83ec3e`).
- `hermes/runner.ts` has no success-path `featureRan`, so whether ZOE's fix pipeline ever runs
  cannot be read from logs.

## Questions for Zaal

The same three are in the lane's vault status file for the grill to ask. Each has a default
the lane takes only if Zaal says so; none is auto-proceeded, because Q1 decides whether a bot
exists, Q2 is money and Q3 is a fact only he knows.

**Q1. Is the from-scratch agent a NEW bot, or ZOE's next core?** The no-new-bots rule needs
this doc approved before anything runs, and "ZOE v2" is on the decommissioned list.
- A (recommended): ZOE's next core. Built as `bot/src/zao-agent/`, later run behind the
  existing `@zaoclaw_bot` identity. No new token, no new process. Next: PRs 1 to 6, library code only.
- B: a separate new bot for the team. New Telegram token, its own process beside ZOE, two
  agents to keep in sync. Next: Zaal approves this doc as the bot doc, then the same PRs plus a unit.
- C: do not build; keep extending ZOE. Next: the lane closes and this doc stays as a record.

**Q2. Which model plan pays for team use?** ZOE today calls the Claude CLI on Zaal's Max plan.
Whether a team-facing bot may run on a personal Max plan is UNVERIFIED (terms not read).
- A (recommended): API with a hard monthly cap, Haiku for routing and short answers, Sonnet
  for code requests, about $18 to $54 a month at the assumed volume (table above). Next: Zaal
  sets the cap; the key goes in through `/secret`.
- B: the Max plan through the CLI, $0 marginal. Next: Zaal confirms the terms allow team use.
- C: OpenRouter DeepSeek V3.2, about $15 a month, paid model only, never `:free` with team data.

**Q3. Who is on the team roster for the first version?** The agent answers only Telegram ids
on a roster file in the vault, with two roles: `zaal` (can approve gated cards) and `member`
(can ask, capture, request PRs).
- A (recommended): Zaal plus the 2 or 3 people who use the cowork board most; widen after a week.
- B: everyone in the ZAO team Telegram group from day one; more cost and more noise to tune.
- C: Zaal only for two weeks, then widen.

## Next Actions

| Action | Owner | Type | Gate |
|---|---|---|---|
| Approve or reject this doc as the bot doc | Zaal | decision | Zaal (no-new-bots rule) |
| Answer Questions 1 to 3 (new bot vs ZOE core; plan vs API; who is on the team roster) | Zaal | decision | Zaal |
| PR 1 `core/loop.ts` | lane zao-agent | PR | none, library code only |
| PR 2 `core/gates.ts` with both-direction tests | lane zao-agent | PR | evaluator verdict |
| Swap `~/bin/zoe-autodeploy.sh` for the repo copy | Zaal | VPS change | Zaal |
| Redeploy or retire the devz stack's stale clone | Zaal | VPS change | Zaal |
| Add a success-path `featureRan` to `hermes/runner.ts` | ZOE lane | PR | none |

## Sources

| Source | Status | Method |
|---|---|---|
| [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) repo metadata, README, LICENSE, releases, languages | [FULL] | `gh api` (raw README and LICENSE base64-decoded) |
| [Hermes Agent security docs](https://hermes-agent.nousresearch.com/docs/user-guide/security) | [FULL] | curl + HTML strip, 62,164 chars of text |
| [HN: Migrate from OpenClaw](https://news.ycombinator.com/item?id=48586005) | [FULL] | Algolia items API, 102 comments parsed |
| [HN story search, "hermes agent nous"](https://hn.algolia.com/api/v1/search?query=hermes%20agent%20nous&tags=story) | [FULL] | Algolia JSON |
| [Anthropic API pricing](https://docs.anthropic.com/en/docs/about-claude/pricing) | [PARTIAL - the cache columns' order was not confirmed, so only base input/output prices are used] | curl -L + HTML strip |
| [Claude plans pricing](https://claude.com/pricing) | [PARTIAL - plan prices read; terms of use for a team bot on a personal plan not fetched, see Question 2] | curl -L + HTML strip |
| [OpenRouter models API](https://openrouter.ai/api/v1/models) | [FULL] | JSON |
| [Telegram Bots FAQ](https://core.telegram.org/bots/faq) | [FULL] | curl + HTML strip |
| [Anthropic, Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) | [FULL] | curl -L; quoted: "the most successful implementations weren't using complex frameworks or specialized libraries. Instead, they were building with simple, composable patterns." |
| [r/hermesagent top of month](https://www.reddit.com/r/hermesagent/top/?t=month) | [FAILED - `zao-fetch-reddit.sh` has no OAuth file; gstack browse returned the HTML app shell, not JSON. HN used as the community source instead] | both tried |
| ZAOOS `origin/main` `833807fc`, `bot/src/hermes`, `bot/src/zoe` | [FULL] | import-graph script, `git grep`, `grep -n` |
| VPS `zoe-bot`, `zao-devz-stack`, crontab, autodeploy scripts | [FULL] | ssh, read-only: systemctl, journalctl, git, cmp |
| `research/agents/601-agent-stack-cleanup-decision/`, `673-zoe-bonfires-dialog-automation/`, `2188-cheap-fleet-premium-escalation/`, `2438-hermes-agent-concepts-zoe-runtime/`, `2235-zoe-vs-agent-toolkits-audit/`, `483-hermes-agent-local-llm-framework/`, `632-r-hermesagent-subreddit/` | [FULL] for 601, 673, 2188 heads and decisions; [PARTIAL - heads and decision tables only] for 2438, 2235, 483, 632 | local read |

Credit: the feature checklist in "Options compared" follows the NousResearch/hermes-agent README
and security page (MIT). No code from it is used.
