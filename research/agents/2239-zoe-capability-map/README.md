---
topic: agents
type: audit
status: research-complete
last-validated: 2026-10-07
related-docs: "2235, 2438, 2432, 2191, 770, 899, 875, 547, 632, 2244, 2586, 2628"
original-query: "Research our zoe - ZOE, The ZAO's assistant: what it is today, measured (where it runs, what it does, what is live vs dead, what it costs, what breaks), how it fits with the Claude Code lanes and the orchestrator seat, and what to keep, fix or retire"
tier: STANDARD
---

# 2239 - ZOE: state of the assistant, 2026-10-04, plus the capability map

> **Goal:** One place that says what ZOE is today, measured, with the surface each
> claim was read from, and what to keep, fix or retire. The 2026-08 capability map
> (every `bot/src/zoe` module and its purpose) is kept below, now extended by the 44
> modules it was missing.

Re-research of doc 2239 in place (number and folder preserved). Written Sun 4 Oct 2026
23:37 EDT (clock from `date`). `original-query` is the verbatim request.

## Re-validated 2026-10-07: ZOE today, measured from the VPS

Written Tue 7 Oct 2026, 12:04 to 12:3x EDT (clock from `date`), by the zoe lane
opened that morning on Zaal's word "lets make one for the ZOE". The 2026-10-04
body below could not read the VPS; this pass did, read-only, over `ssh vps`
(`systemctl --user`, `journalctl --user -u zoe-bot` for 7 days, `~/.zao/zoe/`,
flag NAMES in `~/zao-bot-live/bot/.env`, values never printed) plus
`scripts/agents/zoe-liveness.py --remote` run from the ZAOOS repo. Nothing on the
VPS was restarted, pulled, deployed or flipped. Where a number below changes a
2026-10-04 finding, the change is named.

### 1. Live, as of 16:04 UTC

| Claim | Measured | Surface |
|---|---|---|
| ZOE is up | `zoe-bot.service` active since 13:30:05 UTC, PID 3759190, 531 MB | `systemctl --user status zoe-bot` |
| It runs today's main | live checkout `~/zao-bot-live` at 97ada3c0 (#3772, merged 09:22 EDT); `zoe-liveness` says `behind=0` | `git -C ~/zao-bot-live log -1`, liveness table |
| Autodeploy restarts it on every merge | 49 Stopped/Started pairs in 7 days, all on :X0 ticks; four between 13:00 and 13:30 UTC today | `journalctl` Started lines |
| The handle | `getMe` on the live token returns `zaoclaw_bot`. **Closes the Findings 4 contradiction: the AGENTS.md `@zaoos_bot` row is wrong.** | Telegram `getMe`, username field only |
| Features that ran | 82 `[zoe/ran]` lines in 24 h across 15 features; 18 features over 7 days: tick-lock, pinned-brief, pinned-brief-tick, orchestrator-tick (49 boots each), claude-auth-probe 27, auto-close 23, receipts 9, repo-improver-scout 8, mission-control 8, backlog-grill 7, afferent-digest 6, reflect 5, recap 5, and once each: work-loop, reflexion, guardrails, dispatch, build-intent. `featureRan` prints once per boot, so these count boots in which a feature ran, not executions. | `journalctl` grep `zoe/ran` |
| Flags ON in `.env` | ZOE_ORCHESTRATOR_ENABLED, ZOE_RELAY_TG_ENABLED, ZOE_NUDGE_LADDER, ZOE_CRITIC_PANEL_SHADOW, ZOE_CRITIC_HIGH_TIER, ZOE_DM_BUILD, ZOE_GUARDRAILS, ZOE_MEMORY_GIT, ZOE_MISSION_CONTROL, ZOE_TASK_COMPLEXITY_ROUTING. **Closes two UNKNOWNs: `ZOE_MEMORY_GIT` is set, and doc 2438's unset `ZOE_TASK_COMPLEXITY_ROUTING` is now set.** | `.env` names, liveness table |
| Spend | 2026-10-07 so far 0.63 USD (2 calls); 2026-10-05 2.20 USD (4 calls, one opus at 1.87); 2026-10-03 and 10-04 files are 128 bytes each (no calls); no file for 10-01, 10-02 or 10-06 in the listing. **Closes the Findings 3 UNKNOWN.** | `~/.zao/zoe/cost/*.md` |
| Send budget since 2026-09-30 | 333 sent, 141 deferred, 21 dropped. Every drop sampled is class `status` (cap 3 a day). **The 79 percent all-time drop rate in Findings 4 is history; this week it is 4 percent.** | `~/.zao/zoe/send-budget-log.jsonl` |
| Worker runs | `~/.zao/zoe/runs/` has files for 09-22 to 09-28 and 10-07, none for 09-29 to 10-06 | `ls` |
| Repo checkout used for research PRs | `~/zao-os` on the VPS sits at 17dff0be (2026-09-28), 9 days behind main; `ZOE_REPO_DIR` is set in `.env` (value not read) | `git -C ~/zao-os log -1` |

### 2. Merged but not running (flags OFF or unset)

| Flag | State on the VPS | What it gates | Whose flip |
|---|---|---|---|
| `ZOE_REPO_IMPROVER_LEASES` | `false` (set) | repo-improver under a Heart lease; every scheduler tick logs `(lease disabled)` | Zaal ruled 2026-10-06 "switch it on and then close" (card 9076, `decisions/grill-2026-10-06-dreamnet-evening.md` item 4); the dreamnet lane owes the steps page; the flip is Zaal's hands |
| `ZOE_LOOP_LEASES` | `false` (set) | work-loop and orchestrator under Heart leases | same ruling, "Both" |
| `ZOE_HEART_FLEET_CANARY` | unset | Heart fleet canary | grill item, per memory `project_brandon_two_plane_architecture` |
| `CASTER_ENABLED`, `ZOE_CASTER_GUARDS`, `FARCASTER_AUTOCAST_DAILY_CAP` | unset | today's #3772: caster guards and the auto-cast cap | Zaal, after the PR's own test plan |
| `ZOE_USE_CLI` | unset | the concierge's CLI route (the API-key route runs) | nobody has asked for it |
| `ZOE_CRITIC_PANEL`, `ZOE_OUTBOX_DEMO` | unset | multi-critic panel; outbox demo beat | none pending |

The code on main reads 57 distinct `ZOE_*` names (`git grep` of `env.ZOE_` under
`bot/src/zoe` and `bot/src/hermes`); `.env` sets 20 of them.

### 3. What broke in the last 7 days (journal, newest first)

1. **Claude CLI `error_max_budget_usd`, 5 times, labelled `unknown`.** Four
   landed in 7 seconds at 2026-10-05 20:55 UTC, right after a DM recall
   ("No I'm talking about poidhz"), which is the shape of `extractors.ts` (four
   cheap readers at `EXTRACT_BUDGET_USD = 0.05`); one at 2026-10-07 14:01 UTC,
   the same minute the work-loop research "Investigate sound gear in Ellsworth"
   failed as `claude CLI exited 1 [unknown: unclassified claude CLI failure]`.
   Each payload reads `num_turns: 1, duration_api_ms: 0`: the CLI refused before
   its first API call. `claude-health.json` says `lastFailKind: "unknown"`. The
   cause: on a non-zero exit, `bot/src/hermes/claude-cli.ts` classifies stderr
   (empty here) and never reads the `subtype` in the stdout JSON. This is the
   2026-08-17 brief's open thread, now with a name.
2. **The failure report was dropped.** The work-loop failure line went to the
   ops chat as class `status` at 16/3 and was dropped by `send-budget.ts:189`
   (`status: overflow 'dropped'`). Zaal ruled 2026-10-06 (same file, item 7):
   "make the status send class hold instead of drop, before ZOE becomes the
   single route." Not yet built.
3. **`exit_code= 143` seven times**: SIGTERM from the autodeploy restart while a
   CLI call was in flight. 49 `[zoe/crash-guard] SIGTERM received` lines equal
   the 49 restarts. Not a CLI fault; a call that straddles a deploy dies.
4. **OpenRouter 429 once**; one repo-improver tick failed with "all cap-fallback
   providers failed". **Bonfire delve timed out twice**, falling to
   "manual-relay fallback".
5. **The VPS vault checkout is dead and `grill-queue.ts` still writes to it.**
   `~/zao-vault` on the VPS exists, is 2,425 commits behind origin/main, last
   commit 2026-09-17, one modified path (not read). `grill-queue.ts:58` appends
   to `~/zao-vault/BLACKBOARD.md` when that path exists, so it does. The
   2026-09-27 finding is NOT closed.
6. **Token hygiene unchanged.** `systemctl --user show zoe-bot` still lists
   `COWORK_BOT_TOKEN` on the `Environment=` line (value not printed here), and
   six `.env.bak-*` files sit beside `.env`. Rotation (cards 9809, 9371) is due
   2026-10-09; whether the token VALUE was rotated was not measured from here.
7. **No heartbeat file.** `~/.zao/beats` does not exist on the VPS. ZOE's
   liveness surfaces are the unit, `[zoe/ran]` and the board heartbeat
   (`index.ts:4238`, "dormant unless COWORK_API_URL/TOKEN set"; both are set).

### 4. What Zaal can do from the DM right now, and what he cannot

**Can (code on main, flag state measured):** 31 slash commands are registered
in `index.ts`: agenda, board, bonfire, chatid, cockpit, companion, draftdemo,
drafts, focus, grill, inittopics, lanes, list, loop, loops, menu, notes, pulse,
quest, quests, resume, seed, shadow, start, tasks, team, teamadd, voicememo,
working, zg, zoldraft. Plain text goes to the concierge (talk, capture); voice
notes transcribe (Groq Whisper); photos and PDFs ingest to the vault inbox;
grill cards answer by button; drafts take POST, REGEN, SKIP.

**Build from the DM, the measure in `feedback_zoe_measured_by_telegram_build`:**
the path is wired and ON. `ZOE_DM_BUILD=1` is set; `index.ts:3142` routes a
private-scope message through `detectBuildIntent` to `startDmBuild`, with a
"Want me to build that?" button for borderline asks and mid-run steering. In 7
days `build-intent` ran in one boot of 49 and `dm-build` ran in none: the
classifier was reached at least once, and zero builds started. No DM in the
journal reads as a build ask, so this is "not exercised", not "broken". A grade
on the 1-to-10 scale needs Zaal to type one build ask; the lane cannot do that
for him. What would kill a build if he did: item 1 above (a budget refusal that
reads as `unknown`) plus item 2 (its report dropped).

**Cannot:**

- **Publish.** POST on a draft marks it approved and resends the bare text
  (`bot/src/zoe/posts/buttons.ts:164`); `/api/publish/compose` exists, is
  admin-session gated, and was proven deployed by its 401 on 2026-08-20
  (vault `notes/publish-test-postiz-borker-2026-08-20.md`). ZOE has no session
  and no bearer path into it. Doc 2244's "wire the POST button" row is still
  open, 61 days on.
- **Reach the Orca lanes.** No `/lane` command is registered (grep of
  `bot.command(` in `index.ts`); `/lanes` reads a Mac snapshot. Doc 2625 D1
  ("finish the bridge") is unbuilt.
- **See why a build or research run failed.** Item 1 plus item 2.
- **Restart, deploy, or flip a flag.** By rule, and those stay his.

### 5. Three fixes proposed, PR-only, each behind a flag that defaults OFF, each with a red control

Sent to the orchestrator seat before any code; built only on Zaal's word.

| # | Fix | Flag (default OFF) | Red control | Why first |
|---|---|---|---|---|
| 1 | POST button calls `POST /api/publish/compose` with `dryRun:false` for the draft's platforms, instead of resending text. Needs a bot bearer on the compose route (new env on both sides, ask-first) because the route is iron-session admin only. | `ZOE_POST_PUBLISH=1` | Unit test on `handlePostCallback`: flag unset, `sendMessage` called and `fetch` never; flag set, `fetch` called once with the draft text and `dryRun:false`. Route test: wrong bearer returns 401. First live tap and the flag flip are Zaal's. | The known 61-day gap (doc 2244); turns the DM into a publish surface |
| 2 | `status` class overflow becomes `deferred` (joins the morning drain) instead of `dropped`. | `ZOE_STATUS_HOLD=1` | Test: over cap with flag set, outcome `deferred` and a row in `send-deferred.jsonl`; flag unset, `dropped` as today. | Zaal ruled it 2026-10-06 item 7; a one-line policy change at `send-budget.ts:189` |
| 3 | On a non-zero CLI exit, parse the stdout JSON and map `subtype` (`error_max_budget_usd`, `error_max_turns`, `error_during_execution`) to a named kind with the cap in the hint; `claude-health.json` and the work-loop failure message stop saying `unknown`. | `ZOE_CLI_RESULT_CLASSIFY=1` | Test feeds the verbatim 2026-10-07 14:01 payload: today classifies `unknown`, with the fix `budget`. | Every build and research failure since 2026-08-17 has worn this label |

Not a PR, Zaal's hands: flip `ZOE_REPO_IMPROVER_LEASES` and `ZOE_LOOP_LEASES`
(already ruled), rotate the token by 2026-10-09, and either fetch or remove the
dead `~/zao-vault` checkout on the VPS so grill cards stop landing in it.

### Sources for this section

- VPS 31.97.148.88 over `ssh vps`, 2026-10-07 16:04 to 16:2x UTC: `systemctl --user status/show zoe-bot`, `journalctl --user -u zoe-bot --since "7 days ago"`, `~/.zao/zoe/{cost,runs,send-budget-log.jsonl,claude-health.json}`, `.env` key names via `grep -oE '^[A-Z0-9_]+='`, Telegram `getMe` username field, `git` on `~/zao-bot-live`, `~/zao-os`, `~/zao-vault`. [FULL, method: ssh, read-only]
- `python3 scripts/agents/zoe-liveness.py --remote` from ZAOOS at 9ed2e9c44. [FULL]
- ZAOOS origin/main 97ada3c05: `bot/src/zoe/index.ts`, `posts/buttons.ts`, `send-budget.ts`, `grill-queue.ts`, `scheduler.ts`, `extractors.ts`, `bot/src/hermes/claude-cli.ts`, `src/app/api/publish/compose/route.ts`. [FULL, method: git show and sed]
- zao-vault origin/main via `git -C ~/zao-vault-worktrees/seat show`: `decisions/grill-2026-10-06-dreamnet-evening.md`, `notes/brandon-dreamnet-review-2026-10-06.md`, `notes/publish-test-postiz-borker-2026-08-20.md`, `handoffs/status/orchestration.md`. [FULL]
- Library: `cross-platform/2244-posting-platform-decision` (re-validated 2026-10-07 in #3775), `agents/2586-orchestrator-seat-outside-view` (#3776), `cross-platform/2628-creator-os-automate-friction-not-creativity` (open PR #3777, not on main). [FULL]
- Not read: Telegram chat bodies, BotFather, the token values, the one modified path in the VPS vault checkout, Vercel and OpenRouter billing.

## Key decisions

| # | Recommendation | Why (measured) |
|---|---|---|
| 1 | **FIX FIRST: rotate ZOE's bot tokens in one VPS pass (cards 9809 and 9371), by Fri 9 Oct.** | The COWORK_BOT_TOKEN value was pasted into a public ZAOOS PR comment on 2026-09-16 and the rotation map (vault `notes/cowork-bot-token-rotation-map-2026-09-24.md`) says the `zoe` row in `bot_tokens` was unrevoked. The 2026-10-04 security review lists it as live and 18 days overdue. The tracker disagrees (see Contradictions). |
| 2 | **FIX: make ZOE's outbound channel survive being the single decision route** - a ruling on the per-class send cap (3 per class per day) and on the `status` class that is dropped, not deferred. | Send log on the VPS, read 2026-09-27: 4,347 rows, 3,415 dropped (79 percent). Zaal made ZOE his phone channel the same day. `DAILY_PUSH_CAP = 5` (`bot/src/zoe/grill.ts:86`) separately bounds unsolicited asks. |
| 3 | **KEEP ZOE as a native organ; do not port it onto Hermes Agent.** | Decision `hermes-agent-manages-all-other-agents` (2026-09-09, amended by Brandon): ZOE and ZOL are native, Hermes Agent orchestrates and federates. Doc 2438 reached the same verdict for the harness: 130 modules at the time, 173 distinct filenames now. |
| 4 | **FIX: re-measure the VPS and close three UNKNOWNs** (grill-queue write path, memory-git flag, today's spend) - this doc could not read the VPS. | `ssh` from this session was denied by the permission layer (exact message in Findings 1). Everything about the VPS below is carried from vault notes dated 2026-09-09 to 2026-09-29. |
| 5 | **RETIRE the stale ZOE-shaped surfaces**, not the bot: `handoffs/zoe.md` lane brief (idle since 2026-08-18), Mac `~/.zao/zoe-loop.sh` (no log, no session), `bot/README.md` (describes the ZAOstock bot), the "ZOE v2 / Agent Zero" name. | Each was read today; evidence in Findings 6. |

## Findings

### 1. What ZOE is, where it runs, whether it is up

- **What:** a Telegram-native operator in `bot/src/zoe/` of ZAOOS, not a framework (doc 2235). At `origin/main` e19245fed (2026-10-05 03:15 UTC): 179 non-test `.ts` files under `bot/src/zoe` (173 distinct filenames) and 183 test files. `bot/src` also holds `hermes/` (32 files, the claude-cli runner, to be renamed `zaalcommand`), `cockpit/` (10), `zai/` (7), `devz/` (4). [FULL, `git ls-tree origin/main`]
- **Where:** the bots VPS 31.97.148.88, systemd USER unit `zoe-bot.service`, from `~/zao-bot-live`, ZAOOS main autodeploy every 10 minutes (AGENTS.md row `zoe-bot`, which says "Measured 2026-09-27: enabled and active"). The unit is NOT `zoe.service` and NOT a system unit: a system-scope `is-active` returned `not-found` and `--user is-active zoe` returned `inactive`, and one lane told Zaal ZOE was down on that basis (vault `notes/zoe-the-channel-drops-four-in-five-2026-09-27.md`). Use `systemctl --user is-active zoe-bot`.
- **Live today?** UNKNOWN from this session. `ssh` was attempted once, read-only, and the permission layer returned: "Permission to use Bash with command head -3; ls ~/.ssh/config 2>&1 has been denied." Reported as BLOCKED, not routed around. Indirect evidence that something on the VPS is still writing: the vault carries ZOE-authored items through 2026-09-29 (09:03 UTC grill batch sent exactly 3 cards, `decisions/grill-2026-09-29-grill-morning.md`), and the ZOE nightly capture PR #3710 merged to ZAOOS main today. The nightly capture is a separate writer (a scheduled job; its prompt was not located by the infrastructure review).
- **Where it is not:** the Pi. The 2026-08-27 "Move ZOE to the Pi now" lane (`handoffs/zoe-to-pi.md`) rested on a false premise (the VPS was up); its own header was corrected 2026-09-08, and `decisions/agentic-infrastructure-machine-roles.md` says VPS "ZOE, public services. Unchanged" and the Pi is "Simple always-on bots only (ZOL)". Whether the Pi install in commit c1e0d8da ever ran is UNKNOWN (that commit was not pushed).
- **On the Mac:** `~/.zao/zoe/` is a copy, last written 2026-09-28 15:39 (`decisions.jsonl`, `build_state.jsonl`). `~/.zao/zoe-loop.sh` (2026-07-15) says it runs on the VPS; on this Mac there is no `zoe-loop.log`, no `zoe` tmux session, and `~/.zao/zoe-loop/` was last touched 2026-08-27.

### 2. What it does, and what is shipped but inert

- Eight tiers per the map below: concierge brain, orchestration (decompose, dispatch, workers), autonomy (error-remediation, work-loop, repo-improver), trust (receipts, identities), communications, safety, bus/federation, DM-build flow.
- **Shipped from doc 2235's adopt list:** `memory-git.ts` and `guardrails.ts` / `guardrail-adapters.ts` (PR #2932). Both adopt items exist in `origin/main`. Whether `ZOE_MEMORY_GIT=1` is set on the VPS is UNKNOWN (code default OFF, `memory-git.ts:29`).
- **Flag-gated, default OFF, found by grep:** 19 non-test files under `bot/src/zoe` carry "default OFF", "flag-gated" or an env equality gate. Named: `heart-canary.ts` (`ZOE_HEART_FLEET_CANARY`), `memory-git.ts`. Doc 2438 found `ZOE_TASK_COMPLEXITY_ROUTING=1` unset on 2026-08-26, so `decompose.ts` emits a cost class nothing consumes. Which of these are on in production: UNKNOWN (env is on the VPS).
- **Stub:** `ffx.ts` is "MARKED STUB" in its own header. `klearu.ts`, `event-stream.ts`, `read-node.ts`, `ranker.ts`, `registry.ts`, `orchestrate.ts`, `guards.ts`, `signer.ts`, `write.ts`, `x402.ts` form a Farcaster caster pipeline (doc 761) inside the ZOE directory, while ZOL runs on the Pi. INVESTIGATE whether any of it is wired in `index.ts`; this pass did not trace imports.
- **Recent change rate:** 54 commits touch `bot/src/zoe` from 2026-09-04 to 2026-09-28; the last two are #3681 (group relays keep every line) and #3688 (phone grill asks only what the terminal counts), both merged 2026-09-28. Zero commits to `bot/` since (GitHub commits API, 2026-10-04). Open ZOE-titled PRs: #3630 (research-doc hold zero-URL docs, draft, last updated 2026-09-23), #3661, #3628, #3619 (ZOE research drafts).

### 3. What it costs

- **Measured:** nothing about spend. `cost-governance.ts` defaults the daily cap to `10.0` USD (`DEFAULT_DAILY_CAP_USD`, overridable by `ZOE_DAILY_BUDGET_USD`), alerts at 60, 75 and 85 percent and hard-stops autonomous work at 95 percent. The ledger (`cost-ledger.ts`) and `send-budget-log.jsonl` live on the VPS. Today's and the month's spend: UNKNOWN, VPS unreadable.
- **Not a cost number, but a budget number:** `call-budget.ts` alerts at 50 LLM calls a day. Searched for a dollar figure for ZOE in vault `notes`, `projects` and `decisions` on origin/main: none found; not searched: VPS ledger, Vercel and OpenRouter billing pages, Claude subscription usage.

### 4. What breaks (measured, newest first)

| Date | Failure | Surface read | Status |
|---|---|---|---|
| 2026-09-27 | Send budget dropped 3,415 of 4,347 attempts all-time (79 percent); that day 59 attempts, 37 sent, 12 deferred, 10 dropped, all of class `status`. Cap is 3 per class per day; `digest` defers, `status` drops. | VPS `send-budget-log.jsonl`, read by the vault lane | Cap untouched as of the note. `journalctl --user -u zoe-bot -p err` for 24h returned no entries: working as designed. |
| 2026-09-27 | Grill write path: `grill-queue.ts` appends to a vault if one exists; the VPS now has a git checkout of the vault 1,164 commits behind with 330 uncommitted lines, so cards land there and the Mac's hourly drain reports "nothing to drain" truthfully. | VPS read by the vault lane | Later PR 3469 made the queue write BLACKBOARD on the VPS; whether the stale-checkout problem is closed is UNKNOWN. The Mac cron (`:52`, `zao-grill-queue-drain`) beat file was touched 2026-10-04 22:52, which records that the job ran, not that it worked (its cron line touches the beat after a semicolon). |
| 2026-09-28 | Phone grill asked cards the terminal did not count; relays to Zaal lost lines. | PRs #3688, #3681 | Fixed. 2026-09-29 live test: the 09:03 UTC batch sent exactly 3 cards, none of the 10 parked ones. |
| 2026-09-23 and open | Research worker `research-doc.ts` line 96 hardcodes status (card 9907, PR #3630 still draft); the nightly capture PRs are labelled one day late (ZAOOS#3516, card 9919) because the prompt was not located. | `overnight-review-infrastructure.md` rows, GitHub | Open. |
| 2026-08-17 | Research pipeline failed every run with `claude CLI exited 1 [unknown: unclassified]`, about every 4 hours, 8 post-fix records. Next move was to capture stderr. | `handoffs/zoe.md` section 1 | Outcome UNKNOWN; no later note found in the surfaces searched. #3585 (2026-09-20) now holds a doc as draft when its own findings say it is incomplete. |
| 2026-09-16 | COWORK_BOT_TOKEN value pasted into a public ZAOOS PR comment; reached two transcripts. | `overnight-review-security.md` section "Do not wait for Friday" | Open per the review. |
| Standing | A bot token sits in the `zoe-bot` systemd `Environment=` line; six `.env.bak-*` files on the VPS each hold a full copy of the live env (card 9371). | `handoffs/zoe.md` section 2, security review 2.3 | Tracker row due 2026-10-06, `in_progress`. |

**Contradictions, not resolved here:**
- Tracker search for "9809" returns one row, `handoff:rotate-cowork-bot-token`, `done`, due 2026-09-17. The security review (written today) and the rotation map (2026-09-24) call the rotation not done. I did not confirm that the returned row is card 9809 itself (the CLI has no show command). Do not mark it done on the tracker's word; verify with the old-token 401 test in the review.
- The bot handle: `bot/REGISTRY.md` (last updated 2026-06-08) says `@zaoclaw_bot`; the AGENTS.md `zoe-bot` row says `@zaoos_bot`; the zoe-to-pi brief expects `getMe` to return `zaoclaw_bot`. Which is the Telegram username of the live ZOE token is UNKNOWN (BotFather and the VPS were not read).

### 5. How it fits with the lanes and the orchestrator seat

- **ZOE is the phone channel, the lanes are the terminal channel.** Lanes write open questions as grill items; ZOE's `grill.ts` pulls them one at a time to Zaal's phone (cap 5 a day unsolicited, bypassed when he pulls with `/grill`); his answers come back as cards and files the grill lane routes. 2026-09-27 ruling: "if u need me for feedback lets use the ZOE" and ZOE "gates everything else" for that day (`decisions/grill-2026-09-27-orchestrator-batch-2.md`). 2026-09-30 ruling 7: "numbers through zoe, text stays in the vault" - ZOE must not read, echo or digest journal text.
- **Lanes cannot restart or deploy ZOE.** Standing rule in the zoe handoff: "an agent never restarts the bot itself"; ZAOOS main autodeploys every 10 minutes, so a merge is a deploy.
- **The seat reads it, does not run it.** BLACKBOARD.md is live state; ZOE's grill queue writes to it on the VPS (PR 3469). `/lanes` (`lanes-board.ts`) reads a snapshot of the Mac's Claude Code lanes. `needs-zaal-digest.ts` sends the "Needs Zaal" digest at 08:00 and 20:00 ET. Both are only as fresh as the snapshot; `vault-freshness.ts` exists because ZOE reads a copy of the vault.
- **Hermes Agent (the Nous program) sits above, not instead:** per the 2026-09-09 decisions, Hermes Agent orchestrates and federates, ZOE and ZOL stay native; "Hermes" in ZAOOS `bot/src/hermes` is the claude-cli pattern, to be renamed `zaalcommand`. The glue-map row that proposed REPLACE for ZOE is withdrawn.
- **Hermes comparison, open:** the parallel Hermes Agent / r/hermesagent research had not landed in the library at 23:4x EDT (searched `research/` on origin/main for new files since 2026-10-03 matching "hermes": none). Existing cross-references: doc 2438 (concepts, profiles, routing switch), doc 875 (NousResearch 7-day setup vs ZAO Hermes), doc 632 (r/hermesagent subreddit), doc 547 (ZOE and Hermes coordination). Cross-reference the new doc here when it merges.

### 6. Retire candidates, with the evidence read today

| Surface | Evidence | Verdict |
|---|---|---|
| `handoffs/zoe.md` lane brief | `status: ready`, `next: UNKNOWN`, closed by the idle sweep 2026-08-18; its token item is tracker row `handoff:zoe-2026-08-17` (due 2026-10-06); the persona-block and ZOL-flag items have no status I could find | RETIRE the lane, keep the token card |
| `handoffs/zoe-to-pi.md` | Premise false since 2026-08-23; machine-roles decision leaves ZOE on the VPS | RETIRE |
| Mac `~/.zao/zoe-loop.sh` | Header says "headless Claude Code on the VPS"; no log, no tmux session here | INVESTIGATE on the VPS, then RETIRE the Mac copy |
| `bot/README.md` | Describes the ZAOstock team bot (v1), not ZOE | FIX or RETIRE |
| `bot/REGISTRY.md` | Last updated 2026-06-08; says `zoe-bot` runs from `~/zao-os` on a feature branch, while the AGENTS.md row says main autodeploys from `~/zao-bot-live` | FIX (regenerate; doc 2239 header says maps should be generated) |
| "ZOE v2 / Agent Zero" | On the CLAUDE.md do-not-propose list (decommissioned 2026-05-04), per doc 2438 | RETIRE the name |

## ZOE Capability Inventory (130 files, ground-truth read)

**MEMORY & RECALL**

| File | Purpose |
|------|---------|
| `concierge.ts` | ZOE's brain - Claude CLI + 4-block context (persona, human, working, tasks) |
| `memory.ts` | [core memory management] |
| `recall.ts` | Bonfire bridge (read/delve queries to knowledge graph) |
| `reflexion.ts` | Letta-style self-improving memory (Q4 locked; answers -> working memory) |
| `afferent-digest.ts` | Nightly receipts → memory digest (02:30 UTC) |
| `thread-memory.ts` | Open-threads → Bonfire emit (durable cross-agent episodes) |
| `threads.ts` | Open-threads store (Layer A continuity; due_at, open/acked tracking) |
| `sidequests.ts` | Goal-alignment layer (standalone, avoids circular imports) |
| `extractors.ts` | Knowledge extraction fan-out (4 cheap readers: people, projects, decisions, commitments) |
| `session-checkpoint.ts` | Save/recall checkpoints per thread (/checkpoint command) |
| `resume.ts` | Capture resume/bio credentials via /resume command |

**ORCHESTRATION & DISPATCH**

| File | Purpose |
|------|---------|
| `decompose.ts` | Goal decomposition router (doc 759 Gap 1; multi-step → DecompositionPlan) |
| `dispatch.ts` | Node-orchestrated dispatch loop (Gap 2; dependency waves, WAVE_CONCURRENCY cap) |
| `workers.ts` | Per-worker runner (callClaudeCli + Hermes integration; no subagents) |
| `work-loop.ts` | Autonomous WORK track (Gap 3; research queues → research docs + PRs) |
| `orchestrator-tick.ts` | [core tick loop orchestration] |
| `turn-queue.ts` | Per-chat turn queue (live steering; sequential processing) |
| `learn.ts` | [learning loop from runs telemetry] |
| `always-open-topics.ts` | Self-refilling next-move per ZAAL BOTZ topic |
| `topic-router.ts` | Map topic → behavior (intent-based routing; internal vs outbound) |
| `tasks.ts` | Task queue read/write (~/.zao/zoe/tasks.json; TaskOp[] apply) |
| `task-classifier.ts` | Auto-tag tasks (brand, work-type, themes, next_owner from title+notes) |
| `heart-run.ts` | Resolve the agent_runs row that a Heart lease fences on (fixes runId bug in scheduler.ts) |
| `tick-lock.ts` | Atomic single-instance lock for autonomous loops (replaces duplicate copy in work-loop + orchestrator-tick) |
| `work-park.ts` | Failed work survives in a park (not deleted); can be queried and retried later |

**COMMUNICATIONS (Telegram/Discord/Relay/Voice)**

| File | Purpose |
|------|---------|
| `telegram-routing.ts` | Centralized routing (DM=questions only; status+digests elsewhere) |
| `relay.ts` | Cross-bot relay (bot_relay_op → sendMessage to target group) |
| `relay-bridge.ts` | Telegram ↔ fleet-relay bridge (~/bin/zao-relay sync) |
| `tg-chunk.ts` | Split long messages (<=4096 chars per Telegram limit) |
| `tg-interactions.ts` | Voice-note answers, reactions as actions (thumbs-up=approve, checkmark=done) |
| `button-bar.ts` | Persistent reply keyboard + /menu registration |
| `questions.ts` | One-question-at-a-time buttons (answer buttons + Type-my-own) |
| `drafts.ts` | Draft approval buttons (Post/Skip/Edit inline) |
| `pending-answers.ts` | Track last question asked (plain text route to last relay/Q) |
| `transcribe.ts` | Voice/audio → text (Groq Whisper; free-tier, no local deps) |
| `discord.ts` | Discord responsive assistant (@mention/DM only, never proactive) |
| `discord-webhook.ts` | Discord status feed (POST to incoming webhook) |
| `message-context.ts` | [message context enrichment] |
| `curator.ts` | Clean-curator topic posting (low-freq, curated, deduplicated) |
| `live-status.ts` | One message that updates in-place via editMessageText (vs sending multiple new messages) |
| `topics.ts` | Forum-topic registry for ZAAL BOTZ ops group (name → message_thread_id, persisted to ~/.zao/zoe/topics.json) |
| `thread-ops.ts` | Apply concierge's thread_ops (doc 796 Move 2); bridges hot store (threads.ts) + Bonfire emit (thread-memory.ts) |

**SAFETY & GUARDRAILS**

| File | Purpose |
|------|---------|
| `preflight.ts` | Config validation (fail-loud on missing env/keys, never silent) |
| `user-errors.ts` | Redact error internals (no paths, tokens, stacks to user) |
| `pii.ts` | PII scan + redaction (implements .claude/rules/pii-hygiene.md) |
| `cost-governance.ts` | Spend guardrails (60/75/85/95% thresholds; hard-stop at 95%) |
| `cost-ledger.ts` | Per-model spend visibility (model + tokens + cost per call) |
| `call-budget.ts` | Daily LLM call budget (50 calls/day alert; counter for concierge) |
| `focus-guard.ts` | Hyperfocus protection (/focus → suppress non-urgent pings, queue captures) |
| `fleet-health.ts` | Process liveness + self-heal (restarts capped, crash-loop guard) |

**AUTONOMY & ERROR HANDLING**

| File | Purpose |
|------|---------|
| `error-remediation.ts` | App errors → fix PRs (gap 3; reads app_errors, routes to fixer, reports outcome) |
| `repo-improver.ts` | Cheap-AI audit loop (OpenRouter/grok/gpt; self-gates; one improvement per cycle) |
| `repo-improver-io.ts` | I/O wiring for repo-improver (git context, Supabase, Hermes dispatch) |
| `verify-replan.ts` | ResultVerifier + bounded replan (VMAO-style judge → replan on low grades) |
| `watcher.ts` | Dispatch supervisor (reads runs.ts telemetry; cost/fail/quality anomalies) |
| `advisors.ts` | Advisory sandbox (independent reviewers for Hermes decisions; no autonomous acts) |
| `golden-eval.ts` | Regression harness (doc 2200; fixed golden set for persona/worker-spec changes) |
| `feature-ran.ts` | Let a feature report once that it actually executed in production (solves "shipped but never verified running" gap) |
| `done-work-detector.ts` | Detect open board tasks whose work has verifiably concluded (hourly pass; closes them automatically) |
| `federation-checkpoint.ts` | Durable checkpoint for DreamNet federation canary (crash → resume instead of repeat) |
| `federation-states.ts` | Terminal-state vocabulary for federation canary (both sides must prove success; no unilateral "done") |

**IDENTITY & TRUST**

| File | Purpose |
|------|---------|
| `receipt-envelope.ts` | DreamNet Receipt Envelope (dreamnet.receipt.v1; portable proof-of-action) |
| `receipts.ts` | Receipt Emitter (best-effort logging; writes to receipts table for audit/replay) |
| `identities.ts` | Per-brand Identity Kit registry (doc 2155; brand-specific contexts) |
| `brand-brain.ts` | ICM box fetching + caching (useicm.com; brand-specific ZOE voices) |
| `fleet.ts` | Per-brand mailbox ingestion (iterates identity registry; skips unset keys) |
| `bonfire-retry.ts` | Retry queue for ALL Bonfire writes (not just thread emits); replays on recovery, never accepts loss |

**BUS / DREAMNET FEDERATION**

| File | Purpose |
|------|---------|
| `bus-bridge.ts` | See a partner-bus message and reply well from phone (full body, not truncated; usable reply path) |
| `bus-send.ts` | Parse "reply XXXX <words>" from a bus message and send via DreamNet bus |
| `bus-receipt.ts` | ACK a DreamNet federation receipt and verify its content + message-ID hashes |
| `bus-upload.ts` | Upload files to DreamNet federation bus with local sha256 verification |

**DM BUILD FLOW**

| File | Purpose |
|------|---------|
| `build-intent.ts` | Detect whether a DM to ZOE is asking for code to be written (classification gate) |
| `dm-build-session.ts` | Make a running DM build steerable (mid-run steering; "no, use the other table" reaches the coder) |
| `dm-build-pending.ts` | Pure half of DM build buttons (unit-testable; no grammy import so vitest runs) |
| `dm-build-buttons.ts` | Inline keyboards for the DM build flow (every decision → a tap, not typing) |

**REASONING & PROACTIVITY**

| File | Purpose |
|------|---------|
| `grill.ts` | Bot→agent upgrade (proactive puller; one-at-a-time decisions instead of wait) |
| `approvals.ts` | Pending-approval state machine (doc 759 keystone; propose→Zaal OK→execute) |
| `proactive.ts` | Reasoning-tick gate (doc 796 Move 1; gathers candidates, speaks if passes bar) |
| `escalation.ts` | Resend critical pings if unack'd (escalating→decaying ladder) |
| `events.ts` | Proactive event candidates (TAGGED: [SHIPPED], [STALE PR], [CI FAIL], ...) |
| `pending-decisions.ts` | Surface pending decisions for morning brief (PRs, review queue, assigned tasks) |
| `pinned-brief.ts` | ONE pinned Telegram message = always current state (replaces artifact-making; Zaal: "stop making artifacts they just get lost") |
| `pinned-brief-runner.ts` | IO half: gathers real VPS state cheaply and keeps pinned-brief current |
| `mission-control.ts` | Pure render + emit layer for TG pinned mission-control (doc 2226; parse step-journal, render pinned text) |

**DAILY/SCHEDULED CYCLES**

| File | Purpose |
|------|---------|
| `brief.ts` | Morning brief (5am EST / 09:00 UTC; task queue + captures + git + PRs) |
| `brief-veto.ts` | AI-ranked brief with tap-to-veto buttons (minimal, reversible) |
| `recap.ts` | Nightly recap (9pm EST / 02:00 UTC; merged PRs + commits + research) |
| `reflect.ts` | Evening reflection (9pm EST; 3-question prompt to Zaal) |
| `scheduler.ts` | Proactive nudges on cron (no quiet hours per Zaal feedback) |
| `calendar.ts` | Luma calendar reader/cache (public ICS; ZAO events) |

**INSIGHTS & LEARNING**

| File | Purpose |
|------|---------|
| `runs.ts` | Append-only telemetry (~/.zao/zoe/runs/YYYY-MM-DD.jsonl; worker run + verdict) |
| `trace.ts` | Step-level execution tracing (~/.zao/zoe/traces/DATE.jsonl; nested span tree) |
| `loops-status.ts` | [status visibility for active loops] |

**TEAM & BOARD INTEGRATION**

| File | Purpose |
|------|---------|
| `task-comment-replies.ts` | Reply in-thread to @zoe in board task comments |
| `task-mention-notify.ts` | Forward @person mentions to Telegram (no board checking needed) |
| `task-teammate-ack.ts` | Acknowledge team comments; ping Zaal (with optional DRAFT_ANSWERS mode) |
| `team-tracker.ts` | Read cowork board (doc 890; bridges ZOE's tasks + TEAM's tracker) |
| `trust-audit.ts` | Monthly trust audit (captures >14d old, tasks >14d old) |
| `daily-note.ts` | Auto-rollover daily notes (one per day; unchecked→top, increment roll_count) |
| `ping-lifecycle.ts` | Tie task lifecycle to message pings (close task → resolve ping) |
| `handoffs-surface.ts` | Post new handoffs to Handoffs topic (de-duped via last-seen) |
| `backlog-grill.ts` | Drip the board backlog to Zaal's phone one card at a time (answered by number button) |
| `backlog-grill-runner.ts` | IO half of backlog grill (reads board, sends card, records verdict; no policy) |
| `board-commands.ts` | Pure layer: parse @zoe board comments into authorized commands (fully unit-tested) |
| `board-command-executor.ts` | IO layer: execute commands authorized by board-commands.ts (no autonomous policy) |
| `teammate-heartbeat.ts` | Ask a teammate what they're on (measured Iman accountability gap; pings on schedule) |

**RESEARCH & DOCS**

| File | Purpose |
|------|---------|
| `work-loop.ts` | Autonomous research track (queue topics → decompose/dispatch → commit docs + PR) |
| `research-dedupe.ts` | URL deduplication (before enqueue, check if link already researched) |
| `research-doc.ts` | Turn research findings into numbered doc + PR (trusted Node step) |
| `verify-replan.ts` | Verify research answers goal; replan if graded low (VMAO-style) |
| `zaostock-approvals-surface.ts` | Surface ZAOstock research queue to Telegram (from cloud routine) |

**OUTBOUND & CASTING**

| File | Purpose |
|------|---------|
| `zol-queue.ts` | ZOL cast approvals (enqueue approved casts to cowork tracker for Pi drainer) |
| `bonfire-queue.ts` | ZABAL Gamez community submission queue (verified FID via Quick Auth) |
| `crm.ts` | ZAO CRM write path (direct Supabase; replaces POST-behind-bearer-secret) |
| `outbox.ts` | [outbound message queue/batching] |
| `build-candidate.ts` | Tap-to-approve buttons for fleet BUILD candidates (escalate → ping → tap) |

**EXPERIMENTAL / CANARY**

| File | Purpose |
|------|---------|
| `heart-canary.ts` | Heart fleet consumer (first consumer outside tests; flag-gated ZOE_HEART_FLEET_CANARY) |
| `inbox-ingest.ts` | [inbox processing] |
| `inbox-triage.ts` | [inbox triage/routing] |
| `nudge.ts` / `nudges.ts` / `nudge-ladder.ts` | [nudging / reminder logic] |
| `meetings.ts` | [meeting integration] |

**INFRASTRUCTURE & TYPES**

| File | Purpose |
|------|---------|
| `index.ts` | Entry point (bot.start(), grammY polling) |
| `types.ts` | Shared types (tasks, captures, nudges; mirrors hermes/types.ts) |
| `commands.ts` | Command-prefix detection (plan:/note:; routable without importing index) |
| `groups.ts` | Per-chat config (interactive only after /zoe-group-enable) |
| `env.ts` | Single source of truth for aliased env vars (prevents drift bugs) |
| `node-cron.d.ts` | TypeScript definitions for node-cron |

---

**POST-INVENTORY ADDITIONS (2026-08-07, #2932)**

| File | Purpose |
|------|---------|
| `memory-git.ts` | Commit-per-edit versioning of ~/.zao/zoe memory (flag ZOE_MEMORY_GIT=1; history/why/rollback) |
| `guardrails.ts` | Composable Guardrail interface + runGuardrails pipeline (collect-all trips) |
| `guardrail-adapters.ts` | cost/pii/preflight bound to the Guardrail interface + runConciergeGuardrails() |

---

**KEY GAPS ADDRESSED (doc 927 orchestrator vision)**

- Gap 1: `decompose.ts` (structured goal decomposition)
- Gap 2: `dispatch.ts` + `workers.ts` (distributed execution)
- Gap 3: `error-remediation.ts` + `work-loop.ts` (autonomous fix + research pipelines)
- Gap 4: `reflexion.ts` (self-improving memory)
- Gap 5: `learn.ts` + `watcher.ts` (learning from runs telemetry)

---

**SUMMARY**

ZOE is a multi-layered orchestrator across **8 architectural tiers**: (1) **Concierge brain** (concierge.ts + memory blocks); (2) **Orchestration** (decompose/dispatch/workers/tick-lock); (3) **Autonomy** (error-remediation, repo-improver, work-loop, done-work-detector); (4) **Trust** (receipts, identities, brand-brain, bonfire-retry); (5) **Communications** (Telegram, Discord, relay, voice, live-status, thread-ops); (6) **Safety** (budgets, PII, cost governance, guards); (7) **Bus/Federation** (bus-bridge/send/receipt/upload, federation-checkpoint/states - DreamNet integration); (8) **DM Build Flow** (build-intent, dm-build-session/buttons/pending - full Telegram → code path). The system is strongly gated: config preflight (fail-loud), live steering (turn-queue), team-aware (board bridge + board-commands), and audit-ready (receipts, traces, golden-eval, feature-ran).

**Real code is ground truth.** All 130 files read directly from `~/zao-bot-live/bot/src/zoe/*.ts` headers.

**Refresh history:**
- 2026-08-06: Initial inventory (102 modules, workflow wf_eddf1949-77d)
- 2026-08-07: +3 post-inventory adds (memory-git, guardrails, guardrail-adapters - PR #2932)
- 2026-08-22: +25 new modules (bus, DM-build, federation, board-commands, pinned-brief, tick-lock, heart-run, work-park, teammate-heartbeat, done-work-detector, feature-ran, live-status, thread-ops, topics - board task 9550)

**ADDED 2026-10-04: 44 modules on disk that the map above did not list** (found by diffing the filename set at `origin/main` e19245fed against backticked `.ts` names in this doc; purposes are the first docstring line of each file).

| File | Purpose |
|------|---------|
| `send-budget.ts` | One gate every outbound ZOE Telegram send passes through (per-class daily cap; see Findings 4) |
| `grill-queue.ts` | The grill's second destination (vault append or JSONL spool) |
| `needs-zaal-digest.ts` | Scheduled "Needs Zaal" digest to Telegram, 08:00 and 20:00 ET |
| `lanes-board.ts` | `/lanes`: the Mac's Claude Code lanes, read from a snapshot |
| `vault-freshness.ts` | ZOE reads a COPY of the vault; detects when the copy goes stale |
| `agent-delegation.ts` | Natural-language task delegation and blocker resolution |
| `cli-cap-aware.ts` | Run a Claude CLI call; on usage/rate/auth cap fall back to a non-Claude provider |
| `provider-health.ts` | Deterministic state machine with hysteresis for LLM providers |
| `router.ts` | Multi-model router: Claude, Grok (xAI) or GPT (OpenAI) |
| `crash-guard.ts` | Fail-loud process lifecycle and crash reporting |
| `companion.ts` | Active companion engine: estate awareness, time-of-day rhythms, ZAOstock countdown |
| `owner-only.ts` | What a non-owner hears when they type an owner command |
| `discord-scope.ts` | Which memory scope a Discord message gets; whether a community reply may go out |
| `inbound-media.ts` | Ingest Telegram photos, PDFs, screenshots into the vault inbox with secret and PII screening |
| `voicememo.ts` | `/voicememo` command and plain-text capture (post slate v1) |
| `sources.ts`, `drafters.ts`, `pending.ts`, `buttons.ts`, `drafts-queue.ts`, `select-best.ts` | Post slate v1-v4: data gathering, per-category drafter, single pending draft, POST/REGEN/SKIP buttons, silent backlog, one-best selector |
| `comms-critic.ts`, `research-critic.ts`, `task-result-critic.ts` | Critics: external copy vs brand voice, research docs vs Hard Requirements 1-12, "did the agent meet the goal" |
| `newsletter.ts`, `fractal-promo.ts`, `zaostock-promo-calendar.ts` | Daily newsletter entry, weekly ZAO Fractal post slot, ZAOstock promo date lookup |
| `decay.ts`, `guards.ts`, `ranker.ts`, `registry.ts`, `orchestrate.ts`, `reason.ts` | Multi-agent layer (doc 761): memory decay, pre-LLM guards, softmax ranker, agent registry, orchestrator, caster reasoning |
| `event-stream.ts`, `read-node.ts`, `write.ts`, `signer.ts`, `x402.ts`, `mention-listener.ts`, `wiki.ts`, `farcaster-client.ts`, `farcaster-server.ts` | Farcaster caster pipeline: event stream, read node, write path, Ed25519 signer, x402 header, @zolbot mention listener, wiki builder, MCP tool-agent client and server |
| `klearu.ts`, `ffx.ts` | Safety classification wrapper; FFX serverless exec (header: MARKED STUB) |


## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Rotate ZOE's COWORK_BOT_TOKEN and ZOE_BOT_TOKEN in one VPS pass per `overnight-review-security.md` step 3; shipped when the old cowork token returns 401 from Zaal's own terminal and `systemctl --user is-active zoe-bot` is `active` with a fresh `zoe` heartbeat on the board | Zaal | Ops | 2026-10-09 |
| Rule on the send cap: per-class cap and `status` drop-vs-defer; shipped when a vault decision file names the new cap and a ZAOOS PR changes `send-budget.ts` (or records "unchanged, on purpose") | Zaal, PR by the Dotfiles lane (zj) | Decision + PR | 2026-10-06 |
| Re-measure the VPS read-only from Zaal's terminal or a lane with SSH rights and write the answers into this doc: `is-active`, send-budget-log counts for 2026-09-28 to 2026-10-05, whether `ZOE_MEMORY_GIT` is set, whether the grill write path still lands on the stale vault checkout, today's cost-ledger summary; shipped when Findings 1, 2, 3 contain no UNKNOWN for those five items | Zaal | Measurement | 2026-10-07 |
| Refresh `bot/REGISTRY.md` and replace `bot/README.md`; settle the handle (`@zaoclaw_bot` or `@zaoos_bot`) from BotFather; shipped when both files merge and agree with AGENTS.md | Dotfiles lane (zj) | PR | 2026-10-11 |
| Close the retired lane briefs `handoffs/zoe.md` and `handoffs/zoe-to-pi.md` (status: retired, pointer to this doc); shipped when both files carry the status in the vault main | Orchestrator seat | Vault commit | 2026-10-06 |
| Trace imports from `bot/src/zoe/index.ts` for the Farcaster caster modules and `ffx.ts`; shipped when this doc lists each as wired, flag-gated or dead | Dotfiles lane (zj) | Audit | 2026-10-11 |
| Cross-reference the Hermes Agent / r/hermesagent doc when it merges and fill the comparison (Findings 5); shipped when this doc links it by `topic/NNN-slug` | Orchestrator seat | Doc edit | 2026-10-12 |
| Update this map in the SAME PR as any `bot/src/zoe` module add or remove; re-verify the filename diff quarterly | Whoever merges the module | Discipline | 2027-01-04 |

## Also See

- [Doc 2235](../2235-zoe-vs-agent-toolkits-audit/) - the audit this inventory powered; its two adopt items shipped (memory-git, guardrails).
- [Doc 2438](../2438-hermes-agent-concepts-zoe-runtime/) - Hermes Agent concepts versus ZOE; routing switch found unset.
- [Doc 2432](../2432-zoe-telegram-interrupt-rule/) - the Telegram interrupt rule.
- Tracker rows read: `handoff:zoe-2026-08-17` (in_progress, due 2026-10-06), `handoff:rotate-cowork-bot-token` (done, due 2026-09-17, contradicted above).

## Sources

All method statements are for this pass (2026-10-04). Vault paths were read with `git -C ~/zao-vault show origin/main:<path>`.

- ZAOOS `origin/main` e19245fed, `git ls-tree` and `git show` of `bot/src/zoe/*`, `bot/REGISTRY.md`, `bot/README.md`, `bot/systemd/`. [FULL, method: git]
- ZAOOS pulls via `gh api`: [#3688](https://github.com/bettercallzaal/ZAOOS/pull/3688) merged, [#3681](https://github.com/bettercallzaal/ZAOOS/pull/3681) merged, [#3630](https://github.com/bettercallzaal/ZAOOS/pull/3630) open draft. [FULL, method: gh api; state read 2026-10-04]
- GitHub repo search, owners bettercallzaal and ZAODEVZ, query "zoe": one hit, [bettercallzaal/zaoos-workspace](https://github.com/bettercallzaal/zaoos-workspace), private, last pushed 2026-04-05. [PARTIAL - metadata only, private; not read]
- Vault: `AGENTS.md` (rows zoe, zoe-to-pi, devz-stack runner, zoe-bot), `SYSTEM_MAP.md` line 83, `BLACKBOARD.md`; `handoffs/zoe.md`, `handoffs/zoe-to-pi.md`; `decisions/agentic-infrastructure-machine-roles.md`, `hermes-agent-manages-all-other-agents.md`, `hermes-agent-is-the-nous-program-zaalcommand-rename.md`, `grill-2026-09-27-orchestrator-batch-2.md`, `grill-2026-09-29-grill-morning.md`, `grill-2026-09-30-vault-mh-afternoon.md`; `notes/zoe-the-channel-drops-four-in-five-2026-09-27.md`, `notes/zoe-decision-class-proposal-2026-09-27.md` (headline retracted by its own banner; only the retraction and `DAILY_PUSH_CAP` are used). [FULL, method: git show]
- `~/Desktop/overnight-review-security.md` and `~/Desktop/overnight-review-infrastructure.md` (token variable names and file paths only; no value read or written). [FULL]
- Tracker: `~/bin/zao-tracker search ZOE`, `search 9809`, `search 9371` (titles, status, due, source slug only). [PARTIAL - the CLI has no show command]
- Mac files: `~/.zao/zoe-loop.sh` header, `~/.zao/zoe/` and `~/.zao/zoe-loop/` listings, crontab line for `zao-grill-queue-drain`, beat file mtime. [FULL, method: ls and head]
- Library docs 2235 and 2239 (prior version), 2438, resolved with `zao-research-health --resolve` (2239, 2235, 2438, 770, 899 each resolve to one document; 801 is ambiguous and is not cited). [FULL]
- VPS 31.97.148.88: [FAILED - one `ssh` attempt denied by the permission layer, message quoted in Findings 1; nothing else tried]. Every VPS figure is carried from the vault notes above.
- Not searched, named so the gap is visible: Telegram, Gmail, Slack, Vercel and OpenRouter billing, BotFather, Orca pane scrollback, the Pi.
