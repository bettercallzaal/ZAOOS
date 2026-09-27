---
topic: agents
type: decision
status: research-complete
last-validated: 2026-09-25
superseded-by:
related-docs: 2204, 999, 1090, 555, 364, 727, 165, 653, 2456
original-query: "can u /zao-research on agent orcestration and help me have a 24/7 going claude code session on forwarding all prgohres on these todos"
tier: STANDARD
---

# 2444 - The always-on orchestrator: 91.5% of ZAO's agent meter is context handling, not work

> **Goal:** Decide the shape of a 24/7 orchestrator that forwards progress on todos with no human watching - priced against ZAO's own meter, and built on Claude Code mechanisms that already exist rather than new ones.

> **Re-research, 2026-09-25.** Every claim below was re-measured, not trusted from the 2026-08-29 version. Headline: **the core number held and got stronger** (91.5% -> 91.8% over more than double the window), **five of eleven Next Actions shipped**, **one decision was built differently than recommended** (the tick runs on the Mac, not ansuz - decision 8), and **the escalation half of the design is only half-built** (the deterministic tick exists and is honest about its own blindness; nothing yet wakes a session from its output - see Findings F11). Nothing in the original doc was found to be WRONG; several things were found INCOMPLETE.

## Key Decisions (recommendations first)

| # | Decision | Grounded in | Grade |
|---|----------|-------------|-------|
| 1 | **The always-on part is a deterministic tick with no LLM. Claude wakes only on a non-empty delta.** | Over 20 days ZAO's meter was **56.6% cache_read + 34.9% cache_write = 91.5% context handling**, and only **8.4% output**. These shares are fixed by the rate card and hold at any model mix. **Updated 2026-09-25: re-measured over the now-46-day, 868-row ledger - 66.5% cache_read + 25.4% cache_write = 91.8% context handling, 8.1% output.** The ratio did not drift; it held across more than double the window. `~/zaal-dotfiles/bin/zao-tick` (566 lines) now exists and implements exactly this - measures PRs, lane `DONE.md`, tracker rows and stalled lanes, no model call, exits 0 on a quiet tick. | A |
| 2 | **Use the native queued-approval path, do not build one.** A `PermissionRequest` hook returning `"defer"` exits headless with `stop_reason: "tool_deferred"` and the pending call preserved; resume later with `claude -p --resume <session-id>` and an `"allow"` decision. | docs.claude.com hooks reference; local CLI is now 2.1.283 (was 2.1.251), past every version gate below. **Updated 2026-09-25: still not prototyped.** No hit for `PermissionRequest` or `"defer"`/`tool_deferred` anywhere in `~/zaal-dotfiles` outside settings-file boilerplate. The recommendation stands unchanged; it is simply unbuilt. | A |
| 3 | **Turn on the two native push settings instead of a custom notifier.** | settings-reference; measured `~/.claude/settings.json`. **Updated 2026-09-25: SHIPPED.** `agentPushNotifEnabled: true`, `inputNeededNotifEnabled: true` (was unset 2026-08-29, turned on since), `awaySummaryEnabled: true` (was unset, also turned on). All three native settings are now live. | A |
| 4 | **One always-on process, many disposable sessions. State lives in vault files.** | The ZAOstock orchestrator was killed mid-event 2026-08-29 11:47 and lost nothing - `claude --resume` rebuilt it from the JSONL transcript because its ledger was a file. Transcript retention here is `cleanupPeriodDays: 90` (confirmed unchanged 2026-09-25). `claude agents --json` is now the load-bearing registry across `zj`, `orca-board`, `zao-selftest`, `zorca-lane-open` and `zao-session-restore` - see decision 8-adjacent Next Action below. | A |
| 5 | **Cap parallel subagents and never let their results land unbounded in one parent.** | anthropics/claude-code#23463 (closed 2026-04-17) and #25714 (closed 2026-04-23) - same shape confirmed unchanged via `gh api` on 2026-09-25 (see table below). | A |
| 6 | **Escalation ladder: log -> vault digest -> Telegram -> push. Default to the lowest rung that carries the fact.** | **Updated 2026-09-25: SHIPPED at the notifier layer.** `zao-notify.sh` now takes a `rung:N` argument (`rung:2` = Telegram, `rung:3` breaks quiet hours), confirmed in `zao-notify-test`. But this is the carrier, not the trigger - see F11: nothing currently calls `zao-notify.sh` from `zao-tick`'s output. | B |
| 7 | **Every per-run resource names its release in the file that creates it.** | Two leaks the same day: Orca `organizer-tick` leaked 136 tabs; 50 Claude sessions against 40 panes, 13 idle 2-3 days. Filed ZAOOS#3361. **Updated 2026-09-25: ZAOOS#3361 is still OPEN** (`gh api` confirms, no comments, no linked commit in its timeline). The root cause (`reuseSession: false` on the Orca automation) is unfixed - it needs a UI change `orca automations edit` exposes no flag for. A mitigation shipped instead: `~/zaal-dotfiles/bin/zao-sweep-tabs`, cron'd hourly (`25 * * * *`), closes only bare-shell tabs whose title matches `organizer-tick run <N>`, keeping the newest 3. The leak still happens; it no longer accumulates. `.claude/rules/resource-release.md` was never created - no file by that name exists in ZAOOS or in `~/zaal-dotfiles`. | B |
| 8 | **Put the tick on ansuz, not the Mac.** | ansuz: was up 20 days, load 0.08. **Updated 2026-09-25: this decision was NOT followed in practice, and the divergence is explained and intentional, not an oversight.** `zao-tick` ships on the **Mac**, run by cron every 5 minutes (`crontab -l`: `*/5 * * * * ... zao-tick --state ...`). Its own header explains why: ansuz has no `gh` and no `claude`, and installing/authing either is "Zaal's call" - the script adds a REST-API fallback (`_prs_via_rest`) specifically so it can run somewhere without `gh`, and notes this loses `mergeStateStatus` (a GraphQL-only field). ansuz today: up 12 days, load average 0.02/0.09/0.08 - still idle and available, still unused for this. The Mac today: load 11.95/8.17/7.57, 14 users - far below the 313 load-average incident, but not idle either. | C - right instinct (keep the tick off the machine that page-thrashes), wrong prediction (ansuz still isn't running it a month later; the blocker is a one-time `gh auth` Zaal hasn't done) |
| 9 | **Never poll a hot remote row on a short interval.** | `lane-relay-daemon` polled Supabase every 6s: 18.69GB egress against a 5.5GB quota, board REST API at HTTP 402 until 2026-09-21. **Confirmed unchanged 2026-09-25**, with one improvement not present in the original doc: the daemon now has exponential backoff on a dead hub (added 2026-08-23, `BACKOFF_AFTER=3`, `BACKOFF_MAX=900`s) so a 402 outage no longer polls at full cadence for 15 hours. `metadata.relays` pruning (the actual fix behind the 60s tourniquet) is still not done. | A |

## The number that decides it

`~/bin/zao-spend` prices session transcripts at list rates and puts the figure next to what it bought. It is a **meter, not an invoice** - Zaal is on Claude Max, so the subscription covers it to the cap.

**As originally measured (2026-08-29):** Ledger 334 rows, 2026-08-10T14:10:51Z to 2026-08-29T19:17:06Z. Twenty-day token totals: in 6.3M, out 58.1M, cache_write 967.4M, cache_read 19,598.7M.

| Token kind | Share of tokens | Share of cost | Cost if all sonnet | Cost if all opus |
|-----------|----------------|---------------|--------------------|------------------|
| cache_read | 95.0% | **56.6%** | $5,880 | $29,398 |
| cache_write | 4.7% | **34.9%** | $3,628 | $18,138 |
| output | 0.28% | 8.4% | $871 | $4,354 |
| input | 0.03% | 0.2% | $19 | $95 |
| **total** | | | **$10,397** | **$51,985** |

**Updated 2026-09-25 - re-measured over the full, now-longer ledger.** `~/.zao/spend-ledger.jsonl` has grown to **868 rows, 2026-08-10T14:10:51Z to 2026-09-25T23:17:15Z** (46 days, 534 new rows since the original doc). Totals: in 6,893,554, out 210,173,918, cache_write 2,623,478,525, cache_read 85,962,464,320 tokens.

Priced against the same rate card (`sonnet` 3.00 / 15.00 / 3.75 / 0.30 per 1M for in/out/cache-write/cache-read):

| Token kind | Share of cost (46-day) | Share of cost (original 20-day) |
|-----------|------------------------|----------------------------------|
| cache_read | **66.47%** | 56.6% |
| cache_write | **25.36%** | 34.9% |
| output | **8.13%** | 8.4% |
| input | **0.05%** | 0.2% |
| **context handling (cache_read + cache_write)** | **91.82%** | 91.5% |

Total meter at sonnet rates over the full 46-day ledger: **$38,800**.

> **The finding did not just survive re-research - it strengthened.** 91.5% over 20 days is now 91.8% over 46 days and 868 rows, 2.6x the sample. The mix within context-handling shifted (cache_read's share of cost rose from 56.6% to 66.5% as cache_write's fell 34.9% to 25.4%, consistent with sessions maturing and reading more established history relative to writing new context) but the combined **context-handling-vs-output** split - the actual load-bearing number for decision 1 - moved less than half a point. This is the strongest evidence in the doc that decision 1 is correct, not merely plausible.

The per-day table and the 2026-08-29 machine-load reading (load 313, swap 30.2G/31.7G, `kernel_task` 189% CPU) were not re-measured this pass - they are a point-in-time incident record, not a standing claim, and are left as originally reported.

## What the wider field does (re-verified 2026-09-25)

Every GitHub issue below was re-checked with `gh api repos/anthropics/claude-code/issues/<N>` today. **State and title match the original claim for all seven issues - no material change.**

| Issue | State (2026-08-29 claim) | State (2026-09-25, `gh api`) | Notes |
|-------|---------------------------|-------------------------------|-------|
| [#30447](https://github.com/anthropics/claude-code/issues/30447) | OPEN, filed 2026-03-03 | **still OPEN**, `updated_at` 2026-09-21 | Not shipped. Recent activity on the thread (2026-09-21) is a community member ("StrayUnicorn") describing a third-party product ("brnrd") built around the same gap, plus an earlier comment (2026-08-06, user "Roorn") sharing a full systemd-unit + watchdog scaffold as a workaround. Anthropic has not shipped a native daemon mode; the community keeps building around the hole. This does NOT change decision 2/8 or finding F10 - if anything it confirms the gap is real and still open a month later. |
| [#23463](https://github.com/anthropics/claude-code/issues/23463) | closed 2026-02-05 | closed, `closed_at` 2026-04-17 | **Correction to the original doc's own metadata**: the original doc listed this closed 2026-02-05; `gh api` today shows `closed_at: 2026-04-17T22:18:19Z`. This is a discrepancy in the ORIGINAL doc's date, not a state change - the issue was closed before 2026-08-29 either way, so decision 5 is unaffected. Flagging it because Hard Requirement 14 asks for exact re-verification, not just "still closed." |
| [#25714](https://github.com/anthropics/claude-code/issues/25714) | closed 2026-02-14 | closed, `closed_at` 2026-04-23 | Same pattern as #23463 - closed both times, closed-date in the original doc does not match what `gh api` returns today. Does not change decision 5. |
| [#67524](https://github.com/anthropics/claude-code/issues/67524) | closed 2026-06-11 | closed, `closed_at` 2026-06-15, `updated_at` 2026-08-17 | Matches (4-day date discrepancy, immaterial). |
| [#34629](https://github.com/anthropics/claude-code/issues/34629) | closed 2026-03-15 | closed, `closed_at` 2026-04-01 | Same pattern. Does not change the reading that ZAO's high cache_read is healthy, not this bug. |
| [#41930](https://github.com/anthropics/claude-code/issues/41930) | closed 2026-04-01 | closed, `closed_at` 2026-04-24 | Matches. |
| [#40524](https://github.com/anthropics/claude-code/issues/40524) | closed 2026-03-29 | closed, `closed_at` 2026-04-04, title "[BUG] Conversation history invalidated on subsequent turns" | Matches; this issue was listed in Sources but not discussed in the body of the original doc - carried forward unchanged. |

**Honest note on the date discrepancies above:** four of seven issues show a `closed_at` from `gh api` that is later than what the original 2026-08-29 doc claimed, even though the doc was written after all of those closures. This is most likely the original doc citing `updated_at` (a later timeline event, e.g. a bot re-triage) where it meant `closed_at`, or a transcription slip when the table was built. It does not change any decision - every issue was closed before 2026-08-29 and remains closed now - but it is worth naming so a future re-research does not assume the state itself moved.

Everything else in this section (tmux/detached sessions not applicable since the estate moved to Orca, GitHub Actions' 60-day schedule disable, the Agent SDK's lack of default safety rails, the stateless-tick pattern) was not re-fetched this pass - those are documentation/community-pattern claims rather than time-sensitive state, and nothing in this research cycle contradicted them.

## Native mechanisms already in this install (CLI 2.1.283, was 2.1.251)

| Mechanism | 2026-08-29 status | 2026-09-25 status |
|-----------|--------------------|--------------------|
| `PermissionRequest` hook -> `"defer"` | unused | **still unused** - no reference anywhere in `~/zaal-dotfiles` |
| `agentPushNotifEnabled` | true | **true** (unchanged) |
| `inputNeededNotifEnabled` | unset - turn on | **true - SHIPPED** |
| `Notification` hook sub-events | hook wired, sub-events unused | not re-verified in detail this pass; `zao-notify.sh` gained the `rung:N` argument (see decision 6) |
| `claude agents` (Agent View) | unused | **adopted widely** - `claude agents --json` is now read by `zj` (the wall/session tool), `orca-board`, `zao-selftest`, `zorca-lane-open`, `zorca-lane-open-test` and `zao-session-restore`. This is the Next Action that shipped most thoroughly. |
| Session recap / `awaySummaryEnabled` | unset | **true - SHIPPED** |
| `Stop` / `SubagentStop` / `StopFailure` / `TeammateIdle` | Stop wired, others unused | not re-verified this pass |
| `cleanupPeriodDays` | 90 | **90 - confirmed unchanged** |

## The design - what actually got built vs. what was proposed

The original design box proposed: `tick.sh` on ansuz -> a Mac `Monitor` that wakes a session only on non-empty delta -> an escalation ladder to Zaal. **Updated 2026-09-25: half of this exists, and the half that exists is well-built; the half that doesn't is a real gap, not an oversight.**

**Built:** `~/zaal-dotfiles/bin/zao-tick` (566 lines, first committed 2026-09-10) is a deterministic, no-model measurement loop, cron'd every 5 minutes on the Mac (not ansuz - see decision 8). It measures: open PRs and their merge state across 6 repos (with a `gh`-free REST fallback for running on a host without `gh`), lane `DONE.md` files, tracker due-items, and stalled lanes (quiet >30min with no `DONE.md`, cross-checked against git bundles so work already bundled off a dead branch doesn't re-alarm). It is unusually self-aware about its own failure modes - it distinguishes "N changes" from "N probes went blind" in its log line specifically because that ambiguity fooled a reader on 2026-08-29, and it explains in-line why cron's PATH must be patched, why `ln -sf` into `~/bin` would self-destruct the file (`~/bin` is a symlink to the dotfiles repo itself), and why a naive per-lane bundle-head lookup was doing up to 168 subprocess calls per tick before being fixed to one pass. It writes state atomically and logs a `BASELINE`/`N change(s)`/`BLIND on N probe(s)` line to `~/.zao/orca-board.log` every run, at zero token cost.

**Not built:** nothing currently consumes `zao-tick`'s stdout or state file to wake a Claude session. The only other reader of its log/state is `zao-selftest`, which uses it as a liveness check ("is the tick still running"), not as a trigger. `zao-tick` does not call `zao-notify.sh` itself. So the chain is: **measurement is real and running for free; escalation is a carrier that exists (`zao-notify.sh --rung`) with nothing wired to pull its trigger from the tick.** See Finding F11.

```
Mac (actual, not ansuz)              Mac                             Zaal
+---------------------------+  +--------------------------+  +------------------+
| zao-tick  */5 cron, no LLM|  | (nothing consumes this    |  | rung 3: push     |
| gh/REST PRs, DONE.md,     |->|  yet except zao-selftest's |  | (native settings,|
| tracker, stalled lanes    |  |  liveness check)          |  |  now all 3 ON)   |
| -> ~/.zao/tick-state.json |  |                            |  |                  |
|    + orca-board.log       |  | GAP: no Monitor wakes a    |  | zao-notify.sh    |
|    (quiet tick = free)    |  | session on tick's delta   |  | has rung:N now,  |
+---------------------------+  +--------------------------+  | nothing calls it |
      no tokens spent            no tokens spent either        from the tick    |
                                  (nothing runs at all)       +------------------+
```

| Rung | Carrier | 2026-08-29 | 2026-09-25 |
|------|---------|-----------|------------|
| 0 silent | `~/.zao/orca-board.log` line | every tick | **shipped** - `zao-tick` writes this every 5 min |
| 1 digest | `zao-vault/daily/<date>.md` | any state change | not re-verified as wired to the tick |
| 2 ping | Telegram via `zao-notify.sh --rung 2` | lane finished, PR went green | carrier shipped; nothing calls it from the tick |
| 3 wake | native push (`inputNeededNotifEnabled`) | clock-bound, irreversible | setting is ON; still nothing triggers it from the tick |

## What ZAO should NOT build

- **A Claude session in a `while true`.** Confirmed still correct - the 91.8% figure over 46 days is a stronger version of the 91.5% argument, not a weaker one.
- **A custom notification channel or approval UI.** `"defer"` remains unbuilt and remains the right unused-but-shipped mechanism to reach for before writing anything custom. The two push settings are now both ON.
- **A fifth board.** Confirmed and reinforced: `claude agents --json` is now the shared registry underneath `zj`, `orca-board`, `zao-selftest` and lane-open tooling. A related audit (doc `agents/2456-orchestrator-practice`, DEEP tier, last-validated 2026-09-01) found a downstream bug in exactly this area - `zao-lanes`' `classify()` called `tmux capture-pane -t <name>` for rows sourced from `claude agents --json`, and tmux's prefix-matching resolved `-t orc` to the unrelated `orcresearch` pane, rendering one lane's tmux screen under another lane's `claude agents` row. **That bug is fixed as of this reading** - `~/zaal-dotfiles/bin/zao-lanes` now targets `-t "={name}:"` (tmux's exact-match syntax) at both call sites (lines 534 and 766), confirmed by `grep`. The lesson from 2456 stands as a caveat for anyone building more on top of `claude agents`: the registry itself is reliable; anything that cross-references it against tmux by name needs exact-match, not prefix-match.

## Findings

- **F1.** 91.5% of the 20-day meter was context handling; **confirmed and strengthened 2026-09-25 at 91.8% over the fuller 46-day, 868-row ledger.** Model-independent, set by rate-card ratios.
- **F2.** Not re-measured this pass (point-in-time incident, not a standing claim).
- **F3.** Not re-measured this pass. `zao-sweep-tabs` (below, F-new) is a partial answer for one specific leak, not a general reaper.
- **F4.** `orca-board` sees Orca panes only; `claude agents` is the wider registry. **Updated 2026-09-25:** this gap has since caused a second, different bug (doc 2456's tmux prefix-match issue) rather than being closed outright - the registry itself is sound, downstream consumers needed fixing, and one (`zao-lanes`) has been.
- **F5.** State-on-disk / `cleanupPeriodDays: 90` - confirmed unchanged 2026-09-25.
- **F6.** The 6-second remote-poll quota event - confirmed unchanged in substance 2026-09-25; the daemon has since added exponential backoff on repeated failures (2026-08-23), which reduces the blast radius of a repeat outage but does not address the still-unpruned `metadata.relays` row.
- **F7.** Not independently re-verified this pass (VPS reachability / `loop-agent.sh` placement). No evidence found in `~/zaal-dotfiles` or the research library of the VPS being restored or the provider ladder being moved to ansuz. Status: **UNKNOWN, not FIXED** - do not read F7 as resolved absent a fresh check.
- **F8.** ansuz remains idle and suited (up 12 days today, load 0.02-0.09) - and remains unused for the tick. See decision 8: this is a deliberate, explained choice (no `gh`/`claude` there yet), not neglect.
- **F9.** Not re-verified this pass.
- **F10.** Confirmed unchanged 2026-09-25: Claude Code still has no daemon mode. #30447 remains open (see table above). Any 24/7 claim still rests on an external supervisor - and ZAO now has one running (`zao-tick` via cron), even though its output does not yet wake anything.
- **F11 (new, 2026-09-25).** The design's escalation half is unbuilt. `zao-tick` measures and logs for free; `zao-notify.sh --rung N` can carry a message to Telegram or push; nothing connects them. The only consumer of `zao-tick`'s output today is `zao-selftest`, checking that the tick is alive - not that anything happened. This is the single biggest gap between what this doc recommended and what exists.

## Also See

- [Doc 2204](../2204-cross-family-verification-99darwin-orchestrator/) - 99darwin/orchestrator: model-by-role, write-set parallel safety, cross-family verification. That doc answers *how to route a task*; this one answers *how to stay alive and report*.
- [Doc 2456](../2456-orchestrator-practice/) - Orchestrator practice measured against our own run (DEEP, last-validated 2026-09-01). Found and fixed the `zao-lanes` tmux prefix-matching bug that sits directly under this doc's "adopt `claude agents`" recommendation - read together, not in isolation.
- [Doc 999](../999-how-i-ai-harness-claude-agent-sdk/) - harness building with the Claude Agent SDK
- [Doc 1090](../../dev-workflows/1090-loop-engineering-karpathy-method/) - loop engineering, the Karpathy method
- [Doc 165](../../dev-workflows/165-claude-code-multi-session-management/) - multi-session management reference
- [Doc 653](../../dev-workflows/653-cron-bots-audit-may2026/) - prior cron/bot inventory; this doc updates the always-on picture
- [Doc 727](../727-zoe-as-agent-builder-supervisor/) - ZOE as orchestrator + supervisor

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Wire `zao-tick`'s non-empty-delta lines to `zao-notify.sh --rung`, so a real change reaches at least rung 1 without a human reading `orca-board.log` by hand. Shipped when a lane-completion or PR-state-change line from `zao-tick` produces a `zao-vault/daily/<date>.md` entry with no manual step | @Zaal | PR to zaal-dotfiles | 2026-10-03 |
| Prototype the `PermissionRequest` -> `"defer"` overnight-approval path on one lane (still not started). Shipped when a queued approval survives the night and resumes on one tap | @Zaal | PR to zaal-dotfiles | 2026-10-10 |
| Run `gh auth login` on ansuz (the one blocker named in `zao-tick`'s own header) and move the tick there per decision 8, or explicitly re-decide to keep it on the Mac and update this doc to grade decision 8 as superseded-by-practice rather than pending. Shipped when either ansuz runs the tick for 24h, or this doc's decision 8 is re-graded with a dated note | @Zaal | Infra decision | 2026-10-03 |
| Get `orca automations edit` (or the Orca UI) to set `reuseSession: true` on `organizer-tick`, closing ZAOOS#3361 at the root instead of sweeping hourly. Shipped when the issue is closed and `zao-sweep-tabs` reports "no leaked organizer-tick tabs" on a fresh Mac with the sweeper cron disabled for 24h | @Zaal | Orca automation edit + close ZAOOS#3361 | 2026-10-10 |
| Add `.claude/rules/resource-release.md` (never written). Shipped when the file exists in ZAOOS and names the release step for at least terminals, sessions and worktrees | @Zaal | PR to ZAOOS | 2026-10-10 |
| Re-verify F7: is the VPS reachable, and where does `loop-agent.sh` / `cheap-loop.sh` actually run today. Shipped when this doc's F7 reads a dated, measured answer instead of UNKNOWN | @Zaal | Infra check | 2026-10-03 |
| Prune `metadata.relays` (153+ delivered messages in the hot-polled row) - the real fix behind the 60s tourniquet and now behind the added backoff too. Shipped when the row is pruned and `lane-relay-daemon`'s poll interval can be lowered again without an egress risk | @Zaal | PR to ZAOOS | 2026-10-10 |
| Add a session reaper: idle >24h with a `DONE.md` present gets handed to the vault and closed. Shipped when `claude agents --json` session count stays under 25 for a week | @Zaal | PR to zaal-dotfiles | 2026-10-17 |

## Sources

- [FULL - read from disk] `~/.zao/spend-ledger.jsonl`, re-read 2026-09-25: now 868 rows, 2026-08-10T14:10:51Z to 2026-09-25T23:17:15Z; rate card read from `~/bin/zao-spend` (`RATES` block). A meter at list prices, not an invoice - Zaal is on Claude Max.
- [FULL - read from disk] `~/zaal-dotfiles/bin/zao-tick` (566 lines, read in full 2026-09-25), `~/zaal-dotfiles/bin/zao-sweep-tabs`, `~/zaal-dotfiles/bin/zao-lanes` (lines 488-770 for the `classify`/tmux exact-match fix), `~/zaal-dotfiles/bin/zao-notify.sh` + `zao-notify-test` (rung argument), `~/zaal-dotfiles/bin/lane-relay-daemon` (backoff logic, lines 55-90), `~/.claude/settings.json`
- [FULL - measured live 2026-09-25] `date`, `uptime` (Mac: load 11.95/8.17/7.57, 14 users), `ssh zaal@ansuz uptime` (up 12 days, load 0.02/0.09/0.08), `ssh zaal@ansuz find ~ -iname '*tick*'` (no `tick.sh`; found unrelated `orchestrator-tick.ts`/`tick-lock.ts` under a different project, `zao-bot-live`), `claude --version` (2.1.283, was 2.1.251), `crontab -l` (confirms `zao-tick` and `zao-sweep-tabs` both run on the Mac via cron), `orca automations list --json`, `python3 -c` ledger-ratio recomputation
- [FULL - `gh api`, state and title re-verified 2026-09-25] anthropics/claude-code [#30447](https://github.com/anthropics/claude-code/issues/30447) OPEN (`updated_at` 2026-09-21), [#23463](https://github.com/anthropics/claude-code/issues/23463) closed (`closed_at` 2026-04-17), [#25714](https://github.com/anthropics/claude-code/issues/25714) closed (`closed_at` 2026-04-23), [#34629](https://github.com/anthropics/claude-code/issues/34629) closed (`closed_at` 2026-04-01), [#40524](https://github.com/anthropics/claude-code/issues/40524) closed (`closed_at` 2026-04-04), [#41930](https://github.com/anthropics/claude-code/issues/41930) closed (`closed_at` 2026-04-24), [#67524](https://github.com/anthropics/claude-code/issues/67524) closed (`closed_at` 2026-06-15); [bettercallzaal/ZAOOS#3361](https://github.com/bettercallzaal/ZAOOS/issues/3361) re-checked, **still OPEN**, no comments, no closing commit in its timeline
- [FULL - `gh api`, comments read] anthropics/claude-code#30447 last 3 comments (2026-08-06 systemd-unit workaround from user Roorn; 2026-09-21 third-party-product comment from user StrayUnicorn re: "brnrd")
- [FULL] Research doc `agents/2456-orchestrator-practice`, resolved via `zao-research-health --resolve 2456`, read from disk, last-validated 2026-09-01 - cited for the `zao-lanes` tmux prefix-match bug and its fix
- [FULL] `zao-research-index "always-on orchestrator"` and `zao-research-index "deterministic tick"` - both run 2026-09-25; no doc supersedes 2444, and 2456 is the only doc that materially bears on it (found and cited above)
- [FULL - curl + HTML strip, not re-fetched this pass] code.claude.com/docs/en/sessions, code.claude.com/docs/en/github-actions, docs.claude.com hooks reference, settings-reference - carried forward from the 2026-08-29 doc; nothing in this research cycle contradicted them, but they were not independently re-fetched today, so treat their FULL mark as inherited rather than freshly re-verified
- [FULL] Research doc 2204, read from disk
- [PARTIAL - secondary, SEO-blog tier, not re-fetched this pass; used for pattern shape only, never for a number in a decision] Medium, DEV Community, withagents.dev, besthub.dev - carried forward unchanged
- [FAILED - not attempted this pass either] Reddit. Still no credential per doc 2273/2282; not needed for this doc's claims

## Note on this pass

This is an in-place re-research edit only, per the task's hard constraints: no commit, no push, no PR, no branch checkout. The file above is left changed in the working tree; Step 8/9/9.5 of the research skill (secret scan, commit, PR, tracker task) are deliberately not run this pass.
