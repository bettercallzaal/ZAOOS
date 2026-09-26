---
topic: agents
type: audit
status: research-complete
last-validated: 2026-09-25
superseded-by:
related-docs: "2461, 2471, 2420, 2456, 2407, 2344"
original-query: "can we manage zorca what potential updates and upgrades can we do /zao-research this please"
tier: STANDARD
---

# 2497 - Managing zorca: what to upgrade, measured against what is actually running

> **Goal:** Audit the zorca lane's own tooling - what it runs, what is dead, what is duplicated - and name the upgrades in the order that buys the most. Every number in the 2026-09-17 version was measured that day; every number below was re-measured on 2026-09-25, not recalled.

**Lead finding: Decision 1 was overtaken by events on the same day it was written.** The 2026-09-17 version graded "put fleet-watch on launchd" an A because `pgrep` found nothing running. `fleet-watch` shipped as a launchd daemon **40 minutes after that doc's own measurement**, via PR #281, merged 2026-09-17 15:03:46 EDT (the doc's pgrep/beat read was 14:20-14:22 EDT the same day). Re-measured now: it is running, loaded, and beating. This is not a case of a deadline blown - the fix landed two days before the 2026-09-19 deadline the doc itself set. The lesson is about the doc's own freshness, not about the engineering: a same-day fact changed within the hour of being recorded.

## Key Decisions (recommendations first)

| # | Decision | Grounded in | Grade |
|---|---|---|---|
| 1 | **RESOLVED. `fleet-watch.py` is now running as a launchd daemon and beating.** `pgrep -fl "fleet-watch.py\|auto-compact.sh"` now returns PID 12730 running `/Users/zaalpanthaki/.zao/zorca-watch/fleet-watch.py --notify`. `launchctl list \| grep com.zao` shows `12730 0 com.zao.fleet-watch` loaded, and `~/.zao/beats/fleet-watch` last updated 22:38:03 EDT today, one minute before this check ran. Shipped via `1789ae1` "launchd: run fleet-watch as a daemon, like every other supervisor (#281)", merged 2026-09-17 15:03:46 EDT - same day as, and 40 minutes after, the prior version's own measurement. The file was subsequently moved into the repo (`bin/fleet-watch.py`, PR #288, 2026-09-17 17:55:51 EDT) on a "branch-proof path" (commit `eaf6f28`); the live daemon path (`~/.zao/zorca-watch/fleet-watch.py`) is byte-identical to the repo copy (`diff` clean, both 1,480 lines). No further action needed on this decision. | `pgrep`, `launchctl list`, `~/.zao/beats/` mtimes, `~/Library/LaunchAgents/com.zao.fleet-watch.plist`, `git log` - all run/read locally 2026-09-25 22:39-22:41 EDT | A (closed) |
| 2 | **STILL OPEN. Collapse the two convention parsers - they still disagree on 3 of 8 realistic inputs, re-measured today.** `zao-autopilot`'s `HANDOFF`/`LOOP_LINE` regexes and `fleet-watch.py`'s `lane_marker_and_loop()` strip-then-`startswith` logic were re-read from current source and re-run against the same 8-line table. Result unchanged: **5/8 agree, 3/8 disagree** - a backticked `HANDOFF-READY` stamp, a backticked `LOOP:` stamp, and a `HANDOFF-READY` stamp embedded in a sentence are all still invisible to fleet-watch (its strip regex `^[\s>*\-#]+` does not strip backticks) while visible to autopilot (unanchored `re.search`). No `zao_convention.py` or any shared parser module exists anywhere under `~/bin`, `~/zaal-dotfiles`, or `~/.zao` (searched by name). The 2026-09-22 Next Action deadline for a shared parser has passed with no shared parser shipped - **3 days overdue as of today.** | current source read + side-by-side re-run, 2026-09-25; `find` for `zao_convention.py`/`zao-convention*` returned nothing | A |
| 3 | **STILL OPEN, and its own deadline is now blown too.** `fleet-watch.py`'s `classify()` (read in full, lines 338-374 today) still returns 11 distinct classes (`COMPACT-80+`, `COMPACT`, `ZAAL-PICKER`, `ZAAL-QUESTION`, `FULL`, `CAN-START`, `PARKED`, `PARKED-UNKNOWN`, `TYPING-OR-HIDDEN`, `BUSY-OR-HELD`, `LOOP-STOPPED`, plus a `RAW(...)` catch-all) - not collapsed to the four playbook categories. The 2026-09-24 Next Action deadline for this has passed; **1 day overdue as of today.** (This decision was not one of the six items flagged for re-verification in this pass, but its Next Action row needed a real status, so it was checked.) | `classify()` read in full from `~/zaal-dotfiles/bin/fleet-watch.py:338-374`, 2026-09-25 | A |
| 4 | **Herdr keeps shipping; the evaluation doc 2461 still has not been run, and its own new deadline (tomorrow) is at risk.** Third data point: stars 39,201 (09-17) -> **40,773** (09-25/26), +1,572 in 8 days (+4.0%; +18.6% cumulative since doc 2461's 09-01 baseline of 34,377). Forks 2,953 -> 3,115. Open issues 319 -> 362. Contributors 84 -> 88. Last push `2026-09-26T00:13:21Z` - about 2.5 hours before this check, still shipping daily. Licence re-confirmed **Apache-2.0** by reading the LICENSE file directly (opens `Apache License / Version 2.0, January 2004`), not the API's `license.spdx_id` classifier field (which also reads `Apache-2.0` today, consistent). Doc 2461 itself is unchanged: still `last-validated: 2026-09-01`, no GO/NO-GO decision row, not superseded. Its own Next Action ("herdr evaluation lands as a doc with a GO/NO-GO... by 2026-09-26") is due **tomorrow** and nothing has moved on it in 24 days. | `gh api repos/herdrdev/herdr`, `gh api .../contents/LICENSE`, `gh api .../contributors --paginate`, all run 2026-09-25; doc 2461 re-read in full | A |
| 5 | **STILL OPEN, deadline not yet reached.** `zorca-actuator`, `zorca-gui-test`, `zao-lane-health` re-checked: `grep -rl "zorca-actuator\|zorca-gui-test\|zao-lane-health" ~/bin ~/.claude/skills` still returns only the tools' own files (usage text, their own config-path constants) and their own test harnesses (`zorca-actuator-test` calls `zorca-actuator`, which is the tool testing itself, not an external caller). No other file in `~/bin` or `~/.claude/skills` references any of the three. None has moved to a `retired/` directory - no such directory exists anywhere searched. The 2026-09-30 deadline is 5 days away and unaddressed. | `grep -rl`, `find -iname "*retired*"`, 2026-09-25 | B |

## Findings

### The surface, measured - fourth data point, and it splits in two directions

| What | 2026-09-01 | 2026-09-17 | 2026-09-25 | Note |
|---|---|---|---|---|
| Doc 2461's five tools (`zj`, `zao-lanes`, `zao-tick`, `lane-send`, `zao-lane-boot`) | 1,449 | 3,669 | **3,848** | +153% over 16 days, then **+4.9% over the next 8 days** - growth continuing but sharply decelerating |
| Hand-written lane/fleet tooling, doc's own 28-file glob set (`~/bin/zao-lane*`, `zao-lanes`, `zao-autopilot`, `zorca*`, `orca-board`, `fleet-watch.py`) | - | 9,326 | **8,739** | **-587 lines (-6.3%)**, a reversal of the prior doc's growth narrative for the aggregate |

**Updated 2026-09-25: the aggregate shrank while the five-tool subset grew.** The five named tools added 179 lines in 8 days, but the full 28-file set the prior doc measured at 9,326 is now 8,739 - net down 587 lines. Both numbers were re-measured with `wc -l` against the same glob the prior doc used; the two facts are not in tension (they are different, overlapping file sets), but which specific file(s) among the other 23 shrank enough to produce the net decrease was **not traced in this pass** - the 2026-09-17 doc did not preserve a per-file breakdown of the full 28-file set to diff against, so attributing the decrease to a specific file or a specific refactor would be an unmeasured claim. Flagging as UNKNOWN rather than guessing.

Individual current counts (2026-09-25), for reference: `zj` 1,413; `zao-lanes` 1,049; `zao-tick` 566; `lane-send` 744; `zao-lane-boot` 76; `zao-lane` 277; `zao-lane-context.sh` 81; `zao-lane-health` 262; `zao-lane-journal` 136; `zao-lane-test` 73; `zao-lane-watch` 442; `zao-lane-watch-all` 643; `zao-lane-watch-all-test` 149; `zao-lane-watch-test` 338; `zao-lanegrill-count` 80; `zao-lanes-denominator-test` 147; `zao-lanes-test` 268; `zao-autopilot` 501; `zorca` 72; `zorca-actuator` 439; `zorca-actuator-test` 100; `zorca-brief` 113; `zorca-bundle` 169; `zorca-bundle-test` 150; `zorca-gui-test` 231; `zorca-lane-enqueue` 75; `zorca-lane-open` 289; `zorca-lane-open-test` 183; `zorca-lock` 37; `orca-board` 879; `fleet-watch.py` 1,480.

### fleet-watch: running now, and what that means for the 2026-09-14 fixes

The prior version listed five fixes made 2026-09-14 that had "never run" because the watcher was dead. With the daemon now confirmed running and beating (see Decision 1), those fixes - the two-consecutive-empty-reads change, `typed_from_screen` ignoring dialog/picker rows, the handoff alarm for PARKED/LOOP-STOPPED/PARKED-UNKNOWN lanes, `ESTATE-UNREADABLE` handling, and `held_alarm` - are now live against the real board for the first time. This doc did not re-verify each fix is behaviorally correct in production (that would require observing a live trigger of each condition, out of scope for this pass); it only re-verifies the daemon itself is up. Whether each specific fix behaves as designed under load is **UNKNOWN** and worth a follow-up check, not asserted here either way.

### Two parsers, one convention - unchanged

Re-run today against current source (`~/bin/zao-autopilot`'s `HANDOFF`/`LOOP_LINE` regexes, `~/zaal-dotfiles/bin/fleet-watch.py:955-994`'s `lane_marker_and_loop()`):

| Line | zao-autopilot | fleet-watch | agree |
|---|---|---|---|
| `HANDOFF-READY 2026-09-14 10:00` | HANDOFF | HANDOFF | yes |
| `> HANDOFF-READY 2026-09-14 10:00` | HANDOFF | HANDOFF | yes |
| `` `HANDOFF-READY 2026-09-14 10:00` `` | HANDOFF | **None** | **NO** |
| `the lane wrote HANDOFF-READY 2026-09-14 10:00 this morning` | HANDOFF | **None** | **NO** |
| `**HANDOFF-READY 2026-09-14 10:00**` | HANDOFF | HANDOFF | yes |
| `LOOP: stopped (queue empty) 2026-09-14 10:00` | LOOP | LOOP | yes |
| `` `LOOP: stopped (queue empty) 2026-09-14 10:00` `` | LOOP | **None** | **NO** |
| `> LOOP: stopped (queue empty) 2026-09-14 10:00` | LOOP | LOOP | yes |

**Still 3 of 8.** fleet-watch's current strip regex is `re.sub(r"^[\s>*\-#]+", "", line)` - it strips whitespace, `>`, `*`, `-`, `#` but never backticks, so a backticked stamp still fails `t.startswith("HANDOFF-READY")` / `t.startswith("LOOP:")`. autopilot's `HANDOFF` regex is still an unanchored `re.search`, so it still finds the stamp anywhere in a line including mid-sentence. No shared parser exists. Nothing has changed here in 8 days except the deadline, which passed.

### herdr, third look

| | 2026-09-01 (doc 2461) | 2026-09-17 (prior version) | 2026-09-25/26 (today) | delta since 09-17 |
|---|---|---|---|---|
| Stars | 34,377 | 39,201 | **40,773** | +1,572 (+4.0%) |
| Forks | - | 2,953 | 3,115 | +162 |
| Open issues | - | 319 | 362 | +43 |
| Contributors | - | 84 | 88 | +4 |
| Last push | - | 2026-09-17 15:45 | **2026-09-26T00:13:21Z** | still pushing daily |
| Licence | AGPL at the time | Apache-2.0 | **Apache-2.0** (LICENSE file re-read, opens identically) | unchanged |

Growth rate per day has slowed (roughly 284 stars/day between 09-01 and 09-17, versus roughly 196 stars/day between 09-17 and 09-25), but every other signal (forks, issues, contributors, push recency) kept climbing - this still reads as an accelerating, actively maintained project, not a cooling one. Doc 2461's own Next Action (GO/NO-GO doc, due 2026-09-26) is unshipped with the deadline one day out; nothing in doc 2461 has changed since 2026-09-01.

### HN threads - stable, re-verified via keyless Algolia API

| Thread | Points (doc) | Points (today) | Comments (doc) | Comments (today, recursive count) |
|---|---|---|---|---|
| [Herdr is joining Y Combinator. The runtime stays open](https://news.ycombinator.com/item?id=49201003) | 281 | **281** | 189 | **187** |
| [Herdr: One terminal to rule them all](https://news.ycombinator.com/item?id=48756578) | 404 | **404** | 178 | **178** |

Points are identical on both threads, as expected for threads past HN's ~30-day scoring freeze. Comment counts were re-derived by recursively walking each thread's `children` array from `hn.algolia.com/api/v1/items/<id>` (the item endpoint has no flat `num_comments` field; only a recursive walk gives the true total). The first thread reads 2 comments lower than the prior doc's figure - within the range of ordinary HN comment removal/dead-flagging over 19 days, not a contradiction worth escalating. The second thread matches exactly.

### zorca-actuator, zorca-gui-test, zao-lane-health - still uncalled

Re-run `grep -rl "zorca-actuator\|zorca-gui-test\|zao-lane-health" ~/bin ~/.claude/skills` today. It returns three files: `zorca-actuator`, `zorca-gui-test`, `zorca-actuator-test`. Reading each match: `zorca-actuator` and `zorca-gui-test` only reference themselves (usage/help text, their own config-path constants like `~/.zao/zorca-actuator.json`). `zorca-actuator-test` calls `zorca-actuator` - that is the tool's own test harness, not a production caller. No other file in `~/bin` or `~/.claude/skills` names any of the three. `zao-lane-health` itself is now a symlink (`~/bin/zao-lane-health -> ~/zao-status/bin/zao-lane-health`, dated 2026-08-21) but the symlink target does not change the "zero external callers" finding. No `retired/` directory exists under `~/bin` or `~/zaal-dotfiles`.

### What the state-derivation problem actually costs (unchanged, not re-verified this pass)

Carried forward from the prior version without re-measurement - not one of the six flagged items and no code path in `zao-lanes`'s state-derivation sites was re-read today. Treat as **not re-verified in this pass**, not as reconfirmed.

## Also See

- [agents/2461-herdr-agent-runtime](../2461-herdr-agent-runtime/) - the evaluation this doc says to finally run; still unrun as of today, 24 days after its own baseline and 1 day before its own new deadline
- [dev-workflows/2471-zao-lane-workflow-audit](../../dev-workflows/2471-zao-lane-workflow-audit/) - "the one gap that makes tools disappear"; carries its own CORRECTION section
- [agents/2420-zorca-gui-redesign](../2420-zorca-gui-redesign/) - the GUI spec; same "what needs Zaal right now" question this doc asks of the watcher
- [agents/2456-orchestrator-practice](../2456-orchestrator-practice/) - exact-match tmux targets, JSON completion state, the initializer/worker split
- [dev-workflows/2407-orca-tmux-lane-integration](../../dev-workflows/2407-orca-tmux-lane-integration/)
- [agents/2344-wall-picked-off-governor](../2344-wall-picked-off-governor/)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| `com.zao.fleet-watch.plist` exists, is `launchctl load`ed, and `~/.zao/beats/fleet-watch` updates - **SHIPPED 2026-09-17 (PR #281), confirmed running and beating on 2026-09-25.** No further action. | @Zaal | PR to zaal-dotfiles | 2026-09-19 (done 2026-09-17) |
| One shared convention parser: `zao-autopilot` imports fleet-watch's `lane_marker_and_loop`, or both import a new `zao_convention.py`; the 8-case table above ships as its test and goes 8/8. **NOT SHIPPED - original deadline missed by 3 days.** Re-dated. | @Zaal | PR to zaal-dotfiles | 2026-10-02 |
| fleet-watch emits only the four playbook categories; `classify()` still returns 11 distinct classes today. **NOT SHIPPED - original deadline missed by 1 day.** Re-dated. Shipped when a full parked day produces zero status lines. | @Zaal | PR to zaal-dotfiles | 2026-10-02 |
| herdr evaluation lands as a doc with a GO/NO-GO on semantic state, explicitly keeping tmux. **NOT SHIPPED - doc 2461 unchanged since 2026-09-01, original deadline is tomorrow and at risk.** Shipped when doc 2461 (or a successor) has a decision row graded A on GO/NO-GO. | @Zaal | Research doc | 2026-09-26 |
| `zorca-actuator`, `zorca-gui-test`, `zao-lane-health` are either wired to a caller or moved to `retired/` with a line saying why. **NOT SHIPPED - still zero external callers, no retired/ dir exists, 5 days remain.** | @Zaal | PR to zaal-dotfiles | 2026-09-30 |

## Sources

- `pgrep -fl "fleet-watch.py\|auto-compact.sh"` - run locally 2026-09-25 22:39 EDT, returned PID 12730 [FULL - measured]
- `ls -la ~/.zao/beats/`, `stat -f "%Sm %N"` on beat files - run locally 2026-09-25 22:38-22:39 EDT, 24 beat files, `fleet-watch` present and fresh [FULL - measured]
- `launchctl list | grep com.zao` - run locally 2026-09-25 22:39 EDT, 9 `com.zao.*` entries loaded incl. `fleet-watch` (PID 12730) [FULL - measured]
- `find ~/Library/LaunchAgents -iname "com.zao.*"` and direct read of `com.zao.fleet-watch.plist` - run/read locally 2026-09-25 [FULL - direct file read]
- `git -C ~/zaal-dotfiles log --oneline --all -- '*fleet-watch*'` and `git log -1 --format="%H %ai %s"` on commits `1789ae1`, `eaf6f28`, `ebb8099` - read locally 2026-09-25 [FULL - git log]
- `diff` + `wc -l` between `~/zaal-dotfiles/bin/fleet-watch.py` and the live daemon path `~/.zao/zorca-watch/fleet-watch.py` - run locally 2026-09-25, byte-identical, both 1,480 lines [FULL - measured]
- `~/bin/zao-autopilot` (HANDOFF/LOOP_LINE regexes, current source) and `~/zaal-dotfiles/bin/fleet-watch.py:338-374,955-994` (`classify()`, `lane_marker_and_loop()`) - read locally 2026-09-25 [FULL - direct file read]
- Side-by-side parser re-run against the same 8-line table, both rule sets copied verbatim from current source, executed 2026-09-25 [FULL - executed, output in Findings]
- `grep -rl "zorca-actuator\|zorca-gui-test\|zao-lane-health" ~/bin ~/.claude/skills` and `find -iname "*retired*"` - run locally 2026-09-25 [FULL - measured]
- `wc -l` on the five named tools and the full 28-file glob set - run locally 2026-09-25 [FULL - measured]
- [herdrdev/herdr](https://github.com/herdrdev/herdr) - `gh api repos/herdrdev/herdr --jq '{stars,forks,open_issues,license,pushed_at}'`, run 2026-09-25 [FULL - GitHub REST API]
- herdr LICENSE file via `gh api repos/herdrdev/herdr/contents/LICENSE --jq .content | base64 -d | head -5`, run 2026-09-25, opens `Apache License / Version 2.0, January 2004` [FULL - file read, not the API licence field]
- `gh api repos/herdrdev/herdr/contributors --paginate` - run 2026-09-25, 88 contributors [FULL - GitHub REST API]
- doc `agents/2461-herdr-agent-runtime/README.md` - re-read in full locally 2026-09-25, unchanged since 2026-09-01 [FULL - direct file read]
- [Herdr is joining Y Combinator. The runtime stays open](https://news.ycombinator.com/item?id=49201003) - `hn.algolia.com/api/v1/items/49201003`, run 2026-09-25, 281 pts, 187 comments (recursive walk) [FULL - HN Algolia item API, keyless]
- [Herdr: One terminal to rule them all](https://news.ycombinator.com/item?id=48756578) - `hn.algolia.com/api/v1/items/48756578`, run 2026-09-25, 404 pts, 178 comments (recursive walk) [FULL - HN Algolia item API, keyless]
- Research library: doc 2461 - read locally, every number in this doc resolved with local commands or `gh api`/HN Algolia before citing [FULL]
