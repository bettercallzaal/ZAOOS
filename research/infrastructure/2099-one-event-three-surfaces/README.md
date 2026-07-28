---
topic: infrastructure
type: decision
status: research-complete
last-validated: 2026-07-28
related-docs: 557, 1590, 1650, 1253, 2096
original-query: "Audit our repos/workflows/use of calendars+events. Ideal: every event on lu.ma/zao AND Google Calendar AND Unlock Protocol as a collectible. Design the one-event-three-surfaces pipeline."
tier: STANDARD
---

# One event -> lu.ma + Google Calendar + Unlock collectible (audit + design)

> **Goal:** Make one event, and have it land on lu.ma/zao, your Google Calendar, and Unlock Protocol as a collectible. This audits what ZAO already has (a lot) and designs the missing orchestration - honestly, including the surface that can't be auto-written.

## Key Decisions (recommendations first)

| Decision | Call | Why (verified) |
|----------|------|----------------|
| Source of truth for events | **The ZAOOS `events` table** (already exists) | `scripts/20260616_unlock_events.sql` defines it with `slug, title, lock_address, unlock_event_url, chain_id (8453 Base), starts_at, is_published`. It is already the canonical registry; make it the write source, everything else a projection. |
| Build a create-event endpoint | **YES - this is gap #1** | Events are seeded via SQL today; `src/app/api/events/` has only `rsvp` + `verify-ticket` POSTs, no create. Nothing can be "one event" until you can make one. |
| Unlock collectible: auto-deploy the lock now | **NO (v1) - semi-manual first** | `src/lib/unlock/lock.ts` only READS (`hasValidKey`, `findKeyHolder`); its own comment: locks are "created via EVENTS by Unlock Labs (events.unlock-protocol.com); we only read." v1: create the lock on the hosted tool, store `lock_address` in the event (the table already has the field). v2: auto-deploy a PublicLock via the Unlock factory. |
| Google Calendar write | **YES - reuse the YouTube OAuth** | ZAO already has a Google OAuth flow (`src/app/api/auth/youtube/`). Reuse it for a Calendar-scope token, or ship the "add to GCal" template link the calendar page already builds as the zero-build first step. |
| Auto-write to Luma | **NO - Luma is the constrained surface** | `bot/src/zoe/calendar.ts` only READS the public ICS; there is no Luma write API in the free tier and none in the repo. So Luma is one-way: keep creating on Luma by hand (or confirm a paid Luma API before committing to auto-write). |

**One-line take:** You already have the collectible plumbing (events table + Unlock verify + RSVP + GCal template). The missing piece is a **create-once orchestrator**, and the honest constraint is **Luma can't be auto-written** - so v1 is "create in ZAO -> Unlock collectible + GCal," with Luma staying manual.

## Current state, per surface (verified, file:line)

| Surface | What exists today | Read / Write / Create |
|---------|-------------------|------------------------|
| **ZAOOS events** | `events` table (`scripts/20260616_unlock_events.sql`), `GET /api/events/[slug]`, `POST /api/events/rsvp` (email capture), `POST /api/events/verify-ticket` (Unlock check) | READ + RSVP; **NO create-event endpoint** (seeded by SQL) |
| **Unlock Protocol** | `src/lib/unlock/lock.ts` - `hasValidKey`, `findKeyHolder` on Base (8453). Ticket gating works. | **READ/verify only**; lock creation is manual on events.unlock-protocol.com |
| **Luma** | `bot/src/zoe/calendar.ts` reads `luma.com/zao` ICS (`cal-jPH4al7AMlXzdNN`), 6h cache. Comment: "INFORM-ONLY: does NOT create/modify/RSVP." | **READ only**; no write API found |
| **Google Calendar** | `src/app/(auth)/calendar/page.tsx` - browser template links (`calendar.google.com/calendar/render`) + a `webcal://` feed. The `/meeting` skill reads/updates via the native MCP. | **Template links / MCP read**; no server-side GCal write |

**Prior docs (already partial answers):** 557 (onchain ticketing - Unlock chosen, lock creation manual), 1650 (Eventbrite webhook - ZAOstock-only, not generic), 1590 (RSVPizza - day-of ops), 1253 (Cal.com for Zaal's personal scheduling). None sketch the multi-surface create.

## The design: ZAO events table as source of truth, surfaces as projections

```
YOU create an event ONCE (new POST /api/events/create)
        writes the events table (source of truth)
   |            |               |                |
   v            v               v                v
 events page   Unlock          Google Cal      lu.ma
 (exists,      collectible     (reuse YouTube  (CONSTRAINED:
  gated by     (v1: paste      OAuth for a      no write API -
  verify-      lock_address    Calendar token,  stays manual /
  ticket)      from hosted     or the add-to-   one-way; you
               tool; v2:       GCal link that   still create
               factory deploy) already exists)  on Luma by hand)
```

## Honest constraints

- **Luma has no write path** (free ICS is read-only; a paid API is unconfirmed). So "every event auto-posts to Luma" is not buildable today - confirm whether Luma has a paid create API before promising it; otherwise Luma stays the one surface you touch by hand (and ZOE keeps reading it).
- **Unlock lock creation is a manual/hosted step** unless we build factory-deploy (a real onchain build). v1 stores the lock the hosted tool gives you; that is already the assumed flow.
- **GCal write needs an OAuth token with a Calendar scope** - reuse the YouTube OAuth machinery; not a from-scratch build.

## Smallest first build

**`POST /api/events/create`** - the source-of-truth writer. One authed endpoint (Zod-validated: title, slug, starts_at, ends_at, location, description, optional lock_address + unlock_event_url), inserts into `events`, returns the event page. That alone turns "edit SQL" into "make an event," and the event is immediately: live on the events page, Unlock-gate-ready (paste the lock), and has the existing add-to-GCal link. GCal-token write + Unlock factory-deploy + any Luma sync are phase 2.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Build `POST /api/events/create` (source-of-truth writer, admin-gated, Zod) | zaal | PR | 2026-08-08 |
| Confirm whether Luma has a paid create API (decides if Luma can ever be auto-written) | zaal | Verify | 2026-08-08 |
| Phase 2: GCal write via reused OAuth + Unlock factory auto-deploy of the lock | zaal | PR | 2026-08-22 |

## Sources

- `scripts/20260616_unlock_events.sql`, `src/lib/unlock/lock.ts`, `src/app/api/events/*`, `bot/src/zoe/calendar.ts`, `src/app/(auth)/calendar/page.tsx` - [FULL] verified in-repo 2026-07-28
- Docs 557 / 1650 / 1590 / 1253 - [FULL] read from the repo
- Unlock Protocol events tool (manual lock creation) - [PARTIAL] per lock.ts comment; confirm factory-deploy path for v2
