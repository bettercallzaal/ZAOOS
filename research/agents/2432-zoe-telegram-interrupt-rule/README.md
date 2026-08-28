---
topic: agents
type: audit
status: research-complete
last-validated: 2026-08-28
superseded-by:
related-docs: "2366, 2226, 2239, 2349, 2371, 2282, 2420, 601"
original-query: "i also would like to improve the ZOE and the telegram messages we get please /zao-research and audit them and find the more efficient way to communicate (we have enough claude code lanes that we aren't watching anymore that you are, that we don't need to know when it's done, only this main terminal when it's stopped)"
tier: DEEP
---

# 2432 - ZOE and the Telegram messages: one interrupt, one digest, nothing else

> **Goal:** Audit every path that puts a message on Zaal's phone (ZOE's in-repo
> senders, the VPS crons, the Pi, and the orchestrator's own relays), measure each
> class from what is on disk, and write the rule Zaal stated on 2026-08-28: the
> orchestrator terminal watches the lanes now, so the only thing that reaches his
> phone is "the orchestrator is STOPPED and needs you" with the tap inline.
> Everything else goes to the daily page or nowhere.

## Key Decisions

| # | Decision | Why (measured) |
|---|---|---|
| 1 | **One interrupt class: the orchestrator terminal stopped on something only Zaal can do.** Carried by Claude Code's own push + Remote Control, which is already on (`agentPushNotifEnabled: true`, `remoteControlAtStartup: true` in `~/.claude/settings.json`). No new transport. | In the last 14 days of the export (2026-08-14 to 08-27) ZOE sent **3,696** messages and Zaal sent **1**. The class he answers is the one where a human is genuinely waiting on him; every scheduled class drew zero replies (854 messages over 151 days, twelve types, not one answer). |
| 2 | **One digest, at wake time, built from `~/zao-vault/handoffs/grill-next.md`.** The orchestrator already writes that file every AFK tick (16 items on 2026-08-28). Sending it once is a prompt plus a `curl`, not a feature. | Zaal's own cadence instruction (2026-04-05): "give me updates 6-12 hours ... 1 at a time so it's not a list". Delivered since then: 65/day. A digest is the only shape that satisfies the instruction and the volume. |
| 3 | **Kill the VPS cron senders by config before writing any budget code.** Seven `--tg` / `SEND=1` flags in `crontab -l` on the VPS are 9-10 DM messages a day with a measured reply rate of 0.00%. Removing the flags is a Zaal edit of seven lines. | Every UNMAPPED zero-reply type in the label file resolves to a `~/bin` script on the VPS crontab (table below). A budget inside the bot repo cannot reach them; a crontab edit reaches all of them at once. Glue-first rung 1 (platform-native) beats rung 5 (a Bot API proxy). |
| 4 | **The grill stops being a Telegram stream.** Cards go to a file the orchestrator consumes; ZOE keeps at most ONE open ask. Interim config: `ZOE_GRILL_MAX_OUTSTANDING=1` on the live box (it is 200). | Grill cards are 30.9% of everything ZOE has ever sent, 188-372 per day for ten straight days (08-17 to 08-26), answered 0.03% of the time. The built fix (`ws/zoe-send-budget`, commits `c1772bd6` one-batch-a-day and `4da99fe9` grill-queue file destination) is local, unpushed, not on main, not live. |
| 5 | **Ship the send budget that already exists, at a cap of 3.** `bot/src/zoe/send-budget.ts` (582 lines, +49 tests, 7 commits on `ws/zoe-send-budget` at `/private/tmp/wt-zoe-send-budget`) wraps `bot.api.sendMessage` once at boot and exempts alarms. It defaults to 20; Zaal said 2-4. | Doc 2366's contract was never made binding; a prompt ceiling was violated 22x for 143 days. The ceiling has to live in the sender. This one does and is unmerged. |
| 6 | **Breakage stays an interrupt, once, then quiet.** `fleet-spend-guard.sh` is already edge-triggered (a flag file, one message on the up->down transition). The 96 provider-limit messages in August came from repeats, not from the alarm class being wrong. | The ANSWER band (system errors 70%, failure reports up to 52%) is the only band Zaal reliably answers. Cutting it is the mistake the ZOE-CENTER lane caught in itself on 08-27. |

## The rule, on one page

**What reaches Zaal's phone (INTERRUPT):**

1. **The orchestrator terminal is stopped and needs him.** Concretely: Claude Code raised `permission_prompt`, `idle_prompt` or `agent_needs_input` in the orchestrator session, and the thing it is stopped on is a gate - a push, a send, a picker, money, a fact only he knows. The message names the tap and the tap happens in Remote Control. Nothing else in the fleet may raise this class.
2. **Breakage or money, on the transition only.** Spend cap hit, provider auth dead, a live bot down. First occurrence interrupts; repeats are suppressed for at least six hours (`fleet-brain-check.sh` already encodes this and nothing calls it).

**What goes to the daily page (DIGEST, once, at wake time):**

- The needs-Zaal list: every gate a lane raised while he was away, with the recommended option first (this is `grill-next.md`, which already exists).
- What shipped: PRs merged, docs landed, one line each.
- Fleet and cost: one line. Not a table, not a report.
- Social drafts awaiting a tap, as a count plus the single most time-sensitive one.
- Partner-bus messages that arrived (the `BUS from` relays), summarised.

**What is never sent:**

- A lane finished. A lane is idle. A lane self-healed. A loop restarted.
- A research deliverable (it is a PR or a board row; 998 of them drew 6 replies).
- Fleet health, fleet output, ecosystem watch, cost-of-pass, bot activity logs.
- Affirmations and routine reminders from the agent stack (Zaal's personal
  `routine.sh` lines are his own to keep or drop - they are not agent noise, but
  they are on the same DM at 08:35, 23:00 and 01:00 UTC).
- Anything already unread. Anything the sender already fixed.
- Anything between 22:00 and 07:00 ET that is not class 1 or 2.

**The one test** (from doc 2366, still correct): *can Zaal do something about this,
right now, that he could not do by looking at the daily page later?* If no, it is
not a message.

## The measurement

### The export (the recipient's view)

Source: the ZOE personal-chat export, 10,142 messages 2026-03-28 to 2026-08-27,
converted to `~/.zao/telegram-exports/zoe/result.json` by
`scripts/telegram-html-to-json.py`. Whole record: **9,627 from ZOE, 515 from Zaal**.
The last fourteen days, counted from the same file on 2026-08-28:

| Day | ZOE sent | Zaal sent | Largest class |
|---|--:|--:|---|
| 08-14 | 115 | 0 | watchdog/restart 65 |
| 08-15 | 90 | 0 | grill card 40 |
| 08-16 | 91 | 0 | grill card 40 |
| 08-17 | 263 | 1 | grill card 213 |
| 08-18 | 421 | 0 | grill card 372 |
| 08-19 | 374 | 0 | grill card 334 |
| 08-20 | 336 | 0 | grill card 278 |
| 08-21 | 378 | 0 | grill card 307 |
| 08-22 | 344 | 0 | grill card 276 |
| 08-23 | 235 | 0 | grill card 188 |
| 08-24 | 333 | 0 | grill card 292 |
| 08-25 | 339 | 0 | grill card 297 |
| 08-26 | 351 | 0 | grill card 298 |
| 08-27 | 26 | 0 | grill card 13 (export ends mid-morning) |
| **14 days** | **3,696** | **1** | |

- **3,696 to 1.** The analysis lane's August figure was 392:1; the last two weeks are worse.
- Hour histogram over those 14 days: **292 messages in the 06:00 hour** (the wake-time cron cluster - affirmation, fleet health, grill batch start), a flat 160-240 per hour from 07:00 to 21:00, and 203 (5.5%) between 22:00 and 06:00. The grill runs 06:00-21:59, which is why the night share fell from the 21% measured over 151 days.
- The residual "other" bucket in the last seven days is mostly ZOL drafts (27, "post it or skip - NOT auto-posted"), ZOL post failures (8), and research headers re-sent three times each (SEO research x13 topics, YT research x12 topics, three repo/site audits) - the 10.2% verbatim-repeat finding, still running.

### The senders (the emitter's view)

Twenty distinct sources put messages on the phone. Nine of the twelve zero-reply
types were UNMAPPED in `zorca/docs/zoe-send-site-labels.md` because their literals
are not in the bot repo. They are all in `~/bin` on the VPS (`31.97.148.88`,
reachable by `ssh vps` on 2026-08-28), which is a git repo with 8 uncommitted
files. `crontab -l` has 19 active lines; the ones that send are:

| Class (label file) | N, 151d | Reply | Emitter (verified 2026-08-28) | Target | Verdict | How |
|---|--:|--:|---|---|---|---|
| grill decision card | 2,977 | 0.03% | `bot/src/zoe/backlog-grill-runner.ts`, `*/2` cron in `scheduler.ts` (live, main) | DM | **KILL** as a stream | `ZOE_GRILL_MAX_OUTSTANDING=1` today (config); ship `c1772bd6` + `4da99fe9` (file destination, one batch a day) |
| idle-session nag | 1,144 | 1.6% | migrated into the grill card in Aug (13 left) | DM | already gone | none |
| research deliverable | 998 | 0.6% | ZOE research pipeline, `0 */2` cron in `scheduler.ts` | DM | **KILL** from chat | it is a PR or a board row; 18.5% were auth failures wearing a research header - fix the header, route the failure to the alarm class |
| social draft approval | 740 | 2.2% | `posts/fractal-promo.ts` (15:00), `posts/drafters.ts` | DM | **BATCH** | count + the one time-sensitive draft in the digest; the tap is still Zaal's |
| watchdog/restart | 266 | 0.0% | `loop-watchdog.py` - **no longer in crontab**; last log line 2026-08-23 | DM | done (doc 2366) | none |
| provider limit / credits | 99 | 0.0% | `fleet-spend-guard.sh` `*/20` (edge-triggered, flag file); `fleet-brain-check.sh` has no cron and no caller | DM | **KEEP**, first occurrence only | already edge-triggered; the 96 August repeats came from `loop-agent.sh` "hit your weekly limit" text riding research headers |
| build-candidate approval | 129 | 0.0% | `zao-escalate` on the VPS (129 in ten hours on 08-04); `~/.zao/escalation.pause` exists = paused | DM | **KILL** stream | candidates are board rows; the pause file is the kill switch, keep it |
| fleet report (x3) | 103 | 0.0% | `fleet-health.sh` 10:00 UTC, `fleet --tg` 12:45 UTC, `loops-report.sh --tg` 12:00 UTC | DM | **BATCH** to one line | crontab: drop `--tg` from three lines (config) |
| ecosystem watch | 60 | 0.0% | UNMAPPED - `grep "open PRs total"` in VPS `~/bin` hits only the `claude` and `gh` wrappers; not in the last-14-day sample | DM | **KILL** | whichever emitter it is, it is silent now; if it returns, it is a digest line |
| affirmation prose | 48 | 0.0% | `affirmation.sh forward --tg` 10:00 UTC, `night --tg` 03:00 UTC, reading `~/.zao/private/affirmations.md` | DM | **KILL** `--tg` | crontab: two lines (config). Zaal's call - they are his words, but 48 sends, 0 replies |
| ritual nudge | 62 | 1.6% | `routine.sh morning` 08:35 UTC, `dinner` 23:00 Mon-Fri, `winddown` 01:00 Tue-Sat | DM | Zaal's tap | not agent noise; keep or drop is personal |
| cost report | 24 | 0.0% | `cost-of-pass-summary.sh --tg` 08:35 UTC | DM | **BATCH** to one line | crontab: drop `--tg` (config) |
| agent-bus relay | 75 | 0.0% | `bus-poll-run.sh` hourly at :17 -> `bus-poll.py`, `TG_CHAT_ID` mapped to Zaal's DM | DM | **BATCH** | summarise in the digest; a partner asking a gate question goes through the orchestrator as class 1 |
| stall/stale nag | 22 | 4.5% | `stall-tripwire.py` `SEND=1` 13:00 UTC | DM | **BATCH** | crontab: drop `SEND=1` (config) |
| usage tip / daily agent tip | 219 | 4.6% | `zao-daily-agent-tip.sh` 12:00 UTC -> ZAAL BOTZ group | group | **KILL** | crontab line (config) |
| cockpit brief (morning sweep) | 5 | 0.0% | `zao-morning-sweep.sh` 08:30 UTC, `cd ~/zao-os/bot` - log file 0 bytes since 2026-07-12, path probably stale | group | **KILL** | dead by the evidence; confirm by running it once |
| scheduled brief | 128 | 2.3% | `brief.ts` 09:00 UTC | DM | **BATCH** = becomes the digest carrier | one message a day is right; its content changes to grill-next |
| evening reflection | 104 | 6.7% | `reflect.ts` 01:00 UTC | DM | **KILL** or fold into the next morning | 6.7% is the best broadcast rate, still 93% unanswered |
| teammate mention relay | 84 | 1.2% | `task-mention-notify.ts` (a person @mentioned Zaal) | DM | **KEEP** in the digest, interrupt only when due today | a human waiting is a real ask; most are not urgent |
| nudge-ladder re-pings | in the ask band | - | `orchestrator-tick.ts` `runNudgePing`, `*/30` + `*/2` crons, `ZOE_NUDGE_LADDER=1` live | DM | **KEEP** only for class 1/2 asks | the ladder is the right engine for a gate; gate what may enter it |
| pinned brief | 0 msgs | - | `pinned-brief-runner.ts` `*/5`, edits one message in place | DM (pinned) | **KEEP** | this is the pull surface; it costs no notification |
| handoffs surface | - | - | `scheduler.ts` `*/10` -> Handoffs topic (thread 13) | group | **KEEP** | group feed, pull only |
| ZOL draft / ZOL followed | 35 in 7d / 42 | 0.0% | the Pi (`ssh pi` did not resolve on 2026-08-28 - UNVERIFIED which unit) | DM | **BATCH** | count in the digest; the post/skip tap is Zaal's |
| conversational answer, capture ack, work report | 1,084 | 21-39% | ZOE replying to something Zaal typed | DM | **KEEP** | the only band that works; it is a reply, not a send |

**What the table changes about the earlier diagnosis.** The 08-27 note argued a
recipient-keyed budget "inside a local Bot API proxy every emitter points at" was
needed because the crons never enter the bot process. That is true and unnecessary:
every one of those crons is a line in one file, and the `--tg` flag is the whole
send. Seven crontab edits remove ten daily messages with zero code and zero risk.
The proxy would be rung 5 of the glue ladder for a rung 1 problem.

### The orchestrator's own transport this week

The rule Zaal stated is about the orchestrator terminal, so its relay volume is
part of the audit:

- `~/zao-vault/daily/2026-08-27.md` (903 lines) logs seven triage ticks with
  "Drafts: N triaged - k relayed": 5, 5, 6, 5, 4, 2, 2 = **29 lane messages
  hand-relayed to Zaal in one day**, plus 10-13 dropped per tick.
- `~/.zao/zoe-loop/OUTBOX.md` holds 2 lines from the ZOE-loop lane; `FEEDBACK.md`
  (123 lines) was still waiting on a reply on 08-27.
- `~/zao-vault/handoffs/GRILL-QUEUE.md` is 584 lines; `GRILL-DONE.md` records
  four batches on 08-26/27; `grill-next.md` (27 lines, 16 numbered items, built
  05:5x on 08-28) is exactly the digest this doc proposes - it already exists,
  it is just not sent.
- The 08-28 daily note, 07:2x: Zaal came back with Remote Control reconnected
  and said the rule. That is the transport working: he was reachable through
  the Claude app, not through a Telegram stream.

### What is built, pushed, and live (state, with sources)

| Thing | Built | Pushed | On main | Live on VPS | Source |
|---|---|---|---|---|---|
| Send budget (`send-budget.ts`, cap `ZOE_DAILY_SEND_CAP` default 20, `ZOE_NOISE_SHARE` 0.25, `ZOE_SEND_BUDGET=off` kill) | yes, 7 commits | **no** - `git branch -r` shows no `origin/ws/zoe-send-budget` | no | no - `ls ~/zao-bot-live/bot/src/zoe/send-budget.ts` fails | `/private/tmp/wt-zoe-send-budget`, HEAD `5b01ca32` |
| Grill one batch a day (`c1772bd6`) + grill-queue file destination (`4da99fe9`) | yes | no | no | no | same branch |
| Doc 2366 watchdog fix | yes | yes | yes | yes - `loop-watchdog.py` absent from crontab, log ends 08-23 | VPS `crontab -l` |
| Live bot | - | - | main `56350752` (2026-08-28 11:11 UTC) | yes, `zoe-autodeploy.sh` every 10 min | `git -C ~/zao-bot-live log -1` |
| Claude Code push to phone | - | - | - | on: `agentPushNotifEnabled: true`, `remoteControlAtStartup: true` | `~/.claude/settings.json` |
| Notification hook -> Telegram mirror | yes | yes (dotfiles) | - | on, **for every notification type** (matcher unset) | `~/bin/zao-notify.sh`, settings `hooks.Notification` |

## Outside view (fetched raw, 2026-08-28)

**Claude Code has the interrupt class built in, and it is the one Zaal described.**
The Remote Control page: "Claude decides when to push. It typically sends one when
a long-running task finishes or when it needs a decision from you to continue ...
run `/config` and enable *Push when Claude decides* for proactive notifications,
*Push when actions required* for permission prompts and questions, or both." The
`PushNotification` tool's own contract: "err toward not sending one ... When the
user is actively at the terminal, your output already reaches them - a
notification on top of it would be a duplicate, so the tool skips it." The hooks
page lists the `Notification` matcher values - `permission_prompt`, `idle_prompt`,
`agent_needs_input`, `agent_completed` among others - and says "Notification hooks
are intended for side effects such as forwarding the notification to an external
service"; `permission_prompt` fires "only after the prompt has waited about six
seconds." So: the orchestrator's stop is a native event, the phone push is native,
and the Telegram mirror is a matcher away from being scoped to exactly the three
types the rule names.

**Every mature agent framework models the human as an interrupt, not a feed.**
OpenAI Agents SDK: "pause agent execution until a person approves or rejects
sensitive tool calls. Tools declare when they need approval, run results surface
pending approvals as interruptions, and RunState lets you serialize paused runs
and resume them"; approval rules "fail closed" on malformed arguments. LangGraph:
"When an interrupt is triggered, LangGraph saves the graph state using its
persistence layer and waits indefinitely until you resume execution" with
`Command(resume=...)`. Anthropic's Building Effective Agents: "Agents can then
pause for human feedback at checkpoints or when encountering blockers." None of
them has a concept of "tell the human a step finished." The unit is the paused
run and its resume value - which is what `grill-next.md` rows with a recommended
option are.

**Telegram supports the quiet shapes.** Inline keyboards: "pressing buttons on
inline keyboards doesn't send messages to the chat." The Bot API carries
`disable_notification` (26 occurrences on the reference page), `pinChatMessage`,
`editMessageText`, and `message_thread_id`. ZOE already uses all four
(`pinned-brief.ts` edits one pinned message every 5 minutes without a sound;
`telegram-routing.ts` threads status into topics). The primitives for a
silent, pull-first surface are in use; they are outnumbered by the loud ones.

**The community answer to alert fatigue is to turn it all off.** HN 44328373
(20 points, 65 comments, 2025-06-20, on a Guardian study of news-alert fatigue):
"I have disabled absolutely everything my phone will let me disable. I allow only
my own calendar/reminders, and messages from people in my contact list"
(SoftTalker); "Any breaking news that is urgent enough for an alert happens to
also be something a friend would text me about" (BuyMyBitcoins). That second line
is the rule in one sentence: a real interrupt is a person waiting, and a person
waiting is the orchestrator with a gate.

**Glue-check on the two repos cited as references** (neither is adopted; the
answer is rung 1, platform-native): `openai/openai-agents-python` - LICENSE file
MIT, last push 2026-08-28, 100 commits in 180 days, 29,030 stars.
`langchain-ai/langgraph` - LICENSE file MIT, last push 2026-08-28, 40,609 stars,
722 open issues. Both alive; both irrelevant to the fix, which needs no framework.

**Not found:** "Orca Mobile" appears nowhere in `~/zao-vault/{notes,handoffs,daily}`
or `~/Documents/zorca` except the brief that named it; UNVERIFIED as a surface.
The OpenClaw retirement lives in CLAUDE.md (decommissioned 2026-05-04, "source of
the '·' pings") and `notes/adoption-candidates.md` ("retired once - record why
before re-trying") - the pings were the reason, which is this doc's subject.

## The mechanics, glue-first

Ladder from `~/zao-vault/notes/glue-first-standard.md`: 1 platform-native, 2
existing OSS configured, 3 skill/prompt/config, 4 thin adapter, 5 new code.

**Rung 1 - the interrupt (changes nothing but config, Zaal's taps):**

1. In a **fresh** session (the settings lost-update bug, `project_settings_lost_update`),
   narrow the `Notification` hook matcher in `~/.claude/settings.json` from unset
   to `permission_prompt|idle_prompt|agent_needs_input`, so `zao-notify.sh` mirrors
   only a stop that needs him, not `auth_success` or `agent_completed`. Commit
   dotfiles immediately.
2. Leave `agentPushNotifEnabled` and `remoteControlAtStartup` as they are (true).
   The Claude app is the tap surface; the push carries the session name.
3. Every non-orchestrator lane already runs with `--setup skip` and no push. Keep
   it that way: the Notification hook fires per session, so the matcher alone
   does not scope it to the orchestrator. `zao-notify.sh` reads
   `CLAUDE_PROJECT_DIR`; a one-line guard (`[ "$(basename "$CLAUDE_PROJECT_DIR")" = "<the orchestrator's dir>" ] || exit 0`)
   before the Telegram mirror makes the rule literal. That is rung 4 at its
   smallest: one line in a file that is already git-tracked.

**Rung 1 - the VPS crons (config, Zaal's `crontab -e`, seven lines):**

```
0 10 * * *  fleet-health.sh                -> keep the file write, drop the send (or delete)
45 12 * * * fleet --tg                     -> fleet
0 12 * * *  loops-report.sh --tg           -> loops-report.sh
35 8 * * *  cost-of-pass-summary.sh --tg   -> cost-of-pass-summary.sh
0 10 * * *  affirmation.sh forward --tg    -> delete or drop --tg
0 3 * * *   affirmation.sh night --tg      -> delete or drop --tg
0 13 * * *  SEND=1 STALL_DAYS=3 stall-tripwire.py -> drop SEND=1
```

Also `zao-daily-agent-tip.sh` (group, 0 replies) and `zao-morning-sweep.sh`
(log empty since July, path likely stale) are deletions. `fleet-spend-guard.sh`
stays exactly as it is - it is the alarm class and already edge-triggered.
`bus-poll-run.sh` stays but its output belongs in the digest (rung 3 below).
`~/bin` on the VPS is a git repo with 8 dirty files: commit the crontab as a
file next to them so the edit is recoverable (`vanishing-dependencies.md`).

**Rung 3 - the digest (a prompt, not code):**

The orchestrator's AFK tick already builds `grill-next.md`. Add one step to the
tick's instructions: at the wake-time tick, send the file's numbered items as
ONE Telegram message to Zaal's DM with the recommended option first on each line,
using the mirror path `zao-notify.sh` already has. No ZOE change. The VPS has no
vault clone (UNVERIFIED - not checked because the Mac side is enough), so the
send is Mac-side. If ZOE's `brief.ts` is to carry it instead, that is a later
swap of content, not of cadence.

**Rung 5, already written - the ZOE changes, sized:**

| Change | Size | Where | Flag / gate |
|---|---|---|---|
| Push `ws/zoe-send-budget`, open the PR, review, merge; set `ZOE_DAILY_SEND_CAP=3` on the live box (Zaal's stated 2-4/day). Alarms are exempt by class; `ZOE_SEND_BUDGET=off` is the kill switch; it fails open on a broken state file. | **S** to ship (built, +49 tests, tsc 0, biome clean per the branch's own log) - **M** to review (2,137 insertions across 12 files) | `bot/src/zoe/send-budget.ts`, `scheduler.ts`, `index.ts`, `relay-bridge.ts` | `ZOE_DAILY_SEND_CAP`, `ZOE_NOISE_SHARE`, `ZOE_SEND_BUDGET` |
| Grill cards to the file the orchestrator consumes, one batch a day | **M**, on the same branch | `backlog-grill-runner.ts` (+81), `backlog-grill.ts` (+42), `grill-queue.ts` (185 new) | interim `ZOE_GRILL_MAX_OUTSTANDING=1` needs no deploy |
| Research pipeline stops DM-ing deliverables; a failed run reports as an alarm, once, not as a deliverable | **S** | the `0 */2` research cron in `scheduler.ts` and its reporter | route `kind:'status'` to the Research thread (thread 8 is configured) instead of the DM |
| Evening reflection off; morning brief carries the digest content | **S** | `scheduler.ts` `0 1 * * *` and `brief.ts` | a sentinel-skip is one line |
| Nudge ladder accepts only class 1/2 asks | **S** | `orchestrator-tick.ts` where `startNudge` is called | a kind check at the call site |
| A Bot API proxy with a recipient-keyed budget | **L** | - | **not needed** - the crontab edit removes the emitters the proxy was for |

**What this leaves untouched on purpose:** `pinned-brief-runner.ts` (silent
edit-in-place, the pull surface), the Handoffs topic surface, `task-mention-notify`
for a person waiting on him, and every ANSWER-band reply. The measured lesson
from 08-27 stands: cut the feed, leave breakage and answers alone.

## What this doc does not claim

- Reply rates are ceilings (one reply credits a whole burst); the ordering is the
  finding, per `zoe-analysis-2026-08-27.md`. This doc adds only the 14-day daily
  counts and the emitter map; it does not re-derive rates.
- The Pi's ZOL senders were not inspected (`ssh pi` did not resolve). The 35 ZOL
  lines in seven days are counted from the export, not from the Pi.
- The `ecosystem watch` emitter was not found on the VPS or in the repo. It is
  silent in the last-14-day sample; if it fires again, the digest is its home.
- Reddit was not fetched: the ladder is documented dead from this machine as of
  2026-08-14 (doc 2282) and the credential in doc 2273 does not exist yet.

## Also See

- [Doc 2366](../2366-agent-message-discipline/) - the 429-unread audit and the 3-tier contract; this doc makes tier 1 concrete (the orchestrator's stop) and measures the other two.
- [Doc 2226](../2226-tg-pinned-mission-control-spec/) - the pinned mission-control spec; `pinned-brief.ts` is its shipped half and the pull surface here.
- [Doc 2239](../2239-zoe-capability-map/) - the ZOE module map used for the inventory.
- [Doc 2349](../../infrastructure/2349-vps-loop-starvation/) - why the loops froze; the watchdog noise was its symptom.
- [Doc 2371](../../infrastructure/2371-fleet-output-audit/) - judge a loop by output, not liveness; same rule applied to messages. (Doc 2366 cites this as 2282; 2282 is the reddit doc below.)
- [Doc 2282](../../business/2282-reddit-as-oss-outreach-channel/) - why reddit is unreachable from this machine; the reason the community source here is HN, not reddit.
- [Doc 2420](../2420-zorca-gui-redesign/) - the dashboard as attention router; the digest is its phone-sized twin.
- `zorca/zoe-analysis-2026-08-27.md` and `zorca/docs/zoe-send-site-labels.md` (in `~/Documents/zorca`) - the 151-day classification and matchers this doc inherits.
- `.claude/rules/noisy-signal-guard.md`, `lane-autonomy.md`, `agent-spend.md` - the rules this operationalises.
- Tracker: task `Upgrade ZAAL BOTZ Telegram to full cockpit` (src orchestrator-drop:20260802, todo) - superseded in spirit; the cockpit is the pull surface, not the push.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Tap the rule: accept the INTERRUPT / DIGEST / NEVER page above as written, or amend; on acceptance it becomes `.claude/rules/phone-interrupt.md` (a lane writes it, a PR lands it) | @Zaal | Decision | 2026-08-29 |
| `crontab -e` on the VPS: the seven config lines above; commit `crontab -l` into `~/bin` on the VPS so the edit is git-held. Shipped = `crontab -l \| grep -c -- "--tg"` returns 0 | @Zaal | Config | 2026-08-29 |
| Set `ZOE_GRILL_MAX_OUTSTANDING=1` on the live box; restart `zoe-bot`. Shipped = the flag reads 1 and the 06:00-hour spike on 08-30 is under 20 | @Zaal | Config | 2026-08-29 |
| In a fresh session, narrow the `Notification` hook matcher to `permission_prompt\|idle_prompt\|agent_needs_input` and add the orchestrator-dir guard line to `zao-notify.sh`; commit dotfiles. Shipped = dotfiles commit exists | @Zaal | Config | 2026-08-29 |
| Push `ws/zoe-send-budget` from `/private/tmp/wt-zoe-send-budget`, open the PR with cap default lowered to 3, run the full suite. Shipped = PR open with the +49 test delta reproduced | @Zaal (ZOE-loop lane) | PR | 2026-08-31 |
| Add the wake-time digest send to the orchestrator AFK-tick instructions (grill-next.md -> one DM via the existing mirror). Shipped = one digest message on 08-31 morning, none other from the orchestrator that day | @Zaal (orchestrator) | Prompt | 2026-08-31 |
| Re-measure seven days after the crontab edit: export or `journalctl` count of DM sends per day; target under 5/day excluding replies. Shipped = a dated follow-through note appended here | @Zaal (a lane) | Verify | 2026-09-06 |
| Run `zao-morning-sweep.sh` once by hand; if the `~/zao-os/bot` path is gone, delete the cron line | @Zaal | Verify | 2026-08-29 |

## Sources

- [FULL - read on disk 2026-08-28] `~/Documents/zorca/zoe-analysis-2026-08-27.md` (the 151-day classification, 34 types, bands, reply-rate ceiling/floor) and `~/Documents/zorca/docs/zoe-send-site-labels.md` (171 lines, matchers per zero-reply type, UNMAPPED flags).
- [FULL - computed 2026-08-28] `~/.zao/telegram-exports/zoe/result.json`, 10,142 messages; per-day and per-hour counts in this doc are from a python pass over that file using the label file's regexes.
- [FULL - read over `ssh vps` 2026-08-28] `crontab -l` (19 lines), `~/bin/{affirmation.sh,fleet,fleet-health.sh,loops-report.sh,cost-of-pass-summary.sh,fleet-spend-guard.sh,fleet-brain-check.sh,routine.sh,stall-tripwire.py,bus-poll-run.sh,zao-escalate,zao-ask,zao-morning-sweep.sh,zao-daily-agent-tip.sh}` (send lines and chat-id variable names; values not copied), `systemctl --user cat zoe-bot`, `git -C ~/zao-bot-live log -1`, `journalctl --user -u zoe-bot --since "7 days ago"` (module-tag counts), `~/.zao/loop-watchdog.log` tail.
- [FULL - read on disk 2026-08-28] `bot/src/zoe/{telegram-routing,scheduler,backlog-grill,backlog-grill-runner,nudge-ladder,orchestrator-tick,pinned-brief,fleet-health,call-budget,bus-bridge,relay-bridge,task-mention-notify,brief,nudge,nudges,outbox}.ts` headers and cron table; `/private/tmp/wt-zoe-send-budget` (`git log`, `git diff --stat origin/main...HEAD`, `send-budget.ts` lines 1-60 and 183-212).
- [FULL - read on disk 2026-08-28] `~/zao-vault/handoffs/{GRILL-QUEUE.md,GRILL-DONE.md,grill-next.md}`, `~/zao-vault/daily/2026-08-27.md` and `2026-08-28.md`, `~/.zao/zoe-loop/{OUTBOX.md,FEEDBACK.md}`, `~/.claude/settings.json` (hook events and the two push/remote keys), `~/bin/zao-notify.sh` lines 1-30.
- [FULL - curl + HTML strip, 7,522 words] [Claude Code docs - Remote Control](https://code.claude.com/docs/en/remote-control) - mobile push section quoted verbatim.
- [FULL - curl + HTML strip, 28,928 words] [Claude Code docs - Hooks](https://code.claude.com/docs/en/hooks) - `Notification` event, matcher values, the six-second `permission_prompt` delay.
- [FULL - curl + HTML strip, 3,168 words] [Claude Code docs - Configure your terminal](https://code.claude.com/docs/en/terminal-config) - `preferredNotifChannel`, when the notification event fires.
- [FULL - tool schema, in-session] the `PushNotification` tool description ("err toward not sending one"; skipped when the user is at the terminal).
- [FULL - curl + HTML strip, 2,219 words] [OpenAI Agents SDK - Human in the loop](https://openai.github.io/openai-agents-python/human_in_the_loop/).
- [FULL - curl + HTML strip, 6,146 words] [LangGraph - Interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts).
- [FULL - curl + HTML strip, 2,804 words] [Anthropic - Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) (2024-12-19; the page itself notes the tooling landscape has moved since).
- [FULL - curl + HTML strip, 73,870 and 9,138 words] [Telegram Bot API](https://core.telegram.org/bots/api) and [Bot features](https://core.telegram.org/bots/features) - `disable_notification`, `pinChatMessage`, `editMessageText`, `message_thread_id`, inline keyboards.
- [FULL - Algolia items API, 28 top-level comments] [HN 44328373 - Rise in 'alert fatigue' risks phone users disabling news notifications](https://news.ycombinator.com/item?id=44328373) (20 points, 65 comments, 2025-06-20); the Guardian article it links was not fetched.
- [FULL - `glue-check` via `gh`, 2026-08-28] `openai/openai-agents-python`, `langchain-ai/langgraph` - LICENSE files read (both MIT), liveness and stars as printed.
- [FAILED - not fetched] Reddit: the fetch ladder is documented dead from this machine (doc 2282, 2026-08-14) and `~/.zao/private/reddit.env` does not exist; no snippet was substituted.
- [FAILED - `ssh pi` did not resolve 2026-08-28] the Pi's ZOL cron/units; ZOL counts come from the export only.
