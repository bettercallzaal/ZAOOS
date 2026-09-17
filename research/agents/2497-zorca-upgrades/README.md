---
topic: agents
type: audit
status: research-complete
last-validated: 2026-09-17
superseded-by:
related-docs: "2461, 2471, 2420, 2456, 2407, 2344"
original-query: "can we manage zorca what potential updates and upgrades can we do /zao-research this please"
tier: STANDARD
---

# 2497 - Managing zorca: what to upgrade, measured against what is actually running

> **Goal:** Audit the zorca lane's own tooling - what it runs, what is dead, what is duplicated - and name the upgrades in the order that buys the most. Every number here was measured on 2026-09-17, not recalled.

## Key Decisions (recommendations first)

| # | Decision | Grounded in | Grade |
|---|---|---|---|
| 1 | **Put `fleet-watch.py` on launchd. It is NOT RUNNING right now, and it has never had a heartbeat.** `pgrep -fl "fleet-watch.py\|auto-compact.sh"` returns nothing. `~/.zao/beats/` holds **23 beat files** and not one is `fleet-watch`. Meanwhile **8 `com.zao.*` LaunchAgents are loaded**, and `lane-relay`, `zao-lane-watch`, `zao-lane-watch-all`, `fleet-health` and `zao-tick` all beat within the last two minutes. zorca's watcher is the only supervisor in the estate that dies with a terminal. | `pgrep`, `ls ~/.zao/beats`, `launchctl list`, beat mtimes 14:20-14:22 today | A |
| 2 | **Collapse the two convention parsers into one. They disagree on 3 of 8 realistic inputs, measured.** `zao-autopilot` and `fleet-watch.py` each parse `HANDOFF-READY` and `LOOP:` with their own regexes. A backticked stamp and a stamp inside a sentence are visible to autopilot and invisible to fleet-watch. This is not theoretical: the same class of divergence cost three lanes a wasted commit each on 2026-09-14. | side-by-side run of both parsers, table in Findings | A |
| 3 | **Stop narrating a working system - 7 of fleet-watch's 10 classes are status, not signal.** The estate already wrote this rule down, in the header of the durable sibling: *"Emits ONLY the four playbook categories: a decision owed to Zaal, a contradiction, a deadline, or something going outward. Deliberately does NOT emit: routine commits, test runs, reads, greps, or 'the lane is working'. Narrating a working system is the failure mode."* fleet-watch prints on **every class change for every lane**, across **17 message shapes**. | `zao-lane-watch-all` lines 2-6; `grep` of fleet-watch's print sites and `classify()` returns | A |
| 4 | **Run the herdr evaluation doc 2461 ordered 16 days ago. The code it told us to stop growing has grown 2.5x.** 2461 (2026-09-01): *"EVALUATE herdr before moving the lane tools into zorca... That is 1,449 lines of hand-rolled lane tooling... the consolidation may be moving code that should be deleted."* The same five tools today total **3,669 lines**. The evaluation did not happen; the code did. | `wc -l` on `zj`, `zao-lanes`, `zao-tick`, `lane-send`, `zao-lane-boot`, today vs doc 2461 | A |
| 5 | **Retire the ~930 lines nothing calls.** `zorca-actuator` (439) + its test (100), `zorca-gui-test` (231) and `zao-lane-health` (262) have **zero references** in `~/bin` and **zero** in `~/.claude/skills`. They exist, they are tested, and no code path reaches them - which is doc 2471's "the one gap that makes tools disappear", still open. | `grep -rl` across `~/bin`, `~/.claude/skills`, `~/zao-vault/handoffs` | B |

## Findings

### The surface, measured

| What | Lines | Note |
|---|---|---|
| Hand-written lane/fleet tooling (28 tools + fleet-watch) | **9,326** | `~/bin/zao-lane*`, `zao-lanes`, `zao-autopilot`, `zorca*`, `orca-board`, `fleet-watch.py` |
| Of which tests | **8,896** | a near 1:1 test-to-tool ratio, which is genuinely good |
| `fleet-watch.py` alone | 1,332 | 151 assertions in `unsent-test.py` (548 lines) |
| Doc 2461's five tools, 2026-09-01 | 1,449 | its measurement |
| **The same five tools, 2026-09-17** | **3,669** | **2.5x in 16 days** |

### Two parsers, one convention

Both parsers were run against the same eight lines. Rules copied verbatim from `~/bin/zao-autopilot:64-87` and `fleet-watch.py:848-861`.

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

**3 of 8.** autopilot's `HANDOFF` is unanchored (`re.search`) and its `LOOP_LINE` allows an optional backtick; fleet-watch strips markdown then requires the line to *start* with the token. A lane that quotes its own stamp in backticks is parked to one reader and silent to the other.

The in-house proof that one reader works already exists: `zao-unsent` (50 lines) **imports** `fleet-watch` rather than copying its logic, which is why it carried the 2026-09-14 dialog fix immediately while the running watcher did not.

### Every fix made on 2026-09-14 has never run

Because fleet-watch is not running, these are on disk and have never executed against a live board:

- two consecutive empty reads before calling an input line cleared (a single read produced a false "typed then cleared" three times that day)
- `typed_from_screen` ignoring dialog and picker rows (it reported a confirm dialog's `No` as Zaal's typed words, on a dialog asking to permanently delete an artifact)
- the handoff alarm going quiet for PARKED / LOOP-STOPPED / PARKED-UNKNOWN lanes
- `ESTATE-UNREADABLE` collapsing an all-lanes-blind cycle to one line
- `held_alarm` - a pane on a picker for 30+ minutes. Built because the zaostock pane sat on one question from 10:06 and **13 messages queued behind it**, which is why `/artist/lyonsden` served a public 404 for seven hours

That last one is the argument for decision 1 in a sentence: the alarm that would have caught a seven-hour public outage exists, is tested, and is not running.

### herdr, second look

Doc 2461 looked on 2026-09-01. The skill's rule is that the second look is the point.

| | 2026-09-01 (doc 2461) | 2026-09-17 (today) | delta |
|---|---|---|---|
| Stars | 34,377 | **39,201** | **+4,824 (+14%)** |
| Forks | - | 2,953 | |
| Open issues | - | 319 | |
| Contributors | - | 84 | |
| Last push | - | **2026-09-17 15:45** | pushed today |
| Licence | AGPL at the time | **Apache-2.0** | relicensed |

Licence read from the LICENSE file, not the API field (Hard Requirement 13): the file opens `Apache License / Version 2.0, January 2004`.

This is the opposite profile to the abandoned-but-popular repo the research skill warns about. It is accelerating and shipping.

**And the dissent is real, so it is quoted rather than smoothed over.** herdr joined Y Combinator on 2026-08-06 (281 points, 189 comments). The highest-voted comment on that thread:

> "I have such mixed feelings about this - YC means VC means commercialization means enshitification. I really wish that weren't the case, but it so very often is."  - nlh

> "Okay, back to tmux it is then."  - humblepie

The AGPL-to-Apache move is the founder's own framing in that thread - *"I want everyone to use Herdr freely, without any problem"* - which is good for adoption and is also what a company does before commercialising. Doc 2461's third decision already says **do not rip out tmux**: the gain on offer is semantic state and a driving API, not persistence, which tmux already provides.

### What the state-derivation problem actually costs

2461 measured **7 state-derivation sites in `zao-lanes` alone** and three wrong-state bugs in one day. fleet-watch adds its own `classify()` with 10 return values. Every detector fault I logged on 2026-09-13/14 - the vault/review-2 mapping, the pointer file shadowing a real record, the dialog default read as typed words, the picker row read as an unsent line, autopilot rule 5 reading a lane's own stop record as new work - is the same failure: **we infer semantic state from rendered text, and rendered text contains chrome.**

herdr ships `blocked / working / done / idle` as first-class runtime state. That is the single feature that would delete the class of bug rather than fix instances of it.

## Also See

- [agents/2461-herdr-agent-runtime](../2461-herdr-agent-runtime/) - the evaluation this doc says to finally run
- [dev-workflows/2471-zao-lane-workflow-audit](../../dev-workflows/2471-zao-lane-workflow-audit/) - "the one gap that makes tools disappear"; carries its own CORRECTION section
- [agents/2420-zorca-gui-redesign](../2420-zorca-gui-redesign/) - the GUI spec; same "what needs Zaal right now" question this doc asks of the watcher
- [agents/2456-orchestrator-practice](../2456-orchestrator-practice/) - exact-match tmux targets, JSON completion state, the initializer/worker split
- [dev-workflows/2407-orca-tmux-lane-integration](../../dev-workflows/2407-orca-tmux-lane-integration/)
- [agents/2344-wall-picked-off-governor](../2344-wall-picked-off-governor/)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| `com.zao.fleet-watch.plist` exists, is `launchctl load`ed, and `~/.zao/beats/fleet-watch` updates - the watcher survives a terminal closing | @Zaal | PR to zaal-dotfiles | 2026-09-19 |
| One shared convention parser: `zao-autopilot` imports fleet-watch's `lane_marker_and_loop`, or both import a new `zao_convention.py`; the 8-case table above ships as its test and goes 8/8 | @Zaal | PR to zaal-dotfiles | 2026-09-22 |
| fleet-watch emits only the four playbook categories; the 7 status classes become a queryable board, not a stream. Shipped when a full parked day produces zero status lines | @Zaal | PR to zaal-dotfiles | 2026-09-24 |
| herdr evaluation lands as a doc with a GO/NO-GO on semantic state, explicitly keeping tmux. Shipped when the doc has a decision row graded A | @Zaal | Research doc | 2026-09-26 |
| `zorca-actuator`, `zorca-gui-test`, `zao-lane-health` are either wired to a caller or moved to `retired/` with a line saying why | @Zaal | PR to zaal-dotfiles | 2026-09-30 |

## Sources

- `~/.zao/zorca-watch/fleet-watch.py`, `unsent-test.py`, `zao-unsent` - read locally [FULL - direct file read]
- `~/bin/zao-autopilot` lines 64-87, `~/bin/zao-lane-watch-all` lines 1-14 - read locally [FULL - direct file read]
- `pgrep`, `launchctl list`, `ls ~/.zao/beats`, `wc -l`, `grep -rl` - run locally 2026-09-17 [FULL - measured]
- Side-by-side parser run, both rule sets copied verbatim from source [FULL - executed, output in Findings]
- [herdrdev/herdr](https://github.com/herdrdev/herdr) - `gh api` + `zao-research-snapshot`, 2026-09-17 [FULL - GitHub REST API]
- herdr LICENSE file via `gh api repos/herdrdev/herdr/contents/LICENSE` [FULL - file read, not the API licence field]
- [Herdr is joining Y Combinator. The runtime stays open](https://news.ycombinator.com/item?id=49201003) - 281 pts, 189 comments, 2026-08-06 [FULL - HN Algolia item API, keyless, comments read raw]
- [Herdr: One terminal to rule them all](https://news.ycombinator.com/item?id=48756578) - 404 pts, 178 comments, 2026-07-02 [PARTIAL - listing metadata only via Algolia search; comment tree not fetched, and not load-bearing for any claim here]
- Research library: docs 2461, 2471, 2420, 2456 - read locally, every number resolved with `find` before citing [FULL]
