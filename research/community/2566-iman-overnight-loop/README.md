---
topic: community
type: guide
status: research-complete
last-validated: 2026-09-27
superseded-by:
related-docs: "2253, 2090"
original-query: "ChatExport_2026-09-27 (1) reivew this and note all the stuff for iman we are asking him to do and help him get to the level i want him to be to be the zao intern i need / more here and lets upgrade his repo"
tier: STANDARD
---

# 2566 - The overnight loop: turning a six-hour gap into a night shift

> **Goal:** Zaal (ET) wants Iman (Lusaka, ET+6) to move work while Zaal sleeps,
> so that Zaal wakes up to progress and a batch of questions, not to a stalled
> thread. This doc sets out what distributed teams do about that gap and builds
> it into the iman-desk repo.

Builds on [community/2253](../2253-iman-workflow-structural-frictions/), which
found in August that Zaal's build window lands in Iman's night. The ask has now
flipped. Zaal wants Iman's morning to work as Zaal's night shift. The private
measurements (from the DM export) are in the vault, at
`notes/iman-desk-workflow-2026-09-27.md`. This public doc carries counts only.

## Key Decisions

| Decision | Call | Why |
|---|---|---|
| Every question carries a default, and the work continues on the default | **USE** | The measured stall is not reply speed (median 1 to 2 min both ways). It is work stopping at the first open question until Zaal wakes. asyncagile.org calls the fix "default to action", and remote-work.io says the same: "default to action. Use your best judgement and unblock yourself." |
| A fixed daily issue as the handoff surface, not DMs | **USE** | "Slack threads die ... The handoff needs a stable URL" (StandIn). iman-desk already has issues and labels. A `Tonight: <date>` issue is queryable and visible to both Claudes. |
| Name what must wait, and nothing else | **USE** | "If the incoming engineer doesn't know what they're empowered to decide, they'll default to waiting. Wait equals 8 hours" (StandIn). Five categories wait: public output, money, irreversible actions, public set times, first contact. Everything else goes ahead. |
| Read the handoff before any work, and acknowledge it | **USE** | Both StandIn and GitLab make read-first the rule "most commonly violated". A one-line "Read, starting on X" tells Zaal the loop ran. |
| A report deadline of 5 AM ET, checked by a machine | **USE** | Zaal wakes at about 5 AM ET. A GitHub Action labels the issue `report-in` or `no-report`, so nobody has to go looking for Iman to find out. |
| Replace the three check-in calls with the loop | **SKIP** | Keep the 9:30 ET call for what numbers cannot settle. The HN thread's consensus is "realtime sync up at the edges of the workday", plus written handoffs. |

## Findings

### 1. The gap, measured (counts only; the private detail is in the vault)

| Measure | Value | Surface |
|---|---|---|
| DM messages, 27 Feb to 27 Sept 2026 | 13,187 (Zaal 8,039, Iman 5,146) | Telegram export, parsed by script |
| Median reply, both directions | 1 to 2 minutes | same |
| Zaal pinging to locate Iman ("hello?", "u around", ...) | 66 all time, 11 in September | same, regex count |
| Zaal asking for more presence ("lock in", "be active", ...) | 39 all time, 13 in September (highest month) | same |
| Iman desk commits between 02:00 and 05:30 ET, 22 to 27 Sept | on 23 and 27 Sept (6 on 27 Sept) | `git log` of ZAODEVZ/iman-desk |
| Iman's working window in the chat, 15 to 27 Sept | usually 06:00-08:00 ET to 15:30-17:30 ET | first and last message per day |

The morning of 27 Sept shows the pattern. Iman asked a question at 05:15 ET
and the work waited on it until Zaal answered at 06:43. He asked again at
08:41. This is the "8-hour cycle" the handoff literature describes, and the
fix they give is a change in format, not more hours.

### 2. What the practitioner sources converge on

| Practice | StandIn | GitLab handbook | asyncagile / remote-work.io | HN 40040911 |
|---|---|---|---|---|
| Write the handoff at end of shift, in a fixed format | Yes, six fields | Yes, 30 min before shift end | - | "Provide all the relevant information in the first message" |
| Put it somewhere queryable, not chat | Yes | Yes, channel plus shared doc | Chat is secondary; "more than five back and forth messages" means the wrong tool | Git, issues and merge requests as the durable store |
| Make authority explicit | Yes ("Authority" field) | - | Consent-based decisions; name the irreversible ones | - |
| Default to action when blocked | - | - | Yes ("be wrong at speed") | "Stub in some code and keep going" |
| Read first, acknowledge | Yes | Yes | - | - |
| Keep a short sync at the overlap | Optional, 15 min max | Preferred when possible | Calls for irreversible decisions | "realtime sync up at the edges of the workday" |

The contradiction: an HN commenter on an unrelated thread (36119709) argues
that "no async workflows" fix a cross-timezone team and that the answer is
hiring senior people who "come up with solutions so they can keep working".
That is compatible with this doc rather than against it. Default-to-action is
the learnable habit behind the seniority that commenter is describing, and it
is the growth target for an intern.

### 3. What was built (iman-desk, 27 Sept, local commit, push pending)

| File | What it does |
|---|---|
| `.github/workflows/overnight.yml` | At 02:00 UTC (10 PM ET), opens `Tonight: <date>` (labels `for-iman`, `tonight`) listing the open `for-iman` queue. At 09:00 UTC (5 AM ET), labels it `report-in` or `no-report`. Also runs from `workflow_dispatch`. Crons move one hour later on 1 Nov 2026. |
| `CLAUDE.md` | New section, "The overnight loop": the timetable, ask-with-default, the stop-and-wait list, the Morning report fields. The issue format gains a `Default:` line. Zaal's Claude gets the evening post and the morning relay. |
| `.github/ISSUE_TEMPLATE/ask.md` | The Ask / Why / By / Default / Links form. |

It leaves Iman's own files alone (README, STATUS, TIMELINE, projects/,
updates/), as the repo's contract requires.

## Also See

- [community/2253 - Working with Iman: every friction is structural](../2253-iman-workflow-structural-frictions/)
- [dev-workflows/2090 - Async coordination + the ZAOcowork board](../../dev-workflows/2090-async-coordination-board-uiux/)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Push the iman-desk commit and create labels `tonight`, `report-in`, `no-report`; done when `overnight.yml` is on origin/main | @Zaal (permission) | Repo | 2026-09-27 |
| Run the workflow once with `job=tonight`; done when an issue titled `Tonight: 27 Sept` exists | Zaal's iman-desk lane | Test | 2026-09-27 |
| Post the first evening comment on that issue; done when it lists Zaal's open items with done-when | Zaal's iman-desk lane | Issue comment | 2026-09-27 22:00 ET |
| Iman answers which hours he works during Zaal's night, in CAT and ET; done when the answer is on the Tonight issue | @Iman | Issue comment | 2026-09-28 |
| Review the first five mornings: count `report-in` against `no-report`, and count questions that went out with a default against those without; done when the counts are written into this doc | Zaal's iman-desk lane | Doc update | 2026-10-03 |

## Sources

- [How to Handoff Work Across Timezones - StandIn](https://www.standin.co/blog/how-to-handoff-work-across-timezones) `[FULL]`, method: curl plus HTML strip; quotes checked against the raw text on 2026-09-27.
- [Handoffs and Continuity - The GitLab Handbook](https://handbook.gitlab.com/handbook/engineering/devops/oncall/handoff-and-continuity/) `[FULL]`, method: curl plus HTML strip, quotes checked.
- [Default to action - Asynchronous agile (Sumeet Moghe)](https://www.asyncagile.org/method-stack/default-to-action) `[FULL]`, method: curl, quotes checked.
- [Calm things down with communication protocols - Asynchronous agile](https://www.asyncagile.org/blog/communication-protocols) `[FULL]`, method: curl, quote "Keeping someone blocked though, is insensitive" checked.
- [What to know about async communication in remote work - remote-work.io](https://www.remote-work.io/whats-async-communication-in-remote-work/) `[FULL]`, method: curl, quotes checked.
- [Ask HN: How has your remote team solved communication across time zones? (2024-04-15)](https://news.ycombinator.com/item?id=40040911) `[FULL]`, method: HN Algolia items API, comment tree walked. Community source.
- [Ask HN: What challenges are you facing offshoring development to India?](https://news.ycombinator.com/item?id=36119709) `[PARTIAL - exa excerpts only, comment tree not walked]`. Used only for the one dissenting quote, which appears verbatim in the excerpt.
- Telegram DM export, 27 Sept 2026, private, not linked. Counts only here; the detail is in the vault note named above.
- [ZAODEVZ/iman-desk](https://github.com/ZAODEVZ/iman-desk) (private), `git log` and open issues at `cbc312a`.
