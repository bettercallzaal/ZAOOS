---
topic: agents
type: design
status: research-complete
last-validated: 2026-07-17
related-docs: "1187, 989, 245"
original-query: "Design a repeatable event-creation workflow: capture event details once, trigger calendar event + Juke Space + promo posts + reminders + day-of coordination"
tier: STANDARD
---

# 1215 — Event-Creation Workflow Design

> **One command, full event stack.** Zaal says "make an event" (or fills a short form), and the workflow handles: calendar event + Farcaster Space + promo post queue + reminders + day-of coordination + post-event recap. First target: cohosted Farcaster Spaces with other builders.

## Problem

Creating a Farcaster Space with Eduard (or any co-host) currently requires:
1. Manual Juke Space creation
2. Separate calendar entry
3. Manually drafting promo posts for Farcaster, X, etc.
4. Setting reminders manually
5. Day-of: manual coordination, intro cast, live updates
6. Post-event: manual recap + metrics capture

Each step is independent. If one is skipped, coverage gaps. The workflow should be: one input, all five outputs.

---

## The Workflow: 5 Stages

### Stage 1 — Capture (one-time input)
Zaal provides (or ZAI prompts for):

| Field | Example |
|-------|---------|
| `title` | "ZAO x Eduard: Building in Public" |
| `cohosts` | `[@eduardon]` (Farcaster usernames or FIDs) |
| `datetime` | "Thursday Jul 24 8PM EST" |
| `duration_min` | 60 |
| `topic` | "How to ship 10 PRs a week while holding a day job" |
| `format` | `space` / `irl` / `irl+stream` |
| `channels` | `['zao', 'wavewarz']` for Farcaster promo |
| `platforms` | `['farcaster', 'x']` |

Input surface: Telegram message to ZOE (NLP parse), or a short `/event` command with a structured form.

### Stage 2 — Calendar Entry
- Creates a Google Calendar event (or pushes a reminder to Zaal's Telegram)
- Co-host names appear in the description
- 24h + 1h reminders auto-set
- Decision: Google Calendar API (requires OAuth setup) OR push directly to Telegram `@Zaal 1h before X` via ZOE. **Recommendation: ZOE reminder ping (no new OAuth needed).**

### Stage 3 — Juke Space
- Calls `spaces create "<title>" [--at <datetime>] [--agents]` via juke.js (already built in zaalcaster)
- Returns the Space ID + embed URL
- Co-host: Juke spaces are created by one account; co-host joins as a speaker (Juke handles this at room level, not at create time)
- Space link goes into Stage 4's promo posts

### Stage 4 — Promo Posts (draft + queue)
Drafts for each platform, formatted for that platform's norms:

| Platform | Format | ZOL posts via |
|----------|--------|---------------|
| Farcaster `/zao` channel | cast with Juke embed URL | ZOL Farcaster post path |
| Farcaster `@main` feed | 1-cast announcement | ZOL |
| X / Twitter | 240-char version, link | ZOL or manual |

**Output:** `/confirm event-promo` — Zaal sees all drafts, one approve tap sends all.

### Stage 5 — Day-Of + Post-Event
- **T-60min:** ZOE pings Zaal "Space in 1h — link: [url]"
- **T-0:** ZOE posts the live-now cast to Farcaster (with Juke embed)
- **T+0 (session end):** ZAI or ZOE prompts: "capture recap? (yes/skip)"
  - Recap: topic, key points, co-host names, Warpcast link, attendance estimate
  - Stored in Bonfire + posted as a thread on Farcaster

---

## Tech Stack

| Component | Tool | Status |
|-----------|------|--------|
| Capture input | ZOE Telegram command `/event` | Build needed |
| Calendar / reminder | ZOE Telegram alert (T-24h, T-1h) | ZOE scheduler, exists |
| Juke Space creation | `juke.js` `createJukeSpace()` | Built in zaalcaster |
| Promo post drafts | ZOL or ZOE draft flow | ZOL can post; drafts need template |
| Day-of live cast | ZOL Farcaster post | Built |
| Recap capture | ZAI Discord or ZOE Telegram prompt | ZAI: doc 1187 |
| Bonfire storage | `logDecision()` in zoe.js | Built |

---

## Implementation Order

| Priority | Item | Owner | Effort |
|----------|------|-------|--------|
| P1 | `/event` Telegram command in ZOE (captures 6 fields, stores in tracker row, triggers Stage 2+3) | agent | 2h |
| P1 | ZOE day-of reminder (T-24h + T-60min Telegram ping) | agent | 30min |
| P2 | Promo post drafts: ZOL template + `/confirm event-promo` flow | agent | 1h |
| P2 | Day-of live-now cast via ZOL | agent | 30min |
| P3 | Post-event recap prompt + Bonfire storage | ZAI/ZOE | 1h |
| P3 | Google Calendar integration (requires Zaal OAuth setup) | Zaal-gated | 30min Zaal |

**First ship:** P1 items give 80% of value — one Telegram message creates the Space + sets reminders. P2 adds the promo automation. P3 closes the loop post-event.

---

## Event Row Schema (cowork board)

```json
{
  "project": "ZAO",
  "kind": "event",
  "title": "ZAO x Eduard: Building in Public",
  "notes": "juke_url:<url> cohosts:eduardon datetime:2026-07-24T20:00:00Z platforms:farcaster,x",
  "status": "todo",
  "due": "2026-07-24T20:00:00Z",
  "legacy_source": "event-workflow"
}
```

---

## Open Questions for Zaal

1. **ZOL posting:** Is ZOL's posting path live and tested for channel casts (`/zao`)? If not, ZOE's Telegram send is the fallback.
2. **Juke API key:** Is `JUKE_API_KEY` configured? Without it, the Space step is skipped (the workflow degrades gracefully, prints the manual link instead).
3. **Co-host coordination:** Does Eduard get a Telegram ping? Or is the workflow Zaal-side only (he handles co-host comms manually)?
4. **Farcaster Space vs Audio Space:** Juke = Farcaster audio rooms. Is this the right format, or is the goal also / instead a Twitter Spaces equivalent?

---

## Also See

- [Doc 1187](../1187-zai-discord-live-capture/) — ZAI Discord live-capture + Q&A; the day-of and recap stages fold into ZAI's live session work
- [Doc 989](../989-zoe-wheel-and-spoke-architecture/) — ZOE wheel-and-spoke: ZOE orchestrates, ZOL executes social, ZAI captures live
- [Doc 245](../245-zoe-upgrade-autonomous-workflow-2026/) — ZOE autonomous workflow upgrades; event scheduling is listed as a high-leverage routine
