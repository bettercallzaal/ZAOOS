# 1214 - Event-creation workflow: one input → full flow (ZAI creates, ZOL promotes, ZOE reminds)

**Tier:** STANDARD
**Date:** 2026-07-17
**Status:** Design (doc + command spec). Runtime wiring is a gated follow-on.
**Owner:** builder loop (design), Zaal (approve gated steps)

## Why this doc exists

Zaal, on creating a co-hosted Farcaster Space: *"improve the workflow for things like
this."* Today an event is assembled by hand across five surfaces (calendar, Farcaster
Space, promo posts, reminders, recap). This designs a **repeatable flow where "make an
event" is one input** that fans out to every step, with the right surface owning each and
outbound/write actions staying human-gated. It's also a natural first **ZAI** capability
alongside its Discord/voice live-capture.

## The one input (captured once)

A single `EventSpec` captures everything downstream needs:

```
EventSpec {
  title            # "ZAO x Milk Road Farcaster Space"
  kind             # farcaster-space | irl | livestream | call
  startsAt, endsAt # ISO, with timezone (default ET)
  hosts[]          # ZAO + co-hosts (handles per platform)
  channels[]       # /zao, /zabal, ...
  blurb            # 1-2 sentence description for promo + calendar
  links[]          # RSVP / Space URL / stream URL (filled as they exist)
  promoWindow      # e.g. T-3d, T-1d, T-1h, live
  recap            # true => ZAI captures + drafts a recap after
}
```

Entry point: **`/event`** in ZOE DM (Zaal) — `/event` opens a short capture (or accepts
`/event <title> | <when> | <hosts>`), producing the `EventSpec`, then confirms the plan
before anything leaves the building. One input, one confirmation, full fan-out.

## The flow (who owns each step, automated vs gated)

| # | Step | Surface | Building block that exists today | Automated? |
|---|------|---------|----------------------------------|-----------|
| 1 | **Create calendar event** | ZOE → Google Calendar | `bot/src/zoe/calendar.ts` (currently read-only: `getCalendarEvents`) — needs a `createCalendarEvent` write | **Gated** (calendar write) — draft the event, Zaal confirms |
| 2 | **Schedule the Farcaster Space** | ZAI / ZOL → Farcaster | `bot/src/zoe/farcaster/write.ts` + `signer.ts` (posting works) | **Gated** (outbound) — ZAI drafts the Space + time; Zaal approves creation |
| 3 | **Draft + queue promo posts** | ZOL → Farcaster / X | `src/lib/publish/` (cross-platform), `bot/src/zoe/drafts.ts` | Draft **auto**; posting **gated** — ZOL queues per `promoWindow`, each release Zaal-approved |
| 4 | **Set reminders** | ZOE | ZOE scheduler (`scheduler.ts`, 14 cron tasks) + `/loop`-style status | **Auto** (internal pings to Zaal/hosts; no outbound) |
| 5 | **Day-of coordination** | ZOE | scheduler + the existing brief/nudge pipeline | **Auto** internal (checklist ping T-1h: links live? hosts confirmed?) |
| 6 | **Post-event recap + capture** | ZAI | ZAI `voice-capture.ts` + Bonfire episode + `drafts.ts` | Capture **auto**; the recap post **gated** — ZAI drafts, Zaal approves |

**Gating principle** (matches `.claude/rules/agent-loops.md` rule 8): every step that
*writes to an external surface* (calendar, Farcaster Space, promo/recap posts) is
**drafted automatically but released only on Zaal's approval**. Internal steps (reminders,
day-of checklist, capture) are fully autonomous. So "one input" produces a **fully-staged
event** that Zaal approves in a few taps, not silent outbound automation.

## The command/skill shape

- **`/event`** (ZOE DM) — capture `EventSpec` → show the staged plan (all 6 steps, each
  marked AUTO or ⏸️ NEEDS-APPROVAL) → on "go", execute the AUTO steps and queue the gated
  ones as approvals (reuse ZOE's existing approvals flow, `bot/src/zoe/approvals.ts`).
- **`/event status <title>`** — where each step stands (drafted / approved / done), same
  read-only pattern as the new `/loops` command.
- State: one `events` row (or reuse the cowork board with `kind=event`) holding the
  `EventSpec` + per-step status, so `/event status` and the day-of checklist read one source.

## Build order (each a separate PR; gated steps flagged)

1. **`EventSpec` type + `/event` capture + staged-plan preview** (ZOE, no outbound) — the
   spine. Boot-verify; ships the "one input → plan" with everything still in draft.
2. **Calendar write** (`createCalendarEvent` in `calendar.ts`) — gated; Zaal-approved per event.
3. **Promo drafting via ZOL + `promoWindow` queue** — draft auto, posting via existing
   approvals. Gated release.
4. **Reminders + day-of checklist** (ZOE scheduler) — internal, auto.
5. **ZAI recap capture + draft** — reuse `voice-capture.ts` + Bonfire; recap post gated.

Slice 1 is the highest-leverage + fully non-gated (internal capture + preview) — recommended
first build. The rest layer on, each gated at its outbound edge.

## Also see

- `bot/src/zoe/calendar.ts` (read; needs a write), `bot/src/zoe/farcaster/write.ts` (posting),
  `bot/src/zoe/drafts.ts` + `approvals.ts` (draft→approve), `bot/src/zai/` (capture)
- `src/lib/publish/` (cross-platform posting)
- The new `/loops` command (PR #1767) — the read-only status pattern `/event status` mirrors
- `.claude/rules/agent-loops.md` rule 8 (outbound/spend stay human-gated)
