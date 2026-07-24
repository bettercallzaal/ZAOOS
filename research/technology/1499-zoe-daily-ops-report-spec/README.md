# 1499 — ZOE Daily Ops Report Specification (Telegram, Zaal-Only)

**Type:** SYSTEM-SPEC  
**Topic:** Technology  
**Status:** IMPLEMENT IN ZOE — daily cadence starts Jul 21. Two reports per day: 2PM check-in + 7PM EOD.

---

## Purpose

ZOE sends Zaal a private Telegram message at 2PM and 7PM every day. These reports prevent Zaal from having to manually check platform stats, open PR status, or upcoming deadlines — ZOE pulls all data and surfaces only what needs Zaal's attention.

This spec defines: what each report contains, where ZOE pulls the data, and the decision-escalation format.

---

## Report 1 — Midday Check-In (2PM EST, Every Day)

**Trigger:** Daily at 2PM EST (Telegram cron via Telegram Bot API)  
**Recipient:** Zaal only (private DM, NOT the community Telegram)  
**Character limit:** 500 characters total — concise

### Template

```
🕑 ZOE MID-DAY CHECK-IN — [DATE]

PLATFORM: [X] battles total | [Y] SOL vol | [Z] artists paid today
WW TODAY: [battles created] new battles | [active battles] voting open

EVENTBRITE: [RSVP count] RSVPs (if live); or NOT YET LIVE
NEWSLETTER: [subscriber count] subscribers (if sent); or NOT YET SENT
COC #8: [date if confirmed] | or TBD

⚡ NEEDS YOU:
- [urgent item 1 if any]
- [urgent item 2 if any]
- (none if clear)

Next EOD report: 7PM
```

### Data Sources

| Field | Source | How ZOE Pulls |
|---|---|---|
| Battles total | `wavewarz.info/api/public/stats` | `stats.totalBattles` |
| SOL volume | same | `stats.totalVolume` |
| Artists paid today | `wavewarz.info/api/public/stats` | `stats.artistPayouts` (daily delta) |
| New battles | WW API daily events endpoint | count battles created since midnight |
| Active battles (voting open) | WW API | filter battles by status=active |
| Eventbrite RSVP | Eventbrite API (if integrated) | `attendees.count` for event ID |
| Newsletter subscribers | Paragraph API | `subscribers.count` |
| COC #8 date | doc 1458 status field | manual check by ZOE (if Zaal posted, ZOE sees it in Telegram) |
| Urgent items | Rule-based escalation (see below) | |

### Urgent Item Escalation Rules

ZOE flags an item as urgent if any of these conditions are true:

| Condition | Escalation Message |
|---|---|
| A MAIN battle has been open for voting > 96h with < 10 votes | "MAIN battle [ID] needs promotion — voting stalling" |
| Eventbrite RSVP count hits a milestone (25/50/100/200/500) | "ZAOstock hit [N] RSVPs — post the milestone update" |
| Today is a gated action deadline (from the deadline table below) | "TODAY'S DEADLINE: [action]" |
| Community Telegram has 0 posts in last 24h | "ZAO Telegram quiet — time for a touchpoint post?" |
| Governance session day (Thursday) | "Fractal session tonight — reminder post live?" |

---

## Report 2 — EOD Summary (7PM EST, Every Day)

**Trigger:** Daily at 7PM EST  
**Recipient:** Zaal only  
**Character limit:** 800 characters total

### Template

```
🌙 ZOE EOD SUMMARY — [DATE]

DONE TODAY:
✅ [completed task 1]
✅ [completed task 2]
✅ (none if quiet day)

POSTED TODAY:
📣 [channel]: "[post preview]"
📣 (list all ZOE posts from today)

PLATFORM DELTA (last 24h):
• Battles: +[X] new | [Y] total
• SOL volume: +[Z] SOL
• WW registrations: +[N]

GATED / BLOCKED:
⚠️ [any items ZOE couldn't execute without Zaal]

TOMORROW'S TASKS:
• [task 1 from deadline calendar]
• [task 2]

OPEN PRS (≥24h old):
• #[PR] — [title] — [waiting for merge/review/info]
```

### Data Sources for EOD

| Section | Source |
|---|---|
| Done Today | ZOE internal task log (Telegram messages sent, docs updated) |
| Posted Today | Telegram bot sent-message log |
| Platform Delta | WW API daily diff (today vs yesterday at 7PM) |
| WW Registrations | WW API user count endpoint (delta) |
| Gated/Blocked | ZOE decision log (items requiring Zaal approval that weren't resolved) |
| Tomorrow's Tasks | Deadline calendar (below) |
| Open PRs | GitHub API: `gh pr list --state open` filtered by ZAOOS repo |

---

## Deadline Calendar ZOE Tracks

ZOE maintains this table internally and surfaces items in the midday check-in ≥3 days before deadline and again on deadline day.

| Deadline | Action | Docs |
|---|---|---|
| Jul 20 | Permit call with Suzanne McLean | 1495 |
| Jul 21 | COC #8 announcement + Eventbrite live + Newsletter Issue 1 | 1481 |
| Jul 22 | Fractured Atlas application | 1478 |
| Jul 23 | Green Pill pitch email | 1462 |
| Jul 24 | Water & Music pitch email + COC #8 artist lock | 1465, 1451 |
| Jul 25 | Africa Battle Week charity vote result + 7 partner DMs + Govbase PR | 1498, 1482 |
| Aug 1 | Mirror Article 1 + ZABAL S2 applications open | 1454, 1492 |
| Aug 1 | ZAOstock lineup announcement + Fisher grant roster | 1494 |
| Aug 4 | Newsletter Issue 2 | 1467 |
| Aug 15 | Fisher grant application | 1436 |
| Aug 22 | ZABAL S2 applications close | 1492 |
| Sep 1 | ZABAL S2 cohort starts | 1419 |
| Sep 3 (est.) | MAC grant deadline | 1471 |
| Sep 15 | Artist input lists (sound production) | 1461 |
| Sep 22 | Africa Battle Week announcement posts | 1498 |
| Sep 26 | Africa Battle Week battle opens | 1498 |
| Oct 3 | ZAOstock | 1479 |

---

## ZOE Technical Implementation Notes

### Telegram Bot Setup

- Bot token: stored in ZOE environment variable `TELEGRAM_BOT_TOKEN`
- Zaal's private chat ID: stored in `TELEGRAM_ZAAL_CHAT_ID`
- Do NOT send these reports to the community Telegram groups (separate `TELEGRAM_ZAO_GROUP_ID` and `TELEGRAM_CLIPPERS_GROUP_ID`)

### Scheduling

Use a cron-style scheduler (node-cron or BullMQ):
```
# 2PM EST daily (UTC = 18:00)
0 18 * * * → trigger midday report

# 7PM EST daily (UTC = 23:00)
0 23 * * * → trigger EOD report
```

### WaveWarZ API Call

```javascript
const stats = await fetch('https://wavewarz.info/api/public/stats')
  .then(r => r.json())

const report = {
  totalBattles: stats.totalBattles,     // 1289
  totalVolume: stats.totalVolume,       // 878.30 SOL
  artistPayouts: stats.artistPayouts,   // 13.39 SOL
  traderClaims: stats.traderClaims,     // 381.197 SOL
  mainEvents: stats.mainEvents,         // 50
  mainBattles: stats.mainBattles,       // 165
  quickBattles: stats.quickBattles,     // 1084
  communityBattles: stats.communityBattles // 36
}
```

### Fallback Behavior

If any API call fails:
- Report `[API UNAVAILABLE]` for that field
- Do NOT skip the report — send with available data
- If 3 consecutive API failures: add "⚠️ WW API down — check wavewarz.info" to urgent items

---

## Show-Night Extended Report (COC Concertz Days)

On COC Concertz show nights, ZOE sends an additional 3 reports:

| Time | Report |
|---|---|
| T-30 min | "SHOW STARTING IN 30 MIN — battle [ID] is live, stream link is [URL], watch for audience DMs" |
| T+45 min | "ZAOstock announce from stage in 15 min — confirm you want me to prep the Telegram post" |
| T+90 min | "SHOW DONE — [battle result], [winner] won [X SOL], [loser] earned [Y SOL]. Post results?" |

---

## Related Docs

- 1468 — ZOE Operations Manual (broader ZOE capability spec)
- 1472 — Telegram Community Operations Guide (community vs private Zaal reports)
- 1481 — Jul 21 Launch Day Protocol (first day this report runs)
- 1480 — ZAO Farcaster Mini App Spec (ZOE Neynar integration)
- 1498 — Africa Battle Week Vote Protocol (ZOE escalation triggers)
