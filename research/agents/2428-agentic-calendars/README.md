---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-27
related-docs: "1117, 1215, 1253, 2096, 739, 1005, 2423"
original-query: "What an agent can do with Zaal's Google Calendar - creating and sending invites from decisions (the AV meeting that never happened on Aug 26 is the first case), availability and scheduling links (Cal.com is already the ZABAL Gamez booker; Calendly is connected), reminders that turn into grill items, meeting prep and post-meeting capture (the /meeting skill), and which open-source or platform-native pieces do this without fresh code (glue-first standard: ~/zao-vault/notes/glue-first-standard.md; run ~/.claude/skills/glue-first/bin/glue-check on every candidate repo). Include the Claude Code MCP connectors already on this Mac (Google Calendar, Calendly), Orca automations, and what ZOE would need."
tier: DEEP
---

# 2428 - Agentic calendars: everything Zaal asked for is rung 1 or rung 3, and the only thing missing is the habit of writing the invite

> **Goal:** Answer "what more can an agent do with my gcal" with measured evidence, and say which of it needs zero new code. Verdict: the Google Calendar and Calendly connectors already run inside Claude Code on this Mac (9 + 38 tools, exercised live 2026-08-27), ZOE already turns calendar events into grill items and pre-meeting nudges, and the Aug 26 AV meeting never happened because nobody wrote the event - not because any capability was missing.

Zaal, 2026-08-27, verbatim: "we should deep /zao-research in new lanes 1. calendars agenticly theres so much more we can be doing with my gcal".

## Key Decisions (recommendations first)

| # | Decision | Call | Evidence (measured 2026-08-27 unless dated) |
|---|---|---|---|
| 1 | **Decision -> invite is rung 1 today. Do it from the session that made the decision, with the connector, no build.** | **USE** `mcp__claude_ai_Google_Calendar__create_event` with `attendees[]`, `notificationLevel: ALL`, `addGoogleMeetUrl: true` | Tool schema loaded this session: `attendees` (email required), `notificationLevel` enum `NONE / EXTERNAL_ONLY / ALL` ("Default. Treated as ALL"), `addGoogleMeetUrl`, `overrideReminders`, `recurrenceData` (RRULE). Google sends the invite email itself, so the Gmail connector's approval gate is never in the path. |
| 2 | **The Aug 26 AV meeting had no calendar event. Ever.** The fix is a rule, not a tool: a decision with a date and a person leaves the session as an event. | **ADOPT** in `/meeting` Phase 4 and in the grill: when an action item carries a person + a date, call `create_event` (or `suggest_time` first) before the recap is written | `list_events` on `zaalp99@gmail.com` for 2026-08-24..09-07: 50 events on page 1, 15 with attendees, 5 meetings on Aug 26 (11:30, 12:30, 16:10, 17:00 plus one 10:00) - none mentioning AV, Aziz, Baraza or pipe. The commitment lived only in board card `23a50c20` (AV spec, due 2026-08-26) and the zaostock brief. The tracker still holds `Set up a recurring calendar sync with Aziz` due **2026-08-01**, `todo`, source `meeting-2026-07-28` - 26 days overdue, and exactly the item an invite would have closed. |
| 3 | **Bookings: Cal.com is the booking layer. Correct doc 1253's package name.** | **USE** hosted `https://mcp.cal.com/mcp` (OAuth 2.1, Streamable HTTP, 34 tools) via `claude mcp add --transport http calcom https://mcp.cal.com/mcp`; or `npm i -g @calcom/cli`; or the unauthenticated `POST https://api.cal.com/v2/bookings` | `npm view @calcom/mcp` -> **E404** (the package doc 1253 tells Zaal to install does not exist). The real source is `calcom/companion` `apps/mcp-server` (pushed 2026-08-21, 27 stars). `cal.com/bettercallzaal/zabal-games-workshop-slot` -> HTTP 200. `calcom/cal.com` LICENSE file: MIT, 100+ contributors, pushed 2026-08-08. |
| 4 | **Calendly stays as the public "chat with Zaal" link. Do not build on its Scheduling API.** | **KEEP** `calendly.com/zaalp99/30minmeeting`; **SKIP** `meetings-create_invitee` | `organizations-get_organization`: `plan: basic`, `stage: free`. Calendly's own guide: "customers are required to be on a paid plan in order to access or use applications calling the Scheduling API". 2 event types, 1 active (30 min, Google Meet). The connector's 38 tools include `scheduling_links-create_single_use_scheduling_link` and `availability-list_user_busy_times`, both reads/link-mints usable on free. |
| 5 | **Reminders -> grill items is ALREADY BUILT in ZOE. The GCal feed to it has been dead since 2026-05-25.** | **REVIVE** the feed with an Orca automation on this Mac (rung 3), change nothing in ZOE | `bot/src/zoe/grill.ts:397-400` feeds today's calendar into the day-driver grill; `bot/src/zoe/brief.ts:304` puts 7 days into the brief; `bot/src/zoe/events.ts:283-330` reads `~/.zao/private/gcal-*.json` and emits `[CALENDAR] "<title>" in <n>m. Anything to prep?` for events within 2h, skipping dumps older than 24h (`events.ts:266-267`). The only dump on this Mac is `gcal-2026-05-17-to-24.json` (mtime May 24) - 95 days stale, so that branch has returned nothing since May 25. The Luma ICS path (`calendar.ts`) still works but is community events, not Zaal's meetings. |
| 6 | **Meeting prep is a prompt, not a product.** | **USE** an Orca automation (`orca automations create --trigger "..." --prompt ... --provider claude`) or a `/schedule` routine that runs 30 min before any event with attendees: CRM row + last recap doc + open tracker items for each attendee | `orca automations create --help` accepts `hourly / daily / weekdays / weekly`, 5-field cron, or RRULE, with `--prompt` and `--provider claude`. One automation exists today (`orchestrator-tick`, disabled). Doc 739 rule 5 and the classmethod hands-on: event descriptions are untrusted input - keep tool confirmations on. |
| 7 | **Post-meeting capture is done. Keep `/meeting`.** | **KEEP** | `~/.claude/skills/meeting/SKILL.md:842-843` already finds the matching GCal event and appends `Recap: <link>` to its description via `update_event`. Meetily (`Zackriya-Solutions/meeting-minutes`, MIT file, 11 contributors, pushed 2026-08-27, macOS/Windows, local Whisper) is the rung-2 candidate ONLY if we ever need live Meet/Zoom capture; Craig + whisper already cover recordings. |
| 8 | **Event-driven triggers exist at rung 1; the vendor blog saying otherwise is wrong for our stack.** | **USE** an Apps Script installable calendar trigger when a "when an invite arrives" reaction is wanted | Google's own docs: "An installable calendar event trigger runs when a user's calendar events are updated - created, edited, or deleted." Free, no server. Contradicts usecarly.com ("No event triggers... the trigger is the timer, or you") which is true of Claude's scheduled tasks only. |
| 9 | **Do not adopt any of the "AI scheduling agent" repos.** | **SKIP** DayOtter, GudCal, open-schedule-agent, agentic-scheduling, sched, Fergana `scheduled` | glue-check results in the Glue map below: every one fails at least one checklist line (licence, liveness, or single maintainer). What they do is what decision 1 already does with the connector. |

## What already exists (measured, file:line)

This is the inventory `confirm-before-claiming-absence.md` requires. Three prior docs designed calendar wiring: 1117 (DEEP, 2026-07-17, Cal.com as scheduling layer), 1253 (2026-07-17, Cal.com MCP config, "awaiting CALCOM_API_KEY"), 2096 (2026-07-28, "smallest slice: today/tomorrow GCal in ZOE's brief, due 2026-08-05"). Grep of `bot/src/zoe/*.ts` for `calcom|cal.com`: zero hits. The 2096 slice did not ship: `brief.ts:304` calls `getCalendarEvents(7)` from `calendar.ts`, which is the Luma ICS reader, not GCal.

| Piece | Where | State |
|---|---|---|
| Google Calendar connector in Claude Code | `mcp__claude_ai_Google_Calendar__*`: `list_calendars`, `list_events`, `search_events`, `get_event`, `create_event`, `update_event`, `delete_event`, `respond_to_event`, `suggest_time` (9) | LIVE. `list_calendars` returned 13 calendars incl. `zaalp99@gmail.com` (primary, America/New_York) and `The ZAO` (community, 30 recurring events Aug 24-29, all "Hosted by" X Spaces / metaverse rooms). Available because Claude Code v2.1.46 (2026-02-17) made claude.ai connectors visible in the CLI: "If you've logged into Claude Code with a claude.ai account, MCP servers you've added in claude.ai, known as connectors, are automatically available in Claude Code" (code.claude.com/docs/en/mcp, fetched raw). |
| Calendly connector | `mcp__claude_ai_Calendly__*` (38 tools: users, event_types, availability, meetings, scheduling_links, shares, routing_forms, organizations) | LIVE. `users-get_current_user` -> slug `zaalp99`, tz America/New_York, updated 2026-08-25. |
| ZOE Luma calendar reader | `bot/src/zoe/calendar.ts` (ICS from `api.lu.ma/ics/get?entity=calendar&id=cal-jPH4al7AMlXzdNN`, 6h cache, "INFORM-ONLY") | Built, running. Community events only. |
| ZOE calendar -> grill | `bot/src/zoe/grill.ts:397-400` (`getCalendarEvents(2, now)` -> "On your calendar today:" grill items), added 2026-07-26 (`2c6108cc`, PR #2630) | Built, running on Luma data. |
| ZOE calendar -> brief | `bot/src/zoe/brief.ts:300-304, 385-407` (CALENDAR section, 7-day lookahead) | Built, running on Luma data. |
| ZOE GCal nudge | `bot/src/zoe/events.ts:283-330` `gatherCalendarCandidates`, wired at `scheduler.ts:955-957`, added 2026-06-15 (`849d90f0`) | Built. Starved: reads `~/.zao/private/gcal-*.json`, newest is 2026-05-24, max age 24h. |
| `/meeting` calendar update | `~/.claude/skills/meeting/SKILL.md:842-843, 858` | Built. Opt-in, "no matching event" is a silent skip. |
| Cal.com booker | `cal.com/bettercallzaal/zabal-games-workshop-slot` | Live (HTTP 200). ZABAL Gamez workshop slots. |
| Orca automations | `orca automations list` | 1 automation (`orchestrator-tick`, disabled). Cron/RRULE + `--prompt` + `--provider claude`. `orca-organization.md` line 15 still says 0 - stale by one. |
| Cross-repo | grep.app `calendar` in `ZAODEVZ/`, `googleapis.com/calendar` in `bettercallzaal/` | 0 hits both. No ZAO repo talks to the Calendar API directly. Negative signal: nothing to reuse, nothing to duplicate. |
| Tracker | `zao-tracker search calendar` / `Aziz` | 5 Aziz rows `todo`, oldest due 2026-07-28. "Set up a recurring calendar sync with Aziz" due 2026-08-01. |

## The Aug 26 case, reconstructed

- 2026-07-28 meeting -> tracker row "Set up a recurring calendar sync with Aziz", due 2026-08-01. Never became an event.
- Board card `23a50c20` "AV spec", due 2026-08-26, "Zaal works it with Dcoop" (zaostock brief line 69). Never became an event.
- 2026-08-27 daily note line 846: "Aug 26 AV meeting did not happen, invite for next week is his, slot UNSET."
- Primary calendar Aug 26 (measured): five meetings with attendees, none AV. The slot was free at 09:00 and 14:00-16:00.

A capability gap would look like "we could not have sent the invite". We could have, on any day since 2026-02-17, with one tool call. The gap is that the artifact that recorded the decision (a card, a doc line) is not the artifact that makes it happen (an event with an attendee). This is `recap-followthrough.md` rule 2 applied to time: **a commitment with a date goes on the calendar, not only in a doc.**

The next AV meeting, done at rung 1, in one session:

1. `suggest_time` with `attendeeEmails: [zaalp99@gmail.com, <aziz>]`, next week, `durationMinutes: 45`, `preferences.startHour "10:00"`, `excludeWeekends: true`.
2. `create_event` on primary: summary `ZAOstock AV: Baraza pipe test`, attendees Aziz + Dcoop, `addGoogleMeetUrl: true`, `notificationLevel: ALL`, `overrideReminders: [{method: popup, minutes: 60}]`, description = the card id + the run-of-show link. Note: `hangoutLink` was absent from every event `list_events` returned this session, so verify the Meet link lands with `get_event` after creating.
3. Write the event id back onto card `23a50c20` so the card and the event point at each other.

Step 2 is outbound (it emails Aziz) - Zaal's tap, per `lane-autonomy.md`. Steps 1 and 3 are not.

## Capability by capability (the five things Zaal named)

| Capability | Rung | What does it, today | Gap |
|---|---|---|---|
| Invites from decisions | 1 | GCal connector `create_event` (attendees, Meet, reminders, RRULE, notification level) | A rule in `/meeting` Phase 4 + the grill: person + date => event. Draft one line for each below. |
| Availability | 1 | GCal `suggest_time` (multi-attendee free slots); Calendly `availability-list_user_busy_times`; Cal.com `get_availability` / `GET /v2/slots` (public) | None. |
| Scheduling links | 1 | Calendly `scheduling_links-create_single_use_scheduling_link` (`max_event_count`, owner = event type URI) for a one-off link to hand a partner; Cal.com booker for ZABAL Gamez | None for links. Booking on Zaal's behalf via Calendly API needs a paid plan - do not. |
| Reminders -> grill items | 3 | ZOE `grill.ts` + `events.ts` already do it; feed is dead | Orca automation "nightly gcal dump" (below). |
| Meeting prep | 3 | Nothing scheduled today. ZOE's nudge text literally asks "Anything to prep?" but has no content behind it | Orca automation / `/schedule` routine, 30 min before attendee events: CRM row, last recap, open tracker items. |
| Post-meeting capture | 3 | `/meeting` writes recap link to the event | None. Optional: Meetily for live capture (rung 2, not needed now). |
| Event-driven reaction | 1 | Apps Script installable calendar trigger -> webhook | Only if wanted; not asked for. |

### The two glue lines

**`/meeting` Phase 4, after the action table:** "For every action item with a named counterparty AND a date: propose a `create_event` (summary, attendees, 45 min default, Meet on, `notificationLevel: ALL`). Show the proposal; Zaal taps; the event id goes into the tracker row's note." Zero code; a paragraph in SKILL.md.

**Grill (`quick-grill` skill):** a grill answer that resolves to "yes, meet X on <day>" ends with the same proposal. The `week-grill` in `grill.ts` already surfaces the events; this closes the loop in the other direction.

### The nightly dump (revives `events.ts`, rung 3)

`events.ts` accepts `[]`, `{items: []}` or `{events: []}` with `start.dateTime|date`, `summary`, `id` - which is exactly what `list_events` returns (schema: `{events: [...]}`). One Orca automation on this Mac:

```
orca automations create --name gcal-dump --trigger "0 5 * * *" --timezone America/New_York \
  --provider claude --workspace-mode existing \
  --prompt "Use mcp__claude_ai_Google_Calendar__list_events on zaalp99@gmail.com for the next 48h, pageSize 100. Write the raw JSON to ~/.zao/private/gcal-$(date +%F).json (chmod 600). Do not print attendee emails. Then scp the file to the VPS ~/.zao/private/ if the VPS is reachable; if not, say so."
```

Where it lands matters: `ZAO_PRIVATE_DIR` in `events.ts:265` resolves relative to ZOE's home on the host ZOE runs on (the VPS). The VPS is down as of 2026-08-26 (`/bonfire` skill note), so the last step fails loud until it is back - which is the correct behaviour (`silent-failure-guard.md`). The dump is PII (`pii-hygiene.md` rule 1): private dir only, never the repo, and the prompt forbids echoing emails.

## Glue map (every candidate ran through `glue-check`)

| Candidate | Licence (LICENSE file) | Alive (push / commits 180d) | Maintainers | Verdict |
|---|---|---|---|---|
| Google Calendar connector (claude.ai) | n/a (platform) | live, exercised today | Google + Anthropic | **Rung 1 - use.** |
| Calendly connector (claude.ai) | n/a | live, exercised today | Calendly | **Rung 1 - use for links and busy times.** |
| Cal.com hosted MCP `mcp.cal.com` + `@calcom/cli` | `calcom/cal.com` MIT; `calcom/companion` (mcp-server source) pushed 2026-08-21 | 2026-08-08 / 100+ | 100+ contributors | **Rung 1-2 - use for bookings.** |
| Orca automations | n/a (platform) | CLI present, 1 automation defined | Orca | **Rung 1 - use for cron prep + dump.** |
| Apps Script calendar trigger | n/a (platform) | Google docs, fetched raw | Google | **Rung 1 - use only if event-driven reaction is wanted.** |
| `nspady/google-calendar-mcp` | MIT | 2026-06-01 / 19 | 27 contributors, 1175 stars | Rung 2 candidate for a headless ZOE reader (multi-account, free/busy, Docker, OAuth desktop creds; "test mode tokens expire after 1 week"). **Not needed** while the dump path exists; keep as the fallback if a Node-side reader is ever required. |
| `Zackriya-Solutions/meeting-minutes` (Meetily) | MIT | 2026-08-27 / 79 | 11 | Rung 2 for live desktop capture; **not needed now** (Craig + whisper). |
| `Dayotter/dayotter` | AGPL-3.0 | 2026-08-26 / 100 | 5, 38 stars | **Skip.** Whole scheduling platform (Postgres, Redis, worker) to get what decision 1 does with one tool call. Fails "someone else maintains it" on age (first push 2026). |
| `gudlab/gudcal-core` | **Business Source License 1.1** (API field said NOASSERTION) | 2026-02-24 / 0 | 1 | **Skip.** Not OSS until 2030, dead. |
| `anthroos/open-schedule-agent` | MIT | 2026-02-26 / 0 | 1 | **Skip.** Dead, single author. |
| `hunterZh37/agentic-scheduling` | MIT | 2026-08-26 / 1 | 1 | **Skip.** Single author, 3 stars. |
| `Not-Aryan/sched` | **NO LICENSE FILE** | 2026-02-15 / 0 | 3 | **Skip.** All rights reserved. |
| `Fergana-Labs/scheduled` | MIT | 2026-04-06 / 100 | 3, 18 stars | **Skip for now.** The one interesting shape: an agent that reads Gmail threads and drafts reply-with-times, "draft-only by design". Our scheduling threads are Telegram/Farcaster, not email. Revisit if inbound email scheduling becomes a load. |
| `n8n-io/n8n` | Sustainable Use (not OSI; LICENSE.md "Portions... licensed as follows") | 2026-08-27 / 100 | 100+ | Covered by doc 1005; already on the VPS. Not the calendar glue - Orca automations are closer to hand. |
| `mediar-ai/screenpipe` | Screenpipe Commercial License (API said NOASSERTION) | 2026-08-27 / 100 | 100+ | **Skip.** Not OSS. |

Rung 4 and 5 are not reached. Section 3 of the glue standard ("nothing fits") is not triggered because rungs 1-3 fit.

## What ZOE would need

Nothing in code. Specifically:

1. **A fresh `gcal-*.json` on the VPS** (the automation above). Then `events.ts` nudges and `grill.ts` items appear for Zaal's real meetings, not only Luma.
2. **Writes stay in Claude Code sessions, not in ZOE**, until a real need appears. Doc 2096 was right that a personal @gmail cannot use a service account (OAuth only); the connector already holds that OAuth on this Mac, and ZOE (a grammY Node process on the VPS) cannot use claude.ai connectors. If ZOE ever must write, the choices are (a) `nspady/google-calendar-mcp` in Docker on the VPS with a one-time browser OAuth, or (b) Cal.com hosted MCP with an API key per doc 1253 - after fixing its package name. Neither is needed for the five capabilities asked about.
3. **The 2h nudge already exists** (`events.ts:267`). The prep content behind "Anything to prep?" comes from the Orca automation, which can post into the ZOE DM via the existing relay - transport, not record (`agent-loops.md` rule 36).

## Contradictions and staleness

- **Doc 1253 vs npm:** `@calcom/mcp` does not exist (E404 today). Cal.com's MCP is hosted at `mcp.cal.com` (OAuth 2.1) or self-hosted from `calcom/companion/apps/mcp-server` with an API key. 1253's tool names (`calcom_getAvailability` etc.) do not match Cal.com's published list (`get_availability`, `create_booking`, `get_busy_times`, 34 tools). Treat 1253's config block as stale.
- **Doc 1117 (2026-07-17) "Google Calendar MCP requires OAuth + token refresh complexity"** was true for a hand-configured server and is false for the claude.ai connector in Claude Code since v2.1.46. 1117's architecture (Cal.com as the layer ZOE talks to) remains reasonable for bookings; it is no longer the cheapest path for invites.
- **usecarly.com (2026-06-22) "No event triggers"** is about Claude's scheduled tasks. Apps Script calendar triggers and Cal.com/Calendly webhooks are event-driven and free.
- **HN sentiment (4 threads, 2023-2025):** the recurring question under every "AI scheduling agent" launch is "How is this different than adding a calendar MCP server to something like Claude?" (FlyLoop thread, 19 pts). The founder's answer: multi-party, multi-timezone coordination took "a lot of prompt and tool response refinement". For a one-person calendar that is the connector plus a paragraph of prompt.
- **Calendly plan:** `basic / free` measured today. Any doc that assumes API booking on Calendly is wrong until the plan changes.
- **`orca-organization.md` line 15** says 0 automations; `orca automations list` shows 1 (disabled). Stale by one row.
- **Time-sensitive numbers:** tool counts (9 / 38 / 34) as of 2026-08-27; Claude Code connector support since v2.1.46 (2026-02-17); nspady last push 2026-06-01 (87 days - inside the 6-month liveness line, but watch it).

## Security

- Calendar event descriptions are untrusted input from anyone who can invite Zaal (doc 739 rule 5; classmethod hands-on 2026). Keep tool confirmations on in any session with the connector in scope; never run `--dangerously-skip-permissions` with calendar reads.
- Attendee lists are third-party PII. Dumps to `~/.zao/private/` only, chmod 600, never in a doc, card, or Bonfire episode (`pii-hygiene.md`). This doc names counts and Zaal's own event titles only.
- `notificationLevel: ALL` emails real people. That is outbound: Zaal taps it (`lane-autonomy.md`, `agent-loops.md` rule 8).

## Also See

- [Doc 1117](../../dev-workflows/1117-agent-calendar-management/) - the DEEP platform comparison (Cal.com / Calendly / Reclaim / GCal), still the best table of what each vendor exposes
- [Doc 1253](../../dev-workflows/1253-calcom-mcp-zoe-calendar-wiring/) - Cal.com write path design; package name corrected here
- [Doc 2096](../../dev-workflows/2096-gcal-agentic-zoe/) - OAuth-not-service-account finding; smallest slice that did not ship
- [Doc 1215](../1215-event-creation-workflow/) - the `/event` capture workflow; its P3 "Google Calendar integration (Zaal OAuth)" is now rung 1
- [Doc 739](../../dev-workflows/739-claude-code-efficiency-native-mcps/) - the 2026-05-24 live validation of the GCal connector and the list-and-redirect PII pattern
- [Doc 1005](../../dev-workflows/1005-n8n-expansion-surface/) - n8n on the VPS
- [Doc 2423](../2423-vault-as-transport-inter-terminal-context/) - the committed-ledger pattern the glue standard cites
- `~/zao-vault/notes/glue-first-standard.md` - the ladder this doc walks
- Tracker: `Set up a recurring calendar sync with Aziz` (todo, due 2026-08-01, src meeting-2026-07-28); `Run Baraza OBS-to-RTMP test with Aziz` (todo, due 2026-08-22)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Send the Aziz AV invite: `suggest_time` then `create_event` (attendees Aziz + Dcoop, Meet on, `notificationLevel: ALL`), event id written onto card `23a50c20`. Shipped = the event exists on `zaalp99@gmail.com` with both attendees and Aziz has the email. Outbound: Zaal taps. | Zaal | Calendar | 2026-08-28 |
| Add the "person + date => propose `create_event`" paragraph to `~/.claude/skills/meeting/SKILL.md` Phase 4 and to the quick-grill skill. Shipped = zaal-dotfiles PR merged, both SKILL.md files contain the rule. | Zaal (dotfiles PR from any lane) | PR | 2026-09-01 |
| Create the `gcal-dump` Orca automation (05:00 ET daily, prompt above) and confirm a `gcal-2026-09-0x.json` exists in `~/.zao/private/` the next morning. Shipped = file present, mtime today, ZOE's `[CALENDAR]` nudge fires once the VPS is back. | Zaal | Config | 2026-09-02 |
| Correct doc 1253: replace the `@calcom/mcp` block with `mcp.cal.com` (OAuth) / `@calcom/cli` / `calcom/companion`, and mark its tool list superseded. Shipped = 1253 README edited, `last-validated` bumped. | any research lane | PR | 2026-09-04 |
| Fix `~/zao-vault/notes/orca-organization.md` line 15 (0 automations -> 1, `orchestrator-tick`, disabled). Shipped = vault commit. | any lane | Vault | 2026-09-04 |
| Decide whether a meeting-prep automation is wanted (30 min before attendee events: CRM row + last recap + open tracker items, posted to the ZOE DM). Shipped = a yes/no on the grill; if yes, the automation exists and posted once. | Zaal | Grill | 2026-09-04 |

## Sources

Method is stated per source so a reader can tell a verbatim quote from a reconstruction (`research-grounding.md`).

Platform docs (raw fetch):
- [Google Calendar API events.insert](https://developers.google.com/workspace/calendar/api/v3/reference/events/insert) - [FULL, curl + HTML strip] `sendUpdates` / `conferenceDataVersion` / `attendees[]` semantics
- [Configure the Calendar MCP server](https://developers.google.com/workspace/calendar/api/guides/configure-mcp-server) - [FULL, curl + HTML strip] remote server `calendarmcp.googleapis.com/mcp/v1`, scopes, "Claude Enterprise, Pro, Max, or Team plan"
- [Claude Code docs: MCP](https://code.claude.com/docs/en/mcp) - [FULL, curl + HTML strip] "connectors ... automatically available in Claude Code"
- [Apps Script installable triggers](https://developers.google.com/apps-script/guides/triggers/installable) - [FULL, curl + HTML strip] calendar event trigger quote
- Google Calendar connector tool schemas (`create_event`, `update_event`, `respond_to_event`, `suggest_time`, `list_events`, `search_events`, `list_calendars`) - [FULL, loaded in-session via ToolSearch] the parameter names quoted above are from the schemas, not from any blog
- Calendly connector tool schemas (`users-get_current_user`, `event_types-list_event_types`, `scheduling_links-create_single_use_scheduling_link`, `availability-list_user_busy_times`, `event_types-list_event_type_available_times`, `organizations-get_organization`) - [FULL, in-session]
- [Cal.com docs: MCP server](https://cal.com/docs/mcp-server) - [FULL, exa web_fetch, clean markdown] hosted `mcp.cal.com`, OAuth 2.1, 34 tools by category
- [Cal.com docs: AI agents](https://cal.com/docs/agents) - [FULL, exa] `@calcom/cli`, `POST /v2/bookings` "public and does not require authentication", `GET /v2/slots`
- [Cal.com help: MCP server](https://cal.com/help/cal-ai/mcp-server) - [FULL, exa] self-hosted with API key
- [Calendly: Schedule events with AI agents](https://developer.calendly.com/schedule-events-with-ai-agents) - [FULL, exa] paid-plan requirement, `POST /invitees` body, 31-day limit
- [Calendly community: Scheduling API now available](https://community.calendly.com/api-webhook-help-61/scheduling-api-now-available-4825) - [PARTIAL, exa highlights] 2025-10-16 announcement
- [Calendly blog: AI voice agents](https://calendly.com/blog/ai-voice-agents) - [PARTIAL, exa highlights] 2026-07-23, "Scheduling API or MCP server"
- [Calendly single-use scheduling link reference](https://developer.calendly.com/api-docs/9a6f5f22a5f1c-create-single-use-scheduling-link) - [FAILED, curl returned a 397-char JS shell; exa returned the portal banner only] - the tool schema above is the source instead
- [cal.com/docs/developing/guides/mcp](https://cal.com/docs/developing/guides/mcp) - [FAILED, 404 via exa] superseded by `/docs/mcp-server`

Repos (gh api, LICENSE file read by `glue-check`):
- `calcom/cal.com`, `calcom/companion`, `nspady/google-calendar-mcp`, `Zackriya-Solutions/meeting-minutes`, `Dayotter/dayotter`, `hypertrendco/dayotter` (fork), `gudlab/gudcal-core`, `anthroos/open-schedule-agent`, `hunterZh37/agentic-scheduling`, `Not-Aryan/sched`, `Fergana-Labs/scheduled`, `n8n-io/n8n`, `mediar-ai/screenpipe` - [FULL, `gh api` metadata + LICENSE + README] 13 repos
- `npm view @calcom/mcp` - [FULL, E404 2026-08-27]
- grep.app `calendar` in `ZAODEVZ/`, `googleapis.com/calendar` in `bettercallzaal/` - [FULL, 0 results each]

Community:
- [HN 43972660: FlyLoop](https://news.ycombinator.com/item?id=43972660) - [FULL, Algolia items API, comment tree] 19 pts; "How is this different than adding a calendar mcp server to something like Claude?"
- [HN 37858812: Kali](https://news.ycombinator.com/item?id=37858812) - [FULL, Algolia] 27 pts, 23 comments; prep-time-around-meetings idea
- [HN 37465321: Mavex.ai](https://news.ycombinator.com/item?id=37465321) - [FULL, Algolia] 15 pts; "skeptical of over-promising from AI tools"
- [HN 45463683: AI Secretary](https://news.ycombinator.com/item?id=45463683) - [FULL, Algolia] 4 pts
- Reddit - [FAILED] `zao-fetch-reddit.sh --selftest` 2026-08-27: token endpoint 401 (creds missing), public `.json` returns `text/html`, 0/3 redlib instances. Per doc 2282, no substitute snippets used.
- X - [FAILED] no tweet fetched; exa returned LinkedIn posts instead: [Ngiam 2026-02-13](https://www.linkedin.com/posts/jngiam_i-asked-claude-on-my-phone-what-my-week-looks-activity-7428150806664605697-_oKa) and [Jain 2026-06-23](https://www.linkedin.com/posts/lessgosushant_claude-native-mcp-connectors-is-a-cheatcode-activity-7475150987586908161-U71-) - [PARTIAL, exa highlights] practitioner sentiment only, no numbers taken from them

Blogs:
- [usecarly.com: Claude + Google Calendar 2026](https://www.usecarly.com/blog/claude-google-calendar-integration/) - [FULL, exa] 2026-06-22; the "no event triggers" claim contradicted above; vendor post, its product pitch ignored
- [DevelopersIO: Google Calendar connector in Claude Code](https://dev.classmethod.jp/en/articles/claude-code-google-calendar-connector/) - [FULL, exa] v2.1.46 date, prompt-injection countermeasures
- [Jason Pollak: AI calendar management via MCP](https://jasonpollakmarketing.com/2026/04/05/ai-calendar-management-mcp-marketing-workflow/) - [PARTIAL, exa highlights] 2026-04-05; meeting-prep prompt pattern
- [DataLatte: Claude + MCP Google Calendar booking](https://datalatte.pro/blog/claude-mcp-google-calendar-booking-automation) - [PARTIAL, exa highlights] 2026-06-13; their "94%" figure not used

Local ground truth (this repo and Mac, 2026-08-27):
- `bot/src/zoe/calendar.ts`, `events.ts:265-330`, `grill.ts:24-30, 397-400`, `brief.ts:23, 300-304, 385-407`, `scheduler.ts:63, 955-957`; git `849d90f0` (2026-06-15), `2c6108cc` (2026-07-26)
- `~/.claude/skills/meeting/SKILL.md:842-843, 858`; `~/.claude/skills/glue-first/SKILL.md` + `bin/glue-check`; `~/zao-vault/notes/glue-first-standard.md`
- `~/.zao/private/` listing (1 gcal dump, 2026-05-24); `orca automations list`; `orca automations create --help`; `zao-tracker search`
- Research docs 1117, 1253, 2096, 739, 1215, 1005 (read in full or by section as cited)
