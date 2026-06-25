---
topic: events
type: guide
status: research-complete
last-validated: 2026-06-25
superseded-by:
related-docs: 897, 898, 900
original-query: "can we research how we can use luma more, and prep for our build sessions during july where we will be building and streaming and trying to get people to build on top of a project each day try and learn more about a different project in the thing"
tier: STANDARD
---

# 901 - Luma power features + the July ZABAL Gamez Build Days format

> **Goal:** Use Luma properly for a daily July series, and lock a repeatable build-session format where each day spotlights a different project and the room builds on top of it, live.

## Key Decisions

| Decision | Call | Why |
|----------|------|-----|
| Create the July series | USE Luma **Clone + Recurrence** - generate the whole daily July run in one shot | Clone makes up to 30 events at once (10 for Zoom) on a daily pattern; copies description, location, cover, settings, and registration questions. One setup, 30 days. |
| The format | RUN the **Build Club / Build Hour** model: a fixed daily slot, 60 min, build live on top of that day's project | The proven shape (Build Club, Build Hour, devstreams). "The slot is the asset" - consistency beats attendance. Run it with three people if that's who shows. |
| The hard constraint | Every build must be **on top of that day's spotlighted project** | The deliberate constraint is what creates the cross-pollination; without it, drift kills the learning effect. |
| Streaming | KEEP it raw - stream to zabalgamez.com/live, upload the unedited recording | Messy/unedited reads as honest and trustworthy; post-production is optional. Recording -> ingest via scripts/ingest-recording.mjs after. |
| Capture intent | ADD a Luma registration question: "What do you want to build?" | Turns RSVPs into a build-idea backlog you can open the session with. |

## Findings

### Luma features worth using (most are underused)

- **Clone + Recurrence** - duplicate an event across up to 30 dates at once (10 for Zoom) using a daily/weekly/monthly recurrence pattern. Copies everything except the guest list and blasts. (Caveat: ticket sale-window dates copy as literal dates - irrelevant for free events.)
- **Luma Calendar** - the ZAO calendar (luma.com/zao) lists every event; people **subscribe to the calendar** and get notified of new events. There is no bulk registration, so each day is its own RSVP - cross-link the days in each description so people can hop between them.
- **Event Blasts** (replaced Reminders) - email + SMS + push to "Going" guests. The web "Advanced" composer gives rich text, scheduling, and recipient filtering by status/ticket. Use for day-of "we're live" and "starting in 1 hour" sends.
- **Registration Questions** - collect more than name/email at RSVP (e.g. "what are you building?", GitHub, project link).
- **Calendar Memberships** - free or paid tiers, member-only events, application + approval. A lever if July becomes a gated builder cohort.
- **Pre-filled create URLs** - construct a create-event URL with `calendar`, `cover_url`, `duration` (ISO 8601, e.g. PT1H), `timezone`, `max_capacity`, `tint_color` pre-filled - share with the team or embed.
- **Embed** - drop a Luma checkout button or the full event page onto zabalgamez.com so people register without leaving.
- **Webhooks** - Luma fires webhooks on registration - wire to notify/automation later.

### The daily build-session format (60 min, three segments)

1. **0-10 min - Spotlight + vote.** The day's guest/project owner shows the project in ~5 min. Then the room votes on what to build on top of it (seed 2-3 ideas ahead, take live ones). Use a literal timer; most-liked/most-reacted wins.
2. **10-55 min - Build live.** Driver shares screen and builds on top of the project, narrating loosely. Audience suggests, spots bugs, helps when stuck. It does not have to finish - something interesting just has to happen.
3. **55-60 min - Demo + handoff.** Show what changed, what broke, what surprised. Post the recording link + a one-line "what we built". Tee up tomorrow's project.

### Drive participation (steal these)

- **Open strong:** the first minutes are the audience-acquisition window - state today's project, recap yesterday in one line, show the current state immediately.
- **Call-and-response:** ask viewers to build their own thing on top and post it with a tag; feature the best on stream the next day. (Like the 30-Days community-feature model: most-liked idea gets built and ships.)
- **Make contributions tangible:** name a feature/Easter egg after whoever suggested it. People come back to see their fingerprint.
- **Narrow, timed votes:** specific either/or questions with a 10-minute window, not "do you like this?".
- **The off-stream hub:** the /zabal channel + group chat is where ideas drop before, chat overflows during, and the recording + "what we built" lands after.
- **Cadence:** promote each day at 24h and ~2h out via a Blast + a /zabal cast (hook-first, ZM opener - see docs 897/898).

### Mapping to ZABAL Gamez

July = the open build month. The June workshops already produced a roster of projects + guests (Empire Builder, POIDH, Vini App, Bonfire, Eden Fractal, WaveWarz, Tortoise, Mental Wealth, Los Fomos, etc.). Each becomes a Build Day: the project owner spotlights, the room builds on top using that project's public surface (e.g. Empire Builder's free endpoints, POIDH's bounty contract, Vini's app builder). Recordings ingest into /recordings just like the workshops.

## Also See

- [Doc 897](../897-zao-social-posting-playbook/) - posting mechanics for the day-of promo.
- [Doc 898](../898-zaal-brand-voice-posting/) - voice for the casts.
- [Doc 900](../900-mental-wealth-academy-james/) - one of the projects that can anchor a Build Day.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Pick the fixed daily July slot and clone the series on luma.com/zao (Recurrence, daily) | @Zaal | Task | Before Jul 1 |
| Add the "what do you want to build?" registration question to the template event | @Zaal | Task | Before cloning |
| Line up the project-per-day calendar from the June roster | @Zaal | Doc | Late June |
| Schedule 24h + 2h Blasts per day; pair with a /zabal cast | @Zaal | Task | Rolling in July |
| Ingest each day's recording (scripts/ingest-recording.mjs) | @Zaal | Task | After each |

## Sources

- [Multi-Session / Recurring Events - Luma Help](https://help.luma.com/p/multi-session-recurring-events) [FULL - clone for up to 30 sessions, calendar, ticket-type workaround]
- [Cloning Events - Luma Help](https://help.luma.com/p/cloning-events) [FULL - what copies, Recurrence button, pre-filled create URL params]
- [Sending or Scheduling Event Blasts - Luma Help](https://help.luma.com/p/sending-or-scheduling-event-blasts) [FULL - email/SMS/push, advanced web composer, recipient filters]
- [Calendar Memberships - Luma Help](https://help.luma.com/p/calendar-memberships) [PARTIAL - free/paid tiers, member-only events, applications via highlights]
- [A playbook to run an agent Build Club - Booboone](https://booboone.com/a-playbook-to-run-an-agent-build-club/) [FULL - the 60-min/3-segment format, "the slot is the asset", platform constraint]
- [Building Software Live (Build Hour) - batko.ai](https://batko.ai/blog/build-software-front-90-people) [FULL - raw/unedited wins, build-in-public, weekly cadence, different project each time]
- [How to Turn a Mobile Game Build into a Dev Stream - descent.us](https://descent.us/dev-streams-that-hook-viewers...) [PARTIAL - recap->goal->build->demo arc, narrow timed votes, tangible contributions via highlights]
- [30days-web-challenge - GitHub](https://github.com/ab2rahman/30days-web-challenge) [FULL - most-liked-comment feature gets built and ships, daily for 30 days]
- [Live Vibe Coding: Build in Public - aiskill.market](https://aiskill.market/blog/live-vibe-coding-build-in-public) [PARTIAL - structure not scripts, audience as debugging resource, stream-to-skill pipeline via highlights]
