---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-29
superseded-by:
related-docs: 2204, 999, 1090, 555, 364, 727, 165, 653
original-query: "can u /zao-research on agent orcestration and help me have a 24/7 going claude code session on forwarding all prgohres on these todos"
tier: STANDARD
---

# 2444 - The always-on orchestrator: 91.5% of ZAO's agent meter is context handling, not work

> **Goal:** Decide the shape of a 24/7 orchestrator that forwards progress on todos with no human watching - priced against ZAO's own 20-day meter, and built on Claude Code mechanisms that already exist rather than new ones.

## Key Decisions (recommendations first)

| # | Decision | Grounded in | Grade |
|---|----------|-------------|-------|
| 1 | **The always-on part is a deterministic tick with no LLM. Claude wakes only on a non-empty delta.** | Over 20 days ZAO's meter was **56.6% cache_read + 34.9% cache_write = 91.5% context handling**, and only **8.4% output**. These shares are fixed by the rate card and hold at any model mix. A session that ticks all day re-reads its whole history to discover nothing changed. | A |
| 2 | **Use the native queued-approval path, do not build one.** A `PermissionRequest` hook returning `"defer"` exits headless with `stop_reason: "tool_deferred"` and the pending call preserved; resume later with `claude -p --resume <session-id>` and an `"allow"` decision. That is exactly "agent works overnight, Zaal taps in the morning", already shipped. | docs.claude.com hooks reference; local CLI is 2.1.251, past every version gate below | A |
| 3 | **Turn on the two native push settings instead of a custom notifier.** `agentPushNotifEnabled` (already true here) and `inputNeededNotifEnabled` (unset) deliver to the phone over Remote Control. `zao-notify.sh` stays for the Telegram digest rung, not for every event. | settings-reference; measured `~/.claude/settings.json` | A |
| 4 | **One always-on process, many disposable sessions. State lives in vault files.** | The ZAOstock orchestrator was killed mid-event 2026-08-29 11:47 and lost nothing - `claude --resume` rebuilt it from the JSONL transcript because its ledger was a file. Transcript retention here is `cleanupPeriodDays: 90`. | A |
| 5 | **Cap parallel subagents and never let their results land unbounded in one parent.** | anthropics/claude-code#23463 (closed): 7 subagent results, 150KB combined, 209 messages, 6.2MB session - parent hit unrecoverable "Prompt too long", could not summarize or degrade, user recovered output by hand-parsing JSONL. #25714 is the same shape. | A |
| 6 | **Escalation ladder: log -> vault digest -> Telegram -> push. Default to the lowest rung that carries the fact.** | The ZABAL orchestrator ran 14 ticks on battle day, 6 of them no-change, and sent exactly 1 push. That ratio is the target, and under decision 1 those 6 cost nothing. | A |
| 7 | **Every per-run resource names its release in the file that creates it.** | Two leaks the same day: Orca `organizer-tick` (*/5) leaked 136 tabs (runs 11-246); 50 Claude sessions against 40 panes, 13 idle 2-3 days. Machine: load 313 on 10 cores, swap 30.2G of 31.7G, 4.3M pageouts. Filed ZAOOS#3361. | A |
| 8 | **Put the tick on ansuz, not the Mac.** | ansuz: up 20 days, load average 0.08, node v20.20.2, already runs ZOL. The Mac at that moment: load 313. The tick needs `gh`, `curl`, `python3` - not an LLM. | B |
| 9 | **Never poll a hot remote row on a short interval.** | `lane-relay-daemon` polled Supabase every 6s per lane against a 280KB jsonb blob: 18.69GB egress against a 5.5GB quota, board REST API at HTTP 402 until 2026-09-21. Raised to 60s as a tourniquet; the row is still unpruned. | A |

## The number that decides it

`~/bin/zao-spend` prices session transcripts at list rates and puts the figure next to what it bought. It is a **meter, not an invoice** - Zaal is on Claude Max, so the subscription covers it to the cap. Ledger `~/.zao/spend-ledger.jsonl`, 334 rows, 2026-08-10T14:10:51Z to 2026-08-29T19:17:06Z.

Twenty-day token totals: **in 6.3M, out 58.1M, cache_write 967.4M, cache_read 19,598.7M.**

Priced against the script's own rate card (`sonnet` 3.00 / 15.00 / 3.75 / 0.30 per 1M for in/out/cache-write/cache-read; `opus` 15.00 / 75.00 / 18.75 / 1.50):

| Token kind | Share of tokens | Share of cost | Cost if all sonnet | Cost if all opus |
|-----------|----------------|---------------|--------------------|------------------|
| cache_read | 95.0% | **56.6%** | $5,880 | $29,398 |
| cache_write | 4.7% | **34.9%** | $3,628 | $18,138 |
| output | 0.28% | 8.4% | $871 | $4,354 |
| input | 0.03% | 0.2% | $19 | $95 |
| **total** | | | **$10,397** | **$51,985** |

The ledger's own figure, $34,636, sits between those bounds, consistent with a mixed roster. The cost *shares* do not move with the mix - they are set by the ratios in the rate card - so the headline is model-independent:

> **91.5% of the meter is handling context. 8.4% is producing output.**

That is the whole argument for decision 1. A long-lived session pays the 91.5% every turn whether or not anything happened. A tick that finds no change should cost zero, and under a deterministic tick it does.

The per-day table, for the second-order effect:

| Day | Meter | PRs | Peak sessions | Meter per PR |
|-----|-------|-----|---------------|--------------|
| 08-18 | $337 | 11 | 7 | $31 |
| 08-20 | $2,578 | 53 | 20 | $49 |
| 08-23 | $1,610 | 31 | 7 | $52 |
| 08-25 | $1,964 | 14 | 9 | $140 |
| **08-26** | **$4,150** | **12** | **201** | **$346** |
| **08-27** | **$2,815** | **2** | **296** | **$1,408** |
| 08-28 | $1,100 | 16 | 17 | $69 |
| 08-29 | $601 | 5 | 17 | $120 |

Totals: $34,636 over 20 days, 232 PRs, ~$149 per PR.

**Honest reading.** The two 200+ session days are the two worst meter-per-PR days by 3-10x against the median, but that is n=2, PRs land in bursts, and real work does not always become a PR. The table alone cannot carry a causal claim. What makes it more than coincidence is that the mechanism was measured directly on 2026-08-29 - 50 sessions, swap 30.2G of 31.7G, `kernel_task` at 189% CPU, load 313 on 10 cores. Sessions past the memory line do less work per dollar because the machine is paging, not because of a mystery.

## What the wider field does (verified 2026-08-29)

Every GitHub issue below was checked with `gh api` and the state and title match the claim.

| Mechanism | What it actually is | Evidence |
|-----------|--------------------|----------|
| `claude -p` headless | Runs one turn and exits. **Not a daemon.** A daemonizable headless mode is still an open feature request. | anthropics/claude-code#30447, OPEN, filed 2026-03-03, "Feature Request: claude remote-control --headless - daemonizable remote control without TTY" |
| tmux / detached session | Survives disconnect; state written to tmux options on change rather than polled. Community tooling exists. | craftzdog/tmux-claude-session-manager. **Not applicable here** - the estate moved to Orca; `tmux ls` returns no server on this machine |
| GitHub Actions on a cron | The official scheduled path. Runs on a fresh checkout, no local infra. | code.claude.com/docs/en/github-actions, fetched raw: GitHub "runs scheduled workflows only from the default branch and, in public repositories, disables the schedule after 60 days without repository activity" |
| Claude Agent SDK loop | The loop is a plain while-loop with retries built in and **no safety rails by default** - `max_turns` and a budget cap must be set explicitly | secondary (Medium), directionally consistent with #41930 below |
| Stateless tick | Fresh session per tick, state serialized to files, context injected rather than threaded. Eliminates accumulation. | secondary (DEV Community) - but it is exactly what decision 1 and 4 describe, and ZAO has already proven the state-on-disk half |

Failure modes, all confirmed in the official tracker:

- **#23463** (closed, 2026-02-05) "Subagent results silently overflow context, causing unrecoverable session crash" - 7 subagent results at 15-37K chars each, parent unrecoverable, no error surfaced to the user.
- **#25714** (closed, 2026-02-14) "Uncontrolled background agent parallelization causes context overflow, session death, and waste".
- **#67524** (closed, 2026-06-11) "Background subagents (Agent tool) die silently on session pause/resume - no failure notification".
- **#34629** (closed, 2026-03-15) "Prompt cache regression in --print --resume since v2.1.69: cache_read never grows, ~20x" - the cache breaking is what a *bad* run looks like. ZAO's 95% cache_read is the healthy state; the cost problem here is volume, not a bug.
- **#41930** (closed, 2026-04-01) "Critical: Widespread abnormal usage limit drain across all paid tiers since March 23" - the reason an unattended loop needs a hard cap regardless of plan.

Third-party cost figures circulating for always-on agents ($400-$1,500/month typical, $4,200 from one unattended weekend, $0.08/hour for hosted Managed Agents) come from SEO-blog tier sources and are **not used** in any decision above. ZAO's own ledger is better evidence and says the same thing.

## Native mechanisms already in this install (CLI 2.1.251)

Everything below is past its version gate on this machine, and most of it is unused.

| Mechanism | What it gives the 24/7 design | Status here |
|-----------|-------------------------------|-------------|
| `PermissionRequest` hook -> `"defer"` | Queued approval: headless exits with `tool_deferred`, call preserved, resume with `--resume` + `"allow"`. Works only when the turn makes a single tool call. | unused |
| `agentPushNotifEnabled` | "Push when Claude decides" to phone via Remote Control | **true** |
| `inputNeededNotifEnabled` | "Push when actions required" | **unset - turn on** |
| `Notification` hook sub-events | `agent_needs_input`, `agent_completed` (2.1.198+), `permission_prompt`, `idle_prompt`, `quota_auto_resume_*` (2.1.234+). Fire even with desktop notifications off. | hook wired to `zao-notify.sh`, sub-events unused |
| `claude agents` (Agent View) | TUI dashboard of every background session grouped Needs Input / Working / Completed, across projects; footer shows a live count | unused - and it is the board that would have shown the two Terminal.app orchestrators `orca-board` cannot see |
| Session recap / `awaySummaryEnabled` | Auto one-line summary when you return after 3+ min away. The morning-briefing primitive. | unset |
| `Stop` / `SubagentStop` / `StopFailure` / `TeammateIdle` | Turn, subagent, error and idle events for the ladder | Stop wired; others unused |
| `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS` | Headless waits on background subagents up to 10 min by default (2.1.182+) | default |
| `cleanupPeriodDays` | Transcript retention - what makes a killed session resumable | **90** here (default 30) |

## The design

```
ansuz (Pi, load 0.08, up 20d)        Mac                            Zaal
+---------------------------+  +--------------------------+  +------------------+
| tick.sh  */5, no LLM      |  | Monitor (persistent)     |  | rung 3: push     |
| gh PRs/checks/issues      |->| wakes a session ONLY on  |->| (native settings)|
| lane DONE.md files        |  | non-empty delta          |  |                  |
| tracker rows, board state |  |                          |  | rung 2: Telegram |
| -> delta.json             |  | session acts, writes the |  |                  |
|    (empty = exit 0)       |  | vault ledger, then dies  |  | morning: recap   |
+---------------------------+  +--------------------------+  +------------------+
      no tokens spent              tokens only on change        one line per rung
```

| Rung | Carrier | Fires when | Meter cost |
|------|---------|-----------|------------|
| 0 silent | `~/.zao/orca-board.log` line | every tick | none |
| 1 digest | `zao-vault/daily/<date>.md` | any state change | none |
| 2 ping | Telegram via `zao-notify.sh` | lane finished, PR went green, gate opened | none |
| 3 wake | native push (`inputNeededNotifEnabled`) | clock-bound, irreversible, or blocked on Zaal | one push |

The rule that makes it quiet: **a tick that measures no change writes rung 0 and stops.** No session starts, so nothing is spent. Today's loop paid the 91.5% context tax on 6 no-change ticks.

## What ZAO should NOT build

- **A Claude session in a `while true`.** That is what the 91.5% figure is. Long life is the cost, not the feature.
- **A custom notification channel or approval UI.** `"defer"`, the two push settings, and the Notification sub-events are shipped and unused here. Wire them before writing anything.
- **A fifth board.** `orca-board`, the tracker, `grill-next.md` and the vault daily already exist and already disagree in places. `claude agents` covers the gap `orca-board` has. The tick reads them; it does not add another.

## Findings

- **F1.** 91.5% of the 20-day meter is context handling (cache_read 56.6%, cache_write 34.9%); output is 8.4%. Model-independent, set by the rate-card ratios.
- **F2.** The two days peaking above 200 sessions were the two worst meter-per-PR days (296 sessions -> 2 PRs; 20 sessions -> 53 PRs). Correlation at n=2; the paging mechanism was measured directly the same week.
- **F3.** Nothing on this machine reaps. No idle timeout, no session cap, no tab release. 13 sessions were 2-3 days idle; 3 had a working directory inside `~/.Trash`, already emptied.
- **F4.** `orca-board` sees Orca panes only. Two orchestrators run in Terminal.app. On 2026-08-29 an audit read "no Orca pane" as "orphan" and killed the ZAOstock orchestrator mid-event. `claude agents` would have listed it.
- **F5.** State on disk is what makes a session disposable - the killed session lost nothing, and `cleanupPeriodDays: 90` here means a three-month recovery window.
- **F6.** A 6-second remote poll is a quota event: 18.69GB against a 5.5GB Supabase quota, REST API at HTTP 402 until 2026-09-21.
- **F7.** The provider ladder already exists and is stranded. `loop-agent.sh` falls over claude -> codex -> cheap-loop -> noop; `cheap-loop.sh` falls over Ollama -> OpenRouter DeepSeek and exits 0 with no spend if neither is up. It runs only on the VPS, unreachable since 2026-08-26.
- **F8.** ansuz is idle and suited: up 20 days, load 0.08, node v20.20.2. `claude` is not installed there, which the tick does not need.
- **F9.** `SendMessage` reached both orchestrator terminals first try; both replied inside a minute with measured status. The coordination layer needed no build.
- **F10.** Claude Code has no daemon mode. `claude -p` is one turn and exits (#30447 still open). Any 24/7 claim rests on an external supervisor - cron, launchd, or the tick above.

## Also See

- [Doc 2204](../2204-cross-family-verification-99darwin-orchestrator/) - 99darwin/orchestrator: model-by-role, write-set parallel safety, cross-family verification. That doc answers *how to route a task*; this one answers *how to stay alive and report*.
- [Doc 999](../999-how-i-ai-harness-claude-agent-sdk/) - harness building with the Claude Agent SDK
- [Doc 1090](../../dev-workflows/1090-loop-engineering-karpathy-method/) - loop engineering, the Karpathy method
- [Doc 165](../../dev-workflows/165-claude-code-multi-session-management/) - multi-session management reference
- [Doc 653](../../dev-workflows/653-cron-bots-audit-may2026/) - prior cron/bot inventory; this doc updates the always-on picture
- [Doc 727](../727-zoe-as-agent-builder-supervisor/) - ZOE as orchestrator + supervisor

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Turn on `inputNeededNotifEnabled` and `awaySummaryEnabled` in `~/.claude/settings.json`. Shipped when a blocked lane pushes to the phone with no custom code | @Zaal | settings edit | 2026-08-30 |
| Write `tick.sh` on ansuz: `gh` PRs/checks, lane DONE.md, tracker rows -> `delta.json`; empty delta exits 0. Shipped when it has run 24h and started zero Mac sessions on no-change ticks | @Zaal (nsorc lane) | PR to zaal-dotfiles | 2026-09-02 |
| Wire the Mac `Monitor` to `delta.json` over ssh; start a session only on non-empty. Shipped when a lane completion wakes a session with no polling | @Zaal (nsorc lane) | PR to zaal-dotfiles | 2026-09-03 |
| Add a rung argument to `zao-notify.sh` (default 1). Shipped when rungs 0-1 only write files and 2+ reach Telegram | @Zaal (nsorc lane) | PR to zaal-dotfiles | 2026-09-03 |
| Prototype the `PermissionRequest` -> `"defer"` overnight-approval path on one lane. Shipped when a queued approval survives the night and resumes on one tap | @Zaal (nsorc lane) | PR to zaal-dotfiles | 2026-09-05 |
| Fix the `organizer-tick` tab leak - close its own terminal or reuse one. Shipped when `orca-board --json` shows zero bare-shell growth over 24h | @Zaal | Orca automation edit | 2026-09-01 |
| Add `.claude/rules/resource-release.md` - anything starting a terminal, session, server or worktree per run names who closes it, in the same file | @Zaal | PR to ZAOOS | 2026-09-01 |
| Adopt `claude agents` as the session board and teach `system-audit` to read it, so no audit proposes killing an orchestrator | @Zaal | PR to zaal-dotfiles | 2026-09-02 |
| Add a reaper: session idle >24h with a DONE.md present is handed off to the vault and closed. Shipped when session count stays under 25 for a week | @Zaal | PR to zaal-dotfiles | 2026-09-05 |
| Restore the VPS or move `loop-agent.sh` + `cheap-loop.sh` to ansuz so the provider ladder is live | @Zaal | Infra | 2026-09-02 |
| Prune `metadata.relays` (153 delivered messages in a hot-polled row) - the real fix behind the 60s tourniquet | @Zaal | PR to ZAOOS | 2026-09-08 |

## Sources

- [FULL - read from disk] `~/.zao/spend-ledger.jsonl`, 334 rows, 2026-08-10T14:10:51Z to 2026-08-29T19:17:06Z; rate card read from `~/bin/zao-spend` (`RATES` block). A meter at list prices, not an invoice - Zaal is on Claude Max.
- [FULL - read from disk] `~/bin/zao-spend`, `~/bin/zao-guard`, `~/zaal-dotfiles/bin/lane-relay-daemon` (the 18.69GB / 5.5GB egress note is its own inline comment dated 2026-08-22), `~/zaal-dotfiles/bin/vps/loop-agent.sh`, `~/zaal-dotfiles/bin/vps/cheap-loop.sh`, `~/.claude/settings.json`
- [FULL - measured live 2026-08-29] `uptime`, `sysctl vm.swapusage`, `ps`, `lsof`, `claude --version` (2.1.251), `python3 ~/bin/orca-board --json`, `orca terminal list --json`, `orca automations list --json`, `launchctl list`, `crontab -l`, `ssh zaal@ansuz uptime`
- [FULL - `gh api`, state and title verified 2026-08-29] anthropics/claude-code [#30447](https://github.com/anthropics/claude-code/issues/30447) OPEN 2026-03-03, [#23463](https://github.com/anthropics/claude-code/issues/23463) closed 2026-02-05, [#25714](https://github.com/anthropics/claude-code/issues/25714) closed 2026-02-14, [#34629](https://github.com/anthropics/claude-code/issues/34629) closed 2026-03-15, [#40524](https://github.com/anthropics/claude-code/issues/40524) closed 2026-03-29, [#41930](https://github.com/anthropics/claude-code/issues/41930) closed 2026-04-01, [#67524](https://github.com/anthropics/claude-code/issues/67524) closed 2026-06-11
- [FULL - curl + HTML strip] [code.claude.com/docs/en/sessions](https://code.claude.com/docs/en/sessions) (JSONL transcript path, `cleanupPeriodDays` 30-day default), [code.claude.com/docs/en/github-actions](https://code.claude.com/docs/en/github-actions) (60-day schedule disable on public repos)
- [FULL - curl, subagent] docs.claude.com hooks reference (`"defer"` / `tool_deferred`, Notification sub-events, `TeammateIdle`, `terminalSequence`), settings-reference (`agentPushNotifEnabled`, `inputNeededNotifEnabled`), agent-view, interactive-mode (session recap), headless (background task grace, `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS`)
- [FULL] [bettercallzaal/ZAOOS#3361](https://github.com/bettercallzaal/ZAOOS/issues/3361) - the resource-leak issue filed from this session's measurements
- [FULL] Research doc 2204, read from disk
- [PARTIAL - secondary, SEO-blog tier; used for pattern shape only, never for a number in a decision] Medium (Agent SDK loop caps), DEV Community (stateless-tick pattern; 24/7 cost tracking), withagents.dev and besthub.dev (severity ladders). Their percentage claims are unsourced assertions and are excluded from every decision above.
- [FAILED - not attempted] Reddit. Blocked from this machine per doc 2282; no credential exists yet.
