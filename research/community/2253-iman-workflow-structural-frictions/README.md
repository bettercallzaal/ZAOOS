---
topic: community
type: audit
status: research-complete
last-validated: 2026-08-08
superseded-by:
related-docs: "2158, 2246"
original-query: "keep on looking more at imans convo please we need to give him the rgiht tools to succeed and work well with my workflow"
tier: STANDARD
---

# 2253 - Working with Iman: every friction is structural, not personal

> **Goal:** Measure how the Zaal/Iman working relationship actually runs across
> three surfaces - Telegram, the cowork board, and GitHub - and name the tooling
> gaps behind the frictions, so they get fixed with tools rather than pressure.

## The headline

**Iman is not the problem.** He closes his own work: **165 of 192** completed
tasks were closed by him, not by Zaal. That is the healthiest number in the whole
ZAO system - Zaal's own board had eight things that could create a task and,
until 2026-08-08, nothing that could close one.

Every friction below is a tooling gap, and each is buildable.

## 1. Zaal's build window is Iman's night

Iman wrote "it's Midnight here" at 6:06 PM Zaal-time on 2026-08-07. That fixes
him at roughly **UTC+2, six hours ahead**.

| Zaal (ET) | Iman (local) | |
|---|---|---|
| 04:30 | 10:30 | overlap opens |
| 09:00 | 15:00 | the standing 9:30am sync lands here - well placed |
| 14:00 | 20:00 | last hour of real overlap |
| 16:00 | 22:00 | Zaal's stated build window (4-7pm) begins |
| 18:00 | 00:00 | Iman's midnight |

Zaal's most productive hours are precisely when Iman is offline.

**What this explains.** On 2026-08-07 at 2:54 PM Zaal wrote "Why didn't I get
anything update wise past 24 hours. I asked every 4 hours when we doing work."
That landed at **8:54 PM Iman's time**, and he replied 40 minutes later having
"just got back online". Reading that silence as unresponsiveness is a timezone
artifact.

Iman is already managing around it and apologising for it:

> "wanted to ask if you are okay with sending the Food for the coming week rn so
> I can record it in the doc too and So I don't have to text you about your
> tomorrow morning. I kinda feel bad to wake you up to that tbh it's Midnight
> here just updating and going to bed."

**Rule of thumb:** anything needing a human response belongs in Zaal's
04:30-14:00. Anything fired after 2pm ET lands in Iman's evening or night.

## 2. The requirement Zaal stated out loud is not automated

2026-08-08, 08:53: *"it was a PR which is good. But I have to feed that to my ai.
I want a PR plus a summary of what the pr is doing in a todo."*

That is the clearest requirement in the month, and it is a machine's job. Iman
delivered it manually within four hours - a board todo with the PR link, tagged
@zaal, and the cowork bot pinged Zaal in Telegram. **The loop worked.** It just
ran on his memory instead of on rails.

## 3. Instructions arrive as fragments, and ambiguity costs a round trip

2026-08-08, eight messages in sixty seconds: `Wait` / `Akai` / `On artizen` /
`We need to do our media fame` / `So I have` / [YouTube link] / `Embed this as
first artizen video` / `On site`.

Iman's reply: **"What do you mean on site bro?"** Then four more messages before
"Got you." **Thirteen messages to convey one instruction** - embed this video on
zaoartizen.vercel.app. He parsed it correctly; the reassembly is work he is
doing on Zaal's behalf.

## 4. He has no GitHub identity - a month of work belongs to nobody

There is **no GitHub account for Iman in either org**. The ZAOartizen PR he sent
on 2026-08-08 (6 files, +204/-1) is authored by the shared `ZAODEVZ` account.
Across the preceding month every PR in both orgs is attributed to
`bettercallzaal` or `ZAODEVZ`.

For an intern building a career that is a month of invisible work. For Zaal it
means the contribution cannot be measured even when it is good.

## 5. The activity log is dead, so his work exists only as a status flip

`activity_log` holds **50 rows, all dated 2026-05-21** - eleven weeks stale.
`comment_notifications` is empty, yet the bot posted a comment notification the
same day, so comments are happening and nothing records them.

There is no durable trail of who did what. "What did Iman do this week" is not
answerable from data.

## Measurements

All taken 2026-08-08 against the live cowork tracker.

| Metric | Value |
|---|---|
| Tasks owned, all time | 212 |
| Completed | 192 (91%) |
| **Closed by Iman himself** | **165 of 192** |
| Created by a bot/unset | 152 of 212 |
| Created by Zaal directly | 11 |
| Open now | 20 |
| Open tasks carrying no real context | 13 of 20 |
| Median cycle time | 38 days |
| Closed same day | 1% |
| Monthly throughput | May +122/-1, Jun +37/-1, Jul +45/-164 |

That July row matters: **164 completions in one month for tasks created across
three.** That is a batch closeout, not a rhythm - which is what a 38-day median
actually describes.

## Key decisions

| Recommendation | Why |
|---|---|
| **Give Iman a GitHub account and org access** | Ten minutes, permanent attribution, and it is his career. Highest value-to-effort item here. |
| **Instrument the 4-hour check-in instead of asking for it** | The expectation lived only in Zaal's head, so its failure surfaced as a confrontation 24 hours late rather than a notification. Built 2026-08-08 (PR #2991) and retargeted to the ZAO Devz group on Zaal's instruction - a check-in in a group is a ritual; the same words in a DM are a manager tapping one person on the shoulder three times a day. |
| **Automate PR -> todo with a written summary** | Zaal's own stated requirement. Should not depend on anyone remembering. |
| **Show Iman's local time wherever Zaal sees him** | Seeing "Iman 22:00" before firing a burst changes what you expect back. |
| **Assemble bursts into one task** | Zaal keeps his natural speed; Iman gets one clear instruction instead of thirteen messages and a guess. |

## Next actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Create Iman a GitHub account, invite to bettercallzaal + ZAODEVZ | @Zaal | Manual | 2026-08-11 |
| Merge + deploy the teammate heartbeat, posting to ZAO Devz | @Zaal | PR review | 2026-08-11 |
| Build PR -> todo with an auto-written diff summary | @Zaal | PR | 2026-08-15 |
| Decide whether the dead ZAAL BOTZ topics are revived or removed | @Zaal | Decision | 2026-08-15 |

## Sources

- Telegram DM, 2026-08-06 to 2026-08-08, read directly [FULL]
- ZAO cowork tracker, live queries against `tasks`, `team_members`,
  `activity_log`, `comment_notifications` [FULL]
- GitHub API, `bettercallzaal` and `ZAODEVZ` orgs, PR authorship for the
  trailing month [FULL]
- Timezone inferred from a single message ("it's Midnight here" at 18:06 ET);
  consistent with every other timestamp in the thread but **not confirmed by
  Iman directly** [PARTIAL]

## Also see

- [Doc 2158](../2158-farcaster-crm-activation-map/) - the CRM enrichment work
- `.claude/rules/first-handler-wins.md` - written the same day
