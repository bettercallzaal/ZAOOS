---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-28
superseded-by:
related-docs: "2426, 2204, 483, 1659, 2432, 2434, 2423"
original-query: "https://x.com/vicky_grok/status/2092990755396870471?s=46 research this"
tier: STANDARD
---

# 2435 - Andrew Ng's OpenWorker, read as source, against our organizer / orchestrator split

> **Goal:** Find the repo behind the 2026-08-27 @vicky_grok tweet ("Andrew Ng just open sourced a free AI coworker"), verify every claim in the tweet against the README and the code, measure it with the glue-first checklist, and map it onto the pieces we hand-wrote this month - the AFK tick, orca-board, zorca-brief, the DONE.md protocol, ZOE's scheduled senders, the grill - to answer one question: is its scheduled-run + approval-gate model the "organizer" Zaal described on 2026-08-28?

**Verdict: WATCH as a tool. ADOPT three of its permission rules as text.** The repo is `andrewyng/openworker`, MIT (LICENSE file read), 16,735 stars, pushed 2026-08-26, v0.2.1 released 2026-08-25. Its scheduler + inbox is a real organizer clock and gate, but it is a desktop app whose approval surface is its own GUI inbox, its GUI runs on Mac and Windows only, and it has no sensor for Orca lanes. Our organizer already has a clock (the Orca `orchestrator-tick` automation, shape A in the split note) and a lock (`zorca-lock`). What we do not have, and OpenWorker has in 623 lines of `coworker/permissions.py`, is a written floor that no mode can lower. Those floors are what this week's three UNKNOWN-RELAY incidents lacked.

The tweet is 35 days late: Ng announced OpenWorker on 2026-07-23 (1.15M views on his post), not "just". Every other claim in the tweet checks out against the README or the code, with one understatement - the tweet says "25+ connectors", `descriptors.py` declares 40.

## Key Decisions

| Decision | Recommendation | Evidence |
|---|---|---|
| Adopt OpenWorker as our organizer? | **NO - WATCH.** The organizer is the Orca automation (split note shape A, one tap pending). OpenWorker would be a fourth clock on the Mac beside Orca automations, ZOE's 20 `cron.schedule` calls on the VPS and launchd, and its inbox lives in a desktop GUI Zaal does not sit at | `coworker/automation/scheduler.py` (113 lines), `bot/src/zoe/scheduler.ts` (1,378 lines, 20 cron entries), `~/zao-vault/notes/orchestrator-organizer-split.md` |
| Adopt its permission floors as rules? | **YES - three rules, PR by 2026-08-31.** (1) Persistent-authority tools are human-only in every mode: anything that outlives the session (a scheduled task, a saved skill, a standing rule) needs a person, never a reviewer model. (2) Self-protection floor: no agent may write its own settings, rules or permission files, in any mode; loosening is out-of-band only. (3) A reviewer can only turn "ask the human" into "go" - never "blocked" into "go" - and fails closed on any malformed verdict | `permissions.py:80-93` (`PERSISTENT_AUTHORITY_TOOLS`), `:95-110` (`protected_paths`), `reviewer.py:1-22` |
| Does its model equal Zaal's "organizer"? | **Half of it.** It has the organizer's clock (croniter, 30-second tick, skip-on-overlap, run-once-catch-up), its gate (approval by default, per-task standing grants bound to one target) and its no-talk rule (unattended asks park in an inbox). It has none of the organizer's sensors (DONE.md files, git refs, PR checks, `df`, Orca panes) except as "read a local file" | `scheduler.py:1-8`, `automation/models.py:24-30`, `unattended.py:1-7` |
| Replace ZOE's senders with its Telegram connector? | **NO.** Doc 2432 already cut ZOE to one interrupt + one digest. OpenWorker's `send_message telegram <chat>` as a standing scoped grant is exactly that shape, but it would run from a Mac that sleeps, against a VPS bot that already does it | `connectors/adapters.py:99` (inbound needs `pip install coworker[messaging]`), doc 2432 |
| Pilot? | **Not now.** The flip test that ends WATCH is in Next Actions: Linux headless answering its inbox over an API or Telegram, so the approval surface can be Zaal's phone. Until then the pilot below is a spec, not an install | this doc, "The pilot that would end WATCH" |

## 1. The repo, FULL

Found from the primary source, not the tweet: Andrew Ng's own X post of 2026-07-23 16:45 UTC names `github.com/andrewyng/openworker` and `openworker.com` and credits @rohitcprasad as co-builder. Fetched with `zao-fetch-x.sh` tier 0 (fxtwitter), text verbatim.

| Field | Measured | How |
|---|---|---|
| Repo | `andrewyng/openworker`, personal account, created 2026-07-20 | `gh api repos/andrewyng/openworker` |
| Licence | **MIT** - `LICENSE` file, "Copyright (c) 2024 Andrew Ng" | file read via `gh api .../contents/LICENSE`, Hard Requirement 13 |
| Stars / forks / issues | 16,735 / 2,307 / 471 open | `gh api`, 2026-08-28 |
| Last push | 2026-08-26 (README + SECURITY.md pass) | `gh api .../commits` |
| Commits, 180 days | 100 (the repo is 39 days old, so this is the cap of the query) | `glue-check` |
| Contributors | 15; top two rohitprasad15 234 and devikaverma 84; andrewyng 1 | `gh api .../contributors` |
| Languages | Python 3.33 MB, TypeScript 1.53 MB, Rust 61 KB (speech-to-text sidecar), PowerShell 5 KB | `gh api .../languages` |
| Code size | 282 `.py`, 106 `.ts`, 85 `.tsx`; 122,451 lines of ts/tsx/py | shallow clone at `86c57f0`, `git ls-files` |
| Tests | 129 files under `tests/`, 1,491 `def test_` | clone |
| Releases | v0.1.5 (2026-07-22) through v0.2.1 (2026-08-25); each ships macOS arm64 + x64 DMG, Windows MSI + setup.exe, `latest.json` for auto-update | `gh api .../releases` |
| Install shape | Desktop app: Tauri shell + React GUI supervising a local Python server (`openworker-server`, FastAPI on 127.0.0.1:8765). Also a Textual TUI (`openworker`), a connector CLI, and `ocw board mcp` - a stdio MCP server that exposes its task board to external harnesses | `pyproject.toml [project.scripts]`, `coworker/cli.py:1`, `coworker/teams/mcp_server.py:1-9` |
| Runtimes | macOS 12+ signed and notarized; Windows 10/11 x64 unsigned; server CI runs on `ubuntu-latest` Python 3.12 so the Python half runs on Linux; state dir on Linux is `~/.config/coworker`. **No arm64 Linux build or CI, so the Pi is UNVERIFIED**; the GUI does not exist for Linux at all | README Download section, `.github/workflows/ci.yml:10-15`, `coworker/secrets.py:35-44` |
| Data | `~/.config/coworker/coworker.db` (SQLite: sessions, workspaces, memory, saved "always allow" grants) + `conversations/<id>.jsonl` append-only; audit trail in SQLite via `audit.py`. Plain files, exportable with `sqlite3` and `cat` | `conversations.py:1-9`, `audit.py:30` |
| Model providers | Native: OpenAI, Anthropic, Gemini, Bedrock, Vertex, Codex. Everything else - DeepSeek, Kimi, Grok, GLM, Qwen, MiniMax, Mistral, Together, Fireworks - via OpenAI-compatible endpoints; Ollama at `localhost:11434/v1` | `coworker/providers/`, `registry.py:15,32` |
| Connectors | 40 descriptors incl. github, slack, jira, notion, linear, gmail, google_calendar, discord, telegram, whatsapp, canva, dropbox, stripe, hubspot, salesforce, plus MCP stdio + streamable-http | `connectors/descriptors.py` (`name="..."` count), `coworker/mcp/` |
| OAuth | one hosted broker for connector handshakes; "you can always use the App without signing in" with manually created API keys | README Privacy |
| Engine | built on `andrewyng/aisuite`, pinned to a git commit, not a PyPI release | `pyproject.toml` dependencies |

### How "approval-gated" is actually implemented

It is not a UI prompt bolted on. It is a decision engine plus three files that the engine refuses to let the agent touch.

- **Modes** (`config.toml`, global at `~/.config/coworker/config.toml` or per-workspace at `<project>/.coworker/config.toml`): `plan` (read-only), `interactive` (reads auto, writes and commands ask), `custom` (a named `auto_allow` list), `auto` (a reviewer model judges), and an internal `BYPASS_APPROVALS`. `allowed_commands` is prefix-matched, and a command carrying backticks, `$(`, `$`, redirection, `xargs`/`sudo`/`npx`/`ssh`, `python -c`, or `find -exec` is **never** prefix-eligible (`permissions.py:19-46`). Compound commands are split on `&&`, `||`, `;`, `|` and every part must pass on its own (`:26-30`).
- **Risk classes** (`risk.py:18-23`): READ, EGRESS, WRITE_LOCAL, EXEC, EXTERNAL. `web_fetch` and `web_search` are EGRESS, not reads, because a model-chosen URL or query can carry data out.
- **Floors, in order of evaluation** (`permissions.py:337-397`): (1) self-protection - any write or shell touching `config.toml`, `risk_overrides.json`, `workspace_trust.json`, `unattended.json`, `coworker.db`, `secrets.json`, `inbox_routing.json` is denied before mode is even consulted; (2) read-only modes deny anything consequential; (3) every write path must sit under a writable root, and an unlocatable path goes to a human; (4) `PERSISTENT_AUTHORITY_TOOLS` - `save_skill`, `create_scheduled_task`, `update_scheduled_task`, `delete_scheduled_task` - are `human_only=True` in every mode, "because the effect lands after the conversation that authorised it has ended, so the person who bears it is not in the room" (`:80-86`); (5) `.git/hooks/`, `.github/workflows/`, `.coworker/` and similar deferred-execution files are writable but never by an auto path.
- **Auto-approve** (`reviewer.py`): a second model call per proposed action, one action per request, fails closed on any parse error, never sees page text or mail bodies, and "can only turn ask-the-human into go-ahead - never blocked into go-ahead". Repeated denials trip a circuit breaker (README). The repo ships its own reviewer evals: on 2026-08-18 `gpt-5.6-sol` allowed 30 of 31 benign rows, 0 of 19 dangerous, 0 of 16 injection (`reports/reviewer-eval-2026-08-18-gpt-5.6-sol.md`).
- **Unattended** (`unattended.py:1-7`): a per-session toggle for *where the human is reached*, not for how much autonomy exists. Anything that would prompt inline goes to the Inbox and the session suspends until answered; the composer is disabled; turning it on is a one-tap confirm.
- **Scheduled tasks** (`automation/models.py`, `scheduler.py`): a task is its own entity with a 5-field cron or a one-time `fire_at`, a timezone, and `always_allowed_tools` entries of the form `"tool target"` - "one space, tool names never contain spaces - binding the allowance to one exact target (channel address, recipient)". Only `access: "write"` items with a declared target argument become grants, "which excludes exec/destructive tools by construction". The loop ticks every 30 seconds, fires missed tasks once on startup, and never stacks a run on a running one.

### The tweet, claim by claim

| @vicky_grok claim | Status | Where |
|---|---|---|
| "just open sourced" | **STALE** - announced 2026-07-23 | Ng's post, `created_at` |
| "16,000+ stars" | TRUE - 16,735 | `gh api` |
| outcome-level asks | TRUE | README "How it works" 1 |
| steps across desktop, files, apps | TRUE | README 2; `coworker/tools`, `connectors/` |
| writes, sends, shell approval-gated | TRUE, and stronger than stated | `permissions.py` |
| "25+ connectors" incl. GitHub, Slack, Jira, Notion, Gmail, Calendar | TRUE, understated: 40 declared | `descriptors.py` |
| "plus anything over MCP" | TRUE | `coworker/mcp/client.py` |
| scheduled runs: morning brief, weekly report, standing watch | TRUE | `automation/`, README |
| no subscription, BYO key OpenAI / Anthropic / Gemini / DeepSeek / Kimi / Grok, or Ollama | TRUE | README "Bring your own model", `registry.py` |
| unstated: Windows | now TRUE (unsigned), was "coming soon" on 07-23 | releases v0.2.0+ |
| unstated: Linux | server yes, GUI no, Pi UNVERIFIED | `ci.yml`, no arm64 artefact |

## 2. Mapped onto our stack, measured from our files

Section 4 of `glue-first-standard.md` puts our hand-written organizer pieces in three layers: watcher/drafts, lane transport, decisions/grill. The split note (2026-08-28) names the organizer's jobs: runs on a clock, reads DONE.md / git / PR checks / `df` / calendar / the grill queue, writes `grill-next.md` and one daily line, decides nothing irreversible, never talks to Zaal except the disk guard.

| Our piece (lines) | What it does | OpenWorker equivalent | Replace? |
|---|---|---|---|
| Orca `orchestrator-tick` automation (disabled 08-27) + the AFK tick prompt in `daily/2026-08-28.md:35` | the organizer clock: every 5 min, ingest + route + fold + rebuild grill-next | `automation/scheduler.py` + `create_scheduled_task` - a persistent task with cron, tz, per-run thread and working folder, skip-on-overlap | **Could, on the clock only.** Orca's automation already survives sessions and runs in its own pane; OpenWorker's runs only while the desktop app is up |
| `~/bin/orca-board` (505) | reads Orca panes, writes `orca-board.log` | none - no Orca sensor. A scheduled task could `run_shell orca ...` under an `allowed_commands` prefix, but `orca terminal send` is the exact hazard of this week | NO |
| `~/bin/zorca-brief` (18) + `zorca-lock` (37) | briefs are files; one-orchestrator lock | none for briefs; `scheduler._running_ids` is a per-task overlap guard, not a fleet lock | NO |
| `.handoffs/DONE.md` protocol | lanes append one line; the tick reads them | a local file read; `conversations/<id>.jsonl` is its own append-only log of the same shape | NO, but it can read ours |
| `bot/src/zoe/scheduler.ts` (1,378; 20 `cron.schedule`), `orchestrator-tick.ts` (714), `tick-lock.ts` (248), `proactive.ts` (393) | ZOE's timed senders on the VPS | scheduler + Telegram connector with a per-task `send_message telegram <chat>` grant | NO - doc 2432 already reduced these to one digest; moving that digest to a sleeping Mac is a regression |
| `quick-grill` skill + `handoffs/grill-next.md` + `GRILL-QUEUE.md` | 4-at-a-time multiple-choice decisions | the Inbox: yes/no/redirect cards on proposed *actions*, parked until a human answers | NO - different question shape (decisions vs. approvals). The Inbox is the organizer's "never talks to Zaal" rule made concrete |
| `.claude/rules/lane-autonomy.md` (gated list: money, public, irreversible, Zaal-only facts) | our floors, as prose | `permissions.py` floors, as code the agent cannot edit | **ADOPT the three rules as text** (Key Decisions) |
| Orca lanes, `~/zao-vault`, Bonfire | fleet, memory, knowledge | none; vault is writable as files; Bonfire only via a custom MCP server | cannot replace |

**Is it the organizer?** It is the organizer's clock, gate and inbox in one process, with a permission engine we have not written. It is not the organizer's eyes: nothing in it knows a pane, a lock, a fold gate or a DONE line. So the answer to Zaal's question is: the organizer is a role, and OpenWorker shows what its gate should look like, but our organizer instance is still the Orca automation from the split note.

### One table, same columns, against the two candidates already on file

| | OpenWorker (this doc) | 99darwin/orchestrator (doc 2426) | Hermes Agent (doc 483) / OpenMatter (doc 1659) |
|---|---|---|---|
| What it is | desktop agent app: engine + 40 connectors + scheduler + permission engine | a Claude Code skill: per-task lifecycle (implement, /secure, /review, verify) for N subagents | Hermes: local-LLM tool-calling framework; OpenMatter: governance/verification layer, not hosting |
| Layer in glue-first sec. 4 | watcher/drafts + Telegram agent + decisions | inside each lane | Telegram agent (Hermes); none (OpenMatter) |
| Licence, from file | MIT | MIT | Hermes MIT (per 483); OpenMatter n/a, hosted |
| Alive | pushed 2026-08-26, 15 contributors, 2 of them write 94% of commits | pushed 2026-08-06, 1 author, 7 stars | see 483 / 1659; OpenMatter launched 2026-06-30 |
| Runs where we run | Mac yes, Windows yes, VPS server-only, Pi UNVERIFIED | anywhere Claude Code runs | Hermes VPS + Pi; OpenMatter hosted |
| Gate model | floors + ladder + reviewer + audit provenance, in code | rules in prompts; hard cap 5 iterations | Hermes: whitelisted dispatcher (483); OpenMatter: QuantumGuard policies |
| Scheduler | yes, croniter, per-task grants | no | no / no |
| Verdict | **WATCH tool, ADOPT 3 rules** | ADOPT 3 rules (2426) | WATCH (1659); Hermes operator pattern only (483) |

The brief cited "Hermes Agent / OpenMatter (doc 1659, 2422)". Doc 2422 is the 2026-08-26 Zaal x Jim x Iman token-launcher call, not Hermes; the Hermes Agent doc is 483. Corrected here, and the brief should be corrected too (Next Actions).

## 3. Glue-first checklist, line by line

| # | Line | Result | Evidence |
|---|---|---|---|
| 1 | licence | **PASS** MIT | `LICENSE` file read |
| 2 | alive | **PASS** | push 2026-08-26, releases weekly, 471 open issues on a 39-day-old repo |
| 3 | maintainers | **PARTIAL** | 15 contributors, top two = 318 of ~340 commits; README: "we may not approve PRs that ... deviate from our vision"; `aisuite` pinned to a git SHA not a release |
| 4 | data export | **PASS** | SQLite + JSONL under `~/.config/coworker`, plain |
| 5 | runs where we run | **PARTIAL** | Mac and Windows full; VPS server-only, no GUI, inbox unreachable without the API token header; Pi UNVERIFIED |
| 6 | brand via config | **PASS, verify by hand** | `config.toml`, `personas/builtin/*/manifest.md` (YAML frontmatter), `skills/*/SKILL.md` - an ICM box body fits a persona manifest |
| 7 | fails loud | **PASS on design, UNMEASURED live** | reviewer fails closed; scheduler skip-on-overlap; `audit.py` records provenance per tool call; reviewer evals in `reports/` |
| 8 | cost | **UNSET** | BYO key, no subscription; cost = model tokens per fire. A 5-minute organizer tick would be ~288 fires/day on whatever key Zaal types. No figure typed |

WATCH, because lines 3 and 5 are PARTIAL and the one place it would earn its keep - the organizer clock - is already covered by an Orca automation that needs one tap, not a new app.

### The pilot that would end WATCH (spec, not installed)

If line 5 flips (Linux headless with the inbox answerable over the API or a Telegram connector), the smallest pilot is: one scheduled task on the Mac, `mode = "plan"` in `~/.config/coworker/config.toml` so the whole session is read-only at the engine, cron `0 7 * * *` local, instructions: read `<ZAOOS>/.handoffs/DONE.md` and `~/zao-vault/handoffs/grill-next.md`, write **`~/zao-vault/handoffs/organizer-digest.md`** and nothing else. Grants: none - `plan` mode denies every consequential tool, so the write itself would park in the inbox and Zaal taps it once; that tap is the test. Must NOT be allowed, given this week's three unsent-relay incidents and the near-miss "cut over to the Pi now" line: `send_message` to any target, `run_shell` of any `orca` or `git push` prefix, `create_scheduled_task` from inside a task, and any write outside `~/zao-vault/handoffs/`. All four are already floors or path-scope denials in `permissions.py`, which is the point of the pilot: it tests their gate, not our discipline.

## Sources

- [Andrew Ng on X, 2026-07-23 16:45 UTC](https://x.com/AndrewYNg/status/2080333504446108104) - the announcement; names the repo, openworker.com, @rohitcprasad, "runs on your Mac, with Windows support coming soon" **[FULL - `zao-fetch-x.sh` tier 0 fxtwitter, text verbatim; 1,148,645 views, 9,731 favs]**
- [@vicky_grok on X, 2026-08-27 15:00 UTC](https://x.com/vicky_grok/status/2092990755396870471) - the seed **[FULL - `zao-fetch-x.sh` tier 0; 62,780 views, 485 favs, 10 replies; names no repo]**
- [andrewyng/openworker](https://github.com/andrewyng/openworker) - README (143 lines), SECURITY.md, `pyproject.toml`, `docs/config.example.toml`, `coworker/permissions.py` (623 lines, read 1-140 and 330-450), `risk.py`, `reviewer.py`, `unattended.py`, `automation/{scheduler,models,tools}.py`, `connectors/descriptors.py`, `providers/registry.py`, `teams/mcp_server.py`, `conversations.py`, `secrets.py`, `reports/reviewer-eval-2026-08-18-gpt-5.6-sol.md`, `.github/workflows/ci.yml` **[FULL - shallow clone at `86c57f0` read from disk; metadata, LICENSE, releases, contributors, languages via `gh api`; `glue-check andrewyng/openworker`]**
- [HN 49027225 "Andrew Ng Launches OpenWorker"](https://news.ycombinator.com/item?id=49027225) 2 points, 0 comments; [HN 49032886 "Andrew Ng made an open source agent"](https://news.ycombinator.com/item?id=49032886) 2 points, 2 comments ("How is it different from literally any other wrapper?") **[FULL - Algolia items API; thin, and that thinness is the finding: no HN discussion exists]**
- Reddit **[FAILED - `zao-fetch-reddit.sh --selftest` 2026-08-28: creds ABSENT, token endpoint 401, public .json text/html, 1 of 3 redlib up; not attempted further per doc 2282]**
- Secondary coverage found by WebSearch and NOT read (Medium x2, MarkTechPost 2026-07-23, mer.vin, theaiagentindex, moclaw, besthub, productize.life) **[not used - a search summary is not a source; every figure above comes from the repo or the two tweets]**
- Our files: `~/zao-vault/notes/glue-first-standard.md` sec. 4, `~/zao-vault/notes/orchestrator-organizer-split.md`, `~/zao-vault/notes/orca-organization.md` (convention 10), `~/zao-vault/daily/2026-08-28.md` (AFK tick prompt, the three UNKNOWN-RELAY lines), `~/bin/orca-board`, `~/bin/zorca-brief`, `~/bin/zorca-lock`, `bot/src/zoe/{scheduler,orchestrator-tick,tick-lock,proactive}.ts`, `.claude/rules/lane-autonomy.md`; doc 2426 read from branch `ws/research-2426-99darwin-code-adoption` (not yet merged); ICM `zao-assistant` box fetched for the human-gate rules **[FULL - read from disk / `git show` / curl]**

## Also See

- [Doc 2426](../../dev-workflows/2426-99darwin-code-adoption/) - the other "complementary, adopt the rules" candidate (in flight on its branch as of 2026-08-28)
- [Doc 2204](../2204-cross-family-verification-99darwin-orchestrator/) - cross-family verify, the reviewer-is-a-different-model rule OpenWorker also applies
- [Doc 483](../483-hermes-agent-local-llm-framework/) - Hermes Agent (the doc the brief meant by "Hermes Agent")
- [Doc 1659](../1659-openmatter-network-agent-platform-eval.md) - OpenMatter, WATCH
- [Doc 2432](../2432-zoe-telegram-interrupt-rule/) - one interrupt, one digest; why the Telegram connector is not a replacement
- [Doc 2434](../2434-harness-engineering-six-layer-map/) - the harness layers OpenWorker's permission engine sits in (layer 3 bounds, layer 6 audit)
- [Doc 2423](../2423-vault-as-transport-inter-terminal-context/) - vault is memory; the digest file in the pilot lands there

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Write the three OpenWorker floors into `.claude/rules/lane-autonomy.md` (persistent-authority tools human-only in every mode; no agent writes its own settings/rules/permission files; a reviewer only turns ask into go, never blocked into go, and fails closed) with `permissions.py` line cites; shipped = rule text merged on main | Zaal | PR | 2026-08-31 |
| Take the split note's one tap: re-enable the `orchestrator-tick` Orca automation as the organizer with `zorca-lock check`, the `df` guard, no questions, no sends; shipped = the automation's per-tick line appears in `daily/2026-08-29.md` | Zaal | Decision | 2026-08-29 |
| Correct the lane brief `research-lanes/ng-ai-coworker.md`: "Hermes Agent / OpenMatter (doc 1659, 2422)" -> doc 483 (Hermes) and 1659 (OpenMatter); 2422 is the CEN token call | orchestrator | Edit | 2026-08-28 |
| WATCH re-check: `gh api repos/andrewyng/openworker/releases` for a Linux artefact and `grep -rn "telegram" coworker/inbox_routing.py` for inbox-over-Telegram; if both exist, run the pilot above; shipped = a dated note appended to this doc | Zaal | Calendar | 2026-09-28 |
| Fold the seed's "just open sourced" correction into the daily line for this lane (announced 2026-07-23, 35 days before the tweet) | orchestrator | Edit | 2026-08-28 |
