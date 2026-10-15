---
topic: agents
type: audit
status: research-complete
last-validated: 2026-10-14
related-docs: "2239, 2625, 2432, 2623, 2444, 2199, 601"
original-query: "please help me upgrade the zoe agent to be more of our always moving forward agent (Zaal, seat pane, 2026-10-14 20:00 EDT). Lane brief: (a) what ZOE already does that moves things forward on its own, with file:line; (b) what the seat did by hand today that ZOE should do (morning WAITING ON YOU push at 5:15 AM with buttons; one gated question at a time, re-ranked after each answer; auto-proceed logging; the queue item picker; evening cutoff); (c) the gap list, each marked EXTEND <file> or NEW; (d) a 3-PR plan, smallest first, each flag-gated and reversible; (e) what NOT to build."
tier: STANDARD
---

# 2679 - ZOE as the always-forward agent

> **Goal:** Say, from the code on main at cd27b3918 (2026-10-14), which of the seat's hand-run "keep Zaal moving" practices ZOE already does, which it does not, and the three smallest flag-gated PRs that close the gap without a new bot, automatic points, or anything outbound without his tap.

Written Wed 14 Oct 2026, 20:0x to 21:xx EDT (clock from `date`), by the "5 queue" lane while Zaal is off for the night. Every file:line below was read this run from `bot/src/zoe/` in a worktree at cd27b3918. The VPS was not touched; flag states are quoted from doc 2239's 2026-10-07 and 2026-10-09 reads and marked UNKNOWN where that read predates a merge.

## Key Decisions

| Decision | Call | Why |
|---|---|---|
| Build a new "forward agent" | **NO** | The behaviours asked for are four scheduled jobs and two button flows that exist in `bot/src/zoe/` today (section 1). The missing pieces are three small extensions. A new bot is on the decommissioned list (`research/agents/601-agent-stack-cleanup-decision/`, CLAUDE.md "no new bots without doc"). |
| PR 1, tonight | **USE: scheduled first Waiting-on-Zaal card** | `/grill` already sends the seat's first waiting item with A/B/C buttons (`index.ts:650-665`), but only when he types `/grill` or taps an answer. A cron under `ZOE_WAITING_PUSH=1` at a Zaal-clock time sends that same card by itself. About 60 lines, two files, flag default OFF. Opened as the PR named in Next Actions. |
| PR 2 | **USE: gated-or-not sort before his DM** | Nothing in `bot/src/zoe/` decides whether a card is Zaal-gated (money, public, irreversible, his fact, settings) or auto-proceedable: a grep of the directory for `auto-proceed` on 2026-10-14 found 0 files, and doc 2625 row R1 names the same gap. Extend `grill-queue.ts` (the "second destination" that already spools cards for the grill lane) so a non-gated card goes there with a logged default and never to his phone. |
| PR 3 | **USE: tail question on every DM reply** | Zaal, 2026-10-14: a question at the bottom of every reply so waiting is never idle. ZOE answers a DM and stops (`index.ts` DM handler). Append the next open waiting card after the reply when one exists, under `ZOE_TAIL_QUESTION=1`. |
| Mac-side owing, not a bot PR | **The seat's page is stale** | The page ZOE reads for waiting items (`terminals-digest.ts:28`) was last written on the vault's origin/main at 2026-10-11 08:44 EDT by the stats lane whose loop stopped, and it carries neither the `Stamp:` line nor the `## Waiting on Zaal` table the parser needs (`terminals-digest.ts:61-71`). Until the seat writes that page again every morning push sends nothing. That is an orchestrator-seat job, logged in Next Actions. |
| What not to build | **SKIP** automatic points, a second grill, a lane opener on the VPS, any send without his tap | Section 5. |

## 1. What ZOE already does that moves things forward on its own

Read from the module headers (every file in `bot/src/zoe/` was listed and its first comment line read; 60-plus modules) and from the cron table in `scheduler.ts`, which registers 36 `cron.schedule` calls (grep count, 2026-10-14).

| Behaviour | Where | Cadence and gate | State on the VPS |
|---|---|---|---|
| Morning brief to his DM | `scheduler.ts:317-325`, `brief.ts:1-16` | `0 5 * * *` America/New_York (moved off 09:00 UTC so the 1 Nov clock change does not drop it into the quiet window, comment at `scheduler.ts:305-315`); send class `morning` drains the deferred queue | live (doc 2239: 82 `[zoe/ran]` lines a day) |
| Needs-Zaal digest with buttons, recommended option first | `needs-zaal-digest.ts:1-9`, `:201` (`buildNeedsZaalButtons`), `scheduler.ts:1113-1143` | `0 8 * * *` and `0 20 * * *` America/New_York; class from `needsZaalSendClass()` | scheduled unconditionally |
| One board card at a time, advancing on answer, never repeating inside a cooldown | `grill.ts:1-16` (design), `:411-446` (`pickNext`), `:236` (`askCooldownMs`), `:367-408` (`toQueue` rebuilt each tick, sorted by priority) | `0 10-23,0,1 * * *` UTC, class `gated` (`scheduler.ts:783-805`) | live; re-ask ladder `ZOE_GRILL_BACKOFF` (`grill.ts:244-257`) and 30-day expiry `ZOE_GRILL_EXPIRE` (`:271-295`) default off |
| Lettered options, recommendation first | `grill.ts:447-461` (`ZOE_GRILL_ABCD`) | per card | flag not in doc 2239's 2026-10-07 ON list: UNKNOWN |
| The seat's Waiting-on-Zaal items, one card each, A/B/C or Done/Skip/Type buttons, answer written verbatim for the seat | `terminal-grill.ts:1-25` (header), `:104-106` (`nextTerminalItem`), `:109-123` (`formatTerminalCard`), `:132` (`recordTerminalAnswer`); `index.ts:650-665` (`sendNextTerminalItem`), `:810-841` (tap handler), `:845-847` (`/grill` tries terminal items first) | on `/grill` and after each answer only; `ZOE_GRILL_TERMINALS=1` | flag not in the 2026-10-07 ON list: UNKNOWN |
| Re-read the page on every tap, so the seat's re-ranking is honoured | `index.ts:818` (`parseTerminalsPage` of a fresh read inside the tap handler), `index.ts:670-673` (`advanceAfterTerminalAnswer`) | per tap | same flag |
| Terminals digest, wants-from-you first | `terminals-digest.ts:91` (`formatTerminalsDigest`), `:183-200` (`sendTerminalsDigest`), `scheduler.ts:866-897` | `ZOE_TERMINALS_DIGEST=1` plus `ZOE_TERMINALS_DIGEST_CRON` (UTC); text only, no buttons | UNKNOWN |
| Nothing reaches him at night | `quiet-window.ts:68-73` (`ZOE_QUIET`, 20:30 to 04:45 America/New_York), `:105-118` (`inQuietWindow`, `shouldHold`), `:194` (`holdSend`), release tick `scheduler.ts:1955` every 5 min | every send, held with its buttons, released oldest first | merged #3890 on 2026-10-10, after the 10-07 read: UNKNOWN |
| One gate on every outbound send, daily cap, class budgets | `send-budget.ts:1-30` (4,709 messages against 12 replies in August 2026; wraps `bot.api.sendMessage` once at boot) | every send | `ZOE_STATUS_HOLD=1` measured 2026-10-09 (doc 2239) |
| Speak only the single best candidate per tick, self-throttle when unacked | `proactive.ts:1-27` (`pickBest`, `passesThreshold`, unacked self-throttle) | reasoning tick | threshold file |
| What he taps, learned; status items held as counts | `attention.ts:1-20` (`ZOE_ATTENTION`) | digest | UNKNOWN |
| Close the loop on an answer: "Done (qid): what changed", and list answers older than 6h with no outcome | `answer-loop.ts:14-24`, `:211` (`runAnswerLoopTick`), `scheduler.ts:1979` every 10 min | `ZOE_ANSWER_LOOP=1` | UNKNOWN |
| Resend only CRITICAL pings he has not acked | `escalation.ts:1-11`, `scheduler.ts:899` every 30 min | one resend | scheduled |
| Every ZAAL BOTZ topic always has one open tappable move, refilled when cleared | `always-open-topics.ts:1-21`, `:238` (`ZOE_ALWAYS_OPEN`) | orchestrator tick | UNKNOWN |
| Drip the board backlog, five fixed verdicts by number | `backlog-grill.ts:1-30` (`ZOE_GRILL_DAILY_BATCH`, `ZOE_GRILL_MAX_OUTSTANDING`) | `*/2` cron | doc 2432 ruled KILL as a stream |
| Work the research queue itself, PR only, daily cap | `work-loop.ts:1-17` (`ZOE_WORKLOOP_DAILY`, default 6; empty queue = zero spend) | tick | ran once in 7 days (doc 2239) |
| Route a card into the grill lane's queue so it is worked while he sleeps | `grill-queue.ts:1-30` (`appendGrillQueue`, spool on the VPS, append on the Mac) | per card | spool path |
| Answer the last question by just typing | `pending-answers.ts:1-17`, `:22` (`armPendingAnswer`) | General topic | in memory |
| Two-tap sleep and energy check-in | `sleep-checkin.ts:1-9`, `scheduler.ts:843-863` (`ZOE_SLEEP_CHECKIN`) | every 5 min, per-weekday table | shipped 2026-10-10 |

Pattern credit: the "reply NO_REPLY when nothing needs attention" rule in `attention.ts` is adapted from openclaw's heartbeat doc (fetched raw this run, line 100: "If nothing needs attention, reply NO_REPLY"), and the follow-up-with-priority pattern from elizaOS; both MIT, credited in the module header.

## 2. What the seat did by hand on 2026-10-14 that ZOE should do

The seat's practices were read from the memory notes written that day (decide-more-ask-less; five visible lanes with slot 5 as the queue; always end with a grill question; friction is the highest priority; the always-on queue). Each is matched to the code above.

| Seat practice | ZOE today | Verdict |
|---|---|---|
| Morning WAITING ON YOU push at 5:15 AM, one card with buttons | The 05:00 brief has no cards (`brief.ts:8-16` lists priorities, commits, PRs). The 08:00 digest has buttons but is a list, three hours after he leaves the house at 5:20. The first waiting card exists (`index.ts:650-665`) but nothing schedules it. | **Gap, small.** PR 1. |
| One gated question at a time, the pick first, re-ranked after each answer | Board cards: yes (`grill.ts:411-446`, queue rebuilt and sorted each tick). Seat items: yes, page order, re-read on each tap (`index.ts:818`). Pick first: depends on the seat writing option A as the recommendation, which `parseItemOptions` preserves (`terminal-grill.ts:49`). | Exists. The input contract is the page. |
| Only gated questions reach him; the rest auto-proceed with a logged default | No module classifies gated vs not. Grep of `bot/src/zoe` for `auto-proceed`, 2026-10-14: 0 files. `grill-queue.ts` can carry the non-gated ones but nothing sorts into it. Doc 2625 row R1 names this as the first release. | **Gap.** PR 2. |
| The queue slot: always working the next waiting item | On the Mac this is a lane. On the VPS `work-loop.ts` does it for research only (header lines 9-11: multi-step and code plans bounce back to Zaal). Opening a Mac lane from the phone is doc 2625 R6 / D1, a design decision he has not ruled on. | Exists for research. Lane opening: NEW, gated on D1, not in this plan. |
| Evening cutoff at 20:30, nothing after | `quiet-window.ts:72-73` defaults 20:30 to 04:45 Eastern, every send held with buttons, released after. | Exists. Flag state UNKNOWN (merged 2026-10-10, measured never). |
| Every reply ends with the next open gated question | The DM handler answers and stops. `always-open-topics.ts` keeps one open move per group topic, not in the DM. | **Gap.** PR 3. |
| A note of what each answer changed | `answer-loop.ts` does this for `answers.jsonl` questions. Seat-item answers land in `terminal-answers.jsonl` (`terminal-grill.ts:41`) and the seat reads them by `ssh`; no outcome path. | Gap, deferred: needs the seat to write outcomes first. |

## 3. Gap list

| # | Gap | EXTEND or NEW | Size |
|---|---|---|---|
| G1 | Scheduled first waiting card at a Zaal-clock time | EXTEND `terminal-grill.ts` (move the card sender out of `index.ts:650-665` so `scheduler.ts` can call it), EXTEND `scheduler.ts` (one cron, flag plus cron expression, America/New_York, class `gated`) | ~60 lines + tests |
| G2 | Gated-or-not sort with a logged default | EXTEND `grill-queue.ts` (classifier + spool line "auto-proceeded: <default>, override anytime"), EXTEND `grill.ts` `toQueue` to skip non-gated when `ZOE_GRILL_GATE_SORT=1` | ~120 lines + tests; the word list is the sorted-questions rule: money, public or outbound, irreversible, a fact only he knows, settings |
| G3 | Tail question on every DM reply | EXTEND the DM reply path in `index.ts` to call the G1 sender after a reply when `ZOE_TAIL_QUESTION=1`; cooldown so one reply does not re-send the same card | ~40 lines + a test on the pure guard |
| G4 | Seat-item answers get an outcome reply | EXTEND `answer-loop.ts` to read `terminal-answers.jsonl` and a `terminal-outcomes.jsonl` the seat writes | after the seat writes outcomes |
| G5 | The seat's page is stale and in the wrong shape | NOT a bot change. The page on vault origin/main is dated 2026-10-11 08:44 EDT, 26 lines, one `#` heading, no `Stamp:` line, no `## Waiting on Zaal` table (read with `git show origin/main:` this run). The Mac side owes a page in the shape `terminals-digest.ts:61-71` parses, written every tick of the seat. | seat/stats lane |
| G6 | Open a lane from the phone | NEW module, gated on doc 2625 D1 | not in this plan |

## 4. The 3-PR plan, smallest first

| PR | Flag | What it does | Reversible how | Verify |
|---|---|---|---|---|
| 1. Scheduled waiting card | `ZOE_WAITING_PUSH=1` and `ZOE_WAITING_PUSH_CRON` (recommended `15 5 * * *`, zone America/New_York; the scheduler already passes `{ timezone: 'America/New_York' }` at `scheduler.ts:1107`) | At the cron, if the grill is not paused and `ZOE_GRILL_TERMINALS=1`, send the first unanswered seat item with its buttons. Empty page = no message (the NO_REPLY rule). Class `gated`. The quiet window ends 04:45, so 05:15 clears it. | unset the flag; no state file is added, the existing `terminal-grill` state is reused | `tsc --noEmit` 0, `vitest run` green, esbuild bundle, a unit test on the pure sender with an injected page reader: off, paused, empty, sent, failed |
| 2. Gate sort | `ZOE_GRILL_GATE_SORT=1` | Before a card reaches his DM, classify it: gated words or a `needs: zaal` marker keep it; everything else is spooled to the grill-queue with the recommended option as the logged default. One line per auto-proceeded card in the spool, so the grill lane and he can override. | unset the flag; spooled lines are append-only | tests on the classifier with the seat's own 2026-10-14 items as fixtures; a count of cards per day before and after, reported |
| 3. Tail question | `ZOE_TAIL_QUESTION=1` | After any DM reply from the concierge, append the PR 1 card if one is open and was not sent in the last N minutes. | unset the flag | tests on the cooldown guard; manual DM check by Zaal |

Order: 1 then 3 then 2. PR 2 is the one with judgment in it (what counts as gated) and deserves his read of the word list before it runs; 1 and 3 only move existing cards.

## 5. What NOT to build

- No new bot, no second grill, no "ZOE 2" (decommissioned list, CLAUDE.md). Everything above is a scheduler entry or a button path in the existing `@zaoclaw_bot` process.
- No automatic points. ZABAL board points are his judgment, tapped in `/award`; nothing here touches points.
- Nothing outbound without his tap: PR 1 to 3 send only to his own DM. Drafts stay drafts (`always-open-topics.ts:17-19`, `drafts.ts`, `outbox.ts`).
- No new pings. PR 1 is one card a day at most; PR 3 is a card attached to a reply he asked for. Doc 2432's rule (one interrupt class, one digest) stands, and `send-budget.ts` still gates every send.
- No lane opener on the VPS until D1 is ruled (doc 2625).
- No reaper or timer that guesses an answer. A card he does not answer waits; `ZOE_GRILL_EXPIRE` is the only expiry and it is his to switch on.

## 6. Numbers

| Measure | Value | Surface |
|---|---|---|
| Modules in `bot/src/zoe/` with a header read | 60-plus `.ts` files (174 directory entries including tests and subfolders) | `ls`, `head -8` per file, 2026-10-14 |
| `cron.schedule` calls in `scheduler.ts` | 36 | grep, 2026-10-14 |
| `ZOE_*` flag names read by the code vs set on the VPS | 57 vs 20 | doc 2239, 2026-10-07 |
| ZOE sends vs Zaal replies, August 2026 | 4,709 vs 12 | `send-budget.ts:5-8` |
| Quiet window | 20:30 to 04:45 America/New_York | `quiet-window.ts:72-73` |
| Needs-Zaal digests | 08:00 and 20:00 America/New_York | `scheduler.ts:1116, 1146` |
| Morning brief | 05:00 America/New_York | `scheduler.ts:318` |
| Seat page last written on vault origin/main | 2026-10-11 08:44 EDT, 26 lines | `git show origin/main:<page>`, 2026-10-14 |
| node-cron pinned | `^3.0.3` | `bot/package.json:29` |

## Also See

- [Doc 2239](../2239-zoe-capability-map/) - the living capability map; read before claiming anything is missing.
- [Doc 2625](../2625-zoe-main-point-of-contact-design/) - releases R1 to R7; R1 is this doc's PR 2.
- [Doc 2432](../2432-zoe-telegram-interrupt-rule/) - one interrupt, one digest; the volume rule every PR here respects.
- [Doc 2623](../2623-zaal-manual-task-handoff-map/) - the manual tasks the releases came from.
- [Doc 2444](../2444-always-on-orchestrator/) - the Mac-side always-on seat this doc mirrors into ZOE.
- [Doc 601](../601-agent-stack-cleanup-decision/) - no new bots.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| PR 1: scheduled first waiting card (`ZOE_WAITING_PUSH`), flag OFF, hold label until the seat page is in shape | 5 queue lane | PR | opened 2026-10-14, see the lane report |
| Seat writes the terminals page in the parsed shape (`Stamp:` line, `## Waiting on Zaal` table) on every tick | orchestrator seat | Mac lane | before PR 1's flag is set |
| Flip `ZOE_GRILL_TERMINALS`, `ZOE_WAITING_PUSH`, `ZOE_WAITING_PUSH_CRON` on the VPS | Zaal (settings) | gated tap | after the page is fresh |
| PR 3: tail question on DM replies (`ZOE_TAIL_QUESTION`) | ZOE lane | PR | after PR 1 merges |
| PR 2: gate sort (`ZOE_GRILL_GATE_SORT`), word list to the grill first | ZOE lane | PR, then one grill question | after PR 3 |
| Measure flag state of `ZOE_QUIET`, `ZOE_GRILL_TERMINALS`, `ZOE_ANSWER_LOOP` on the VPS, names only | zoe-liveness run | read-only | next VPS read |

## Sources

- [FULL] `bot/src/zoe/` on ZAOOS main at cd27b3918, read in a worktree 2026-10-14: `scheduler.ts`, `terminal-grill.ts`, `terminals-digest.ts`, `index.ts` (lines 619-880, 2029-2055), `quiet-window.ts`, `needs-zaal-digest.ts`, `grill.ts`, `grill-queue.ts`, `backlog-grill.ts`, `answer-loop.ts`, `always-open-topics.ts`, `questions.ts`, `pending-answers.ts`, `proactive.ts`, `attention.ts`, `send-budget.ts`, `escalation.ts`, `work-loop.ts`, `sleep-checkin.ts`, `brief.ts`, `nudges.ts`, `companion.ts`, and the first comment line of every other module.
- [FULL] `research/agents/2239-zoe-capability-map/README.md` (flag tables, lines 24-92), `2625-zoe-main-point-of-contact-design/README.md` (release table, lines 110-124), `2432-zoe-telegram-interrupt-rule/README.md` (per-class table, lines 103-126). Numbers resolved with `zao-research-health --resolve`.
- [FULL] The seat's terminals page and BLACKBOARD on the vault's origin/main, read with `git show origin/main:` 2026-10-14 (page dated 2026-10-11 08:44 EDT; BLACKBOARD last commit 2026-10-14 06:11 EDT, its WAITING FOR ZAAL list built 2026-09-27).
- [FULL] [openclaw heartbeat doc](https://raw.githubusercontent.com/openclaw/openclaw/main/docs/gateway/heartbeat.md) - raw, 200, 40,884 bytes; line 100 carries the NO_REPLY rule `attention.ts` credits. Method: curl.
- [PARTIAL - README is for v4, the bot pins ^3.0.3] [node-cron README, "Timezones and DST"](https://raw.githubusercontent.com/node-cron/node-cron/master/README.md) - raw, 200: "Schedules match wall-clock time in the task's timezone". The zone claim this doc relies on rests on the repo's own `scheduler.ts:1107` usage, not on this README. Method: curl.
- [FULL] Community: [node-cron issue #124, "is there a list of the timezone names?"](https://github.com/node-cron/node-cron/issues/124) - 13 comments, found with `gh api search/issues` this run; the IANA name `America/New_York` used in `scheduler.ts` is the form that thread settles on. Method: GitHub REST.
- [FULL] [elizaOS/eliza](https://github.com/elizaOS/eliza) and [letta-ai/learning-sdk](https://github.com/letta-ai/learning-sdk) - 200 each, repo pages only; the pattern credits are `attention.ts:21-29`'s, not re-verified at file level here. Method: curl HEAD.
