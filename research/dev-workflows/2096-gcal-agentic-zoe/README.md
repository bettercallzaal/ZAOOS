---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-07-28
related-docs: 739, 1253
original-query: "How to use Google Calendar with agentic tooling - deeply integrate GCal with ZOE and Zaal's whole workflow (API + MCP servers, OAuth vs service account, agentic scheduling, tie to /meeting + cowork board, PII). Best architecture for ZOE to be calendar-aware and calendar-acting; smallest first build. Tier STANDARD."
tier: STANDARD
---

# 2096 - Google Calendar + agentic tooling for ZOE (calendar-aware, calendar-acting)

> **Goal:** Make ZOE aware of and able to act on Zaal's calendar, reusing what already exists - not building auth from scratch. And name the smallest first build.

## Key Decisions (recommendations first)

| Decision | Call | Why (verified) |
|----------|------|----------------|
| Read Zaal's PERSONAL calendar via the native Anthropic Google Calendar MCP | **YES** | It is already connected + proven: the `/meeting` skill uses `mcp__claude_ai_Google_Calendar__list_events`/`update_event`, and doc 739 validated a live 50-event week sweep (2026-05-24). No new key. |
| Write/book via Cal.com MCP, gated | **YES - already designed** | Doc 1253 ("Cal.com MCP + ZOE calendar wiring") already specced this: single API key (no OAuth-refresh complexity), tap-to-approve booking. Don't re-solve it. |
| OAuth, NOT a service account | **YES (a real limitation)** | Google service accounts + domain-wide delegation only work for a Workspace domain, **not a personal @gmail**. So ZOE cannot silently read Zaal's @gmail calendar via a service account - it must use OAuth user-consent (the pattern ZAO already runs for YouTube, `src/app/api/auth/youtube/`). |
| Hand-roll the Calendar API v3 directly | **NO** | The native MCP (reads) + Cal.com MCP (writes) cover it; a direct API build adds OAuth-refresh plumbing for no gain. |

**One-line take:** ZOE is *closer than it looks*. It already reads the ZAO Luma calendar into the daily brief - the gap is Zaal's PERSONAL calendar. Add that read via the already-connected MCP; keep writes on Cal.com (doc 1253); OAuth only.

## What already exists (verified in the repo)

- `bot/src/zoe/calendar.ts` - a calendar reader that fetches the ZAO **Luma** ICS feed (public, no auth) with a lightweight ICS parser + `formatTodayTomorrowEvents()`.
- `bot/src/zoe/brief.ts` (lines 23, 261, 268, 333) - the daily brief **already imports and renders** a today/tomorrow calendar section from those Luma events, degrading gracefully.
- `src/app/(auth)/calendar/page.tsx` - a calendar page in the app.
- Google OAuth 2.0 flow already built for YouTube (`src/app/api/auth/youtube/route.ts` + callback; creds in `connected_platforms`).
- The `/meeting` skill already updates a matching GCal event's description via the native MCP.

So the gap is narrow: ZOE sees ZAO events (Luma), not Zaal's own calendar.

## Findings

**Calendar API v3 (official docs, fetched 2026-07-28):** list, create/insert, update/patch, delete, **freebusy** (availability without exposing detail), and **quickAdd** (natural-language "Lunch tomorrow at noon"). Agent-relevant OAuth scopes: `calendar.events.readonly`, `calendar.events`, `calendar.freebusy`, `calendar.events.owned`. Token lasts ~1h; refresh token is durable with offline access.

**MCP server landscape (per the research fetch 2026-07-28; repo existence citable, star counts as-fetched, not re-verified here):** the most active is `taylorwilsdon/google_workspace_mcp` (MIT, ~2.9k stars, list/get/manage-event + `query_freebusy`); also `ridafkih/keeper.sh` (AGPL, ~1.2k) and `a-bonus/google-docs-mcp`. **But ZAO does not need to self-host one** - the native Anthropic GCal MCP is already connected and proven (doc 739), which is the lower-friction path.

**Agentic scheduling pattern (the reliable one):** read ground truth first (`list_events` + `freebusy`) -> propose 2-3 slots as Telegram buttons -> Zaal taps -> only then `create_event`/Cal.com booking. Never write blind; query fresh each time (calendar changes outside the agent). This mirrors doc 1253's Phase 1 (read-only brief) -> Phase 2 (gated write) -> Phase 3 (respect focus blocks).

**Security:** calendar event descriptions/locations are UNTRUSTED input (prompt-injection vector - an external invitee can embed instructions). Keep per-tool confirmation on when calendar data is in an agent's context.

**Privacy (per `.claude/rules/pii-hygiene.md`):** attendee emails are third-party PII. Pattern: raw calendar dumps go to `~/.zao/private/gcal-<date>.json` (chmod 600), synthesize in the brief, redact non-ZAO attendees, never commit attendee lists or post them to a public surface / Bonfire.

## Smallest first build (one slice, read-only, no new secrets)

**Extend ZOE's existing calendar section to include Zaal's PERSONAL today/tomorrow events alongside the Luma events.**

- Add a `getZaalTodayTomorrowEvents()` to `bot/src/zoe/calendar.ts` that calls the native `mcp__claude_ai_Google_Calendar__list_events` for a today->tomorrow window.
- In `brief.ts`, render it in the same calendar section that already exists (it already imports `formatTodayTomorrowEvents`), degrading to [] on MCP-unavailable (already handled).
- No new env var, no new secret - the claude.ai OAuth connection already exists.
- Test: mock the MCP with 2 fixture events; assert the brief renders them, redacting non-ZAO attendee emails.

That gives ZOE personal-calendar awareness (the 9:30 Iman sync, meetings) in the morning brief before any write path. Writes stay on Cal.com per doc 1253, gated.

## Also See

- [Doc 739](../739-claude-code-efficiency-native-mcps/) - native GCal MCP validated (the read path)
- [Doc 1253](../1253-calcom-mcp-zoe-calendar-wiring/) - Cal.com MCP + ZOE calendar wiring (the write path)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Build the smallest slice: personal today/tomorrow GCal events in ZOE's daily brief (read-only, native MCP) | zaal | PR | 2026-08-05 |
| Wire the gated Cal.com write path per doc 1253 (propose 3 slots -> tap -> book) | zaal | PR | 2026-08-19 |
| Confirm the claude.ai GCal OAuth connection covers ZOE's runtime (or add the YouTube-style OAuth for the bot) | zaal | Verify | 2026-08-05 |

## Sources

- Google Calendar API v3 overview + auth + events reference - [FULL] developers.google.com/calendar/api (fetched 2026-07-28)
- github.com/taylorwilsdon/google_workspace_mcp, ridafkih/keeper.sh, a-bonus/google-docs-mcp - [PARTIAL] repos exist + tool lists fetched; exact star counts as-reported, not re-verified in this pass
- Doc 739 (native GCal MCP validation) + Doc 1253 (Cal.com wiring) - [FULL] read from the repo
- bot/src/zoe/calendar.ts + brief.ts + src/app/api/auth/youtube/ + .claude/rules/pii-hygiene.md - [FULL] verified in-repo 2026-07-28
