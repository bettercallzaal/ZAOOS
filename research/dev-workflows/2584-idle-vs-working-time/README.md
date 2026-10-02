---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-10-02
superseded-by:
related-docs: "2444, 2581, 2456, 2423, 2582"
original-query: "Zaal, seat pane 00:1x Fri 2 Oct, verbatim: 'can we resaerch our idle time vs time working and find ways to improve that please'. Relayed by the orchestration seat (zao-icm-b5) to the context lane with the measurement plan: per terminal on 1 Oct, working vs waiting vs idle, denominator the wall minutes the session was open, compare with docs 2444 and 2581, three improvements tested against the data."
tier: STANDARD
---

# 2584 - Idle time versus working time, measured per terminal on 1 Oct 2026, and the three changes the numbers support

> **Goal:** Measure, with three independent instruments, how much of each terminal's open time on 2026-10-01 was work and how much was waiting or idle; put a denominator under every figure; compare with what docs 2444 and 2581 already measured; and name three improvements that the data supports rather than assumes, each with the mechanism it needs and whether it lands before or after 4 Oct.

Written by the context lane on the night of 1 to 2 Oct, on the seat's assignment, inside the two-hour cap. Every number below was produced by a command named next to it; the scripts are in the lane's scratchpad and reproduce from `~/.claude/state/`, `~/.claude/projects/` and the vault's git history.

## Key Decisions

| # | Decision | Evidence | Confidence | Owner, by when |
|---|---|---|---|---|
| 1 | **The fleet worked for about 1 hour in every 10 it was open on 1 Oct, and three instruments that share no code agree on that.** Waiting is not idle in the sense of wasted compute: 11 of 14 lanes spent most of the day holding a pane with nothing to do and nothing queued. | zao-waiting (state transitions): 95.3 percent waiting, 218.09 wait h vs 10.75 work h over 14 lanes. Transcript minute buckets: 1,036 active minutes of 9,497 span minutes over the 14 lanes, 10.9 percent. fleet-health hourly snapshots: 9 of 294 lane-samples "ok", 3 percent | A | Record; the number to beat is 10 percent |
| 2 | **Waiting on Zaal is a quarter of the waiting, not the whole of it.** The fleet-health instrument splits the non-working samples into `waiting` (nothing queued) and `ASKED` (holding a question): 202 to 79. One lane, zao-vault, holds 62 of the 79 ASKED samples, so without it ASKED is 17 of 225, 8 percent. | 23 snapshots, 04:20Z to 03:20Z next day, hourly; `git log -- BLACKBOARD.md` on origin plus the clone | A | The fix is not "answer faster"; it is "fewer open panes with nothing queued" |
| 3 | **ADOPT, after 4 Oct: a lane that has stamped HANDOFF-READY and has no queued step closes its pane instead of holding it.** The data: 8 of 14 lanes have under 1 hour of work in 12 to 24 open hours; `zao-waiting`'s own 1800-second tail cap exists because dead WAITING sessions would otherwise accrue forever, which is the shape of a pane that should have closed. Mechanism: `lane-watch` already reads the stamp; the close is a `claude` exit the lane does itself after the stamp, with the seat's `census` confirming the status file is on origin. | zao-waiting per lane; doc 2444 KD4 "one always-on process, many disposable sessions, state in vault files"; `.claude/rules/handoff-discipline.md` | B | Dotfiles, after 4 Oct; the context lane measures the before and after with the same three instruments |
| 4 | **ADOPT, after 4 Oct: the seat wakes a lane by envelope only when it has an unblocked step for it; no "are you there" ticks.** The seat's own ledger shows its ticks are not the waste: 24 of 25 ticks moved something. The waste is the 13 lanes being open to receive a tick that comes to two of them an hour. | `projects/seat-loop-ledger.md`, 25 rows; the context lane's 16 census ticks cost about 75 active minutes over a 12.4-hour span | B | Seat, after 4 Oct; needs the envelope-plus-relaunch path (`claude --resume` from the vault, doc 2444 KD4), already measured to work |
| 5 | **KEEP the census ticks and hourly tool commits, and count them as work, because they are the only reason the 10 percent is a measurement and not a feeling.** They cost the context lane about 2 minutes of active time per tick. The tool commits (fleet-health, zao-vault-toc) cost nothing in agent time; their defect is where they commit (card 10208), not that they run. | transcript buckets for `context`: 75 active minutes, 16 ticks plus one doc; fleet-health 13 of 13 hours | A | No change; 10208 fixes the write path |
| 6 | **SKIP "fewer, longer-lived lanes" as a rule; the data points the other way for most lanes.** The two lanes with the most work (zao-icm 2.06 h, zaal-dotfiles 1.8 h) are the long-lived ones and they are the least idle (90.6 and 92.4 percent waiting versus 96 to 99 for the rest). The short-lived child lanes (poidhz-radio-bounty 0.5 h of work, orca-research 0.56 h) did one job and then held a pane for 12 hours. Fewer lanes would not help; closed lanes would. | zao-waiting per lane; ps `createdAt` for the two children | B | Covered by KD3 |
| 7 | **Doc 2444's 91.5 percent is a different ratio and both are true: 91.5 percent of the METER is context handling; 95.3 percent of the CLOCK is waiting.** Together they say the fleet spends most of its tokens re-reading context and most of its hours doing nothing, which is the case for KD3 and KD4 and against anything that adds lanes. | doc 2444 KD1, 20-day meter; this doc KD1, one day of clock | A | Cross-reference only |

## Measured: 1 Oct 2026, per terminal

Three instruments. None samples the others' data.

**Instrument A, state transitions.** `zao-waiting --days 1` reads the WORKING to WAITING transitions the status hook writes to `~/.claude/state/status-*.json`, with a 1800-second tail cap on an open WAITING span so a closed terminal stops accruing. Continuous, not sampled. Denominator per lane is wait hours plus work hours inside the window.

| lane | wait percent | wait h | work h |
|---|---|---|---|
| zao-fractal-bot | 99.6 | 11.43 | 0.05 |
| zaoonparagraph | 98.2 | 14.78 | 0.26 |
| grill-2 | 97.4 | 11.99 | 0.32 |
| iman-desk | 97.3 | 21.37 | 0.59 |
| zao-media | 96.7 | 13.84 | 0.47 |
| zpoidh | 96.7 | 11.09 | 0.38 |
| zao-vault | 96.5 | 11.22 | 0.41 |
| zaostock | 96.4 | 20.90 | 0.78 |
| poidhz-radio-bounty | 96.2 | 12.44 | 0.50 |
| orca-research | 96.1 | 13.53 | 0.56 |
| context | 94.7 | 12.47 | 0.70 |
| x-account | 92.5 | 20.82 | 1.69 |
| zaal-dotfiles | 92.4 | 22.03 | 1.80 |
| zao-icm | 90.6 | 19.97 | 2.06 |
| **FLEET** | **95.3** | **218.09** | **10.75** |

Reconciliation, after review by the Dotfiles lane: the 14 lane rows sum to 10.57 work hours and the FLEET row says 10.75. The FLEET row also counts three non-lane working directories the hook stamps (`web` 0.15 h, `/` 0.01 h, `scratch` 0.00 h), which account for 0.16 of the 0.18 gap, and the remaining 0.02 is rounding across 14 rows. The window is a rolling 24 hours, so a rerun drifts by a few hundredths; the table is the 00:1x run.

**Instrument B, transcript minute buckets.** Every event in `~/.claude/projects/*/*.jsonl` with a timestamp on 1 Oct, bucketed to the minute and keyed by the event's `cwd`; a minute with any event is active. Span is first to last event that day, so a lane open before 1 Oct is measured from its first event, not from midnight. Event-level, not sampled.

| lane | active min | span min | active percent |
|---|---|---|---|
| zao-icm | 223 | 1374 | 16.2 |
| x-account | 142 | 863 | 16.5 |
| zaal-dotfiles | 132 | 1369 | 9.6 |
| zaostock | 85 | 800 | 10.6 |
| context | 75 | 692 | 10.8 |
| iman-desk | 71 | 768 | 9.2 |
| grill-2 | 54 | 648 | 8.3 |
| zpoidh | 54 | 681 | 7.9 |
| zao-media | 46 | 335 | 13.7 |
| zao-vault | 43 | 146 | 29.5 |
| poidhz-radio-bounty | 38 | 746 | 5.1 |
| zaoonparagraph | 35 | 255 | 13.7 |
| orca-research | 34 | 815 | 4.2 |
| zao-fractal-bot | 4 | 5 | 80.0 |
| **14 lanes** | **1,036** | **9,497** | **10.9** |

Corrected after review by the Dotfiles lane: the first version printed the script's 19-key total (1,056 of 10,339, 10.2 percent), which included five non-lane working directories (`web`, `scratch`, `research`, `clips` and a blank cwd), and omitted the zao-fractal-bot row. The table and total above are the 14 lane rows only. zao-fractal-bot's 80 percent is 4 active minutes in a 5-minute span: one short visit, not a busy lane.

**Instrument C, fleet-health hourly snapshots.** The ACTIVE AGENTS block in `BLACKBOARD.md`, one commit an hour at :20, read from origin and from the shared clone's local history; 23 distinct stamps from 04:20Z on 1 Oct to 03:20Z on 2 Oct. Hourly sample, so a state that lasted 10 minutes between two samples is invisible.

| state | lane-samples | share |
|---|---|---|
| waiting | 202 | 69 percent |
| ASKED | 79 | 27 percent |
| ok | 9 | 3 percent |
| OPEN-MENU | 4 | 1 percent |
| total | 294 | |

zao-vault alone: 62 of its 69 samples ASKED. Without that lane, ASKED is 17 of 225.

**Denominator check.** The seat asked for wall minutes from each session's started-at. Read from the newest state file per lane: summed open hours on 1 Oct across 16 projects is 172.3, against instrument A's 228.8 (wait plus work). The gap is restarts: the state file keeps the newest session per project, so a lane restarted in the evening (zaal-dotfiles at 22:20, zao-media at 15:11) reads short. Instrument A's per-session hours are the honest denominator; the started-at column is printed in the lane's status log for the record and is not used in any ratio above.

**UNKNOWN:** finance-hq and ZAO OS V1 appear in instrument C (23 and 14 samples, all waiting) and in no other instrument; their work time on 1 Oct is UNKNOWN, not zero. The Antigravity agent has no instrument at all.

## Compared with what was already measured

- **Doc 2444 (always-on orchestrator):** 56.6 percent cache_read plus 34.9 percent cache_write equals 91.5 percent of the meter on context handling over 20 days, 8.4 percent output. Not re-derived here. It is the token-side twin of this doc's clock-side 95.3 percent, and its KD1 (a deterministic tick with no LLM, Claude wakes only on a non-empty delta) is the mechanism KD4 above needs.
- **Doc 2581 adoption 1 (ps as the state source):** `orca worktree ps --json` carries `status` and `lastActivityAt` per worktree. Read at 00:4x on 2 Oct: 15 non-inactive rows, 13 "active" and 2 "working", with `lastActivityAt` between 11:42 and 23:12 on 1 Oct. It is a point read, so it cannot give a ratio, but it names which lanes have not moved in 9 to 13 hours, which is the list KD3 would close. Doc 2582 recorded that ps drops the comment field on 2 of 35 rows; it does not drop `lastActivityAt`.
- **Doc 2456 KD2:** the orchestrator's context problem is solved by never holding the messy work. Instrument A shows the seat holding the most work of any lane (2.06 h) while still waiting 90.6 percent of its clock, which is the right shape: it routes, it does not idle in the sense of having nothing to do, and it is not the lane to close.

## Three improvements, tested against the data

| Candidate (from the seat's list) | What the data says | Verdict | Mechanism | When |
|---|---|---|---|---|
| Idle lanes close themselves after a stamped handoff instead of holding a pane | 8 of 14 lanes under 1 h work in 12 to 24 open hours; two child lanes done by midday held panes to 22:00 | ADOPT | lane exits after HANDOFF-READY plus census confirmation the status file is on origin; relaunch from the vault by `claude --resume` or `/lane-init` | after 4 Oct |
| The seat wakes lanes by envelope only when there is an unblocked step | seat's 25 ticks moved 24 things; the receiving lanes were open 13 at a time for a tick that reaches 2 an hour | ADOPT | envelope with `basis` plus relaunch; the seat's tick stays deterministic (doc 2444 KD1) | after 4 Oct |
| Fewer, longer-lived lanes | the long-lived lanes are the least idle and the most productive; short lanes idle after their one job | SKIP as a rule | none | n/a |
| Count hourly tool commits and census ticks as work | census ticks cost the context lane about 2 active minutes each and produced every number in this doc; tool commits cost no agent time | KEEP, count as work | card 10208 fixes where they commit | Sunday (10208) |

## Also See

- [agents/2444 - always-on orchestrator](../../agents/2444-always-on-orchestrator/)
- [dev-workflows/2581 - Orca, how others use it](../2581-orca-how-others-use-it/)
- [agents/2456 - orchestrator practice](../../agents/2456-orchestrator-practice/)
- [agents/2423 - the vault is memory, not a message bus](../../agents/2423-vault-as-transport-inter-terminal-context/)
- [agents/2582 - how agent context improves](../../agents/2582-agent-context-improves/) (ZAOOS PR #3701)
- `.claude/rules/handoff-discipline.md`, which names waiting percent the primary weekly metric, and `~/bin/zao-waiting` (card 9e629a21), which computes it

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Lane self-close after HANDOFF-READY: a lane with a fresh stamp, status on origin and no queued envelope exits its pane; shipped when `zao-waiting --days 1` shows FLEET wait hours under 120 on a weekday with 14 lanes | Dotfiles lane (zj) | Dotfiles PR | 2026-10-08 |
| Seat wake-by-envelope: the seat's tick sends an envelope and relaunches the lane only on a non-empty delta for that lane; shipped when the seat ledger shows ticks with no lane woken | orchestration seat | zao-vault PR plus a Dotfiles helper | 2026-10-08 |
| Re-measure with the same three instruments on the first full weekday after both land, and put the before and after table in this doc; shipped when this doc carries a second dated table | context lane | re-research | 2026-10-14 |
| Give finance-hq and ZAO OS V1 a state file or retire their rows from fleet-health, so their work time stops reading UNKNOWN; shipped when instrument A lists them or instrument C does not | Dotfiles lane (zj) | Dotfiles PR | 2026-10-08 |

## Sources

All local, all read 2026-10-02 between 00:1x and 01:0x EDT. No web source: the question is about this estate's own clock and every instrument lives on this Mac.

- `~/bin/zao-waiting --days 1` and `--json`, output quoted verbatim in instrument A; its docstring names the transition log and the 1800-second tail cap [FULL, run]
- `~/.claude/projects/*/*.jsonl`, 1 Oct events bucketed by minute with the lane's scratchpad script `transcripts.py` [FULL, run; first run had a key bug that aborted every file after its first assistant line and was discarded]
- `BLACKBOARD.md` history, `git log --since=2026-10-01 --until=2026-10-02 -- BLACKBOARD.md` on origin/main (11 fleet-health commits) and in `~/zao-vault` local main (13 more), 23 distinct stamps after de-duplication [FULL, run]
- `~/.claude/state/status-*.json`, 6,818 files, newest per project read for started-at [FULL, run]
- `orca worktree ps --json`, 35 rows, 15 non-inactive, read 2026-10-02 00:4x [FULL, run]
- `zao-vault/projects/seat-loop-ledger.md`, 25 tick rows [FULL, local]
- `zao-vault/handoffs/status/context.md`, 17 census entries on 1 Oct [FULL, local]
- ZAOOS `research/agents/2444-always-on-orchestrator/README.md`, Key Decisions table [FULL, local]
